import { Brain, Code, ImageIcon, Zap, Shield, GitBranch } from "lucide-react";
import { TrafficLights } from "@/components/TrafficLights";

const features = [
  { icon: Brain, title: "Frontier Reasoning", desc: "Llama 3.1 405B and Nemotron 70B for deep analysis and long-context synthesis.", color: "text-mira-purple" },
  { icon: Code, title: "Production-Grade Code", desc: "DeepSeek Coder and Qwen 2.5 ship ML pipelines, infra, and full-stack systems.", color: "text-mira-blue" },
  { icon: ImageIcon, title: "Image Synthesis", desc: "SDXL Turbo for fast concept art, mockups, and visual ideation.", color: "text-mira-pink" },
  { icon: Zap, title: "Streaming Responses", desc: "Token-by-token output with <100ms first-token latency on most models.", color: "text-mira-cyan" },
  { icon: Shield, title: "Encrypted Sessions", desc: "All conversations are stored locally on your device until you choose to sync.", color: "text-emerald-500" },
  { icon: GitBranch, title: "Model Switching", desc: "Swap between 8+ NVIDIA-hosted models mid-conversation without losing context.", color: "text-orange-400" },
];

export const Features = () => (
  <section id="features" className="py-20 sm:py-32 relative">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mb-12">
        <div className="text-xs font-mono uppercase tracking-widest text-mira-purple mb-3">// Features</div>
        <h2 className="text-4xl sm:text-5xl font-semibold tracking-tighter mb-4 text-gradient-fade">
          Built for ambitious work
        </h2>
        <p className="text-lg text-muted-foreground">
          Every capability tuned for precision, speed, and control.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {features.map((f) => (
          <div key={f.title} className="glass-panel rounded-xl overflow-hidden hover:scale-[1.02] transition-transform">
            <TrafficLights />
            <div className="p-6">
              <f.icon className={`size-7 ${f.color} mb-4`} />
              <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);
