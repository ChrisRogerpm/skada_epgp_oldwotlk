import { ListaNegraEntry } from "../entities/ListaNegra";

export interface IListaNegraRepository {
  getEntries(): Promise<ListaNegraEntry[]>;
}
