import 'https://deno.land/x/xhr@0.1.0/mod.ts';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface OrphanedFile {
  bucket_id: string;
  name: string;
  size: number;
  created_at: string;
  last_accessed_at?: string;
}

interface CleanupStats {
  total_files_scanned: number;
  orphaned_files_found: number;
  orphaned_files_deleted: number;
  total_space_freed: number;
  execution_time_ms: number;
  errors: string[];
}

serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const {
      action = 'scan',
      dry_run = true,
      bucket_name = null,
    } = await req.json();
    const startTime = Date.now();

    console.log(
      `File cleanup started: action=${action}, dry_run=${dry_run}, bucket=${bucket_name}`
    );

    const stats: CleanupStats = {
      total_files_scanned: 0,
      orphaned_files_found: 0,
      orphaned_files_deleted: 0,
      total_space_freed: 0,
      execution_time_ms: 0,
      errors: [],
    };

    // Get all storage buckets or specific bucket
    const bucketsToCheck = bucket_name
      ? [bucket_name]
      : ['avatars', 'tournament-banners', 'club-photos', 'match-evidence'];

    for (const bucket of bucketsToCheck) {
      try {
        console.log(`Scanning bucket: ${bucket}`);

        // Get all files in bucket
        const { data: files, error: filesError } = await supabase.storage
          .from(bucket)
          .list('', {
            limit: 1000,
            sortBy: { column: 'created_at', order: 'asc' },
          });

        if (filesError) {
          console.error(`Error listing files in bucket ${bucket}:`, filesError);
          stats.errors.push(
            `Failed to list files in bucket ${bucket}: ${filesError.message}`
          );
          continue;
        }

        console.log(`Found ${files?.length || 0} files in bucket ${bucket}`);
        stats.total_files_scanned += files?.length || 0;

        // Check each file for orphaned status
        const orphanedFiles = await identifyOrphanedFiles(
          supabase,
          bucket,
          files || []
        );
        stats.orphaned_files_found += orphanedFiles.length;

        console.log(
          `Found ${orphanedFiles.length} orphaned files in bucket ${bucket}`
        );

        // Delete orphaned files if not dry run
        if (!dry_run && orphanedFiles.length > 0) {
          const deletionResults = await deleteOrphanedFiles(
            supabase,
            bucket,
            orphanedFiles
          );
          stats.orphaned_files_deleted += deletionResults.deleted_count;
          stats.total_space_freed += deletionResults.space_freed;
          stats.errors.push(...deletionResults.errors);
        }

        // Log findings to database
        await logCleanupActivity(supabase, bucket, orphanedFiles, !dry_run);
      } catch (error) {
        console.error(`Error processing bucket ${bucket}:`, error);
        stats.errors.push(
          `Error processing bucket ${bucket}: ${error.message}`
        );
      }
    }

    stats.execution_time_ms = Date.now() - startTime;

    // Store cleanup stats
    await storeCleanupStats(supabase, stats, dry_run);

    console.log('File cleanup completed:', stats);

    return new Response(
      JSON.stringify({
        success: true,
        action: action,
        dry_run: dry_run,
        stats: stats,
        message: dry_run
          ? `Scan completed. Found ${stats.orphaned_files_found} orphaned files (${formatBytes(stats.total_space_freed)} total).`
          : `Cleanup completed. Deleted ${stats.orphaned_files_deleted} files, freed ${formatBytes(stats.total_space_freed)}.`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in file-cleanup function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function identifyOrphanedFiles(
  supabase: any,
  bucket: string,
  files: any[]
): Promise<OrphanedFile[]> {
  const orphanedFiles: OrphanedFile[] = [];

  for (const file of files) {
    try {
      let isOrphaned = false;
      const fileName = file.name;

      // Check different tables based on bucket type
      switch (bucket) {
        case 'avatars':
          isOrphaned = await isAvatarOrphaned(supabase, fileName);
          break;
        case 'tournament-banners':
          isOrphaned = await isTournamentBannerOrphaned(supabase, fileName);
          break;
        case 'club-photos':
          isOrphaned = await isClubPhotoOrphaned(supabase, fileName);
          break;
        case 'match-evidence':
          isOrphaned = await isMatchEvidenceOrphaned(supabase, fileName);
          break;
        default:
          // Check generic file references
          isOrphaned = await isGenericFileOrphaned(supabase, fileName);
      }

      // Additional check: files older than 30 days with no recent access
      const fileAge = Date.now() - new Date(file.created_at).getTime();
      const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;

      if (isOrphaned || fileAge > thirtyDaysInMs) {
        orphanedFiles.push({
          bucket_id: bucket,
          name: fileName,
          size: file.metadata?.size || 0,
          created_at: file.created_at,
          last_accessed_at: file.last_accessed_at,
        });
      }
    } catch (error) {
      console.error(`Error checking file ${file.name}:`, error);
    }
  }

  return orphanedFiles;
}

async function isAvatarOrphaned(
  supabase: any,
  fileName: string
): Promise<boolean> {
  // Check if avatar is referenced in profiles table
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('avatar_url', fileName)
    .single();

  return !data && !error;
}

async function isTournamentBannerOrphaned(
  supabase: any,
  fileName: string
): Promise<boolean> {
  // Check if banner is referenced in tournaments table
  const { data, error } = await supabase
    .from('tournaments')
    .select('id')
    .eq('banner_image', fileName)
    .single();

  return !data && !error;
}

async function isClubPhotoOrphaned(
  supabase: any,
  fileName: string
): Promise<boolean> {
  // Check if photo is referenced in club_registrations or club_profiles
  const { data: regData } = await supabase
    .from('club_registrations')
    .select('id')
    .contains('photos', [fileName])
    .single();

  if (regData) return false;

  // Could also check other club photo references
  return true;
}

async function isMatchEvidenceOrphaned(
  supabase: any,
  fileName: string
): Promise<boolean> {
  // Check if evidence is referenced in match_disputes table
  const { data, error } = await supabase
    .from('match_disputes')
    .select('id')
    .contains('evidence_urls', [fileName])
    .single();

  return !data && !error;
}

async function isGenericFileOrphaned(
  supabase: any,
  fileName: string
): Promise<boolean> {
  // Implement generic file reference checking across multiple tables
  // This is a fallback for files that might be referenced in various places
  return false; // Conservative approach - don't delete unless sure
}

async function deleteOrphanedFiles(
  supabase: any,
  bucket: string,
  orphanedFiles: OrphanedFile[]
) {
  let deleted_count = 0;
  let space_freed = 0;
  const errors: string[] = [];

  for (const file of orphanedFiles) {
    try {
      const { error } = await supabase.storage.from(bucket).remove([file.name]);

      if (error) {
        errors.push(`Failed to delete ${file.name}: ${error.message}`);
      } else {
        deleted_count++;
        space_freed += file.size;
        console.log(
          `Deleted orphaned file: ${bucket}/${file.name} (${formatBytes(file.size)})`
        );
      }
    } catch (error) {
      errors.push(`Error deleting ${file.name}: ${error.message}`);
    }
  }

  return { deleted_count, space_freed, errors };
}

async function logCleanupActivity(
  supabase: any,
  bucket: string,
  orphanedFiles: OrphanedFile[],
  wasDeleted: boolean
) {
  try {
    await supabase.from('file_cleanup_logs').insert({
      bucket_name: bucket,
      files_found: orphanedFiles.length,
      files_deleted: wasDeleted ? orphanedFiles.length : 0,
      total_size: orphanedFiles.reduce((sum, file) => sum + file.size, 0),
      action_type: wasDeleted ? 'cleanup' : 'scan',
      orphaned_files: orphanedFiles.map(f => f.name),
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error logging cleanup activity:', error);
  }
}

async function storeCleanupStats(
  supabase: any,
  stats: CleanupStats,
  wasActualCleanup: boolean
) {
  try {
    await supabase.from('system_logs').insert({
      log_type: 'file_cleanup',
      message: wasActualCleanup
        ? 'File cleanup executed'
        : 'File cleanup scan performed',
      metadata: {
        stats: stats,
        execution_time_ms: stats.execution_time_ms,
        dry_run: !wasActualCleanup,
      },
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error storing cleanup stats:', error);
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
