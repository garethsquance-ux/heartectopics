import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check user role and limits
    const { data: roles } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const isSubscriber = roles?.some(r => r.role === 'subscriber' || r.role === 'admin');
    const monthlyLimit = isSubscriber ? 20 : 2; // Subscribers: 20/month, Free: 2/month

    // Check and update usage
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = today.substring(0, 7); // YYYY-MM format
    
    let { data: usage } = await supabaseClient
      .from('user_chat_usage')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Initialize or reset monthly count if needed
    const lastAnalysisMonth = usage?.last_document_analysis_date?.substring(0, 7);
    if (!usage || lastAnalysisMonth !== currentMonth) {
      const { data: newUsage } = await supabaseClient
        .from('user_chat_usage')
        .upsert({
          user_id: user.id,
          document_analysis_count: 0,
          last_document_analysis_date: today,
          daily_count: usage?.daily_count || 0,
          monthly_count: usage?.monthly_count || 0,
          last_reset_date: usage?.last_reset_date || today,
        })
        .select()
        .single();
      
      usage = newUsage;
    }

    // Check if user has exceeded monthly limit
    if (usage && usage.document_analysis_count >= monthlyLimit) {
      return new Response(
        JSON.stringify({ 
          error: 'Monthly document analysis limit reached',
          limit: monthlyLimit,
          current: usage.document_analysis_count,
          upgradeMessage: isSubscriber 
            ? 'You have reached your monthly limit. Your scans will reset next month.' 
            : 'You have used all your free document scans. Upgrade to Subscriber for 20 scans per month.',
          remaining: 0
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Increment usage counter
    await supabaseClient
      .from('user_chat_usage')
      .update({ 
        document_analysis_count: (usage?.document_analysis_count || 0) + 1,
        last_document_analysis_date: today
      })
      .eq('user_id', user.id);

    const body = await req.json();
    const { documentText, fileName, imageData, fileType } = body;

    if (!documentText && !imageData) {
      return new Response(
        JSON.stringify({ error: 'No document text or image provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // INPUT VALIDATION: Validate inputs
    if (fileName && typeof fileName !== 'string') {
      return new Response(
        JSON.stringify({ error: 'File name must be a string' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (fileName && fileName.length > 500) {
      return new Response(
        JSON.stringify({ error: 'File name too long (max 500 characters)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (documentText && typeof documentText !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Document text must be a string' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (documentText && documentText.length > 50000) {
      return new Response(
        JSON.stringify({ error: 'Document too long (max 50000 characters)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (imageData && typeof imageData !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Image data must be a base64 string' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if document text is too long and truncate if needed
    const MAX_CHARS = 15000; // ~3750 tokens, leaving room for response
    let processedText = documentText;
    
    if (documentText && documentText.length > MAX_CHARS) {
      console.log(`Document too long (${documentText.length} chars), truncating to ${MAX_CHARS}`);
      // Take first 80% and last 20% to preserve context
      const firstPart = documentText.substring(0, Math.floor(MAX_CHARS * 0.8));
      const lastPart = documentText.substring(documentText.length - Math.floor(MAX_CHARS * 0.2));
      processedText = `${firstPart}\n\n[... middle section omitted due to length ...]\n\n${lastPart}`;
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log(`Analyzing document: ${fileName}`);

    const systemPrompt = `You are a medical document analyzer specializing in cardiac health reports. Extract relevant information from medical documents related to ectopic heartbeats, PVCs (Premature Ventricular Contractions), PACs (Premature Atrial Contractions), and heart palpitations.

Extract the following information if present:
- Episode date and time
- Duration of episode
- Severity (mild, moderate, severe)
- Symptoms experienced
- Heart rate or other measurements
- Doctor's observations
- Treatment recommendations
- Any test results
- IMPORTANT: Any positive findings or reassurances (e.g., "structurally normal heart", "no concerning abnormalities", "benign condition")

Return a JSON object with these fields (use null if not found):
{
  "episodeDate": "ISO date string or null",
  "durationSeconds": number or null,
  "severity": "mild" | "moderate" | "severe" | null,
  "symptoms": "comma-separated symptoms" or null,
  "notes": "additional findings and observations",
  "measurements": {
    "heartRate": number or null,
    "other": "any other measurements found"
  },
  "encouragement": "A warm, personal 2-3 sentence reminder based on positive findings. If doctor mentioned 'structurally fine', 'no abnormalities', 'benign', or similar reassurances, craft an encouraging message the patient can return to during difficult moments. Focus on what IS working well. If no positive findings, leave null."
}

Be conservative with medical facts but generous with encouragement when positive findings exist.`;

    // Build the user message based on whether we have text or image
    let userMessage;
    if (imageData) {
      // For images, use vision capabilities
      userMessage = {
        role: 'user',
        content: [
          { type: 'text', text: 'Analyze this medical document image for ectopic heartbeat episode information:' },
          { type: 'image_url', image_url: { url: imageData } }
        ]
      };
    } else {
      // For text documents (use processed/truncated text)
      userMessage = {
        role: 'user',
        content: `Analyze this medical document:\n\n${processedText}`
      };
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          userMessage
        ],
        response_format: { type: 'json_object' }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Rate limit exceeded. Please try again in a moment.' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'AI usage limit reached. Please contact support.' 
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const extractedText = data.choices[0].message.content;
    
    console.log('Extracted data:', extractedText);
    
    let extractedData;
    try {
      extractedData = JSON.parse(extractedText);
    } catch (e) {
      console.error('Failed to parse AI response as JSON:', e);
      extractedData = { notes: extractedText };
    }

    return new Response(JSON.stringify({ 
      success: true,
      extractedData 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-medical-document function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});