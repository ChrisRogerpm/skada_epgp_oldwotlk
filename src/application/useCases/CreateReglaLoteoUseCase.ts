import { IReglasRepository } from "@/src/domain/repositories/IReglasRepository";
import { ReglaLoteoInput, ReglaLoteoRecord } from "@/src/domain/entities/Reglas";

export class CreateReglaLoteoUseCase {
  constructor(private readonly repository: IReglasRepository) {}

  async execute(input: ReglaLoteoInput): Promise<ReglaLoteoRecord> {
    if (!input.raidCode || !input.categoria || !input.nombreItem) {
      throw new Error("Raid, categoría e ítem son obligatorios");
    }
    return this.repository.createLoteo(input);
  }
}
