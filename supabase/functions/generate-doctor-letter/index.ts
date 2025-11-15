import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GENERATE-DOCTOR-LETTER] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    const { additionalInfo } = await req.json();
    logStep("Additional info received", { hasInfo: !!additionalInfo });

    // Fetch user's episodes
    const { data: episodes, error: episodesError } = await supabaseClient
      .from('heart_episodes')
      .select('*')
      .eq('user_id', user.id)
      .order('episode_date', { ascending: false });

    if (episodesError) throw episodesError;
    logStep("Episodes fetched", { count: episodes?.length || 0 });

    // Analyze episode data
    const now = new Date();
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    
    const recentEpisodes = episodes?.filter(ep => new Date(ep.episode_date) >= monthAgo) || [];
    const last3MonthsEpisodes = episodes?.filter(ep => new Date(ep.episode_date) >= threeMonthsAgo) || [];
    
    const severityCounts = episodes?.reduce((acc, ep) => {
      acc[ep.severity || 'mild'] = (acc[ep.severity || 'mild'] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    const allSymptoms = episodes?.flatMap(ep => ep.symptoms?.split(',').map((s: string) => s.trim()) || []) || [];
    const uniqueSymptoms = [...new Set(allSymptoms)];

    const allNotes = episodes?.map(ep => ep.notes).filter(Boolean).join(' ') || '';

    // Create prompt for AI
    const prompt = `You are a medical assistant helping a patient compose a professional letter to their doctor about their ectopic heartbeat condition (PVCs/PACs).

PATIENT DATA:
- Total episodes logged: ${episodes?.length || 0}
- Episodes in last 30 days: ${recentEpisodes.length}
- Episodes in last 3 months: ${last3MonthsEpisodes.length}
- Severity distribution: ${JSON.stringify(severityCounts)}
- Reported symptoms: ${uniqueSymptoms.join(', ') || 'None specified'}
- Patient notes themes: ${allNotes.substring(0, 500)}
${additionalInfo ? `- Additional context from patient: ${additionalInfo}` : ''}

Write a professional, concise letter (300-400 words) to the patient's doctor that:
1. Opens professionally with the purpose of the letter
2. Describes the frequency and pattern of ectopic heartbeats using the data above
3. Explains the impact on quality of life and psychological wellbeing
4. Mentions any patterns or triggers the patient has identified
5. Requests appropriate next steps (e.g., extended Holter monitor, EP study if frequency is high, or reassurance consultation)
6. Closes professionally

Use medical terminology appropriately but keep it clear. Be factual and avoid exaggeration. Make it clear this is to facilitate better communication between patient and doctor.

Start with "Dear Dr. [Doctor's Name]," and end with "Sincerely, [Patient Name]" with placeholders in square brackets.`;

    logStep("Calling Lovable AI");
    
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are a professional medical assistant helping patients communicate effectively with their doctors. You write clear, professional letters that are factual and helpful."
          },
          {
            role: "user",
            content: prompt
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      logStep("AI API error", { status: aiResponse.status, error: errorText });
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const letter = aiData.choices[0]?.message?.content;
    
    if (!letter) {
      throw new Error("No letter generated");
    }

    logStep("Letter generated successfully");

    return new Response(JSON.stringify({ 
      letter,
      episodeCount: episodes?.length || 0,
      recentCount: recentEpisodes.length
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in generate-doctor-letter", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
