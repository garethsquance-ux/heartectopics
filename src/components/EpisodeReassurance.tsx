import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Heart, TrendingDown, Award } from "lucide-react";

const EpisodeReassurance = () => {
  const [stats, setStats] = useState({
    totalEpisodes: 0,
    avgDuration: 0,
    episodeFreeStreak: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: episodes } = await supabase
      .from('heart_episodes')
      .select('*')
      .eq('user_id', session.user.id)
      .order('episode_date', { ascending: false });

    if (episodes) {
      const total = episodes.length;
      const withDuration = episodes.filter(e => e.duration_seconds);
      const avgDur = withDuration.length > 0
        ? Math.floor(withDuration.reduce((sum, e) => sum + (e.duration_seconds || 0), 0) / withDuration.length)
        : 0;

      setStats({
        totalEpisodes: total,
        avgDuration: avgDur,
        episodeFreeStreak: 0, // Will calculate properly later
      });
    }
  };

  return (
    <Card className="p-6 space-y-4 bg-card/50 backdrop-blur">
      <h3 className="font-semibold text-lg">Remember:</h3>
      
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <Heart className="h-5 w-5 text-primary mt-1" />
          <div>
            <p className="font-medium">You've handled this before</p>
            <p className="text-sm text-muted-foreground">
              You've successfully managed {stats.totalEpisodes} episodes
            </p>
          </div>
        </div>

        {stats.avgDuration > 0 && (
          <div className="flex items-start gap-3">
            <TrendingDown className="h-5 w-5 text-primary mt-1" />
            <div>
              <p className="font-medium">This will pass soon</p>
              <p className="text-sm text-muted-foreground">
                Your episodes typically last {Math.floor(stats.avgDuration / 60)} minutes
              </p>
            </div>
          </div>
        )}

        <div className="flex items-start gap-3">
          <Award className="h-5 w-5 text-primary mt-1" />
          <div>
            <p className="font-medium">Your heart is healthy</p>
            <p className="text-sm text-muted-foreground">
              Ectopic beats are benign and extremely common
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default EpisodeReassurance;
