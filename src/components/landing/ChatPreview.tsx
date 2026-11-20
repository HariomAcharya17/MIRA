import { ArrowUp, ChevronDown, Copy, Globe, SquarePen } from "lucide-react";
import { Logo } from "@/components/Logo";

/**
 * Static, non-interactive picture of the chat screen for the landing page.
 * Built from markup (not a screenshot) so it follows the theme and stays sharp.
 */
export const ChatPreview = () => (
  <div
    aria-hidden
    className="pointer-events-none select-none rounded-xl border border-border bg-card shadow-[0_1px_2px_hsl(var(--foreground)/0.04),0_12px_40px_-12px_hsl(var(--foreground)/0.18)] overflow-hidden text-left"
  >
    <div className="flex h-[480px] sm:h-[530px]">
      {/* Sidebar */}
      <div className="hidden sm:flex w-44 shrink-0 flex-col border-r border-border bg-sidebar p-2.5 text-[12px]">
        <div className="flex items-center justify-between px-1.5 py-1">
          <Logo className="size-5 text-[10px] rounded" />
          <SquarePen className="size-3.5 text-muted-foreground" />
        </div>
        <div className="mt-3 px-1.5 text-[10px] font-medium text-muted-foreground">Today</div>
        <div className="mt-1 rounded-md bg-accent px-2 py-1.5 truncate">Debounce an input in React</div>
        <div className="px-2 py-1.5 truncate text-foreground/70">Compare SQLite and Postgres</div>
        <div className="mt-2 px-1.5 text-[10px] font-medium text-muted-foreground">Previous 7 days</div>
        <div className="px-2 py-1.5 truncate text-foreground/70">Coffee shop landing page</div>
        <div className="px-2 py-1.5 truncate text-foreground/70">Rewrite cover letter intro</div>
        <div className="px-2 py-1.5 truncate text-foreground/70">Trip plan for Udaipur</div>
      </div>

      {/* Conversation */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-10 items-center gap-1 border-b border-border px-3 text-[12px] font-medium">
          llama-3.3-70b-versatile
          <ChevronDown className="size-3 text-muted-foreground" />
          <span className="ml-1 rounded bg-muted px-1.5 py-0.5 text-[10px] font-normal text-muted-foreground">Groq</span>
        </div>

        <div className="flex-1 overflow-hidden px-4 py-4 space-y-3.5 text-[12.5px] leading-relaxed">
          <div className="flex justify-end">
            <div className="max-w-[80%] rounded-2xl bg-muted px-3 py-2">How do I debounce a search input in React?</div>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Globe className="size-3" /> Searched the web · 2 sources
            </div>
            <p>
              Keep the raw value in state and update a second, debounced value after the user stops typing. A small
              hook keeps it reusable<sup className="text-brand font-medium">[1]</sup>:
            </p>
            <div className="rounded-lg border border-border bg-code-bg">
              <div className="flex items-center justify-between border-b border-border px-3 py-1.5 text-[10.5px] text-muted-foreground">
                <span>tsx</span>
                <Copy className="size-3" />
              </div>
              <pre className="mira-code px-3 py-2.5 text-[11px] leading-[1.6] overflow-hidden">
                <span className="text-[hsl(var(--hl-keyword))]">function</span>{" "}
                <span className="text-[hsl(var(--hl-title))]">useDebounced</span>(value, ms = <span className="text-[hsl(var(--hl-number))]">300</span>) {"{"}
                {"\n"}  <span className="text-[hsl(var(--hl-keyword))]">const</span> [v, setV] = useState(value);
                {"\n"}  useEffect(() =&gt; {"{"}
                {"\n"}    <span className="text-[hsl(var(--hl-keyword))]">const</span> t = setTimeout(() =&gt; setV(value), ms);
                {"\n"}    <span className="text-[hsl(var(--hl-keyword))]">return</span> () =&gt; clearTimeout(t);
                {"\n"}  {"}"}, [value, ms]);
                {"\n"}  <span className="text-[hsl(var(--hl-keyword))]">return</span> v;
                {"\n"}{"}"}
              </pre>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {["react.dev", "developer.mozilla.org"].map((d, i) => (
                <span key={d} className="inline-flex items-center gap-1.5 rounded-full border border-border px-2 py-0.5 text-[10.5px] text-muted-foreground">
                  <span className="flex size-3.5 items-center justify-center rounded-full bg-muted text-[8px] font-medium text-foreground">{i + 1}</span>
                  {d}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="px-3 pb-3">
          <div className="flex items-center justify-between rounded-xl border border-border px-3 py-2 text-[12px] text-muted-foreground">
            Message Mira…
            <span className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <ArrowUp className="size-3.5" />
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
);
