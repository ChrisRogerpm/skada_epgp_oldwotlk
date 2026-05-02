export interface Alter {
  name: string;
  class: string;
  icon: string;
}

export interface RosterMember {
  main: string;
  class: string;
  amount: number;
  icon: string;
  alters: Alter[];
}

export interface LogDetail {
  personaje: string;
  descripcion: string;
  valor: number;
  "EP/GP"?: string; // Opcional ya que en la BD epgp_logs a veces puede faltar o ser diferente
  fecha: string;
  hour: string;
}
