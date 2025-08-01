import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface AssignMatchRequest {
  action: 'assign_match' | 'auto_assign_all' | 'release_table';
  match_id?: string;
  table_id?: string;
  tournament_id?: string;
  club_id?: string;
}

serve(async req => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const {
      action,
      match_id,
      table_id,
      tournament_id,
      club_id,
    }: AssignMatchRequest = await req.json();

    console.log('Table assignment request:', {
      action,
      match_id,
      table_id,
      tournament_id,
      club_id,
    });

    switch (action) {
      case 'assign_match':
        return await assignMatchToTable(supabaseClient, match_id!, table_id!);

      case 'auto_assign_all':
        return await autoAssignAllMatches(
          supabaseClient,
          tournament_id!,
          club_id!
        );

      case 'release_table':
        return await releaseTable(supabaseClient, table_id!);

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('Table assignment error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function assignMatchToTable(
  supabase: any,
  matchId: string,
  tableId: string
) {
  console.log('Assigning match to table:', { matchId, tableId });

  try {
    // Check if table is available
    const { data: table, error: tableCheckError } = await supabase
      .from('club_tables')
      .select('status, current_match_id')
      .eq('id', tableId)
      .single();

    if (tableCheckError) {
      throw new Error(`Table not found: ${tableCheckError.message}`);
    }

    if (table.status !== 'available') {
      throw new Error('Table is not available');
    }

    // Update match with table assignment
    const { error: matchError } = await supabase
      .from('tournament_matches')
      .update({
        assigned_table_id: tableId,
        assigned_table_number: null, // Will be updated by trigger
        table_assigned_at: new Date().toISOString(),
        status: 'ready',
      })
      .eq('id', matchId);

    if (matchError) {
      throw new Error(`Failed to update match: ${matchError.message}`);
    }

    // Update table status
    const { error: tableError } = await supabase
      .from('club_tables')
      .update({
        status: 'occupied',
        current_match_id: matchId,
        last_used_at: new Date().toISOString(),
      })
      .eq('id', tableId);

    if (tableError) {
      throw new Error(`Failed to update table: ${tableError.message}`);
    }

    console.log('Match assigned successfully');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Match assigned to table successfully',
        match_id: matchId,
        table_id: tableId,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Assignment error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}

async function autoAssignAllMatches(
  supabase: any,
  tournamentId: string,
  clubId: string
) {
  console.log('Auto-assigning all matches using database function:', {
    tournamentId,
    clubId,
  });

  try {
    // Use the database function for consistent logic
    const { data: assignmentResult, error: assignmentError } =
      await supabase.rpc('auto_assign_tournament_tables', {
        p_tournament_id: tournamentId,
      });

    if (assignmentError) {
      console.error('❌ Database function error:', assignmentError);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Lỗi khi gán bàn: ${assignmentError.message}`,
          assignments_made: 0,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (assignmentResult?.error) {
      console.error(
        '❌ Assignment error from database:',
        assignmentResult.error
      );
      return new Response(
        JSON.stringify({
          success: false,
          error: assignmentResult.error,
          assignments_made: 0,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`✅ Database function completed:`, assignmentResult);

    const assignmentCount = assignmentResult?.assignments_made || 0;

    return new Response(
      JSON.stringify({
        success: assignmentResult?.success || false,
        assignments_made: assignmentCount,
        message:
          assignmentResult?.message || `Đã gán ${assignmentCount} trận đấu`,
        tournament_id: assignmentResult?.tournament_id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Auto-assignment error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: `Lỗi hệ thống: ${error.message}`,
        assignments_made: 0,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}

async function releaseTable(supabase: any, tableId: string) {
  console.log('Releasing table:', tableId);

  try {
    // Update table status
    const { error: tableError } = await supabase
      .from('club_tables')
      .update({
        status: 'available',
        current_match_id: null,
        last_used_at: new Date().toISOString(),
      })
      .eq('id', tableId);

    if (tableError) {
      throw new Error(`Failed to release table: ${tableError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Table released successfully',
        table_id: tableId,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Release error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}
