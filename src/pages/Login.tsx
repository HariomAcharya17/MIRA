import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { TrafficLights } from "@/components/TrafficLights";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Sparkles, ShieldCheck, Fingerprint } from "lucide-react";
import { cn } from "@/lib/utils";

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
    const cleanEmail = email.trim();
    const cleanName = name.trim();
    try {
      if (mode === "login") await login(cleanEmail, password);
      else await signup(cleanName, cleanEmail, password);
      toast.success(mode === "login" ? "Identity verified." : "Credentials established.");
      navigate("/account");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication sequence failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Layout hideFooter>
      <div className="min-h-[calc(100dvh-4rem)] flex items-center justify-center px-4 py-12 relative overflow-hidden">
        <div className="w-full max-w-md relative z-10">
          <Link to="/" className="flex flex-col items-center gap-4 mb-10 group">
            <div className="size-16 rounded-2xl bg-gradient-mira flex items-center justify-center shadow-2xl shadow-mira-purple/30 group-hover:scale-110 transition-transform duration-500">
              <Fingerprint className="size-8 text-white" />
            </div>
            <div className="text-center">
              <span className="text-2xl font-bold tracking-tighter block">MIRA STUDIO</span>
              <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground opacity-60">Stratospheric Intelligence</span>
            </div>
          </Link>

          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-mira rounded-2xl blur-2xl opacity-10 group-hover:opacity-20 transition-opacity duration-700" />
            <div className="relative glass-panel rounded-2xl overflow-hidden border-white/5 shadow-2xl">
              <TrafficLights label={mode === "login" ? "uplink / authentication" : "uplink / registration"} />
              <form onSubmit={submit} className="p-8 sm:p-10 space-y-6">
                <div className="text-center sm:text-left">
                  <h1 className="text-2xl font-semibold tracking-tight mb-2">
                    {mode === "login" ? "Initialize Link" : "Create Identity"}
                  </h1>
                  <p className="text-sm text-muted-foreground font-light leading-relaxed">
                    {mode === "login" ? "Provide your credentials to access the neural workspace." : "Establish your neural signature to begin commanding frontier models."}
                  </p>
                </div>

                <div className="space-y-4">
                  {mode === "signup" && (
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground ml-1">Operator Name</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ada Lovelace"
                        className="h-11 bg-white/[0.02] border-white/5 focus:border-mira-purple/30 transition-all"
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground ml-1">Secure Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="operator@mira.io"
                      className="h-11 bg-white/[0.02] border-white/5 focus:border-mira-purple/30 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground ml-1">Cipher Key</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-11 bg-white/[0.02] border-white/5 focus:border-mira-purple/30 transition-all"
                    />
                  </div>
                </div>

                <Button type="submit" disabled={busy} className="btn-mira w-full h-11 gap-2 uppercase tracking-widest text-xs font-bold shadow-lg shadow-mira-purple/20">
                  {busy ? (
                    <span className="flex items-center gap-2">
                      <ShieldCheck className="size-4 animate-pulse" /> Verifying...
                    </span>
                  ) : (
                    <>
                      <Sparkles className="size-4" />
                      {mode === "login" ? "Execute Uplink" : "Establish Link"}
                    </>
                  )}
                </Button>

                <div className="text-center pt-2">
                  {mode === "login" ? (
                    <p className="text-xs text-muted-foreground font-light">
                      Awaiting identity?{" "}
                      <button type="button" onClick={() => setMode("signup")} className="text-mira-purple font-medium hover:text-mira-cyan transition-colors underline-offset-4 hover:underline">
                        Register here
                      </button>
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground font-light">
                      Already registered?{" "}
                      <button type="button" onClick={() => setMode("login")} className="text-mira-purple font-medium hover:text-mira-cyan transition-colors underline-offset-4 hover:underline">
                        Return to Uplink
                      </button>
                    </p>
                  )}
                </div>
              </form>
            </div>
          </div>

          <div className="flex items-center justify-center gap-6 mt-10 opacity-30 group-hover:opacity-60 transition-opacity">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-muted-foreground" />
            <p className="text-[9px] text-center text-muted-foreground font-mono uppercase tracking-[0.3em] whitespace-nowrap">
              Neural Cryptography Verified
            </p>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-muted-foreground" />
          </div>
        </div>
      </div>
    </Layout>
  );
};


export default Login;
