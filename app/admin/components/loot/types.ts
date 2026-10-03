export interface LootWinRow {
  id: number;
  id_item: number;
  id_raids: string | null;
  personaje: string;
  class: string | null;
  source?: "sync" | "manual";
  note?: string | null;
  created_at?: string;
  item_name: string;
  item_icon: string;
  item_raid: string;
  raid_date: string;
  raid_time?: string;
  boss_name: string;
}

export interface LootWinsPage {
  data: LootWinRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const LOOT_RAIDS = [
  { value: "ICC", short: "ICC", label: "Icecrown Citadel" },
  { value: "RS", short: "RS", label: "Ruby Sanctum" },
  { value: "TOGC", short: "ToGC", label: "Trial of the Grand Crusader" },
] as const;

export type LootRaidCode = (typeof LOOT_RAIDS)[number]["value"];
