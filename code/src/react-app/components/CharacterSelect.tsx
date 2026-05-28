import { useState } from "react";
import { Character, getPlayableCharacters, getEnemyCharacters } from "@/data/characters";
import { cn } from "@/react-app/lib/utils";
import { Swords, Shield, Zap, Heart } from "lucide-react";

interface CharacterSelectProps {
  onStartBattle: (playerId: string, enemyId: string) => void;
  onBack: () => void;
}

export function CharacterSelect({ onStartBattle, onBack }: CharacterSelectProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<string>("denji");
  const [selectedEnemy, setSelectedEnemy] = useState<string>("bat-devil");
  const [selectingEnemy, setSelectingEnemy] = useState(false);

  const playableCharacters = getPlayableCharacters();
  const enemyCharacters = getEnemyCharacters();

  const currentCharacters = selectingEnemy ? enemyCharacters : playableCharacters;
  const currentSelection = selectingEnemy ? selectedEnemy : selectedPlayer;
  const setCurrentSelection = selectingEnemy ? setSelectedEnemy : setSelectedPlayer;

  const selectedChar = currentCharacters.find(c => c.id === currentSelection);

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden relative">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black opacity-60" />
      <div className="absolute top-0 left-0 w-64 h-64 bg-primary/10 blur-[100px] rounded-full" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-devil/20 blur-[100px] rounded-full" />
      
      {/* Header */}
      <header className="relative z-10 pt-8 pb-4 text-center">
        <h1 className="font-display text-4xl md:text-5xl tracking-wider">
          {selectingEnemy ? (
            <span className="text-devil">CHOOSE YOUR OPPONENT</span>
          ) : (
            <span className="text-chainsaw">SELECT YOUR FIGHTER</span>
          )}
        </h1>
        <div className="flex justify-center gap-4 mt-4">
          <button
            onClick={() => setSelectingEnemy(false)}
            className={cn(
              "px-6 py-2 font-display text-lg tracking-wide transition-all",
              !selectingEnemy 
                ? "bg-chainsaw text-black" 
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            HUNTER
          </button>
          <button
            onClick={() => setSelectingEnemy(true)}
            className={cn(
              "px-6 py-2 font-display text-lg tracking-wide transition-all",
              selectingEnemy 
                ? "bg-devil text-white" 
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            DEVIL
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex flex-col md:flex-row gap-6 p-6">
        {/* Character grid */}
        <div className="flex-1">
          <div className="grid grid-cols-3 gap-4 max-w-xl mx-auto">
            {currentCharacters.map((char) => (
              <CharacterCard
                key={char.id}
                character={char}
                isSelected={currentSelection === char.id}
                onClick={() => setCurrentSelection(char.id)}
              />
            ))}
          </div>
        </div>

        {/* Character details */}
        {selectedChar && (
          <div className="md:w-80 flex-shrink-0">
            <CharacterDetails character={selectedChar} />
          </div>
        )}
      </div>

      {/* Footer actions */}
      <footer className="relative z-10 p-6 flex justify-center gap-4">
        <button
          onClick={onBack}
          className="px-8 py-3 bg-muted hover:bg-muted/80 font-display text-xl tracking-wider transition-all"
        >
          BACK
        </button>
        <button
          onClick={() => onStartBattle(selectedPlayer, selectedEnemy)}
          className={cn(
            "px-12 py-3 font-display text-2xl tracking-wider transition-all",
            "bg-gradient-to-r from-primary to-destructive",
            "hover:scale-105 hover:shadow-lg hover:shadow-primary/30",
            "border-b-4 border-black/30"
          )}
        >
          FIGHT!
        </button>
      </footer>
    </div>
  );
}

function CharacterCard({ 
  character, 
  isSelected, 
  onClick 
}: { 
  character: Character; 
  isSelected: boolean; 
  onClick: () => void;
}) {
  const colorClasses: Record<string, string> = {
    orange: "border-orange-500 bg-orange-500/10",
    blue: "border-blue-500 bg-blue-500/10",
    pink: "border-pink-500 bg-pink-500/10",
    purple: "border-purple-500 bg-purple-500/10",
    green: "border-green-500 bg-green-500/10",
    indigo: "border-indigo-500 bg-indigo-500/10",
  };

  const selectedColorClasses: Record<string, string> = {
    orange: "border-orange-400 bg-orange-500/30 shadow-orange-500/50",
    blue: "border-blue-400 bg-blue-500/30 shadow-blue-500/50",
    pink: "border-pink-400 bg-pink-500/30 shadow-pink-500/50",
    purple: "border-purple-400 bg-purple-500/30 shadow-purple-500/50",
    green: "border-green-400 bg-green-500/30 shadow-green-500/50",
    indigo: "border-indigo-400 bg-indigo-500/30 shadow-indigo-500/50",
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative aspect-square border-2 transition-all duration-200",
        "flex flex-col items-center justify-center p-4",
        "hover:scale-105",
        isSelected 
          ? cn(selectedColorClasses[character.color], "shadow-lg scale-105") 
          : cn(colorClasses[character.color], "opacity-70 hover:opacity-100")
      )}
    >
      {/* Character icon placeholder */}
      <div className={cn(
        "w-16 h-16 md:w-20 md:h-20 rounded-full mb-2",
        "flex items-center justify-center",
        `bg-${character.color}-500/30`
      )}>
        <span className="text-3xl md:text-4xl font-display">
          {character.name[0]}
        </span>
      </div>
      <span className="font-display text-sm md:text-base tracking-wide text-center">
        {character.name}
      </span>
      {isSelected && (
        <div className="absolute inset-0 border-2 border-white/50 animate-pulse pointer-events-none" />
      )}
    </button>
  );
}

function CharacterDetails({ character }: { character: Character }) {
  return (
    <div className={cn(
      "h-full p-6 border-2",
      `border-${character.color}-500/50`,
      "bg-gradient-to-b from-card/80 to-card"
    )}>
      <h2 className="font-display text-3xl tracking-wide mb-1">{character.name}</h2>
      <p className={cn(
        "font-display text-lg tracking-wider mb-4",
        `text-${character.color}-400`
      )}>
        {character.title}
      </p>
      
      <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
        {character.description}
      </p>

      {/* Stats */}
      <div className="space-y-3">
        <StatBar 
          icon={<Heart className="w-4 h-4" />} 
          label="HEALTH" 
          value={character.health} 
          maxValue={600} 
          color="red" 
        />
        <StatBar 
          icon={<Zap className="w-4 h-4" />} 
          label="SPEED" 
          value={character.speed} 
          maxValue={10} 
          color="yellow" 
        />
        <StatBar 
          icon={<Swords className="w-4 h-4" />} 
          label="DAMAGE" 
          value={character.damage} 
          maxValue={30} 
          color="orange" 
        />
        <StatBar 
          icon={<Shield className="w-4 h-4" />} 
          label="SPECIAL" 
          value={character.specialDamage} 
          maxValue={60} 
          color="purple" 
        />
      </div>

      <div className="mt-6 pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Special Move</p>
        <p className={cn("font-display text-lg", `text-${character.accentColor}-400`)}>
          {character.specialName}
        </p>
      </div>
    </div>
  );
}

function StatBar({ 
  icon, 
  label, 
  value, 
  maxValue, 
  color 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: number; 
  maxValue: number; 
  color: string;
}) {
  const percentage = (value / maxValue) * 100;
  
  const colorClasses: Record<string, string> = {
    red: "bg-red-500",
    yellow: "bg-yellow-500",
    orange: "bg-orange-500",
    purple: "bg-purple-500",
  };

  return (
    <div className="flex items-center gap-2">
      <div className="text-muted-foreground">{icon}</div>
      <span className="text-xs text-muted-foreground w-16">{label}</span>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className={cn("h-full transition-all", colorClasses[color])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
