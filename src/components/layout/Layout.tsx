import { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { GlowOrbs } from "@/components/GlowOrbs";

export const Layout = ({ children, hideFooter = false }: { children: ReactNode; hideFooter?: boolean }) => (
  <div className="min-h-dvh flex flex-col text-foreground relative selection:bg-mira-purple/30 selection:text-white">
    <GlowOrbs />
    <Header />
    <main className="flex-1 pt-16 relative z-10">{children}</main>
    {!hideFooter && <Footer />}
  </div>
);


