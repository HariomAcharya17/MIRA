import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  { q: "Which AI models does Mira support?", a: "Mira routes through NVIDIA's hosted inference. The catalog currently includes Llama 3.1 (70B & 405B), Nemotron 70B, DeepSeek Coder, Qwen 2.5 Coder 32B, Phi-3 Vision, SDXL Turbo, and Gemma 2. You can switch models mid-conversation." },
  { q: "Is my data private?", a: "Yes. By default all chat sessions, downloads, and account data are stored locally in your browser. Nothing is sent to a server unless you explicitly configure cloud sync." },
  { q: "Can I generate images?", a: "Yes. Select an image model like SDXL Turbo and describe what you want. Generated images appear inline and are auto-saved to your Downloads page." },
  { q: "How does file upload work?", a: "Drag-and-drop or use the paperclip icon. Mira sends file metadata to vision-capable models and uses content for context where supported." },
  { q: "Is there an API?", a: "An official Mira API is on the roadmap. Today, you can wire your own NVIDIA API key into the workspace for full programmatic access." },
  { q: "How is usage tracked?", a: "Every request records prompt and completion tokens per model. The Usage Dashboard on the AI page shows real-time stats and a 14-day history." },
];

export const FAQ = () => (
  <section id="faq" className="py-20 sm:py-32">
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <div className="text-xs font-mono uppercase tracking-widest text-mira-pink mb-3">// FAQ</div>
        <h2 className="text-4xl sm:text-5xl font-semibold tracking-tighter mb-4 text-gradient-fade">
          Questions, answered
        </h2>
      </div>
      <Accordion type="single" collapsible className="glass-panel rounded-xl px-6">
        {faqs.map((f, i) => (
          <AccordionItem key={i} value={`item-${i}`} className="border-border/60">
            <AccordionTrigger className="text-left hover:no-underline">{f.q}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed">{f.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  </section>
);
