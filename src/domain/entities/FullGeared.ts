export interface FullGearedCharacter {
  id?: number;
  name: string;
  class: string;
  icc: boolean;
  rs: boolean;
  gs: number;
  main: string;
  updated_at?: string;
  [key: string]: any;
}

export interface PaginatedFullGearedResult {
  data: FullGearedCharacter[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
