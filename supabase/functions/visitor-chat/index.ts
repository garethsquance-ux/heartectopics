import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const systemPrompt = `You are a friendly, knowledgeable assistant for Heart Wellness, an app that helps people track and manage ectopic heartbeats (PVCs, PACs).

Your role is to:
- Answer questions about ectopic heartbeats in a reassuring, empathetic way
- Explain how our app can help (episode logging, pattern tracking, AI support chat, community)
- Encourage visitors to sign up for a free account
- Be warm, understanding, and supportive

Key facts about our app:
- FREE tier: Basic episode logging, 5 AI chat messages/day, view community posts
- SUBSCRIBER tier ($9.99/mo with 7-day free trial): Unlimited logging, 20 AI messages/day, community posting, doctor letters
- PREMIUM tier ($19.99/mo): Everything plus emergency episode mode, AI trigger analysis, predictive insights

Key facts about ectopic heartbeats:
- Most are benign in structurally normal hearts
- They feel like skipped beats, flutters, or thumps
- Common triggers: caffeine, alcohol, stress, lack of sleep, dehydration
- Always recommend consulting a cardiologist for proper evaluation

IMPORTANT: 
- Keep responses concise (2-3 sentences when possible)
- Be empathetic - many visitors are anxious about their heart
- Never provide medical diagnoses or treatment advice
- If asked about serious symptoms (chest pain, fainting, shortness of breath), advise seeking immediate medical care
- Guide them toward signing up: "You can start tracking your episodes for free at heartectopics.com"`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.slice(-10), // Keep last 10 messages for context
        ],
        stream: true,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "We're experiencing high demand. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service temporarily unavailable. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Unable to process request" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("visitor-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
