import { FullGearedCharacter, PaginatedFullGearedResult } from "../entities/FullGeared";

export interface IFullGearedRepository {
  getCharacters(page: number, limit: number, search: string): Promise<PaginatedFullGearedResult>;
  createCharacter(character: Omit<FullGearedCharacter, "id" | "updated_at">): Promise<FullGearedCharacter>;
  updateCharacter(character: FullGearedCharacter): Promise<FullGearedCharacter>;
  deleteCharacter(id: string | number): Promise<void>;
}
