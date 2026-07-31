import { AdminUser, PaginatedUsersResult, UserRole } from "../entities/AdminUser";

export interface IUsersRepository {
  listUsers(page: number, limit: number, search: string): Promise<PaginatedUsersResult>;
  getUserById(id: string): Promise<AdminUser | null>;
  createUser(email: string, password: string, role: UserRole): Promise<AdminUser>;
  updateUserRole(id: string, role: UserRole): Promise<AdminUser>;
  countAdmins(): Promise<number>;
}
