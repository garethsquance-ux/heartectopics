import { Book, UserPlus, ClipboardList, BarChart3, MessageCircleHeart, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import BottomNavigation from "@/components/BottomNavigation";
import FloatingWellnessChat from "@/components/FloatingWellnessChat";
import { SEO } from "@/components/SEO";

const HowTo = () => {
  const navigate = useNavigate();

  const steps = [
    {
      step: 1,
      icon: UserPlus,
      title: "Create Your Account",
      description: "Sign up with your email to get started. Your account keeps your data secure and synced across devices.",
      details: [
        "Click 'Get Started' on the homepage",
        "Enter your email and create a password",
        "Check your email to verify your account",
        "You're ready to start tracking!"
      ]
    },
    {
      step: 2,
      icon: ClipboardList,
      title: "Log Your First Episode",
      description: "Record when you feel ectopic heartbeats. The more you log, the better patterns you'll discover.",
      details: [
        "Click 'Log Episode' from your dashboard",
        "Select when the episode happened",
        "Rate the severity and duration",
        "Add any symptoms or notes",
        "Save to build your history"
      ]
    },
    {
      step: 3,
      icon: BarChart3,
      title: "View Your Patterns",
      description: "See trends over time to understand your triggers and track your progress.",
      details: [
        "View weekly and monthly statistics",
        "See your episode frequency trends",
        "Identify patterns in timing",
        "Export data for your doctor visits"
      ]
    },
    {
      step: 4,
      icon: MessageCircleHeart,
      title: "Chat with Heart Buddy AI",
      description: "Get 24/7 emotional support and answers to your questions about ectopic heartbeats.",
      details: [
        "Click the Heart Buddy button anytime",
        "Ask questions about what you're feeling",
        "Get reassurance during anxious moments",
        "Learn coping strategies and tips",
        "Remember: Not medical advice, but emotional support"
      ]
    },
    {
      step: 5,
      icon: Users,
      title: "Join the Community",
      description: "Connect with others who understand what you're going through (Subscriber feature).",
      details: [
        "Read posts from other members",
        "Share your experiences and tips",
        "Get peer support from people who get it",
        "Access the latest research and insights"
      ]
    }
  ];

  const tips = [
    {
      title: "Log Consistently",
      description: "Even on good days, note if you had zero episodes. This helps identify patterns."
    },
    {
      title: "Be Detailed",
      description: "Include what you ate, your stress level, sleep quality - these details reveal triggers."
    },
    {
      title: "Use Heart Buddy",
      description: "Don't suffer in silence. Talk to Heart Buddy when anxiety strikes."
    },
    {
      title: "Export Regularly",
      description: "Download your data before doctor appointments to show them your history."
    }
  ];

  return (
    <>
      <SEO 
        title="How to Use Heart Wellness App - Getting Started Guide"
        description="Complete guide to using the Heart Wellness app. Learn how to log episodes, use Heart Buddy AI, generate doctor letters, and connect with our community."
      />
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pb-20 md:pb-8">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="mb-6"
          >
            ← Home
          </Button>

          {/* Hero Section */}
          <div className="text-center space-y-4 mb-12">
            <Book className="w-16 h-16 mx-auto text-primary" />
            <h1 className="text-4xl font-bold">How to Use Heart Wellness</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Your step-by-step guide to managing ectopic heartbeats with confidence
            </p>
          </div>

          {/* Steps Section */}
          <div className="space-y-6 mb-16">
            {steps.map((step, index) => (
              <Card key={step.step} className="p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-primary" />
                <div className="flex gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <step.icon className="w-8 h-8 text-primary" />
                    </div>
                    <div className="text-center mt-2">
                      <span className="text-sm font-semibold text-primary">Step {step.step}</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-semibold mb-2">{step.title}</h2>
                    <p className="text-muted-foreground mb-4">{step.description}</p>
                    <ul className="space-y-2">
                      {step.details.map((detail, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <ArrowRight className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                          <span className="text-sm">{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className="absolute -bottom-3 left-8 w-0.5 h-6 bg-primary/30" />
                )}
              </Card>
            ))}
          </div>

          {/* Tips Section */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-center mb-8">💡 Pro Tips for Best Results</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {tips.map((tip, index) => (
                <Card key={index} className="p-4 bg-primary/5 border-primary/20">
                  <h3 className="font-semibold text-primary mb-1">{tip.title}</h3>
                  <p className="text-sm text-muted-foreground">{tip.description}</p>
                </Card>
              ))}
            </div>
          </div>

          {/* Important Reminder */}
          <Card className="p-6 bg-accent/50 border-accent mb-8">
            <h3 className="text-lg font-semibold mb-3">🩺 Important Reminder</h3>
            <p className="text-muted-foreground mb-4">
              This app is a <strong>support and tracking tool</strong>, not a medical device. It cannot detect, diagnose, or prevent heart conditions.
            </p>
            <p className="text-muted-foreground">
              Always consult your doctor for medical concerns. If your cardiologist has cleared you, remember: most ectopic heartbeats are benign in structurally normal hearts.
            </p>
          </Card>

          {/* CTA */}
          <div className="text-center space-y-4">
            <p className="text-lg">Ready to take control of your heart health?</p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button onClick={() => navigate('/auth')} size="lg">
                Get Started Free
              </Button>
              <Button variant="outline" onClick={() => navigate('/pricing')} size="lg">
                View Plans
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Questions? Contact: gareth@heartectopics.com
            </p>
          </div>
        </div>
      </div>
      <FloatingWellnessChat />
      <BottomNavigation />
    </>
  );
};

export default HowTo;
