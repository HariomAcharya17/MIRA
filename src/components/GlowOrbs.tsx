import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

export const GlowOrbs = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className={cn(
      "fixed inset-0 -z-10 pointer-events-none overflow-hidden select-none transition-all duration-1000",
      isDark ? "bg-[#0d0f1a]" : "bg-[#f6f8fa]"
    )}>

      {/* ── GITHUB-STYLE PRIMARY PURPLE ORB ── */}
      <div className={cn(
        "absolute left-1/2 -translate-x-1/2 rounded-full transition-all duration-1000",
        isDark
          ? "bottom-[-30%] size-[1200px] opacity-50 blur-[80px] bg-[radial-gradient(circle_at_50%_45%,hsl(260_70%_65%)_0%,hsl(255_60%_45%)_25%,hsl(250_50%_25%)_50%,transparent_70%)]"
          : "bottom-[-40%] size-[1000px] opacity-15 blur-[100px] bg-[radial-gradient(circle_at_50%_45%,hsl(260_70%_65%)_0%,hsl(255_60%_45%)_30%,transparent_65%)]"
      )} />

      {/* ── SOFT INNER BRIGHT CORE (the hot center GitHub has) ── */}
      <div className={cn(
        "absolute left-1/2 -translate-x-1/2 rounded-full transition-all duration-1000",
        isDark
          ? "bottom-[-38%] size-[600px] opacity-35 blur-[40px] bg-[radial-gradient(circle_at_50%_40%,hsl(270_80%_80%)_0%,hsl(260_70%_60%)_30%,transparent_65%)]"
          : "hidden"
      )} />

      {/* ── HORIZON LINE ── */}
      <div className={cn(
        "absolute bottom-0 left-0 right-0 h-px transition-opacity duration-1000",
        isDark ? "opacity-40" : "opacity-15",
        "bg-[linear-gradient(90deg,transparent_10%,hsl(260_70%_75%)_40%,hsl(270_80%_80%)_50%,hsl(260_70%_75%)_60%,transparent_90%)]"
      )} />

      {/* ── HORIZON SPREAD ── */}
      <div className={cn(
        "absolute bottom-0 left-0 right-0 h-[260px] transition-opacity duration-1000",
        isDark ? "opacity-100" : "opacity-30",
        "bg-[linear-gradient(to_top,hsl(255_40%_12%/0.5)_0%,transparent_100%)]"
      )} />

      {/* ── VERY SUBTLE TOP AMBIENT (keeps text readable, no blue) ── */}
      <div className={cn(
        "absolute inset-0 transition-opacity duration-1000",
        isDark
          ? "bg-[radial-gradient(circle_at_50%_0%,hsl(260_30%_15%/0.3),transparent_55%)]"
          : "bg-[radial-gradient(circle_at_50%_0%,hsl(260_30%_90%/0.2),transparent_50%)]"
      )} />

      {/* ── GRID OVERLAY ── */}
      <div className={cn(
        "absolute inset-0 grid-bg transition-opacity duration-1000",
        isDark ? "opacity-[0.06]" : "opacity-[0.03]"
      )} />

      {/* ── NOISE TEXTURE ── */}
      <div className={cn(
        "absolute inset-0 noise-bg mix-blend-overlay transition-opacity duration-1000",
        isDark ? "opacity-[0.04]" : "opacity-[0.01]"
      )} />
    </div>
  );
};