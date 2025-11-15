import { Heart, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const FounderStory = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/dashboard')}
          className="mb-6"
        >
          ← Back to Dashboard
        </Button>

        <div className="space-y-8">
          <div className="text-center space-y-4">
            <Heart className="w-16 h-16 mx-auto text-primary animate-pulse" />
            <h1 className="text-4xl font-bold">Our Founder's Story</h1>
            <p className="text-xl text-muted-foreground">
              Living with ectopic heartbeats and building a community of support
            </p>
          </div>

          <div className="bg-card p-8 rounded-lg shadow-lg space-y-6">
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">The Journey Begins</h2>
              <p className="text-muted-foreground leading-relaxed">
                Like many of you, I experienced my first ectopic heartbeat unexpectedly. That sudden flutter, the pause, 
                the feeling that something was fundamentally wrong with my heart. It was terrifying. I rushed to the doctor, 
                convinced something serious was happening.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                After tests and consultations, I was told what many of you have heard: "They're harmless. Try not to worry about them." 
                But anyone who experiences ectopics knows that's easier said than done. The anxiety, the hyper-awareness of every 
                heartbeat, the fear that this time might be different—it consumed me.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">The Isolation</h2>
              <p className="text-muted-foreground leading-relaxed">
                What surprised me most wasn't the ectopic heartbeats themselves, but how isolated I felt. Friends and family, 
                while sympathetic, couldn't truly understand what it felt like. Online forums were filled with anxiety and worst-case 
                scenarios. I needed something different—a way to track my episodes, understand my patterns, and connect with 
                others who truly understood.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">Building This Community</h2>
              <p className="text-muted-foreground leading-relaxed">
                This app was born from that need. I wanted to create a space where people could:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Track their episodes and identify personal triggers</li>
                <li>Access AI-powered support for immediate reassurance (not medical advice, but understanding)</li>
                <li>Connect with others in a safe, moderated community</li>
                <li>Stay informed about the latest research and medical advances</li>
                <li>Feel less alone in their experience</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">Our Mission</h2>
              <p className="text-muted-foreground leading-relaxed">
                This platform exists to provide what I wish I had when I started this journey: accurate information, 
                peer support, and tools to take control of my experience. Every feature—from the episode tracker to the 
                wellness chat to the subscriber community—is designed with you in mind.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                I maintain a zero-tolerance policy for spam, scams, and sales pitches in our community. This is a safe 
                space for genuine support, medical information, and shared experiences.
              </p>
            </section>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-6 space-y-2">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-1" />
                <div className="space-y-2">
                  <h3 className="font-semibold text-amber-900 dark:text-amber-100">Important Medical Disclaimer</h3>
                  <p className="text-sm text-muted-foreground">
                    This platform provides information and peer support only. It is not a substitute for professional 
                    medical advice, diagnosis, or treatment. Always consult with qualified healthcare providers about 
                    your symptoms and concerns. If you experience chest pain, severe dizziness, or other concerning 
                    symptoms, seek immediate medical attention.
                  </p>
                </div>
              </div>
            </div>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">Thank You</h2>
              <p className="text-muted-foreground leading-relaxed">
                Thank you for being part of this community. Whether you're a free user tracking your episodes or a 
                subscriber engaging in our community forums, you're helping build something meaningful. Together, 
                we're creating a support network for people who understand what it's like to live with ectopic heartbeats.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                You're not alone in this journey.
              </p>
            </section>

            <div className="text-center pt-6">
              <p className="text-lg font-medium">With warmth and understanding,</p>
              <p className="text-2xl font-semibold text-primary mt-2">The Founder</p>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <Button onClick={() => navigate('/dashboard')} size="lg">
              Back to Dashboard
            </Button>
            <Button onClick={() => navigate('/pricing')} variant="outline" size="lg">
              View Subscription Plans
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FounderStory;
