import { ILootRepository } from "@/src/domain/repositories/ILootRepository";
import { LootWinDetailed } from "@/src/domain/entities/Loot";

export class GetLootHistoryByCharactersUseCase {
  constructor(private readonly repository: ILootRepository) {}

  async execute(namesParam: string | null): Promise<LootWinDetailed[]> {
    if (!namesParam) {
      throw new Error("Character names are required");
    }

    const names = namesParam
      .split(",")
      .map((n) => n.trim())
      .filter(Boolean);

    return this.repository.getHistoryByCharacters(names);
  }
}
