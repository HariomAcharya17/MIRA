import { Layout } from "@/components/layout/Layout";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { About } from "@/components/landing/About";
import { FAQ } from "@/components/landing/FAQ";
import { Blog } from "@/components/landing/Blog";
import { Contact } from "@/components/landing/Contact";

const Index = () => (
  <Layout>
    <Hero />
    <About />
    <Features />
    <FAQ />
    <Blog />
    <Contact />
  </Layout>
);

export default Index;
