export interface FullGearedCharacter {
  id?: number;
  name: string;
  class: string;
  icc: number; // 1 = Full ICC, 0 = No
  rs: number;  // 1 = Full RS, 0 = No
  gs: number;
  main: string;
  created_at?: string;
  updated_at?: string;
}

export interface EPGPCharacterSearch {
  main: string;
  nombre_alter: string;
  clase: string;
  url_icono: string;
}
