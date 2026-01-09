import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { z } from "zod";

const emailSchema = z.string().email("Invalid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/scanner");
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
        return;
      }
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast.error("Invalid email or password");
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success("Welcome back!");
          navigate("/scanner");
        }
      } else {
        const { error } = await signUp(email, password);
        if (error) {
          if (error.message.includes("already registered")) {
            toast.error("This email is already registered. Please sign in.");
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success("Account created! You're now logged in.");
          navigate("/scanner");
        }
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background effects */}
      <div className="absolute inset-0 hud-grid opacity-10" />
      <div className="absolute inset-0 scanlines opacity-20" />
      
      <div className="glass w-full max-w-md p-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-3 h-3 bg-primary animate-pulse rounded-sm" />
            <span className="text-xl tracking-[0.3em] text-primary text-glow">VALUESTREAM</span>
            <div className="w-3 h-3 bg-primary animate-pulse rounded-sm" />
          </div>
          <h1 className="text-2xl text-foreground mb-2">
            {isLogin ? "SYSTEM ACCESS" : "CREATE IDENTITY"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {isLogin 
              ? "Enter credentials to access your audits" 
              : "Register to start scanning reality"
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs tracking-wider text-muted-foreground">
              EMAIL ADDRESS
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="agent@valuestream.io"
              className="bg-background/50 border-primary/30 focus:border-primary text-foreground placeholder:text-muted-foreground/50"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs tracking-wider text-muted-foreground">
              PASSWORD
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="bg-background/50 border-primary/30 focus:border-primary text-foreground"
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 tracking-wider"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                PROCESSING...
              </span>
            ) : isLogin ? (
              "AUTHENTICATE"
            ) : (
              "CREATE ACCOUNT"
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            {isLogin ? "Need an account? Register" : "Already have access? Sign in"}
          </button>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-primary/50" />
        <div className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 border-primary/50" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 border-primary/50" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-primary/50" />
      </div>
    </div>
  );
};

export default Auth;
