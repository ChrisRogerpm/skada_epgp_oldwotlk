import { ILootRepository } from "@/src/domain/repositories/ILootRepository";
import { LootMatrix } from "@/src/domain/entities/Loot";

const VALID_RAIDS = ["RS", "TOGC", "ICC"];

export class GetLootMatrixUseCase {
  constructor(private readonly repository: ILootRepository) {}

  async execute(raid: string): Promise<LootMatrix> {
    const normalized = (raid || "").toUpperCase();
    if (!VALID_RAIDS.includes(normalized)) {
      throw new Error(`Raid inválida: ${raid}`);
    }
    return this.repository.getLootMatrix(normalized);
  }
}
