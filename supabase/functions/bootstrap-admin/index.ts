import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[BOOTSTRAP-ADMIN] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    // Get admin email from environment variable
    const PERMANENT_ADMIN_EMAIL = Deno.env.get("PERMANENT_ADMIN_EMAIL");
    if (!PERMANENT_ADMIN_EMAIL) {
      console.error("[BOOTSTRAP-ADMIN] PERMANENT_ADMIN_EMAIL not configured");
      return new Response(JSON.stringify({ ok: false, error: "Configuration error" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ ok: false, error: "Authentication required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user?.id || !userData.user?.email) {
      console.error("[BOOTSTRAP-ADMIN] Auth failed:", userError?.message);
      return new Response(JSON.stringify({ ok: false, error: "Authentication failed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }
    const user = userData.user;
    const userEmail = user.email!;
    logStep("User authenticated", { userId: user.id });

    // SECURITY: Only allow the permanent admin email
    if (userEmail.toLowerCase() !== PERMANENT_ADMIN_EMAIL.toLowerCase()) {
      return new Response(JSON.stringify({ ok: false, error: "Access denied" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    // Check if an admin already exists
    const { data: admins, error: adminQueryError } = await supabase
      .from('user_roles')
      .select('id')
      .eq('role', 'admin')
      .limit(1);

    if (adminQueryError) {
      console.error("[BOOTSTRAP-ADMIN] Admin query failed:", adminQueryError.message);
      return new Response(JSON.stringify({ ok: false, error: "Operation failed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    if (admins && admins.length > 0) {
      return new Response(JSON.stringify({ ok: false, error: "Operation not permitted" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    // No admin exists -> grant admin to current user
    const { error: insertError } = await supabase
      .from('user_roles')
      .insert({ user_id: user.id, role: 'admin' });

    if (insertError) {
      console.error("[BOOTSTRAP-ADMIN] Insert failed:", insertError.message);
      return new Response(JSON.stringify({ ok: false, error: "Operation failed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    logStep("Admin role granted to user", { userId: user.id });

    return new Response(JSON.stringify({ ok: true, message: 'Admin role granted' }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("[BOOTSTRAP-ADMIN] Unexpected error:", error);
    return new Response(JSON.stringify({ ok: false, error: "An error occurred" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
