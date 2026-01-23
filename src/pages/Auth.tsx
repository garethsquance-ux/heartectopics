import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Heart, CheckCircle2, Lock, MessageCircle, Users } from "lucide-react";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
      }
    };
    checkUser();
  }, [navigate]);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Google Sign-in Error",
        description: error.message || "Failed to sign in with Google",
        variant: "destructive",
      });
      setGoogleLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast({
              title: "Login failed",
              description: "Invalid email or password. Please try again.",
              variant: "destructive",
            });
          } else {
            throw error;
          }
        } else {
          toast({
            title: "Welcome back!",
            description: "You've successfully signed in.",
          });
          navigate("/dashboard");
        }
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });

        if (error) {
          if (error.message.includes("already registered")) {
            toast({
              title: "Account exists",
              description: "This email is already registered. Please sign in instead.",
              variant: "destructive",
            });
          } else {
            throw error;
          }
        } else {
          // Send welcome email
          try {
            await supabase.functions.invoke("send-welcome-email", {
              body: { email },
            });
          } catch (emailError) {
            console.error("Failed to send welcome email:", emailError);
          }

          toast({
            title: "Account created!",
            description: "Welcome! Check your email for a welcome message.",
          });
          navigate("/dashboard");
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-accent/10 to-background p-4">
      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-6 items-start">
        {/* Founder Story Section */}
        <Card className="shadow-card border-primary/20 hidden md:block">
          <CardHeader>
            <div className="flex items-center gap-2 mb-3">
              <Heart className="h-6 w-6 text-primary" />
              <CardTitle className="text-xl">Why This Exists</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p className="text-muted-foreground leading-relaxed">
              I've lived with ectopic heartbeats since childhood. What started as innocent curiosity 
              became overwhelming fear. I've rushed to the hospital countless times, undergone multiple tests, 
              only to hear "they're benign, try not to worry."
            </p>
            <p className="text-muted-foreground leading-relaxed">
              But anyone living with this knows—you can't just "not worry." The psychological struggle 
              is real. The isolation is real.
            </p>
            <p className="text-muted-foreground leading-relaxed font-medium text-foreground">
              Through years of research, I discovered the gut-heart connection that actually helped me. 
              I built this platform because I know how hard this journey is, and no one should feel alone in it.
            </p>
            <div className="pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground italic">
                — Built by someone who truly understands
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Auth Form */}
        <Card className="w-full shadow-card">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Heart className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">
              {isLogin ? "Welcome back" : "Create account"}
            </CardTitle>
            <CardDescription>
              {isLogin
                ? "Sign in to track your heart health journey"
                : "Join a community that truly understands"}
            </CardDescription>
          </CardHeader>
        <CardContent>
          {/* Google Sign-in Button */}
          <Button
            type="button"
            variant="outline"
            className="w-full h-12 text-base font-medium mb-4 gap-3"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            {googleLoading ? "Connecting..." : `Continue with Google`}
          </Button>

          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="h-12"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-12 text-base font-medium"
              disabled={loading}
            >
              {loading ? "Please wait..." : isLogin ? "Sign in" : "Sign up"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary hover:underline font-medium"
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </button>
          </div>

          {!isLogin && (
            <div className="mt-6 pt-6 border-t border-border">
              <h3 className="text-sm font-semibold mb-3 text-center">Why create an account?</h3>
              <div className="space-y-2.5">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Track your episodes anywhere</p>
                    <p className="text-xs text-muted-foreground">Access your data from any device, anytime</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Lock className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Private & secure</p>
                    <p className="text-xs text-muted-foreground">Your health data is encrypted and protected</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MessageCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">AI wellness support</p>
                    <p className="text-xs text-muted-foreground">Get reassurance when you need it most</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Join the community</p>
                    <p className="text-xs text-muted-foreground">Connect with others who understand (with subscription)</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
};

export default Auth;