"use client";

import { RaidLog } from "../types/RaidLog";
import LogRow from "./LogRow";
import { Ghost, Search, Download } from "lucide-react";

interface LogsTableProps {
  logs: RaidLog[];
  loading: boolean;
  error: string | null;
  metric?: "Damage" | "Healing";
}

const SkeletonRow = ({ metric }: { metric: "Damage" | "Healing" }) => (
  <tr className="border-b border-slate-200 dark:border-slate-800/50 animate-pulse">
    <td className="py-2 px-4">
      <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800/50"></div>
    </td>
    <td className="py-2 px-4">
      <div className="flex items-center space-x-2">
        <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800/50"></div>
        <div className="space-y-2">
          <div className="h-3 w-24 bg-slate-100 dark:bg-slate-800/50 rounded"></div>
          <div className="h-2 w-16 bg-slate-100 dark:bg-slate-800/50 rounded"></div>
        </div>
      </div>
    </td>
    <td className="py-2 px-4">
      <div className="h-4 w-16 bg-slate-100 dark:bg-slate-800/50 rounded-md"></div>
    </td>
    <td className="py-2 px-4">
      <div className="h-4 w-20 bg-slate-100 dark:bg-slate-800/50 rounded"></div>
    </td>
    {metric === "Damage" && (
      <td className="py-2 px-4">
        <div className="h-4 w-16 bg-slate-100 dark:bg-slate-800/50 rounded"></div>
      </td>
    )}
  </tr>
);

export default function LogsTable({ logs, loading, error, metric = "Damage" }: LogsTableProps) {
  if (error) {
    return (
      <div className="w-full flex-1 flex flex-col items-center justify-center p-12 bg-red-950/20 border border-red-900/50 rounded-xl text-center backdrop-blur-sm">
        <div className="text-red-500 bg-red-950/50 p-4 rounded-full mb-4">
          <Ghost size={32} />
        </div>
        <h3 className="text-xl font-bold text-red-400 mb-2">
          Error al cargar los datos
        </h3>
        <p className="text-red-300/70 max-w-md">{error}</p>
      </div>
    );
  }

  const handleExportCSV = () => {
    if (logs.length === 0) return;
    
    const headers = ["Rango", "Personaje", "Clase", "Talento", "Cantidad", metric === "Damage" ? "DPS" : ""];
    const csvContent = [
      headers.filter(Boolean).join(","),
      ...logs.map(log => {
        const row = [
          log.Rank,
          `"${log.Character}"`,
          log.Class,
          `"${log.Talent || ''}"`,
          `"${log.Amount}"`,
          metric === "Damage" ? `"${log.DPS || ''}"` : ""
        ];
        return row.filter(val => val !== "").join(",");
      })
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `logs_${metric.toLowerCase()}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    if (logs.length === 0) return;
    const dataStr = JSON.stringify(logs, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `logs_${metric.toLowerCase()}_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden backdrop-blur-sm bg-opacity-70 flex flex-col">
      {/* Table Header with Actions */}
      <div className="flex justify-end gap-2 p-3 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={handleExportJSON}
          disabled={logs.length === 0 || loading}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download size={14} /> JSON
        </button>
        <button
          onClick={handleExportCSV}
          disabled={logs.length === 0 || loading}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 bg-emerald-900/50 hover:bg-emerald-800/50 text-emerald-400 border border-emerald-800/50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download size={14} /> CSV
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left whitespace-nowrap border-collapse">
          <thead className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider font-semibold">
            <tr>
              <th className="py-3 px-4 w-16">Rango</th>
              <th className="py-3 px-4">Personaje</th>
              <th className="py-3 px-4">Clase</th>
              <th className="py-3 px-4">Cantidad</th>
              {metric === "Damage" && <th className="py-3 px-4">DPS</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50 relative">
            {loading && (
              <>
                {Array.from({ length: 10 }).map((_, i) => (
                  <SkeletonRow key={`skeleton-${i}`} metric={metric} />
                ))}
              </>
            )}

            {!loading && logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-20 text-center text-slate-600 dark:text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Search size={32} className="text-slate-500 mb-1" />
                    <p className="text-xl font-semibold text-slate-700 dark:text-slate-300">No se encontraron personajes</p>
                    <p className="text-sm">Intenta ajustar los filtros para ver otros resultados.</p>
                  </div>
                </td>
              </tr>
            ) : (
              !loading &&
              logs.map((log, i) => (
                <LogRow
                  key={`${log.Character}-${log.Rank}-${log.date}-${i}`}
                  log={log}
                  index={i}
                  metric={metric}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

