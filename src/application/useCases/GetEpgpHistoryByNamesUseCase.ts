import { IEpgpRepository } from '../../domain/repositories/IEpgpRepository';
import { GetEpgpHistoryRequest } from '../dtos/EpgpDTOs';
import { LogDetail } from '../../domain/entities/Epgp';

export class GetEpgpHistoryByNamesUseCase {
  constructor(private readonly epgpRepository: IEpgpRepository) {}

  async execute(request: GetEpgpHistoryRequest): Promise<LogDetail[]> {
    if (!request.names) {
      throw new Error("Character names are required");
    }

    const nameList = request.names.split(",");
    return await this.epgpRepository.getEpgpHistoryByNames(nameList);
  }
}
