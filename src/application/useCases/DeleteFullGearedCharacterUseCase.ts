import { IFullGearedRepository } from "@/src/domain/repositories/IFullGearedRepository";

export class DeleteFullGearedCharacterUseCase {
  constructor(private readonly repository: IFullGearedRepository) {}

  async execute(id: string | number): Promise<void> {
    return this.repository.deleteCharacter(id);
  }
}
