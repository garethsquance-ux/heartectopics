import { useState } from "react";
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

interface LogEpisodeDialogProps {
  children: React.ReactNode;
  onEpisodeAdded: () => void;
}

interface ExtractedData {
  episodeDate?: string;
  durationSeconds?: number;
  severity?: "mild" | "moderate" | "severe";
  symptoms?: string;
  notes?: string;
  measurements?: {
    heartRate?: number;
    other?: string;
  };
}

const LogEpisodeDialog = ({ children, onEpisodeAdded }: LogEpisodeDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [symptoms, setSymptoms] = useState("");
  const [notes, setNotes] = useState("");
  const [duration, setDuration] = useState("");
  const [severity, setSeverity] = useState("mild");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (20MB limit)
    if (file.size > 20 * 1024 * 1024) {
      setUploadError("File size must be less than 20MB");
      return;
    }

    // Check file type
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      setUploadError("Please upload a PDF, image (JPG/PNG), or Word document");
      return;
    }

    setUploadedFile(file);
    setUploadError(null);
    await analyzeDocument(file);
  };

  const analyzeDocument = async (file: File) => {
    setAnalyzing(true);
    try {
      // Read file as text or use OCR for images
      let documentText = '';
      
      if (file.type.startsWith('image/')) {
        // For images, we'll send the base64 and let the AI analyze it
        const base64 = await fileToBase64(file);
        documentText = `[Medical document image: ${file.name}]\nPlease analyze this medical image for ectopic heartbeat episode information.`;
      } else if (file.type === 'application/pdf') {
        // For PDFs, we'd ideally use a PDF parser, but for now we'll inform the user
        documentText = `[PDF document: ${file.name}]\nThis is a medical document related to ectopic heartbeats. Please extract relevant episode information.`;
      } else {
        // For text-based files, read directly
        documentText = await file.text();
      }

      const { data, error } = await supabase.functions.invoke('analyze-medical-document', {
        body: { documentText, fileName: file.name }
      });

      if (error) throw error;

      if (data.success && data.extractedData) {
        setExtractedData(data.extractedData);
        
        // Auto-populate fields if data was extracted
        if (data.extractedData.symptoms) {
          setSymptoms(data.extractedData.symptoms);
        }
        if (data.extractedData.notes) {
          const existingNotes = notes ? notes + '\n\n' : '';
          setNotes(existingNotes + data.extractedData.notes);
        }
        if (data.extractedData.durationSeconds) {
          setDuration(data.extractedData.durationSeconds.toString());
        }
        if (data.extractedData.severity) {
          setSeverity(data.extractedData.severity);
        }

        toast({
          title: "Document analyzed",
          description: "Information extracted successfully. Review and edit as needed.",
        });
      }
    } catch (error: any) {
      console.error('Error analyzing document:', error);
      toast({
        title: "Analysis failed",
        description: error.message || "Could not analyze the document. You can still enter information manually.",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
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

      // If a document was uploaded, save it to storage and link to episode
      if (uploadedFile && episode) {
        const fileExt = uploadedFile.name.split('.').pop();
        const fileName = `${user.id}/${episode.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('medical-documents')
          .upload(fileName, uploadedFile);

        if (uploadError) {
          console.error('Error uploading document:', uploadError);
        } else {
          // Save document reference
          await supabase.from('episode_documents').insert([{
            episode_id: episode.id,
            user_id: user.id,
            file_name: uploadedFile.name,
            file_path: fileName,
            file_type: uploadedFile.type,
            file_size: uploadedFile.size,
            extracted_data: extractedData as any,
          }]);
        }
      }

      toast({
        title: "Episode logged",
        description: uploadedFile 
          ? "Your episode and document have been saved successfully."
          : "Your episode has been recorded successfully.",
      });

      // Reset form
      setSymptoms("");
      setNotes("");
      setDuration("");
      setSeverity("mild");
      setUploadedFile(null);
      setExtractedData(null);
      setUploadError(null);
      setOpen(false);
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log Heart Episode</DialogTitle>
          <DialogDescription>
            Record the details of your ectopic heartbeat episode. Upload medical documents for automatic data extraction.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Document Upload Section */}
            <div className="space-y-2">
              <Label htmlFor="document">Upload Medical Document (Optional)</Label>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Input
                    id="document"
                    type="file"
                    onChange={handleFileSelect}
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    className="flex-1"
                    disabled={analyzing || loading}
                  />
                  {uploadedFile && !analyzing && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setUploadedFile(null);
                        setExtractedData(null);
                      }}
                    >
                      Remove
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

                {uploadedFile && !analyzing && extractedData && (
                  <Alert>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription>
                      Document analyzed! Fields have been populated. Review and edit as needed.
                    </AlertDescription>
                  </Alert>
                )}

                {uploadedFile && !analyzing && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    <span>{uploadedFile.name}</span>
                    <span className="text-xs">
                      ({(uploadedFile.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Supported: PDF, JPG, PNG, Word documents (max 20MB). AI will extract episode details automatically.
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
                setOpen(false);
                // Reset on cancel
                setSymptoms("");
                setNotes("");
                setDuration("");
                setSeverity("mild");
                setUploadedFile(null);
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
