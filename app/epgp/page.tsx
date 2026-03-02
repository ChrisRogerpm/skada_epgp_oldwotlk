"use client";

import { BarChart2 } from "lucide-react";

export default function EPGPPage() {
  return (
    <main className="min-h-screen bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-200 p-4 md:p-8 lg:p-12 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
              <BarChart2 className="text-blue-400" size={28} />
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 drop-shadow-sm">
              EPGP
            </h1>
          </div>
        </header>

        {/* Placeholder */}
        <section className="flex flex-col items-center justify-center py-32 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="p-6 bg-blue-500/10 rounded-2xl border border-blue-500/20 mb-6">
            <BarChart2 size={48} className="text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-200 mb-3">
            EPGP — Próximamente
          </h2>
          <p className="text-slate-500 max-w-md text-sm">
            Este entorno mostrará los datos de EPGP de la guild.
          </p>
        </section>
      </div>
    </main>
  );
}
