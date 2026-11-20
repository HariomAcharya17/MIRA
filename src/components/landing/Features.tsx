import { BookOpen, Code2, History, Download, FileCode2, FileText, Folder } from "lucide-react";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

const Card = ({ title, desc, children, className }: { title: string; desc: string; children?: ReactNode; className?: string }) => (
  <div className={cn("flex flex-col rounded-xl border border-border bg-card overflow-hidden", className)}>
    {children && <div className="border-b border-border bg-muted/40 p-5 sm:p-6 flex-1">{children}</div>}
    <div className="p-5 sm:p-6">
      <h3 className="font-medium">{title}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  </div>
);

const models = [
  { id: "llama-3.3-70b-versatile", provider: "Groq", ctx: "128K", active: true },
  { id: "llama-3.1-8b-instant", provider: "Groq", ctx: "128K" },
  { id: "meta/llama-3.1-405b-instruct", provider: "NVIDIA", ctx: "128K" },
];

const ModelsVisual = () => (
  <div className="rounded-lg border border-border bg-popover shadow-sm text-[13px] max-w-sm">
    {models.map((m) => (
      <div
        key={m.id}
        className={cn("flex items-center gap-3 px-3 py-2.5 border-b border-border last:border-0", m.active && "bg-accent/60")}
      >
        <span className={cn("size-1.5 rounded-full", m.active ? "bg-brand" : "bg-border")} />
        <span className="font-mono text-[12px] truncate flex-1">{m.id}</span>
        <span className="text-xs text-muted-foreground">{m.provider}</span>
        <span className="hidden sm:inline text-xs text-muted-foreground tabular-nums w-9 text-right">{m.ctx}</span>
      </div>
    ))}
  </div>
);

const SourcesVisual = () => (
  <div className="space-y-3 text-[13px]">
    <p className="leading-relaxed">
      SQLite stores the whole database in a single file<sup className="text-brand font-medium">[1]</sup>, while Postgres runs
      as a separate server process<sup className="text-brand font-medium">[2]</sup>.
    </p>
    <div className="space-y-1.5">
      {[
        ["sqlite.org", "About SQLite"],
        ["postgresql.org", "Architectural fundamentals"],
      ].map(([d, t], i) => (
        <div key={d} className="flex items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1.5">
          <span className="flex size-4 items-center justify-center rounded bg-muted text-[10px] font-medium">{i + 1}</span>
          <span className="truncate">{t}</span>
          <span className="ml-auto shrink-0 text-xs text-muted-foreground">{d}</span>
        </div>
      ))}
    </div>
  </div>
);

const ProjectVisual = () => (
  <div className="rounded-lg border border-border bg-background text-[13px] max-w-xs">
    <div className="flex items-center justify-between border-b border-border px-3 py-2">
      <span className="font-medium">coffee-shop</span>
      <span className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-[11px] font-medium text-primary-foreground">
        <Download className="size-3" /> ZIP
      </span>
    </div>
    <div className="p-2 font-mono text-[12px] space-y-0.5">
      <div className="flex items-center gap-2 px-1.5 py-1 text-muted-foreground"><Folder className="size-3.5" /> assets</div>
      <div className="flex items-center gap-2 px-1.5 py-1 rounded bg-accent"><FileCode2 className="size-3.5 text-brand" /> index.html</div>
      <div className="flex items-center gap-2 px-1.5 py-1"><FileCode2 className="size-3.5 text-muted-foreground" /> styles.css</div>
      <div className="flex items-center gap-2 px-1.5 py-1"><FileCode2 className="size-3.5 text-muted-foreground" /> script.js</div>
      <div className="flex items-center gap-2 px-1.5 py-1"><FileText className="size-3.5 text-muted-foreground" /> README.md</div>
    </div>
  </div>
);

const small = [
  { icon: BookOpen, title: "Research mode", desc: "A deeper search, with citations placed inline next to each claim." },
  { icon: Code2, title: "Readable code", desc: "Markdown, tables and highlighted code blocks with one-click copy." },
  { icon: History, title: "History everywhere", desc: "Chats save in your browser and sync to your account when signed in." },
];

export const Features = () => (
  <section id="features" className="py-20 sm:py-24 border-t border-border">
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      <div className="max-w-2xl">
        <p className="text-sm font-medium text-brand">Features</p>
        <h2 className="mt-2 text-3xl sm:text-4xl font-semibold">Built for questions that need a real answer</h2>
        <p className="mt-3 text-muted-foreground leading-relaxed">
          Mira runs on free API tiers. When a model is busy, your request moves to another model from the same provider
          instead of failing.
        </p>
      </div>

      <div className="mt-12 grid gap-4 md:grid-cols-6">
        <Card
          className="md:col-span-3"
          title="Pick the right model for the job"
          desc="The model list loads live from Groq and NVIDIA. Switch mid-conversation and keep the context."
        >
          <ModelsVisual />
        </Card>
        <Card
          className="md:col-span-3"
          title="Answers you can verify"
          desc="Mira searches the web before replying and lists every page it used under the answer."
        >
          <SourcesVisual />
        </Card>
        <Card
          className="md:col-span-2"
          title="From prompt to project"
          desc="Get a set of files, preview HTML in a sandbox, and download everything as a ZIP."
        >
          <ProjectVisual />
        </Card>
        <div className="md:col-span-4 grid gap-4">
          {small.map((f) => (
            <div key={f.title} className="flex items-start gap-4 rounded-xl border border-border bg-card p-5 sm:p-6">
              <div className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
                <f.icon className="size-[18px]" />
              </div>
              <div>
                <h3 className="font-medium">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);
