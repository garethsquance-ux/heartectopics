import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Plus, MessageCircle, LogOut, Activity, Users, BookOpen, Shield, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import EpisodeList from "@/components/EpisodeList";
import LogEpisodeDialog from "@/components/LogEpisodeDialog";
import WellnessChatDialog from "@/components/WellnessChatDialog";
import ExportDataButton from "@/components/ExportDataButton";

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('free');
  const [stats, setStats] = useState({ total: 0, thisWeek: 0, thisMonth: 0 });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkUser();
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        navigate('/auth');
      } else if (session?.user) {
        setUser(session.user);
        fetchUserRole(session.user.id);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/auth');
      return;
    }
    setUser(session.user);
    await fetchEpisodes();
    await fetchUserRole(session.user.id);
    setLoading(false);
  };

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .order('role', { ascending: true })
        .limit(1)
        .single();

      if (error) throw error;
      setUserRole(data?.role || 'free');
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  };

  const fetchEpisodes = async () => {
    const { data, error } = await supabase
      .from('heart_episodes')
      .select('*')
      .order('episode_date', { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load episodes",
        variant: "destructive",
      });
    } else {
      setEpisodes(data || []);
      calculateStats(data || []);
    }
  };

  const calculateStats = (episodesData: any[]) => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const thisWeek = episodesData.filter(ep => new Date(ep.episode_date) >= weekAgo).length;
    const thisMonth = episodesData.filter(ep => new Date(ep.episode_date) >= monthAgo).length;

    setStats({
      total: episodesData.length,
      thisWeek,
      thisMonth,
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-accent/10 to-background">
        <div className="text-center">
          <Heart className="h-12 w-12 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your wellness journey...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/10 to-background">
      <div className="container mx-auto p-4 md:p-8 max-w-7xl">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-full">
              <Heart className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Heart Wellness</h1>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-muted-foreground">Track and understand your episodes</p>
                <Badge variant={userRole === 'admin' ? 'default' : userRole === 'subscriber' ? 'secondary' : 'outline'}>
                  {userRole === 'admin' ? '👑 Admin' : userRole === 'subscriber' ? '⭐ Subscriber' : '🆓 Free'}
                </Badge>
              </div>
            </div>
          </div>
          <Button variant="outline" onClick={handleSignOut} className="gap-2">
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Episodes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{stats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">All time</p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                This Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{stats.thisWeek}</div>
              <p className="text-xs text-muted-foreground mt-1">Last 7 days</p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{stats.thisMonth}</div>
              <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-card mb-8 bg-gradient-to-r from-accent/30 to-accent/10 border-accent">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <CardTitle>Wellness Note</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground leading-relaxed">
              Remember: Most ectopic heartbeats are benign in structurally normal hearts. 
              If you've been cleared by a cardiologist, these are usually more bothersome than dangerous. 
              Stress, caffeine, and anxiety can make them feel worse. 
              <span className="block mt-2 font-medium text-primary">
                This app is for tracking and support only - not a substitute for medical advice.
              </span>
            </p>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-3 mb-6">
          <LogEpisodeDialog onEpisodeAdded={fetchEpisodes}>
            <Button className="gap-2 h-12" size="lg">
              <Plus className="h-5 w-5" />
              Log Episode
            </Button>
          </LogEpisodeDialog>

          <WellnessChatDialog>
            <Button variant="outline" className="gap-2 h-12" size="lg">
              <MessageCircle className="h-5 w-5" />
              Wellness Chat
            </Button>
          </WellnessChatDialog>

          <Button 
            variant="outline" 
            className="gap-2 h-12"
            size="lg"
            onClick={() => navigate('/community')}
          >
            <Users className="h-5 w-5" />
            Community
            {userRole === 'free' && (
              <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                Subscriber
              </span>
            )}
          </Button>

          <Button 
            variant="outline" 
            className="gap-2 h-12"
            size="lg"
            onClick={() => navigate('/founder-story')}
          >
            <BookOpen className="h-5 w-5" />
            Founder's Story
          </Button>

          {userRole === 'admin' && (
            <Button 
              variant="outline" 
              className="gap-2 h-12"
              size="lg"
              onClick={() => navigate('/admin')}
            >
              <Shield className="h-5 w-5" />
              Admin
            </Button>
          )}

          {userRole === 'free' && (
            <Button 
              className="gap-2 h-12"
              size="lg"
              onClick={() => navigate('/pricing')}
            >
              ⭐ Upgrade
            </Button>
          )}
          
          <ExportDataButton />
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Episode History</CardTitle>
            <CardDescription>
              Your recorded episodes and their details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EpisodeList episodes={episodes} onUpdate={fetchEpisodes} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;