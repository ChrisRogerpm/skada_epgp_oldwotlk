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

export interface LootItemOption {
  id: number;
  id_item: number;
  name: string;
  raid: string;
  icon: string;
}

export interface LootWinForm {
  id: number | null;
  personaje: string;
  class: string;
  raid: string;
  // Al registrar (id === null) admite varios ítems a la vez; al editar un
  // registro existente queda forzado a un único elemento.
  id_items: number[];
  // Solo se rellena al editar un registro que ya tenía sesión (del sync);
  // el formulario ya no ofrece elegirla, pero la preserva si existía.
  id_raids: string;
  note: string;
}
