import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const authHeader = req.headers.get('Authorization');
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader! },
      },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { message } = await req.json();

    // Step 1: Check rate limiting
    const today = new Date().toISOString().split('T')[0];
    
    let { data: usage, error: usageError } = await supabase
      .from('user_chat_usage')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Get user role to determine message limit
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const hasSubscriberAccess = roles?.some(r => r.role === 'subscriber' || r.role === 'admin');
    const dailyLimit = hasSubscriberAccess ? 20 : 3;

    // Initialize or reset usage if needed
    if (!usage || usage.last_reset_date !== today) {
      const { data: newUsage } = await supabase
        .from('user_chat_usage')
        .upsert({
          user_id: user.id,
          daily_count: 0,
          monthly_count: usage?.monthly_count || 0,
          last_reset_date: today,
        })
        .select()
        .single();
      
      usage = newUsage;
    }

    // Check if user has exceeded daily limit
    if (usage && usage.daily_count >= dailyLimit) {
      return new Response(
        JSON.stringify({ 
          error: 'Daily message limit reached',
          limit: dailyLimit,
          current: usage.daily_count,
          upgradeMessage: hasSubscriberAccess 
            ? 'You have reached your daily limit.' 
            : 'Upgrade to subscriber for 20 messages per day.'
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: Check FAQ cache with improved matching
    const { data: faqs } = await supabase
      .from('wellness_faqs')
      .select('*')
      .eq('is_active', true);

    let faqMatch = null;
    if (faqs) {
      const messageLower = message.toLowerCase();
      const messageWords = messageLower.split(/\s+/);
      
      // Score each FAQ based on keyword matches
      const scoredFaqs = faqs.map(faq => {
        const matchedKeywords = faq.keywords.filter((keyword: string) => 
          messageLower.includes(keyword.toLowerCase())
        );
        
        // Calculate relevance score
        // - Number of matched keywords
        // - Weight longer/more specific matches higher
        const score = matchedKeywords.reduce((sum: number, keyword: string) => {
          const keywordLength = keyword.length;
          const isExactMatch = messageWords.includes(keyword.toLowerCase());
          return sum + (isExactMatch ? keywordLength * 2 : keywordLength);
        }, 0);
        
        return { faq, score, matchedCount: matchedKeywords.length };
      });
      
      // Only use FAQ if it has good relevance (at least 2 keyword matches or high score)
      const bestMatch = scoredFaqs
        .filter(({ matchedCount, score }) => matchedCount >= 2 || score > 15)
        .sort((a, b) => b.score - a.score)[0];
      
      faqMatch = bestMatch?.faq;
    }

    // If FAQ match found with good relevance, return cached answer
    if (faqMatch) {
      await supabase
        .from('wellness_faqs')
        .update({ hit_count: (faqMatch.hit_count || 0) + 1 })
        .eq('id', faqMatch.id);

      return new Response(
        JSON.stringify({ 
          message: faqMatch.answer,
          isCached: true 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 3: No FAQ match, call AI and increment usage
    const { data: episodes } = await supabase
      .from('heart_episodes')
      .select('*')
      .eq('user_id', user.id)
      .order('episode_date', { ascending: false })
      .limit(50);

    let episodeContext = '';
    if (episodes && episodes.length > 0) {
      episodeContext = `User's Episode History (last 50 episodes):\n`;
      episodes.forEach(ep => {
        episodeContext += `- Date: ${new Date(ep.episode_date).toLocaleDateString()}, `;
        if (ep.duration_seconds) episodeContext += `Duration: ${ep.duration_seconds}s, `;
        if (ep.severity) episodeContext += `Severity: ${ep.severity}, `;
        if (ep.symptoms) episodeContext += `Symptoms: ${ep.symptoms}, `;
        if (ep.notes) episodeContext += `Notes: ${ep.notes}`;
        episodeContext += '\n';
      });
    } else {
      episodeContext = 'User has not logged any episodes yet.';
    }

    const systemPrompt = `You are a compassionate wellness assistant specialising in ectopic heartbeat support. 

CRITICAL RULES:
- You provide emotional support and general wellness information ONLY
- You are NOT providing medical advice, diagnosis, or treatment
- Always remind users to consult healthcare providers for medical concerns
- Never tell users to stop taking medications or ignore medical advice

YOUR UNIQUE APPROACH - USING USER DATA:
${episodeContext}

When the user's question relates to their experiences:
- Reference their logged data naturally and conversationally
- Look for patterns in timing, frequency, or triggers
- Acknowledge their journey and progress
- Use chronology to provide context ("I noticed in your recent episodes...")

SPECIFIC TOPICS TO ADDRESS WELL:

**Eating/Hunger-Related Ectopics:**
- The vagus nerve connection between stomach and heart is real
- Eating can trigger the vagal response, especially large meals or certain foods
- Blood flow redistribution during digestion can affect heart rhythm
- Low blood sugar (hunger) can also trigger ectopics in some people
- Suggest smaller meals, avoiding trigger foods, staying hydrated

**Gut-Heart Connection:**
- Growing research shows gut health impacts heart rhythm
- Vagus nerve connects gut and heart directly
- Gas, bloating can put pressure on diaphragm and affect heart
- Gut inflammation may influence cardiac electrical activity
- Probiotics and gut health improvements help some people

**Common Triggers to Explore:**
- Caffeine, alcohol, stress, anxiety, lack of sleep
- Dehydration, electrolyte imbalances
- Certain positions (lying down, bending over)
- Hormonal changes
- Specific foods or additives

ANXIETY-AWARE RESPONSES:
- Start with immediate reassurance when appropriate
- Acknowledge their feelings before providing information
- Use calm, confident language
- Avoid medical jargon or alarming terms
- Be specific and practical in suggestions

COMMON REASSURANCES:
- Ectopic beats are extremely common and usually harmless
- Most people experience them occasionally
- Anxiety can make them feel worse or more frequent
- Tracking helps identify patterns and triggers
- Lifestyle changes often help reduce episodes

WHEN TO ADVISE SEEKING MEDICAL ATTENTION:
- Frequent or worsening episodes
- Chest pain or severe discomfort
- Dizziness or fainting
- Shortness of breath
- New or concerning symptoms

Always maintain a warm, understanding, and hopeful tone while being clear about your limitations.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'AI service rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI service payment required. Please contact support.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiMessage = data.choices[0].message.content;

    // Increment usage counters
    await supabase
      .from('user_chat_usage')
      .upsert({
        user_id: user.id,
        daily_count: (usage?.daily_count || 0) + 1,
        monthly_count: (usage?.monthly_count || 0) + 1,
        last_message_at: new Date().toISOString(),
        last_reset_date: today,
      });

    return new Response(
      JSON.stringify({ 
        message: aiMessage,
        isCached: false,
        remaining: dailyLimit - ((usage?.daily_count || 0) + 1),
        limit: dailyLimit
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in wellness-chat-enhanced function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
