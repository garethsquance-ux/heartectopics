import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Heart, Activity, MessageCircle, TrendingDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";

const Index = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      navigate('/dashboard');
    } else {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-accent/10 to-background">
        <Heart className="h-12 w-12 text-primary animate-pulse" />
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Ectopic Heartbeat Support & PVC Tracker"
        description="Understanding and managing ectopic heartbeats (PVCs) with confidence. Track episodes, view patterns, and get supportive guidance for premature ventricular contractions."
        keywords="ectopic heartbeats, PVC, premature ventricular contractions, heart palpitations, benign arrhythmia, heart rhythm tracker, ectopic beat anxiety, PVC symptoms, heart episode tracking"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": "Heart Wellness Tracker",
          "description": "Track and understand ectopic heartbeats with confidence",
          "applicationCategory": "HealthApplication",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
          },
          "featureList": [
            "Track heart episodes",
            "View patterns and statistics",
            "AI wellness support",
            "Community support"
          ]
        }}
      />
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/10 to-background">
      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-primary/10 rounded-full">
              <Heart className="h-16 w-16 text-primary" />
            </div>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Heart Wellness Tracker
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground mb-4 leading-relaxed">
            Understanding and managing ectopic heartbeats with confidence
          </p>

          <p className="text-base md:text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
            Track your episodes, understand patterns, and get supportive guidance.
            Non-diagnostic, support-focused wellness tool.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button
              size="lg"
              onClick={() => navigate('/auth')}
              className="h-14 px-8 text-lg font-medium"
            >
              Get Started
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/auth')}
              className="h-14 px-8 text-lg font-medium"
            >
              Sign In
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="p-6 rounded-2xl bg-card shadow-card">
              <div className="p-3 bg-primary/10 rounded-full w-fit mx-auto mb-4">
                <Activity className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Track Episodes</h3>
              <p className="text-muted-foreground">
                Log dates, symptoms, and notes about your ectopic heartbeat episodes
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-card shadow-card">
              <div className="p-3 bg-primary/10 rounded-full w-fit mx-auto mb-4">
                <TrendingDown className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">View Patterns</h3>
              <p className="text-muted-foreground">
                See statistics and trends in your episode history over time
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-card shadow-card">
              <div className="p-3 bg-primary/10 rounded-full w-fit mx-auto mb-4">
                <MessageCircle className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Get Support</h3>
              <p className="text-muted-foreground">
                Chat with AI for reassurance and general wellness information
              </p>
            </div>
          </div>

          <div className="mt-16 p-6 rounded-2xl bg-accent/20 border border-accent">
            <p className="text-sm text-foreground leading-relaxed">
              <strong className="text-primary">Important:</strong> This app is for tracking and emotional support only.
              It is not a medical device and cannot diagnose or treat conditions.
              Always consult with a healthcare professional for medical advice.
              If you experience chest pain, shortness of breath, or other concerning symptoms, seek immediate medical attention.
            </p>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default Index;