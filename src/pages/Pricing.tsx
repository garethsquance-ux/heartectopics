import { Check, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Pricing = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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

  const handleSubscribe = () => {
    toast({
      title: "Coming Soon",
      description: "Stripe payment integration will be available soon. Contact us to subscribe manually.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-12">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/dashboard')}
          className="mb-6"
        >
          ← Back to Dashboard
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
              disabled={userRole === 'subscriber' || userRole === 'admin'}
            >
              {userRole === 'subscriber' || userRole === 'admin' ? 'Current Plan' : 'Subscribe Now'}
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
  );
};

export default Pricing;
