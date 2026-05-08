import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Sparkles, Brain, Cpu, Zap, Activity, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TrafficLights } from "@/components/TrafficLights";
import { motion } from "framer-motion";

const InteractiveTitle = ({ text }: { text: string }) => {
  return (
    <h1 className="text-5xl sm:text-6xl lg:text-8xl font-bold tracking-tighter mb-8 text-foreground leading-[0.9] lg:leading-[0.85]">
      {text.split(" ").map((word, wi) => (
        <span key={wi} className="inline-block mr-[0.25em] last:mr-0">
          {word.split("").map((letter, li) => (
            <span
              key={li}
              className="inline-block cursor-default"
              style={{ transition: `color 0.3s ease, text-shadow 0.3s ease, transform 0.3s ease` }}
              onMouseEnter={(e) => {
                const el = e.currentTarget;
                el.style.color = "hsl(260, 80%, 75%)";
                el.style.textShadow = `
                  0 0 8px hsl(260 80% 70% / 0.9),
                  0 0 20px hsl(260 70% 65% / 0.7),
                  0 0 40px hsl(255 70% 60% / 0.5),
                  0 0 80px hsl(255 60% 55% / 0.3)
                `;
                el.style.transform = "translateY(-2px) scale(1.08)";
                const parent = el.parentElement;
                if (!parent) return;
                const siblings = Array.from(parent.children) as HTMLElement[];
                const idx = siblings.indexOf(el);
                const applyNeighbor = (offset: number, intensity: number) => {
                  const neighbor = siblings[idx + offset];
                  if (!neighbor) return;
                  neighbor.style.color = `hsl(260, 70%, ${60 + intensity * 10}%)`;
                  neighbor.style.textShadow = `
                    0 0 ${6 * intensity}px hsl(260 70% 65% / ${0.5 * intensity}),
                    0 0 ${16 * intensity}px hsl(255 60% 60% / ${0.3 * intensity})
                  `;
                  neighbor.style.transform = `translateY(${-1 * intensity}px) scale(${1 + 0.03 * intensity})`;
                };
                applyNeighbor(-2, 0.3);
                applyNeighbor(-1, 0.6);
                applyNeighbor(1, 0.6);
                applyNeighbor(2, 0.3);
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget;
                el.style.color = "";
                el.style.textShadow = "";
                el.style.transform = "";
                const parent = el.parentElement;
                if (!parent) return;
                const siblings = Array.from(parent.children) as HTMLElement[];
                const idx = siblings.indexOf(el);
                [-2, -1, 1, 2].forEach((offset) => {
                  const neighbor = siblings[idx + offset];
                  if (!neighbor) return;
                  neighbor.style.color = "";
                  neighbor.style.textShadow = "";
                  neighbor.style.transform = "";
                });
              }}
            >
              {letter}
            </span>
          ))}
        </span>
      ))}
    </h1>
  );
};

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
    <section id="home" className="relative pt-24 pb-32 overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-mira-purple/50 to-transparent opacity-20" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="max-w-4xl mb-24"
        >
          <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-mira-purple/5 border border-mira-purple/20 mb-8">
            <Activity className="size-3 text-mira-purple animate-pulse" />
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-mira-purple font-bold">
              Personalized Superfast AI · Active
            </span>
          </div>

          <InteractiveTitle text="One AI to access every model" />

          <p className="text-xl sm:text-2xl text-muted-foreground/60 font-light leading-relaxed max-w-[36ch]">
            <span className="text-mira-purple font-bold text-3xl sm:text-4xl block mb-2">MIRA</span> unifies the world's most powerful AI models into a single personal interface. Switch models, preserve context, think deeper.
          </p>
        </motion.div>

        <motion.div
          id="chat-cta"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="grid lg:grid-cols-12 gap-12 items-start"
        >
          <div className="lg:col-span-6 space-y-8">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-mira rounded-[2.5rem] blur-2xl opacity-10 group-hover:opacity-20 transition-opacity duration-1000" />
              <div className="relative glass-panel rounded-[2rem] border-border bg-card/60 backdrop-blur-xl p-1 shadow-3xl">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.metaKey || e.ctrlKey) && submit()}
                  className="w-full bg-transparent text-xl p-8 min-h-[180px] text-foreground placeholder:text-muted-foreground/30 resize-none outline-none font-light"
                  placeholder="Ask MIRA anything — code, research, reasoning..."
                />
                <div className="flex items-center justify-between p-4 border-t border-border bg-muted/20 backdrop-blur-sm">
                  <div className="flex gap-3">
                    <span className="px-3 py-1 bg-muted/50 rounded-full text-[10px] font-mono text-muted-foreground uppercase tracking-widest border border-border flex items-center gap-2">
                      <Shield className="size-3" /> Secure
                    </span>
                    <span className="px-3 py-1 bg-muted/50 rounded-full text-[10px] font-mono text-muted-foreground uppercase tracking-widest border border-border flex items-center gap-2">
                      <Zap className="size-3" /> Multi-Model
                    </span>
                  </div>
                  <Button onClick={submit} size="lg" className="btn-mira px-8 rounded-2xl gap-3 text-xs font-bold uppercase tracking-widest group">
                    <Sparkles className="size-4 group-hover:rotate-12 transition-transform" /> Ask MIRA
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { tag: "Code", title: "Review and refactor my React codebase", color: "text-mira-purple", icon: <Cpu className="size-4" /> },
                { tag: "Research", title: "Summarize the latest in LLM alignment", color: "text-mira-cyan", icon: <Brain className="size-4" /> },
              ].map((s) => (
                <button
                  key={s.title}
                  onClick={() => setPrompt(s.title)}
                  className="text-left glass-panel rounded-2xl p-6 border-border bg-card/40 backdrop-blur-sm hover:border-mira-purple/30 hover:bg-muted/30 transition-all group shadow-sm"
                >
                  <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest ${s.color} mb-3`}>
                    {s.icon} {s.tag}
                  </div>
                  <div className="text-[15px] font-medium text-foreground/70 group-hover:text-foreground transition-colors leading-snug">{s.title}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="glass-panel rounded-[2.5rem] overflow-hidden flex flex-col h-[520px] shadow-3xl border-border bg-card/40 backdrop-blur-xl">
              <TrafficLights label="MIRA · session-core · llama-3.1-70b" />
              <div className="flex-1 overflow-y-auto p-10 space-y-8 font-mono text-sm leading-relaxed">
                <div className="flex gap-4 opacity-40">
                  <span className="text-mira-purple">→</span>
                  <span className="text-foreground">Which model should I use for complex reasoning tasks?</span>
                </div>
                <div className="flex gap-4">
                  <span className="text-mira-purple font-bold">MIRA</span>
                  <div className="space-y-4">
                    <p className="text-foreground/80">For deep reasoning, I recommend routing to one of these:</p>
                    <div className="space-y-3">
                      <Row color="bg-mira-purple" text="Llama 3.3 70B · Meta's best versatile model" />
                      <Row color="bg-mira-cyan" text="Llama 3.1 8B · Instant responses" />
                      <Row color="bg-emerald-500" text="Llama 4 Scout 17B · Latest reasoning core" />
                      <Row color="bg-orange-500" text="GPT OSS 120B · Massive scale logic" />
                    </div>
                    <div className="p-5 rounded-2xl bg-muted/30 border border-border backdrop-blur-sm">
                      <div className="text-[10px] text-mira-purple uppercase tracking-widest font-bold mb-2">MIRA Recommendation</div>
                      <span className="text-foreground/60">All models share your session context. Switch anytime without losing your conversation.</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 animate-pulse">
                  <Zap className="size-4 text-mira-purple" />
                  <span className="text-[11px] text-muted-foreground/30 uppercase tracking-[0.4em]">Ready · 3 models available</span>
                </div>
              </div>
              <div className="h-10 px-6 flex items-center justify-between border-t border-border bg-muted/20 text-[10px] text-muted-foreground/40 font-mono uppercase tracking-widest">
                <span>Personalized Superfast AI</span>
                <span className="flex items-center gap-2">
                  <span className="size-1.5 bg-mira-purple rounded-full animate-pulse" />
                  Models Online · 3 active
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const Row = ({ color, text }: { color: string; text: string }) => (
  <div className="flex items-center gap-3">
    <div className={`size-1.5 rounded-full ${color}`} />
    <span className="text-foreground/40">{text}</span>
  </div>
);