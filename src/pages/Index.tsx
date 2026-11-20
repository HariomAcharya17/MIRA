import { useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { Contact } from "@/components/landing/Contact";

const Index = () => {
  // Support deep links like /#features from other pages.
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (!id) return;
    const t = setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <Layout>
      <Hero />
      <Features />
      <Contact />
    </Layout>
  );
};

export default Index;
