import { IUsersRepository } from "@/src/domain/repositories/IUsersRepository";
import { AdminUser, UserRole } from "@/src/domain/entities/AdminUser";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class CreateAdminUserUseCase {
  constructor(private readonly repository: IUsersRepository) {}

  async execute(input: { email: string; password: string; role: UserRole }): Promise<AdminUser> {
    const { email, password, role } = input;

    if (!email || !EMAIL_REGEX.test(email)) {
      throw new Error("Email inválido");
    }
    if (!password || password.length < 6) {
      throw new Error("La contraseña debe tener al menos 6 caracteres");
    }
    if (role !== "admin" && role !== "user") {
      throw new Error("Rol inválido");
    }

    return this.repository.createUser(email, password, role);
  }
}
