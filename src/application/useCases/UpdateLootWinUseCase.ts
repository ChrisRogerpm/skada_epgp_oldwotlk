import { ILootRepository } from "@/src/domain/repositories/ILootRepository";
import { LootWin, UpdateLootWinInput } from "@/src/domain/entities/Loot";

export class UpdateLootWinUseCase {
  constructor(private readonly repository: ILootRepository) {}

  async execute(input: UpdateLootWinInput): Promise<LootWin> {
    if (!input.id || !input.personaje || !input.id_item) {
      throw new Error("Personaje e ítem son obligatorios");
    }
    return this.repository.updateWin(input);
  }
}
