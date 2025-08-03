import 'https://deno.land/x/xhr@0.1.0/mod.ts';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface ScheduledCleanupResult {
  bucket_name: string;
  enabled: boolean;
  files_scanned: number;
  files_deleted: number;
  space_freed: number;
  errors: string[];
  execution_time_ms: number;
}

serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { force = false } = await req.json();
    const startTime = Date.now();

    console.log(`Scheduled file cleanup started: force=${force}`);

    // Get cleanup configuration for all buckets
    const { data: configs, error: configError } = await supabase
      .from('file_cleanup_config')
      .select('*')
      .eq('enabled', true);

    if (configError) {
      throw new Error(`Failed to get cleanup config: ${configError.message}`);
    }

    const results: ScheduledCleanupResult[] = [];
    let totalFilesDeleted = 0;
    let totalSpaceFreed = 0;

    for (const config of configs || []) {
      const bucketStartTime = Date.now();
      console.log(`Processing bucket: ${config.bucket_name}`);

      try {
        // Check if cleanup is due for this bucket
        const shouldCleanup = force || (await isCleanupDue(config));

        if (!shouldCleanup) {
          console.log(`Skipping ${config.bucket_name} - cleanup not due`);
          continue;
        }

        // Call the file-cleanup function for this specific bucket
        const cleanupResult = await supabase.functions.invoke('file-cleanup', {
          body: {
            action: 'cleanup',
            dry_run: false,
            bucket_name: config.bucket_name,
          },
        });

        if (cleanupResult.error) {
          throw new Error(
            `Cleanup failed for ${config.bucket_name}: ${cleanupResult.error.message}`
          );
        }

        const stats = cleanupResult.data?.stats || {};

        const result: ScheduledCleanupResult = {
          bucket_name: config.bucket_name,
          enabled: config.enabled,
          files_scanned: stats.total_files_scanned || 0,
          files_deleted: stats.orphaned_files_deleted || 0,
          space_freed: stats.total_space_freed || 0,
          errors: stats.errors || [],
          execution_time_ms: Date.now() - bucketStartTime,
        };

        results.push(result);
        totalFilesDeleted += result.files_deleted;
        totalSpaceFreed += result.space_freed;

        // Update last cleanup time
        await updateLastCleanupTime(supabase, config.bucket_name);

        console.log(
          `Completed ${config.bucket_name}: ${result.files_deleted} files deleted, ${formatBytes(result.space_freed)} freed`
        );
      } catch (error) {
        console.error(`Error processing bucket ${config.bucket_name}:`, error);

        results.push({
          bucket_name: config.bucket_name,
          enabled: config.enabled,
          files_scanned: 0,
          files_deleted: 0,
          space_freed: 0,
          errors: [error.message],
          execution_time_ms: Date.now() - bucketStartTime,
        });
      }
    }

    const totalExecutionTime = Date.now() - startTime;

    // Log overall cleanup results
    await logScheduledCleanupResults(supabase, results, totalExecutionTime);

    const response = {
      success: true,
      message: `Scheduled cleanup completed. Processed ${results.length} buckets, deleted ${totalFilesDeleted} files, freed ${formatBytes(totalSpaceFreed)}.`,
      summary: {
        buckets_processed: results.length,
        total_files_deleted: totalFilesDeleted,
        total_space_freed: totalSpaceFreed,
        total_execution_time_ms: totalExecutionTime,
      },
      bucket_results: results,
    };

    console.log('Scheduled cleanup completed:', response.summary);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in scheduled file cleanup:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function isCleanupDue(config: any): Promise<boolean> {
  if (!config.auto_cleanup_enabled) {
    console.log(`Auto cleanup disabled for ${config.bucket_name}`);
    return false;
  }

  // Simple check: cleanup if last cleanup was more than 7 days ago
  if (!config.last_cleanup_at) {
    console.log(`No previous cleanup for ${config.bucket_name} - cleanup due`);
    return true;
  }

  const lastCleanup = new Date(config.last_cleanup_at);
  const daysSinceLastCleanup =
    (Date.now() - lastCleanup.getTime()) / (1000 * 60 * 60 * 24);

  const isDue = daysSinceLastCleanup >= 7; // Weekly cleanup
  console.log(
    `${config.bucket_name}: ${daysSinceLastCleanup.toFixed(1)} days since last cleanup, due: ${isDue}`
  );

  return isDue;
}

async function updateLastCleanupTime(supabase: any, bucketName: string) {
  try {
    await supabase
      .from('file_cleanup_config')
      .update({
        last_cleanup_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('bucket_name', bucketName);
  } catch (error) {
    console.error(`Error updating last cleanup time for ${bucketName}:`, error);
  }
}

async function logScheduledCleanupResults(
  supabase: any,
  results: ScheduledCleanupResult[],
  executionTime: number
) {
  try {
    const totalFilesDeleted = results.reduce(
      (sum, r) => sum + r.files_deleted,
      0
    );
    const totalSpaceFreed = results.reduce((sum, r) => sum + r.space_freed, 0);
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);

    await supabase.from('system_logs').insert({
      log_type: 'scheduled_file_cleanup',
      message: `Scheduled cleanup completed: ${totalFilesDeleted} files deleted, ${formatBytes(totalSpaceFreed)} freed`,
      metadata: {
        buckets_processed: results.length,
        total_files_deleted: totalFilesDeleted,
        total_space_freed: totalSpaceFreed,
        total_errors: totalErrors,
        execution_time_ms: executionTime,
        bucket_results: results,
      },
      severity: totalErrors > 0 ? 'warning' : 'info',
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error logging scheduled cleanup results:', error);
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
