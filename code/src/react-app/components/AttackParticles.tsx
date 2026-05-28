import { useEffect, useState } from "react";
import { cn } from "@/react-app/lib/utils";

interface Particle {
  id: number;
  x: number;
  y: number;
  angle: number;
  speed: number;
  size: number;
  color: string;
}

interface AttackParticlesProps {
  isActive: boolean;
  position: "left" | "right";
  type?: "normal" | "special" | "charge";
  onComplete?: () => void;
}

export function AttackParticles({ isActive, position, type = "normal", onComplete }: AttackParticlesProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!isActive) {
      setParticles([]);
      return;
    }

    // Generate particles based on type
    const particleCount = type === "special" ? 20 : type === "charge" ? 15 : 12;
    const colors = type === "special" 
      ? ["#ff6b00", "#ff9500", "#ffcc00", "#ff4400"]
      : type === "charge"
      ? ["#9333ea", "#a855f7", "#c084fc", "#e879f9"]
      : ["#ef4444", "#f97316", "#fbbf24", "#ffffff"];

    const newParticles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      newParticles.push({
        id: i,
        x: position === "left" ? 30 : 70,
        y: 40 + Math.random() * 20,
        angle: position === "left" 
          ? -30 + Math.random() * 60 
          : 120 + Math.random() * 60,
        speed: 3 + Math.random() * 5,
        size: type === "special" ? 8 + Math.random() * 12 : 4 + Math.random() * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
    setParticles(newParticles);

    // Clear particles after animation
    const timer = setTimeout(() => {
      setParticles([]);
      onComplete?.();
    }, type === "charge" ? 800 : 400);

    return () => clearTimeout(timer);
  }, [isActive, position, type, onComplete]);

  if (particles.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-30">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className={cn(
            "absolute rounded-full",
            type === "charge" && "animate-pulse"
          )}
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
            animation: type === "charge" 
              ? `particle-converge 0.8s ease-in forwards`
              : `particle-burst 0.4s ease-out forwards`,
            transform: `rotate(${particle.angle}deg)`,
            ["--particle-angle" as string]: `${particle.angle}deg`,
            ["--particle-speed" as string]: `${particle.speed * 10}px`,
          }}
        />
      ))}
    </div>
  );
}

interface ChargeUpEffectProps {
  isActive: boolean;
  position: "left" | "right";
}

export function ChargeUpEffect({ isActive, position }: ChargeUpEffectProps) {
  if (!isActive) return null;

  return (
    <div 
      className={cn(
        "absolute z-30 pointer-events-none",
        position === "left" ? "left-[15%]" : "right-[15%]",
        "top-1/2 -translate-y-1/2"
      )}
    >
      {/* Charging orb */}
      <div className="relative w-32 h-32 -mt-16">
        {/* Inner core */}
        <div className="absolute inset-8 rounded-full bg-purple-500 animate-pulse" 
          style={{ boxShadow: "0 0 30px #a855f7, 0 0 60px #9333ea" }}
        />
        
        {/* Rotating rings */}
        <div className="absolute inset-4 border-4 border-purple-400/50 rounded-full animate-spin"
          style={{ animationDuration: "1s" }}
        />
        <div className="absolute inset-2 border-2 border-fuchsia-400/30 rounded-full animate-spin"
          style={{ animationDuration: "0.7s", animationDirection: "reverse" }}
        />
        <div className="absolute inset-0 border border-purple-300/20 rounded-full animate-spin"
          style={{ animationDuration: "1.5s" }}
        />
        
        {/* Energy particles converging */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-3 h-3 bg-purple-400 rounded-full"
            style={{
              left: "50%",
              top: "50%",
              animation: `charge-particle 0.8s ease-in infinite`,
              animationDelay: `${i * 0.1}s`,
              transform: `rotate(${i * 45}deg) translateY(-50px)`,
              boxShadow: "0 0 10px #a855f7",
            }}
          />
        ))}
      </div>
      
      {/* Warning text */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
        <span className="font-display text-xl text-purple-400 animate-pulse tracking-widest">
          CHARGING...
        </span>
      </div>
    </div>
  );
}
