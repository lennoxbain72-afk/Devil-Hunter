import { useEffect, useState } from "react";
import { cn } from "@/react-app/lib/utils";

interface HitEffectProps {
  isActive: boolean;
  position: "left" | "right";
  isSpecial?: boolean;
}

interface Spark {
  id: number;
  x: number;
  y: number;
  angle: number;
  size: number;
  delay: number;
}

export function HitEffect({ isActive, position, isSpecial = false }: HitEffectProps) {
  const [sparks, setSparks] = useState<Spark[]>([]);
  const [showEffect, setShowEffect] = useState(false);

  useEffect(() => {
    if (isActive) {
      // Generate random sparks
      const newSparks: Spark[] = Array.from({ length: isSpecial ? 12 : 6 }, (_, i) => ({
        id: Date.now() + i,
        x: Math.random() * 40 - 20,
        y: Math.random() * 40 - 20,
        angle: Math.random() * 360,
        size: isSpecial ? 8 + Math.random() * 12 : 4 + Math.random() * 8,
        delay: Math.random() * 50,
      }));
      
      setSparks(newSparks);
      setShowEffect(true);

      const timer = setTimeout(() => {
        setShowEffect(false);
        setSparks([]);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [isActive, isSpecial]);

  if (!showEffect) return null;

  return (
    <div 
      className={cn(
        "absolute z-30 pointer-events-none",
        position === "left" ? "left-1/3" : "right-1/3",
        "top-1/2 -translate-y-1/2"
      )}
    >
      {/* Impact burst */}
      <div className={cn(
        "absolute -translate-x-1/2 -translate-y-1/2",
        isSpecial ? "w-32 h-32" : "w-20 h-20",
        "animate-hit-burst"
      )}>
        {/* Star burst */}
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <polygon 
            points="50,0 61,35 98,35 68,57 79,91 50,70 21,91 32,57 2,35 39,35" 
            className={cn(
              isSpecial ? "fill-orange-400" : "fill-yellow-300",
              "animate-pulse"
            )}
          />
        </svg>
      </div>

      {/* Flying sparks */}
      {sparks.map((spark) => (
        <div
          key={spark.id}
          className={cn(
            "absolute rounded-full animate-spark-fly",
            isSpecial 
              ? "bg-gradient-to-r from-orange-400 to-red-500" 
              : "bg-gradient-to-r from-yellow-300 to-white"
          )}
          style={{
            width: spark.size,
            height: spark.size,
            left: spark.x,
            top: spark.y,
            animationDelay: `${spark.delay}ms`,
            transform: `rotate(${spark.angle}deg)`,
          }}
        />
      ))}

      {/* Impact text */}
      <div className={cn(
        "absolute -top-12 left-1/2 -translate-x-1/2 font-display tracking-wider animate-hit-text",
        isSpecial ? "text-4xl text-orange-400" : "text-2xl text-yellow-300"
      )}>
        {isSpecial ? "BOOM!" : "HIT!"}
      </div>

      {/* Radial lines */}
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className={cn(
            "absolute left-1/2 top-1/2 origin-left animate-radial-line",
            isSpecial ? "bg-orange-400/60 h-1 w-16" : "bg-yellow-300/60 h-0.5 w-10"
          )}
          style={{
            transform: `rotate(${i * 45}deg)`,
            animationDelay: `${i * 20}ms`,
          }}
        />
      ))}
    </div>
  );
}
