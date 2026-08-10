import { IReglasRepository } from "@/src/domain/repositories/IReglasRepository";

export class DeleteReglaLoteoUseCase {
  constructor(private readonly repository: IReglasRepository) {}

  async execute(id: string): Promise<void> {
    if (!id) throw new Error("ID requerido");
    return this.repository.deleteLoteo(id);
  }
}
