import { useRef, useEffect } from "react";
import { cn } from "@/react-app/lib/utils";

// Video asset URLs
const VIDEOS = {
  denjiIdle: "https://019e6ae0-fa01-710e-a8de-1015605547ea.mochausercontent.com/walking_animation-Picsart-BackgroundRemover.mov",
  denjiWalking: "https://019e6ae0-fa01-710e-a8de-1015605547ea.mochausercontent.com/walking_animation-Picsart-BackgroundRemover.mov",
  transformation: "https://019e6ae0-fa01-710e-a8de-1015605547ea.mochausercontent.com/pntgp93f2p1a1-Picsart-BackgroundRemover.mov",
  chainsawManIdle: "https://019e6ae0-fa01-710e-a8de-1015605547ea.mochausercontent.com/54lx902bx9z91-Picsart-BackgroundRemover.mov",
  chainsawManWalking: "https://019e6ae0-fa01-710e-a8de-1015605547ea.mochausercontent.com/monster_walking_animation-Picsart-BackgroundRemover.mov",
};

interface PlayerFighterProps {
  isAttacking: boolean;
  isBlocking: boolean;
  isHit: boolean;
  health: number;
  isTransformed: boolean;
  isTransforming: boolean;
  onTransformComplete: () => void;
  isWalking?: boolean;
  walkDirection?: "left" | "right";
}

export function PlayerFighter({ 
  isAttacking, 
  isBlocking, 
  isHit, 
  health, 
  isTransformed,
  isTransforming,
  onTransformComplete,
  isWalking = false,
  walkDirection = "right"
}: PlayerFighterProps) {
  const isDead = health <= 0;
  const transformVideoRef = useRef<HTMLVideoElement>(null);
  const idleVideoRef = useRef<HTMLVideoElement>(null);
  const walkingVideoRef = useRef<HTMLVideoElement>(null);

  // Handle transformation video end
  useEffect(() => {
    const video = transformVideoRef.current;
    if (video && isTransforming) {
      video.currentTime = 0;
      video.play();
      
      const handleEnded = () => {
        onTransformComplete();
      };
      
      video.addEventListener("ended", handleEnded);
      return () => video.removeEventListener("ended", handleEnded);
    }
  }, [isTransforming, onTransformComplete]);

  return (
    <div className={cn(
      "relative flex flex-col items-center transition-all duration-150",
      isHit && "animate-hit-flinch-left",
    )}>
      {/* Fighter Video Container */}
      <div
        className={cn(
          "relative w-40 h-56 md:w-52 md:h-72 transition-all duration-150 overflow-hidden",
          isAttacking && !isTransforming && "animate-attack-lunge-right",
          isBlocking && "scale-95 brightness-75",
          isDead && "opacity-30 grayscale rotate-90 translate-y-10",
          isHit && "brightness-150"
        )}
      >
        {/* Red damage flash on impact */}
        {isHit && (
          <div className="absolute inset-0 z-20 bg-red-600 mix-blend-hard-light animate-damage-flash pointer-events-none" />
        )}
        {/* Transformation Video (shown during transformation) */}
        {isTransforming && (
          <video
            ref={transformVideoRef}
            src={VIDEOS.transformation}
            className="absolute inset-0 w-full h-full object-contain"
            muted
            playsInline
          />
        )}

        {/* Regular State Videos (hidden during transformation) */}
        {!isTransforming && (
          <>
            {/* Idle Video */}
            <video
              ref={idleVideoRef}
              src={isTransformed ? VIDEOS.chainsawManIdle : VIDEOS.denjiIdle}
              className={cn(
                "absolute inset-0 w-full h-full object-contain transition-opacity duration-100",
                (isWalking || isAttacking) ? "opacity-0" : "opacity-100"
              )}
              style={{ transform: walkDirection === "left" ? "scaleX(-1)" : "scaleX(1)" }}
              autoPlay
              loop
              muted
              playsInline
            />

            {/* Walking/Attack Video */}
            <video
              ref={walkingVideoRef}
              src={isTransformed ? VIDEOS.chainsawManWalking : VIDEOS.denjiWalking}
              className={cn(
                "absolute inset-0 w-full h-full object-contain transition-opacity duration-100",
                (isWalking || isAttacking) ? "opacity-100" : "opacity-0"
              )}
              style={{ transform: walkDirection === "left" ? "scaleX(-1)" : "scaleX(1)" }}
              autoPlay
              loop
              muted
              playsInline
            />
          </>
        )}

        {/* Block Shield Effect */}
        {isBlocking && (
          <div className="absolute inset-0 border-4 border-blue-400/50 rounded-lg animate-pulse" />
        )}

        {/* Transformation Glow */}
        {isTransforming && (
          <div className="absolute inset-0 bg-orange-500/30 animate-pulse" />
        )}
      </div>

      {/* Ground shadow */}
      <div className={cn(
        "w-24 h-4 bg-black/50 rounded-full blur-sm mt-2",
        isDead && "opacity-0"
      )} />

      {/* Form indicator */}
      {isTransformed && !isTransforming && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 font-display text-sm text-orange-400 tracking-wider animate-pulse">
          CHAINSAW MAN
        </div>
      )}
    </div>
  );
}
