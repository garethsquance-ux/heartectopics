import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LeadMagnetRequest {
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email }: LeadMagnetRequest = await req.json();

    if (!email || !email.includes("@")) {
      return new Response(
        JSON.stringify({ error: "Invalid email address" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const emailResponse = await resend.emails.send({
      from: "Heart Wellness <hello@heartectopics.com>",
      to: [email],
      subject: "Your Free Guide: 5 Ways to Reduce Ectopic Heartbeats Naturally",
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #e11d48; margin-bottom: 10px;">💙 Heart Wellness</h1>
  </div>

  <h2 style="color: #1a1a1a;">Your Free Guide Is Here!</h2>
  
  <p>Thank you for downloading <strong>"5 Ways to Reduce Ectopic Heartbeats Naturally"</strong>.</p>
  
  <p>As someone who has lived with ectopic heartbeats for years, I've personally tested everything in this guide. Here's what you'll learn:</p>

  <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
    <h3 style="color: #e11d48; margin-top: 0;">📖 Inside Your Guide:</h3>
    
    <p><strong>1. The Gut-Heart Connection</strong><br>
    How your digestive health directly impacts your heart rhythm, and simple dietary changes that can help.</p>
    
    <p><strong>2. Electrolyte Balance</strong><br>
    Why magnesium and potassium are crucial for heart rhythm, and how to optimize your levels naturally.</p>
    
    <p><strong>3. Stress & Vagal Tone</strong><br>
    The proven breathing techniques that activate your vagus nerve and calm your heart.</p>
    
    <p><strong>4. Sleep Optimization</strong><br>
    Why poor sleep triggers ectopics and the sleep hygiene practices that make a difference.</p>
    
    <p><strong>5. Movement Without Overdoing It</strong><br>
    The right type and amount of exercise for people with ectopic heartbeats.</p>
  </div>

  <p><strong>💡 Pro Tip:</strong> Start with just ONE change this week. Small, consistent steps lead to big improvements.</p>

  <div style="text-align: center; margin: 30px 0;">
    <a href="https://heartectopics.com/auth" style="background: #e11d48; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Start Tracking Your Episodes Free →</a>
  </div>

  <p>When you're ready to take the next step, create your free account to:</p>
  <ul>
    <li>Track your episodes and discover YOUR personal triggers</li>
    <li>Chat with Heart Buddy AI when anxiety strikes</li>
    <li>Join a community of people who truly understand</li>
  </ul>

  <p>You're not alone in this journey. 💙</p>

  <p>— Gareth<br>
  <em>Founder, Heart Wellness</em><br>
  <small style="color: #666;">Someone who truly gets it</small></p>

  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
  
  <p style="font-size: 12px; color: #666; text-align: center;">
    You received this email because you requested our free guide at heartectopics.com.<br>
    <a href="https://heartectopics.com" style="color: #e11d48;">Visit our website</a>
  </p>

</body>
</html>
      `,
    });

    console.log("Lead magnet email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending lead magnet email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
