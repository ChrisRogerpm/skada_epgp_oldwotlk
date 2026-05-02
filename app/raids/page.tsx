"use client";

import { useState, useRef, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Users, Loader2, AlertCircle, Sparkles, LayoutGrid, StretchHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import { RaidsByDateResponse } from "../types/RaidComposition";
import RaidCard from "../components/RaidCard";
import { format, addDays, subDays, getDay, parseISO, isSameDay } from "date-fns";
import { es } from "date-fns/locale";

export default function RaidsPage() {
  const now = new Date();
  const todayDateStr = format(now, "yyyy-MM-dd");

  const [selectedDate, setSelectedDate] = useState(todayDateStr);
  const [viewMode, setViewMode] = useState<"vertical" | "horizontal">("vertical");
  const dateInputRef = useRef<HTMLInputElement>(null);

  // Calculate the start of the raid week based on selectedDate (most recent Wednesday relative to that date)
  const raidWeekDays = useMemo(() => {
    const targetDate = parseISO(selectedDate);
    const dayOfWeek = getDay(targetDate); // 0 = Sun, 3 = Wed
    let daysToSubtract = (dayOfWeek - 3 + 7) % 7;
    const wednesday = subDays(targetDate, daysToSubtract);
    
    return Array.from({ length: 7 }).map((_, i) => {
      const date = addDays(wednesday, i);
      return {
        date,
        dateStr: format(date, "yyyy-MM-dd"),
        dayName: format(date, "EEEE", { locale: es }),
        shortName: format(date, "eee", { locale: es }),
        dayNum: format(date, "dd"),
      };
    });
  }, [selectedDate]);

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

  const selectedDateObj = parseISO(selectedDate);
  const formattedFullDate = format(selectedDateObj, "EEEE, d 'de' MMMM", { locale: es });

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-800 dark:text-slate-200 p-4 md:p-8 lg:p-12 font-sans selection:bg-emerald-500/30 overflow-x-hidden">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-8 border-b border-slate-200 dark:border-slate-800/60 relative">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />
          
          <div className="relative">
            <div className="flex items-center gap-4 mb-3">
              <div className="p-3.5 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.1)] relative group">
                <div className="absolute inset-0 bg-emerald-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <Users className="text-emerald-400 relative z-10" size={32} />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-200 to-cyan-400 drop-shadow-2xl animate-in fade-in slide-in-from-left-4 duration-1000 font-display">
                  Composición de Raids
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <Sparkles size={14} className="text-emerald-500 animate-pulse" />
                  <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base font-bold tracking-wide uppercase opacity-80 font-display">
                    Visualiza la formación de los grupos para cada encuentro.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-4 flex flex-col gap-2">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] font-display">Fecha Seleccionada</span>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 capitalize font-display">
                {formattedFullDate}
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-6 relative z-20">
            {/* View Mode Toggle */}
            <div className="flex flex-col space-y-3">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] font-display">
                 Visualización
               </label>
               <div className="flex bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-1 backdrop-blur-md shadow-lg">
                 <button
                   onClick={() => setViewMode("vertical")}
                   className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black tracking-widest uppercase transition-all font-display ${
                     viewMode === "vertical" 
                       ? "bg-emerald-500/20 text-emerald-400 shadow-inner" 
                       : "text-slate-500 hover:text-slate-700 dark:text-slate-300"
                   }`}
                 >
                   <LayoutGrid size={14} /> Grid
                 </button>
                 <button
                   onClick={() => setViewMode("horizontal")}
                   className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black tracking-widest uppercase transition-all font-display ${
                     viewMode === "horizontal" 
                       ? "bg-emerald-500/20 text-emerald-400 shadow-inner" 
                       : "text-slate-500 hover:text-slate-700 dark:text-slate-300"
                   }`}
                 >
                   <StretchHorizontal size={14} /> Filas
                 </button>
               </div>
            </div>

            {/* Manual Date Picker */}
            <div className="flex flex-col space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2 font-display">
                <Calendar size={12} className="text-emerald-500" /> Filtrar por fecha
              </label>
              <button
                onClick={openDatePicker}
                className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 hover:border-emerald-500/50 hover:bg-white dark:bg-slate-900/80 transition-all backdrop-blur-md shadow-lg group flex items-center gap-3"
              >
                <Calendar size={16} className="text-emerald-400" />
                <span className="sr-only">Seleccionar fecha</span>
                <input
                  ref={dateInputRef}
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent border-none text-slate-100 font-bold focus:ring-0 outline-none w-32 cursor-pointer"
                />
              </button>
            </div>
          </div>
        </header>

        {/* Weekly Quick Filter */}
        <div className="relative z-10">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-emerald-500/70 uppercase tracking-[0.4em] flex items-center gap-2">
                <Sparkles size={12} /> Semana de Raid Actual
              </span>
              <span className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">
                Miércoles → Martes
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {raidWeekDays.map((day) => {
                const isActive = selectedDate === day.dateStr;
                const isToday = todayDateStr === day.dateStr;
                
                return (
                  <button
                    key={day.dateStr}
                    onClick={() => setSelectedDate(day.dateStr)}
                    className={`relative flex flex-col items-center gap-1 p-3 rounded-2xl border transition-all duration-300 group ${
                      isActive 
                        ? "bg-emerald-500/10 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.15)] scale-[1.02]" 
                        : "bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:bg-slate-800/60"
                    }`}
                  >
                    {isToday && !isActive && (
                      <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    )}
                    <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${
                      isActive ? "text-emerald-400" : "text-slate-500 group-hover:text-slate-600 dark:text-slate-400"
                    }`}>
                      {day.dayName}
                    </span>
                    <span className={`text-xl font-black transition-all ${
                      isActive ? "text-slate-900 dark:text-white scale-110" : "text-slate-700 dark:text-slate-300"
                    }`}>
                      {day.dayNum}
                    </span>
                    <div className={`w-8 h-1 rounded-full mt-1 transition-all duration-500 ${
                      isActive ? "bg-emerald-500 opacity-100" : "bg-white/5 opacity-0 group-hover:opacity-10"
                    }`} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content */}
        <section className="relative">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-32 space-y-6">
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full animate-pulse" />
                <Loader2 className="text-emerald-500 animate-spin relative" size={56} />
              </div>
              <p className="text-slate-600 dark:text-slate-400 font-black tracking-[0.2em] uppercase text-xs animate-pulse">Consultando el Códice de Batalla...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-500/5 border border-red-500/20 rounded-3xl p-12 flex flex-col items-center text-center space-y-4 backdrop-blur-sm">
              <div className="p-4 bg-red-500/10 rounded-full">
                <AlertCircle className="text-red-400" size={40} />
              </div>
              <div>
                <h2 className="text-xl font-black text-red-400 uppercase tracking-widest">Falla de Red en la Ciudadela</h2>
                <p className="text-slate-500 mt-2 font-medium">Las señales mágicas están inestables. Inténtalo de nuevo.</p>
              </div>
            </div>
          )}

          {!isLoading && !error && data && data.raids.length === 0 && (
            <div className="bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800/40 rounded-3xl p-24 flex flex-col items-center text-center space-y-6 backdrop-blur-sm">
              <div className="p-6 bg-slate-100 dark:bg-slate-800/40 rounded-full text-slate-600 border border-slate-300 dark:border-slate-700/50 shadow-inner">
                <Calendar size={48} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-800 dark:text-slate-200 tracking-tight">Sin Reportes de Combate</h2>
                <p className="text-slate-500 mt-2 font-medium max-w-sm mx-auto">No hay registros para este día. Selecciona otra fecha en la semana de raid.</p>
              </div>
            </div>
          )}

          {!isLoading && !error && data && data.raids.length > 0 && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
              {(() => {
                let halionCount = 0;
                return data.raids.map((raid) => {
                  let currentHalionIndex = undefined;
                  if (raid.boss_name.toLowerCase().includes("halion")) {
                    halionCount++;
                    currentHalionIndex = halionCount;
                  }
                  return (
                    <RaidCard
                      key={raid.id}
                      raid={raid}
                      viewMode={viewMode}
                      halionIndex={currentHalionIndex}
                    />
                  );
                });
              })()}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}


