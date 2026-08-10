import { ILootRepository } from "@/src/domain/repositories/ILootRepository";
import { LootWin, RegisterLootWinInput } from "@/src/domain/entities/Loot";

export class RegisterLootWinUseCase {
  constructor(private readonly repository: ILootRepository) {}

  async execute(input: RegisterLootWinInput, createdBy: string | null): Promise<LootWin> {
    if (!input.personaje || !input.id_item) {
      throw new Error("Personaje e ítem son obligatorios");
    }
    return this.repository.registerWin(input, createdBy);
  }
}
