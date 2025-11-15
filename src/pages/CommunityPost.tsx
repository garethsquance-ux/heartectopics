import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Heart, Flag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface Post {
  id: string;
  title: string;
  content: string;
  category: string;
  created_at: string;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  is_flagged: boolean;
}

const CommunityPost = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPost();
    fetchComments();
  }, [postId]);

  const fetchPost = async () => {
    const { data, error } = await supabase
      .from('community_posts')
      .select('*')
      .eq('id', postId)
      .eq('is_published', true)
      .single();

    if (error) {
      console.error('Error fetching post:', error);
      toast({
        title: "Error",
        description: "Failed to load post",
        variant: "destructive",
      });
      navigate('/community');
      return;
    }

    setPost(data);
    setLoading(false);
  };

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from('community_comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
      return;
    }

    setComments(data || []);
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    setSubmitting(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      toast({
        title: "Error",
        description: "You must be logged in to comment",
        variant: "destructive",
      });
      setSubmitting(false);
      return;
    }

    const { error } = await supabase
      .from('community_comments')
      .insert({
        post_id: postId,
        user_id: session.user.id,
        content: newComment,
      });

    if (error) {
      console.error('Error posting comment:', error);
      toast({
        title: "Error",
        description: "Failed to post comment",
        variant: "destructive",
      });
    } else {
      setNewComment("");
      fetchComments();
      toast({
        title: "Success",
        description: "Comment posted successfully",
      });
    }

    setSubmitting(false);
  };

  const handleFlagComment = async (commentId: string) => {
    const { error } = await supabase
      .from('community_comments')
      .update({ is_flagged: true, flagged_reason: 'User reported' })
      .eq('id', commentId);

    if (error) {
      console.error('Error flagging comment:', error);
      toast({
        title: "Error",
        description: "Failed to flag comment",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Comment has been flagged for review",
      });
      fetchComments();
    }
  };

  if (loading || !post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Heart className="w-12 h-12 text-primary animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-12">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/community')}
          className="mb-6"
        >
          ← Back to Community
        </Button>

        <div className="max-w-4xl mx-auto space-y-6">
          <Card className="p-8 space-y-4">
            <Badge className="w-fit">
              {post.category.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
            </Badge>
            <h1 className="text-4xl font-bold">{post.title}</h1>
            <p className="text-sm text-muted-foreground">
              Posted {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </p>
            <div className="prose prose-lg max-w-none dark:prose-invert">
              <p className="whitespace-pre-wrap">{post.content}</p>
            </div>
          </Card>

          <Card className="p-6 space-y-6">
            <h2 className="text-2xl font-semibold">Comments ({comments.length})</h2>
            
            <div className="space-y-4">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your thoughts..."
                rows={4}
              />
              <Button 
                onClick={handleSubmitComment}
                disabled={submitting || !newComment.trim()}
              >
                Post Comment
              </Button>
            </div>

            <div className="space-y-4">
              {comments.map((comment) => (
                <Card key={comment.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-2">
                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                      </p>
                      <p className="whitespace-pre-wrap">{comment.content}</p>
                    </div>
                    {!comment.is_flagged && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleFlagComment(comment.id)}
                      >
                        <Flag className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  {comment.is_flagged && (
                    <Badge variant="destructive" className="text-xs">
                      Flagged for review
                    </Badge>
                  )}
                </Card>
              ))}
              {comments.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No comments yet. Be the first to share your thoughts!
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CommunityPost;
