import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Heart, Send, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BottomNavigation from "@/components/BottomNavigation";
import FloatingWellnessChat from "@/components/FloatingWellnessChat";
import { SEO } from "@/components/SEO";

interface Story {
  id: string;
  title: string;
  story: string;
  submitted_at: string;
  moderation_status: string;
}

const SuccessStories = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [storyText, setStoryText] = useState("");
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      const { data, error } = await supabase
        .from("success_stories")
        .select("*")
        .eq("moderation_status", "approved")
        .order("submitted_at", { ascending: false });

      if (error) throw error;
      setStories(data || []);
    } catch (error: any) {
      console.error("Error fetching stories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to share your story",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      // Moderate content first
      const { data: moderation, error: moderationError } = await supabase.functions.invoke(
        "moderate-content",
        {
          body: {
            content: `${title}\n\n${storyText}`,
            type: "story",
          },
        }
      );

      if (moderationError) throw moderationError;

      if (!moderation.approved) {
        toast({
          title: "Content needs revision",
          description: moderation.reason || "Please review and revise your story",
          variant: "destructive",
        });
        return;
      }

      // Submit story
      const { error } = await supabase
        .from("success_stories")
        .insert({
          user_id: user.id,
          title,
          story: storyText,
          moderation_status: "pending",
        });

      if (error) throw error;

      toast({
        title: "Story submitted!",
        description: "Your story is being reviewed and will be published soon.",
      });

      setTitle("");
      setStoryText("");
      setShowForm(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit story",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/10 to-background p-4 flex items-center justify-center">
        <p className="text-muted-foreground">Loading stories...</p>
      </div>
    );
  }

  return (
    <>
      <SEO 
        title="Success Stories - Recovery from Ectopic Heartbeats"
        description="Read inspiring success stories from people who have overcome anxiety about ectopic heartbeats and PVCs. Real experiences of managing benign arrhythmia and finding peace."
        keywords="ectopic heartbeat recovery, PVC success stories, overcoming heart anxiety, heart palpitation testimonials, benign arrhythmia recovery"
      />
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/10 to-background pb-20 md:pb-0">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="mb-6"
          >
            ← Home
          </Button>

          <div className="space-y-8">
            <div className="text-center space-y-4">
              <Heart className="w-16 h-16 mx-auto text-primary animate-pulse" />
              <h1 className="text-4xl font-bold">Success Stories</h1>
              <p className="text-xl text-muted-foreground">
                Real stories from our community members
              </p>
            </div>

            {!showForm && (
              <Card>
                <CardHeader>
                  <CardTitle>Share Your Journey</CardTitle>
                  <CardDescription>
                    Inspire others by sharing your wellness story
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => setShowForm(true)} className="w-full">
                    <Send className="mr-2 h-4 w-4" />
                    Write Your Story
                  </Button>
                </CardContent>
              </Card>
            )}

        {showForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Share Your Story</CardTitle>
              <CardDescription>
                Your story will be reviewed before publication
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Give your story a title..."
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="story">Your Story</Label>
                  <Textarea
                    id="story"
                    value={storyText}
                    onChange={(e) => setStoryText(e.target.value)}
                    placeholder="Share your experience, challenges, and victories..."
                    className="min-h-[200px]"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Submitting..." : "Submit Story"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="space-y-6">
          {stories.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No stories yet. Be the first to share your journey!
              </CardContent>
            </Card>
          ) : (
            stories.map((story) => (
              <Card key={story.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-xl">{story.title}</CardTitle>
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  </div>
                  <CardDescription>
                    {new Date(story.submitted_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground whitespace-pre-wrap">
                    {story.story}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
      
      <FloatingWellnessChat />
      <BottomNavigation />
    </div>
  );
};

export default SuccessStories;
