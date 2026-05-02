import { RosterMember, LogDetail } from '../../domain/entities/Epgp';

export interface GetEpgpRosterResponse {
  date: string;
  hour: string;
  roster: RosterMember[];
}

export interface GetEpgpLogsRequest {
  fecha?: string | null;
}

export interface SearchEpgpCharactersRequest {
  query: string | null;
}

export interface GetEpgpHistoryRequest {
  names: string | null;
}
