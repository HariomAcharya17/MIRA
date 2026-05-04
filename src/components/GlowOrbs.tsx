export const GlowOrbs = () => (
  <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
    <div className="absolute top-[-20%] left-[-10%] size-[700px] glow-orb animate-drift" />
    <div className="absolute bottom-[-10%] right-[-5%] size-[600px] glow-orb animate-drift" style={{ animationDelay: "-6s" }} />
    <div className="absolute inset-0 grid-bg opacity-40" />
  </div>
);
