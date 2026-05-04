import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TrafficLights } from "@/components/TrafficLights";
import { GlowOrbs } from "@/components/GlowOrbs";

export const Hero = () => {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");

  const submit = () => {
    if (prompt.trim()) {
      sessionStorage.setItem("mira-pending-prompt", prompt.trim());
    }
    navigate("/ai");
  };

  return (
    <section id="home" className="relative pt-12 sm:pt-20 pb-20 sm:pb-32 overflow-hidden">
      <GlowOrbs />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-12 sm:mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted border border-border mb-6">
            <span className="size-1.5 rounded-full bg-mira-cyan animate-pulse" />
            <span className="text-[10px] sm:text-xs font-mono uppercase tracking-widest text-muted-foreground">
              System Online · v1.0
            </span>
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tighter mb-6 text-gradient-fade leading-[0.95]">
            What's on your mind?
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground font-light leading-relaxed max-w-[55ch]">
            Mira is the neural interface for advanced AI. Generate images, ship machine learning code, and command frontier intelligence — all in one workspace.
          </p>
        </div>

        <div id="chat-cta" className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          <div className="lg:col-span-5 space-y-6">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-mira rounded-xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity" />
              <div className="relative glass-panel rounded-xl p-1">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
                  }}
                  className="w-full bg-transparent text-base sm:text-lg p-5 min-h-[140px] placeholder:text-muted-foreground/60 resize-none outline-none"
                  placeholder="Describe a complex idea or ask a high-fidelity question..."
                />
                <div className="flex items-center justify-between p-3 border-t border-border/60">
                  <div className="flex gap-2 flex-wrap">
                    <span className="px-2 py-1 bg-muted rounded text-[10px] font-mono text-muted-foreground uppercase">Context: Active</span>
                    <span className="px-2 py-1 bg-muted rounded text-[10px] font-mono text-muted-foreground uppercase">Model: Llama 3.1</span>
                  </div>
                  <Button onClick={submit} size="sm" className="btn-mira gap-1.5 uppercase tracking-wider text-xs font-bold">
                    <Sparkles className="size-3.5" /> Execute
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { tag: "Code", title: "Train a vision transformer", color: "text-mira-blue" },
                { tag: "Image", title: "Generate concept art for a logo", color: "text-mira-pink" },
                { tag: "Reason", title: "Compare 3 system architectures", color: "text-mira-purple" },
                { tag: "Data", title: "Summarize a 50-page paper", color: "text-mira-cyan" },
              ].map((s) => (
                <button
                  key={s.title}
                  onClick={() => {
                    setPrompt(s.title);
                  }}
                  className="text-left glass-panel rounded-lg p-3 hover:bg-muted/40 transition-colors group"
                >
                  <div className={`text-[10px] font-bold uppercase tracking-widest ${s.color} mb-1`}>{s.tag}</div>
                  <div className="text-sm group-hover:text-foreground transition-colors">{s.title}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="glass-panel rounded-2xl overflow-hidden flex flex-col h-[480px] sm:h-[520px] shadow-2xl">
              <TrafficLights label="Console / mira-session-0842" />
              <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6 font-mono text-[12px] sm:text-[13px] leading-relaxed">
                <div className="flex gap-4 animate-fade-in">
                  <div className="text-mira-blue shrink-0">→</div>
                  <div className="text-muted-foreground">Map the risk vectors for the proposed orbital logistics network.</div>
                </div>
                <div className="flex gap-4 animate-fade-in" style={{ animationDelay: "0.2s" }}>
                  <div className="text-mira-pink shrink-0 font-semibold">MIRA</div>
                  <div className="text-foreground">
                    <p className="mb-3">Initiating high-fidelity risk assessment...</p>
                    <div className="space-y-2">
                      <Row color="bg-mira-blue" text="Atmospheric drag variance: 4.2% margin" />
                      <Row color="bg-mira-purple" text="Kessler Syndrome probability: 0.0034% / annum" />
                      <Row color="bg-mira-pink" text="Re-entry thermal degradation: Critical" />
                    </div>
                    <div className="mt-4 p-3 bg-muted/40 rounded-lg border border-border/60">
                      <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Suggested Mitigation</div>
                      <span className="text-foreground/90">Deploy secondary ablative shielding on Stage-2 modules; shift launch by +14ms.</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-4 animate-fade-in" style={{ animationDelay: "0.5s" }}>
                  <div className="text-mira-blue shrink-0 animate-pulse">_</div>
                  <div className="text-muted-foreground italic">Awaiting command...</div>
                </div>
              </div>
              <div className="h-9 px-4 flex items-center justify-between border-t border-border/60 bg-muted/30 text-[10px] text-muted-foreground font-mono uppercase tracking-widest">
                <span>Latency: 14ms</span>
                <span className="flex items-center gap-2">
                  <span className="size-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  Neural Sync: 99.8%
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 flex justify-center">
          <Button onClick={() => navigate("/ai")} variant="outline" className="gap-2 group">
            Open the workspace
            <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  );
};

const Row = ({ color, text }: { color: string; text: string }) => (
  <div className="flex items-center gap-3">
    <div className={`size-1.5 rounded-full ${color}`} />
    <span>{text}</span>
  </div>
);
