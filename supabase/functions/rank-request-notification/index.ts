import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface RankRequestData {
  user_id: string;
  club_id: string;
  requested_rank: string;
  reason: string;
}

interface RankUpdateData {
  rank_request_id: string;
  action: 'approved' | 'rejected' | 'on_site_test' | 'banned';
  rejection_reason?: string;
  scheduled_time?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'create';

    console.log('🎯 Processing rank request:', { action, body });

    if (action === 'create') {
      // Create new rank request
      const { user_id, club_id, requested_rank, reason }: RankRequestData =
        body;

      // 1. Create rank request record
      const { data: rankRequest, error: requestError } = await supabase
        .from('rank_requests')
        .insert({
          user_id,
          club_id,
          requested_rank,
          status: 'pending',
        })
        .select()
        .single();

      if (requestError) {
        console.error('❌ Error creating rank request:', requestError);
        throw requestError;
      }

      console.log('✅ Rank request created:', rankRequest.id);

      // 2. Get user and club information
      const [userResult, clubResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('full_name, display_name')
          .eq('user_id', user_id)
          .single(),
        supabase
          .from('club_profiles')
          .select('club_name, user_id')
          .eq('id', club_id)
          .single(),
      ]);

      if (userResult.error || clubResult.error) {
        console.error(
          '❌ Error fetching user/club data:',
          userResult.error || clubResult.error
        );
        throw userResult.error || clubResult.error;
      }

      const userName =
        userResult.data.display_name ||
        userResult.data.full_name ||
        'Người chơi';
      const clubName = clubResult.data.club_name;
      const clubOwnerId = clubResult.data.user_id;

      // 3. Create notification for club owner
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: clubOwnerId,
          type: 'rank_verification_request',
          title: 'Yêu cầu xác thực hạng mới',
          message: `${userName} đã yêu cầu xác thực hạng ${requested_rank} tại ${clubName}. Vui lòng kiểm tra và phê duyệt.`,
          priority: 'high',
          metadata: {
            rank_request_id: rankRequest.id,
            user_id: user_id,
            club_id: club_id,
            requested_rank: requested_rank,
            user_name: userName,
          },
          link: `/club-management?tab=rank-requests&request_id=${rankRequest.id}`,
        });

      if (notificationError) {
        console.error('❌ Error creating notification:', notificationError);
        throw notificationError;
      }

      console.log('✅ Notification sent to club owner:', clubOwnerId);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Yêu cầu đăng ký hạng đã được gửi và thông báo cho club',
          request_id: rankRequest.id,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    } else if (action === 'update') {
      // Update existing rank request
      const {
        rank_request_id,
        action: updateAction,
        rejection_reason,
        scheduled_time,
      }: RankUpdateData = body;

      // Get rank request details
      const { data: rankRequest, error: rankError } = await supabase
        .from('rank_requests')
        .select(
          `
          *,
          profiles!rank_requests_user_id_fkey(full_name, display_name),
          club_profiles!rank_requests_club_id_fkey(club_name, user_id)
        `
        )
        .eq('id', rank_request_id)
        .single();

      if (rankError || !rankRequest) {
        throw new Error('Rank request not found');
      }

      // Update rank request status
      const updateData: any = {
        status: updateAction,
        updated_at: new Date().toISOString(),
      };

      if (updateAction === 'approved') {
        updateData.approved_at = new Date().toISOString();
        updateData.approved_by = rankRequest.club.user_id;
      } else if (updateAction === 'rejected') {
        updateData.rejection_reason = rejection_reason;
      } else if (updateAction === 'scheduled') {
        updateData.scheduled_time = scheduled_time;
      }

      const { error: updateError } = await supabase
        .from('rank_requests')
        .update(updateData)
        .eq('id', rank_request_id);

      if (updateError) {
        throw updateError;
      }

      // Create notification for user
      const notificationData = {
        user_id: rankRequest.user_id,
        type: 'rank_request_update',
        title: '',
        message: '',
        priority: 'normal' as const,
        metadata: {
          rank_request_id: rankRequest.id,
          action: updateAction,
          club_name: rankRequest.club_profiles.club_name,
        },
      };

      switch (updateAction) {
        case 'approved':
          notificationData.title = 'Yêu cầu hạng đã được phê duyệt';
          notificationData.message = `Yêu cầu hạng ${rankRequest.requested_rank} của bạn tại ${rankRequest.club_profiles.club_name} đã được phê duyệt.`;
          notificationData.priority = 'high';
          break;

        case 'on_site_test':
          notificationData.title = 'Lịch kiểm tra hạng';
          notificationData.message = `Bạn có lịch kiểm tra hạng ${rankRequest.requested_rank} tại ${rankRequest.club_profiles.club_name} vào ${new Date(scheduled_time!).toLocaleString('vi-VN')}.`;
          notificationData.priority = 'high';
          break;

        case 'rejected':
          notificationData.title = 'Yêu cầu hạng bị từ chối';
          notificationData.message = `Yêu cầu hạng ${rankRequest.requested_rank} tại ${rankRequest.club_profiles.club_name} đã bị từ chối. ${rejection_reason ? 'Lý do: ' + rejection_reason : ''}`;
          break;

        default:
          throw new Error('Invalid action');
      }

      // Insert notification
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert(notificationData);

      if (notificationError) {
        console.error('❌ Error creating notification:', notificationError);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Rank request updated successfully',
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error: any) {
    console.error('❌ Rank request notification error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);
