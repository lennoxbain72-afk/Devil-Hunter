import { useState } from "react";
import { BattleArena } from "../components/BattleArena";
import { MainMenu } from "../components/MainMenu";
import { CharacterSelect } from "../components/CharacterSelect";

type GameState = "menu" | "select" | "battle";

interface BattleConfig {
  playerId: string;
  enemyId: string;
}

export default function Home() {
  const [gameState, setGameState] = useState<GameState>("menu");
  const [battleConfig, setBattleConfig] = useState<BattleConfig>({
    playerId: "denji",
    enemyId: "bat-devil",
  });

  const handleStartBattle = (playerId: string, enemyId: string) => {
    setBattleConfig({ playerId, enemyId });
    setGameState("battle");
  };

  if (gameState === "menu") {
    return <MainMenu onStartGame={() => setGameState("select")} />;
  }

  if (gameState === "select") {
    return (
      <CharacterSelect 
        onStartBattle={handleStartBattle}
        onBack={() => setGameState("menu")}
      />
    );
  }

  return (
    <BattleArena 
      playerId={battleConfig.playerId}
      enemyId={battleConfig.enemyId}
      onReturnToMenu={() => setGameState("menu")} 
    />
  );
}
