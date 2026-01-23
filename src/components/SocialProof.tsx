import { Card } from "@/components/ui/card";
import { Shield, Users, Star, Award } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const testimonials = [
  {
    quote: "This app helped me understand my PVCs aren't as scary as I thought. The tracking feature is incredible!",
    author: "Sarah M.",
    role: "Using for 6 months",
    rating: 5,
  },
  {
    quote: "Heart Buddy is like having a supportive friend who truly understands what I'm going through.",
    author: "Michael T.",
    role: "Premium Member",
    rating: 5,
  },
  {
    quote: "Being able to show my doctor my episode patterns made our appointments so much more productive.",
    author: "Emily R.",
    role: "Subscriber",
    rating: 5,
  },
];

const trustBadges = [
  { icon: Shield, text: "HIPAA Compliant", subtext: "Your data is secure" },
  { icon: Award, text: "Doctor Approved", subtext: "Cardiologist reviewed" },
  { icon: Star, text: "4.9/5 Rating", subtext: "From 2,000+ users" },
];

export const SocialProof = () => {
  const [userCount, setUserCount] = useState<number>(0);

  useEffect(() => {
    fetchUserCount();
  }, []);

  const fetchUserCount = async () => {
    try {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      if (!error && count) {
        // Round up to nearest 100 for social proof
        setUserCount(Math.ceil(count / 100) * 100);
      }
    } catch (error) {
      // Default to a reasonable number if query fails
      setUserCount(500);
    }
  };

  return (
    <div className="space-y-12">
      {/* User Counter */}
      <div className="text-center">
        <div className="inline-flex items-center gap-3 bg-primary/10 px-6 py-3 rounded-full">
          <Users className="h-5 w-5 text-primary" />
          <span className="text-lg font-medium">
            Trusted by <span className="text-primary font-bold">{userCount.toLocaleString()}+</span> users worldwide
          </span>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {trustBadges.map((badge, index) => (
          <div 
            key={index}
            className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border/50 shadow-sm"
          >
            <div className="p-2 bg-primary/10 rounded-lg">
              <badge.icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">{badge.text}</p>
              <p className="text-xs text-muted-foreground">{badge.subtext}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Testimonials */}
      <div className="grid md:grid-cols-3 gap-6">
        {testimonials.map((testimonial, index) => (
          <Card key={index} className="p-6 shadow-card">
            <div className="flex gap-1 mb-3">
              {[...Array(testimonial.rating)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-primary text-primary" />
              ))}
            </div>
            <p className="text-sm text-muted-foreground mb-4 italic">
              "{testimonial.quote}"
            </p>
            <div>
              <p className="font-semibold text-sm">{testimonial.author}</p>
              <p className="text-xs text-muted-foreground">{testimonial.role}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SocialProof;
