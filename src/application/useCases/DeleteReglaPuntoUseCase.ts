import { IReglasRepository } from "@/src/domain/repositories/IReglasRepository";

export class DeleteReglaPuntoUseCase {
  constructor(private readonly repository: IReglasRepository) {}

  async execute(id: string): Promise<void> {
    if (!id) throw new Error("ID requerido");
    return this.repository.deletePunto(id);
  }
}
