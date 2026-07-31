import { NextResponse } from "next/server";
import { requireAdmin } from "@/src/infrastructure/auth/requireAdmin";
import { SupabaseUsersRepository } from "@/src/infrastructure/repositories/SupabaseUsersRepository";
import { ListUsersUseCase } from "@/src/application/useCases/ListUsersUseCase";
import { CreateAdminUserUseCase } from "@/src/application/useCases/CreateAdminUserUseCase";
import { UpdateUserRoleUseCase } from "@/src/application/useCases/UpdateUserRoleUseCase";

function statusForError(message: string): number {
  if (message === "Ya existe un usuario con este email") return 409;
  if (message === "Usuario no encontrado") return 404;
  if (
    message === "No puedes quitar el rol de admin al último administrador" ||
    message === "Email inválido" ||
    message === "La contraseña debe tener al menos 6 caracteres" ||
    message === "Rol inválido"
  ) {
    return 400;
  }
  return 500;
}

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";

    const repository = new SupabaseUsersRepository();
    const useCase = new ListUsersUseCase(repository);
    const result = await useCase.execute(page, limit, search);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error listing users:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { email, password, role } = body;

    const repository = new SupabaseUsersRepository();
    const useCase = new CreateAdminUserUseCase(repository);
    const result = await useCase.execute({ email, password, role });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error creating user:", error);
    const message = error?.message || "Error interno del servidor";
    return NextResponse.json({ error: message }, { status: statusForError(message) });
  }
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { id, role } = body;

    const repository = new SupabaseUsersRepository();
    const useCase = new UpdateUserRoleUseCase(repository);
    const result = await useCase.execute(id, role);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error updating user role:", error);
    const message = error?.message || "Error interno del servidor";
    return NextResponse.json({ error: message }, { status: statusForError(message) });
  }
}
