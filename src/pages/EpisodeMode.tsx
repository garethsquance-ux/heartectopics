import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, MessageCircle } from "lucide-react";
import BreathingGuide from "@/components/BreathingGuide";
import EpisodeTimer from "@/components/EpisodeTimer";
import EpisodeReassurance from "@/components/EpisodeReassurance";
import WellnessChatDialog from "@/components/WellnessChatDialog";

const EpisodeMode = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [episodeId, setEpisodeId] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<Date>(new Date());
  const [userRole, setUserRole] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    checkAccess();
    createEpisodeRecord();
  }, []);

  const checkAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({
        title: "Authentication required",
        description: "Please sign in to use Episode Mode",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id);

    if (roles && roles.length > 0) {
      const role = roles[0].role;
      setUserRole(role);
      
      if (role !== 'premium' && role !== 'admin') {
        toast({
          title: "Premium feature",
          description: "During Episode mode is available for Premium subscribers",
          variant: "destructive",
        });
        navigate("/pricing");
      }
    }
  };

  const createEpisodeRecord = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase
      .from('heart_episodes')
      .insert({
        user_id: session.user.id,
        episode_date: new Date().toISOString(),
        notes: "Episode logged via Emergency Mode",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating episode:", error);
    } else if (data) {
      setEpisodeId(data.id);
    }
  };

  const handleEndEpisode = async () => {
    if (!episodeId) return;

    const duration = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);

    const { error } = await supabase
      .from('heart_episodes')
      .update({
        duration_seconds: duration,
        updated_at: new Date().toISOString(),
      })
      .eq('id', episodeId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save episode duration",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Episode recorded",
        description: `Duration: ${Math.floor(duration / 60)}m ${duration % 60}s`,
      });
    }

    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background flex flex-col items-center justify-center p-4">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4"
        onClick={() => navigate("/dashboard")}
      >
        <X className="h-6 w-6" />
      </Button>

      <div className="w-full max-w-4xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-primary">You're Safe</h1>
          <p className="text-xl text-muted-foreground">This will pass. Focus on your breathing.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-8 flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <BreathingGuide />
          </Card>

          <div className="space-y-6">
            <EpisodeTimer startTime={startTime} />
            <EpisodeReassurance />
            
            <WellnessChatDialog>
              <Button 
                className="w-full" 
                size="lg"
                variant="outline"
                onClick={() => setChatOpen(true)}
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                Talk to Heart Buddy
              </Button>
            </WellnessChatDialog>
          </div>
        </div>

        <div className="flex justify-center pt-4">
          <Button
            size="lg"
            onClick={handleEndEpisode}
            className="px-12"
          >
            Mark Episode as Ended
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EpisodeMode;
