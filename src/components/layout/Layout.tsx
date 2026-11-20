import { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";

export const Layout = ({ children, hideFooter = false }: { children: ReactNode; hideFooter?: boolean }) => (
  <div className="min-h-dvh flex flex-col bg-background text-foreground">
    <Header />
    <main className="flex-1 pt-14 min-h-0 flex flex-col">{children}</main>
    {!hideFooter && <Footer />}
  </div>
);
