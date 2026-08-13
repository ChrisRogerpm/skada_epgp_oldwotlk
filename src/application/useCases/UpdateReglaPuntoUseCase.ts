import { IReglasRepository } from "@/src/domain/repositories/IReglasRepository";
import { ReglaPuntoInput, ReglaPuntoRecord } from "@/src/domain/entities/Reglas";

export class UpdateReglaPuntoUseCase {
  constructor(private readonly repository: IReglasRepository) {}

  async execute(id: string, input: ReglaPuntoInput): Promise<ReglaPuntoRecord> {
    if (!id || !input.tipo || !input.categoria) {
      throw new Error("Tipo y categoría son obligatorios");
    }
    return this.repository.updatePunto(id, input);
  }
}
