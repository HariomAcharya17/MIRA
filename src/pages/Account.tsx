import { Navigate, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { TrafficLights } from "@/components/TrafficLights";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { getSessions, getDownloads, getUsage } from "@/lib/store";
import { LogOut, MessageSquare, History, Download } from "lucide-react";

const Account = () => {
  const { user, logout } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  const sessions = getSessions();
  const downloads = getDownloads();
  const usage = getUsage();

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="glass-panel rounded-xl overflow-hidden mb-6">
          <TrafficLights label={`account / ${user.email}`} />
          <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="size-14 rounded-full bg-gradient-mira flex items-center justify-center text-white text-xl font-bold shadow-[0_0_30px_hsl(var(--mira-purple)/0.4)]">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Member</div>
                <h1 className="text-2xl font-semibold tracking-tight">{user.name}</h1>
                <div className="text-sm text-muted-foreground">{user.email}</div>
              </div>
            </div>
            <Button variant="outline" onClick={logout} className="gap-2">
              <LogOut className="size-4" /> Sign out
            </Button>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          <StatCard icon={<MessageSquare className="size-5 text-mira-blue" />} label="Conversations" value={sessions.length} to="/history" />
          <StatCard icon={<Download className="size-5 text-mira-pink" />} label="Downloads" value={downloads.length} to="/downloads" />
          <StatCard icon={<History className="size-5 text-mira-purple" />} label="Total tokens" value={usage.totalTokens.toLocaleString()} to="/ai" />
        </div>

        <div className="glass-panel rounded-xl overflow-hidden">
          <TrafficLights label="account / preferences" />
          <div className="p-6 space-y-4">
            <h3 className="font-semibold">Quick actions</h3>
            <div className="flex flex-wrap gap-2">
              <Link to="/ai"><Button size="sm">Open workspace</Button></Link>
              <Link to="/history"><Button size="sm" variant="outline">View history</Button></Link>
              <Link to="/downloads"><Button size="sm" variant="outline">Manage downloads</Button></Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

const StatCard = ({ icon, label, value, to }: { icon: React.ReactNode; label: string; value: string | number; to: string }) => (
  <Link to={to} className="glass-panel rounded-xl p-5 hover:scale-[1.02] transition-transform">
    <div className="flex items-center justify-between mb-3">{icon}</div>
    <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</div>
    <div className="text-2xl font-semibold mt-1">{value}</div>
  </Link>
);

export default Account;
