import { useState, useEffect } from "react";
import { User, Mail, MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const Typewriter = ({ words }: { words: string[] }) => {
  const [text, setText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(80);

  useEffect(() => {
    let timer = setTimeout(() => {
      const i = loopNum % words.length;
      const fullText = words[i];

      if (isDeleting) {
        setText(fullText.substring(0, text.length - 1));
        setTypingSpeed(30);
      } else {
        setText(fullText.substring(0, text.length + 1));
        setTypingSpeed(80);
      }

      if (!isDeleting && text === fullText) {
        setTimeout(() => setIsDeleting(true), 2500);
      } else if (isDeleting && text === "") {
        setIsDeleting(false);
        setLoopNum(loopNum + 1);
        setTypingSpeed(500);
      }
    }, typingSpeed);

    return () => clearTimeout(timer);
  }, [text, isDeleting, loopNum, words, typingSpeed]);

  return (
    <span>
      {text}
      <span className="animate-pulse border-r-2 border-foreground/50 ml-1 h-4 inline-block align-middle" />
    </span>
  );
};

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
    await new Promise((r) => setTimeout(r, 800));
    toast.success("Message sent successfully.");
    setName(""); setEmail(""); setMessage("");
    setSending(false);
  };

  return (
    <section id="contact" className="py-24 sm:py-32 relative overflow-hidden flex justify-center">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.2 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="max-w-2xl w-full px-4 sm:px-6 relative z-10"
      >
        <div className="relative group">
          {/* Glowing Background */}
          <div className="absolute -inset-1 bg-gradient-to-r from-mira-purple via-mira-pink to-mira-cyan rounded-xl blur-3xl opacity-10 group-hover:opacity-20 transition duration-1000" />

          <div className="relative rounded-3xl overflow-hidden border border-border shadow-2xl bg-card/40 backdrop-blur-xl">
            {/* Header */}
            <div className="h-12 bg-muted/30 backdrop-blur-sm border-b border-border flex items-center px-4">
              <div className="flex gap-2">
                <div className="size-3 rounded-full bg-[#FF5F56] border border-black/10" />
                <div className="size-3 rounded-full bg-[#FFBD2E] border border-black/10" />
                <div className="size-3 rounded-full bg-[#27C93F] border border-black/10" />
              </div>
              <div className="mx-auto text-[10px] font-mono text-muted-foreground uppercase tracking-widest font-bold">
                operator-comm // v1.0
              </div>
              <div className="w-12" />
            </div>

            {/* Chat Area */}
            <div className="p-6 sm:p-8 space-y-6">
              <div className="flex">
                <div className="bg-muted/50 backdrop-blur-sm border border-border text-foreground text-[14px] rounded-2xl rounded-tl-sm px-5 py-4 max-w-[85%] leading-relaxed font-mono shadow-sm flex items-center">
                  <Typewriter words={[
                    "Awaiting your command...",
                    "Let's architect the future together 🚀",
                    "How can I assist your engineering goals?"
                  ]} />
                </div>
              </div>
              <div className="flex justify-end">
                <div className="bg-mira-purple text-white text-[14px] rounded-2xl rounded-tr-sm px-5 py-4 max-w-[85%] leading-relaxed shadow-lg shadow-mira-purple/20">
                  I'd love to collaborate with you.
                </div>
              </div>
            </div>

            {/* Form Area */}
            <div className="p-6 sm:p-8 pt-2">
              <form onSubmit={submit} className="space-y-4">
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-mira-purple transition-colors" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full h-12 bg-background/40 backdrop-blur-sm border border-border focus:border-mira-purple focus:ring-1 focus:ring-mira-purple rounded-xl pl-11 pr-4 text-sm outline-none transition-all placeholder:text-muted-foreground/60"
                    required
                  />
                </div>

                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-mira-purple transition-colors" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full h-12 bg-background/40 backdrop-blur-sm border border-border focus:border-mira-purple focus:ring-1 focus:ring-mira-purple rounded-xl pl-11 pr-4 text-sm outline-none transition-all placeholder:text-muted-foreground/60"
                    required
                  />
                </div>

                <div className="relative group">
                  <MessageSquare className="absolute left-4 top-4 size-4 text-muted-foreground group-focus-within:text-mira-purple transition-colors" />
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Objective details..."
                    className="w-full min-h-[120px] bg-background/40 backdrop-blur-sm border border-border focus:border-mira-purple focus:ring-1 focus:ring-mira-purple rounded-xl pl-11 pr-4 py-4 text-sm outline-none transition-all placeholder:text-muted-foreground/60 resize-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className="w-full h-12 bg-mira-purple hover:bg-mira-purple/90 text-white rounded-xl flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-widest transition-all shadow-lg shadow-mira-purple/20 disabled:opacity-70 mt-2 active:scale-[0.98]"
                >
                  <Send className={cn("size-4", sending ? "animate-pulse" : "")} />
                  {sending ? "Transmitting..." : "Execute Send"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};