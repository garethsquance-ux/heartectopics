import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SubscriptionEmailRequest {
  email: string;
  name?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { email, name }: SubscriptionEmailRequest = await req.json();

    // Validate that the authenticated user's email matches
    if (user.email !== email) {
      return new Response(JSON.stringify({ error: 'Forbidden: Email mismatch' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const emailResponse = await resend.emails.send({
      from: "Heart Health Tracker <onboarding@resend.dev>",
      to: [email],
      subject: "Welcome to Premium!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #e11d48;">Thank you for subscribing!</h1>
          <p>Hi${name ? ` ${name}` : ''},</p>
          <p>Your subscription is now active. You now have access to premium features:</p>
          
          <h2 style="color: #334155;">Premium Benefits</h2>
          <ul>
            <li><strong>Unlimited AI Chat:</strong> Get support anytime you need it</li>
            <li><strong>AI-Powered Doctor Letters:</strong> Generate comprehensive letters based on your data</li>
            <li><strong>Community Access:</strong> Connect with others on the same journey</li>
            <li><strong>Weekly Insights:</strong> Receive personalized wellness updates</li>
          </ul>
          
          <p style="margin-top: 30px;">
            <a href="${Deno.env.get('SUPABASE_URL')}" 
               style="background-color: #e11d48; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; display: inline-block;">
              Explore Premium Features
            </a>
          </p>
          
          <p style="color: #64748b; font-size: 14px; margin-top: 40px;">
            You can manage your subscription anytime from your dashboard.
          </p>
        </div>
      `,
    });

    console.log("Subscription email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-subscription-email function:", error);
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
