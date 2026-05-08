
export const Footer = () => (
  <footer className="relative mt-32 pb-20 overflow-hidden border-t border-border/40">
    {/* Large Atmospheric Background Glows */}
    <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-mira-purple/10 blur-[150px] -translate-y-1/2 pointer-events-none" />
    <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-mira-cyan/10 blur-[150px] -translate-y-1/2 pointer-events-none" />
    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-64 bg-gradient-to-t from-mira-purple/10 to-transparent blur-[120px] rounded-full pointer-events-none" />

    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
      <div className="flex flex-col items-center text-center">
        {/* Big Words / Title */}
        <div className="relative mb-16 group">
          <div className="absolute -inset-x-20 inset-y-0 bg-gradient-to-r from-mira-blue/5 via-mira-purple/10 to-mira-pink/5 blur-3xl opacity-100" />
          
          <h2 className="relative text-4xl sm:text-6xl font-bold tracking-tighter text-foreground mb-8 leading-[1.1]">
            Architecting the future of <br />
            <span className="text-gradient-mira">Frontier Intelligence</span>
          </h2>
          
          <p className="relative max-w-2xl mx-auto text-lg sm:text-xl text-muted-foreground font-light leading-relaxed">
            Mira was conceptualized and developed by <span className="text-foreground font-semibold hover:text-mira-purple transition-colors cursor-default">Hariom Acharya</span> as a unified orchestration layer to democratize access to frontier intelligence, bridging the gap between complex neural architectures and intuitive command-driven workflows.
          </p>
        </div>


        {/* Final Credit Line */}
        <div className="w-full flex flex-col sm:flex-row justify-between items-center pt-10 border-t border-border/40 gap-6 opacity-60">
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-gradient-mira shadow-[0_0_8px_hsl(var(--mira-purple))]" />
            <span className="font-bold tracking-[0.2em] text-[10px] uppercase">MIRA Interface</span>
          </div>
          
          <div className="text-[10px] font-mono uppercase tracking-[0.4em] text-muted-foreground font-medium">
            © {new Date().getFullYear()} Hariom Acharya. All rights reserved.
          </div>
          
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
            Production Release
          </div>
        </div>
      </div>
    </div>
  </footer>
);


