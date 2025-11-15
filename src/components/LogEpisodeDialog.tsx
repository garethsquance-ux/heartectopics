import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Episode {
  id: string;
  episode_date: string;
  severity?: string;
  symptoms?: string;
  notes?: string;
  duration_seconds?: number;
}

interface LogEpisodeDialogProps {
  children?: React.ReactNode;
  onEpisodeAdded: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  editEpisode?: Episode | null;
}

interface ExtractedData {
  episodeDate?: string;
  durationSeconds?: number;
  severity?: "mild" | "moderate" | "severe";
  symptoms?: string;
  notes?: string;
  encouragement?: string;
  measurements?: {
    heartRate?: number;
    other?: string;
  };
}

const LogEpisodeDialog = ({ children, onEpisodeAdded, open, onOpenChange, editEpisode }: LogEpisodeDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const dialogOpen = isControlled ? open : internalOpen;
  const setDialogOpen = isControlled ? (onOpenChange || (() => {})) : setInternalOpen;

  const [loading, setLoading] = useState(false);
  const [symptoms, setSymptoms] = useState("");
  const [notes, setNotes] = useState("");
  const [duration, setDuration] = useState("");
  const [severity, setSeverity] = useState("mild");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const { toast } = useToast();

  // Update form when editing an episode
  useEffect(() => {
    if (editEpisode) {
      setSymptoms(editEpisode.symptoms || "");
      setNotes(editEpisode.notes || "");
      setDuration(editEpisode.duration_seconds ? String(editEpisode.duration_seconds) : "");
      setSeverity(editEpisode.severity || "mild");
    } else if (!dialogOpen) {
      // Reset form when dialog closes and not editing
      setSymptoms("");
      setNotes("");
      setDuration("");
      setSeverity("mild");
      setUploadedFiles([]);
      setExtractedData(null);
      setUploadError(null);
    }
  }, [editEpisode, dialogOpen]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    // Validate all files
    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Check file size (20MB limit per file)
      if (file.size > 20 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds 20MB limit`,
          variant: "destructive",
        });
        continue;
      }

      // Check file type
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a supported format`,
          variant: "destructive",
        });
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length === 0) {
      setUploadError("No valid files selected");
      return;
    }

    setUploadedFiles(validFiles);
    setUploadError(null);
    await analyzeMultipleDocuments(validFiles);
  };

  const analyzeMultipleDocuments = async (files: File[]) => {
    setAnalyzing(true);
    const allEncouragements: string[] = [];
    const allNotes: string[] = [];
    const allSymptoms: string[] = [];
    let combinedDuration = 0;
    let highestSeverity: "mild" | "moderate" | "severe" = "mild";

    try {
      for (const file of files) {
        const result = await analyzeDocument(file);
        if (result) {
          if (result.encouragement) allEncouragements.push(result.encouragement);
          if (result.notes) allNotes.push(result.notes);
          if (result.symptoms) allSymptoms.push(result.symptoms);
          if (result.durationSeconds) combinedDuration += result.durationSeconds;
          if (result.severity) {
            const severities = { mild: 1, moderate: 2, severe: 3 };
            if (severities[result.severity] > severities[highestSeverity]) {
              highestSeverity = result.severity;
            }
          }
        }
      }

      // Combine all extracted data
      if (allSymptoms.length > 0) {
        setSymptoms([...new Set(allSymptoms)].join(', '));
      }

      if (allEncouragements.length > 0 || allNotes.length > 0) {
        let combinedNotes = '';
        
        if (allEncouragements.length > 0) {
          combinedNotes += `💚 POSITIVE REMINDERS:\n${allEncouragements.join('\n\n')}\n\n`;
        }
        
        if (allNotes.length > 0) {
          combinedNotes += `MEDICAL NOTES:\n${allNotes.join('\n\n')}`;
        }
        
        setNotes(combinedNotes);
      }

      if (combinedDuration > 0) {
        setDuration(combinedDuration.toString());
      }

      setSeverity(highestSeverity);

      toast({
        title: "All documents analyzed",
        description: `Successfully processed ${files.length} file(s). ${allEncouragements.length > 0 ? '✨ Positive findings extracted!' : ''}`,
      });
    } catch (error: any) {
      console.error('Error analyzing documents:', error);
      toast({
        title: "Analysis failed",
        description: "Some documents could not be analyzed. You can still enter information manually.",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const analyzeDocument = async (file: File): Promise<ExtractedData | null> => {
    setAnalyzing(true);
    try {
      let documentText = '';
      let imageData = '';
      
      // Handle different file types
      if (file.type === 'text/plain' || 
          file.type === 'application/msword' ||
          file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        documentText = await file.text();
      } else if (file.type.startsWith('image/')) {
        // For images, convert to base64 for vision analysis
        imageData = await fileToBase64(file);
      } else if (file.type === 'application/pdf') {
        // For PDFs, show error that proper extraction is not available yet
        setUploadError("PDF analysis requires proper text extraction. Please copy the text content from your PDF and save it as a .txt file, or take a photo/screenshot of the document instead.");
        setAnalyzing(false);
        return;
      } else {
        documentText = await file.text();
      }

      if (!documentText.trim() && !imageData) {
        setUploadError("Document appears to be empty or unreadable");
        return null;
      }

      const { data, error } = await supabase.functions.invoke('analyze-medical-document', {
        body: {
          documentText,
          imageData,
          fileName: file.name,
          fileType: file.type
        }
      });

      if (error) throw error;

      if (data.success && data.extractedData) {
        return data.extractedData;
      }
      
      return null;
    } catch (error: any) {
      console.error('Error analyzing document:', error);
      return null;
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("Not authenticated");
      }

      // Insert episode
      const { data: episode, error: episodeError } = await supabase
        .from('heart_episodes')
        .insert({
          user_id: user.id,
          symptoms: symptoms || null,
          notes: notes || null,
          duration_seconds: duration ? parseInt(duration) : null,
          severity,
        })
        .select()
        .single();

      if (episodeError) throw episodeError;

      // If documents were uploaded, save them to storage and link to episode
      if (uploadedFiles.length > 0 && episode) {
        for (const file of uploadedFiles) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${user.id}/${episode.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('medical-documents')
            .upload(fileName, file);

          if (uploadError) {
            console.error('Error uploading document:', uploadError);
          } else {
            // Save document reference
            await supabase.from('episode_documents').insert([{
              episode_id: episode.id,
              user_id: user.id,
              file_name: file.name,
              file_path: fileName,
              file_type: file.type,
              file_size: file.size,
              extracted_data: extractedData as any,
            }]);
          }
        }
      }

      toast({
        title: "Episode logged",
        description: uploadedFiles.length > 0
          ? `Your episode and ${uploadedFiles.length} document(s) have been saved successfully.`
          : "Your episode has been recorded successfully.",
      });

      // Reset form
      setSymptoms("");
      setNotes("");
      setDuration("");
      setSeverity("mild");
      setUploadedFiles([]);
      setExtractedData(null);
      setUploadError(null);
      setDialogOpen(false);
      onEpisodeAdded();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      {children && (
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editEpisode ? "Edit Episode" : "Log Heart Episode"}</DialogTitle>
          <DialogDescription>
            {editEpisode 
              ? "Update the details of this episode"
              : "Record the details of your ectopic heartbeat episode. Upload medical documents for automatic data extraction."
            }
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Document Upload Section */}
            <div className="space-y-2">
              <Label htmlFor="document">Upload Medical Document (Optional)</Label>
              <p className="text-xs text-muted-foreground">
                Best: Text files (.txt) or images (JPG/PNG with AI vision). Word docs also supported. AI extracts episode details automatically.
              </p>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Input
                    id="document"
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.txt"
                    className="flex-1"
                    disabled={analyzing || loading}
                  />
                  {uploadedFiles.length > 0 && !analyzing && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setUploadedFiles([]);
                        setExtractedData(null);
                      }}
                    >
                      Remove All
                    </Button>
                  )}
                </div>
                
                {uploadError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{uploadError}</AlertDescription>
                  </Alert>
                )}

                {analyzing && (
                  <Alert>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <AlertDescription>
                      Analyzing document with AI...
                    </AlertDescription>
                  </Alert>
                )}

                {uploadedFiles.length > 0 && !analyzing && extractedData && (
                  <Alert>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription>
                      Documents analyzed! Fields have been populated. Review and edit as needed.
                    </AlertDescription>
                  </Alert>
                )}

                {uploadedFiles.length > 0 && !analyzing && (
                  <div className="space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        <span>{file.name}</span>
                        <span className="text-xs">
                          ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Upload multiple files at once. For PDFs: Copy text content and save as .txt, or take a photo instead. Images use AI vision for automatic text extraction.
              </p>
            </div>

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
              <Label htmlFor="symptoms">Symptoms</Label>
              <Textarea
                id="symptoms"
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="Describe what you felt during this episode"
                className="min-h-[80px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (seconds)</Label>
              <Input
                id="duration"
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="How long did it last?"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any other details you'd like to record"
                className="min-h-[80px]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                // Reset on cancel
                setSymptoms("");
                setNotes("");
                setDuration("");
                setSeverity("mild");
                setUploadedFiles([]);
                setExtractedData(null);
                setUploadError(null);
              }}
              disabled={loading || analyzing}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || analyzing}>
              {loading ? "Saving..." : "Log Episode"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LogEpisodeDialog;
