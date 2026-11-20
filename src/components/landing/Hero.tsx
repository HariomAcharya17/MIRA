import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUp } from "lucide-react";
import { ChatPreview } from "./ChatPreview";

const examples = [
  "Explain useMemo vs useCallback",
  "Top tech news this week",
  "Build a coffee shop landing page",
];

export const Hero = () => {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");

  const start = (text: string) => {
    const value = text.trim();
    if (value) sessionStorage.setItem("mira-pending-prompt", value);
    navigate("/ai");
  };

  return (
    <section id="home" className="relative overflow-hidden">
      <div className="bg-dots absolute inset-0" aria-hidden />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-20 grid gap-14 lg:grid-cols-[1fr_1.05fr] lg:items-center">
        <div>
          <span className="inline-flex items-center rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground">
            Free to use · Groq and NVIDIA models
          </span>
          <h1 className="mt-5 text-4xl sm:text-[3.25rem] font-semibold leading-[1.05] text-balance">
            Ask anything. <span className="text-brand">Check the sources.</span> Ship the code.
          </h1>
          <p className="mt-5 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl text-pretty">
            Mira puts Llama and other open models in one chat. Replies cite the pages they used, and code requests can
            become a full project you preview and download.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              start(prompt);
            }}
            className="mt-8 max-w-xl rounded-xl border border-border bg-card shadow-sm focus-within:border-ring/60 focus-within:ring-4 focus-within:ring-ring/10 transition"
          >
            <label htmlFor="hero-prompt" className="sr-only">
              Ask Mira
            </label>
            <textarea
              id="hero-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  start(prompt);
                }
              }}
              rows={2}
              placeholder="Ask Mira anything…"
              className="block w-full resize-none bg-transparent px-4 pt-3.5 pb-1 text-[15px] outline-none placeholder:text-muted-foreground"
            />
            <div className="flex items-center justify-between px-3 pb-3">
              <span className="text-xs text-muted-foreground pl-1 hidden sm:block">Press Enter to start a chat</span>
              <button
                type="submit"
                className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Start <ArrowUp className="size-3.5" />
              </button>
            </div>
          </form>

          <div className="mt-4 flex flex-wrap gap-2 max-w-xl">
            {examples.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => start(ex)}
                className="rounded-full border border-border bg-background px-3 py-1 text-[13px] text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>

        <ChatPreview />
      </div>
    </section>
  );
};
