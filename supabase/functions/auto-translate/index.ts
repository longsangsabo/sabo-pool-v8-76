import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import 'https://deno.land/x/xhr@0.1.0/mod.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client for logging
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// OpenAI pricing per 1M tokens (as of 2025)
const OPENAI_PRICING = {
  'gpt-4.1-2025-04-14': { input: 2.5, output: 10.0 },
  'gpt-4.1-mini-2025-04-14': { input: 0.15, output: 0.6 },
  'o3-2025-04-16': { input: 15.0, output: 60.0 },
  'o4-mini-2025-04-16': { input: 3.0, output: 12.0 },
} as const;

function calculateOpenAICost(
  modelId: string,
  promptTokens: number,
  completionTokens: number
): number {
  const pricing = OPENAI_PRICING[modelId as keyof typeof OPENAI_PRICING];
  if (!pricing) return 0;

  const inputCost = (promptTokens / 1000000) * pricing.input;
  const outputCost = (completionTokens / 1000000) * pricing.output;

  return inputCost + outputCost;
}

async function logOpenAIUsage(usage: {
  model_id: string;
  task_type: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  cost_usd: number;
  response_time_ms: number;
  success: boolean;
  error_message?: string;
  user_id?: string;
  function_name: string;
}): Promise<void> {
  try {
    const { error } = await supabase.from('openai_usage_logs').insert([usage]);

    if (error) {
      console.error('Failed to log OpenAI usage:', error);
    }
  } catch (error) {
    console.error('Error logging OpenAI usage:', error);
  }
}

interface TranslationRequest {
  keys: string[];
  sourceLanguage: string;
  targetLanguage: string;
  context?: string;
}

interface TranslationResponse {
  translations: Record<string, string>;
  success: boolean;
  processedCount: number;
}

