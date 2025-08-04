import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Textarea } from '@/shared/components/ui/textarea';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Badge } from '@/shared/components/ui/badge';
import { Separator } from '@/shared/components/ui/separator';
import {
  Database,
  Play,
  Copy,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SQLScript {
  name: string;
  description: string;
  sql: string;
  category: 'table' | 'data' | 'policy';
}

const SQL_SCRIPTS: SQLScript[] = [
  {
    name: 'Create ELO Rules Table',
    description: 'Creates the elo_rules table with default K-factors and tournament bonuses',
    category: 'table',
    sql: `-- Create ELO Rules table for Game Configuration
CREATE TABLE IF NOT EXISTS elo_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('k_factor', 'tournament_bonus', 'rank_adjustment', 'decay_factor')),
  conditions JSONB DEFAULT '{}',
  value_formula TEXT DEFAULT 'base_value',
  base_value INTEGER DEFAULT 0,
  multiplier DECIMAL(10,2) DEFAULT 1.0,
  priority INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_elo_rules_type ON elo_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_elo_rules_active ON elo_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_elo_rules_priority ON elo_rules(priority);

-- Insert default ELO rules
INSERT INTO elo_rules (rule_name, rule_type, base_value, multiplier, priority, is_active) VALUES
('Standard K-Factor', 'k_factor', 32, 1.0, 1, true),
('Beginner K-Factor', 'k_factor', 40, 1.0, 2, true),
('Expert K-Factor', 'k_factor', 24, 1.0, 3, true),
('Tournament Win Bonus', 'tournament_bonus', 50, 1.5, 1, true),
('Tournament Runner-up Bonus', 'tournament_bonus', 25, 1.2, 2, true)
ON CONFLICT (id) DO NOTHING;`
  },
  {
    name: 'Create SPA Reward Milestones Table',
    description: 'Creates the spa_reward_milestones table with achievement-based rewards',
    category: 'table',
    sql: `-- Create SPA Reward Milestones table for Game Configuration
CREATE TABLE IF NOT EXISTS spa_reward_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_name TEXT NOT NULL,
  milestone_type TEXT NOT NULL CHECK (milestone_type IN ('matches_won', 'win_streak', 'elo_gained', 'tournaments_won', 'rank_achieved', 'consecutive_days')),
  requirement_value INTEGER NOT NULL,
  spa_reward INTEGER NOT NULL,
  bonus_conditions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  is_repeatable BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_spa_milestones_type ON spa_reward_milestones(milestone_type);
CREATE INDEX IF NOT EXISTS idx_spa_milestones_active ON spa_reward_milestones(is_active);
CREATE INDEX IF NOT EXISTS idx_spa_milestones_repeatable ON spa_reward_milestones(is_repeatable);

-- Insert default SPA reward milestones
INSERT INTO spa_reward_milestones (milestone_name, milestone_type, requirement_value, spa_reward, is_active, is_repeatable) VALUES
('First Victory', 'matches_won', 1, 100, true, false),
('5 Match Winner', 'matches_won', 5, 250, true, false),
('10 Match Winner', 'matches_won', 10, 500, true, false),
('Win Streak 3', 'win_streak', 3, 150, true, true),
('Win Streak 5', 'win_streak', 5, 300, true, true),
('Win Streak 10', 'win_streak', 10, 750, true, true),
('ELO Climber +100', 'elo_gained', 100, 200, true, true),
('ELO Climber +250', 'elo_gained', 250, 500, true, true),
('Tournament Champion', 'tournaments_won', 1, 1000, true, true),
('Daily Player', 'consecutive_days', 7, 350, true, true)
ON CONFLICT (id) DO NOTHING;`
  },
  {
    name: 'Create Tournament Prize Templates Table',
    description: 'Creates the tournament_prize_templates table with prize distribution templates',
    category: 'table',
    sql: `-- Create Tournament Prize Templates table for Game Configuration
CREATE TABLE IF NOT EXISTS tournament_prize_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT NOT NULL,
  tournament_type TEXT NOT NULL CHECK (tournament_type IN ('single_elimination', 'double_elimination', 'round_robin', 'swiss')),
  participant_range_min INTEGER DEFAULT 8,
  participant_range_max INTEGER DEFAULT 64,
  prize_structure JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tournament_templates_type ON tournament_prize_templates(tournament_type);
CREATE INDEX IF NOT EXISTS idx_tournament_templates_active ON tournament_prize_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_tournament_templates_default ON tournament_prize_templates(is_default);

-- Insert default tournament prize templates
INSERT INTO tournament_prize_templates (template_name, tournament_type, participant_range_min, participant_range_max, prize_structure, is_active, is_default) VALUES
('Standard 8-Player', 'single_elimination', 8, 8, '[
  {"position": 1, "position_name": "Champion", "cash_percentage": 50, "elo_points": 100, "spa_points": 500},
  {"position": 2, "position_name": "Runner-up", "cash_percentage": 30, "elo_points": 75, "spa_points": 300},
  {"position": 3, "position_name": "3rd Place", "cash_percentage": 20, "elo_points": 50, "spa_points": 200}
]', true, true),

('Standard 16-Player', 'single_elimination', 16, 16, '[
  {"position": 1, "position_name": "Champion", "cash_percentage": 40, "elo_points": 150, "spa_points": 750},
  {"position": 2, "position_name": "Runner-up", "cash_percentage": 25, "elo_points": 100, "spa_points": 500},
  {"position": 3, "position_name": "3rd Place", "cash_percentage": 15, "elo_points": 75, "spa_points": 350},
  {"position": 4, "position_name": "4th Place", "cash_percentage": 10, "elo_points": 50, "spa_points": 250},
  {"position": 5, "position_name": "5th-8th Place", "cash_percentage": 10, "elo_points": 25, "spa_points": 150}
]', true, true)
ON CONFLICT (id) DO NOTHING;`
  }
];

export const DatabaseMigrationRunner: React.FC = () => {
  const [selectedScript, setSelectedScript] = useState<SQLScript | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [customSQL, setCustomSQL] = useState('');
  const [results, setResults] = useState<any[]>([]);

  const executeSQL = async (sql: string, scriptName?: string) => {
    try {
      setIsExecuting(true);
      
      // Split SQL into individual statements and execute them
      const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
      const executionResults = [];

      for (const statement of statements) {
        const trimmedStatement = statement.trim();
        if (trimmedStatement) {
          try {
            const { data, error } = await supabase.rpc('exec_sql', {
              sql_statement: trimmedStatement
            });

            if (error) {
              // If exec_sql function doesn't exist, try direct execution
              throw error;
            }

            executionResults.push({
              statement: trimmedStatement,
              success: true,
              data: data,
              timestamp: new Date().toISOString()
            });
          } catch (error) {
            executionResults.push({
              statement: trimmedStatement,
              success: false,
              error: error.message,
              timestamp: new Date().toISOString()
            });
          }
        }
      }

      setResults(prev => [
        {
          scriptName: scriptName || 'Custom SQL',
          results: executionResults,
          timestamp: new Date().toISOString()
        },
        ...prev
      ]);

      const successCount = executionResults.filter(r => r.success).length;
      const totalCount = executionResults.length;

      if (successCount === totalCount) {
        toast.success(`Successfully executed ${totalCount} SQL statements`);
      } else {
        toast.error(`Executed ${successCount}/${totalCount} statements successfully`);
      }

    } catch (error) {
      console.error('Error executing SQL:', error);
      toast.error('Failed to execute SQL. You may need to run these migrations directly in Supabase dashboard.');
    } finally {
      setIsExecuting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('SQL copied to clipboard');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Migration Runner
          </CardTitle>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              These migrations create the required database tables for Game Configuration functionality.
              Run these scripts in your Supabase dashboard if direct execution fails.
            </AlertDescription>
          </Alert>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Predefined Scripts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {SQL_SCRIPTS.map((script) => (
              <Card key={script.name} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{script.name}</h4>
                      <Badge variant="outline">
                        {script.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {script.description}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => executeSQL(script.sql, script.name)}
                        disabled={isExecuting}
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Execute
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(script.sql)}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Separator />

          {/* Custom SQL Executor */}
          <div className="space-y-4">
            <h4 className="font-medium">Custom SQL Executor</h4>
            <Textarea
              placeholder="Enter custom SQL statements here..."
              value={customSQL}
              onChange={(e) => setCustomSQL(e.target.value)}
              className="min-h-[120px] font-mono text-sm"
            />
            <div className="flex gap-2">
              <Button
                onClick={() => executeSQL(customSQL)}
                disabled={!customSQL.trim() || isExecuting}
              >
                <Play className="h-4 w-4 mr-2" />
                Execute Custom SQL
              </Button>
              <Button
                variant="outline"
                onClick={() => setCustomSQL('')}
              >
                Clear
              </Button>
            </div>
          </div>

          {/* Execution Results */}
          {results.length > 0 && (
            <div className="space-y-4">
              <Separator />
              <h4 className="font-medium">Execution Results</h4>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {results.map((result, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h5 className="font-medium">{result.scriptName}</h5>
                          <span className="text-xs text-muted-foreground">
                            {new Date(result.timestamp).toLocaleString()}
                          </span>
                        </div>
                        {result.results.map((stmt: any, stmtIndex: number) => (
                          <div key={stmtIndex} className="flex items-start gap-2">
                            {stmt.success ? (
                              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                            )}
                            <div className="flex-1 text-sm">
                              <code className="text-xs bg-muted p-1 rounded">
                                {stmt.statement.substring(0, 100)}...
                              </code>
                              {stmt.error && (
                                <p className="text-red-500 text-xs mt-1">{stmt.error}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
