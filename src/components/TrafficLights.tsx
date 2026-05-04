export const TrafficLights = ({ label }: { label?: string }) => (
  <div className="flex items-center gap-2 px-4 h-10 bg-muted/40 border-b border-border/60">
    <div className="traffic-dot traffic-red" />
    <div className="traffic-dot traffic-yellow" />
    <div className="traffic-dot traffic-green" />
    {label && (
      <div className="ml-3 text-[10px] sm:text-[11px] font-mono text-muted-foreground uppercase tracking-widest truncate">
        {label}
      </div>
    )}
  </div>
);
