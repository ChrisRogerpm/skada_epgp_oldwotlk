export interface RaidParticipant {
  id: number;
  raid_id: number;
  player_group: number;
  [key: string]: any;
}

export interface RaidItem {
  id: number;
  id_raids: number;
  items?: any;
  [key: string]: any;
}

export interface RaidData {
  id: number;
  raid_date: string;
  raid_time: string;
  participants: RaidParticipant[];
  items: RaidItem[];
  [key: string]: any;
}

export interface RaidDateResult {
  date: string;
  raids: RaidData[];
}
