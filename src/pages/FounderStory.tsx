import { Heart, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import BottomNavigation from "@/components/BottomNavigation";
import FloatingWellnessChat from "@/components/FloatingWellnessChat";

const FounderStory = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pb-20 md:pb-0">
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
              <h2 className="text-2xl font-semibold">When It All Began</h2>
              <p className="text-muted-foreground leading-relaxed">
                I can remember my first ectopic heartbeat as a child. That curious sensation—a flutter, a pause, then a strong beat. 
                Back then, I thought it was fascinating. "That was a really strong beat," I'd think to myself. There was no fear, 
                just innocent curiosity about what my heart was doing.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                But as I grew older, something changed. I learned fear. That innocent curiosity transformed into anxiety, then dread. 
                What I once found interesting became terrifying. These are PVCs—premature ventricular contractions—and they've been 
                my constant companion for as long as I can remember.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">The Spiral of Fear and PTSD</h2>
              <p className="text-muted-foreground leading-relaxed">
                I've rushed myself to the hospital on so many occasions. I've undergone multiple EP studies, countless tests, 
                doctor visits that all ended with the same message: "They're benign. Try not to worry." But anyone living with this 
                knows—you can't just "not worry."
              </p>
              <p className="text-muted-foreground leading-relaxed">
                The psychological struggle became overwhelming. I also suffer from PTSD, which compounded everything. The ectopics 
                would trigger panic. The panic would trigger more ectopics. It became a vicious cycle that drained so much time and 
                life out of me. I felt isolated, alone, like no one truly understood what I was going through.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">Discovering What Actually Helps</h2>
              <p className="text-muted-foreground leading-relaxed">
                Through my journey, I've discovered something profound: the connection between the gut and the heart is astronomical. 
                By working on my gut health, I've managed to reduce my ectopics significantly. It wasn't what the doctors told me 
                about, but it made a real difference.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Sleep matters—really matters. I'm constantly researching treatments, new studies, AI developments, anything that might 
                help. I look at all the angles because I know how hard this is psychologically, how isolated and alone people can feel.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">Why I Built This Platform</h2>
              <p className="text-muted-foreground leading-relaxed">
                I created this platform because I needed it to exist. I wanted a place where people could:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Track their episodes and discover their personal patterns and triggers</li>
                <li>Get immediate AI-powered support and reassurance during scary moments</li>
                <li>Connect with others who truly understand this struggle</li>
                <li>Access the latest research on treatments, including the gut-heart connection</li>
                <li>Know they're not alone in this experience</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                This isn't just an app—it's the support system I wish I'd had all those years ago when I was rushing to the hospital, 
                convinced something was seriously wrong, feeling utterly alone.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">The Power of Collective Understanding</h2>
              <p className="text-muted-foreground leading-relaxed">
                Here's what really excites me about this platform: <strong>nobody is collectively analysing ectopic data to find 
                patterns and similarities across thousands of people</strong>. Everyone is trying to figure it out individually, 
                in isolation. But what if we could pool our experiences together?
              </p>
              <p className="text-muted-foreground leading-relaxed">
                I want to use AI to analyse all the use cases—everyone's episodes, triggers, patterns, what helps, what doesn't.
                When we bring people's data together, we can discover connections that no individual would ever see on their own. 
                Maybe certain triggers affect people with specific characteristics. Maybe there are patterns between sleep quality, 
                gut health, and episode frequency that only become clear when we look at hundreds or thousands of cases.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                <strong>Collectively, this is more important than any one person trying to figure it out themselves.</strong> Every 
                episode you log, every trigger you identify, every note you make—it all contributes to a larger understanding that 
                could help everyone in our community. Together, we're not just tracking our own ectopics; we're building a knowledge 
                base that could reveal insights that have never been discovered before.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                This is why your participation matters. This is why sharing your experience in our community matters. We're not just 
                supporting each other emotionally—we're collectively advancing our understanding of these conditions in ways that 
                traditional research hasn't yet explored.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">Our Mission</h2>
              <p className="text-muted-foreground leading-relaxed">
                This platform exists to provide what I wish I had when I started this journey: accurate information, 
                peer support, tools to understand your own patterns, and—most importantly—<strong>the ability to contribute 
                to collective knowledge that helps everyone</strong>.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Every feature—from the episode tracker to the wellness chat to the pattern recognition analysis—is designed 
                with this dual purpose in mind: helping you understand your own experience while contributing to our 
                community's collective wisdom.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                I maintain a zero-tolerance policy for spam, scams, and sales pitches in our community. This is a safe 
                space for genuine support, medical information, shared experiences, and collaborative discovery.
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
      
      <FloatingWellnessChat />
      <BottomNavigation />
    </div>
  );
};

export default FounderStory;
