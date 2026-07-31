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
  endtime: number; // Unix timestamp del fin del encuentro, distingue sesiones del mismo jefe/día
  Damage: EncounterDamage[];
  Healing?: EncounterDamage[];
}

// Keeping the flattened RaidLog so our UI table doesn't have to drastically change
export interface RaidLog extends EncounterDamage {
  date: string;
  raidInstance: string;
  boss: string;
  endtime: number;
}

export interface FilterState {
  date: string;
  raidInstance: string;
  boss: string;
  metric: "Damage" | "Healing";
  search: string;
  session: number | null; // endtime de la sesión elegida cuando hay 2+ kills del mismo jefe/día
}

// Hora local Perú (HH:MM) para distinguir sesiones del mismo jefe/día en la UI
export function formatSessionTime(endtime: number): string {
  const utcDate = new Date(endtime * 1000);
  const peruDate = new Date(utcDate.getTime() - 5 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(peruDate.getUTCHours())}:${pad(peruDate.getUTCMinutes())}`;
}

export const RAID_INSTANCES = [
  "Icecrown Citadel",
  "Ruby Sanctum",
  "Trial of the Crusader",
  "Ulduar",
];

const ICC_BOSSES = [
  "Lord Marrowgar",
  "Lady Deathwhisper",
  "Icecrown Gunship Battle",
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

const RS_BOSSES = [
  "Saviana Ragefire",
  "General Zarithrian",
  "Baltharus the Warborn",
  "Halion",
];

const TOC_BOSSES = [
  "The Northrend Beasts",
  "Lord Jaraxxus",
  "Faction Champions",
  "Twin Val'kyr",
  "Anub'arak",
];

const ULDUAR_BOSSES = [
  "Flame Leviathan",
  "Ignis the Furnace Master",
  "Razorscale",
  "Steelbreaker",
  "Runemaster Molgeim",
  "Stormcaller Brundir",
  "XT-002 Deconstructor",
  "Kologarn",
  "Auriaya",
  "Hodir",
  "Thorim",
  "Freya",
  "Mimiron",
  "General Vezax",
  "Yogg-Saron",
  "Algalon the Observer",
];

export const BOSSES = [...ICC_BOSSES, ...RS_BOSSES, ...TOC_BOSSES, ...ULDUAR_BOSSES];

export const BOSSES_BY_INSTANCE: Record<string, string[]> = {
  "Icecrown Citadel": ICC_BOSSES,
  "Ruby Sanctum": RS_BOSSES,
  "Trial of the Crusader": TOC_BOSSES,
  "Ulduar": ULDUAR_BOSSES,
};

const BOSS_INSTANCE_MAP: Record<string, string> = {
  ...Object.fromEntries(ICC_BOSSES.map((b) => [b, "Icecrown Citadel"])),
  ...Object.fromEntries(RS_BOSSES.map((b) => [b, "Ruby Sanctum"])),
  ...Object.fromEntries(TOC_BOSSES.map((b) => [b, "Trial of the Crusader"])),
  ...Object.fromEntries(ULDUAR_BOSSES.map((b) => [b, "Ulduar"])),
};

export function getRaidInstanceForBoss(boss: string): string {
  return BOSS_INSTANCE_MAP[boss] || "Icecrown Citadel";
}

export const BOSSES_TRANSLATIONS: Record<string, string> = {
  "Lord Marrowgar": "Lord Tuétano",
  "Lady Deathwhisper": "Lady Susurramuerte",
  "Icecrown Gunship Battle": "Batalla de Naves de Guerra",
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
