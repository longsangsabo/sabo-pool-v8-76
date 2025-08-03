import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🏥 Starting database health monitoring...');

    const healthChecks = {
      database_connection: false,
      table_counts: {},
      performance_metrics: {},
      replication_status: 'unknown',
      storage_usage: {},
      errors_detected: [],
      warnings: [],
      recommendations: [],
    };

    let overallHealth = 'healthy';

    // 1. Test database connection
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);

      healthChecks.database_connection = !error;
      if (error) {
        healthChecks.errors_detected.push(
          `Database connection error: ${error.message}`
        );
        overallHealth = 'critical';
      }
    } catch (error) {
      healthChecks.database_connection = false;
      healthChecks.errors_detected.push(`Database connection failed: ${error}`);
      overallHealth = 'critical';
    }

    // 2. Check table counts and integrity
    const tablesToCheck = [
      'profiles',
      'tournaments',
      'tournament_registrations',
      'matches',
      'match_results',
      'challenges',
      'notifications',
      'player_rankings',
      'system_logs',
    ];

    for (const table of tablesToCheck) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (error) {
          healthChecks.errors_detected.push(
            `Error checking table ${table}: ${error.message}`
          );
          overallHealth = 'warning';
        } else {
          healthChecks.table_counts[table] = count || 0;

          // Check for anomalies
          if (table === 'profiles' && (count || 0) === 0) {
            healthChecks.warnings.push(
              'No user profiles found - system may be empty'
            );
            overallHealth = 'warning';
          }

          if (table === 'system_logs' && (count || 0) > 100000) {
            healthChecks.warnings.push(
              'System logs table is getting large - consider archiving'
            );
            healthChecks.recommendations.push(
              'Archive old system logs older than 90 days'
            );
          }
        }
      } catch (error) {
        healthChecks.errors_detected.push(
          `Failed to check table ${table}: ${error}`
        );
        overallHealth = 'warning';
      }
    }

    // 3. Check for recent errors in system logs
    try {
      const { data: recentErrors, error } = await supabase
        .from('system_logs')
        .select('log_type, message, created_at')
        .contains('metadata', { error: true })
        .gte(
          'created_at',
          new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        )
        .order('created_at', { ascending: false })
        .limit(10);

      if (!error && recentErrors && recentErrors.length > 0) {
        healthChecks.warnings.push(
          `${recentErrors.length} errors detected in last 24 hours`
        );
        if (recentErrors.length > 5) {
          overallHealth = 'warning';
        }
      }
    } catch (error) {
      healthChecks.warnings.push(`Could not check recent errors: ${error}`);
    }

    // 4. Check notification system health
    try {
      const { data: unsentNotifications, error } = await supabase
        .from('notification_logs')
        .select('id')
        .eq('status', 'pending')
        .lt('scheduled_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Older than 1 hour
        .limit(100);

      if (!error && unsentNotifications && unsentNotifications.length > 0) {
        healthChecks.warnings.push(
          `${unsentNotifications.length} pending notifications older than 1 hour`
        );
        if (unsentNotifications.length > 50) {
          overallHealth = 'warning';
          healthChecks.recommendations.push(
            'Check notification delivery system'
          );
        }
      }
    } catch (error) {
      healthChecks.warnings.push(
        `Could not check notification status: ${error}`
      );
    }

    // 5. Check tournament system health
    try {
      const { data: stuckTournaments, error } = await supabase
        .from('tournaments')
        .select('id, name, status, tournament_start')
        .eq('status', 'ongoing')
        .lt('tournament_end', new Date().toISOString());

      if (!error && stuckTournaments && stuckTournaments.length > 0) {
        healthChecks.warnings.push(
          `${stuckTournaments.length} tournaments still marked as ongoing past end date`
        );
        healthChecks.recommendations.push(
          'Review and close completed tournaments'
        );
        overallHealth = 'warning';
      }
    } catch (error) {
      healthChecks.warnings.push(`Could not check tournament status: ${error}`);
    }

    // 6. Check for orphaned records
    try {
      const { data: orphanedRegistrations, error } = await supabase
        .from('tournament_registrations')
        .select('id')
        .is('user_id', null)
        .limit(10);

      if (!error && orphanedRegistrations && orphanedRegistrations.length > 0) {
        healthChecks.warnings.push(
          `${orphanedRegistrations.length} orphaned tournament registrations found`
        );
        healthChecks.recommendations.push(
          'Clean up orphaned registration records'
        );
      }
    } catch (error) {
      healthChecks.warnings.push(
        `Could not check for orphaned records: ${error}`
      );
    }

    // 7. Performance metrics (simplified)
    const performanceStart = Date.now();
    try {
      await supabase.from('profiles').select('id').limit(1);

      healthChecks.performance_metrics.query_response_time =
        Date.now() - performanceStart;

      if (healthChecks.performance_metrics.query_response_time > 5000) {
        healthChecks.warnings.push('Slow database response time detected');
        overallHealth = 'warning';
      }
    } catch (error) {
      healthChecks.errors_detected.push(`Performance test failed: ${error}`);
    }

    // 8. Generate recommendations based on findings
    if (healthChecks.table_counts.notifications > 10000) {
      healthChecks.recommendations.push(
        'Consider implementing notification archiving'
      );
    }

    if (healthChecks.table_counts.system_logs > 50000) {
      healthChecks.recommendations.push(
        'Archive old system logs to improve performance'
      );
    }

    // Send alerts to admins if health is not good
    if (overallHealth !== 'healthy') {
      const { data: admins, error: adminError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('is_admin', true);

      if (!adminError && admins) {
        const alertNotifications = admins.map(admin => ({
          user_id: admin.user_id,
          type: 'system_health_alert',
          title: `🚨 Cảnh báo sức khỏe hệ thống - ${overallHealth.toUpperCase()}`,
          message: `Hệ thống đang ở trạng thái: ${overallHealth}. ${healthChecks.errors_detected.length} lỗi, ${healthChecks.warnings.length} cảnh báo được phát hiện.`,
          priority: overallHealth === 'critical' ? 'urgent' : 'high',
          action_url: '/admin/automation',
          metadata: {
            health_status: overallHealth,
            errors_count: healthChecks.errors_detected.length,
            warnings_count: healthChecks.warnings.length,
            recommendations_count: healthChecks.recommendations.length,
            check_timestamp: new Date().toISOString(),
          },
        }));

        await supabase.from('notifications').insert(alertNotifications);
      }
    }

    // Log the health check results
    await supabase.from('system_logs').insert({
      log_type: 'database_health_monitoring',
      message: `Database health check completed - Status: ${overallHealth}`,
      metadata: {
        health_status: overallHealth,
        health_checks: healthChecks,
        execution_time: new Date().toISOString(),
        check_duration_ms: Date.now() - performanceStart,
      },
    });

    const result = {
      success: true,
      health_status: overallHealth,
      database_connection: healthChecks.database_connection,
      errors_count: healthChecks.errors_detected.length,
      warnings_count: healthChecks.warnings.length,
      recommendations_count: healthChecks.recommendations.length,
      table_counts: healthChecks.table_counts,
      performance_metrics: healthChecks.performance_metrics,
      details: healthChecks,
      message: `Health check completed - Status: ${overallHealth}`,
    };

    console.log('🎉 Database health monitoring completed:', result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error('💥 Error in database health monitoring:', error);

    return new Response(
      JSON.stringify({
        error: error.message,
        success: false,
        health_status: 'critical',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
};

serve(handler);
