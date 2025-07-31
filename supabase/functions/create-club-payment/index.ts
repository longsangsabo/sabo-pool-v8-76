import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

// Định nghĩa type cho transaction
interface Transaction {
  id: number;
  user_id: string;
  transaction_ref: string;
  amount: number;
  currency: string;
  payment_method: string;
  status: string;
}

serve(async req => {
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
      data: { user },
    } = await supabaseClient.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { userId, membershipType, amount, paymentMethod, clubId } =
      await req.json();

    // Validate club registration
    const { data: clubReg, error: clubError } = await supabaseClient
      .from('club_registrations')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'approved')
      .single();

    if (clubError || !clubReg) {
      throw new Error('Club not verified or not found');
    }

    // Create payment transaction
    const transactionRef = `CLUB_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const { data: transaction, error: transactionError } = await supabaseClient
      .from('payment_transactions')
      .insert({
        user_id: userId,
        transaction_ref: transactionRef,
        amount: amount,
        currency: 'VND',
        payment_method: paymentMethod,
        status: 'pending',
      })
      .select()
      .single();

    if (transactionError) throw transactionError;

    // Generate payment URL (simplified for demo)
    const paymentUrl = generatePaymentUrl(
      transaction as Transaction,
      membershipType
    );

    return new Response(
      JSON.stringify({
        success: true,
        paymentUrl,
        transactionId: transaction.id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Club payment creation error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

function generatePaymentUrl(transaction: Transaction, membershipType: string) {
  // This is a simplified implementation
  // In production, you would integrate with actual payment providers
  const baseUrl = Deno.env.get('SITE_URL') || 'http://localhost:5173';
  return `${baseUrl}/payment-success?ref=${transaction.transaction_ref}&type=club&plan=${membershipType}`;
}
