import { cn } from "@/react-app/lib/utils";

interface FighterProps {
  name: string;
  isPlayer: boolean;
  isAttacking: boolean;
  isBlocking: boolean;
  isHit: boolean;
  health: number;
  isMoving?: boolean;
  moveDirection?: "left" | "right";
}

export function Fighter({ name: _name, isPlayer, isAttacking, isBlocking, isHit, health, isMoving, moveDirection }: FighterProps) {
  const isDead = health <= 0;

  return (
    <div className={cn(
      "relative flex flex-col items-center transition-all duration-150",
      isPlayer ? "scale-x-1" : "-scale-x-1",
      isHit && "animate-shake",
      // Flip based on movement direction for enemy
      !isPlayer && moveDirection === "left" && "-scale-x-1",
      !isPlayer && moveDirection === "right" && "scale-x-1",
    )}>
      {/* Fighter silhouette */}
      <div 
        className={cn(
          "relative w-32 h-48 md:w-40 md:h-56 transition-all duration-150",
          isAttacking && "translate-x-4",
          isBlocking && "scale-95",
          isDead && "opacity-30 grayscale rotate-90 translate-y-10",
          isMoving && "animate-bob"
        )}
      >
        {/* Body */}
        <div className={cn(
          "absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-32 md:w-24 md:h-40",
          "bg-gradient-to-b from-gray-800 to-gray-900",
          "border-2",
          isPlayer ? "border-orange-500/50" : "border-purple-500/50",
          isHit && "brightness-200"
        )} 
        style={{ clipPath: "polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)" }}
        />
        
        {/* Head */}
        <div className={cn(
          "absolute top-4 left-1/2 -translate-x-1/2 w-12 h-14 md:w-14 md:h-16 rounded-t-full",
          "bg-gradient-to-b from-gray-700 to-gray-800",
          "border-2",
          isPlayer ? "border-orange-500/50" : "border-purple-500/50",
          isHit && "brightness-200"
        )} />

        {/* Chainsaw (Player) or Horns (Enemy) */}
        {isPlayer ? (
          <div className={cn(
            "absolute top-6 -right-6 w-20 h-4 bg-gradient-to-r from-gray-600 to-gray-400",
            "border border-orange-500/30",
            isAttacking && "animate-pulse w-28 bg-chainsaw"
          )}
          style={{ clipPath: "polygon(0 30%, 100% 0%, 100% 100%, 0 70%)" }}
          >
            {/* Chainsaw teeth */}
            <div className="absolute top-0 left-0 w-full h-full flex">
              {[...Array(8)].map((_, i) => (
                <div 
                  key={i} 
                  className="w-2 h-full border-r border-gray-500"
                  style={{ 
                    background: isAttacking 
                      ? "linear-gradient(to bottom, hsl(30, 100%, 50%), hsl(30, 80%, 30%))"
                      : "linear-gradient(to bottom, #666, #333)" 
                  }}
                />
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className={cn(
              "absolute top-0 left-4 w-3 h-10 bg-gradient-to-t from-purple-800 to-purple-500",
              "rotate-[-20deg] rounded-t-full"
            )} />
            <div className={cn(
              "absolute top-0 right-4 w-3 h-10 bg-gradient-to-t from-purple-800 to-purple-500",
              "rotate-[20deg] rounded-t-full scale-x-[-1]"
            )} />
          </>
        )}

        {/* Eyes */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 flex gap-3">
          <div className={cn(
            "w-2 h-3 rounded-full",
            isPlayer ? "bg-yellow-400" : "bg-red-500",
            "shadow-lg",
            isPlayer ? "shadow-yellow-400/50" : "shadow-red-500/50"
          )} />
          <div className={cn(
            "w-2 h-3 rounded-full",
            isPlayer ? "bg-yellow-400" : "bg-red-500",
            "shadow-lg",
            isPlayer ? "shadow-yellow-400/50" : "shadow-red-500/50"
          )} />
        </div>

        {/* Block Shield Effect */}
        {isBlocking && (
          <div className="absolute inset-0 border-4 border-white/30 rounded-lg animate-pulse" />
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
