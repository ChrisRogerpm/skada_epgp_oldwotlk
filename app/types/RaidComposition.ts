export interface RaidParticipant {
  id: string;
  raid_id: string;
  player_name: string;
  player_class: string;
  player_group: number;
}

export interface RaidInfo {
  id: string;
  raid_id_key: string;
  raid_date: string;
  raid_time: string;
  boss_name: string;
  created_at: string;
  participants: RaidParticipant[];
}

export interface RaidsByDateResponse {
  date: string;
  raids: RaidInfo[];
}
