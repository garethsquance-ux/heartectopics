import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[MANAGE-ROLES] ${step}${detailsStr}`);
};

type ManageBody = {
  action: 'add' | 'remove';
  role: 'subscriber' | 'moderator' | 'admin';
  user_email: string;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } }
  );

  try {
    logStep('Function started');

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ ok: false, error: 'Authentication required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user?.id) {
      console.error('[MANAGE-ROLES] Auth failed:', userError?.message);
      return new Response(JSON.stringify({ ok: false, error: 'Authentication failed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }
    const caller = userData.user;
    logStep('Caller authenticated', { userId: caller.id });

    // Check caller is admin
    const { data: callerRoles, error: rolesErr } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', caller.id)
      .eq('role', 'admin')
      .limit(1);
    if (rolesErr) {
      console.error('[MANAGE-ROLES] Role check failed:', rolesErr.message);
      return new Response(JSON.stringify({ ok: false, error: 'Authorization check failed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }
    if (!callerRoles || callerRoles.length === 0) {
      return new Response(JSON.stringify({ ok: false, error: 'Access denied' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }

    let body: ManageBody;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ ok: false, error: 'Invalid request format' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }
    
    if (!body?.action || !body?.role || !body?.user_email) {
      return new Response(JSON.stringify({ ok: false, error: 'Invalid request' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }
    if (!['add', 'remove'].includes(body.action) || !['subscriber', 'moderator', 'admin'].includes(body.role)) {
      return new Response(JSON.stringify({ ok: false, error: 'Invalid request' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // SECURITY: Prevent anyone from modifying admin role via this endpoint
    if (body.role === 'admin') {
      return new Response(JSON.stringify({ ok: false, error: 'Operation not permitted' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }

    // Find target user by email in profiles table
    const { data: targetProfile, error: profErr } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', body.user_email)
      .single();

    if (profErr || !targetProfile) {
      console.error('[MANAGE-ROLES] User lookup failed:', profErr?.message);
      return new Response(JSON.stringify({ ok: false, error: 'Operation failed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    if (body.action === 'add') {
      const { error: insertErr } = await supabase
        .from('user_roles')
        .insert({ user_id: targetProfile.id, role: body.role as any });
      if (insertErr && insertErr.code !== '23505') { // ignore unique violation
        console.error('[MANAGE-ROLES] Insert failed:', insertErr.message);
        return new Response(JSON.stringify({ ok: false, error: 'Operation failed' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        });
      }
      logStep('Role added', { target: targetProfile.id, role: body.role });
      return new Response(JSON.stringify({ ok: true, message: 'Role added' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    } else {
      const { error: delErr } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', targetProfile.id)
        .eq('role', body.role);
      if (delErr) {
        console.error('[MANAGE-ROLES] Delete failed:', delErr.message);
        return new Response(JSON.stringify({ ok: false, error: 'Operation failed' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        });
      }
      logStep('Role removed', { target: targetProfile.id, role: body.role });
      return new Response(JSON.stringify({ ok: true, message: 'Role removed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }
  } catch (error) {
    console.error('[MANAGE-ROLES] Unexpected error:', error);
    return new Response(JSON.stringify({ ok: false, error: 'An error occurred' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
