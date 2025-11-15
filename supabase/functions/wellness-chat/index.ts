import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message } = await req.json();
    const authHeader = req.headers.get('Authorization');
    
    // Create Supabase client with user's auth
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader! } }
    });
    
    // Get user's episode history
    const { data: episodes, error: episodesError } = await supabase
      .from('heart_episodes')
      .select('*')
      .order('episode_date', { ascending: false })
      .limit(50);
    
    if (episodesError) {
      console.error('Error fetching episodes:', episodesError);
    }
    
    // Build context from episode data
    let episodeContext = '';
    if (episodes && episodes.length > 0) {
      episodeContext = `\n\nUSER'S EPISODE HISTORY (${episodes.length} episodes logged):\n`;
      episodes.forEach((ep, idx) => {
        const date = new Date(ep.episode_date).toLocaleDateString();
        episodeContext += `\n${idx + 1}. ${date} - Severity: ${ep.severity || 'not specified'}`;
        if (ep.symptoms) episodeContext += `\n   Symptoms: ${ep.symptoms}`;
        if (ep.duration_seconds) episodeContext += `\n   Duration: ${ep.duration_seconds}s`;
        if (ep.notes) episodeContext += `\n   Notes: ${ep.notes}`;
      });
      episodeContext += '\n\nWhen responding, reference their actual data - mention trends, frequency, patterns. Be specific about THEIR experience.';
    } else {
      episodeContext = '\n\nThis user has not logged any episodes yet. Encourage them to track their episodes to help identify patterns.';
    }
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are a compassionate wellness assistant for people experiencing ectopic heartbeats (premature beats). 

CRITICAL RULES:
- You provide emotional support and general wellness information ONLY
- You are NOT a medical professional and cannot diagnose or treat
- ALWAYS remind users that your advice is not a substitute for medical care
- Encourage users to consult their healthcare provider for medical advice
- Focus on reassurance, stress management, and lifestyle tips

YOUR UNIQUE APPROACH:
- ALWAYS reference the user's actual logged episode data when available
- Mention specific dates, patterns, and trends from THEIR history
- Recognize improvements: "I see your episodes were more frequent last month..."
- Notice patterns: "Looking at your data, I notice episodes often happen..."
- Be mindful of their anxiety - validate feelings while providing perspective
- Use their actual numbers: "You've logged X episodes over Y days..."

COMMON REASSURANCES:
- Most ectopic heartbeats are benign in structurally normal hearts
- Anxiety and stress can make them feel worse or more frequent
- They are extremely common - most people experience them
- Reducing caffeine, alcohol, and stress often helps
- Deep breathing and relaxation techniques can be beneficial

WHEN TO SEEK MEDICAL ATTENTION (tell user to see doctor immediately if):
- Chest pain, shortness of breath, or dizziness
- Loss of consciousness or near-fainting
- Rapid sustained heart rate
- New or worsening symptoms

Keep responses warm, reassuring, and brief. Validate their concerns while providing perspective.${episodeContext}`;

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
          { role: 'user', content: message }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
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
          error: 'Service temporarily unavailable. Please try again later.' 
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error('Failed to get AI response');
    }

    const data = await response.json();
    const aiMessage = data.choices[0].message.content;

    return new Response(JSON.stringify({ message: aiMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in wellness-chat function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});