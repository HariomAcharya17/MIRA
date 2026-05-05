import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { TrafficLights } from "@/components/TrafficLights";

const faqs = [
  { q: "Which AI models does Mira support?", a: "Mira routes through NVIDIA's hosted inference. The catalog currently includes Llama 3.1 (70B & 405B), Nemotron 70B, DeepSeek Coder, Qwen 2.5 Coder 32B, Phi-3 Vision, SDXL Turbo, and Gemma 2. You can switch models mid-conversation." },
  { q: "Is my data private?", a: "Yes. By default all chat sessions, downloads, and account data are stored locally in your browser. Nothing is sent to a server unless you explicitly configure cloud sync." },
  { q: "Can I generate images?", a: "Yes. Select an image model like SDXL Turbo and describe what you want. Generated images appear inline and are auto-saved to your Downloads page." },
  { q: "How does file upload work?", a: "Drag-and-drop or use the paperclip icon. Mira sends file metadata to vision-capable models and uses content for context where supported." },
  { q: "Is there an API?", a: "An official Mira API is on the roadmap. Today, you can wire your own NVIDIA API key into the workspace for full programmatic access." },
  { q: "How is usage tracked?", a: "Every request records prompt and completion tokens per model. The Usage Dashboard on the AI page shows real-time stats and a 14-day history." },
];

export const FAQ = () => (
  <section id="faq" className="py-24 sm:py-32 relative overflow-hidden">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
      <div className="text-center mb-16">
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-mira-pink mb-4 flex items-center justify-center gap-2">
          <span className="size-1 bg-mira-pink rounded-full animate-pulse" />
          // Knowledge Base
        </div>
        <h2 className="text-4xl sm:text-6xl font-semibold tracking-tighter mb-6 text-gradient-fade">
          Questions & Answers
        </h2>
        <p className="text-muted-foreground font-light text-lg">Detailed information on the Mira neural interface.</p>
      </div>
      
      <div className="glass-panel rounded-2xl overflow-hidden border-white/5 relative">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-mira-pink/30 to-transparent opacity-50" />
        <TrafficLights label="kb / system_specifications.json" />
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((f, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="border-white/5 px-8 hover:bg-white/[0.01] transition-colors group">
              <AccordionTrigger className="text-left hover:no-underline py-6 text-lg font-medium">
                <span className="group-hover:text-mira-pink transition-colors flex items-center gap-4">
                  <span className="text-[10px] font-mono opacity-30 group-hover:opacity-100 transition-opacity">0{i + 1}</span>
                  {f.q}
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pb-6 text-base font-light max-w-[65ch] animate-in fade-in slide-in-from-top-1 duration-300">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  </section>
);


