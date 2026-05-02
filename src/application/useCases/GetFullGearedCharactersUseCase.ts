import { IFullGearedRepository } from "@/src/domain/repositories/IFullGearedRepository";
import { PaginatedFullGearedResult } from "@/src/domain/entities/FullGeared";

export class GetFullGearedCharactersUseCase {
  constructor(private readonly repository: IFullGearedRepository) {}

  async execute(page: number, limit: number, search: string): Promise<PaginatedFullGearedResult> {
    return this.repository.getCharacters(page, limit, search);
  }
}
