import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
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

    const { email, name }: WelcomeEmailRequest = await req.json();

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
      subject: "Welcome to Heart Health Tracker!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #e11d48;">Welcome${name ? `, ${name}` : ''}!</h1>
          <p>Thank you for joining Heart Health Tracker. We're here to support your wellness journey.</p>
          
          <h2 style="color: #334155;">Getting Started</h2>
          <ul>
            <li>Track your heart episodes daily</li>
            <li>Chat with our AI wellness assistant</li>
            <li>View insights and patterns</li>
            <li>Generate doctor letters when needed</li>
          </ul>
          
          <p style="margin-top: 30px;">
            <a href="${Deno.env.get('SUPABASE_URL')}" 
               style="background-color: #e11d48; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; display: inline-block;">
              Go to Dashboard
            </a>
          </p>
          
          <p style="color: #64748b; font-size: 14px; margin-top: 40px;">
            This is an automated message. If you didn't create this account, please ignore this email.
          </p>
        </div>
      `,
    });

    console.log("Welcome email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-welcome-email function:", error);
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
