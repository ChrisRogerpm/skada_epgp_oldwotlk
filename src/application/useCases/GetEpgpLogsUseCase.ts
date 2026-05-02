import { IEpgpRepository } from '../../domain/repositories/IEpgpRepository';
import { GetEpgpLogsRequest } from '../dtos/EpgpDTOs';
import { LogDetail } from '../../domain/entities/Epgp';

export class GetEpgpLogsUseCase {
  constructor(private readonly epgpRepository: IEpgpRepository) {}

  async execute(request: GetEpgpLogsRequest): Promise<LogDetail[]> {
    let fechaFilter = request.fecha;

    if (!fechaFilter) {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = { 
        timeZone: "America/Lima", 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      };
      fechaFilter = now.toLocaleDateString('es-PE', options);
    }

    if (fechaFilter === "all") {
      return [];
    }

    return await this.epgpRepository.getEpgpLogs(fechaFilter);
  }
}
