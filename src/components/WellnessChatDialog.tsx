import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Send, Bot, User, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface WellnessChatDialogProps {
  children: React.ReactNode;
}

const WellnessChatDialog = ({ children }: WellnessChatDialogProps) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm 💙 Heart Buddy, your wellness companion. I'm here to provide support and information about ectopic heartbeats. How are you feeling today? Remember, I'm here for emotional support only - not medical advice.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState<'free' | 'subscriber' | 'admin'>('free');
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      checkUserRole();
    }
  }, [open]);

  const checkUserRole = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id);

    if (roles && roles.length > 0) {
      // Priority: admin > subscriber > free
      if (roles.some(r => r.role === 'admin')) {
        setUserRole('admin');
      } else if (roles.some(r => r.role === 'subscriber')) {
        setUserRole('subscriber');
      }
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke('wellness-chat-enhanced', {
        body: { message: userMessage },
        headers: session?.access_token ? {
          Authorization: `Bearer ${session.access_token}`
        } : undefined
      });

      if (error) {
        // Handle rate limiting specifically
        if (error.message?.includes('limit') || error.message?.includes('429')) {
          const errorMsg = error.context?.upgradeMessage || 
                          'You have reached your daily message limit. Upgrade to subscriber for 20 messages per day.';
          setMessages(prev => [...prev, { role: 'assistant', content: errorMsg }]);
          setLoading(false);
          return;
        }
        if (error.message?.includes('402')) {
          throw new Error('Service temporarily unavailable. Please try again later.');
        }
        throw error;
      }

      if (data?.message) {
        let responseContent = data.message;
        if (data.isCached) {
          responseContent += '\n\n💡 This answer was from our FAQ library.';
        }
        if (data.remaining !== undefined) {
          responseContent += `\n\n📊 Messages remaining today: ${data.remaining}/${data.limit}`;
        }
        setMessages(prev => [...prev, { role: 'assistant', content: responseContent }]);
      } else {
        throw new Error('No response from assistant');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to get response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl h-[600px] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            💙 Heart Buddy
          </DialogTitle>
          <DialogDescription>
            Your wellness companion for managing ectopic heartbeats
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6">
          <div className="space-y-4 pb-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex gap-3 items-start",
                  message.role === 'user' && "flex-row-reverse"
                )}
              >
                <div className="flex flex-col items-center gap-1">
                  <div className={cn(
                    "p-2 rounded-full shrink-0",
                    message.role === 'user' ? "bg-primary/10" : "bg-accent"
                  )}>
                    {message.role === 'user' ? (
                      <User className="h-5 w-5 text-primary" />
                    ) : (
                      <Bot className="h-5 w-5 text-foreground" />
                    )}
                  </div>
                  {message.role === 'user' && (userRole === 'subscriber' || userRole === 'admin') && (
                    <Badge variant={userRole === 'admin' ? 'default' : 'secondary'} className="text-xs px-1 py-0 h-4">
                      {userRole === 'admin' ? '👑' : '⭐'}
                    </Badge>
                  )}
                </div>
                <div
                  className={cn(
                    "rounded-2xl px-4 py-3 max-w-[80%]",
                    message.role === 'user'
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-3 items-start">
                <div className="p-2 rounded-full bg-accent shrink-0">
                  <Bot className="h-5 w-5 text-foreground animate-pulse" />
                </div>
                <div className="rounded-2xl px-4 py-3 bg-muted">
                  <p className="text-sm text-muted-foreground">Thinking...</p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-6 pt-4 border-t">
          <div className="flex gap-2">
            <Input
              placeholder="Ask Heart Buddy anything... (e.g., 'I felt a skip just now')"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              className="h-12"
            />
            <Button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              size="icon"
              className="h-12 w-12 shrink-0"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            This is support only - not medical advice. Contact your doctor for medical concerns.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WellnessChatDialog;