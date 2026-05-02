import { RaidDateResult } from "../entities/Raid";

export interface IRaidsRepository {
  getRaidsByDate(date: string): Promise<RaidDateResult>;
}
