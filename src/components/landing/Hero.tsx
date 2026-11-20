import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUp } from "lucide-react";

const examples = [
  "Explain the difference between useMemo and useCallback",
  "Summarize this week's top technology news",
  "Build a landing page for a coffee shop",
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
    <section id="home" className="px-4 sm:px-6 pt-20 sm:pt-28 pb-16">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.1] text-balance">
          Chat with open models, search the web, and build small projects
        </h1>
        <p className="mt-5 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto text-pretty">
          Mira puts Llama and other open models from Groq and NVIDIA in one place.
          Answers cite their web sources, and code projects can be previewed and downloaded as a ZIP.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            start(prompt);
          }}
          className="mt-10 text-left rounded-xl border border-border bg-card shadow-sm focus-within:border-ring/60 focus-within:ring-2 focus-within:ring-ring/15 transition"
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
            rows={3}
            placeholder="Ask anything…"
            className="block w-full resize-none bg-transparent px-4 pt-4 pb-2 text-[15px] outline-none placeholder:text-muted-foreground"
          />
          <div className="flex items-center justify-between px-3 pb-3">
            <span className="text-xs text-muted-foreground pl-1">Enter to send · Shift + Enter for a new line</span>
            <button
              type="submit"
              aria-label="Start chat"
              className="inline-flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
              disabled={!prompt.trim()}
            >
              <ArrowUp className="size-4" />
            </button>
          </div>
        </form>

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {examples.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => start(ex)}
              className="rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
