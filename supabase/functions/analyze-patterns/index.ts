import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Get auth header and create client
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get user from token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Not authenticated');
    }

    // Fetch user's episodes
    const { data: episodes, error: episodesError } = await supabase
      .from('heart_episodes')
      .select('*')
      .eq('user_id', user.id)
      .order('episode_date', { ascending: false })
      .limit(50);

    if (episodesError) {
      throw new Error('Failed to fetch episodes');
    }

    if (!episodes || episodes.length < 3) {
      return new Response(
        JSON.stringify({ 
          insights: null,
          message: 'Log at least 3 episodes to see pattern insights'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare episode data for analysis
    const episodesSummary = episodes.map(ep => ({
      date: ep.episode_date,
      dayOfWeek: new Date(ep.episode_date).toLocaleDateString('en-US', { weekday: 'long' }),
      hour: new Date(ep.episode_date).getHours(),
      severity: ep.severity,
      duration: ep.duration_seconds,
      symptoms: ep.symptoms,
      notes: ep.notes
    }));

    const prompt = `Analyze these heart episode records and identify patterns. Be encouraging and supportive - remember these are benign ectopic beats, not dangerous.

Episodes (most recent first):
${JSON.stringify(episodesSummary, null, 2)}

Provide a JSON response with these fields:
{
  "timePattern": "When episodes tend to occur (e.g., 'Morning episodes (6-9 AM) are most common')",
  "dayPattern": "Day of week patterns if any (e.g., 'More episodes on weekdays')",
  "severityTrend": "How severity has changed over time (improving, stable, varying)",
  "commonSymptoms": ["Array of most mentioned symptoms"],
  "possibleTriggers": ["Array of potential triggers mentioned in notes"],
  "encouragement": "A brief, warm, supportive message about their journey",
  "tip": "One practical wellness tip based on their patterns"
}

Be concise but insightful. Focus on patterns that could help them understand and manage their episodes better.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are a supportive wellness assistant helping someone track benign ectopic heartbeats. Always be encouraging and remind them these are usually harmless. Respond only with valid JSON.'
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 800,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error('Failed to analyze patterns');
    }

    const data = await response.json();
    let insights;
    
    try {
      const content = data.choices[0].message.content;
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        insights = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON in response');
      }
    } catch (parseError) {
      console.error('Parse error:', parseError);
      insights = {
        timePattern: "Unable to determine time patterns",
        dayPattern: "Unable to determine day patterns",
        severityTrend: "Keep logging to track trends",
        commonSymptoms: [],
        possibleTriggers: [],
        encouragement: "You're doing great by tracking your episodes!",
        tip: "Continue logging to help identify patterns over time."
      };
    }

    return new Response(
      JSON.stringify({ 
        insights,
        episodeCount: episodes.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Pattern analysis error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
