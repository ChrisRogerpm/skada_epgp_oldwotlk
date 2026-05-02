import { IFullGearedRepository } from "@/src/domain/repositories/IFullGearedRepository";
import { FullGearedCharacter } from "@/src/domain/entities/FullGeared";

export class UpdateFullGearedCharacterUseCase {
  constructor(private readonly repository: IFullGearedRepository) {}

  async execute(character: FullGearedCharacter): Promise<FullGearedCharacter> {
    return this.repository.updateCharacter(character);
  }
}
