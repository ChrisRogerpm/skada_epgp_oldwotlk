"use client";

import { useRaidLogs } from "../hooks/useRaidLogs";
import Filters from "../components/Filters";
import LogsTable from "../components/LogsTable";
import { Sword } from "lucide-react";

export default function SkadaPage() {
  const { logs, loading, error, filters, setFilters } = useRaidLogs();

  return (
    <main className="min-h-screen bg-white dark:bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-100 via-white to-white dark:from-slate-900 dark:via-slate-950 dark:to-black text-slate-800 dark:text-slate-200 p-4 md:p-8 lg:p-12 font-sans selection:bg-emerald-500/30">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-800/60">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                <Sword className="text-emerald-400" size={28} />
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-cyan-600 dark:from-emerald-400 dark:to-cyan-400 drop-shadow-sm">
                Skada
              </h1>
            </div>
          </div>
        </header>

        {/* Content */}
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <Filters filters={filters} setFilters={setFilters} />
          <LogsTable logs={logs} loading={loading} error={error} metric={filters.metric} />
        </section>
      </div>
    </main>
  );
}
