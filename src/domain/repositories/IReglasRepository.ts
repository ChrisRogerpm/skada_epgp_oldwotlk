import {
  ReglaLoteoRow,
  ReglaPuntoRow,
  ReglaLoteoInput,
  ReglaLoteoRecord,
  ReglaPuntoInput,
  ReglaPuntoRecord,
} from "../entities/Reglas";

export interface IReglasRepository {
  getLoteo(): Promise<ReglaLoteoRow[]>;
  getPuntos(): Promise<ReglaPuntoRow[]>;

  createLoteo(input: ReglaLoteoInput): Promise<ReglaLoteoRecord>;
  updateLoteo(id: string, input: ReglaLoteoInput): Promise<ReglaLoteoRecord>;
  deleteLoteo(id: string): Promise<void>;

  createPunto(input: ReglaPuntoInput): Promise<ReglaPuntoRecord>;
  updatePunto(id: string, input: ReglaPuntoInput): Promise<ReglaPuntoRecord>;
  deletePunto(id: string): Promise<void>;
}
