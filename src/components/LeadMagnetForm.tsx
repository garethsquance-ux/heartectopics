import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Gift, CheckCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const LeadMagnetForm = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes("@")) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Store the lead in the database
      const { error } = await supabase
        .from("email_leads")
        .insert({ email: email.trim().toLowerCase() });

      if (error) {
        if (error.code === "23505") {
          // Duplicate email - still show success
          setSubmitted(true);
        } else {
          throw error;
        }
      } else {
        // Track conversion (console log for now)
        console.log('[Analytics] lead_capture');
        
        // Send the guide email
        await supabase.functions.invoke("send-lead-magnet", {
          body: { email: email.trim().toLowerCase() },
        });

        setSubmitted(true);
        toast({
          title: "Check your inbox! 📧",
          description: "Your free guide is on its way.",
        });
      }
    } catch (error: any) {
      console.error("Lead capture error:", error);
      toast({
        title: "Something went wrong",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <Card className="p-8 bg-gradient-to-br from-primary/5 to-accent/20 border-primary/20 text-center">
        <CheckCircle className="h-12 w-12 text-primary mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">You're all set! 🎉</h3>
        <p className="text-muted-foreground">
          Check your inbox for your free guide. While you wait, why not create a free account to start tracking?
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6 md:p-8 bg-gradient-to-br from-primary/5 to-accent/20 border-primary/20">
      <div className="flex flex-col md:flex-row gap-6 items-center">
        <div className="flex-shrink-0">
          <div className="p-4 bg-primary/10 rounded-full">
            <Gift className="h-10 w-10 text-primary" />
          </div>
        </div>
        
        <div className="flex-1 text-center md:text-left">
          <h3 className="text-xl font-bold mb-1">
            Free Guide: 5 Ways to Reduce Ectopic Heartbeats Naturally
          </h3>
          <p className="text-muted-foreground text-sm mb-4">
            Science-backed strategies I've used personally. No spam, unsubscribe anytime.
          </p>
          
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 flex-1"
              required
            />
            <Button 
              type="submit" 
              className="h-12 px-6 whitespace-nowrap"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                "Get Free Guide"
              )}
            </Button>
          </form>
        </div>
      </div>
    </Card>
  );
};

export default LeadMagnetForm;
