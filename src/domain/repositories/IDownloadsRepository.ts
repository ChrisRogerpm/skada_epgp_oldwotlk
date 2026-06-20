import { DownloadRow } from "../entities/Download";

export interface IDownloadsRepository {
  getDownloads(): Promise<DownloadRow[]>;
}
