// ELO System Types
export interface EloRule {
  id: string;
  rule_name: string;
  rule_type: string; // Allow any string from database
  base_value: number;
  conditions: any; // Use any to match database Json type
  value_formula: string;
  multiplier?: number;
  priority?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EloRuleFormData {
  rule_name: string;
  rule_type: string; // Allow any string from database
  base_value: number;
  conditions: any; // Use any to match database Json type
  value_formula: string;
  multiplier?: number;
  priority?: number;
  is_active?: boolean;
}

export interface EloSystemInfo {
  kFactor: number;
  tournamentRewards: Record<string, number>;
  lastUpdated: Date;
}

export interface EloValidationResult {
  totalChecked: number;
  inconsistencies: number;
  details?: Array<{
    user_id: string;
    elo_points: number;
    current_rank_id: string;
    expected_rank: string;
  }>;
}
