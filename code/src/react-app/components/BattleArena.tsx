import { useState, useEffect, useCallback } from "react";
import { HealthBar } from "./HealthBar";
import { PlayerFighter } from "./PlayerFighter";
import { EnemyFighter } from "./EnemyFighter";
import { HitEffect } from "./HitEffect";
import { AttackParticles, ChargeUpEffect } from "./AttackParticles";
import DeathExplosion from "./DeathExplosion";
import { cn } from "@/react-app/lib/utils";
import { getCharacterById, Character } from "@/data/characters";
import { useSoundEffects } from "@/react-app/hooks/useSoundEffects";

interface FighterState {
  name: string;
  health: number;
  maxHealth: number;
  devilPower: number;
  isAttacking: boolean;
  isBlocking: boolean;
  isHit: boolean;
}

const HITS_FOR_TRANSFORM = 7;

// === HITBOX / ATTACK RANGES ===
// Fighter collision width is 80 — any melee range below ~90 is unreachable.
// Ranges are tuned so each move's hitbox matches its visual reach.
const MELEE_RANGE = 110;          // Basic punch & Close Slash (J) — short jab range
const MELEE_FORGIVE = 30;         // Extra leniency before a move counts as a whiff
const ENEMY_BASIC_RANGE = 120;    // Enemy normal attacks
const ENEMY_SPECIAL_RANGE = 170;  // Enemy charged "Special Move" — longer reach
const DASH_IMPACT_RANGE = 90;     // Boost Dash (F) — hit when you slam into the enemy
const BLOOD_SWORD_RANGE = 500;    // Blood Sword Combo (L) — full-screen slash
const DODGE_THREAT_RANGE = 160;   // Enemy decides to dodge when player attacks within this

const TRANSFORM_DURATION = 60; // seconds
const CHAINSAW_SPEED_MULTIPLIER = 1.8;
const CHAINSAW_DAMAGE_MULTIPLIER = 2.5;

interface BattleArenaProps {
  playerId?: string;
  enemyId?: string;
  onReturnToMenu?: () => void;
}

const getInitialFighterState = (char: Character): FighterState => ({
  name: char.name,
  health: char.health,
  maxHealth: char.health,
  devilPower: char.isPlayable ? 0 : 50,
  isAttacking: false,
  isBlocking: false,
  isHit: false,
});

