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
    const { documentText, fileName } = await req.json();

    if (!documentText) {
      throw new Error('No document text provided');
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
  }
}

Be conservative - only extract information you're confident about. If you're unsure, leave it null.`;

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
          { role: 'user', content: `Analyze this medical document:\n\n${documentText}` }
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