import { TrafficLights } from "@/components/TrafficLights";

export const About = () => (
  <section id="about" className="py-24 sm:py-32 relative overflow-hidden">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        <div className="animate-fade-in">
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-mira-blue mb-4 flex items-center gap-2">
            <span className="size-1 bg-mira-blue rounded-full animate-pulse" />
            // Strategic Vision
          </div>
          <h2 className="text-4xl sm:text-6xl font-semibold tracking-tighter mb-8 text-gradient-fade leading-tight">
            The cockpit for frontier intelligence
          </h2>
          <div className="space-y-6">
            <p className="text-xl text-muted-foreground leading-relaxed font-light">
              Mira is a neural interface that makes it natural to work with multiple frontier models at once. Switch from a 405B reasoning engine to a coding specialist mid-conversation.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed font-light opacity-80">
              We believe the next decade of work will be defined by humans who orchestrate intelligence — not by interfaces that hide it. Mira is built for that future.
            </p>
          </div>
        </div>
        
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-mira rounded-2xl blur-2xl opacity-10 group-hover:opacity-20 transition-opacity duration-700" />
          <div className="relative glass-panel rounded-2xl overflow-hidden border-white/5 group-hover:border-mira-blue/30 transition-colors duration-500">
            <TrafficLights label="mira / core_principles.md" />
            <div className="p-8 sm:p-10 font-mono text-[13px] space-y-6 text-muted-foreground leading-relaxed">
              <p className="text-mira-purple font-bold tracking-tight pb-2 border-b border-white/5 flex items-center justify-between">
                <span># SYSTEM_MANIFESTO</span>
                <span className="text-[10px] opacity-50">STATUS: ACTIVE</span>
              </p>
              <div className="space-y-4">
                <p className="flex gap-4">
                  <span className="text-mira-blue shrink-0">01.</span> 
                  <span>Speed is the primary feature, not a secondary requirement.</span>
                </p>
                <p className="flex gap-4">
                  <span className="text-mira-blue shrink-0">02.</span> 
                  <span>Expose the model architecture. Total transparency.</span>
                </p>
                <p className="flex gap-4">
                  <span className="text-mira-blue shrink-0">03.</span> 
                  <span>Local-first architecture. User data sovereignty is absolute.</span>
                </p>
                <p className="flex gap-4">
                  <span className="text-mira-blue shrink-0">04.</span> 
                  <span>Beautiful tools are the foundation of beautiful work.</span>
                </p>
                <p className="flex gap-4">
                  <span className="text-mira-blue shrink-0">05.</span> 
                  <span>The interface must disappear into the flow of thought.</span>
                </p>
              </div>
              <div className="pt-4 border-t border-white/5 text-[10px] opacity-40 uppercase tracking-[0.2em]">
                End of session.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

