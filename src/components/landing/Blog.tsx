import { ArrowUpRight } from "lucide-react";
import { TrafficLights } from "@/components/TrafficLights";

const posts = [
  { tag: "Engineering", title: "How we route 8 frontier models through one interface", date: "May 1, 2026", read: "8 min" },
  { tag: "Research", title: "On the architecture of bioluminescent UI", date: "Apr 24, 2026", read: "12 min" },
  { tag: "Product", title: "Why we built Mira local-first", date: "Apr 11, 2026", read: "5 min" },
];

export const Blog = () => (
  <section id="blog" className="py-24 sm:py-32 relative overflow-hidden">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
      <div className="flex items-end justify-between mb-16 flex-wrap gap-4">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-mira-cyan mb-4 flex items-center gap-2">
            <span className="size-1 bg-mira-cyan rounded-full animate-pulse" />
            // Intelligence Reports
          </div>
          <h2 className="text-4xl sm:text-6xl font-semibold tracking-tighter text-gradient-fade">
            Latest from the lab
          </h2>
        </div>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {posts.map((p, i) => (
          <article 
            key={p.title} 
            className="glass-panel rounded-2xl overflow-hidden group cursor-pointer hover:translate-y-[-4px] transition-all duration-500 border-white/5 hover:border-mira-purple/30"
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <div className="aspect-[16/10] bg-muted relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-mira opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
              <div className="absolute inset-0 flex items-center justify-center">
                <TrafficLights />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
            </div>
            <div className="p-8">
              <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-mira-cyan mb-4">
                <span className="px-2 py-0.5 bg-mira-cyan/10 rounded-full border border-mira-cyan/20">{p.tag}</span>
                <span className="text-muted-foreground">{p.read}</span>
              </div>
              <h3 className="text-xl font-medium mb-4 group-hover:text-mira-purple transition-colors leading-snug">
                {p.title}
              </h3>
              <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground uppercase tracking-wider mt-auto pt-4 border-t border-white/5">
                <span>{p.date}</span>
                <div className="flex items-center gap-1 group-hover:text-mira-cyan transition-colors">
                  Read <ArrowUpRight className="size-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  </section>
);

