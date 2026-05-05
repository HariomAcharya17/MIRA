import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/layout/Layout";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { Contact } from "@/components/landing/Contact";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Removed auto-redirect to allow logged-in users to view landing page features/contact
  useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.substring(1);
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    }
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
