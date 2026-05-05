import { Brain, Code, Terminal, Zap, Shield, GitBranch } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const features = [
  { icon: Brain, title: "Frontier Reasoning", desc: "Command models with 1M+ context for deep analysis and long-form synthesis.", color: "text-mira-purple" },
  { icon: Code, title: "Systems Engineering", desc: "Architect full-stack clusters, ML pipelines, and distributed logic cores.", color: "text-mira-blue" },
  { icon: Terminal, title: "Neural Logic", desc: "Recursive code audits and frontier-level research via optimized inference.", color: "text-mira-pink" },
  { icon: Zap, title: "Superfast Streaming", desc: "Token-by-token neural output with zero-lag first-token delivery.", color: "text-mira-cyan" },
  { icon: Shield, title: "Secure Sessions", desc: "AES-256 encrypted local vaults for maximum operator privacy.", color: "text-emerald-500" },
  { icon: GitBranch, title: "Model Orchestration", desc: "Swap between specialized frontier cores mid-session without context loss.", color: "text-orange-400" },
];

export const Features = () => (
  <section id="features" className="py-24 sm:py-32 relative overflow-hidden">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="max-w-3xl mb-16"
      >
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-mira-purple mb-4 flex items-center gap-2">
          <span className="size-1 bg-mira-purple rounded-full animate-pulse" />
          // Neural Core Capabilities
        </div>
        <h2 className="text-4xl sm:text-6xl font-bold tracking-tighter mb-6 text-foreground leading-tight">
          Engineered for <br /><span className="text-mira-purple">Precision Logic</span>
        </h2>
        <p className="text-lg text-muted-foreground/60 font-light max-w-[50ch]">
          Every instrument is calibrated for maximum control over frontier intelligence. No fluff, just power.
        </p>
      </motion.div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.5, delay: i * 0.1, ease: "easeOut" }}
            className="relative group"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-mira-purple to-mira-cyan rounded-2xl blur-xl opacity-0 group-hover:opacity-10 transition duration-1000" />

            <div className="relative glass-panel rounded-3xl overflow-hidden bg-card/40 backdrop-blur-xl border-border hover:border-mira-purple/30 transition-all duration-500 h-full shadow-sm">
              <div className="p-8">
                <div className="size-12 rounded-2xl bg-muted/50 backdrop-blur-sm flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
                  <f.icon className={cn("size-6", f.color)} />
                </div>
                <h3 className="font-bold text-xl mb-4 tracking-tight text-foreground/90 group-hover:text-foreground transition-colors">{f.title}</h3>
                <p className="text-[13px] text-muted-foreground/50 leading-relaxed font-light">{f.desc}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);