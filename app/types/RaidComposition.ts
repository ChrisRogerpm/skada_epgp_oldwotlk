export interface RaidParticipant {
  id: string;
  raid_id: string;
  player_name: string;
  player_class: string;
  player_group: number;
}

export interface RaidItem {
  id: number;
  id_item: number;
  id_raids: string;
  personaje: string | null;
  class: string | null;
  items: itemsDetail
}

export interface RaidInfo {
  id: string;
  raid_id_key: string;
  raid_date: string;
  raid_time: string;
  boss_name: string;
  created_at: string;
  participants: RaidParticipant[];
  items?: RaidItem[];
}

export interface RaidsByDateResponse {
  date: string;
  raids: RaidInfo[];
}

export interface itemsDetail{
  id: number;
  id_item: number;
  name: string;
  raid: string;
  icon: string;
}