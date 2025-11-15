import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Heart, Flag, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { SEO } from "@/components/SEO";
import { CommunityGuidelines } from "@/components/CommunityGuidelines";
import { z } from "zod";
import BottomNavigation from "@/components/BottomNavigation";
import FloatingWellnessChat from "@/components/FloatingWellnessChat";
import ReactMarkdown from "react-markdown";

const commentSchema = z.object({
  content: z.string()
    .trim()
    .min(1, { message: "Comment cannot be empty" })
    .max(1000, { message: "Comment must be less than 1000 characters" })
    .refine(
      (val) => !/<script|javascript:|onerror=/i.test(val),
      { message: "Comment contains invalid content" }
    )
});
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Post {
  id: string;
  title: string;
  content: string;
  category: string;
  created_at: string;
  comments_enabled: boolean;
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null);

  useEffect(() => {
    checkUserRole();
    fetchPost();
    fetchComments();
  }, [postId]);

  const checkUserRole = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    setCurrentUserId(session.user.id);

    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id);

    const userIsAdmin = roles?.some(r => r.role === 'admin') || false;
    setIsAdmin(userIsAdmin);
  };

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
    // Validate comment
    const validation = commentSchema.safeParse({ content: newComment });
    if (!validation.success) {
      toast({
        title: "Validation Error",
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

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

    // AI moderation check
    try {
      const { data: moderationData, error: moderationError } = await supabase.functions.invoke(
        'moderate-content',
        { body: { content: validation.data.content } }
      );

      if (!moderationError && moderationData && !moderationData.safe) {
        toast({
          title: "Comment Not Allowed",
          description: moderationData.reason || "Your comment was flagged by our moderation system. Please be respectful and follow community guidelines.",
          variant: "destructive",
        });
        setSubmitting(false);
        return;
      }
    } catch (moderationError) {
      console.error('Moderation check failed:', moderationError);
      // Continue with posting if moderation service is unavailable
    }

    const { error } = await supabase
      .from('community_comments')
      .insert({
        post_id: postId,
        user_id: session.user.id,
        content: validation.data.content,
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

  const handleDeleteComment = async () => {
    if (!deleteCommentId) return;

    try {
      const { error } = await supabase
        .from('community_comments')
        .delete()
        .eq('id', deleteCommentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Comment deleted successfully",
      });

      fetchComments();
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: "Error",
        description: "Failed to delete comment",
        variant: "destructive",
      });
    } finally {
      setDeleteCommentId(null);
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
    <>
      <SEO
        title={post.title}
        description={post.content.substring(0, 155) + "..."}
        keywords={`${post.category.replace(/_/g, ' ')}, ectopic heartbeats, PVC, heart palpitations`}
        ogType="article"
        article={{
          publishedTime: post.created_at,
          section: post.category,
          tags: ['ectopic heartbeats', 'PVC', post.category.replace(/_/g, ' ')]
        }}
      />
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pb-20 md:pb-0">
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
            <div className="prose prose-lg max-w-none dark:prose-invert
              prose-headings:font-bold prose-headings:text-foreground
              prose-h1:text-3xl prose-h1:mb-4 prose-h1:mt-8 prose-h1:pb-2 prose-h1:border-b prose-h1:border-border
              prose-h2:text-2xl prose-h2:mb-3 prose-h2:mt-6 prose-h2:text-primary
              prose-h3:text-xl prose-h3:mb-2 prose-h3:mt-4 prose-h3:text-primary/80
              prose-p:text-base prose-p:leading-7 prose-p:mb-4 prose-p:text-foreground/90
              prose-strong:text-primary prose-strong:font-semibold
              prose-ul:my-4 prose-ul:space-y-2
              prose-li:text-foreground/90 prose-li:leading-relaxed
              animate-fade-in">
              <ReactMarkdown
                components={{
                  h1: ({node, ...props}) => <h1 className="flex items-center gap-2" {...props} />,
                  h2: ({node, ...props}) => <h2 className="flex items-center gap-2" {...props} />,
                  h3: ({node, ...props}) => <h3 className="flex items-center gap-2" {...props} />,
                  strong: ({node, ...props}) => <strong className="bg-primary/10 px-1 rounded" {...props} />,
                  ul: ({node, ...props}) => <ul className="space-y-2 ml-4" {...props} />,
                  li: ({node, ...props}) => (
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1.5 text-xs">●</span>
                      <span className="flex-1" {...props} />
                    </li>
                  ),
                }}
              >
                {post.content}
              </ReactMarkdown>
            </div>
          </Card>

          <CommunityGuidelines />

          {post.comments_enabled && (
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
                      <div className="flex gap-2">
                        {(isAdmin || comment.user_id === currentUserId) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteCommentId(comment.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
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
          )}
        </div>
      </div>

      <AlertDialog open={!!deleteCommentId} onOpenChange={() => setDeleteCommentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Comment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this comment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteComment} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <FloatingWellnessChat />
      <BottomNavigation />
    </div>
    </>
  );
};

export default CommunityPost;
