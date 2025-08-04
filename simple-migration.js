const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = 'https://exlqvlbawytbglioqfbc.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4bHF2bGJhd3l0YmdsaW9xZmJjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA4MDA4OCwiZXhwIjoyMDY4NjU2MDg4fQ.8oZlR-lyaDdGZ_mvvyH2wJsJbsD0P6MT9ZkiyASqLcQ';

// Create admin client
const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function runMigration() {
  console.log('Starting ELO integration...');
  
  try {
    // First, let's update the rank definitions directly
    console.log('Updating rank definitions...');
    
    const rankUpdates = [
      { rank_code: 'K', elo_requirement: 1000, rank_description: 'Tân thủ - 2-4 bi khi hình dễ, chưa nắm kỹ thuật' },
      { rank_code: 'K+', elo_requirement: 1100, rank_description: 'Người chơi mới - 2-4 bi tốt hơn, hiểu luật và kỹ thuật cơ bản' },
      { rank_code: 'I', elo_requirement: 1200, rank_description: 'Novice - 3-5 bi, chưa clear chấm, điều bi hạn chế' },
      { rank_code: 'I+', elo_requirement: 1300, rank_description: 'Novice+ - 3-5 bi tiến bộ, nhắm & kê cơ chắc, học điều bi' },
      { rank_code: 'H', elo_requirement: 1400, rank_description: 'Intermediate - 5-6 bi, "rùa" 1 chấm hình thuận' },
      { rank_code: 'H+', elo_requirement: 1500, rank_description: 'Intermediate+ - 6-8 bi, clear 1 chấm hình dễ' },
      { rank_code: 'G', elo_requirement: 1600, rank_description: 'Advanced - Clear 1 chấm + 3-7 bi, điều bi hoàn thiện' },
      { rank_code: 'G+', elo_requirement: 1700, rank_description: 'Advanced+ - Clear 1 chấm + 3-7 bi, phá 2 chấm hình đẹp' },
      { rank_code: 'F', elo_requirement: 1800, rank_description: 'Expert - 60% clear 1 chấm, safety cơ bản chắc' },
      { rank_code: 'F+', elo_requirement: 1900, rank_description: 'Expert+ - 70% clear 1 chấm, điều bi 3 băng, safety hiệu quả' },
      { rank_code: 'E', elo_requirement: 2000, rank_description: 'Master - 90% clear 1 chấm, phá 2 chấm khi thuận' },
      { rank_code: 'E+', elo_requirement: 2100, rank_description: 'Elite - 90%+ clear 1 chấm, tiệm cận bán-chuyên' }
    ];
    
    for (const rank of rankUpdates) {
      const { error } = await adminClient
        .from('rank_definitions')
        .update({
          elo_requirement: rank.elo_requirement,
          rank_description: rank.rank_description
        })
        .eq('rank_code', rank.rank_code);
      
      if (error) {
        console.error(`Error updating ${rank.rank_code}:`, error);
      } else {
        console.log(`✅ Updated ${rank.rank_code} to ${rank.elo_requirement} ELO`);
      }
    }
    
    // Add game configurations
    console.log('\nAdding ELO configurations...');
    
    const configs = [
      { config_key: 'elo_system_version', config_value: '"v2.0_official"', description: 'Official ELO system version', category: 'elo' },
      { config_key: 'elo_base_rating', config_value: '1000', description: 'Starting ELO for new players', category: 'elo' },
      { config_key: 'elo_rank_gap', config_value: '100', description: 'ELO gap between ranks', category: 'elo' },
      { config_key: 'tournament_elo_champion', config_value: '80', description: 'Champion ELO reward', category: 'tournaments' },
      { config_key: 'tournament_elo_runner_up', config_value: '40', description: 'Runner-up ELO reward', category: 'tournaments' }
    ];
    
    for (const config of configs) {
      const { error } = await adminClient
        .from('game_configurations')
        .upsert(config, { onConflict: 'config_key' });
      
      if (error) {
        console.error(`Error adding config ${config.config_key}:`, error);
      } else {
        console.log(`✅ Added config: ${config.config_key}`);
      }
    }
    
    console.log('\n🎉 ELO Integration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

runMigration();
