import { Link } from "react-router-dom";

export const Footer = () => (
  <footer className="border-t border-border/40 mt-24">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="size-2.5 rounded-full bg-gradient-mira" />
          <span className="font-bold tracking-tight">MIRA</span>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          The neural interface for advanced AI. Built for builders.
        </p>
      </div>
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Product</h4>
        <ul className="space-y-2 text-sm">
          <li><Link to="/ai" className="hover:text-foreground text-muted-foreground">AI Chat</Link></li>
          <li><Link to="/history" className="hover:text-foreground text-muted-foreground">History</Link></li>
          <li><Link to="/downloads" className="hover:text-foreground text-muted-foreground">Downloads</Link></li>
        </ul>
      </div>
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Company</h4>
        <ul className="space-y-2 text-sm">
          <li><a href="/#about" className="hover:text-foreground text-muted-foreground">About</a></li>
          <li><a href="/#blog" className="hover:text-foreground text-muted-foreground">Blog</a></li>
          <li><a href="/#contact" className="hover:text-foreground text-muted-foreground">Contact</a></li>
        </ul>
      </div>
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Legal</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>Privacy Policy</li>
          <li>Terms of Service</li>
        </ul>
      </div>
    </div>
    <div className="border-t border-border/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-muted-foreground">
        <span>© {new Date().getFullYear()} Mira Labs. All rights reserved.</span>
        <span className="font-mono">v1.0.0 · Stratospheric Command</span>
      </div>
    </div>
  </footer>
);
