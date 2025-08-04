const https = require('https');

const SUPABASE_URL = 'https://exlqvlbawytbglioqfbc.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4bHF2bGJhd3l0YmdsaW9xZmJjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA4MDA4OCwiZXhwIjoyMDY4NjU2MDg4fQ.8oZlR-lyaDdGZ_mvvyH2wJsJbsD0P6MT9ZkiyASqLcQ';

console.log('🔍 Testing Supabase database connection...');

const options = {
  hostname: 'exlqvlbawytbglioqfbc.supabase.co',
  path: '/rest/v1/profiles?select=user_id,full_name,email,role,is_admin&limit=5',
  method: 'GET',
  headers: {
    'apikey': SERVICE_KEY,
    'Authorization': `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json'
  }
};

const req = https.request(options, (res) => {
  console.log(`📊 Status Code: ${res.statusCode}`);
  console.log(`📋 Headers:`, res.headers);
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      console.log('✅ Response received:');
      console.log(`👥 Users found: ${result.length || 0}`);
      
      if (result.length > 0) {
        console.log('\n📋 Sample users:');
        result.forEach((user, i) => {
          console.log(`  ${i+1}. ${user.full_name || 'No name'} - ${user.email || 'No email'} - Role: ${user.role || 'none'} - Admin: ${user.is_admin ? 'Yes' : 'No'}`);
        });
      } else {
        console.log('❌ No users found in database');
      }
      
    } catch (error) {
      console.error('💥 Failed to parse response:', error);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('💥 Request failed:', error);
});

req.end();
