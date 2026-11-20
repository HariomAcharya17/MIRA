import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";

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
      <div className="flex-1 flex items-start sm:items-center justify-center px-4 py-12 sm:py-16">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{subtitle}</p>}

          {isMock && (
            <div className="mt-6 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-xs leading-relaxed text-amber-800 dark:text-amber-300">
              Demo mode: accounts are stored in this browser only. Sign in with <span className="font-medium">admin@mira.io</span> /{" "}
              <span className="font-medium">password</span>, or create one.
            </div>
          )}

          <div className="mt-6">{children}</div>
          {footer && <div className="mt-6 text-sm text-muted-foreground">{footer}</div>}
        </div>
      </div>
    </Layout>
  );
};

export const AuthLink = ({ to, children }: { to: string; children: ReactNode }) => (
  <Link to={to} className="font-medium text-foreground underline-offset-4 hover:underline">
    {children}
  </Link>
);
