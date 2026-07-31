export interface AdminStatus {
  type: "success" | "error";
  message: string;
}

export interface EpgpSearchResult {
  nombre_alter: string;
  clase: string;
  main: string;
  url_icono?: string;
}

export interface FullGearedForm {
  id: number | null;
  name: string;
  class: string;
  icc: boolean;
  rs: boolean;
  gs: number;
  main: string;
}

export interface UserRegistrationForm {
  email: string;
  password: string;
  role: "admin" | "user";
}

export interface AdminUserListItem {
  id: string;
  email: string;
  role: "admin" | "user";
  created_at: string;
}
