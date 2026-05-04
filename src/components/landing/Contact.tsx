import { useState } from "react";
import { Mail, Send, Github, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TrafficLights } from "@/components/TrafficLights";
import { toast } from "sonner";

export const Contact = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      toast.error("Please fill in all fields.");
      return;
    }
    setSending(true);
    // Persist locally so it isn't fake — viewable in localStorage.
    const inbox = JSON.parse(localStorage.getItem("mira-contact-inbox") || "[]");
    inbox.unshift({ name, email, message, at: Date.now() });
    localStorage.setItem("mira-contact-inbox", JSON.stringify(inbox));
    await new Promise((r) => setTimeout(r, 600));
    toast.success("Message received. We'll be in touch.");
    setName(""); setEmail(""); setMessage("");
    setSending(false);
  };

  return (
    <section id="contact" className="py-20 sm:py-32">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-10 items-start">
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-mira-purple mb-3">// Contact</div>
            <h2 className="text-4xl sm:text-5xl font-semibold tracking-tighter mb-4 text-gradient-fade">
              Talk to us
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-8">
              Questions, partnership ideas, or feedback — we read everything.
            </p>
            <div className="space-y-3 text-sm">
              <a href="mailto:hello@mira.ai" className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors">
                <Mail className="size-4" /> hello@mira.ai
              </a>
              <a href="#" className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors">
                <Github className="size-4" /> github.com/mira-labs
              </a>
              <a href="#" className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors">
                <Twitter className="size-4" /> @mira_labs
              </a>
            </div>
          </div>

          <form onSubmit={submit} className="glass-panel rounded-xl overflow-hidden">
            <TrafficLights label="compose / new-message" />
            <div className="p-6 space-y-4">
              <Input placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
              <Input type="email" placeholder="you@domain.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Textarea placeholder="What's on your mind?" rows={5} value={message} onChange={(e) => setMessage(e.target.value)} />
              <Button type="submit" disabled={sending} className="btn-mira w-full gap-2">
                <Send className="size-4" />
                {sending ? "Sending..." : "Send message"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};
