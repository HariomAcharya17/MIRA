import { Navigate, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { TrafficLights } from "@/components/TrafficLights";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { getSessions, getDownloads, getUsage } from "@/lib/store";
import { LogOut, MessageSquare, History, Download } from "lucide-react";
import { cn } from "@/lib/utils";

const Account = () => {
  const { user, logout, loading } = useAuth();
  
  if (loading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="size-12 border-2 border-mira-purple/30 border-t-mira-purple rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  const sessions = getSessions();
  const downloads = getDownloads();
  const usage = getUsage();

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="relative group mb-10">
          <div className="absolute -inset-1 bg-gradient-mira rounded-2xl blur-2xl opacity-10 group-hover:opacity-20 transition-opacity duration-700" />
          <div className="relative glass-panel rounded-2xl overflow-hidden border-white/5">
            <TrafficLights label={`identity // ${user.email}`} />
            <div className="p-8 sm:p-12 flex flex-col sm:flex-row items-center justify-between gap-8">
              <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                <div className="size-20 rounded-2xl bg-gradient-mira flex items-center justify-center text-white text-3xl font-bold shadow-2xl shadow-mira-purple/30 group-hover:scale-105 transition-transform duration-500">
                  {user.name?.charAt(0).toUpperCase() || "O"}
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-mira-cyan mb-2 flex items-center justify-center sm:justify-start gap-2">
                    <span className="size-1 bg-mira-cyan rounded-full animate-pulse" />
                    Neural Interface Member
                  </div>
                  <h1 className="text-3xl font-semibold tracking-tight mb-1">{user.name}</h1>
                  <div className="text-sm text-muted-foreground font-light opacity-80">{user.email}</div>
                </div>
              </div>
              <Button 
                variant="outline" 
                onClick={async () => {
                  try {
                    await logout();
                  } catch (e) {
                    console.error("Sign out error", e);
                  }
                }} 
                className="gap-2 h-11 px-6 border-white/10 bg-white/[0.02] hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all"
              >
                <LogOut className="size-4" /> Sign out
              </Button>
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-6 mb-10">
          <StatCard 
            icon={<MessageSquare className="size-5 text-mira-blue" />} 
            label="Neural Sessions" 
            value={sessions.length} 
            to="/history" 
            color="group-hover:border-mira-blue/30"
          />
          <StatCard 
            icon={<Download className="size-5 text-mira-pink" />} 
            label="Assets Stored" 
            value={downloads.length} 
            to="/downloads" 
            color="group-hover:border-mira-pink/30"
          />
          <StatCard 
            icon={<History className="size-5 text-mira-purple" />} 
            label="Total Telemetry" 
            value={`${(usage.totalTokens / 1000).toFixed(1)}k`} 
            to="/ai" 
            color="group-hover:border-mira-purple/30"
          />
        </div>

      </div>
    </Layout>
  );
};


const StatCard = ({ icon, label, value, to, color }: { icon: React.ReactNode; label: string; value: string | number; to: string; color: string }) => (
  <Link to={to} className={cn("glass-panel rounded-2xl p-6 transition-all duration-500 group border-white/5", color)}>
    <div className="flex items-center justify-between mb-4">
      <div className="size-10 rounded-xl bg-white/5 flex items-center justify-center transition-colors group-hover:bg-white/10">
        {icon}
      </div>
    </div>
    <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground mb-1">{label}</div>
    <div className="text-3xl font-bold tracking-tighter">{value}</div>
  </Link>
);

const CommandLink = ({ to, title, desc }: { to: string; title: string; desc: string }) => (
  <Link to={to} className="p-5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10 transition-all group">
    <div className="font-semibold text-sm mb-1 group-hover:text-mira-purple transition-colors">{title}</div>
    <div className="text-xs text-muted-foreground font-light">{desc}</div>
  </Link>
);


export default Account;
