import { IUsersRepository } from "@/src/domain/repositories/IUsersRepository";
import { AdminUser, UserRole } from "@/src/domain/entities/AdminUser";

export class UpdateUserRoleUseCase {
  constructor(private readonly repository: IUsersRepository) {}

  async execute(id: string, role: UserRole): Promise<AdminUser> {
    if (role !== "admin" && role !== "user") {
      throw new Error("Rol inválido");
    }

    const target = await this.repository.getUserById(id);
    if (!target) {
      throw new Error("Usuario no encontrado");
    }

    if (role === "user" && target.role === "admin") {
      const adminCount = await this.repository.countAdmins();
      if (adminCount <= 1) {
        throw new Error("No puedes quitar el rol de admin al último administrador");
      }
    }

    return this.repository.updateUserRole(id, role);
  }
}
