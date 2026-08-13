import { ILootRepository } from "@/src/domain/repositories/ILootRepository";
import { PaginatedLootWinsResult } from "@/src/domain/entities/Loot";

export class GetRecentLootWinsUseCase {
  constructor(private readonly repository: ILootRepository) {}

  async execute(page: number, limit: number, search: string): Promise<PaginatedLootWinsResult> {
    return this.repository.getRecentWins(page, limit, search);
  }
}
