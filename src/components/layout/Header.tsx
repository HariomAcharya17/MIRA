import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Moon, Sun, Menu, X, Sparkles, History, Download, User as UserIcon, MessageSquare, LogOut } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Home", to: "/", section: "home" },
  { label: "About", to: "/#about", section: "about" },
  { label: "Features", to: "/#features", section: "features" },
  { label: "FAQ", to: "/#faq", section: "faq" },
  { label: "Blog", to: "/#blog", section: "blog" },
  { label: "Contact", to: "/#contact", section: "contact" },
];

export const Header = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleAnchor = (e: React.MouseEvent, to: string) => {
    if (!to.includes("#")) return;
    e.preventDefault();
    setOpen(false);
    if (location.pathname !== "/") {
      navigate(to);
    } else {
      const id = to.split("#")[1];
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    if (location.pathname === "/") {
      e.preventDefault();
      document.getElementById("chat-cta")?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header className="fixed top-0 inset-x-0 z-50 border-b border-border/40 bg-background/70 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" onClick={handleLogoClick} className="flex items-center gap-2 group">
            <div className="size-2.5 rounded-full bg-gradient-mira shadow-[0_0_12px_hsl(var(--mira-purple)/0.6)] group-hover:scale-125 transition-transform" />
            <span className="text-lg font-bold tracking-tight">MIRA</span>
          </Link>
          <nav className="hidden lg:flex items-center gap-7">
            {navItems.map((item) => (
              <a
                key={item.to}
                href={item.to}
                onClick={(e) => handleAnchor(e, item.to)}
                className="text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wide"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          {/* Icon nav */}
          <div className="hidden sm:flex items-center gap-1 mr-1">
            <IconLink to="/ai" label="AI Chat" icon={<MessageSquare className="size-4" />} />
            <IconLink to="/history" label="History" icon={<History className="size-4" />} />
            <IconLink to="/downloads" label="Downloads" icon={<Download className="size-4" />} />
          </div>

          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme" className="size-9">
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>

          {user ? (
            <>
              <Link to="/account" className="hidden sm:flex">
                <Button variant="ghost" size="sm" className="gap-2">
                  <UserIcon className="size-4" />
                  <span className="hidden md:inline">{user.name.split(" ")[0]}</span>
                </Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={logout} aria-label="Log out" className="size-9">
                <LogOut className="size-4" />
              </Button>
            </>
          ) : (
            <Link to="/login">
              <Button size="sm" className="gap-1.5 font-semibold">
                <Sparkles className="size-3.5" />
                Login
              </Button>
            </Link>
          )}

          <Button variant="ghost" size="icon" className="lg:hidden size-9" onClick={() => setOpen((o) => !o)} aria-label="Menu">
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-border/40 bg-background/95 backdrop-blur-xl animate-fade-in">
          <nav className="px-4 py-4 flex flex-col gap-1">
            {navItems.map((item) => (
              <a
                key={item.to}
                href={item.to}
                onClick={(e) => handleAnchor(e, item.to)}
                className="px-3 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                {item.label}
              </a>
            ))}
            <div className="h-px bg-border my-2" />
            <Link to="/ai" onClick={() => setOpen(false)} className="px-3 py-2.5 rounded-md text-sm font-medium hover:bg-muted flex items-center gap-2">
              <MessageSquare className="size-4" /> AI Chat
            </Link>
            <Link to="/history" onClick={() => setOpen(false)} className="px-3 py-2.5 rounded-md text-sm font-medium hover:bg-muted flex items-center gap-2">
              <History className="size-4" /> History
            </Link>
            <Link to="/downloads" onClick={() => setOpen(false)} className="px-3 py-2.5 rounded-md text-sm font-medium hover:bg-muted flex items-center gap-2">
              <Download className="size-4" /> Downloads
            </Link>
            <Link to="/account" onClick={() => setOpen(false)} className="px-3 py-2.5 rounded-md text-sm font-medium hover:bg-muted flex items-center gap-2">
              <UserIcon className="size-4" /> My Account
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
};

const IconLink = ({ to, label, icon }: { to: string; label: string; icon: React.ReactNode }) => (
  <NavLink
    to={to}
    title={label}
    className={({ isActive }) =>
      cn(
        "size-9 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors",
        isActive && "text-foreground bg-muted"
      )
    }
  >
    {icon}
  </NavLink>
);
