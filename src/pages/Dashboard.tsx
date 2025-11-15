import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Plus, LogOut, Activity, Shield, TrendingUp, FileText, MessageCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import EpisodeList from "@/components/EpisodeList";
import LogEpisodeDialog from "@/components/LogEpisodeDialog";
import WellnessChatDialog from "@/components/WellnessChatDialog";
import ExportDataButton from "@/components/ExportDataButton";
import ComposeDoctorLetterDialog from "@/components/ComposeDoctorLetterDialog";
import FloatingWellnessChat from "@/components/FloatingWellnessChat";
import BottomNavigation from "@/components/BottomNavigation";
import DesktopNavigation from "@/components/DesktopNavigation";

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('free');
  const [stats, setStats] = useState({ total: 0, thisWeek: 0, thisMonth: 0 });
  const [managingSubscription, setManagingSubscription] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [editingEpisode, setEditingEpisode] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkUser();
    
    // Check for subscription success URL param
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('subscription') === 'success') {
      toast({
        title: "Welcome, Subscriber! 🎉",
        description: "Your subscription is now active. Enjoy full access to the community and enhanced features!",
      });
      // Clean URL
      window.history.replaceState({}, '', '/dashboard');
    }

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        navigate('/auth');
      } else if (session?.user) {
        setUser(session.user);
        fetchUserRole(session.user.id);
        checkSubscriptionStatus(session.access_token);
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
    await checkSubscriptionStatus(session.access_token);
    setLoading(false);
  };

  const checkSubscriptionStatus = async (accessToken: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (error) {
        console.error('Error checking subscription:', error);
        setHasActiveSubscription(false);
      } else if (data) {
        setHasActiveSubscription(data.subscribed === true);
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      setHasActiveSubscription(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      setManagingSubscription(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        throw error;
      }

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast({
        title: "Error",
        description: "Failed to open subscription management. Please try again.",
        variant: "destructive",
      });
    } finally {
      setManagingSubscription(false);
    }
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

  const handleEditEpisode = (episode: any) => {
    setEditingEpisode(episode);
    setShowEditDialog(true);
  };

  const handleEditDialogChange = (open: boolean) => {
    setShowEditDialog(open);
    if (!open) {
      setEditingEpisode(null);
    }
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
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/10 to-background pb-20 md:pb-0">
      <div className="container mx-auto p-4 md:p-8 max-w-7xl">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
          <div 
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity" 
            onClick={() => {
              const currentPath = window.location.pathname;
              if (currentPath !== '/dashboard') {
                navigate('/dashboard');
              }
            }}
          >
            <div className="p-2 bg-primary/10 rounded-full">
              <Heart className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Heart Wellness</h1>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-muted-foreground">Track and understand your episodes</p>
                <Badge variant={userRole === 'admin' ? 'default' : userRole === 'subscriber' || userRole === 'premium' ? 'secondary' : 'outline'}>
                  {userRole === 'admin' ? '👑 Admin' : userRole === 'premium' ? '💎 Premium' : userRole === 'subscriber' ? '⭐ Subscriber' : '🆓 Free'}
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <DesktopNavigation />
            <Button variant="outline" onClick={handleSignOut} className="gap-2">
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
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
              <span className="block mt-2 text-xs text-muted-foreground">
                Need help? Contact <a href="mailto:gareth@heartectopics.com" className="text-primary hover:underline">gareth@heartectopics.com</a>
              </span>
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          {/* Emergency Mode Button - Premium Feature */}
          {(userRole === 'premium' || userRole === 'admin') ? (
            <Button 
              className="gap-2 h-14 text-base w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white border-2 border-red-400/20 shadow-lg animate-pulse"
              size="lg"
              onClick={() => navigate('/episode-mode')}
            >
              <AlertCircle className="h-5 w-5" />
              🚨 Having Episode Now
            </Button>
          ) : (
            <Button 
              className="gap-2 h-14 text-base w-full border-red-600/30 hover:bg-red-50/50"
              size="lg"
              variant="outline"
              onClick={() => {
                toast({
                  title: "Premium Feature",
                  description: "During Episode mode is available for Premium subscribers. Upgrade to get instant calming support during episodes.",
                });
                navigate('/pricing');
              }}
            >
              <AlertCircle className="h-5 w-5 text-green-600" />
              🫀 During Episode Mode
              <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                Premium
              </span>
            </Button>
          )}

          <LogEpisodeDialog onEpisodeAdded={fetchEpisodes}>
            <Button className="gap-2 h-14 text-base w-full" size="lg">
              <Plus className="h-5 w-5" />
              Log Episode
            </Button>
          </LogEpisodeDialog>

          <WellnessChatDialog>
            <Button variant="outline" className="gap-2 h-14 text-base w-full" size="lg">
              <MessageCircle className="h-5 w-5" />
              💙 Heart Buddy
            </Button>
          </WellnessChatDialog>

          <ComposeDoctorLetterDialog userRole={userRole}>
            <Button variant="outline" className="gap-2 h-14 text-base w-full" size="lg">
              <FileText className="h-5 w-5" />
              Doctor Letter
              {!['subscriber', 'admin'].includes(userRole) && (
                <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                  Basic
                </span>
              )}
            </Button>
          </ComposeDoctorLetterDialog>

          {userRole === 'admin' && (
            <Button 
              variant="outline" 
              className="gap-2 h-14 text-base w-full"
              size="lg"
              onClick={() => navigate('/admin')}
            >
              <Shield className="h-5 w-5" />
              Admin Dashboard
            </Button>
          )}

          {userRole !== 'admin' && (
            <Button 
              variant="outline" 
              className="gap-2 h-12"
              size="lg"
              onClick={async () => {
                try {
                  const { data: { session } } = await supabase.auth.getSession();
                  if (!session) return;
                  const { data, error } = await supabase.functions.invoke('bootstrap-admin', {
                    headers: { Authorization: `Bearer ${session.access_token}` }
                  });
                  if (error) throw error;
                  if (data?.ok) {
                    toast({ title: 'Success!', description: 'You are now an admin. Refresh the page.' });
                    await fetchUserRole(session.user.id);
                  } else {
                    toast({ title: 'Info', description: data?.error || 'Admin already exists', variant: 'default' });
                  }
                } catch (err: any) {
                  toast({ title: 'Error', description: err.message, variant: 'destructive' });
                }
              }}
            >
              <Shield className="h-5 w-5" />
              Claim Admin (First Time)
            </Button>
          )}

          {hasActiveSubscription && (
            <Button 
              variant="outline" 
              className="gap-2 h-14 text-base w-full"
              size="lg"
              onClick={handleManageSubscription}
              disabled={managingSubscription}
            >
              <TrendingUp className="h-5 w-5" />
              {managingSubscription ? 'Opening...' : 'Manage Subscription'}
            </Button>
          )}

          {userRole === 'free' && (
            <Button 
              className="gap-2 h-14 text-base w-full"
              size="lg"
              onClick={() => navigate('/pricing')}
            >
              ⭐ Upgrade to Subscriber
            </Button>
          )}
          
          <div className="w-full">
            <ExportDataButton />
          </div>
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Episode History</CardTitle>
            <CardDescription>
              Your recorded episodes and their details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EpisodeList episodes={episodes} onUpdate={fetchEpisodes} onEdit={handleEditEpisode} />
          </CardContent>
        </Card>

        <LogEpisodeDialog 
          open={showEditDialog}
          onOpenChange={handleEditDialogChange}
          onEpisodeAdded={fetchEpisodes}
          editEpisode={editingEpisode}
        />
      </div>
      
      <FloatingWellnessChat />
      <BottomNavigation />
    </div>
  );
};

export default Dashboard;