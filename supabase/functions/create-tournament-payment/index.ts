import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface TournamentPaymentRequest {
  userId: string;
  tournamentId: string;
  registrationId: string;
  amount: number;
}

function sortObject(obj: Record<string, any>): Record<string, any> {
  const sorted: Record<string, any> = {};
  const str = [];
  let key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, '+');
  }
  return sorted;
}

async function createSecureHash(
  params: Record<string, any>,
  secretKey: string
): Promise<string> {
  const sortedParams = sortObject(params);
  const signData = Object.keys(sortedParams)
    .map(key => `${key}=${sortedParams[key]}`)
    .join('&');

  const crypto = globalThis.crypto;
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secretKey);
  const dataToSign = encoder.encode(signData);

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, dataToSign);

  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

serve(async req => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const {
      userId,
      tournamentId,
      registrationId,
      amount,
    }: TournamentPaymentRequest = await req.json();

    if (!userId || !tournamentId || !registrationId || !amount) {
      throw new Error('Missing required parameters');
    }

    // Get tournament info
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('name')
      .eq('id', tournamentId)
      .single();

    if (tournamentError) {
      throw new Error('Tournament not found');
    }

    // Create transaction reference
    const transactionRef = `TOURNAMENT_${userId.substring(0, 8)}_${Date.now()}`;

    // VNPay configuration
    const vnpUrl = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    const returnUrl = `${Deno.env.get('SUPABASE_URL')?.replace('/rest/v1', '')}/functions/v1/tournament-payment-callback`;

    const date = new Date();
    const createDate = date.toISOString().replace(/[-:]/g, '').split('.')[0];

    // VNPay parameters
    const vnpParams = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: Deno.env.get('VNPAY_TMN_CODE') || '',
      vnp_Amount: String(amount * 100), // VNPay requires amount in VND * 100
      vnp_CurrCode: 'VND',
      vnp_TxnRef: transactionRef,
      vnp_OrderInfo: `Tham gia giai dau ${tournament.name} - User ${userId}`,
      vnp_OrderType: 'other',
      vnp_Locale: 'vn',
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: '127.0.0.1',
      vnp_CreateDate: createDate,
    };

    // Create secure hash
    const secretKey = Deno.env.get('VNPAY_HASH_SECRET') || '';
    const secureHash = await createSecureHash(vnpParams, secretKey);

    // Build payment URL
    const query = new URLSearchParams({
      ...vnpParams,
      vnp_SecureHash: secureHash,
    });
    const paymentUrl = `${vnpUrl}?${query.toString()}`;

    // Store transaction info in registration
    const { error: updateError } = await supabase
      .from('tournament_registrations')
      .update({
        payment_transaction_ref: transactionRef,
        updated_at: new Date().toISOString(),
      })
      .eq('id', registrationId);

    if (updateError) {
      console.error('Failed to update registration:', updateError);
    }

    console.log('Tournament payment URL created:', paymentUrl);

    return new Response(
      JSON.stringify({
        success: true,
        paymentUrl,
        transactionRef,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Tournament payment creation error:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
