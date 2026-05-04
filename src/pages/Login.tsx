import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { TrafficLights } from "@/components/TrafficLights";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

const Login = () => {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "login") await login(email, password);
      else await signup(name, email, password);
      toast.success(mode === "login" ? "Welcome back." : "Account created.");
      navigate("/account");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Auth failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Layout hideFooter>
      <div className="min-h-[calc(100dvh-4rem)] flex items-center justify-center px-4 py-12 relative">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 size-[500px] glow-orb animate-pulse-glow" />
        </div>
        <div className="w-full max-w-md">
          <Link to="/" className="flex items-center justify-center gap-2 mb-8">
            <div className="size-3 rounded-full bg-gradient-mira shadow-[0_0_15px_hsl(var(--mira-purple)/0.6)]" />
            <span className="text-xl font-bold tracking-tight">MIRA</span>
          </Link>

          <div className="glass-panel rounded-xl overflow-hidden">
            <TrafficLights label={mode === "login" ? "auth / login" : "auth / signup"} />
            <form onSubmit={submit} className="p-6 sm:p-8 space-y-5">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight mb-1">
                  {mode === "login" ? "Welcome back" : "Create your account"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {mode === "login" ? "Continue to your workspace." : "Start commanding intelligence in seconds."}
                </p>
              </div>

              {mode === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ada Lovelace" />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@domain.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
              </div>

              <Button type="submit" disabled={busy} className="btn-mira w-full gap-1.5">
                <Sparkles className="size-4" />
                {busy ? "Working..." : mode === "login" ? "Log in" : "Create account"}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                {mode === "login" ? (
                  <>Need an account?{" "}
                    <button type="button" onClick={() => setMode("signup")} className="text-foreground font-semibold hover:text-mira-purple">
                      Sign up
                    </button>
                  </>
                ) : (
                  <>Already have one?{" "}
                    <button type="button" onClick={() => setMode("login")} className="text-foreground font-semibold hover:text-mira-purple">
                      Log in
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>

          <p className="text-xs text-center text-muted-foreground mt-4 font-mono">
            Local auth · accounts stored on this device only
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Login;
