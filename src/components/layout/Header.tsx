import { Link, NavLink, useLocation } from "react-router-dom";
import { useState } from "react";
import { Moon, Sun, Menu, X, LogOut } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";

const sectionLinks = [
  { label: "Features", hash: "features" },
  { label: "Contact", hash: "contact" },
];

const appLinks = [
  { label: "Chat", to: "/ai" },
  { label: "History", to: "/history" },
  { label: "Downloads", to: "/downloads" },
];

export const Header = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const scrollTo = (e: React.MouseEvent, hash: string) => {
    setOpen(false);
    if (location.pathname !== "/") return; // let the router navigate to /#hash
    e.preventDefault();
    document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" });
  };

  const navClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "px-3 py-1.5 rounded-md text-sm transition-colors",
      isActive ? "text-foreground bg-accent" : "text-muted-foreground hover:text-foreground",
    );

  return (
    <header className="fixed top-0 inset-x-0 z-50 h-14 border-b border-border bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="max-w-6xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2" aria-label="Mira home">
            <Logo />
            <span className="font-semibold tracking-tight">Mira</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {sectionLinks.map((l) => (
              <Link
                key={l.hash}
                to={`/#${l.hash}`}
                onClick={(e) => scrollTo(e, l.hash)}
                className="px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {l.label}
              </Link>
            ))}
            {user && appLinks.map((l) => (
              <NavLink key={l.to} to={l.to} className={navClass}>
                {l.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            className="size-9 text-muted-foreground hover:text-foreground"
          >
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>

          {user ? (
            <div className="hidden md:flex items-center gap-1.5">
              <NavLink to="/account" className={navClass}>
                {user.name.split(" ")[0] || "Account"}
              </NavLink>
              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                aria-label="Sign out"
                title="Sign out"
                className="size-9 text-muted-foreground hover:text-foreground"
              >
                <LogOut className="size-4" />
              </Button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-1.5">
              <Button asChild variant="ghost" size="sm">
                <Link to="/login">Sign in</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/signup">Get started</Link>
              </Button>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden size-9"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-b border-border bg-background">
          <nav className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-0.5">
            {sectionLinks.map((l) => (
              <Link
                key={l.hash}
                to={`/#${l.hash}`}
                onClick={(e) => scrollTo(e, l.hash)}
                className="px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                {l.label}
              </Link>
            ))}
            <div className="h-px bg-border my-2" />
            {user ? (
              <>
                {[...appLinks, { label: "Account", to: "/account" }].map((l) => (
                  <NavLink key={l.to} to={l.to} onClick={() => setOpen(false)} className={navClass}>
                    {l.label}
                  </NavLink>
                ))}
                <button
                  onClick={() => {
                    setOpen(false);
                    logout();
                  }}
                  className="px-3 py-2 rounded-md text-sm text-left text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)} className="px-3 py-2 rounded-md text-sm hover:bg-accent">
                  Sign in
                </Link>
                <Link to="/signup" onClick={() => setOpen(false)} className="px-3 py-2 rounded-md text-sm hover:bg-accent">
                  Create account
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};
