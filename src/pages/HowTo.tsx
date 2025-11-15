import { Book } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import BottomNavigation from "@/components/BottomNavigation";
import FloatingWellnessChat from "@/components/FloatingWellnessChat";
import { SEO } from "@/components/SEO";
import ReactMarkdown from "react-markdown";

const HowTo = () => {
  const navigate = useNavigate();

  const guideContent = `Welcome to Heart Wellness! 👋

This app was built by someone who lives with ectopic heartbeats, just like you. I'm constantly growing this platform, researching the latest information, and adding features based on what actually helps people manage ectopics.

## 📱 Main Features

### 1. Log Episodes
Click the "Log Episode" button to record when you feel ectopics. Track:
- When they happened
- How long they lasted
- What symptoms you felt
- How severe they were

Over time, you'll see patterns that can help you and your doctor.

### 2. 💙 Heart Buddy (AI Support)
Click "Heart Buddy" anytime you need support. It's available 24/7 to:
- Answer questions about ectopics
- Provide reassurance when you're anxious
- Explain what you're experiencing
- Help you understand your episodes

**Remember:** Heart Buddy is for emotional support, not medical advice. Always contact your doctor for medical concerns.

### 3. Doctor Letter
Generate a letter to your doctor that:
- **Free users:** Get a basic template you can customize
- **Subscribers:** Get an AI-powered letter based on your logged episodes

This makes it easier to communicate your symptoms to your healthcare provider.

### 4. Community (Subscribers)
Connect with others who understand what you're going through:
- Read the latest research
- Share experiences
- Get peer support
- Learn coping strategies

### 5. Export Your Data
Download all your logged episodes as a CSV file anytime. Your data belongs to you!

## 📊 Understanding Your Dashboard

Your dashboard shows:
- **Total Episodes:** All episodes you've logged
- **This Week:** Episodes in the last 7 days
- **This Month:** Episodes in the last 30 days

Use these stats to spot trends over time.

## 🔍 What I'm Working On

I'm constantly:
- Reading the latest research on ectopic heartbeats
- Adding new features based on user feedback
- Improving Heart Buddy with better responses
- Finding ways to make this app more helpful

This is a living, growing platform. If you have suggestions, please share them in the community!

## 🆘 Important Reminders

**This app is NOT:**
- A replacement for medical care
- Diagnostic in any way
- Able to detect or prevent ectopics

**This app IS:**
- A tracking and support tool
- A way to understand patterns
- A community of people who get it
- Constantly evolving to serve you better

## 💡 Tips for Best Results

1. **Log consistently** - Even on good days, note if you had zero episodes
2. **Be detailed** - The more info you track, the more patterns you'll see
3. **Use Heart Buddy** - Don't suffer in silence when you're anxious
4. **Check the community** - You're not alone in this
5. **Export regularly** - Keep backups of your data

## 📧 Need Help?

Contact: gareth@heartectopics.com

Remember: Most ectopic heartbeats are benign in structurally normal hearts. If your cardiologist has cleared you, these are usually more bothersome than dangerous.

You've got this! 💙`;

  return (
    <>
      <SEO 
        title="How to Use Heart Wellness App - Getting Started Guide"
        description="Complete guide to using the Heart Wellness app. Learn how to log episodes, use Heart Buddy AI, generate doctor letters, and connect with our community."
      />
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
              <Book className="w-16 h-16 mx-auto text-primary" />
              <h1 className="text-4xl font-bold">How to Use This App</h1>
              <p className="text-xl text-muted-foreground">
                Your complete guide to getting started
              </p>
            </div>

            <div className="bg-card p-8 rounded-lg shadow-lg">
              <div className="prose prose-lg max-w-none dark:prose-invert">
                <ReactMarkdown
                  components={{
                    h2: ({ children }) => (
                      <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">{children}</h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">{children}</h3>
                    ),
                    p: ({ children }) => (
                      <p className="text-muted-foreground leading-relaxed mb-4">{children}</p>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc list-inside space-y-2 mb-4 text-muted-foreground">{children}</ul>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-semibold text-foreground">{children}</strong>
                    ),
                  }}
                >
                  {guideContent}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      </div>
      <FloatingWellnessChat />
      <BottomNavigation />
    </>
  );
};

export default HowTo;
