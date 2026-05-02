import { Log } from "../entities/Log";

export interface ILogsRepository {
  getLogs(date: string | null, limit: number, offset: number): Promise<Log[]>;
}
