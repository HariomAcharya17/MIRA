import { TrafficLights } from "@/components/TrafficLights";

export const About = () => (
  <section id="about" className="py-20 sm:py-32 relative">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <div className="text-xs font-mono uppercase tracking-widest text-mira-blue mb-3">// About</div>
          <h2 className="text-4xl sm:text-5xl font-semibold tracking-tighter mb-6 text-gradient-fade">
            We're building the cockpit for intelligent work
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed mb-4">
            Mira is a neural interface that makes it natural to work with multiple frontier models at once. Switch from a 405B reasoning engine to a coding specialist mid-conversation. Generate an image, then ask the same model to refine it.
          </p>
          <p className="text-lg text-muted-foreground leading-relaxed">
            We believe the next decade of work will be defined by humans who orchestrate intelligence — not by interfaces that hide it. Mira is built for that future.
          </p>
        </div>
        <div className="glass-panel rounded-xl overflow-hidden">
          <TrafficLights label="mira / manifesto.md" />
          <div className="p-6 sm:p-8 font-mono text-sm space-y-4 text-muted-foreground leading-relaxed">
            <p><span className="text-mira-purple"># Our principles</span></p>
            <p><span className="text-mira-blue">01.</span> Speed is a feature, not a perk.</p>
            <p><span className="text-mira-blue">02.</span> Show the model. Never hide it.</p>
            <p><span className="text-mira-blue">03.</span> Local-first. Your data is yours.</p>
            <p><span className="text-mira-blue">04.</span> Beautiful tools produce beautiful work.</p>
            <p><span className="text-mira-blue">05.</span> The interface should disappear into the thought.</p>
          </div>
        </div>
      </div>
    </div>
  </section>
);
