import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Brain, 
  Clock, 
  Calendar, 
  TrendingUp, 
  Lightbulb, 
  Heart,
  Loader2,
  RefreshCw
} from "lucide-react";

interface PatternInsights {
  timePattern: string;
  dayPattern: string;
  severityTrend: string;
  commonSymptoms: string[];
  possibleTriggers: string[];
  encouragement: string;
  tip: string;
}

interface PatternInsightsCardProps {
  episodeCount: number;
}

const PatternInsightsCard = ({ episodeCount }: PatternInsightsCardProps) => {
  const [insights, setInsights] = useState<PatternInsights | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const { toast } = useToast();

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase.functions.invoke('analyze-patterns', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.insights) {
        setInsights(data.insights);
      } else if (data?.message) {
        toast({
          title: "Not enough data",
          description: data.message,
        });
      }
    } catch (error: unknown) {
      console.error('Error fetching insights:', error);
      toast({
        title: "Error",
        description: "Failed to analyze patterns",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setHasLoaded(true);
    }
  };

  // Don't show if less than 3 episodes
  if (episodeCount < 3) {
    return null;
  }

  if (!hasLoaded && !loading) {
    return (
      <Card className="shadow-card bg-gradient-to-br from-primary/5 to-accent/10 border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Smart Pattern Insights</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Analyze your {episodeCount} episodes to discover patterns and get personalized insights.
          </p>
          <Button onClick={fetchInsights} className="gap-2">
            <Brain className="h-4 w-4" />
            Analyze My Patterns
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="shadow-card bg-gradient-to-br from-primary/5 to-accent/10 border-primary/20">
        <CardContent className="py-8">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Analyzing {episodeCount} episodes...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!insights) {
    return null;
  }

  return (
    <Card className="shadow-card bg-gradient-to-br from-primary/5 to-accent/10 border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Your Pattern Insights</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={fetchInsights} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Encouragement */}
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
          <div className="flex items-start gap-2">
            <Heart className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-emerald-800 dark:text-emerald-200">{insights.encouragement}</p>
          </div>
        </div>

        {/* Patterns Grid */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="p-3 bg-background/50 rounded-lg border">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-muted-foreground">Time Pattern</span>
            </div>
            <p className="text-sm">{insights.timePattern}</p>
          </div>

          <div className="p-3 bg-background/50 rounded-lg border">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-muted-foreground">Day Pattern</span>
            </div>
            <p className="text-sm">{insights.dayPattern}</p>
          </div>

          <div className="p-3 bg-background/50 rounded-lg border">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-muted-foreground">Severity Trend</span>
            </div>
            <p className="text-sm">{insights.severityTrend}</p>
          </div>

          {insights.possibleTriggers.length > 0 && (
            <div className="p-3 bg-background/50 rounded-lg border">
              <span className="text-xs font-medium text-muted-foreground block mb-1">Possible Triggers</span>
              <div className="flex flex-wrap gap-1">
                {insights.possibleTriggers.slice(0, 4).map((trigger, i) => (
                  <span key={i} className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 px-2 py-0.5 rounded-full">
                    {trigger}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Common Symptoms */}
        {insights.commonSymptoms.length > 0 && (
          <div>
            <span className="text-xs font-medium text-muted-foreground block mb-2">Common Symptoms</span>
            <div className="flex flex-wrap gap-1">
              {insights.commonSymptoms.map((symptom, i) => (
                <span key={i} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                  {symptom}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Tip */}
        <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-2">
            <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <span className="text-xs font-medium text-blue-800 dark:text-blue-200 block mb-1">Wellness Tip</span>
              <p className="text-sm text-blue-700 dark:text-blue-300">{insights.tip}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PatternInsightsCard;
