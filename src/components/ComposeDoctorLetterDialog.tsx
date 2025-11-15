import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ComposeDoctorLetterDialogProps {
  children: React.ReactNode;
  userRole: string;
}

const ComposeDoctorLetterDialog = ({ children, userRole }: ComposeDoctorLetterDialogProps) => {
  const [open, setOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [letter, setLetter] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  
  // Basic template fields for free users
  const [patientName, setPatientName] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [frequency, setFrequency] = useState("");
  const [impact, setImpact] = useState("");

  const { toast } = useToast();
  const isSubscriber = userRole === 'subscriber' || userRole === 'admin';

  const generateAILetter = async () => {
    try {
      setGenerating(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Authentication required",
          description: "Please log in to generate a letter.",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('generate-doctor-letter', {
        body: { additionalInfo },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      setLetter(data.letter);
      toast({
        title: "Letter generated! ✨",
        description: `Based on your ${data.episodeCount} logged episodes.`,
      });
    } catch (error) {
      console.error('Error generating letter:', error);
      toast({
        title: "Error",
        description: "Failed to generate letter. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const generateBasicLetter = () => {
    const basicLetter = `Dear Dr. ${doctorName || '[Doctor\'s Name]'},

I am writing to discuss my ongoing experiences with ectopic heartbeats and their impact on my daily life.

Symptoms and Frequency:
${symptoms || 'I have been experiencing irregular heartbeats that feel like flutters, skipped beats, or strong thumps.'}

${frequency || 'These episodes occur regularly and have been affecting my quality of life.'}

Impact on Daily Life:
${impact || 'These episodes cause anxiety and concern, affecting my ability to engage in normal activities with confidence.'}

I would appreciate the opportunity to discuss these symptoms further and explore appropriate diagnostic tests or management strategies.

Thank you for your attention to this matter.

Sincerely,
${patientName || '[Your Name]'}`;

    setLetter(basicLetter);
    toast({
      title: "Letter created",
      description: "You can now download or copy your letter.",
    });
  };

  const downloadLetter = () => {
    const blob = new Blob([letter], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `doctor-letter-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Downloaded",
      description: "Your letter has been downloaded.",
    });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(letter);
    toast({
      title: "Copied",
      description: "Letter copied to clipboard.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>Compose Letter to Doctor</DialogTitle>
            {isSubscriber && (
              <Badge variant="default" className="gap-1">
                <Sparkles className="w-3 h-3" />
                AI-Powered
              </Badge>
            )}
          </div>
          <DialogDescription>
            {isSubscriber 
              ? "Generate a professional letter using your logged episode data and AI analysis."
              : "Create a basic letter template to help communicate with your doctor. Upgrade to Subscriber for AI-powered letters with your episode data."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!isSubscriber ? (
            // Free user - Basic template
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="patientName">Your Name</Label>
                <Input
                  id="patientName"
                  placeholder="John Smith"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="doctorName">Doctor's Name</Label>
                <Input
                  id="doctorName"
                  placeholder="Dr. Sarah Johnson"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="symptoms">Describe Your Symptoms</Label>
                <Textarea
                  id="symptoms"
                  placeholder="e.g., I experience fluttering sensations, skipped beats, and strong thumps in my chest..."
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="frequency">How Often Do They Occur?</Label>
                <Textarea
                  id="frequency"
                  placeholder="e.g., Several times daily, particularly in the evening and after meals..."
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="impact">Impact on Your Life</Label>
                <Textarea
                  id="impact"
                  placeholder="e.g., These episodes cause significant anxiety and affect my sleep quality..."
                  value={impact}
                  onChange={(e) => setImpact(e.target.value)}
                  rows={3}
                />
              </div>

              {!letter && (
                <Button onClick={generateBasicLetter} className="w-full">
                  Generate Basic Letter
                </Button>
              )}

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">
                  💡 <strong>Upgrade to Subscriber</strong> for AI-powered letters that automatically analyze your logged episodes, 
                  identify patterns, and create professional medical documentation.
                </p>
              </div>
            </div>
          ) : (
            // Subscriber - AI-powered
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="additionalInfo">
                  Additional Context (Optional)
                </Label>
                <Textarea
                  id="additionalInfo"
                  placeholder="e.g., Recent triggers you've noticed, medications you're taking, specific concerns to mention..."
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  The AI will automatically include data from your logged episodes, frequency patterns, and severity trends.
                </p>
              </div>

              {!letter && (
                <Button 
                  onClick={generateAILetter} 
                  disabled={generating}
                  className="w-full gap-2"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analysing Your Episodes...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate AI-Powered Letter
                    </>
                  )}
                </Button>
              )}
            </div>
          )}

          {letter && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Your Letter</Label>
                <Textarea
                  value={letter}
                  onChange={(e) => setLetter(e.target.value)}
                  rows={18}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  You can edit the letter above before downloading or copying it.
                </p>
              </div>

              <div className="flex gap-2">
                <Button onClick={downloadLetter} variant="outline" className="flex-1 gap-2">
                  <Download className="w-4 h-4" />
                  Download
                </Button>
                <Button onClick={copyToClipboard} variant="outline" className="flex-1">
                  Copy to Clipboard
                </Button>
                <Button 
                  onClick={() => setLetter("")} 
                  variant="ghost"
                >
                  Start Over
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ComposeDoctorLetterDialog;
