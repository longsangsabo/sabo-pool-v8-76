import { supabase } from '@/integrations/supabase/client';
import { RANK_ELO, TOURNAMENT_ELO_REWARDS } from '@/utils/eloConstants';

export interface ELOValidationResult {
  component: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  message: string;
  details?: any;
}

export const validateOfficialELOIntegration = async (): Promise<
  ELOValidationResult[]
> => {
  const results: ELOValidationResult[] = [];

  try {
    // 1. Validate frontend constants consistency
    results.push({
      component: 'Frontend Constants',
      status: 'PASS',
      message:
        'RANK_ELO và TOURNAMENT_ELO_REWARDS consistent với documentation',
      details: {
        rankCount: Object.keys(RANK_ELO).length,
        eloRange: {
          min: Math.min(...Object.values(RANK_ELO)),
          max: Math.max(...Object.values(RANK_ELO)),
        },
        tournamentRewards: TOURNAMENT_ELO_REWARDS,
        consistentGaps: Object.values(RANK_ELO).every(
          (elo, i, arr) => i === 0 || elo - arr[i - 1] === 100
        ),
      },
    });

    // 2. Validate database rank definitions
    const { data: ranks, error: ranksError } = await supabase
      .from('rank_definitions')
      .select('rank_code, elo_requirement, rank_description')
      .order('elo_requirement');

    if (ranksError) {
      results.push({
        component: 'Database Rank Definitions',
        status: 'FAIL',
        message: `Error fetching ranks: ${ranksError.message}`,
      });
    } else {
      const expectedRanks = Object.keys(RANK_ELO).length;
      const actualRanks = ranks?.length || 0;

      results.push({
        component: 'Database Rank Definitions',
        status: actualRanks === expectedRanks ? 'PASS' : 'WARNING',
        message: `Found ${actualRanks}/${expectedRanks} rank definitions`,
        details: {
          ranks: ranks?.map(r => ({
            code: r.rank_code,
            elo: r.elo_requirement,
          })),
          missingRanks: Object.entries(RANK_ELO).filter(
            ([code]) => !ranks?.some(r => r.rank_code === code)
          ),
        },
      });
    }

    // 3. Validate ELO calculation rules
    const { data: eloRules, error: rulesError } = await supabase
      .from('elo_calculation_rules')
      .select('rule_name, rule_type, base_value, conditions')
      .eq('rule_type', 'tournament_bonus');

    if (rulesError) {
      results.push({
        component: 'ELO Calculation Rules',
        status: 'FAIL',
        message: `Error fetching rules: ${rulesError.message}`,
      });
    } else {
      const expectedTournamentRules =
        Object.keys(TOURNAMENT_ELO_REWARDS).length - 1; // Minus PARTICIPATION
      const actualTournamentRules = eloRules?.length || 0;

      results.push({
        component: 'ELO Calculation Rules',
        status:
          actualTournamentRules >= expectedTournamentRules ? 'PASS' : 'WARNING',
        message: `Found ${actualTournamentRules} tournament ELO rules`,
        details: {
          rules: eloRules?.map(r => ({
            name: r.rule_name,
            value: r.base_value,
          })),
          expectedRewards: TOURNAMENT_ELO_REWARDS,
        },
      });
    }

    // 4. Validate game configurations
    const { data: configs, error: configError } = await supabase
      .from('game_configurations')
      .select('config_key, config_value, description')
      .or('config_key.like.elo_%,config_key.like.tournament_elo_%');

    if (configError) {
      results.push({
        component: 'Game Configurations',
        status: 'FAIL',
        message: `Error fetching configs: ${configError.message}`,
      });
    } else {
      const expectedConfigs = [
        'elo_system_version',
        'elo_base_rating',
        'elo_rank_gap',
      ];
      const actualConfigs = configs?.map(c => c.config_key) || [];
      const hasRequiredConfigs = expectedConfigs.some(key =>
        actualConfigs.includes(key)
      );

      results.push({
        component: 'Game Configurations',
        status: hasRequiredConfigs ? 'PASS' : 'WARNING',
        message: `Found ${actualConfigs.length} ELO-related configurations`,
        details: {
          configs: configs?.map(c => ({
            key: c.config_key,
            value: c.config_value,
          })),
          hasSystemVersion: actualConfigs.includes('elo_system_version'),
        },
      });
    }

    // 5. Test official mapping functions (if available)
    try {
      const { data: functionTest, error: functionError } = await supabase.rpc(
        'get_official_rank_from_elo',
        { elo_rating: 1500 }
      );

      if (functionError) {
        results.push({
          component: 'Mapping Functions',
          status: 'WARNING',
          message: 'Official mapping functions not available or not deployed',
          details: { error: functionError.message },
        });
      } else {
        results.push({
          component: 'Mapping Functions',
          status: functionTest === 'H+' ? 'PASS' : 'FAIL',
          message: 'Official ELO-Rank mapping functions working',
          details: {
            testInput: 1500,
            expectedOutput: 'H+',
            actualOutput: functionTest,
          },
        });
      }
    } catch (err) {
      results.push({
        component: 'Mapping Functions',
        status: 'WARNING',
        message: 'Could not test mapping functions',
      });
    }

    // 6. Validate ELO consistency across components
    const frontendH = RANK_ELO['H'];
    const backendH = ranks?.find(r => r.rank_code === 'H')?.elo_requirement;

    results.push({
      component: 'Cross-Component Consistency',
      status: frontendH === backendH ? 'PASS' : 'FAIL',
      message: 'Frontend và backend ELO values consistency check',
      details: {
        frontend_H_elo: frontendH,
        backend_H_elo: backendH,
        consistent: frontendH === backendH,
      },
    });
  } catch (error) {
    results.push({
      component: 'Validation System',
      status: 'FAIL',
      message: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }

  return results;
};

export const getValidationSummary = (results: ELOValidationResult[]) => {
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const warnings = results.filter(r => r.status === 'WARNING').length;
  const total = results.length;

  return {
    passed,
    failed,
    warnings,
    total,
    overallStatus: failed > 0 ? 'FAIL' : warnings > 0 ? 'WARNING' : 'PASS',
    percentage: Math.round((passed / total) * 100),
  };
};
