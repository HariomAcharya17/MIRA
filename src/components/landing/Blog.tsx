import { ArrowUpRight } from "lucide-react";
import { TrafficLights } from "@/components/TrafficLights";

const posts = [
  { tag: "Engineering", title: "How we route 8 frontier models through one interface", date: "May 1, 2026", read: "8 min" },
  { tag: "Research", title: "On the architecture of bioluminescent UI", date: "Apr 24, 2026", read: "12 min" },
  { tag: "Product", title: "Why we built Mira local-first", date: "Apr 11, 2026", read: "5 min" },
];

export const Blog = () => (
  <section id="blog" className="py-20 sm:py-32">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
        <div>
          <div className="text-xs font-mono uppercase tracking-widest text-mira-cyan mb-3">// Blog</div>
          <h2 className="text-4xl sm:text-5xl font-semibold tracking-tighter text-gradient-fade">
            From the lab
          </h2>
        </div>
      </div>
      <div className="grid md:grid-cols-3 gap-5">
        {posts.map((p) => (
          <article key={p.title} className="glass-panel rounded-xl overflow-hidden group cursor-pointer hover:scale-[1.02] transition-transform">
            <TrafficLights />
            <div className="aspect-[16/9] bg-gradient-mira opacity-80 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-3">
                <span>{p.tag}</span>
                <span>{p.read}</span>
              </div>
              <h3 className="font-semibold text-lg mb-3 group-hover:text-mira-purple transition-colors">{p.title}</h3>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{p.date}</span>
                <ArrowUpRight className="size-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  </section>
);
