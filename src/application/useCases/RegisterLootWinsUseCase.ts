import { ILootRepository } from "@/src/domain/repositories/ILootRepository";
import { LootWin, RegisterLootWinsInput } from "@/src/domain/entities/Loot";

export class RegisterLootWinsUseCase {
  constructor(private readonly repository: ILootRepository) {}

  async execute(input: RegisterLootWinsInput, createdBy: string | null): Promise<LootWin[]> {
    if (!input.personaje || !input.id_items || input.id_items.length === 0) {
      throw new Error("Personaje y al menos un ítem son obligatorios");
    }

    const inputs = input.id_items.map((id_item) => ({
      personaje: input.personaje,
      class: input.class,
      id_item,
      id_raids: input.id_raids,
      note: input.note,
    }));

    return this.repository.registerWins(inputs, createdBy);
  }
}
