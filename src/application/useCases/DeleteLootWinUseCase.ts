import { ILootRepository } from "@/src/domain/repositories/ILootRepository";

export class DeleteLootWinUseCase {
  constructor(private readonly repository: ILootRepository) {}

  async execute(id: number): Promise<void> {
    return this.repository.deleteWin(id);
  }
}
