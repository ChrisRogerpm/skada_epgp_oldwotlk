export interface ReglaLoteoRow {
  raid?: string;
  categoria_item?: string;
  nombre_item?: string;
  requisitos?: any;
  valor_minimo?: any;
  icon_url?: string;
  [key: string]: any;
}

export interface ReglaPuntoRow {
  tipo?: string;
  categoria?: string;
  descripcion?: string;
  valor?: any;
  icon_url?: string;
  items?: any[];
  [key: string]: any;
}

// ---------------------------------------------------------------------------
// Modelo por fila (registro/edición desde el admin). El raid se guarda en la
// columna `raid` como el mismo texto largo que ya tenían las 44 filas
// existentes ("Icecrown Citadel (ICC)"); el admin solo trabaja con el código
// corto, igual que el resto del sitio (RS/TOGC/ICC).
// ---------------------------------------------------------------------------

export type RaidCode = "ICC" | "RS" | "TOGC";

export const RAID_CODE_TO_LABEL: Record<RaidCode, string> = {
  ICC: "Icecrown Citadel (ICC)",
  RS: "Ruby Sanctum (RS)",
  TOGC: "Trial of the Crusader (ToGC)",
};

export const RAID_LABEL_TO_CODE: Record<string, RaidCode> = {
  "Icecrown Citadel (ICC)": "ICC",
  "Ruby Sanctum (RS)": "RS",
  "Trial of the Crusader (ToGC)": "TOGC",
};

export interface ReglaLoteoInput {
  raidCode: RaidCode;
  categoria: string;
  nombreItem: string;
  requisitos: string[];
  valorMinimo: number;
  iconUrl: string;
  idItem: number | null;
}

export interface ReglaLoteoRecord extends ReglaLoteoInput {
  id: string;
  updatedAt?: string;
}

export type PuntoTipo = "beneficio" | "perjuicio";

export interface ReglaPuntoInput {
  tipo: PuntoTipo;
  categoria: string;
  descripcion: string;
  valor: number;
  iconUrl: string;
  /** Orden manual (subir/bajar en el admin). Si se omite al crear, el repositorio la agrega al final. */
  sortOrder?: number;
}

export interface ReglaPuntoRecord extends ReglaPuntoInput {
  id: string;
  updatedAt?: string;
}
