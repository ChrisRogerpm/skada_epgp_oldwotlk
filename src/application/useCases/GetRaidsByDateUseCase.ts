import { IRaidsRepository } from "@/src/domain/repositories/IRaidsRepository";
import { RaidDateResult } from "@/src/domain/entities/Raid";

export class GetRaidsByDateUseCase {
  constructor(private readonly raidsRepository: IRaidsRepository) {}

  async execute(date: string): Promise<RaidDateResult> {
    return this.raidsRepository.getRaidsByDate(date);
  }
}
