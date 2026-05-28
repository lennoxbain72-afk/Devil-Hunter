import { cn } from "@/react-app/lib/utils";

interface HealthBarProps {
  current: number;
  max: number;
  name: string;
  isPlayer: boolean;
  devilPower: number;
  hitCount?: number;
  hitsRequired?: number;
  isTransformed?: boolean;
}

export function HealthBar({ current, max, name, isPlayer, devilPower, hitCount = 0, hitsRequired = 7, isTransformed = false }: HealthBarProps) {
  const healthPercent = Math.max(0, (current / max) * 100);
  const devilPercent = Math.max(0, Math.min(100, devilPower));
  const hitPercent = isPlayer ? Math.min(100, (hitCount / hitsRequired) * 100) : 0;
  const canTransform = hitCount >= hitsRequired && !isTransformed;
  
  const healthColor = healthPercent > 50 
    ? "bg-green-500" 
    : healthPercent > 25 
      ? "bg-yellow-500" 
      : "bg-red-600";

  return (
    <div className={cn(
      "flex flex-col gap-2 w-full max-w-xs",
      isPlayer ? "items-start" : "items-end"
    )}>
      {/* Name */}
      <div className={cn(
        "font-display text-2xl md:text-3xl uppercase tracking-wider manga-shadow",
        isPlayer ? "text-chainsaw" : "text-devil"
      )}>
        {name}
      </div>
      
      {/* Health Bar */}
      <div className="relative w-full h-6 bg-black/80 border-2 border-white/20 overflow-hidden"
        style={{ clipPath: "polygon(0 0, 100% 0, 95% 100%, 5% 100%)" }}>
        <div 
          className={cn(
            "absolute top-0 h-full transition-all duration-300 ease-out",
            healthColor,
            isPlayer ? "left-0" : "right-0"
          )}
          style={{ width: `${healthPercent}%` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
        
        {/* Health text */}
        <div className={cn(
          "absolute inset-0 flex items-center px-4 text-white text-sm font-bold tracking-wider",
          isPlayer ? "justify-start" : "justify-end"
        )}>
          {current}/{max}
        </div>
      </div>

      {/* Devil Power Bar / Hit Counter */}
      <div className="relative w-full h-3 bg-black/80 border border-white/10 overflow-hidden"
        style={{ clipPath: "polygon(0 0, 100% 0, 97% 100%, 3% 100%)" }}>
        <div 
          className={cn(
            "absolute top-0 h-full transition-all duration-500 bg-gradient-to-r",
            isPlayer 
              ? isTransformed 
                ? "left-0 from-orange-500 to-yellow-400"
                : canTransform 
                  ? "left-0 from-orange-400 to-red-500 animate-pulse" 
                  : "left-0 from-orange-500 to-yellow-400"
              : "right-0 from-purple-400 to-purple-600"
          )}
          style={{ width: `${isPlayer ? (isTransformed ? 100 : hitPercent) : devilPercent}%` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent" />
      </div>
      <div className={cn(
        "text-xs uppercase tracking-widest",
        isPlayer ? "text-left" : "text-right",
        canTransform ? "text-orange-400 animate-pulse font-bold" : "text-muted-foreground",
        isTransformed && isPlayer && "text-orange-400 font-bold"
      )}>
        {isPlayer 
          ? isTransformed 
            ? "CHAINSAW MAN" 
            : canTransform 
              ? "SPECIAL READY!" 
              : `Hits: ${hitCount}/${hitsRequired}`
          : "Devil Power"
        }
      </div>
    </div>
  );
}
