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
    <Card className="p-6 space-y-4 bg-gradient-to-br from-green-50/50 to-green-100/30 border-green-200 backdrop-blur">
      <h3 className="font-semibold text-lg text-green-900">You've Got This:</h3>
      
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <Heart className="h-5 w-5 text-green-600 mt-1" />
          <div>
            <p className="font-medium text-green-900">You are a warrior</p>
            <p className="text-sm text-green-700">
              {stats.totalEpisodes > 0 
                ? `You've successfully overcome ${stats.totalEpisodes} ${stats.totalEpisodes === 1 ? 'episode' : 'episodes'} before this. You'll overcome this one too.`
                : "You've got this. Focus on your breathing and stay calm."}
            </p>
          </div>
        </div>

        {stats.avgDuration > 0 && (
          <div className="flex items-start gap-3">
            <TrendingDown className="h-5 w-5 text-green-600 mt-1" />
            <div>
              <p className="font-medium text-green-900">This feeling is temporary</p>
              <p className="text-sm text-green-700">
                Your past episodes lasted an average of {Math.floor(stats.avgDuration / 60)} {Math.floor(stats.avgDuration / 60) === 1 ? 'minute' : 'minutes'}. 
                This too shall pass.
              </p>
            </div>
          </div>
        )}

        {stats.totalEpisodes >= 5 && (
          <div className="flex items-start gap-3">
            <Award className="h-5 w-5 text-green-600 mt-1" />
            <div>
              <p className="font-medium text-green-900">You're stronger than you know</p>
              <p className="text-sm text-green-700">
                Every episode you've logged shows your courage in facing this. You're taking control of your health.
              </p>
            </div>
          </div>
        )}

        <div className="flex items-start gap-3">
          <Award className="h-5 w-5 text-green-600 mt-1" />
          <div>
            <p className="font-medium text-green-900">Your heart is strong and healthy</p>
            <p className="text-sm text-green-700">
              Ectopic beats are benign. Thousands of people experience them daily. You're safe.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default EpisodeReassurance;
