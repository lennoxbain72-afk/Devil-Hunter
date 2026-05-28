export interface Character {
  id: string;
  name: string;
  title: string;
  health: number;
  speed: number;
  damage: number;
  specialName: string;
  specialDamage: number;
  color: string; // Tailwind color class
  accentColor: string;
  description: string;
  isPlayable: boolean;
}

export const characters: Character[] = [
  // Playable characters (Devil Hunters)
  {
    id: "denji",
    name: "Denji",
    title: "Chainsaw Man",
    health: 100,
    speed: 5,
    damage: 15,
    specialName: "Chainsaw Transformation",
    specialDamage: 50,
    color: "orange",
    accentColor: "yellow",
    description: "A devil hunter who merged with the Chainsaw Devil. Can transform after landing 7 hits.",
    isPlayable: true,
  },
  {
    id: "aki",
    name: "Aki Hayakawa",
    title: "Fox Devil Contract",
    health: 90,
    speed: 6,
    damage: 18,
    specialName: "Fox Devil Strike",
    specialDamage: 45,
    color: "blue",
    accentColor: "cyan",
    description: "A skilled devil hunter with contracts to multiple devils. Fast and precise.",
    isPlayable: true,
  },
  {
    id: "power",
    name: "Power",
    title: "Blood Fiend",
    health: 80,
    speed: 7,
    damage: 20,
    specialName: "Blood Hammer",
    specialDamage: 55,
    color: "pink",
    accentColor: "red",
    description: "The Blood Fiend. High damage but lower health. Very fast attacks.",
    isPlayable: true,
  },
  // Enemy characters (Devils)
  {
    id: "bat-devil",
    name: "Bat Devil",
    title: "Terror of the Night",
    health: 400,
    speed: 4,
    damage: 20,
    specialName: "Sonic Screech",
    specialDamage: 35,
    color: "purple",
    accentColor: "violet",
    description: "A powerful devil that feeds on human blood. Uses sonic attacks and sharp claws.",
    isPlayable: false,
  },
  {
    id: "leech-devil",
    name: "Leech Devil",
    title: "Blood Drainer",
    health: 300,
    speed: 5,
    damage: 15,
    specialName: "Life Drain",
    specialDamage: 25,
    color: "green",
    accentColor: "lime",
    description: "A parasitic devil that drains life force. Weaker but heals with attacks.",
    isPlayable: false,
  },
  {
    id: "eternity-devil",
    name: "Eternity Devil",
    title: "Infinite Horror",
    health: 600,
    speed: 2,
    damage: 25,
    specialName: "Time Loop",
    specialDamage: 40,
    color: "indigo",
    accentColor: "purple",
    description: "An ancient devil that controls perception of time. Extremely tough to defeat.",
    isPlayable: false,
  },
];

export const getPlayableCharacters = () => characters.filter(c => c.isPlayable);
export const getEnemyCharacters = () => characters.filter(c => !c.isPlayable);
export const getCharacterById = (id: string) => characters.find(c => c.id === id);
