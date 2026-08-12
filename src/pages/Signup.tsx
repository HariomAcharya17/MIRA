import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { TrafficLights } from "@/components/TrafficLights";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Sparkles, ShieldCheck, Fingerprint, WifiOff, Globe } from "lucide-react";

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const { signup, isMock } = useAuth();
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanEmail = email.trim();

    if (!cleanName || !cleanEmail || !password || !confirmPassword) {
      toast.error("Please fill out all identity signature parameters.");
      return;
    }

    if (password.length < 6) {
      toast.error("Cipher key must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Cipher keys do not match. Verification failed.");
      return;
    }

    setBusy(true);
    try {
      await signup(cleanName, cleanEmail, password);
      toast.success("Credentials established. Neural workspace unlocked.");
      navigate("/account");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration sequence failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Layout hideFooter>
      <div className="min-h-[calc(100dvh-4rem)] flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
        <div className="w-full max-w-md relative z-10">
          
          <Link to="/" className="flex flex-col items-center gap-4 mb-8 group">
            <div className="size-16 rounded-2xl bg-gradient-mira flex items-center justify-center shadow-2xl shadow-mira-purple/30 group-hover:scale-110 transition-transform duration-500">
              <Fingerprint className="size-8 text-white" />
            </div>
            <div className="text-center">
              <span className="text-2xl font-bold tracking-tighter block">MIRA STUDIO</span>
              <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground opacity-60">Stratospheric Intelligence</span>
            </div>
          </Link>

          {/* Mode Banner Indicator */}
          <div className="mb-6 flex justify-center">
            {isMock ? (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 font-mono text-[10px] uppercase tracking-widest animate-pulse">
                <WifiOff className="size-3" />
                Offline Mock Mode Active
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[10px] uppercase tracking-widest">
                <Globe className="size-3" />
                Supabase Cloud Connected
              </div>
            )}
          </div>

          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-mira rounded-2xl blur-2xl opacity-10 group-hover:opacity-20 transition-opacity duration-700" />
            <div className="relative glass-panel rounded-2xl overflow-hidden border-white/5 shadow-2xl">
              <TrafficLights label="uplink // registration" />
              <form onSubmit={submit} className="p-8 sm:p-10 space-y-6">
                <div className="text-center sm:text-left">
                  <h1 className="text-2xl font-semibold tracking-tight mb-2">
                    Create Identity
                  </h1>
                  <p className="text-sm text-muted-foreground font-light leading-relaxed">
                    Establish your neural signature to begin commanding frontier models.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground ml-1">Operator Name</Label>
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ada Lovelace"
                      className="h-11 bg-white/[0.02] border-white/5 focus:border-mira-purple/30 transition-all text-sm"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground ml-1">Secure Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="operator@mira.io"
                      className="h-11 bg-white/[0.02] border-white/5 focus:border-mira-purple/30 transition-all text-sm"
                      required
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
                      className="h-11 bg-white/[0.02] border-white/5 focus:border-mira-purple/30 transition-all text-sm"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground ml-1">Verify Cipher Key</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-11 bg-white/[0.02] border-white/5 focus:border-mira-purple/30 transition-all text-sm"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" disabled={busy} className="btn-mira w-full h-11 gap-2 uppercase tracking-widest text-xs font-bold shadow-lg shadow-mira-purple/20">
                  {busy ? (
                    <span className="flex items-center gap-2">
                      <ShieldCheck className="size-4 animate-pulse" /> Establishing...
                    </span>
                  ) : (
                    <>
                      <Sparkles className="size-4" />
                      Establish Link
                    </>
                  )}
                </Button>

                <div className="text-center pt-2">
                  <p className="text-xs text-muted-foreground font-light">
                    Already registered?{" "}
                    <Link to="/login" className="text-mira-purple font-medium hover:text-mira-cyan transition-colors underline-offset-4 hover:underline">
                      Return to Uplink
                    </Link>
                  </p>
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

export default Signup;
