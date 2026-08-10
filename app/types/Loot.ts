export interface LootAlter {
  name: string;
  class: string;
  icon: string;
}

export interface LootCharacter {
  main: string;
  class: string;
  icon: string;
  alters: LootAlter[];
}

export interface LootItem {
  id: number;
  id_item: number;
  name: string;
  raid: string;
  icon: string;
}

export interface LootWin {
  id: number;
  id_item: number;
  id_raids: string | null;
  personaje: string;
  class: string | null;
  source?: "sync" | "manual";
  note?: string | null;
  created_at?: string;
}

export interface LootMatrix {
  raid: string;
  characters: LootCharacter[];
  items: LootItem[];
  wins: LootWin[];
}

export interface RaidOption {
  id: string;
  raid_date: string;
  raid_time: string;
  boss_name: string;
}

export interface LootWinDetailed extends LootWin {
  item_name: string;
  item_icon: string;
  item_raid: string;
  raid_date: string;
  boss_name: string;
}

export interface PaginatedLootWinsResult {
  data: LootWinDetailed[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const LOOT_RAID_TABS: { value: string; label: string }[] = [
  { value: "RS", label: "Ruby Sanctum" },
  { value: "TOGC", label: "Trial of the Grand Crusader" },
];
