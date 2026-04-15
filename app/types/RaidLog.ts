export interface EncounterDamage {
  Rank: number;
  Character: string;
  Class: string;
  Talent?: string | null;
  Icon?: string | null;
  Amount: string;
  DPS?: string | null;
  HPS?: string | null;
}

export interface RaidEncounterPayload {
  name: string; // This corresponds to the boss name
  date: string;
  Damage: EncounterDamage[];
  Healing?: EncounterDamage[];
}

// Keeping the flattened RaidLog so our UI table doesn't have to drastically change
export interface RaidLog extends EncounterDamage {
  date: string;
  raidInstance: string;
  boss: string;
}

export interface FilterState {
  date: string;
  raidInstance: string;
  boss: string;
  metric: "Damage" | "Healing";
  search: string;
}

export const RAID_INSTANCES = ["Icecrown Citadel"];
export const BOSSES = [
  "Lord Marrowgar",
  "Lady Deathwhisper",
  "Gunship Battle",
  "Deathbringer Saurfang",
  "Festergut",
  "Rotface",
  "Professor Putricide",
  "Blood Prince Council",
  "Blood-Queen Lana'thel",
  "Valithria Dreamwalker",
  "Sindragosa",
  "The Lich King",
];

export const BOSSES_TRANSLATIONS: Record<string, string> = {
  "Lord Marrowgar": "Lord Tuétano",
  "Lady Deathwhisper": "Lady Susurramuerte",
  "Gunship Battle": "Batalla de Naves de Guerra",
  "Deathbringer Saurfang": "Libramorte Colmillosauro",
  "Festergut": "Panzachancro",
  "Rotface": "Carapútrea",
  "Professor Putricide": "Profesor Putricidio",
  "Blood Prince Council": "Consejo de los Príncipes de Sangre",
  "Blood-Queen Lana'thel": "Reina de Sangre Lana'thel",
  "Valithria Dreamwalker": "Valithria Caminasueños",
  "Sindragosa": "Sindragosa",
  "The Lich King": "El Rey Exánime",
};
