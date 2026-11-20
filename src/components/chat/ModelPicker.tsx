import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger } from "@/components/ui/select";
import { formatContext, type ModelInfo, type ModelsResponse, type ProviderId } from "@/lib/mira-api";

export type ModelRef = { provider: ProviderId; id: string };
const encode = (r: ModelRef) => `${r.provider}::${r.id}`;

export function ModelPicker({
  data,
  loading,
  error,
  value,
  onChange,
}: {
  data: ModelsResponse | null;
  loading: boolean;
  error: string | null;
  value: ModelRef | null;
  onChange: (r: ModelRef) => void;
}) {
  const models = data?.models ?? [];
  const current = value ? models.find((m) => m.provider === value.provider && m.id === value.id) : undefined;
  const code = models.filter((m) => m.isCode);
  const byProvider = (p: ProviderId) => models.filter((m) => m.provider === p && !m.isCode);

  const item = (m: ModelInfo, prefix = "") => (
    <SelectItem key={prefix + encode(m)} value={encode(m)} className="py-2">
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-sm">{m.name}</span>
        <span className="truncate text-xs text-muted-foreground">
          {m.vendor}
          {m.contextWindow ? ` · ${formatContext(m.contextWindow)} context` : ""}
          {prefix ? ` · ${data?.providers[m.provider].label}` : ""}
        </span>
      </div>
    </SelectItem>
  );

  const label = loading
    ? "Loading models…"
    : error
      ? "Models unavailable"
      : current
        ? current.name
        : value?.id || "Choose a model";

  return (
    <Select
      value={value ? encode(value) : undefined}
      onValueChange={(v) => {
        const [provider, ...rest] = v.split("::");
        onChange({ provider: provider as ProviderId, id: rest.join("::") });
      }}
      disabled={loading || !models.length}
    >
      <SelectTrigger
        className="h-9 w-auto max-w-[60vw] gap-2 border-none bg-transparent px-2.5 text-sm font-medium shadow-none hover:bg-accent focus:ring-0 focus:ring-offset-0"
        aria-label="Model"
      >
        <span className="truncate">{label}</span>
        {current && (
          <span className="hidden sm:inline text-xs font-normal text-muted-foreground">
            {data?.providers[current.provider].label}
          </span>
        )}
      </SelectTrigger>
      <SelectContent className="mira-app max-h-[60vh] w-[min(22rem,90vw)]">
        {code.length > 0 && (
          <SelectGroup>
            <SelectLabel className="text-xs font-medium text-muted-foreground">Code</SelectLabel>
            {code.map((m) => item(m, "code:"))}
          </SelectGroup>
        )}
        {(["groq", "nvidia"] as ProviderId[]).map((p) => {
          const status = data?.providers[p];
          const list = byProvider(p);
          return (
            <SelectGroup key={p}>
              <SelectLabel className="text-xs font-medium text-muted-foreground">
                {status?.label ?? p}
                {status && !status.ok && <span className="font-normal"> · {status.error}</span>}
              </SelectLabel>
              {list.map((m) => item(m))}
            </SelectGroup>
          );
        })}
      </SelectContent>
    </Select>
  );
}
