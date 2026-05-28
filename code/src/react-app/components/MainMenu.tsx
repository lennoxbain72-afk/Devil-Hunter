import { cn } from "@/react-app/lib/utils";

interface MainMenuProps {
  onStartGame: () => void;
}

export function MainMenu({ onStartGame }: MainMenuProps) {
  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-black flex flex-col items-center justify-center">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Blood red gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-red-950/40 via-black to-red-950/30" />
        
        {/* Animated blood drips */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute top-0 w-1 bg-gradient-to-b from-red-700 to-transparent opacity-60"
            style={{
              left: `${10 + i * 12}%`,
              height: `${30 + Math.random() * 40}%`,
              animationDelay: `${i * 0.5}s`,
            }}
          />
        ))}
        
        {/* Manga speed lines */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 20px,
              white 20px,
              white 21px
            )`
          }}
        />
        
        {/* Vignette */}
        <div className="absolute inset-0 bg-radial-gradient pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at center, transparent 0%, black 70%)"
          }}
        />
      </div>

      {/* Chainsaw decorations */}
      <div className="absolute top-10 left-10 w-48 h-6 bg-gradient-to-r from-gray-700 to-gray-500 opacity-20 rotate-[-30deg]"
        style={{ clipPath: "polygon(0 30%, 100% 0%, 100% 100%, 0 70%)" }}
      />
      <div className="absolute bottom-20 right-10 w-64 h-8 bg-gradient-to-r from-gray-700 to-gray-500 opacity-20 rotate-[15deg]"
        style={{ clipPath: "polygon(0 30%, 100% 0%, 100% 100%, 0 70%)" }}
      />

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center gap-8 px-4">
        {/* Title */}
        <div className="flex flex-col items-center gap-2">
          <h1 className="font-display text-6xl md:text-8xl lg:text-9xl text-red-600 manga-shadow tracking-wider animate-pulse">
            DEVIL
          </h1>
          <h1 className="font-display text-6xl md:text-8xl lg:text-9xl text-orange-500 manga-shadow tracking-wider">
            HUNTER
          </h1>
        </div>

        {/* Tagline */}
        <p className="font-display text-xl md:text-2xl text-muted-foreground tracking-[0.3em] uppercase">
          Chainsaws. Devils. Contracts.
        </p>

        {/* Start Button */}
        <button
          onClick={onStartGame}
          className={cn(
            "mt-8 px-12 py-5 bg-gradient-to-b from-red-600 to-red-900",
            "text-white font-display text-3xl md:text-4xl uppercase tracking-widest",
            "border-4 border-red-400 hover:border-red-300",
            "hover:from-red-500 hover:to-red-800",
            "active:scale-95 transition-all duration-150",
            "shadow-[0_0_40px_rgba(220,38,38,0.5)]",
            "hover:shadow-[0_0_60px_rgba(220,38,38,0.7)]",
            "animate-pulse-glow"
          )}
          style={{ clipPath: "polygon(5% 0%, 100% 0%, 95% 100%, 0% 100%)" }}
        >
          Fight
        </button>

        {/* Controls Info */}
        <div className="mt-12 flex flex-col items-center gap-3 text-muted-foreground">
          <p className="font-display text-lg tracking-wider">CONTROLS</p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <kbd className="px-3 py-1 bg-gray-800/50 border border-gray-600 rounded font-mono">A/D</kbd>
              <span>Move</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-3 py-1 bg-blue-900/50 border border-blue-700 rounded font-mono">W</kbd>
              <span>Jump</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-3 py-1 bg-red-900/50 border border-red-700 rounded font-mono">J</kbd>
              <span>Attack</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-3 py-1 bg-gray-800/50 border border-gray-600 rounded font-mono">K</kbd>
              <span>Block</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-3 py-1 bg-orange-900/50 border border-orange-700 rounded font-mono">L</kbd>
              <span>Special</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-4 text-center text-xs text-muted-foreground/50 tracking-widest uppercase">
        Inspired by Chainsaw Man
      </div>
    </div>
  );
}
