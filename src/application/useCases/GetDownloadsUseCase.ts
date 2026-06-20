import { IDownloadsRepository } from "@/src/domain/repositories/IDownloadsRepository";
import { DownloadRow } from "@/src/domain/entities/Download";

export class GetDownloadsUseCase {
  constructor(private readonly repository: IDownloadsRepository) {}

  async execute(): Promise<DownloadRow[]> {
    return this.repository.getDownloads();
  }
}