export function BattleArena({ playerId = "denji", enemyId = "bat-devil", onReturnToMenu }: BattleArenaProps) {
  const playerChar = getCharacterById(playerId) || getCharacterById("denji")!;
  const enemyChar = getCharacterById(enemyId) || getCharacterById("bat-devil")!;
  
  // Sound effects
  const { playSound, startChainsawLoop, stopChainsawLoop } = useSoundEffects();
  
  const [player, setPlayer] = useState<FighterState>(() => getInitialFighterState(playerChar));
  const [enemy, setEnemy] = useState<FighterState>(() => getInitialFighterState(enemyChar));

  const [combo, setCombo] = useState(0);
  const [battleLog, setBattleLog] = useState<string[]>([]);
  const [gameState, setGameState] = useState<"fighting" | "victory" | "defeat" | "roundEnd">("fighting");
  
  // Round tracking (best of 7 - first to 4 wins)
  const [currentRound, setCurrentRound] = useState(1);
  const [playerWins, setPlayerWins] = useState(0);
  const [enemyWins, setEnemyWins] = useState(0);
  const [roundWinner, setRoundWinner] = useState<"player" | "enemy" | null>(null);
  const ROUNDS_TO_WIN = 4;
  const [screenShake, setScreenShake] = useState(false);
  const [hitCount, setHitCount] = useState(0);
  const [isTransformed, setIsTransformed] = useState(false);
  const [isTransforming, setIsTransforming] = useState(false);
  const [screenFlash, setScreenFlash] = useState<"none" | "hit" | "special">("none");
  const [playerHitEffect, setPlayerHitEffect] = useState(false);
  const [enemyHitEffect, setEnemyHitEffect] = useState(false);
  const [specialHitEffect, setSpecialHitEffect] = useState(false);
  const [transformTimeRemaining, setTransformTimeRemaining] = useState(0);
  const [_lastEnemyAttack, setLastEnemyAttack] = useState<string>("");
  
  // Chainsaw Man moveset state
  const [isBoostDashing, setIsBoostDashing] = useState(false);
  const [isBloodSword, setIsBloodSword] = useState(false);
  const [, setSlashCount] = useState(0);
  const [bloodSlashVisible, setBloodSlashVisible] = useState(false);
  
  // Movement and parallax state
  const [playerX, setPlayerX] = useState(0);
  const [enemyX, setEnemyX] = useState(300); // Enemy position (right side of arena)
  const [backgroundX, setBackgroundX] = useState(0);
  const [isWalking, setIsWalking] = useState(false);
  const [walkDirection, setWalkDirection] = useState<"left" | "right">("right");
  const [isJumping, setIsJumping] = useState(false);
  const [jumpY, setJumpY] = useState(0);
  const [keysPressed, setKeysPressed] = useState<Set<string>>(new Set());
  
  // Enemy AI state
  const [enemyWalkDirection, setEnemyWalkDirection] = useState<"left" | "right">("left");
  const [isEnemyMoving, setIsEnemyMoving] = useState(false);
  const [enemyDodging, setEnemyDodging] = useState(false);
  const [enemyCharging, setEnemyCharging] = useState(false);
  const [isEnemyJumping, setIsEnemyJumping] = useState(false);
  const [enemyJumpY, setEnemyJumpY] = useState(0);
  
  // Street Fighter-style physics state
  const [playerHitStun, setPlayerHitStun] = useState(0); // frames of stun remaining
  const [enemyHitStun, setEnemyHitStun] = useState(0);
  const [playerBlockStun, setPlayerBlockStun] = useState(0);
  const [enemyBlockStun, setEnemyBlockStun] = useState(0);
  const [playerKnockback, setPlayerKnockback] = useState(0); // knockback velocity
  const [enemyKnockback, setEnemyKnockback] = useState(0);
  
  // Fighter collision - minimum distance between fighters
  const FIGHTER_WIDTH = 80;
  
  // Attack particle state
  const [playerAttackParticles, setPlayerAttackParticles] = useState(false);
  const [enemyAttackParticles, setEnemyAttackParticles] = useState(false);
  
  // Death explosion state
  const [playerExploding, setPlayerExploding] = useState(false);
  
  // Background limits (how far it can scroll)
  const BG_MAX_OFFSET = 300; // pixels the background can scroll
  const BASE_PLAYER_SPEED = 10;
  const PLAYER_SPEED = isTransformed ? BASE_PLAYER_SPEED * CHAINSAW_SPEED_MULTIPLIER : BASE_PLAYER_SPEED;
  const ENEMY_SPEED = 3;
  const JUMP_HEIGHT = 120;
  const JUMP_DURATION = 500; // ms
  
  // Calculate distance between player and enemy
  const distanceToEnemy = Math.abs(enemyX - playerX);

  const addLog = useCallback((message: string) => {
    setBattleLog(prev => [message, ...prev.slice(0, 4)]);
  }, []);

  // Transformation timer countdown
  useEffect(() => {
    if (!isTransformed || gameState !== "fighting") return;
    
    if (transformTimeRemaining <= 0) {
      // Revert transformation
      setIsTransformed(false);
      setHitCount(0);
      stopChainsawLoop();
      addLog("Transformation ended!");
      return;
    }
    
    const timer = setTimeout(() => {
      setTransformTimeRemaining(prev => prev - 1);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [isTransformed, transformTimeRemaining, gameState, addLog]);

  // Physics tick - knockback and stun countdown
  useEffect(() => {
    if (gameState !== "fighting") return;
    
    const physicsInterval = setInterval(() => {
      // Apply knockback with friction
      if (playerKnockback !== 0) {
        setPlayerX(prev => {
          const newX = prev + playerKnockback;
          return Math.max(-200, Math.min(500, newX));
        });
        setPlayerKnockback(prev => {
          const friction = 0.85;
          const newKnockback = prev * friction;
          return Math.abs(newKnockback) < 0.5 ? 0 : newKnockback;
        });
      }
      
      if (enemyKnockback !== 0) {
        setEnemyX(prev => {
          const newX = prev + enemyKnockback;
          return Math.max(100, Math.min(500, newX));
        });
        setEnemyKnockback(prev => {
          const friction = 0.85;
          const newKnockback = prev * friction;
          return Math.abs(newKnockback) < 0.5 ? 0 : newKnockback;
        });
      }
      
      // Decrement stun frames
      if (playerHitStun > 0) setPlayerHitStun(prev => prev - 1);
      if (enemyHitStun > 0) setEnemyHitStun(prev => prev - 1);
      if (playerBlockStun > 0) setPlayerBlockStun(prev => prev - 1);
      if (enemyBlockStun > 0) setEnemyBlockStun(prev => prev - 1);
    }, 16);
    
    return () => clearInterval(physicsInterval);
  }, [gameState, playerKnockback, enemyKnockback, playerHitStun, enemyHitStun, playerBlockStun, enemyBlockStun]);

  // Movement loop with collision
  useEffect(() => {
    if (gameState !== "fighting") return;
    
    const moveInterval = setInterval(() => {
      // Can't move during hit stun
      if (playerHitStun > 0) {
        setIsWalking(false);
        return;
      }
      
      const movingLeft = keysPressed.has("a") || keysPressed.has("arrowleft");
      const movingRight = keysPressed.has("d") || keysPressed.has("arrowright");
      
      if (movingLeft && !movingRight) {
        setIsWalking(true);
        setWalkDirection("left");
        setBackgroundX(prev => Math.min(BG_MAX_OFFSET, prev + PLAYER_SPEED));
        setPlayerX(prev => {
          const newX = prev - PLAYER_SPEED * 0.3;
          // Collision check - can't walk through enemy
          if (newX < enemyX && newX > enemyX - FIGHTER_WIDTH) {
            return enemyX - FIGHTER_WIDTH; // Stop at enemy
          }
          return Math.max(-200, newX);
        });
      } else if (movingRight && !movingLeft) {
        setIsWalking(true);
        setWalkDirection("right");
        setBackgroundX(prev => Math.max(-BG_MAX_OFFSET, prev - PLAYER_SPEED));
        setPlayerX(prev => {
          const newX = prev + PLAYER_SPEED * 0.3;
          // Collision check - can't walk through enemy
          if (newX > enemyX - FIGHTER_WIDTH && newX < enemyX) {
            return enemyX - FIGHTER_WIDTH;
          }
          return Math.min(500, newX);
        });
      } else {
        setIsWalking(false);
      }
    }, 16);
    
    return () => clearInterval(moveInterval);
  }, [keysPressed, gameState, playerHitStun, enemyX]);

  // Enemy AI movement
  // Street Fighter-style AI with reactions and spacing
  const [_aiState, setAiState] = useState<"idle" | "approaching" | "retreating" | "circling" | "feinting" | "waiting" | "punishing">("idle");
  
  useEffect(() => {
    if (gameState !== "fighting") return;
    
    let moveAccumulator = 0;
    let nextDecisionTime = 300 + Math.random() * 400;
    let burstMovesRemaining = 0;
    let burstDirection = 0;
    
    const aiInterval = setInterval(() => {
      // Can't move during hit stun
      if (enemyHitStun > 0) {
        setIsEnemyMoving(false);
        return;
      }
      
      // Don't move while attacking or dodging
      if (enemy.isAttacking || enemyDodging) {
        setIsEnemyMoving(false);
        return;
      }
      
      const distance = Math.abs(enemyX - playerX);
      moveAccumulator += 50;
      
      // STREET FIGHTER AI BEHAVIORS
      
      // Anti-air: Jump back and prepare to punish if player is jumping
      if (isJumping && distance < 200 && !isEnemyJumping) {
        if (Math.random() > 0.6) {
          // Dash back to anti-air position
          burstMovesRemaining = 3;
          burstDirection = 1;
          setAiState("retreating");
        }
      }
      
      // Punish whiffed attacks: Rush in when player attacks but misses
      // REACTIVE AI: Respond to player attacks with dodge/counter
      if (player.isAttacking) {
        const dodgeChance = isTransformed ? 0.25 : 0.55; // Harder to dodge Chainsaw Man
        if (distance <= DODGE_THREAT_RANGE && Math.random() < dodgeChance) {
          // In danger zone - emergency dodge!
          if (Math.random() > 0.4) {
            // Jump to evade
            handleEnemyJump();
            setAiState("retreating");
          } else {
            // Quick backstep
            burstMovesRemaining = 6;
            burstDirection = 1;
            setAiState("retreating");
          }
          return;
        } else if (distance > MELEE_RANGE + MELEE_FORGIVE && Math.random() > 0.5) {
          // Player whiffed - punish!
          burstMovesRemaining = 5;
          burstDirection = -1;
          setAiState("punishing");
        }
      }
      
      // React to player approaching aggressively
      if (isWalking && walkDirection === "right" && distance < 150) {
        if (Math.random() > 0.6) {
          // Counter-approach or prepare defense
          if (Math.random() > 0.5) {
            burstMovesRemaining = 3;
            burstDirection = -1; // Meet them
            setAiState("approaching");
          } else {
            setAiState("waiting"); // Bait an attack
          }
        }
      }
      
      // Variable speed based on situation
      const speedMultiplier = distance > 300 ? 1.5 : distance < 100 ? 0.7 : 1;
      const effectiveSpeed = ENEMY_SPEED * speedMultiplier * (0.8 + Math.random() * 0.4);
      
      // Handle burst movement (quick steps like a human)
      if (burstMovesRemaining > 0) {
        setIsEnemyMoving(true);
        setEnemyWalkDirection(burstDirection < 0 ? "left" : "right");
        setEnemyX(prev => {
          let newX = prev + burstDirection * effectiveSpeed;
          // Collision with player - can't walk through
          if (burstDirection < 0 && newX < playerX + FIGHTER_WIDTH && newX > playerX) {
            newX = playerX + FIGHTER_WIDTH;
          }
          return Math.max(100, Math.min(500, newX));
        });
        burstMovesRemaining--;
        if (burstMovesRemaining === 0) {
          nextDecisionTime = moveAccumulator + 200 + Math.random() * 300;
          setIsEnemyMoving(false);
        }
        return;
      }
      
      // Only make decisions at variable intervals (like human reaction time)
      if (moveAccumulator < nextDecisionTime) {
        // Occasionally fidget/micro-adjust while waiting (humans don't stand perfectly still)
        if (Math.random() > 0.92 && distance > 80 && distance < 400) {
          const fidgetDir = Math.random() > 0.5 ? 1 : -1;
          setEnemyX(prev => Math.max(100, Math.min(500, prev + fidgetDir * 1)));
        }
        return;
      }
      
      // Make a decision
      nextDecisionTime = moveAccumulator + 150 + Math.random() * 350;
      
      // AI behavior based on distance with more human-like patterns
      if (distance > 400) {
        // Far away - walk toward player with purpose
        burstMovesRemaining = 8 + Math.floor(Math.random() * 6);
        burstDirection = -1;
        setAiState("approaching");
      } else if (distance > 250) {
        // Mid-range - mix of approaching and hesitating
        if (Math.random() > 0.35) {
          burstMovesRemaining = 4 + Math.floor(Math.random() * 5);
          burstDirection = -1;
          setAiState("approaching");
        } else {
          // Pause and "assess" - humans do this
          setIsEnemyMoving(false);
          setAiState("waiting");
          nextDecisionTime = moveAccumulator + 400 + Math.random() * 500;
        }
      } else if (distance > 120) {
        // Close-ish - more tactical movement
        const roll = Math.random();
        if (roll > 0.6) {
          // Quick approach
          burstMovesRemaining = 2 + Math.floor(Math.random() * 3);
          burstDirection = -1;
          setAiState("approaching");
        } else if (roll > 0.3) {
          // Feint - step forward then back
          burstMovesRemaining = 2;
          burstDirection = -1;
          setAiState("feinting");
          setTimeout(() => {
            if (gameState === "fighting") {
              burstMovesRemaining = 3;
              burstDirection = 1;
            }
          }, 200);
        } else {
          // Hold position, slight movement
          setIsEnemyMoving(false);
          setAiState("waiting");
        }
      } else if (distance > 60) {
        // In striking range - stay aggressive or back off
        const roll = Math.random();
        if (roll > 0.6) {
          // Jump attack or dodge
          if (Math.random() > 0.5) {
            handleEnemyJump();
          }
          setIsEnemyMoving(false);
          setAiState("waiting");
        } else if (roll > 0.5) {
          // Hold ground
          setIsEnemyMoving(false);
          setAiState("waiting");
        } else if (roll > 0.2) {
          // Small adjustment
          burstMovesRemaining = 1 + Math.floor(Math.random() * 2);
          burstDirection = Math.random() > 0.6 ? -1 : 1;
          setAiState("circling");
        } else {
          // Quick retreat
          burstMovesRemaining = 3 + Math.floor(Math.random() * 3);
          burstDirection = 1;
          setAiState("retreating");
        }
      } else {
        // Very close - retreat or hold
        if (Math.random() > 0.4) {
          burstMovesRemaining = 2 + Math.floor(Math.random() * 4);
          burstDirection = 1;
          setAiState("retreating");
        } else {
          setIsEnemyMoving(false);
          setAiState("waiting");
        }
      }
    }, 50); // Faster tick for smoother movement
    
    return () => clearInterval(aiInterval);
  }, [gameState, enemy.isAttacking, enemyDodging, playerX, enemyX]);

  // Jump animation
  const handleJump = useCallback(() => {
    if (isJumping || gameState !== "fighting") return;
    
    setIsJumping(true);
    const startTime = Date.now();
    
    const jumpAnimation = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / JUMP_DURATION;
      
      if (progress >= 1) {
        setJumpY(0);
        setIsJumping(false);
        return;
      }
      
      // Parabolic jump curve
      const jumpProgress = Math.sin(progress * Math.PI);
      setJumpY(jumpProgress * JUMP_HEIGHT);
      requestAnimationFrame(jumpAnimation);
    };
    
    requestAnimationFrame(jumpAnimation);
  }, [isJumping, gameState]);

  // Enemy jump animation
  const handleEnemyJump = useCallback(() => {
    if (isEnemyJumping || gameState !== "fighting") return;
    
    setIsEnemyJumping(true);
    const startTime = Date.now();
    const enemyJumpDuration = 450; // Slightly faster than player
    const enemyJumpHeight = 100;
    
    const jumpAnimation = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / enemyJumpDuration;
      
      if (progress >= 1) {
        setEnemyJumpY(0);
        setIsEnemyJumping(false);
        return;
      }
      
      const jumpProgress = Math.sin(progress * Math.PI);
      setEnemyJumpY(jumpProgress * enemyJumpHeight);
      requestAnimationFrame(jumpAnimation);
    };
    
    requestAnimationFrame(jumpAnimation);
  }, [isEnemyJumping, gameState]);

  const playerAttack = useCallback(() => {
    if (gameState !== "fighting" || player.isAttacking || player.isBlocking) return;

    setPlayer(p => ({ ...p, isAttacking: true }));
    setPlayerAttackParticles(true);
    setTimeout(() => setPlayerAttackParticles(false), 400);
    
    // Enemy dodge/jump chance (40% normally, 20% when transformed)
    const dodgeChance = isTransformed ? 0.20 : 0.40;
    const willDodge = Math.random() < dodgeChance && !enemy.isAttacking && !isEnemyJumping && distanceToEnemy <= DODGE_THREAT_RANGE;
    
    if (willDodge) {
      // 50% chance to jump dodge, 50% to backstep
      if (Math.random() > 0.5 && !isEnemyJumping) {
        // Jump dodge
        handleEnemyJump();
        addLog("Bat Devil JUMPS!");
        setPlayer(p => ({ ...p, isAttacking: false }));
        return;
      } else {
        setEnemyDodging(true);
        setIsEnemyMoving(true);
        setEnemyWalkDirection("right");
        // Quick dodge backward
        setEnemyX(prev => Math.min(500, prev + 80));
        addLog("Bat Devil DODGES!");
        
        setTimeout(() => {
          setEnemyDodging(false);
        }, 400);
        
        setPlayer(p => ({ ...p, isAttacking: false }));
        return;
      }
    }
    
    setTimeout(() => {
      // Check if in range
      if (distanceToEnemy > MELEE_RANGE) {
        addLog("TOO FAR! Get closer!");
        setCombo(0);
        setPlayer(p => ({ ...p, isAttacking: false }));
        return;
      }
      
      if (enemy.isBlocking) {
        addLog("BLOCKED!");
        playSound('block', 0.4);
        setCombo(0);
      } else {
        const baseDamage = playerChar.damage + Math.floor(Math.random() * 8);
        const damage = isTransformed 
          ? Math.floor(baseDamage * CHAINSAW_DAMAGE_MULTIPLIER) 
          : baseDamage;
        const newCombo = combo + 1;
        setCombo(newCombo);
        setHitCount(h => h + 1);
        
        // Play attack sound
        if (isTransformed) {
          playSound('slash', 0.5);
        } else {
          playSound('hit', 0.4);
        }
        
        // Track close slash combo when transformed
        if (isTransformed) {
          setSlashCount(s => s + 1);
        }
        
        setEnemy(e => ({ 
          ...e, 
          health: Math.max(0, e.health - damage),
          isHit: true 
        }));
        setScreenShake(true);
        setScreenFlash("hit");
        setEnemyHitEffect(true);
        setPlayer(p => ({ ...p, devilPower: Math.min(100, p.devilPower + 8) }));
        
        // Street Fighter physics - knockback and hitstun
        const knockbackForce = isTransformed ? 15 : 8;
        setEnemyKnockback(knockbackForce); // Push enemy back
        setEnemyHitStun(isTransformed ? 18 : 12); // Stun frames
        
        const moveType = isTransformed ? "CLOSE SLASH" : "HIT";
        addLog(`${moveType}! ${damage} damage${newCombo > 1 ? ` (${newCombo}x COMBO)` : ""}${isTransformed ? " 🔥" : ""}`);
        
        setTimeout(() => {
          setEnemy(e => ({ ...e, isHit: false }));
          setScreenShake(false);
          setScreenFlash("none");
          setEnemyHitEffect(false);
        }, 200);
      }
      
      setPlayer(p => ({ ...p, isAttacking: false }));
    }, 150);
  }, [gameState, player.isAttacking, player.isBlocking, enemy.isBlocking, combo, addLog, distanceToEnemy, isTransformed]);

  const playerSpecial = useCallback(() => {
    if (gameState !== "fighting" || hitCount < HITS_FOR_TRANSFORM || player.isAttacking || isTransforming || isTransformed) return;

    setIsTransforming(true);
    playSound('transform', 0.6);
    addLog("TRANSFORMATION!!!");
  }, [gameState, hitCount, player.isAttacking, isTransforming, isTransformed, addLog]);

  const handleTransformComplete = useCallback(() => {
    setIsTransforming(false);
    setIsTransformed(true);
    setTransformTimeRemaining(TRANSFORM_DURATION);
    setPlayer(p => ({ ...p, devilPower: 100 }));
    playSound('chainsawStart', 0.5);
    startChainsawLoop();
    addLog("CHAINSAW MAN AWAKENED!");
    
    // Do massive damage after transformation
    const damage = playerChar.specialDamage + Math.floor(Math.random() * 20);
    setEnemy(e => ({ 
      ...e, 
      health: Math.max(0, e.health - damage),
      isHit: true 
    }));
    setScreenShake(true);
    setScreenFlash("special");
    setSpecialHitEffect(true);
    addLog(`DEVASTATING! ${damage} damage!`);
    
    setTimeout(() => {
      setEnemy(e => ({ ...e, isHit: false }));
      setScreenShake(false);
      setScreenFlash("none");
      setSpecialHitEffect(false);
    }, 400);
  }, [addLog]);

  const playerBlock = useCallback((blocking: boolean) => {
    if (gameState !== "fighting") return;
    setPlayer(p => ({ ...p, isBlocking: blocking }));
    if (blocking) setCombo(0);
  }, [gameState]);

  // CHAINSAW MAN MOVESET - Boost Dash
  const boostDash = useCallback(() => {
    if (gameState !== "fighting" || !isTransformed || isBoostDashing || player.isAttacking || isBloodSword) return;
    
    setIsBoostDashing(true);
    setPlayer(p => ({ ...p, isAttacking: true }));
    playSound('chainsawAttack', 0.5);
    addLog("BOOST DASH!");
    
    // Dash forward rapidly
    const dashDistance = 200;
    const dashSteps = 10;
    const stepDistance = dashDistance / dashSteps;
    let step = 0;
    let hasHit = false;
    
    const dashInterval = setInterval(() => {
      step++;
      setPlayerX(prev => {
        const newX = Math.min(500, prev + stepDistance);
        // Hit when dash reaches enemy (must be >= fighter collision width of 80)
        const distToEnemy = Math.abs(enemyX - newX);
        if (distToEnemy < DASH_IMPACT_RANGE && !hasHit) {
          hasHit = true;
          // Impact damage
          const damage = Math.floor(playerChar.damage * 1.5 + Math.random() * 10);
          setEnemy(e => ({ 
            ...e, 
            health: Math.max(0, e.health - damage),
            isHit: true 
          }));
          setScreenShake(true);
          setScreenFlash("hit");
          setEnemyHitEffect(true);
          addLog(`DASH IMPACT! ${damage} damage!`);
          
          setTimeout(() => {
            setEnemy(e => ({ ...e, isHit: false }));
            setScreenShake(false);
            setScreenFlash("none");
            setEnemyHitEffect(false);
          }, 200);
        }
        return newX;
      });
      
      if (step >= dashSteps) {
        clearInterval(dashInterval);
        setIsBoostDashing(false);
        setPlayer(p => ({ ...p, isAttacking: false }));
        if (!hasHit) {
          addLog("MISSED! Too far from enemy!");
        }
      }
    }, 20);
  }, [gameState, isTransformed, isBoostDashing, player.isAttacking, isBloodSword, enemyX, addLog]);

  // CHAINSAW MAN MOVESET - Blood Sword Combo (LONG RANGE attack)
  const bloodSwordCombo = useCallback(() => {
    if (gameState !== "fighting" || !isTransformed || isBloodSword || player.isAttacking || isBoostDashing) return;
    if (player.devilPower < 50) {
      addLog("NOT ENOUGH DEVIL POWER! (Need 50)");
      return;
    }
    
    setIsBloodSword(true);
    setBloodSlashVisible(true);
    setPlayer(p => ({ ...p, isAttacking: true, devilPower: p.devilPower - 50 }));
    playSound('chainsawAttack', 0.6);
    setSlashCount(0);
    addLog("BLOOD SWORD!");
    setScreenFlash("special");
    
    // Multi-hit combo - 5 rapid slashes with LONG RANGE
    const totalSlashes = 5;
    let currentSlash = 0;
    
    const slashInterval = setInterval(() => {
      currentSlash++;
      setSlashCount(currentSlash);
      
      const currentDistance = Math.abs(enemyX - playerX);
      // Blood Sword has LONG RANGE
      if (currentDistance <= BLOOD_SWORD_RANGE) {
        const baseDamage = playerChar.damage * CHAINSAW_DAMAGE_MULTIPLIER;
        const damage = Math.floor(baseDamage * 0.6 + Math.random() * 8);
        
        setEnemy(e => ({ 
          ...e, 
          health: Math.max(0, e.health - damage),
          isHit: true 
        }));
        setScreenShake(true);
        setEnemyHitEffect(true);
        setHitCount(h => h + 1);
        
        const slashNames = ["FIRST BLOOD!", "DEEP CUT!", "REND!", "CARVE!", "FINAL SLASH!"];
        addLog(`${slashNames[currentSlash - 1]} ${damage} damage!`);
        
        setTimeout(() => {
          setEnemy(e => ({ ...e, isHit: false }));
          setScreenShake(false);
          setEnemyHitEffect(false);
        }, 80);
      } else {
        addLog("TOO FAR!");
      }
      
      if (currentSlash >= totalSlashes) {
        clearInterval(slashInterval);
        setScreenFlash("none");
        setIsBloodSword(false);
        setBloodSlashVisible(false);
        setSlashCount(0);
        setPlayer(p => ({ ...p, isAttacking: false }));
        addLog("COMBO COMPLETE!");
      }
    }, 150);
  }, [gameState, isTransformed, isBloodSword, player.isAttacking, player.devilPower, isBoostDashing, enemyX, playerX, addLog]);

  // Enemy AI with custom moves
  useEffect(() => {
    if (gameState !== "fighting") return;

    // Generate moves based on enemy character
    const baseDmg = enemyChar.damage;
    const enemyMoves = [
      { name: "Quick Strike", damage: [baseDmg, baseDmg + 5], message: `${enemyChar.name} uses QUICK STRIKE!` },
      { name: "Heavy Attack", damage: [baseDmg + 5, baseDmg + 10], message: `${enemyChar.name} uses HEAVY ATTACK!` },
      { name: "Special Move", damage: [baseDmg + 10, baseDmg + 20], message: `${enemyChar.name} uses SPECIAL MOVE!` },
      { name: "Drain Life", damage: [baseDmg - 2, baseDmg + 2], message: `${enemyChar.name} uses DRAIN LIFE!`, heal: true },
    ];

    const interval = setInterval(() => {
      // Only attack when in range (use the longest possible reach so charged specials can fire)
      const currentDistance = Math.abs(enemyX - playerX);
      if (currentDistance > ENEMY_SPECIAL_RANGE) return; // Outside even the longest attack
      
      if (Math.random() > 0.65 && !enemy.isAttacking && !enemyCharging) {
        // Pick a random move
        const move = enemyMoves[Math.floor(Math.random() * enemyMoves.length)];
        const isSpecialMove = move.name === "Special Move";
        
        setLastEnemyAttack(move.name);
        
        // Special moves have a charge-up phase
        if (isSpecialMove) {
          setEnemyCharging(true);
          addLog(`${enemyChar.name} is CHARGING...`);
          
          setTimeout(() => {
            setEnemyCharging(false);
            setEnemy(e => ({ ...e, isAttacking: true }));
            setEnemyAttackParticles(true);
            setTimeout(() => setEnemyAttackParticles(false), 500);
            
            // Execute special attack
            setTimeout(() => {
              // Check distance at moment of impact - special has the longest reach
              const impactDistance = Math.abs(enemyX - playerX);
              if (impactDistance > ENEMY_SPECIAL_RANGE) {
                addLog(`${move.name} missed! You dodged it.`);
                setEnemy(e => ({ ...e, isAttacking: false }));
                return;
              }
              
              if (player.isBlocking) {
                addLog("You blocked " + move.name + "! (partial)");
                // Special still does some chip damage through block
                const chipDamage = Math.floor(move.damage[0] * 0.3);
                setPlayer(p => ({ ...p, health: Math.max(0, p.health - chipDamage) }));
                // Block stun and pushback
                setPlayerBlockStun(15);
                setPlayerKnockback(-8);
              } else {
                const baseDamage = move.damage[0] + Math.floor(Math.random() * (move.damage[1] - move.damage[0]));
                setPlayer(p => ({ 
                  ...p, 
                  health: Math.max(0, p.health - baseDamage),
                  isHit: true 
                }));
                setScreenShake(true);
                setScreenFlash("special");
                setPlayerHitEffect(true);
                setCombo(0);
                // Street Fighter physics - heavy knockback and hitstun for special
                setPlayerKnockback(-18);
                setPlayerHitStun(25);
                addLog(`${move.message} ${baseDamage} damage!`);
                
                setTimeout(() => {
                  setPlayer(p => ({ ...p, isHit: false }));
                  setScreenShake(false);
                  setScreenFlash("none");
                  setPlayerHitEffect(false);
                }, 300);
              }
              
              setEnemy(e => ({ ...e, isAttacking: false }));
            }, 200);
          }, 800); // Charge time
        } else {
          // Normal attacks - no charge
          setEnemy(e => ({ ...e, isAttacking: true }));
          setEnemyAttackParticles(true);
          setTimeout(() => setEnemyAttackParticles(false), 400);
        
          setTimeout(() => {
            // Check distance at moment of impact - enemy must still be in basic range
            const impactDistance = Math.abs(enemyX - playerX);
            if (impactDistance > ENEMY_BASIC_RANGE) {
              addLog(`${move.name} missed! Out of range.`);
              setEnemy(e => ({ ...e, isAttacking: false }));
              return;
            }
            
            if (player.isBlocking) {
              addLog("You blocked " + move.name + "!");
              // Block stun and pushback
              setPlayerBlockStun(10);
              setPlayerKnockback(-5);
            } else {
              const baseDamage = move.damage[0] + Math.floor(Math.random() * (move.damage[1] - move.damage[0]));
              const damage = baseDamage;
              
              setPlayer(p => ({ 
                ...p, 
                health: Math.max(0, p.health - damage),
                isHit: true 
              }));
              setScreenShake(true);
              setScreenFlash("hit");
              setPlayerHitEffect(true);
              setCombo(0);
              // Street Fighter physics - knockback and hitstun
              setPlayerKnockback(-12);
              setPlayerHitStun(15);
              addLog(`${move.message} ${damage} damage!`);
              
              // Blood Drain heals the enemy
              if (move.heal) {
                setEnemy(e => ({
                  ...e,
                  health: Math.min(e.maxHealth, e.health + Math.floor(damage / 2))
                }));
                addLog(`${enemyChar.name} heals ${Math.floor(damage / 2)} HP!`);
              }
              
              setTimeout(() => {
                setPlayer(p => ({ ...p, isHit: false }));
                setScreenShake(false);
                setScreenFlash("none");
                setPlayerHitEffect(false);
              }, 200);
            }
            
            setEnemy(e => ({ ...e, isAttacking: false }));
          }, 300);
        }
      }
    }, 1200);

    return () => clearInterval(interval);
  }, [gameState, player.isBlocking, enemy.isAttacking, addLog]);

  // Check win/lose (now handles rounds)
  useEffect(() => {
    if (enemy.health <= 0 && gameState === "fighting") {
      const newPlayerWins = playerWins + 1;
      setPlayerWins(newPlayerWins);
      setRoundWinner("player");
      
      if (newPlayerWins >= ROUNDS_TO_WIN) {
        setGameState("victory");
        addLog("MATCH VICTORY!");
      } else {
        setGameState("roundEnd");
        addLog(`ROUND ${currentRound} - YOU WIN!`);
      }
    } else if (player.health <= 0 && gameState === "fighting" && !playerExploding) {
      // Trigger explosion first
      setPlayerExploding(true);
      
      const newEnemyWins = enemyWins + 1;
      setEnemyWins(newEnemyWins);
      setRoundWinner("enemy");
      addLog(`ROUND ${currentRound} - DEFEATED...`);
      
      // Then show result after explosion
      setTimeout(() => {
        if (newEnemyWins >= ROUNDS_TO_WIN) {
          setGameState("defeat");
        } else {
          setGameState("roundEnd");
        }
      }, 1000);
    }
  }, [player.health, enemy.health, gameState, playerExploding, playerWins, enemyWins, currentRound, addLog]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      setKeysPressed(prev => new Set(prev).add(key));
      
      if (e.key === "j") {
        e.preventDefault();
        playerAttack();
      } else if (e.key === "k" || e.key === "Shift") {
        e.preventDefault();
        playerBlock(true);
      } else if (e.key === "l") {
        e.preventDefault();
        // Blood Sword Combo when transformed, otherwise try to transform
        if (isTransformed) {
          bloodSwordCombo();
        } else {
          playerSpecial();
        }
      } else if (e.key === "f") {
        e.preventDefault();
        boostDash();
      } else if (e.key === "w" || e.key === "ArrowUp" || e.key === " ") {
        e.preventDefault();
        handleJump();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      setKeysPressed(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
      
      if (e.key === "k" || e.key === "Shift") {
        playerBlock(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [playerAttack, playerBlock, playerSpecial, handleJump, boostDash, bloodSwordCombo, isTransformed]);

  const resetGame = () => {
    stopChainsawLoop();
    setPlayer(getInitialFighterState(playerChar));
    setEnemy(getInitialFighterState(enemyChar));
    setCombo(0);
    setBattleLog([]);
    setGameState("fighting");
    setHitCount(0);
    setIsTransformed(false);
    setIsTransforming(false);
    setTransformTimeRemaining(0);
    setLastEnemyAttack("");
    setScreenFlash("none");
    setPlayerHitEffect(false);
    setEnemyHitEffect(false);
    setSpecialHitEffect(false);
    setPlayerX(0);
    setEnemyX(300);
    setBackgroundX(0);
    setIsWalking(false);
    setIsJumping(false);
    setJumpY(0);
    setIsEnemyMoving(false);
    setEnemyDodging(false);
    setPlayerExploding(false);
    setIsEnemyJumping(false);
    setEnemyJumpY(0);
    setIsBoostDashing(false);
    setIsBloodSword(false);
    setBloodSlashVisible(false);
    setSlashCount(0);
    // Reset physics state
    setPlayerHitStun(0);
    setEnemyHitStun(0);
    setPlayerBlockStun(0);
    setEnemyBlockStun(0);
    setPlayerKnockback(0);
    setEnemyKnockback(0);
    // Full reset also resets round tracking
    setCurrentRound(1);
    setPlayerWins(0);
    setEnemyWins(0);
    setRoundWinner(null);
  };

  const nextRound = () => {
    stopChainsawLoop();
    // Reset fighter states but keep round wins
    setPlayer(getInitialFighterState(playerChar));
    setEnemy(getInitialFighterState(enemyChar));
    setCombo(0);
    setBattleLog([]);
    setGameState("fighting");
    setHitCount(0);
    setIsTransformed(false);
    setIsTransforming(false);
    setTransformTimeRemaining(0);
    setLastEnemyAttack("");
    setScreenFlash("none");
    setPlayerHitEffect(false);
    setEnemyHitEffect(false);
    setSpecialHitEffect(false);
    setPlayerX(0);
    setEnemyX(300);
    setBackgroundX(0);
    setIsWalking(false);
    setIsJumping(false);
    setJumpY(0);
    setIsEnemyMoving(false);
    setEnemyDodging(false);
    setPlayerExploding(false);
    setIsEnemyJumping(false);
    setEnemyJumpY(0);
    setIsBoostDashing(false);
    setIsBloodSword(false);
    setBloodSlashVisible(false);
    setSlashCount(0);
    // Reset physics state
    setPlayerHitStun(0);
    setEnemyHitStun(0);
    setPlayerBlockStun(0);
    setEnemyBlockStun(0);
    setPlayerKnockback(0);
    setEnemyKnockback(0);
    setCurrentRound(prev => prev + 1);
    setRoundWinner(null);
  };

  return (
    <div className={cn(
      "relative w-full min-h-screen overflow-hidden",
      "bg-gradient-to-b from-gray-950 via-red-950/20 to-black",
      screenShake && "animate-shake"
    )}>
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* City Background with Parallax */}
        <div 
          className="absolute inset-0 transition-transform duration-200 ease-out"
          style={{ 
            transform: `translateX(${backgroundX}px)`,
            width: "150%",
            left: "-25%"
          }}
        >
          <img 
            src="https://019e6ae0-fa01-710e-a8de-1015605547ea.mochausercontent.com/city-battle-background.png"
            alt="City background"
            className="w-full h-full object-cover object-bottom"
          />
        </div>
        
        {/* Dark overlay for better character visibility */}
        <div className="absolute inset-0 bg-black/40" />
        
        {/* Blood splatter decorations */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-red-900/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-red-900/10 rounded-full blur-3xl" />
        
        {/* Manga lines */}
        <div className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 10px,
              white 10px,
              white 11px
            )`
          }}
        />
        
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

      {/* Health Bars */}
      <div className="relative z-10 flex justify-between items-start p-4 md:p-6">
        <HealthBar 
          current={player.health} 
          max={player.maxHealth} 
          name={isTransformed ? "Chainsaw Man" : player.name}
          isPlayer={true}
          devilPower={player.devilPower}
          hitCount={hitCount}
          hitsRequired={HITS_FOR_TRANSFORM}
          isTransformed={isTransformed}
        />
        
        {/* VS / Combo / Round Info */}
        <div className="flex flex-col items-center gap-1">
          {/* Round indicator */}
          <div className="font-display text-lg text-white/70 tracking-wider">
            ROUND {currentRound}
          </div>
          
          {/* Win dots */}
          <div className="flex gap-4 mb-2">
            {/* Player wins */}
            <div className="flex gap-1">
              {Array.from({ length: ROUNDS_TO_WIN }).map((_, i) => (
                <div 
                  key={`p-${i}`}
                  className={cn(
                    "w-3 h-3 rounded-full border-2",
                    i < playerWins 
                      ? "bg-green-500 border-green-400 shadow-[0_0_8px_rgba(34,197,94,0.8)]" 
                      : "bg-transparent border-white/30"
                  )}
                />
              ))}
            </div>
            
            {/* VS */}
            <div className="font-display text-3xl md:text-5xl text-red-500 manga-shadow">VS</div>
            
            {/* Enemy wins */}
            <div className="flex gap-1">
              {Array.from({ length: ROUNDS_TO_WIN }).map((_, i) => (
                <div 
                  key={`e-${i}`}
                  className={cn(
                    "w-3 h-3 rounded-full border-2",
                    i < enemyWins 
                      ? "bg-red-500 border-red-400 shadow-[0_0_8px_rgba(239,68,68,0.8)]" 
                      : "bg-transparent border-white/30"
                  )}
                />
              ))}
            </div>
          </div>
          
          {combo > 1 && (
            <div className="font-display text-2xl text-yellow-400 animate-pulse">
              {combo}x COMBO
            </div>
          )}
          {isTransformed && (
            <div className={cn(
              "font-display text-xl",
              transformTimeRemaining <= 10 ? "text-red-500 animate-pulse" : "text-orange-400"
            )}>
              ⏱️ {transformTimeRemaining}s
            </div>
          )}
          {distanceToEnemy > MELEE_RANGE && !isTransformed && (
            <div className="font-display text-sm text-yellow-500 animate-pulse">
              GET CLOSER!
            </div>
          )}
          {distanceToEnemy > MELEE_RANGE && isTransformed && distanceToEnemy <= BLOOD_SWORD_RANGE && (
            <div className="font-display text-sm text-red-500 animate-pulse">
              USE BLOOD SWORD (L)
            </div>
          )}
        </div>
        
        <HealthBar 
          current={enemy.health} 
          max={enemy.maxHealth} 
          name={enemy.name}
          isPlayer={false}
          devilPower={enemy.devilPower}
        />
      </div>

      {/* Arena - positioned at bottom where the road is */}
      <div className="absolute bottom-8 left-0 right-0 z-10 flex justify-between items-end px-8 md:px-16">
        {/* Player dust trail when walking */}
        {isWalking && (
          <div 
            className="absolute bottom-0 pointer-events-none"
            style={{ transform: `translateX(${playerX + 50}px)` }}
          >
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
        
        {/* Player landing impact */}
        {jumpY === 0 && isJumping && (
          <div 
            className="absolute bottom-0 pointer-events-none"
            style={{ transform: `translateX(${playerX + 50}px)` }}
          >
            <div className="w-20 h-3 bg-gradient-to-t from-amber-600/40 to-transparent rounded-full animate-impact-wave" />
          </div>
        )}
        
        {/* Boost Dash Trail Effect */}
        {isBoostDashing && (
          <div 
            className="absolute bottom-8 pointer-events-none"
            style={{ transform: `translateX(${playerX - 50}px)` }}
          >
            {[...Array(8)].map((_, i) => (
              <div
                key={`dash-trail-${i}`}
                className="absolute w-24 h-32 rounded-full"
                style={{
                  left: `${-i * 30}px`,
                  background: `linear-gradient(90deg, transparent, rgba(255, 140, 0, ${0.6 - i * 0.07}), transparent)`,
                  filter: `blur(${4 + i * 2}px)`,
                  animation: 'dash-trail 0.2s ease-out forwards',
                  animationDelay: `${i * 0.02}s`,
                }}
              />
            ))}
            {/* Chainsaw sparks */}
            {[...Array(12)].map((_, i) => (
              <div
                key={`spark-${i}`}
                className="absolute w-2 h-2 rounded-full bg-yellow-400"
                style={{
                  left: `${-i * 15 + Math.random() * 20}px`,
                  top: `${-20 + Math.random() * 60}px`,
                  boxShadow: '0 0 6px #ffaa00, 0 0 12px #ff6600',
                  animation: 'spark-burst 0.3s ease-out forwards',
                  '--spark-x': `${-30 - Math.random() * 40}px`,
                  '--spark-y': `${-20 + Math.random() * 40}px`,
                  animationDelay: `${i * 0.03}s`,
                } as React.CSSProperties}
              />
            ))}
          </div>
        )}
        
        <div 
          className="transition-transform duration-150 ease-out"
          style={{ 
            transform: `translateX(${playerX}px) translateY(${-jumpY}px)`,
          }}
        >
          <PlayerFighter 
            isAttacking={player.isAttacking}
            isBlocking={player.isBlocking}
            isHit={player.isHit}
            health={player.health}
            isTransformed={isTransformed}
            isTransforming={isTransforming}
            onTransformComplete={handleTransformComplete}
            isWalking={isWalking}
            walkDirection={walkDirection}
          />
        </div>

        {/* Hit Effects */}
        <HitEffect isActive={playerHitEffect} position="left" />
        <HitEffect isActive={enemyHitEffect} position="right" />
        <HitEffect isActive={specialHitEffect} position="right" isSpecial />
        
        {/* Attack Particles */}
        <AttackParticles 
          isActive={playerAttackParticles} 
          position="left" 
          type={isTransformed ? "special" : "normal"} 
        />
        <AttackParticles 
          isActive={enemyAttackParticles} 
          position="right" 
          type="normal" 
        />
        
        {/* Enemy Charge-up Effect */}
        <ChargeUpEffect isActive={enemyCharging} position="right" />
        
        {/* Blood Sword Slash Effect - Long range red slash */}
        {bloodSlashVisible && (
          <div 
            className="absolute bottom-32 left-1/2 -translate-x-1/2 pointer-events-none z-30"
            style={{ width: '500px' }}
          >
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-pulse"
                style={{
                  left: `${i * 20}%`,
                  width: '120px',
                  height: '8px',
                  background: 'linear-gradient(90deg, transparent, #ff0000, #ff4444, #ff0000, transparent)',
                  boxShadow: '0 0 20px #ff0000, 0 0 40px #ff0000, 0 0 60px #aa0000',
                  transform: `rotate(${-15 + i * 8}deg) scaleX(${1 + i * 0.3})`,
                  animation: `blood-slash-${i} 0.15s ease-out ${i * 0.08}s`,
                  opacity: 0.9,
                }}
              />
            ))}
            {/* Central blood wave */}
            <div 
              className="absolute left-0 w-full h-4 animate-ping"
              style={{
                background: 'linear-gradient(90deg, rgba(255,0,0,0.8), rgba(255,68,68,1), rgba(255,0,0,0.8))',
                boxShadow: '0 0 30px #ff0000, 0 0 60px #ff0000',
                filter: 'blur(2px)',
              }}
            />
          </div>
        )}
        
        <div 
          className="transition-transform duration-150 ease-out"
          style={{ 
            transform: `translateX(${enemyX - 300}px) translateY(${-enemyJumpY}px)`,
          }}
        >
          <EnemyFighter 
            isAttacking={enemy.isAttacking}
            isBlocking={enemy.isBlocking}
            isHit={enemy.isHit}
            health={enemy.health}
            isMoving={isEnemyMoving}
            moveDirection={enemyWalkDirection}
          />
        </div>
      </div>

      {/* Screen Flash Overlay */}
      {screenFlash !== "none" && (
        <div 
          className={cn(
            "absolute inset-0 z-40 pointer-events-none",
            screenFlash === "hit" && "bg-white animate-screen-flash",
            screenFlash === "special" && "bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 animate-screen-flash-special"
          )}
        />
      )}

      {/* Death Explosion */}
      <DeathExplosion 
        isActive={playerExploding} 
        x={playerX + 100} 
        y={100} 
      />

      {/* Battle Log */}
      <div className="absolute bottom-36 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1">
        {battleLog.map((log, i) => (
          <div 
            key={`${log}-${i}`}
            className={cn(
              "font-display text-lg md:text-xl tracking-wider",
              i === 0 ? "text-white scale-110" : "text-white/50 scale-90",
              log.includes("COMBO") && "text-yellow-400",
              log.includes("DEVASTATING") && "text-orange-400",
              log.includes("CHAINSAW") && "text-chainsaw",
              log.includes("VICTORY") && "text-green-400 text-3xl",
              log.includes("DEFEATED") && "text-red-500 text-3xl",
            )}
            style={{ opacity: 1 - i * 0.2 }}
          >
            {log}
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="absolute bottom-4 left-0 right-0 flex flex-col items-center gap-3">
        {/* Mobile Controls */}
        <div className="flex gap-3">
          <button
            onMouseDown={playerAttack}
            onTouchStart={playerAttack}
            disabled={gameState !== "fighting"}
            className={cn(
              "px-6 py-3 bg-gradient-to-b from-red-600 to-red-800 text-white font-display text-xl uppercase tracking-wider",
              "border-2 border-red-400 active:scale-95 transition-transform",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "hover:from-red-500 hover:to-red-700"
            )}
            style={{ clipPath: "polygon(10% 0%, 100% 0%, 90% 100%, 0% 100%)" }}
          >
            Attack
          </button>
          
          <button
            onMouseDown={() => playerBlock(true)}
            onMouseUp={() => playerBlock(false)}
            onMouseLeave={() => playerBlock(false)}
            onTouchStart={() => playerBlock(true)}
            onTouchEnd={() => playerBlock(false)}
            disabled={gameState !== "fighting"}
            className={cn(
              "px-6 py-3 bg-gradient-to-b from-gray-600 to-gray-800 text-white font-display text-xl uppercase tracking-wider",
              "border-2 border-gray-400 active:scale-95 transition-transform",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              player.isBlocking && "from-blue-600 to-blue-800 border-blue-400"
            )}
            style={{ clipPath: "polygon(10% 0%, 100% 0%, 90% 100%, 0% 100%)" }}
          >
            Block
          </button>
          
          <button
            onMouseDown={playerSpecial}
            onTouchStart={playerSpecial}
            disabled={gameState !== "fighting" || hitCount < HITS_FOR_TRANSFORM || isTransformed || isTransforming}
            className={cn(
              "px-6 py-3 bg-gradient-to-b from-orange-500 to-orange-700 text-white font-display text-xl uppercase tracking-wider",
              "border-2 border-orange-300 active:scale-95 transition-transform",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              hitCount >= HITS_FOR_TRANSFORM && !isTransformed && !isTransforming && "animate-pulse-glow"
            )}
            style={{ clipPath: "polygon(10% 0%, 100% 0%, 90% 100%, 0% 100%)" }}
          >
            {isTransformed ? "Transformed" : "Transform"}
          </button>
        </div>

        {/* Keyboard hints */}
        <div className="text-xs text-muted-foreground tracking-wider hidden md:block">
          {isTransformed ? (
            "J: Close Slash • F: Boost Dash • L: Blood Sword (50 DP) • K: Block"
          ) : (
            "SPACE/J: Attack • SHIFT/K: Block • E/L: Transform (7 hits)"
          )}
        </div>
      </div>

      {/* Victory/Defeat/Round End Overlay */}
      {gameState !== "fighting" && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80">
          {gameState === "roundEnd" ? (
            <>
              <div className={cn(
                "font-display text-4xl md:text-6xl manga-shadow mb-4",
                roundWinner === "player" ? "text-green-400" : "text-red-600"
              )}>
                ROUND {currentRound} {roundWinner === "player" ? "WON!" : "LOST!"}
              </div>
              <div className="font-display text-2xl text-white/70 mb-8">
                {playerWins} - {enemyWins}
              </div>
              <button
                onClick={nextRound}
                className="px-8 py-4 bg-gradient-to-b from-yellow-500 to-yellow-700 text-black font-display text-2xl uppercase tracking-wider border-2 border-yellow-300 hover:from-yellow-400 hover:to-yellow-600 transition-all animate-pulse"
                style={{ clipPath: "polygon(5% 0%, 100% 0%, 95% 100%, 0% 100%)" }}
              >
                Next Round
              </button>
            </>
          ) : (
            <>
              <div className={cn(
                "font-display text-6xl md:text-8xl manga-shadow mb-4",
                gameState === "victory" ? "text-yellow-400" : "text-red-600"
              )}>
                {gameState === "victory" ? "VICTORY" : "DEFEAT"}
              </div>
              <div className="font-display text-2xl text-white/70 mb-8">
                Final Score: {playerWins} - {enemyWins}
              </div>
              <div className="flex gap-4">
                <button
                  onClick={resetGame}
                  className="px-8 py-4 bg-gradient-to-b from-red-600 to-red-800 text-white font-display text-2xl uppercase tracking-wider border-2 border-red-400 hover:from-red-500 hover:to-red-700 transition-all"
                  style={{ clipPath: "polygon(5% 0%, 100% 0%, 95% 100%, 0% 100%)" }}
                >
                  Fight Again
                </button>
                {onReturnToMenu && (
                  <button
                    onClick={onReturnToMenu}
                    className="px-8 py-4 bg-gradient-to-b from-gray-700 to-gray-900 text-white font-display text-2xl uppercase tracking-wider border-2 border-gray-500 hover:from-gray-600 hover:to-gray-800 transition-all"
                    style={{ clipPath: "polygon(5% 0%, 100% 0%, 95% 100%, 0% 100%)" }}
                  >
                    Menu
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
