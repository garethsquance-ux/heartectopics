import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Eye, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Story {
  id: string;
  title: string;
  story: string;
  submitted_at: string;
  moderation_status: string;
  user_id: string;
}

const SuccessStoryManagement = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedStory, setExpandedStory] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchPendingStories();
  }, []);

  const fetchPendingStories = async () => {
    try {
      const { data, error } = await supabase
        .from("success_stories")
        .select("*")
        .eq("moderation_status", "pending")
        .order("submitted_at", { ascending: false });

      if (error) throw error;
      setStories(data || []);
    } catch (error: any) {
      console.error("Error fetching stories:", error);
      toast({
        title: "Error",
        description: "Failed to load pending stories",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (storyId: string) => {
    try {
      const { error } = await supabase
        .from("success_stories")
        .update({
          moderation_status: "approved",
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", storyId);

      if (error) throw error;

      toast({
        title: "Story Approved",
        description: "The success story is now published",
      });

      fetchPendingStories();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to approve story",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (storyId: string) => {
    try {
      const { error } = await supabase
        .from("success_stories")
        .update({
          moderation_status: "rejected",
          reviewed_at: new Date().toISOString(),
          moderation_notes: "Did not meet community guidelines",
        })
        .eq("id", storyId);

      if (error) throw error;

      toast({
        title: "Story Rejected",
        description: "The story has been rejected",
      });

      fetchPendingStories();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reject story",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (storyId: string) => {
    if (!confirm("Are you sure you want to permanently delete this story?")) return;

    try {
      const { error } = await supabase
        .from("success_stories")
        .delete()
        .eq("id", storyId);

      if (error) throw error;

      toast({
        title: "Story Deleted",
        description: "The story has been permanently removed",
      });

      fetchPendingStories();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete story",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <p className="text-muted-foreground">Loading pending stories...</p>;
  }

  if (stories.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground">No pending success stories to review</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Pending Success Stories ({stories.length})
        </h3>
        <Button variant="outline" size="sm" onClick={fetchPendingStories}>
          Refresh
        </Button>
      </div>

      {stories.map((story) => (
        <Card key={story.id} className="p-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="text-xl font-semibold mb-2">{story.title}</h4>
                <p className="text-sm text-muted-foreground">
                  Submitted: {new Date(story.submitted_at).toLocaleDateString()}
                </p>
              </div>
              <Badge variant="outline">Pending Review</Badge>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              {expandedStory === story.id ? (
                <div className="space-y-2">
                  <p className="text-sm whitespace-pre-wrap">{story.story}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedStory(null)}
                  >
                    Show Less
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm line-clamp-3">{story.story}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedStory(story.id)}
                    className="gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    Read Full Story
                  </Button>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                onClick={() => handleApprove(story.id)}
                className="gap-2 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4" />
                Approve & Publish
              </Button>
              <Button
                onClick={() => handleReject(story.id)}
                variant="destructive"
                className="gap-2"
              >
                <XCircle className="h-4 w-4" />
                Reject
              </Button>
              <Button
                onClick={() => handleDelete(story.id)}
                variant="outline"
                className="gap-2 ml-auto"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default SuccessStoryManagement;
