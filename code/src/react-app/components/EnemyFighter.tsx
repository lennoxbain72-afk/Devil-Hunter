import { useRef } from "react";
import { cn } from "@/react-app/lib/utils";

// Bat Devil asset URLs
const ASSETS = {
  batDevilIdle: "https://019e6ae0-fa01-710e-a8de-1015605547ea.mochausercontent.com/6b2f0577-e9c8-448e-a432-f354d2cecc95.png",
  batDevilWalking: "https://019e6ae0-fa01-710e-a8de-1015605547ea.mochausercontent.com/PixVerse_V6_Image_Text_360P_give_this_characte_2.webm",
};

interface EnemyFighterProps {
  isAttacking: boolean;
  isBlocking: boolean;
  isHit: boolean;
  health: number;
  isMoving?: boolean;
  moveDirection?: "left" | "right";
}

export function EnemyFighter({ 
  isAttacking, 
  isBlocking, 
  isHit, 
  health, 
  isMoving = false,
  moveDirection = "left"
}: EnemyFighterProps) {
  const isDead = health <= 0;
  const walkingVideoRef = useRef<HTMLVideoElement>(null);

  return (
    <div className={cn(
      "relative flex flex-col items-center transition-all duration-150",
      isHit && "animate-hit-flinch-right",
    )}>
      {/* Black fog cloud — appears while the Bat Devil is moving, masking the
          video background edges and giving it a smoky, ominous entrance. */}
      {isMoving && !isDead && (
        <div className="absolute inset-0 z-0 pointer-events-none animate-fog-in flex items-center justify-center">
          {/* Soft dark base haze */}
          <div
            className="absolute w-48 h-48 md:w-60 md:h-60 rounded-full blur-2xl animate-fog-0"
            style={{ background: "radial-gradient(circle, rgba(0,0,0,0.9) 30%, rgba(20,0,30,0.55) 60%, transparent 75%)" }}
          />
          {/* Drifting puffs */}
          <div
            className="absolute w-32 h-32 md:w-40 md:h-40 rounded-full blur-xl animate-fog-1"
            style={{ left: "10%", top: "20%", background: "radial-gradient(circle, rgba(10,5,20,0.95) 40%, transparent 72%)" }}
          />
          <div
            className="absolute w-32 h-32 md:w-44 md:h-44 rounded-full blur-xl animate-fog-2"
            style={{ right: "8%", bottom: "12%", background: "radial-gradient(circle, rgba(0,0,0,0.95) 40%, transparent 72%)" }}
          />
          <div
            className="absolute w-28 h-28 md:w-36 md:h-36 rounded-full blur-2xl animate-fog-0"
            style={{ left: "25%", bottom: "8%", animationDelay: "0.4s", background: "radial-gradient(circle, rgba(15,0,25,0.85) 40%, transparent 70%)" }}
          />
        </div>
      )}

      {/* Fighter Container */}
      <div
        className={cn(
          "relative z-10 w-40 h-56 md:w-52 md:h-72 transition-all duration-150 overflow-hidden",
          isAttacking && "animate-attack-lunge-left",
          isBlocking && "scale-95 brightness-75",
          isDead && "opacity-30 grayscale rotate-[-90deg] translate-y-10",
          isHit && "brightness-150"
        )}
      >
        {/* Red damage flash on impact */}
        {isHit && (
          <div className="absolute inset-0 z-20 bg-red-600 mix-blend-hard-light animate-damage-flash pointer-events-none" />
        )}

        {/* Idle Image */}
        <img
          src={ASSETS.batDevilIdle}
          alt="Bat Devil"
          className={cn(
            "absolute inset-0 w-full h-full object-contain transition-opacity duration-100",
            isMoving ? "opacity-0" : "opacity-100"
          )}
          style={{ transform: moveDirection === "right" ? "scaleX(-1)" : "scaleX(1)" }}
        />

        {/* Walking Video */}
        <video
          ref={walkingVideoRef}
          src={ASSETS.batDevilWalking}
          className={cn(
            "absolute inset-0 w-full h-full object-contain transition-opacity duration-100",
            isMoving ? "opacity-100" : "opacity-0"
          )}
          style={{ transform: moveDirection === "right" ? "scaleX(-1)" : "scaleX(1)" }}
          autoPlay
          loop
          muted
          playsInline
        />

        {/* Block Shield Effect */}
        {isBlocking && (
          <div className="absolute inset-0 border-4 border-purple-400/50 rounded-lg animate-pulse" />
        )}

        {/* Attack Glow */}
        {isAttacking && (
          <div className="absolute inset-0 bg-red-500/20 animate-pulse" />
        )}
      </div>

      {/* Ground shadow */}
      <div className={cn(
        "w-24 h-4 bg-black/50 rounded-full blur-sm mt-2",
        isDead && "opacity-0"
      )} />
    </div>
  );
}
