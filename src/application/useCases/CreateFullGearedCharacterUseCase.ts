import { IFullGearedRepository } from "@/src/domain/repositories/IFullGearedRepository";
import { FullGearedCharacter } from "@/src/domain/entities/FullGeared";

export class CreateFullGearedCharacterUseCase {
  constructor(private readonly repository: IFullGearedRepository) {}

  async execute(character: Omit<FullGearedCharacter, "id" | "updated_at">): Promise<FullGearedCharacter> {
    return this.repository.createCharacter(character);
  }
}
