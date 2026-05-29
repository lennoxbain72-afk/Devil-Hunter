import { useState, useEffect, useCallback } from "react";
import { HealthBar } from "./HealthBar";
import { PlayerFighter } from "./PlayerFighter";
import { EnemyFighter } from "./EnemyFighter";
import { getCharacterById } from "@/data/characters";

interface BattleArenaProps {
  playerId?: string;
  enemyId?: string;
  onReturnToMenu?: () => void;
}

// Free-movement sandbox: no attacks, no hitboxes, no walls between fighters.
// The player walks with the keyboard; the enemy drifts around on its own.
export function BattleArena({ playerId = "denji", enemyId = "bat-devil", onReturnToMenu }: BattleArenaProps) {
  const playerChar = getCharacterById(playerId) || getCharacterById("denji")!;
  const enemyChar = getCharacterById(enemyId) || getCharacterById("bat-devil")!;

  // Player movement
  const [playerX, setPlayerX] = useState(0);
  const [backgroundX, setBackgroundX] = useState(0);
  const [isWalking, setIsWalking] = useState(false);
  const [walkDirection, setWalkDirection] = useState<"left" | "right">("right");
  const [isJumping, setIsJumping] = useState(false);
  const [jumpY, setJumpY] = useState(0);
  const [keysPressed, setKeysPressed] = useState<Set<string>>(new Set());

  // Enemy free wander
  const [enemyX, setEnemyX] = useState(300);
  const [enemyWalkDirection, setEnemyWalkDirection] = useState<"left" | "right">("left");
  const [isEnemyMoving, setIsEnemyMoving] = useState(false);

  const PLAYER_SPEED = 10;
  const BG_MAX_OFFSET = 300;
  const JUMP_HEIGHT = 120;
  const JUMP_DURATION = 500; // ms
  // Generous bounds just so nobody walks completely off-screen — no walls between fighters.
  const PLAYER_MIN_X = -450;
  const PLAYER_MAX_X = 650;

  // Player movement loop (free — no collision with the enemy)
  useEffect(() => {
    const moveInterval = setInterval(() => {
      const movingLeft = keysPressed.has("a") || keysPressed.has("arrowleft");
      const movingRight = keysPressed.has("d") || keysPressed.has("arrowright");

      if (movingLeft && !movingRight) {
        setIsWalking(true);
        setWalkDirection("left");
        setBackgroundX(prev => Math.min(BG_MAX_OFFSET, prev + PLAYER_SPEED));
        setPlayerX(prev => Math.max(PLAYER_MIN_X, prev - PLAYER_SPEED * 0.5));
      } else if (movingRight && !movingLeft) {
        setIsWalking(true);
        setWalkDirection("right");
        setBackgroundX(prev => Math.max(-BG_MAX_OFFSET, prev - PLAYER_SPEED));
        setPlayerX(prev => Math.min(PLAYER_MAX_X, prev + PLAYER_SPEED * 0.5));
      } else {
        setIsWalking(false);
      }
    }, 16);

    return () => clearInterval(moveInterval);
  }, [keysPressed]);

  // Enemy auto-wander — drifts back and forth, pausing now and then. No attacks.
  useEffect(() => {
    let dir = -1;
    let movingFrames = 0;
    let pauseFrames = 30;

    const wander = setInterval(() => {
      if (movingFrames > 0) {
        movingFrames--;
        setEnemyX(prev => {
          let nx = prev + dir * 2.2;
          if (nx < 60) { nx = 60; dir = 1; setEnemyWalkDirection("right"); }
          else if (nx > 540) { nx = 540; dir = -1; setEnemyWalkDirection("left"); }
          return nx;
        });
        if (movingFrames === 0) {
          setIsEnemyMoving(false);
          pauseFrames = 20 + Math.floor(Math.random() * 50);
        }
      } else if (pauseFrames > 0) {
        pauseFrames--;
        if (pauseFrames === 0) {
          dir = Math.random() > 0.5 ? 1 : -1;
          setEnemyWalkDirection(dir < 0 ? "left" : "right");
          movingFrames = 30 + Math.floor(Math.random() * 70);
          setIsEnemyMoving(true);
        }
      }
    }, 50);

    return () => clearInterval(wander);
  }, []);

  // Player jump
  const handleJump = useCallback(() => {
    if (isJumping) return;
    setIsJumping(true);
    const startTime = Date.now();
    const animate = () => {
      const progress = (Date.now() - startTime) / JUMP_DURATION;
      if (progress >= 1) {
        setJumpY(0);
        setIsJumping(false);
        return;
      }
      setJumpY(Math.sin(progress * Math.PI) * JUMP_HEIGHT);
      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [isJumping]);

  // Keyboard controls — movement + jump only
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      setKeysPressed(prev => new Set(prev).add(key));
      if (e.key === "w" || e.key === "ArrowUp" || e.key === " ") {
        e.preventDefault();
        handleJump();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      setKeysPressed(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleJump]);

  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-gradient-to-b from-gray-950 via-red-950/20 to-black">
      {/* Background with parallax */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0 transition-transform duration-200 ease-out"
          style={{ transform: `translateX(${backgroundX}px)`, width: "150%", left: "-25%" }}
        >
          <img
            src="https://019e6ae0-fa01-710e-a8de-1015605547ea.mochausercontent.com/city-battle-background.png"
            alt="City background"
            className="w-full h-full object-cover object-bottom"
          />
        </div>

        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute top-0 left-0 w-64 h-64 bg-red-900/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-red-900/10 rounded-full blur-3xl" />

        {/* Ambient floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={`ambient-${i}`}
              className="absolute rounded-full opacity-60"
              style={{
                left: `${(i * 17) % 100}%`,
                top: `${(i * 23) % 80}%`,
                width: `${3 + (i % 4)}px`,
                height: `${3 + (i % 4)}px`,
                background: i % 3 === 0 ? '#ff6b35' : i % 3 === 1 ? '#ff4444' : '#ffaa00',
                boxShadow: `0 0 ${6 + (i % 4) * 2}px ${i % 3 === 0 ? '#ff6b35' : i % 3 === 1 ? '#ff4444' : '#ffaa00'}`,
                animation: `ambient-float-${i % 4} ${3 + (i % 3)}s ease-in-out infinite`,
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Top HUD (decorative — no combat) */}
      <div className="relative z-10 flex justify-between items-start p-4 md:p-6">
        <HealthBar
          current={playerChar.health}
          max={playerChar.health}
          name={playerChar.name}
          isPlayer={true}
          devilPower={0}
        />

        <div className="flex flex-col items-center gap-1">
          <div className="font-display text-lg text-white/70 tracking-wider">ROUND 1</div>
          <div className="flex gap-4 mb-2">
            <div className="flex gap-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={`p-${i}`} className="w-3 h-3 rounded-full border-2 bg-transparent border-white/30" />
              ))}
            </div>
            <div className="font-display text-3xl md:text-5xl text-red-500 manga-shadow">VS</div>
            <div className="flex gap-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={`e-${i}`} className="w-3 h-3 rounded-full border-2 bg-transparent border-white/30" />
              ))}
            </div>
          </div>
        </div>

        <HealthBar
          current={enemyChar.health}
          max={enemyChar.health}
          name={enemyChar.name}
          isPlayer={false}
          devilPower={50}
        />
      </div>

      {/* Arena — movable images */}
      <div className="absolute bottom-8 left-0 right-0 z-10 flex justify-between items-end px-8 md:px-16">
        {/* Player dust trail when walking */}
        {isWalking && (
          <div className="absolute bottom-0 pointer-events-none" style={{ transform: `translateX(${playerX + 50}px)` }}>
            {[...Array(6)].map((_, i) => (
              <div
                key={`dust-${i}`}
                className="absolute rounded-full"
                style={{
                  width: `${4 + Math.random() * 6}px`,
                  height: `${4 + Math.random() * 6}px`,
                  background: `rgba(180, 150, 120, ${0.4 + Math.random() * 0.3})`,
                  left: `${-20 + (walkDirection === 'right' ? -i * 12 : i * 12)}px`,
                  bottom: `${Math.random() * 15}px`,
                  animation: `dust-puff 0.5s ease-out forwards`,
                  animationDelay: `${i * 0.05}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* Player (key-controlled) */}
        <div
          className="transition-transform duration-150 ease-out"
          style={{ transform: `translateX(${playerX}px) translateY(${-jumpY}px)` }}
        >
          <PlayerFighter
            isAttacking={false}
            isBlocking={false}
            isHit={false}
            health={playerChar.health}
            isTransformed={false}
            isTransforming={false}
            onTransformComplete={() => {}}
            isWalking={isWalking}
            walkDirection={walkDirection}
          />
        </div>

        {/* Enemy (auto-wander) */}
        <div
          className="transition-transform duration-150 ease-out"
          style={{ transform: `translateX(${enemyX - 300}px)` }}
        >
          <EnemyFighter
            isAttacking={false}
            isBlocking={false}
            isHit={false}
            health={enemyChar.health}
            isMoving={isEnemyMoving}
            moveDirection={enemyWalkDirection}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-4 left-0 right-0 flex flex-col items-center gap-3">
        <div className="text-xs text-muted-foreground tracking-wider">
          MOVE: A / D or ← / →  •  JUMP: W / SPACE
        </div>
        {onReturnToMenu && (
          <button
            onClick={onReturnToMenu}
            className="px-6 py-2 bg-gradient-to-b from-gray-700 to-gray-900 text-white font-display text-lg uppercase tracking-wider border-2 border-gray-500 hover:from-gray-600 hover:to-gray-800 transition-all"
            style={{ clipPath: "polygon(5% 0%, 100% 0%, 95% 100%, 0% 100%)" }}
          >
            Menu
          </button>
        )}
      </div>
    </div>
  );
}
