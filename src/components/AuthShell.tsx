import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Globe } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";

/** Sample exchange shown beside the form on wide screens. */
const SidePanel = () => (
  <div aria-hidden className="hidden lg:flex relative flex-col justify-center overflow-hidden border-l border-border bg-muted/50 px-12 xl:px-16">
    <div className="bg-dots absolute inset-0" />
    <div className="relative max-w-md">
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm text-sm space-y-4">
        <div className="flex justify-end">
          <div className="max-w-[85%] rounded-2xl bg-muted px-3.5 py-2">Is it worth learning Rust in 2026 for backend work?</div>
        </div>
        <div className="space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Globe className="size-3.5" /> Searched the web · 4 sources
          </div>
          <p className="leading-relaxed">
            It depends on what you build. Rust pays off for latency-sensitive services and tooling, where its memory
            safety and speed matter<sup className="text-brand font-medium">[1]</sup>. For typical CRUD APIs, Go or
            TypeScript usually get you there faster<sup className="text-brand font-medium">[2]</sup>.
          </p>
        </div>
      </div>
      <p className="mt-8 text-lg font-medium leading-snug">Answers that show their work.</p>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
        Every reply lists the pages it used, so you can check the details yourself.
      </p>
    </div>
  </div>
);

/** Shared frame for sign-in, sign-up and password reset pages. */
export const AuthShell = ({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) => {
  const { isMock } = useAuth();
  return (
    <Layout hideFooter>
      <div className="flex-1 grid lg:grid-cols-2">
        <div className="flex items-start sm:items-center justify-center px-4 py-12 sm:py-16">
          <div className="w-full max-w-sm">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {subtitle && <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{subtitle}</p>}

            {isMock && (
              <div className="mt-6 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-xs leading-relaxed text-amber-800 dark:text-amber-300">
                Demo mode: accounts are stored in this browser only. Sign in with{" "}
                <span className="font-medium">admin@mira.io</span> / <span className="font-medium">password</span>, or
                create one.
              </div>
            )}

            <div className="mt-6">{children}</div>
            {footer && <div className="mt-6 text-sm text-muted-foreground">{footer}</div>}
          </div>
        </div>
        <SidePanel />
      </div>
    </Layout>
  );
};

export const AuthLink = ({ to, children }: { to: string; children: ReactNode }) => (
  <Link to={to} className="font-medium text-foreground underline-offset-4 hover:underline">
    {children}
  </Link>
);
