export const revalidate = 60; // optionally revalidate

import { GetDownloadsUseCase } from "@/src/application/useCases/GetDownloadsUseCase";
import { SupabaseDownloadsRepository } from "@/src/infrastructure/repositories/SupabaseDownloadsRepository";
import { Download, ExternalLink, HardDrive } from "lucide-react";

export default async function DescargasPage() {
  const repository = new SupabaseDownloadsRepository();
  const useCase = new GetDownloadsUseCase(repository);
  const downloads = await useCase.execute();

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="relative p-8 md:p-12 rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-emerald-500/10 border border-white/10">
          <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl z-0" />
          <div className="relative z-10 flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Download className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 tracking-tight font-display">
              Descargas y Recursos
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl font-medium">
              Aquí encontrarás los clientes, add-ons, parches y herramientas necesarias recomendadas para jugar. Mantén tus archivos actualizados.
            </p>
          </div>
        </div>

        {/* Content Section */}
        {downloads.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-white/5 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
            <HardDrive className="w-16 h-16 text-slate-300 dark:text-slate-700 mb-4" />
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">No hay descargas disponibles</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-center max-w-md">
              Actualmente no hay archivos configurados para descargar. Vuelve más tarde o contacta con la administración.
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {Object.entries(
              downloads.reduce((acc, item) => {
                const type = item.type || "Otros";
                if (!acc[type]) acc[type] = [];
                acc[type].push(item);
                return acc;
              }, {} as Record<string, typeof downloads>)
            ).map(([type, groupDownloads]) => (
              <div key={type} className="space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-200 dark:border-white/10 pb-3">
                  <div className="w-2 h-8 bg-indigo-500 rounded-full" />
                  <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">
                    {type}
                  </h2>
                  <span className="ml-2 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-400 text-sm font-bold">
                    {groupDownloads.length}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {groupDownloads.map((item) => (
                    <a
                      key={item.id}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative flex flex-col justify-between bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-2xl p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1 hover:border-indigo-500/30 dark:hover:bg-white/[0.04]"
                    >
                      <div className="absolute top-4 right-4 text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 transition-colors">
                        <ExternalLink className="w-5 h-5" />
                      </div>
                      
                      <div className="flex items-start gap-4 mb-4">
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                          <Download className="w-6 h-6" />
                        </div>
                        <div className="space-y-1 pt-1">
                          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-tight">
                            {item.nameFile}
                          </h3>
                        </div>
                      </div>
                      
                      <div className="mt-auto pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                        <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                          Disponible
                        </p>
                        <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          Descargar →
                        </span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
