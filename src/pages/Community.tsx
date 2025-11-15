import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Lock, Plus, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { CreatePostDialog } from "@/components/CreatePostDialog";
import { SEO } from "@/components/SEO";

interface Post {
  id: string;
  title: string;
  content: string;
  category: string;
  created_at: string;
  author_id: string;
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

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
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
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
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
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
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
              {posts.map((post) => (
                <Card 
                  key={post.id} 
                  className="p-6 space-y-3 cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => navigate(`/community/${post.id}`)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
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
                  </div>
                  <Button variant="ghost" size="sm">
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
    </div>
    </>
  );
};

export default Community;
