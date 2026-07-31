export type UserRole = "admin" | "user";

export interface AdminUser {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface PaginatedUsersResult {
  data: AdminUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
