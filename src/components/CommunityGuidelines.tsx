import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Heart, AlertCircle } from "lucide-react";

export const CommunityGuidelines = () => {
  return (
    <Alert className="border-primary/20 bg-primary/5">
      <Heart className="h-5 w-5 text-primary" />
      <AlertTitle className="text-lg font-semibold mb-2">Community Guidelines</AlertTitle>
      <AlertDescription className="space-y-2 text-sm">
        <p>
          This is a supportive space for people experiencing ectopic heartbeats. Please be kind and respectful.
        </p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
          <li>Be empathetic - many here struggle with health anxiety</li>
          <li>Share experiences, not medical advice</li>
          <li>Respect that everyone's journey is different</li>
          <li>No commercial promotions or unverified treatments</li>
          <li>Flag inappropriate content - all comments are AI-moderated</li>
        </ul>
        <div className="flex items-start gap-2 mt-3 p-2 bg-background rounded">
          <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            <strong>Disclaimer:</strong> This community is for peer support only. Always consult qualified healthcare 
            professionals for medical advice. If you experience severe symptoms, seek immediate medical attention.
          </p>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Need help? Contact support at <a href="mailto:gareth@heartectopics.com" className="text-primary hover:underline">gareth@heartectopics.com</a>
        </p>
      </AlertDescription>
    </Alert>
  );
};
