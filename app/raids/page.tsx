"use client";

import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Users, Loader2, AlertCircle, Sparkles, LayoutGrid, StretchHorizontal } from "lucide-react";
import { RaidsByDateResponse } from "../types/RaidComposition";
import RaidCard from "../components/RaidCard";

export default function RaidsPage() {
  const now = new Date();
  const todayDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const [selectedDate, setSelectedDate] = useState(todayDate);
  const [viewMode, setViewMode] = useState<"vertical" | "horizontal">("vertical");
  const dateInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, error } = useQuery<RaidsByDateResponse>({
    queryKey: ["raids", selectedDate],
    queryFn: async () => {
      const response = await fetch(`/api/raids?date=${selectedDate}`);
      if (!response.ok) throw new Error("Error al obtener las raids");
      return response.json();
    },
    enabled: !!selectedDate,
  });

  const openDatePicker = () => {
    dateInputRef.current?.showPicker?.();
    dateInputRef.current?.focus();
  };

  return (
    <main className="min-h-screen bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-200 p-4 md:p-8 lg:p-12 font-sans selection:bg-emerald-500/30 overflow-x-hidden">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-8 border-b border-slate-800/60 relative">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />
          
          <div className="relative">
            <div className="flex items-center gap-4 mb-3">
              <div className="p-3.5 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.1)] relative group">
                <div className="absolute inset-0 bg-emerald-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <Users className="text-emerald-400 relative z-10" size={32} />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-200 to-cyan-400 drop-shadow-2xl animate-in fade-in slide-in-from-left-4 duration-1000">
                  Bitácora de Raids
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <Sparkles size={14} className="text-emerald-500 animate-pulse" />
                  <p className="text-slate-400 text-sm md:text-base font-bold tracking-wide uppercase opacity-80">
                    Composición y Tesoros de Heroica Calidad
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-6 relative z-20">
            {/* View Mode Toggle */}
            <div className="flex flex-col space-y-3">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
                 Visualización
               </label>
               <div className="flex bg-slate-900/60 border border-slate-800 rounded-xl p-1 backdrop-blur-md shadow-lg">
                 <button
                   onClick={() => setViewMode("vertical")}
                   className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black tracking-widest uppercase transition-all ${
                     viewMode === "vertical" 
                       ? "bg-emerald-500/20 text-emerald-400 shadow-inner" 
                       : "text-slate-500 hover:text-slate-300"
                   }`}
                 >
                   <LayoutGrid size={14} /> Grid
                 </button>
                 <button
                   onClick={() => setViewMode("horizontal")}
                   className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black tracking-widest uppercase transition-all ${
                     viewMode === "horizontal" 
                       ? "bg-emerald-500/20 text-emerald-400 shadow-inner" 
                       : "text-slate-500 hover:text-slate-300"
                   }`}
                 >
                   <StretchHorizontal size={14} /> Filas
                 </button>
               </div>
            </div>

            {/* Date Picker */}
            <div className="flex flex-col space-y-3 min-w-[240px]">
              <label
                className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2 cursor-pointer select-none hover:text-emerald-400 transition-colors"
                onClick={openDatePicker}
              >
                <Calendar size={12} className="text-emerald-500" /> Filtrar Expedición
              </label>
              <div
                className="bg-slate-900/60 border border-slate-800 rounded-xl px-5 py-3.5 text-sm cursor-pointer flex items-center gap-4 hover:border-emerald-500/50 hover:bg-slate-900/80 transition-all backdrop-blur-md shadow-lg group"
                onClick={openDatePicker}
              >
                <Calendar size={18} className="text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
                <span className="text-slate-100 font-black tracking-widest uppercase">
                  {selectedDate || "Selecciona una fecha..."}
                </span>
                <input
                  ref={dateInputRef}
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="sr-only"
                />
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <section className="relative">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-32 space-y-6">
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full animate-pulse" />
                <Loader2 className="text-emerald-500 animate-spin relative" size={56} />
              </div>
              <p className="text-slate-400 font-black tracking-[0.2em] uppercase text-xs animate-pulse">Sincronizando Archivos del Grito de Guerra...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-500/5 border border-red-500/20 rounded-3xl p-12 flex flex-col items-center text-center space-y-4 backdrop-blur-sm">
              <div className="p-4 bg-red-500/10 rounded-full">
                <AlertCircle className="text-red-400" size={40} />
              </div>
              <div>
                <h2 className="text-xl font-black text-red-400 uppercase tracking-widest">Falla Crítica en la Matriz</h2>
                <p className="text-slate-500 mt-2 font-medium">No pudimos contactar con el Archivero Real. Inténtalo en un momento.</p>
              </div>
            </div>
          )}

          {!isLoading && !error && data && data.raids.length === 0 && (
            <div className="bg-slate-900/20 border border-slate-800/40 rounded-3xl p-24 flex flex-col items-center text-center space-y-6 backdrop-blur-sm">
              <div className="p-6 bg-slate-800/40 rounded-full text-slate-600 border border-slate-700/50 shadow-inner">
                <Calendar size={48} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-200 tracking-tight">Silencio en la Ciudadela</h2>
                <p className="text-slate-500 mt-2 font-medium max-w-sm mx-auto">Nuestros espías no reportan actividad heroica para este ciclo temporal.</p>
              </div>
            </div>
          )}

          {!isLoading && !error && data && data.raids.length > 0 && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
              {data.raids.map((raid) => (
                <RaidCard key={raid.id} raid={raid} viewMode={viewMode} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}


