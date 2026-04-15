"use client";

import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Users, Loader2, AlertCircle } from "lucide-react";
import { RaidsByDateResponse } from "../types/RaidComposition";
import RaidCard from "../components/RaidCard";

export default function RaidsPage() {
  const now = new Date();
  const todayDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const [selectedDate, setSelectedDate] = useState(todayDate);
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
    <main className="min-h-screen bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-200 p-4 md:p-8 lg:p-12 font-sans selection:bg-emerald-500/30">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-800/60">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                <Users className="text-emerald-400" size={28} />
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 drop-shadow-sm">
                Composición de Raids
              </h1>
            </div>
            <p className="text-slate-400 text-sm md:text-base font-medium">
              Visualiza la formación de los grupos para cada encuentro.
            </p>
          </div>

          {/* Date Picker */}
          <div className="flex flex-col space-y-2 min-w-[200px]">
            <label
              className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2 cursor-pointer select-none"
              onClick={openDatePicker}
            >
              <Calendar size={14} className="text-emerald-400" /> Filtrar por Fecha
            </label>
            <div
              className="bg-slate-900/50 border border-slate-800 rounded-lg px-4 py-2.5 text-sm cursor-pointer flex items-center gap-3 hover:border-emerald-500/50 transition-all backdrop-blur-sm"
              onClick={openDatePicker}
            >
              <Calendar size={16} className="text-emerald-400 shrink-0" />
              <span className="text-slate-200 font-medium">
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
        </header>

        {/* Content */}
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
              <Loader2 className="text-emerald-500 animate-spin" size={40} />
              <p className="text-slate-400 font-medium animate-pulse">Cargando composiciones...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-8 flex flex-col items-center text-center space-y-3">
              <AlertCircle className="text-red-400" size={32} />
              <h2 className="text-lg font-bold text-red-400">Hubo un error</h2>
              <p className="text-slate-400 max-w-md">No pudimos cargar la información de las raids. Por favor, intenta de nuevo más tarde.</p>
            </div>
          )}

          {!isLoading && !error && data && data.raids.length === 0 && (
            <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-16 flex flex-col items-center text-center space-y-4">
              <div className="p-4 bg-slate-800/50 rounded-full text-slate-500">
                <Calendar size={40} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-200">No se encontraron raids</h2>
                <p className="text-slate-400 mt-1">No hay registros de composición para el día seleccionado.</p>
              </div>
            </div>
          )}

          {!isLoading && !error && data && data.raids.length > 0 && (
            <div className="space-y-6">
              {data.raids.map((raid) => (
                <RaidCard key={raid.id} raid={raid} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
