import { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";

export const Layout = ({ children, hideFooter = false }: { children: ReactNode; hideFooter?: boolean }) => (
  <div className="min-h-dvh flex flex-col bg-background text-foreground">
    <Header />
    <main className="flex-1 pt-16">{children}</main>
    {!hideFooter && <Footer />}
  </div>
);
