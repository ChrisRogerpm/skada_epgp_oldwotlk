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

export interface RegisterLootWinInput {
  personaje: string;
  class?: string | null;
  id_item: number;
  // Nulo para ítems legacy sin sesión de raid rastreada (previos al sync).
  id_raids: string | null;
  note?: string | null;
}

export interface UpdateLootWinInput extends RegisterLootWinInput {
  id: number;
}

export interface RegisterLootWinsInput {
  personaje: string;
  class?: string | null;
  id_items: number[];
  id_raids: string | null;
  note?: string | null;
}
