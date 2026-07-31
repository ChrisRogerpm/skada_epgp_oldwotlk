import { getSupabaseAdmin } from "@/src/infrastructure/config/supabaseAdmin";
import { IUsersRepository } from "@/src/domain/repositories/IUsersRepository";
import { AdminUser, PaginatedUsersResult, UserRole } from "@/src/domain/entities/AdminUser";

export class SupabaseUsersRepository implements IUsersRepository {
  private get client() {
    return getSupabaseAdmin();
  }

  async listUsers(page: number, limit: number, search: string): Promise<PaginatedUsersResult> {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = this.client.from("profiles").select("id, email, role, created_at", { count: "exact" });

    if (search) {
      query = query.ilike("email", `%${search}%`);
    }

    const { data, error, count } = await query.order("created_at", { ascending: false }).range(from, to);

    if (error) throw error;

    return {
      data: (data || []) as AdminUser[],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    };
  }

  async getUserById(id: string): Promise<AdminUser | null> {
    const { data, error } = await this.client
      .from("profiles")
      .select("id, email, role, created_at")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    return (data as AdminUser) || null;
  }

  async createUser(email: string, password: string, role: UserRole): Promise<AdminUser> {
    const { data: created, error: createError } = await this.client.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createError || !created?.user) {
      const message = createError?.message || "";
      if (message.toLowerCase().includes("already") || message.toLowerCase().includes("registrad")) {
        throw new Error("Ya existe un usuario con este email");
      }
      throw new Error(message || "No se pudo crear el usuario");
    }

    const userId = created.user.id;

    if (role === "admin") {
      const { error: updateError } = await this.client.from("profiles").update({ role }).eq("id", userId);
      if (updateError) throw updateError;
    }

    const { data: profile, error: profileError } = await this.client
      .from("profiles")
      .select("id, email, role, created_at")
      .eq("id", userId)
      .single();

    if (profileError || !profile) throw new Error("Usuario creado pero no se pudo leer su perfil");

    return profile as AdminUser;
  }

  async updateUserRole(id: string, role: UserRole): Promise<AdminUser> {
    const { data, error } = await this.client
      .from("profiles")
      .update({ role })
      .eq("id", id)
      .select("id, email, role, created_at");

    if (error) throw error;
    if (!data || data.length === 0) throw new Error("Usuario no encontrado");

    return data[0] as AdminUser;
  }

  async countAdmins(): Promise<number> {
    const { count, error } = await this.client
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");

    if (error) throw error;
    return count || 0;
  }
}
