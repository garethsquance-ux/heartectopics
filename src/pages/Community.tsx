import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

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
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

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
      setHasAccess(userHasAccess);

      if (userHasAccess) {
        await fetchPosts();
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
    );
  }

  return (
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
            <Heart className="w-12 h-12 text-primary animate-pulse" />
          </div>

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
    </div>
  );
};

export default Community;
