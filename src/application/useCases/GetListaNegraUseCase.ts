import { IListaNegraRepository } from "@/src/domain/repositories/IListaNegraRepository";
import { ListaNegraEntry } from "@/src/domain/entities/ListaNegra";

export class GetListaNegraUseCase {
  constructor(private readonly listaNegraRepository: IListaNegraRepository) {}

  async execute(): Promise<ListaNegraEntry[]> {
    return this.listaNegraRepository.getEntries();
  }
}