serve(async req => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      keys,
      sourceLanguage,
      targetLanguage,
      context,
      model,
    }: TranslationRequest & { model?: string } = await req.json();

    if (!keys || !Array.isArray(keys) || keys.length === 0) {
      return new Response(
        JSON.stringify({
          error: 'Keys array is required and must not be empty',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(
      `🔄 Translating ${keys.length} keys from ${sourceLanguage} to ${targetLanguage}`
    );

    // Smart model selection for translation tasks
    const getTranslationModel = (userModel?: string): string => {
      if (
        userModel &&
        [
          'gpt-4.1-2025-04-14',
          'gpt-4.1-mini-2025-04-14',
          'o3-2025-04-16',
          'o4-mini-2025-04-16',
        ].includes(userModel)
      ) {
        return userModel;
      }

      // Default to fast and cost-effective model for translation
      return 'gpt-4.1-mini-2025-04-14';
    };

    const selectedModel = getTranslationModel(model);

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openAIApiKey) {
      console.log('⚠️ OpenAI API key not found, using fallback translation');
      return fallbackTranslation(keys, targetLanguage);
    }

    // Prepare translation prompt
    const systemPrompt = `Bạn là một chuyên gia dịch thuật cho ứng dụng bi-a/pool. Hãy dịch các key sau từ ${sourceLanguage} sang ${targetLanguage}.
Context: ${context || 'Pool/Billiards gaming platform'}

Quy tắc:
1. Giữ nguyên format của key (ví dụ: admin.dashboard -> admin.dashboard)
2. Chỉ dịch phần value, không dịch key
3. Sử dụng thuật ngữ phù hợp với bi-a/pool
4. Giữ tính chuyên nghiệp và thân thiện
5. Trả về JSON format: {"key": "translated_value"}

Ví dụ input: ["admin.dashboard", "tournament.create"]
Ví dụ output: {"admin.dashboard": "Bảng điều khiển", "tournament.create": "Tạo giải đấu"}`;

    const userPrompt = `Hãy dịch các keys sau: ${JSON.stringify(keys)}`;

    const startTime = Date.now();
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: selectedModel.includes('o3') ? 0.1 : 0.3,
        max_tokens: selectedModel.includes('o3') ? 3000 : 2000,
      }),
    });

    if (!response.ok) {
      console.error(`OpenAI API error: ${response.status}`);
      return fallbackTranslation(keys, targetLanguage);
    }

    const data = await response.json();
    const translatedContent = data.choices[0].message.content;
    const responseTime = Date.now() - startTime;

    // Log usage data
    const usage = data.usage || {};
    const promptTokens = usage.prompt_tokens || 0;
    const completionTokens = usage.completion_tokens || 0;
    const totalTokens = usage.total_tokens || 0;
    const cost = calculateOpenAICost(
      selectedModel,
      promptTokens,
      completionTokens
    );

    // Log to database (fire and forget)
    logOpenAIUsage({
      model_id: selectedModel,
      task_type: 'translation',
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: totalTokens,
      cost_usd: cost,
      response_time_ms: responseTime,
      success: true,
      function_name: 'auto-translate',
    }).catch(err => console.error('Failed to log usage:', err));

    let translations: Record<string, string>;

    try {
      translations = JSON.parse(translatedContent);
    } catch (parseError) {
      console.error('Error parsing AI translation response:', parseError);
      return fallbackTranslation(keys, targetLanguage);
    }

    // Validate and clean translations
    const cleanedTranslations: Record<string, string> = {};
    let processedCount = 0;

    for (const key of keys) {
      if (translations[key]) {
        cleanedTranslations[key] = translations[key];
        processedCount++;
      } else {
        // Generate fallback for missing keys
        cleanedTranslations[key] = generateFallbackTranslation(
          key,
          targetLanguage
        );
      }
    }

    console.log(
      `✅ Successfully translated ${processedCount}/${keys.length} keys`
    );

    const result: TranslationResponse = {
      translations: cleanedTranslations,
      success: true,
      processedCount,
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Translation service error:', error);

    return new Response(
      JSON.stringify({
        error: 'Translation service failed',
        details: error.message,
        success: false,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function fallbackTranslation(keys: string[], targetLanguage: string): Response {
  const translations: Record<string, string> = {};

  keys.forEach(key => {
    translations[key] = generateFallbackTranslation(key, targetLanguage);
  });

  const result: TranslationResponse = {
    translations,
    success: false,
    processedCount: keys.length,
  };

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function generateFallbackTranslation(
  key: string,
  targetLanguage: string
): string {
  // Basic fallback translation based on common patterns
  const basicTranslations: Record<string, Record<string, string>> = {
    vi: {
      admin: 'Quản trị',
      dashboard: 'Bảng điều khiển',
      user: 'Người dùng',
      tournament: 'Giải đấu',
      club: 'Câu lạc bộ',
      match: 'Trận đấu',
      ranking: 'Xếp hạng',
      profile: 'Hồ sơ',
      settings: 'Cài đặt',
      create: 'Tạo',
      edit: 'Chỉnh sửa',
      delete: 'Xóa',
      save: 'Lưu',
      cancel: 'Hủy',
      confirm: 'Xác nhận',
      view: 'Xem',
      manage: 'Quản lý',
      update: 'Cập nhật',
    },
    en: {
      admin: 'Admin',
      dashboard: 'Dashboard',
      user: 'User',
      tournament: 'Tournament',
      club: 'Club',
      match: 'Match',
      ranking: 'Ranking',
      profile: 'Profile',
      settings: 'Settings',
      create: 'Create',
      edit: 'Edit',
      delete: 'Delete',
      save: 'Save',
      cancel: 'Cancel',
      confirm: 'Confirm',
      view: 'View',
      manage: 'Manage',
      update: 'Update',
    },
  };

  const keyParts = key.split('.');
  const lastPart = keyParts[keyParts.length - 1];

  const translations =
    basicTranslations[targetLanguage] || basicTranslations['vi'];

  // Look for exact match first
  if (translations[lastPart]) {
    return translations[lastPart];
  }

  // Look for partial matches
  for (const [word, translation] of Object.entries(translations)) {
    if (lastPart.includes(word)) {
      return translation;
    }
  }

  // Default fallback
  return targetLanguage === 'vi'
    ? `[Cần dịch] ${lastPart.replace(/_/g, ' ')}`
    : `[Needs translation] ${lastPart.replace(/_/g, ' ')}`;
}
