import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Mic, MicOff, Loader2 } from "lucide-react";

interface LogEpisodeDialogProps {
  children: React.ReactNode;
  onEpisodeAdded: () => void;
}

const LogEpisodeDialog = ({ children, onEpisodeAdded }: LogEpisodeDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [symptoms, setSymptoms] = useState("");
  const [notes, setNotes] = useState("");
  const [duration, setDuration] = useState("");
  const [severity, setSeverity] = useState("mild");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingField, setRecordingField] = useState<'notes' | 'symptoms' | null>(null);
  const [transcribing, setTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const startRecording = async (field: 'notes' | 'symptoms') => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await transcribeAudio(audioBlob, field);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingField(field);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Microphone access denied",
        description: "Please allow microphone access to use voice input",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingField(null);
    }
  };

  const transcribeAudio = async (audioBlob: Blob, field: 'notes' | 'symptoms') => {
    setTranscribing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = reader.result?.toString().split(',')[1];
        
        const { data, error } = await supabase.functions.invoke('transcribe-audio', {
          body: { audio: base64Audio },
        });

        if (error) throw error;

        if (field === 'notes') {
          setNotes(prev => prev ? `${prev} ${data.text}` : data.text);
        } else {
          setSymptoms(prev => prev ? `${prev} ${data.text}` : data.text);
        }

        toast({
          title: "Voice recorded",
          description: "Your voice note has been transcribed",
        });
      };
    } catch (error: any) {
      toast({
        title: "Transcription failed",
        description: error.message || "Failed to transcribe audio",
        variant: "destructive",
      });
    } finally {
      setTranscribing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("Not authenticated");
      }

      const { error } = await supabase.from('heart_episodes').insert({
        user_id: user.id,
        symptoms: symptoms || null,
        notes: notes || null,
        duration_seconds: duration ? parseInt(duration) : null,
        severity,
      });

      if (error) throw error;

      toast({
        title: "Episode logged",
        description: "Your episode has been recorded successfully.",
      });

      // Reset form
      setSymptoms("");
      setNotes("");
      setDuration("");
      setSeverity("mild");
      setOpen(false);
      onEpisodeAdded();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to log episode",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Log Heart Episode</DialogTitle>
          <DialogDescription>
            Record details about your ectopic heartbeat episode
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="severity">Severity</Label>
            <Select value={severity} onValueChange={setSeverity}>
              <SelectTrigger id="severity">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mild">Mild</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="severe">Severe</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="symptoms">Symptoms (optional)</Label>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => isRecording && recordingField === 'symptoms' ? stopRecording() : startRecording('symptoms')}
                disabled={transcribing || (isRecording && recordingField !== 'symptoms')}
                className="h-8 w-8 p-0"
              >
                {transcribing && recordingField === 'symptoms' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isRecording && recordingField === 'symptoms' ? (
                  <MicOff className="h-4 w-4 text-destructive" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>
            </div>
            <Textarea
              id="symptoms"
              placeholder="E.g., flutter in chest, skip feeling, palpitations..."
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              rows={3}
            />
            {isRecording && recordingField === 'symptoms' && (
              <p className="text-xs text-muted-foreground">Recording... Tap the mic to stop</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duration in seconds (optional)</Label>
            <Input
              id="duration"
              type="number"
              placeholder="E.g., 5"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              min="1"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="notes">Additional notes (optional)</Label>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => isRecording && recordingField === 'notes' ? stopRecording() : startRecording('notes')}
                disabled={transcribing || (isRecording && recordingField !== 'notes')}
                className="h-8 w-8 p-0"
              >
                {transcribing && recordingField === 'notes' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isRecording && recordingField === 'notes' ? (
                  <MicOff className="h-4 w-4 text-destructive" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>
            </div>
            <Textarea
              id="notes"
              placeholder="Any additional context, triggers, activities..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
            {isRecording && recordingField === 'notes' && (
              <p className="text-xs text-muted-foreground">Recording... Tap the mic to stop</p>
            )}
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Saving..." : "Log Episode"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LogEpisodeDialog;