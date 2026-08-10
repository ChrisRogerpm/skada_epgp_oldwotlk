import { IReglasRepository } from "@/src/domain/repositories/IReglasRepository";
import { ReglaPuntoInput, ReglaPuntoRecord } from "@/src/domain/entities/Reglas";

export class CreateReglaPuntoUseCase {
  constructor(private readonly repository: IReglasRepository) {}

  async execute(input: ReglaPuntoInput): Promise<ReglaPuntoRecord> {
    if (!input.tipo || !input.categoria) {
      throw new Error("Tipo y categoría son obligatorios");
    }
    return this.repository.createPunto(input);
  }
}
