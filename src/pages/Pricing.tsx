import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Zap, Crown, Heart, Gift } from "lucide-react";
import { SEO } from "@/components/SEO";
import { analytics } from "@/lib/analytics";

const SUBSCRIBER_PRICE_ID = "price_1STmxKBv24OAipkGWPy0dkrD";
const PREMIUM_PRICE_ID = "price_1STmxgBv24OAipkGcdieqvG1";

const Pricing = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [currentTier, setCurrentTier] = useState<string | null>(null);

  useEffect(() => {
    checkCurrentTier();
  }, []);

  const checkCurrentTier = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id);

    if (roles && roles.length > 0) {
      setCurrentTier(roles[0].role);
    }
  };

  const handleSubscribe = async (priceId: string, withTrial: boolean = false) => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      toast({
        title: "Authentication required",
        description: "Please sign in to subscribe",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    setLoading(priceId);

    // Track analytics
    analytics.selectPlan(priceId === SUBSCRIBER_PRICE_ID ? 'subscriber' : 'premium');
    if (withTrial) {
      analytics.startTrial('subscriber');
    }
    analytics.startCheckout();

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId, withTrial }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create checkout session",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const tiers = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      icon: Heart,
      features: [
        "Basic episode logging",
        "5 AI chat messages/day",
        "2 document scans/month",
        "View community posts",
      ],
      cta: "Current Plan",
      current: currentTier === "free" || !currentTier,
      disabled: true,
    },
    {
      name: "Subscriber",
      price: "$9.99",
      period: "/month",
      icon: Zap,
      priceId: SUBSCRIBER_PRICE_ID,
      features: [
        "7-day free trial",
        "Unlimited episode logging",
        "20 AI chat messages/day",
        "20 document scans/month",
        "Post in community",
        "Basic trend charts",
        "Doctor letters",
        "Trigger tagging",
      ],
      cta: "Start Free Trial",
      current: currentTier === "subscriber",
      popular: true,
      hasTrial: true,
    },
    {
      name: "Premium",
      price: "$19.99",
      period: "/month",
      icon: Crown,
      priceId: PREMIUM_PRICE_ID,
      features: [
        "Everything in Subscriber",
        "During Episode emergency mode 🚨",
        "AI-powered trigger analysis",
        "Predictive insights",
        "Advanced visualizations",
        "Priority Heart Buddy support",
        "Enhanced community features",
      ],
      cta: "Go Premium",
      current: currentTier === "premium",
      premium: true,
    },
  ];

  return (
    <>
      <SEO 
        title="Pricing - Heart Harmony"
        description="Choose the perfect plan for managing your ectopic heartbeats. From free basic logging to premium anxiety relief features."
      />
      
      <div className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-background py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Urgency Banner */}
          <div className="mb-8 flex justify-center">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 border border-primary/30 px-6 py-3 rounded-full animate-pulse">
              <span className="text-2xl">🎉</span>
              <span className="font-semibold text-primary">Limited Time Offer:</span>
              <span className="text-foreground">Start your 7-day free trial today!</span>
            </div>
          </div>

          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
            <p className="text-xl text-muted-foreground">
              Get the support you need to manage your heart health
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {tiers.map((tier) => (
              <Card
                key={tier.name}
                className={`p-8 relative ${
                  tier.popular ? "border-primary shadow-lg scale-105" : ""
                } ${tier.premium ? "border-primary/60 bg-gradient-to-br from-primary/5 to-background" : ""} ${
                  tier.current ? "border-2 border-primary" : ""
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex gap-2">
                    <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}
                
                {tier.hasTrial && (
                  <div className="absolute -top-4 right-4">
                    <span className="bg-accent text-accent-foreground px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 border border-primary/20">
                      <Gift className="h-3 w-3" />
                      7-Day Free Trial
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <tier.icon className="h-12 w-12 mx-auto mb-4 text-primary" />
                  <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold">{tier.price}</span>
                    <span className="text-muted-foreground">{tier.period}</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="space-y-2">
                  <Button
                    className="w-full"
                    variant={tier.current ? "outline" : tier.premium ? "default" : "secondary"}
                    disabled={tier.disabled || tier.current || loading === tier.priceId}
                    onClick={() => tier.priceId && handleSubscribe(tier.priceId, tier.hasTrial || false)}
                  >
                    {loading === tier.priceId ? "Processing..." : tier.current ? "Current Plan" : tier.cta}
                  </Button>
                  
                  {tier.hasTrial && !tier.current && (
                    <p className="text-xs text-center text-muted-foreground">
                      No charge for 7 days. Cancel anytime.
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Pricing;
