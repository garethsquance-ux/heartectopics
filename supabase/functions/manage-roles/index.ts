import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const PERMANENT_ADMIN_EMAIL = 'garethsquance@gmail.com';

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
    if (!authHeader) throw new Error('No authorization header provided');

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const caller = userData.user;
    if (!caller?.id) throw new Error('User not authenticated');
    logStep('Caller authenticated', { userId: caller.id, email: caller.email });

    // Check caller is admin
    const { data: callerRoles, error: rolesErr } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', caller.id)
      .eq('role', 'admin')
      .limit(1);
    if (rolesErr) throw new Error(`Role check failed: ${rolesErr.message}`);
    if (!callerRoles || callerRoles.length === 0) {
      return new Response(JSON.stringify({ ok: false, error: 'Forbidden: admin only' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }

    const body = (await req.json()) as ManageBody;
    if (!body?.action || !body?.role || !body?.user_email) {
      throw new Error('Missing required fields: action, role, user_email');
    }
    if (!['add', 'remove'].includes(body.action)) throw new Error('Invalid action');
    if (!['subscriber', 'moderator', 'admin'].includes(body.role)) throw new Error('Invalid role');

    // SECURITY: Prevent anyone from modifying admin role except for the permanent admin
    if (body.role === 'admin') {
      return new Response(JSON.stringify({ 
        ok: false, 
        error: 'Forbidden: admin role cannot be modified via this endpoint' 
      }), {
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

    if (profErr || !targetProfile) throw new Error('Target user not found');

    if (body.action === 'add') {
      const { error: insertErr } = await supabase
        .from('user_roles')
        .insert({ user_id: targetProfile.id, role: body.role as any });
      if (insertErr && insertErr.code !== '23505') { // ignore unique violation
        throw new Error(`Failed to add role: ${insertErr.message}`);
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
      if (delErr) throw new Error(`Failed to remove role: ${delErr.message}`);
      logStep('Role removed', { target: targetProfile.id, role: body.role });
      return new Response(JSON.stringify({ ok: true, message: 'Role removed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logStep('ERROR', { message });
    return new Response(JSON.stringify({ ok: false, error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
