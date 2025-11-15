import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const PERMANENT_ADMIN_EMAIL = 'garethsquance@gmail.com';

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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.id) throw new Error("User not authenticated");
    if (!user?.email) throw new Error("User email not found");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // SECURITY: Only allow the permanent admin email
    if (user.email.toLowerCase() !== PERMANENT_ADMIN_EMAIL.toLowerCase()) {
      return new Response(JSON.stringify({ 
        ok: false, 
        error: 'Forbidden: You are not authorized to bootstrap admin access' 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    // Check if an admin already exists
    const { data: existingAdmins, error: adminQueryError } = await supabase
      .from('user_roles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'admin');

    if (adminQueryError) throw new Error(`Error checking existing admins: ${adminQueryError.message}`);

    // If there is already at least one admin, do not allow bootstrapping
    if ((existingAdmins as any) === null) {
      // head: true returns null for data; use count via getStatus() is not available here, so re-run without head
      const { data: admins2, error: adminQueryError2 } = await supabase
        .from('user_roles')
        .select('id')
        .eq('role', 'admin')
        .limit(1);
      if (adminQueryError2) throw new Error(`Error checking admins: ${adminQueryError2.message}`);
      if (admins2 && admins2.length > 0) {
        return new Response(JSON.stringify({ ok: false, error: 'Admin already exists' }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 403,
        });
      }
    } else {
      // Since we used head: true, treat that as existing admin and block
      return new Response(JSON.stringify({ ok: false, error: 'Admin already exists' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    // No admin exists -> grant admin to current user
    const { error: insertError } = await supabase
      .from('user_roles')
      .insert({ user_id: user.id, role: 'admin' });

    if (insertError) throw new Error(`Error granting admin role: ${insertError.message}`);

    logStep("Admin role granted to user", { userId: user.id });

    return new Response(JSON.stringify({ ok: true, message: 'Admin role granted' }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message });
    return new Response(JSON.stringify({ ok: false, error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
