import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";

const REPO_URL = "https://github.com/HariomAcharya17/MIRA";

export const Footer = () => (
  <footer className="border-t border-border mt-24">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 flex flex-col sm:flex-row gap-8 sm:items-start sm:justify-between">
      <div className="max-w-xs">
        <Link to="/" className="flex items-center gap-2">
          <Logo className="size-6 text-xs" />
          <span className="font-semibold">Mira</span>
        </Link>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          A chat app for open models from Groq and NVIDIA, with web search and project generation.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm">
        <span className="font-medium text-foreground">Product</span>
        <span className="font-medium text-foreground">Project</span>
        <Link to="/ai" className="text-muted-foreground hover:text-foreground">Chat</Link>
        <a href={REPO_URL} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground">Source code</a>
        <Link to="/#features" className="text-muted-foreground hover:text-foreground">Features</Link>
        <a href={`${REPO_URL}/issues`} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground">Report an issue</a>
      </div>
    </div>
    <div className="border-t border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 text-xs text-muted-foreground">
        © {new Date().getFullYear()} Hariom Acharya
      </div>
    </div>
  </footer>
);
