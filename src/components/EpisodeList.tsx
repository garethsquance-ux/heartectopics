import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, AlertCircle } from "lucide-react";

interface Episode {
  id: string;
  episode_date: string;
  symptoms?: string;
  notes?: string;
  duration_seconds?: number;
  severity?: string;
}

interface EpisodeListProps {
  episodes: Episode[];
  onUpdate: () => void;
}

const EpisodeList = ({ episodes, onUpdate }: EpisodeListProps) => {
  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'severe':
        return 'bg-destructive text-destructive-foreground';
      case 'moderate':
        return 'bg-warning text-warning-foreground';
      case 'mild':
        return 'bg-success text-success-foreground';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return null;
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (episodes.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
        <p className="text-muted-foreground text-lg">No episodes recorded yet</p>
        <p className="text-sm text-muted-foreground mt-2">
          Start logging your episodes to track your wellness journey
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {episodes.map((episode) => (
        <Card key={episode.id} className="p-4 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{format(new Date(episode.episode_date), 'PPp')}</span>
            </div>
            {episode.severity && (
              <Badge className={getSeverityColor(episode.severity)}>
                {episode.severity}
              </Badge>
            )}
          </div>

          {episode.symptoms && (
            <div className="mb-2">
              <p className="text-sm font-medium text-foreground mb-1">Symptoms:</p>
              <p className="text-sm text-muted-foreground">{episode.symptoms}</p>
            </div>
          )}

          {episode.notes && (
            <div className="mb-2">
              <p className="text-sm font-medium text-foreground mb-1">Notes:</p>
              <p className="text-sm text-muted-foreground">{episode.notes}</p>
            </div>
          )}

          {episode.duration_seconds && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Duration: {formatDuration(episode.duration_seconds)}</span>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};

export default EpisodeList;