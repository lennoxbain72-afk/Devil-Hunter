import { useEffect, useState } from "react";

interface DeathExplosionProps {
  isActive: boolean;
  x: number;
  y: number;
}

export default function DeathExplosion({ isActive, x, y: _y }: DeathExplosionProps) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; color: string; size: number; delay: number }>>([]);
  const [rings, setRings] = useState<Array<{ id: number; delay: number }>>([]);

  useEffect(() => {
    if (isActive) {
      // Create explosion particles
      const newParticles = [];
      const colors = ["#ff4444", "#ff8800", "#ffcc00", "#ff0000", "#ff6600", "#ffffff"];
      
      for (let i = 0; i < 40; i++) {
        const angle = (Math.PI * 2 * i) / 40 + Math.random() * 0.3;
        const distance = 100 + Math.random() * 150;
        newParticles.push({
          id: i,
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance - 50, // Bias upward
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 8 + Math.random() * 20,
          delay: Math.random() * 100
        });
      }
      setParticles(newParticles);

      // Create expanding rings
      setRings([
        { id: 0, delay: 0 },
        { id: 1, delay: 100 },
        { id: 2, delay: 200 }
      ]);
    } else {
      setParticles([]);
      setRings([]);
    }
  }, [isActive]);

  if (!isActive) return null;

  return (
    <div 
      className="absolute z-50 pointer-events-none"
      style={{ left: x, bottom: 100 }}
    >
      {/* Central flash */}
      <div 
        className="absolute w-40 h-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
        style={{
          animation: "explosion-flash 0.3s ease-out forwards",
          boxShadow: "0 0 100px 50px rgba(255, 255, 255, 0.8), 0 0 200px 100px rgba(255, 100, 0, 0.5)"
        }}
      />

      {/* Expanding rings */}
      {rings.map(ring => (
        <div
          key={ring.id}
          className="absolute w-32 h-32 -translate-x-1/2 -translate-y-1/2 rounded-full border-orange-500"
          style={{
            animation: "explosion-ring 0.6s ease-out forwards",
            animationDelay: `${ring.delay}ms`,
            opacity: 0
          }}
        />
      ))}

      {/* Explosion particles */}
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute rounded-full -translate-x-1/2 -translate-y-1/2"
          style={{
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            boxShadow: `0 0 ${particle.size}px ${particle.color}`,
            "--explosion-x": particle.x,
            "--explosion-y": particle.y,
            animation: "explosion-particle 0.8s ease-out forwards",
            animationDelay: `${particle.delay}ms`
          } as React.CSSProperties}
        />
      ))}

      {/* Body parts flying off (silhouettes) */}
      {[...Array(8)].map((_, i) => {
        const angle = (Math.PI * 2 * i) / 8;
        const distance = 80 + Math.random() * 100;
        return (
          <div
            key={`part-${i}`}
            className="absolute bg-red-900 rounded"
            style={{
              width: 15 + Math.random() * 20,
              height: 20 + Math.random() * 30,
              "--explosion-x": Math.cos(angle) * distance,
              "--explosion-y": Math.sin(angle) * distance - 30,
              animation: "explosion-particle 1s ease-out forwards",
              animationDelay: `${50 + Math.random() * 100}ms`,
              transform: `rotate(${Math.random() * 360}deg)`
            } as React.CSSProperties}
          />
        );
      })}

      {/* Blood splatter */}
      {[...Array(20)].map((_, i) => {
        const angle = Math.random() * Math.PI * 2;
        const distance = 50 + Math.random() * 200;
        return (
          <div
            key={`blood-${i}`}
            className="absolute bg-red-600 rounded-full"
            style={{
              width: 4 + Math.random() * 8,
              height: 4 + Math.random() * 8,
              "--explosion-x": Math.cos(angle) * distance,
              "--explosion-y": Math.sin(angle) * distance,
              animation: "explosion-particle 0.6s ease-out forwards",
              animationDelay: `${Math.random() * 150}ms`
            } as React.CSSProperties}
          />
        );
      })}
    </div>
  );
}
