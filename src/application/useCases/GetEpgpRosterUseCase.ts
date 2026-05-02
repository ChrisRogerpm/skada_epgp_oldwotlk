import { IEpgpRepository } from '../../domain/repositories/IEpgpRepository';
import { GetEpgpRosterResponse } from '../dtos/EpgpDTOs';

export class GetEpgpRosterUseCase {
  constructor(private readonly epgpRepository: IEpgpRepository) {}

  async execute(): Promise<GetEpgpRosterResponse> {
    const roster = await this.epgpRepository.getEpgpRoster();

    if (!roster || roster.length === 0) {
      return { date: "", hour: "", roster: [] };
    }

    const now = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      timeZone: "America/Lima", 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    };
    const timeOptions: Intl.DateTimeFormatOptions = { 
      timeZone: "America/Lima", 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit', 
      hour12: false 
    };
    
    // Convertir de DD/MM/YYYY a YYYY-MM-DD
    const limaDate = now.toLocaleDateString('en-GB', options).split('/').reverse().join('-');
    const limaTime = now.toLocaleTimeString('en-GB', timeOptions);

    return {
      date: limaDate,
      hour: limaTime,
      roster
    };
  }
}
