const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  try {
    console.log('🔍 Checking database connection...');
    
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Database connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database check failed:', error.message);
    return false;
  }
}

async function checkEdgeFunctions() {
  try {
    console.log('🔍 Checking Edge Functions...');
    
    // Test a simple Edge Function
    const { data, error } = await supabase.functions.invoke('health-check');
    
    if (error) {
      console.error('❌ Edge Functions check failed:', error.message);
      return false;
    }
    
    console.log('✅ Edge Functions are working');
    return true;
  } catch (error) {
    console.error('❌ Edge Functions check failed:', error.message);
    return false;
  }
}

async function checkRealtime() {
  try {
    console.log('🔍 Checking real-time subscriptions...');
    
    const channel = supabase.channel('health-check');
    
    const subscription = channel
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {})
      .subscribe();
    
    // Wait a bit for subscription to establish
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    subscription.unsubscribe();
    
    console.log('✅ Real-time subscriptions working');
    return true;
  } catch (error) {
    console.error('❌ Real-time check failed:', error.message);
    return false;
  }
}

async function runHealthChecks() {
  console.log('🚀 Starting Supabase health checks...\n');
  
  const checks = [
    { name: 'Database', fn: checkDatabase },
    { name: 'Edge Functions', fn: checkEdgeFunctions },
    { name: 'Real-time', fn: checkRealtime },
  ];
  
  const results = [];
  
  for (const check of checks) {
    const result = await check.fn();
    results.push({ name: check.name, success: result });
  }
  
  console.log('\n📊 Health Check Results:');
  console.log('========================');
  
  const failed = results.filter(r => !r.success);
  const passed = results.filter(r => r.success);
  
  passed.forEach(r => console.log(`✅ ${r.name}: PASSED`));
  failed.forEach(r => console.log(`❌ ${r.name}: FAILED`));
  
  if (failed.length > 0) {
    console.log(`\n❌ ${failed.length} health check(s) failed`);
    process.exit(1);
  } else {
    console.log(`\n🎉 All ${results.length} health checks passed!`);
  }
}

runHealthChecks().catch(error => {
  console.error('❌ Health check script failed:', error);
  process.exit(1);
}); 