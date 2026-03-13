export interface EncounterDamage {
  Rank: number;
  Character: string;
  Class: string;
  Talent: string;
  Icon: string;
  Amount: string;
  DPS?: string;
  HPS?: string;
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
