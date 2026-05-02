import { IEpgpRepository } from '../../domain/repositories/IEpgpRepository';
import { SearchEpgpCharactersRequest } from '../dtos/EpgpDTOs';

export class SearchEpgpCharactersUseCase {
  constructor(private readonly epgpRepository: IEpgpRepository) {}

  async execute(request: SearchEpgpCharactersRequest): Promise<any[]> {
    if (!request.query) {
      return [];
    }

    return await this.epgpRepository.searchCharacters(request.query);
  }
}
