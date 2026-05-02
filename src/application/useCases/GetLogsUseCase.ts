import { ILogsRepository } from "@/src/domain/repositories/ILogsRepository";
import { Log } from "@/src/domain/entities/Log";

export class GetLogsUseCase {
  constructor(private readonly logsRepository: ILogsRepository) {}

  async execute(date: string | null, limit: number, offset: number): Promise<Log[]> {
    return this.logsRepository.getLogs(date, limit, offset);
  }
}
