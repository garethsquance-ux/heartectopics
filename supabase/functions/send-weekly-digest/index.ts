import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify cron secret token for authentication
    const authHeader = req.headers.get("Authorization");
    const expectedToken = Deno.env.get("CRON_SECRET_TOKEN");
    
    if (!expectedToken) {
      console.error("CRON_SECRET_TOKEN not configured");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    
    if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
      console.warn("Unauthorized access attempt to send-weekly-digest");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all subscribers
    const { data: subscribers } = await supabase
      .from("subscriptions")
      .select("user_id")
      .eq("status", "active");

    if (!subscribers || subscribers.length === 0) {
      return new Response(JSON.stringify({ message: "No active subscribers" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const results = [];

    for (const subscriber of subscribers) {
      // Get user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", subscriber.user_id)
        .single();

      if (!profile?.email) continue;

      // Get last 7 days of episodes
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: episodes, count } = await supabase
        .from("heart_episodes")
        .select("*", { count: "exact" })
        .eq("user_id", subscriber.user_id)
        .gte("episode_date", sevenDaysAgo.toISOString());

      const episodeSummary = episodes && episodes.length > 0
        ? `
          <h3 style="color: #334155;">This Week's Summary</h3>
          <ul>
            <li><strong>Total Episodes:</strong> ${count}</li>
            <li><strong>Average Severity:</strong> ${calculateAverageSeverity(episodes)}</li>
            <li><strong>Most Common Trigger:</strong> ${findCommonTrigger(episodes)}</li>
          </ul>
        `
        : `<p>No episodes logged this week. Keep up the great work!</p>`;

      // Send weekly digest
      const emailResponse = await resend.emails.send({
        from: "Heart Health Tracker <onboarding@resend.dev>",
        to: [profile.email],
        subject: "Your Weekly Heart Health Summary",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #e11d48;">Your Weekly Summary</h1>
            <p>Here's what happened in your heart health journey this week:</p>
            
            ${episodeSummary}
            
            <p style="margin-top: 30px;">
              <a href="${supabaseUrl}" 
                 style="background-color: #e11d48; color: white; padding: 12px 24px; 
                        text-decoration: none; border-radius: 6px; display: inline-block;">
                View Full Dashboard
              </a>
            </p>
            
            <p style="color: #64748b; font-size: 14px; margin-top: 40px;">
              This is your weekly digest. You can adjust email preferences in your dashboard.
            </p>
          </div>
        `,
      });

      results.push({ email: profile.email, status: emailResponse });
    }

    console.log(`Weekly digest sent to ${results.length} subscribers`);

    return new Response(JSON.stringify({ sent: results.length, results }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-weekly-digest function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

function calculateAverageSeverity(episodes: any[]): string {
  const severityMap: Record<string, number> = { low: 1, moderate: 2, high: 3 };
  const total = episodes.reduce((sum, ep) => sum + (severityMap[ep.severity] || 0), 0);
  const avg = total / episodes.length;
  if (avg <= 1.5) return "Low";
  if (avg <= 2.5) return "Moderate";
  return "High";
}

function findCommonTrigger(episodes: any[]): string {
  const triggers: Record<string, number> = {};
  episodes.forEach(ep => {
    if (ep.notes) {
      const words = ep.notes.toLowerCase().split(/\s+/);
      words.forEach((word: string) => {
        if (word.length > 4) {
          triggers[word] = (triggers[word] || 0) + 1;
        }
      });
    }
  });
  const sorted = Object.entries(triggers).sort((a, b) => b[1] - a[1]);
  return sorted.length > 0 ? sorted[0][0] : "None identified";
}

serve(handler);
