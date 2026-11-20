import { Layers, Globe, FolderDown, BookOpen, Code2, History } from "lucide-react";

const features = [
  {
    icon: Layers,
    title: "Several models, one chat",
    desc: "Pick from the models Groq and NVIDIA currently offer. Switch models in the middle of a conversation without losing context.",
  },
  {
    icon: Globe,
    title: "Answers with sources",
    desc: "Each message can search the web first. The links used are listed under the reply so you can check them.",
  },
  {
    icon: FolderDown,
    title: "Project generation",
    desc: "Describe a small site or app and get a set of files. Preview HTML projects in a sandbox and download everything as a ZIP.",
  },
  {
    icon: BookOpen,
    title: "Research mode",
    desc: "Runs a deeper search and asks the model to cite sources inline. Useful for comparisons and recent topics.",
  },
  {
    icon: Code2,
    title: "Readable code",
    desc: "Markdown, tables and syntax-highlighted code blocks, each with a copy button.",
  },
  {
    icon: History,
    title: "History that follows you",
    desc: "Chats are saved in your browser and, when you're signed in, synced to your account.",
  },
];

export const Features = () => (
  <section id="features" className="px-4 sm:px-6 py-20 border-t border-border">
    <div className="max-w-6xl mx-auto">
      <div className="max-w-2xl">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">What you can do with Mira</h2>
        <p className="mt-3 text-muted-foreground leading-relaxed">
          Mira runs on free API tiers, so limits apply. When one model is busy, the request falls back to another from the same provider.
        </p>
      </div>

      <div className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <div key={f.title}>
            <div className="inline-flex size-9 items-center justify-center rounded-lg border border-border text-brand">
              <f.icon className="size-[18px]" />
            </div>
            <h3 className="mt-4 font-medium">{f.title}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);
