import { IUsersRepository } from "@/src/domain/repositories/IUsersRepository";
import { PaginatedUsersResult } from "@/src/domain/entities/AdminUser";

export class ListUsersUseCase {
  constructor(private readonly repository: IUsersRepository) {}

  async execute(page: number, limit: number, search: string): Promise<PaginatedUsersResult> {
    return this.repository.listUsers(page, limit, search);
  }
}
