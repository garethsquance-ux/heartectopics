import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, TrendingUp, MessageSquare, Users, Shield, BookCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import SuccessStoryManagement from "@/components/SuccessStoryManagement";

const emailSchema = z.object({
  email: z.string().trim().email({ message: "Invalid email address" }).max(255, { message: "Email must be less than 255 characters" })
});

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    subscribers: 0,
    dailyMessages: 0,
    monthlyMessages: 0,
    flaggedComments: 0,
    pendingStories: 0,
  });
  const [targetEmail, setTargetEmail] = useState("");
  const [roleAction, setRoleAction] = useState<'add' | 'remove'>('add');
  const [roleName, setRoleName] = useState<'subscriber' | 'moderator'>('subscriber');
  const [updatingRole, setUpdatingRole] = useState(false);

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/auth');
        return;
      }

      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id);

      const hasAdmin = roles?.some(r => r.role === 'admin') || false;
      setIsAdmin(hasAdmin);

      if (!hasAdmin) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access this page",
          variant: "destructive",
        });
        navigate('/dashboard');
        return;
      }

      await fetchStats();
    } catch (error) {
      console.error('Error checking admin:', error);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    // Fetch total users
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Fetch subscribers
    const { count: subscribers } = await supabase
      .from('user_roles')
      .select('*', { count: 'exact', head: true })
      .in('role', ['subscriber', 'admin']);

    // Fetch message stats
    const { data: usageData } = await supabase
      .from('user_chat_usage')
      .select('daily_count, monthly_count');

    const dailyMessages = usageData?.reduce((sum, u) => sum + (u.daily_count || 0), 0) || 0;
    const monthlyMessages = usageData?.reduce((sum, u) => sum + (u.monthly_count || 0), 0) || 0;

    // Fetch flagged comments
    const { count: flaggedComments } = await supabase
      .from('community_comments')
      .select('*', { count: 'exact', head: true })
      .eq('is_flagged', true);

    // Fetch pending success stories
    const { count: pendingStories } = await supabase
      .from('success_stories')
      .select('*', { count: 'exact', head: true })
      .eq('moderation_status', 'pending');

    setStats({
      totalUsers: totalUsers || 0,
      subscribers: subscribers || 0,
      dailyMessages,
      monthlyMessages,
      flaggedComments: flaggedComments || 0,
      pendingStories: pendingStories || 0,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Heart className="w-12 h-12 text-primary animate-pulse" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
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

        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground mt-2">
                Monitor usage, moderate community, and manage the platform
              </p>
            </div>
            <Shield className="w-12 h-12 text-primary" />
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-6 space-y-2">
              <div className="flex items-center justify-between">
                <Users className="w-8 h-8 text-primary" />
                <span className="text-3xl font-bold">{stats.totalUsers}</span>
              </div>
              <p className="text-sm text-muted-foreground">Total Users</p>
            </Card>

            <Card className="p-6 space-y-2">
              <div className="flex items-center justify-between">
                <TrendingUp className="w-8 h-8 text-green-500" />
                <span className="text-3xl font-bold">{stats.subscribers}</span>
              </div>
              <p className="text-sm text-muted-foreground">Subscribers</p>
            </Card>

            <Card className="p-6 space-y-2">
              <div className="flex items-center justify-between">
                <MessageSquare className="w-8 h-8 text-blue-500" />
                <span className="text-3xl font-bold">{stats.dailyMessages}</span>
              </div>
              <p className="text-sm text-muted-foreground">Messages Today</p>
            </Card>

            <Card className="p-6 space-y-2 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
              <div className="flex items-center justify-between">
                <BookCheck className="w-8 h-8 text-green-600" />
                <span className="text-3xl font-bold">{stats.pendingStories}</span>
              </div>
              <p className="text-sm text-muted-foreground">Stories Pending Review</p>
            </Card>
          </div>

          <Tabs defaultValue="stories" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="stories">
                Success Stories {stats.pendingStories > 0 && `(${stats.pendingStories})`}
              </TabsTrigger>
              <TabsTrigger value="moderation">
                Moderation {stats.flaggedComments > 0 && `(${stats.flaggedComments})`}
              </TabsTrigger>
              <TabsTrigger value="usage">Usage Stats</TabsTrigger>
              <TabsTrigger value="roles">Roles</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Card className="p-6">
                <h2 className="text-2xl font-semibold mb-4">Platform Overview</h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Conversion Rate</p>
                    <p className="text-2xl font-bold">
                      {stats.totalUsers > 0 
                        ? ((stats.subscribers / stats.totalUsers) * 100).toFixed(1)
                        : 0}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Messages/User/Day</p>
                    <p className="text-2xl font-bold">
                      {stats.totalUsers > 0 
                        ? (stats.dailyMessages / stats.totalUsers).toFixed(1)
                        : 0}
                    </p>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="stories" className="space-y-4">
              <SuccessStoryManagement />
            </TabsContent>

            <TabsContent value="moderation" className="space-y-4">
              <Card className="p-6">
                <h2 className="text-2xl font-semibold mb-4">Content Moderation</h2>
                {stats.flaggedComments > 0 ? (
                  <div className="space-y-2">
                    <p className="text-lg">
                      {stats.flaggedComments} comment(s) flagged for review
                    </p>
                    <Button onClick={() => {
                      toast({
                        title: "Coming Soon",
                        description: "Full moderation interface will be available soon",
                      });
                    }}>
                      Review Flagged Comments
                    </Button>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No flagged comments to review</p>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="usage" className="space-y-4">
              <Card className="p-6">
                <h2 className="text-2xl font-semibold mb-4">AI Usage Statistics</h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Daily AI Requests</p>
                    <p className="text-2xl font-bold">{stats.dailyMessages}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Monthly AI Requests</p>
                    <p className="text-2xl font-bold">{stats.monthlyMessages}</p>
                  </div>
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-2">
                      Estimated monthly cost (assuming £0.01 per request):
                    </p>
                    <p className="text-3xl font-bold text-primary">
                      £{(stats.monthlyMessages * 0.01).toFixed(2)}
                    </p>
                  </div>
                </div>
              </Card>
            </TabsContent>
            <TabsContent value="roles" className="space-y-4">
              <Card className="p-6 space-y-4">
                <h2 className="text-2xl font-semibold">Role Management</h2>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">User Email</Label>
                    <Input id="email" placeholder="user@example.com" value={targetEmail} onChange={(e) => setTargetEmail(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Action</Label>
                    <Select value={roleAction} onValueChange={(v) => setRoleAction(v as 'add' | 'remove')}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select action" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="add">Add</SelectItem>
                        <SelectItem value="remove">Remove</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select value={roleName} onValueChange={(v) => setRoleName(v as 'subscriber' | 'moderator')}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="subscriber">Subscriber</SelectItem>
                        <SelectItem value="moderator">Moderator</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={async () => {
                      try {
                        setUpdatingRole(true);
                        
                        // Validate email
                        const validation = emailSchema.safeParse({ email: targetEmail });
                        if (!validation.success) {
                          toast({ 
                            title: 'Validation Error', 
                            description: validation.error.errors[0].message, 
                            variant: 'destructive' 
                          });
                          setUpdatingRole(false);
                          return;
                        }
                        
                        const { data: { session } } = await supabase.auth.getSession();
                        if (!session) throw new Error('Not authenticated');
                        const { data, error } = await supabase.functions.invoke('manage-roles', {
                          headers: { Authorization: `Bearer ${session.access_token}` },
                          body: { action: roleAction, role: roleName, user_email: validation.data.email }
                        });
                        if (error) throw error;
                        if (data?.ok) {
                          toast({ title: 'Success', description: data.message || 'Role updated' });
                          setTargetEmail(''); // Clear input after success
                        } else {
                          throw new Error(data?.error || 'Unknown error');
                        }
                      } catch (err: any) {
                        toast({ title: 'Error', description: err.message || 'Failed to update role', variant: 'destructive' });
                      } finally {
                        setUpdatingRole(false);
                      }
                    }}
                    disabled={updatingRole || !targetEmail}
                  >
                    {updatingRole ? 'Updating...' : 'Apply'}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Tip: Add "subscriber" to grant community access. Use "admin" for full control.
                </p>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Admin;
