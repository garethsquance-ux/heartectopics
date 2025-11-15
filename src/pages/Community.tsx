import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Lock, Plus, Edit, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { CreatePostDialog } from "@/components/CreatePostDialog";
import { SEO } from "@/components/SEO";
import BottomNavigation from "@/components/BottomNavigation";
import FloatingWellnessChat from "@/components/FloatingWellnessChat";
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
  author_id: string;
  display_order: number | null;
}

const Community = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [draftPosts, setDraftPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deletePostId, setDeletePostId] = useState<string | null>(null);

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setLoading(false);
        return;
      }

      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id);

      const userHasAccess = roles?.some(r => r.role === 'subscriber' || r.role === 'admin') || false;
      const userIsAdmin = roles?.some(r => r.role === 'admin') || false;
      setHasAccess(userHasAccess);
      setIsAdmin(userIsAdmin);

      if (userHasAccess) {
        await fetchPosts();
        if (userIsAdmin) {
          await fetchDraftPosts();
        }
      }
    } catch (error) {
      console.error('Error checking access:', error);
      toast({
        title: "Error",
        description: "Failed to load community posts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('community_posts')
      .select('*')
      .eq('is_published', true)
      .order('display_order', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching posts:', error);
      return;
    }

    setPosts(data || []);
  };

  const fetchDraftPosts = async () => {
    const { data, error } = await supabase
      .from('community_posts')
      .select('*')
      .eq('is_published', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching drafts:', error);
      return;
    }

    setDraftPosts(data || []);
  };

  const handlePublishDraft = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('community_posts')
        .update({ is_published: true })
        .eq('id', postId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Post published successfully",
      });

      await fetchPosts();
      await fetchDraftPosts();
    } catch (error) {
      console.error('Error publishing post:', error);
      toast({
        title: "Error",
        description: "Failed to publish post",
        variant: "destructive",
      });
    }
  };

  const handlePostCreated = async () => {
    await fetchPosts();
    if (isAdmin) {
      await fetchDraftPosts();
    }
  };

  const handleDeletePost = async () => {
    if (!deletePostId) return;

    try {
      const { error } = await supabase
        .from('community_posts')
        .delete()
        .eq('id', deletePostId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Post deleted successfully",
      });

      await fetchPosts();
      await fetchDraftPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: "Error",
        description: "Failed to delete post",
        variant: "destructive",
      });
    } finally {
      setDeletePostId(null);
    }
  };

  const handleMovePost = async (postId: string, direction: 'up' | 'down') => {
    const currentIndex = posts.findIndex(p => p.id === postId);
    if (currentIndex === -1) return;
    
    const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (swapIndex < 0 || swapIndex >= posts.length) return;

    try {
      const currentPost = posts[currentIndex];
      const swapPost = posts[swapIndex];

      // Use a temporary value to avoid conflicts during swap
      const tempOrder = 9999;
      
      // Set current post to temp value first
      const { error: error1 } = await supabase
        .from('community_posts')
        .update({ display_order: tempOrder })
        .eq('id', currentPost.id);

      if (error1) throw error1;

      // Update swap post to current post's position
      const { error: error2 } = await supabase
        .from('community_posts')
        .update({ display_order: currentPost.display_order })
        .eq('id', swapPost.id);

      if (error2) throw error2;

      // Finally, move current post to swap position
      const { error: error3 } = await supabase
        .from('community_posts')
        .update({ display_order: swapPost.display_order })
        .eq('id', currentPost.id);

      if (error3) throw error3;

      await fetchPosts();
      
      toast({
        title: "Success",
        description: "Post order updated",
      });
    } catch (error) {
      console.error('Error reordering posts:', error);
      toast({
        title: "Error",
        description: "Failed to reorder posts",
        variant: "destructive",
      });
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      guide: "bg-primary/10 text-primary",
      research: "bg-blue-500/10 text-blue-500",
      medical_advances: "bg-green-500/10 text-green-500",
      studies: "bg-purple-500/10 text-purple-500",
      personal_stories: "bg-amber-500/10 text-amber-500",
    };
    return colors[category] || "bg-gray-500/10 text-gray-500";
  };

  const formatCategory = (category: string) => {
    return category.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Heart className="w-12 h-12 text-primary animate-pulse" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <>
        <SEO
          title="Community - Subscriber Only"
          description="Join our subscriber community for the latest research, medical advances, and peer support for ectopic heartbeats and PVCs."
          keywords="ectopic heartbeat community, PVC support group, heart palpitations forum"
        />
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pb-20 md:pb-0">
        <div className="container mx-auto px-4 py-12">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard')}
            className="mb-6"
          >
            ← Back to Dashboard
          </Button>

          <div className="max-w-2xl mx-auto text-center space-y-6">
            <Lock className="w-24 h-24 mx-auto text-muted-foreground" />
            <h1 className="text-4xl font-bold">Subscriber Community</h1>
            <p className="text-xl text-muted-foreground">
              Connect with others who understand your journey with ectopic heartbeats
            </p>
            
            <Card className="p-8 space-y-4 text-left">
              <h2 className="text-2xl font-semibold">What You'll Get:</h2>
              <ul className="space-y-2 text-muted-foreground">
                <li>✓ Latest research and medical advances</li>
                <li>✓ Peer support from people who understand</li>
                <li>✓ Moderated, spam-free environment</li>
                <li>✓ Personal stories and experiences</li>
                <li>✓ Evidence-based information</li>
              </ul>
            </Card>

            <div className="flex gap-4 justify-center">
              <Button onClick={() => navigate('/pricing')} size="lg">
                View Subscription Plans
              </Button>
              <Button 
                onClick={() => navigate('/dashboard')} 
                variant="outline" 
                size="lg"
              >
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
      </>
    );
  }

  return (
    <>
      <SEO
        title="Community - Ectopic Heartbeat Research & Support"
        description="Latest research, medical advances, and personal stories about ectopic heartbeats (PVCs). Connect with others who understand your journey with premature ventricular contractions."
        keywords="ectopic heartbeat research, PVC studies, heart palpitations support, premature ventricular contractions information, ectopic beat stories"
      />
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pb-20 md:pb-0">
      <div className="container mx-auto px-4 py-12">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/dashboard')}
          className="mb-6"
        >
          ← Back to Dashboard
        </Button>

        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold">Community</h1>
              <p className="text-muted-foreground mt-2">
                Latest updates, research, and stories from our community
              </p>
            </div>
            <div className="flex items-center gap-4">
              {isAdmin && (
                <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Create Post
                </Button>
              )}
              <Heart className="w-12 h-12 text-primary animate-pulse" />
            </div>
          </div>

          {isAdmin && draftPosts.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-2xl font-semibold">Draft Posts</h2>
              <div className="space-y-3">
                {draftPosts.map((post) => (
                  <Card 
                    key={post.id} 
                    className="p-6 space-y-3 border-dashed"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Draft</Badge>
                          <Badge className={getCategoryColor(post.category)}>
                            {formatCategory(post.category)}
                          </Badge>
                        </div>
                        <h2 className="text-2xl font-semibold">{post.title}</h2>
                        <p className="text-muted-foreground line-clamp-2">
                          {post.content.substring(0, 200)}...
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => handlePublishDraft(post.id)}
                        size="sm"
                      >
                        Publish Now
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => navigate(`/community/${post.id}`)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {posts.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">
                No posts yet. Check back soon for the latest updates!
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {posts.map((post, index) => (
                <Card 
                  key={post.id} 
                  className="p-6 space-y-3"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div 
                      className="flex-1 space-y-2 cursor-pointer"
                      onClick={() => navigate(`/community/${post.id}`)}
                    >
                      <div className="flex items-center gap-2">
                        <Badge className={getCategoryColor(post.category)}>
                          {formatCategory(post.category)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <h2 className="text-2xl font-semibold">{post.title}</h2>
                      <p className="text-muted-foreground line-clamp-2">
                        {post.content.substring(0, 200)}...
                      </p>
                    </div>
                    {isAdmin && (
                      <div className="flex flex-col gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMovePost(post.id, 'up');
                          }}
                          disabled={index === 0}
                        >
                          <ArrowUp className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMovePost(post.id, 'down');
                          }}
                          disabled={index === posts.length - 1}
                        >
                          <ArrowDown className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletePostId(post.id);
                          }}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => navigate(`/community/${post.id}`)}
                  >
                    Read More →
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <CreatePostDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onPostCreated={handlePostCreated}
      />

      <AlertDialog open={!!deletePostId} onOpenChange={() => setDeletePostId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
              All comments on this post will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePost} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
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

export default Community;
