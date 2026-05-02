import { RosterMember, LogDetail } from '../entities/Epgp';

export interface IEpgpRepository {
  /**
   * Obtiene la lista completa de miembros del Roster EPGP.
   */
  getEpgpRoster(): Promise<RosterMember[]>;

  /**
   * Obtiene el historial de logs de EPGP filtrado por fecha.
   * @param date Fecha en formato YYYY-MM-DD o DD/MM/YYYY según el caso de uso
   */
  getEpgpLogs(date: string): Promise<LogDetail[]>;

  /**
   * Busca personajes por nombre (main o alter).
   * @param query Término de búsqueda
   */
  searchCharacters(query: string): Promise<any[]>; // Opcionalmente definir un tipo más estricto después

  /**
   * Obtiene el historial de logs para una lista de personajes.
   * @param names Lista de nombres de personajes (mains y/o alters)
   */
  getEpgpHistoryByNames(names: string[]): Promise<LogDetail[]>;
}
