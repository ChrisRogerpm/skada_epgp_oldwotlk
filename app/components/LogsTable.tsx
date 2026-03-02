"use client";

import { RaidLog } from "../types/RaidLog";
import LogRow from "./LogRow";
import { Ghost, Loader2 } from "lucide-react";

interface LogsTableProps {
  logs: RaidLog[];
  loading: boolean;
  error: string | null;
}

export default function LogsTable({ logs, loading, error }: LogsTableProps) {
  if (error) {
    return (
      <div className="w-full flex-1 flex flex-col items-center justify-center p-12 bg-red-950/20 border border-red-900/50 rounded-xl text-center backdrop-blur-sm">
        <div className="text-red-500 bg-red-950/50 p-4 rounded-full mb-4">
          <Ghost size={32} />
        </div>
        <h3 className="text-xl font-bold text-red-400 mb-2">
          Error loading data
        </h3>
        <p className="text-red-300/70 max-w-md">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden backdrop-blur-sm bg-opacity-70 flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-left whitespace-nowrap">
          <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider font-semibold">
            <tr>
              <th className="py-3 px-4 w-16">Rango</th>
              <th className="py-3 px-4">Personaje</th>
              <th className="py-3 px-4">Clase</th>
              <th className="py-3 px-4">Cantidad</th>
              <th className="py-3 px-4">DPS</th>
              <th className="py-3 px-4 text-right">Detalles de Encuentro</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50 relative">
            {loading && (
              <tr>
                <td colSpan={6} className="h-64">
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/50 backdrop-blur-[2px] z-10">
                    <Loader2
                      size={32}
                      className="text-emerald-500 animate-spin mb-4"
                    />
                    <p className="text-emerald-400 font-medium">
                      Loading battle records...
                    </p>
                  </div>
                </td>
              </tr>
            )}



            {!loading &&
              logs.map((log, i) => (
                <LogRow
                  key={`${log.Character}-${log.Rank}-${log.date}-${i}`}
                  log={log}
                  index={i}
                />
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
