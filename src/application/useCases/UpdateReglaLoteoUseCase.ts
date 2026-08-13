import { IReglasRepository } from "@/src/domain/repositories/IReglasRepository";
import { ReglaLoteoInput, ReglaLoteoRecord } from "@/src/domain/entities/Reglas";

export class UpdateReglaLoteoUseCase {
  constructor(private readonly repository: IReglasRepository) {}

  async execute(id: string, input: ReglaLoteoInput): Promise<ReglaLoteoRecord> {
    if (!id || !input.raidCode || !input.categoria || !input.nombreItem) {
      throw new Error("Raid, categoría e ítem son obligatorios");
    }
    return this.repository.updateLoteo(id, input);
  }
}
