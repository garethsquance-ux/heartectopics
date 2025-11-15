import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Calendar, AlertCircle, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

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
  onEdit?: (episode: Episode) => void;
}

const EpisodeList = ({ episodes, onUpdate, onEdit }: EpisodeListProps) => {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      const { error } = await supabase.from("heart_episodes").delete().eq("id", id);
      if (error) throw error;
      toast.success("Episode deleted");
      onUpdate();
    } catch (error) {
      toast.error("Failed to delete");
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };
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
            <div className="flex items-center gap-2">
              {episode.severity && (
                <Badge className={getSeverityColor(episode.severity)}>
                  {episode.severity}
                </Badge>
              )}
              {onEdit && (
                <Button variant="ghost" size="icon" onClick={() => onEdit(episode)} className="h-8 w-8">
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={() => setDeleteId(episode.id)} className="h-8 w-8 text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {episode.symptoms && (
            <div className="mb-2">
              <p className="text-sm font-medium text-foreground mb-1">Symptoms:</p>
              <p className="text-sm text-muted-foreground">{episode.symptoms}</p>
            </div>
          )}

          {episode.notes && (
            <div className="mb-2">
              {(() => {
                const encouragementMatch = episode.notes.match(/💚 POSITIVE REMINDER:\n(.+?)(?:\n\n|$)/s);
                const medicalNotesMatch = episode.notes.match(/MEDICAL NOTES:\n(.+)/s);
                
                return (
                  <>
                    {encouragementMatch && (
                      <div className="mb-3 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                        <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-1 flex items-center gap-2">
                          💚 Positive Reminder
                        </p>
                        <p className="text-sm text-emerald-900 dark:text-emerald-200 leading-relaxed">
                          {encouragementMatch[1].trim()}
                        </p>
                      </div>
                    )}
                    {medicalNotesMatch && (
                      <div>
                        <p className="text-sm font-medium text-foreground mb-1">Medical Notes:</p>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{medicalNotesMatch[1].trim()}</p>
                      </div>
                    )}
                    {!encouragementMatch && !medicalNotesMatch && (
                      <div>
                        <p className="text-sm font-medium text-foreground mb-1">Notes:</p>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{episode.notes}</p>
                      </div>
                    )}
                  </>
                );
              })()}
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

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Episode</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && handleDelete(deleteId)} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EpisodeList;