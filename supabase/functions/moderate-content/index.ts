import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

interface ModerationRequest {
  content: string;
  type: "story" | "comment";
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, type }: ModerationRequest = await req.json();

    // Input validation
    if (!content || typeof content !== 'string') {
      return new Response(
        JSON.stringify({ error: "Valid content string is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Length validation
    const MAX_CONTENT_LENGTH = 50000;
    if (content.length > MAX_CONTENT_LENGTH) {
      return new Response(
        JSON.stringify({ error: `Content too long. Maximum ${MAX_CONTENT_LENGTH} characters` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Type validation
    const VALID_TYPES = ['story', 'comment'];
    if (!type || !VALID_TYPES.includes(type)) {
      return new Response(
        JSON.stringify({ error: "Type must be 'story' or 'comment'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Call Lovable AI for content moderation
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a content moderator for a heart health support community. Analyze content for:
            
1. SAFETY: Flag content with harmful medical advice, self-harm mentions, or crisis situations
2. APPROPRIATENESS: Flag spam, harassment, or off-topic content
3. TONE: Ensure supportive and respectful communication

Return JSON with:
{
  "approved": boolean,
  "reason": "explanation if rejected",
  "severity": "low" | "medium" | "high",
  "suggestions": "optional feedback for user"
}

Be supportive but maintain safety standards.`
          },
          {
            role: "user",
            content: `Moderate this ${type}:\n\n${content}`
          }
        ],
        tools: [{
          type: "function",
          function: {
            name: "moderate_content",
            description: "Return moderation decision",
            parameters: {
              type: "object",
              properties: {
                approved: { type: "boolean" },
                reason: { type: "string" },
                severity: { type: "string", enum: ["low", "medium", "high"] },
                suggestions: { type: "string" }
              },
              required: ["approved", "severity"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "moderate_content" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service payment required" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error("No moderation result from AI");
    }

    const result = JSON.parse(toolCall.function.arguments);

    console.log("Moderation result:", result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in moderate-content function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
