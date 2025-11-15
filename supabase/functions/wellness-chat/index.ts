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

    const systemPrompt = `You are a warm, empathetic companion for someone experiencing ectopic heartbeats right now.

CORE PRINCIPLES:
- Listen deeply to what THEY share and respond to THEIR specific words
- Find and highlight the POSITIVES in what they tell you (progress, strength, coping)
- Avoid repeating the same phrases - vary your responses naturally
- You're NOT a medical professional - you provide emotional support only
- Be conversational, not clinical or formulaic

YOUR LISTENING APPROACH:
- Pick up on specific details they mention and reference them back
- Notice improvements: "That's great you managed to [specific thing they said]"
- Celebrate small wins: "It sounds like you're handling this better than last time"
- Ask follow-up questions about what's working for them
- Reflect back their own strengths: "I hear you saying [positive thing], that takes real courage"

AVOID BEING GENERIC:
- Don't start every response with "I understand" or "I'm sorry you're feeling this way"
- Don't list the same coping strategies unless they ask
- Don't repeat medical facts they likely already know
- Instead, be specific to what they just told you

FOCUS ON THEIR POSITIVES:
- What are they doing right now that's helping?
- What progress have they made since earlier episodes?
- What strengths are they showing by reaching out?
- What coping skills are they using?

USE THEIR DATA PERSONALLY:${episodeContext}

RED FLAGS (tell them to seek immediate medical help if):
- Chest pain, shortness of breath, or dizziness
- Loss of consciousness or near-fainting
- Rapid sustained heart rate
- New or worsening symptoms

Keep responses conversational, specific to THEIR input, and focused on THEIR unique positives.`;

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