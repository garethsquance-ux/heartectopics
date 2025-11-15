import { Check, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SEO } from "@/components/SEO";

const Pricing = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      // Check subscription status from Stripe
      const { data: subData, error: subError } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (subError) {
        console.error('Error checking subscription:', subError);
      }

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .order('role', { ascending: true })
        .limit(1)
        .single();

      if (error) throw error;
      setUserRole(data?.role || 'free');
    } catch (error) {
      console.error('Error checking user role:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    try {
      setSubscribing(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        throw error;
      }

      if (data?.url) {
        // Open Stripe Checkout in new tab
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast({
        title: "Error",
        description: "Failed to start checkout process. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <>
      <SEO
        title="Pricing - Subscriber Support"
        description="Join our subscriber community for exclusive access to research, AI wellness chat, and peer support for ectopic heartbeats and PVCs. Free basic tracking or premium features for £5/month."
        keywords="ectopic heartbeat support subscription, PVC support community, heart palpitation premium features, heart wellness membership"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "Product",
          "name": "Heart Wellness Tracker Subscription",
          "description": "Premium access to ectopic heartbeat support community and wellness features",
          "offers": [
            {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "GBP",
              "name": "Free Plan"
            },
            {
              "@type": "Offer",
              "price": "5",
              "priceCurrency": "GBP",
              "name": "Subscriber Plan"
            }
          ]
        }}
      />
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-12">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')}
          className="mb-6"
        >
          ← Home
        </Button>

        <div className="text-center space-y-4 mb-12">
          <Heart className="w-16 h-16 mx-auto text-primary animate-pulse" />
          <h1 className="text-4xl font-bold">Choose Your Plan</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get the support you need to manage your heart health journey
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Free Plan */}
          <Card className="p-8 space-y-6 relative">
            {userRole === 'free' && (
              <div className="absolute top-4 right-4">
                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                  Current Plan
                </span>
              </div>
            )}
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Free</h2>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">£0</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </div>

            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span>Track unlimited heart episodes</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span>View episode history and statistics</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span>3 AI chat messages per day</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span>Basic doctor letter template</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span>Export your data to CSV</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span>Access to FAQ library</span>
              </li>
            </ul>

            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate('/auth')}
              disabled={!!userRole}
            >
              {userRole ? 'Current Plan' : 'Sign Up Free'}
            </Button>
          </Card>

          {/* Subscriber Plan */}
          <Card className="p-8 space-y-6 border-primary relative shadow-lg">
            {userRole === 'subscriber' && (
              <div className="absolute top-4 right-4">
                <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                  Current Plan
                </span>
              </div>
            )}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                Most Popular
              </span>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Subscriber</h2>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">£9.99</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </div>

            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="font-medium">Everything in Free, plus:</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span>20 AI chat messages per day</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span><strong>AI-powered doctor letters</strong> with episode analysis</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span>Full access to community forum</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span>Latest research and medical advances</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span>Connect with others who understand</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span>Moderated, spam-free environment</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span>Priority support</span>
              </li>
            </ul>

            <Button 
              className="w-full"
              onClick={handleSubscribe}
              disabled={subscribing || userRole === 'subscriber' || userRole === 'admin'}
            >
              {subscribing ? 'Opening Checkout...' : (userRole === 'subscriber' || userRole === 'admin' ? 'Current Plan' : 'Subscribe Now')}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Cancel anytime. No long-term commitment.
            </p>
          </Card>
        </div>

        <div className="mt-12 text-center space-y-4 max-w-2xl mx-auto">
          <h3 className="text-xl font-semibold">Why Subscribe?</h3>
          <p className="text-muted-foreground">
            Your subscription helps maintain this platform and supports the development of new features. 
            More importantly, it gives you access to a community of people who truly understand what 
            living with ectopic heartbeats feels like. You're not just getting features—you're getting 
            connection, understanding, and support.
          </p>
        </div>
      </div>
    </div>
    </>
  );
};

export default Pricing;
