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
