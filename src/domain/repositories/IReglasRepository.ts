import { ReglaLoteoRow, ReglaPuntoRow } from "../entities/Reglas";

export interface IReglasRepository {
  getLoteo(): Promise<ReglaLoteoRow[]>;
  getPuntos(): Promise<ReglaPuntoRow[]>;
}
