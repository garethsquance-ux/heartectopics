import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import WellnessChatDialog from "@/components/WellnessChatDialog";

const FloatingWellnessChat = () => {
  return (
    <WellnessChatDialog>
      <Button
        size="lg"
        className="fixed bottom-20 right-4 md:bottom-6 md:right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 z-50"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    </WellnessChatDialog>
  );
};

export default FloatingWellnessChat;
