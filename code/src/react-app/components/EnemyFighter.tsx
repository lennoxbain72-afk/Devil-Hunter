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
      isHit && "animate-shake",
    )}>
      {/* Fighter Container */}
      <div 
        className={cn(
          "relative w-40 h-56 md:w-52 md:h-72 transition-all duration-150 overflow-hidden",
          isAttacking && "translate-x-[-8px]",
          isBlocking && "scale-95 brightness-75",
          isDead && "opacity-30 grayscale rotate-[-90deg] translate-y-10",
          isHit && "brightness-150"
        )}
      >
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
