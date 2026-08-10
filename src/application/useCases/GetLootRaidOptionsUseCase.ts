import { ILootRepository } from "@/src/domain/repositories/ILootRepository";
import { RaidOption } from "@/src/domain/entities/Loot";

export class GetLootRaidOptionsUseCase {
  constructor(private readonly repository: ILootRepository) {}

  async execute(limit: number, search: string): Promise<RaidOption[]> {
    return this.repository.getRaidOptions(limit, search);
  }
}
