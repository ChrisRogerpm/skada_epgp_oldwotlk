import { supabase } from "@/src/infrastructure/config/supabase";
import { IDownloadsRepository } from "@/src/domain/repositories/IDownloadsRepository";
import { DownloadRow } from "@/src/domain/entities/Download";

export class SupabaseDownloadsRepository implements IDownloadsRepository {
  async getDownloads(): Promise<DownloadRow[]> {
    const { data, error } = await supabase
      .from("downloads")
      .select("*")
      .eq("state", true)
      .order("id", { ascending: true });

    if (error) {
      console.error("Error fetching downloads:", error);
      throw error;
    }
    return data || [];
  }
}
