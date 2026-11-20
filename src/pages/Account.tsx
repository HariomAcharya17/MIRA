import { Navigate, Link } from "react-router-dom";
import { Loader2, LogOut } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { getSessions, getDownloads, getUsage } from "@/lib/store";

const Account = () => {
  const { user, logout, loading, isMock } = useAuth();

  if (loading) {
    return (
      <Layout>
        <div className="flex-1 flex items-center justify-center py-24">
          <Loader2 className="size-5 animate-spin text-muted-foreground" aria-label="Loading" />
        </div>
      </Layout>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  const sessions = getSessions();
  const downloads = getDownloads();
  const usage = getUsage();
  const initial = user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase();

  return (
    <Layout>
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <h1 className="text-2xl font-semibold tracking-tight">Account</h1>

        <section className="mt-8 rounded-lg border border-border">
          <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-5 justify-between">
            <div className="flex items-center gap-4 min-w-0">
              <div className="size-12 shrink-0 rounded-full bg-brand-soft text-brand flex items-center justify-center text-lg font-semibold">
                {initial}
              </div>
              <div className="min-w-0">
                <div className="font-medium truncate">{user.name}</div>
                <div className="text-sm text-muted-foreground truncate">{user.email}</div>
              </div>
            </div>
            <Button variant="outline" onClick={() => logout().catch(() => {})} className="gap-2 self-start sm:self-auto">
              <LogOut className="size-4" /> Sign out
            </Button>
          </div>
          {isMock && (
            <div className="border-t border-border px-5 sm:px-6 py-3 text-xs text-muted-foreground">
              Demo account. Data is stored in this browser only.
            </div>
          )}
        </section>

        <section className="mt-8">
          <h2 className="text-sm font-medium text-muted-foreground">Usage</h2>
          <dl className="mt-3 grid grid-cols-1 sm:grid-cols-3 rounded-lg border border-border divide-y sm:divide-y-0 sm:divide-x divide-border">
            <Stat label="Chats" value={sessions.length} to="/history" />
            <Stat label="Saved files" value={downloads.length} to="/downloads" />
            <Stat label="Tokens used" value={usage.totalTokens.toLocaleString()} />
          </dl>
        </section>
      </div>
    </Layout>
  );
};

const Stat = ({ label, value, to }: { label: string; value: string | number; to?: string }) => {
  const body = (
    <>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold tabular-nums">{value}</dd>
    </>
  );
  return to ? (
    <Link to={to} className="block p-5 hover:bg-accent/60 transition-colors">
      {body}
    </Link>
  ) : (
    <div className="p-5">{body}</div>
  );
};

export default Account;
