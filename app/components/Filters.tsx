"use client";

import { useRef } from "react";
import { FilterState, RAID_INSTANCES, BOSSES, BOSSES_TRANSLATIONS } from "../types/RaidLog";
import { Calendar, Map, Skull, Activity, Search } from "lucide-react";

interface FiltersProps {
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
}

export default function Filters({ filters, setFilters }: FiltersProps) {
  const dateInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const openDatePicker = () => {
    dateInputRef.current?.showPicker?.();
    dateInputRef.current?.focus();
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 md:p-6 mb-8 shadow-2xl backdrop-blur-sm bg-opacity-70">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Date Filter */}
        <div className="flex flex-col space-y-2">
          <label
            className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2 cursor-pointer select-none"
            onClick={openDatePicker}
          >
            <Calendar size={14} className="text-emerald-400" /> Fecha
          </label>
          <div
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2.5 text-sm cursor-pointer flex items-center gap-2 hover:border-emerald-500/50 transition-all"
            onClick={openDatePicker}
          >
            <Calendar size={14} className="text-emerald-400 shrink-0" />
            <span className={filters.date ? "text-slate-800 dark:text-slate-200" : "text-slate-500"}>
              {filters.date || "Selecciona una fecha..."}
            </span>
            <input
              ref={dateInputRef}
              type="date"
              name="date"
              value={filters.date}
              onChange={handleChange}
              className="sr-only"
            />
          </div>
        </div>

        {/* Raid Instance */}
        <div className="flex flex-col space-y-2">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Map size={14} className="text-blue-400" /> Instancia de Raid
          </label>
          <select
            name="raidInstance"
            value={filters.raidInstance}
            onChange={handleChange}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none cursor-pointer"
          >
            {RAID_INSTANCES.map((instance) => (
              <option key={instance} value={instance}>
                {instance}
              </option>
            ))}
          </select>
        </div>

        {/* Boss */}
        <div className="flex flex-col space-y-2">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Skull size={14} className="text-red-400" /> Jefe de Sala
          </label>
          <select
            name="boss"
            value={filters.boss}
            onChange={handleChange}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all appearance-none cursor-pointer"
          >
            {BOSSES.map((boss) => (
              <option key={boss} value={boss}>
                {BOSSES_TRANSLATIONS[boss] || boss}
              </option>
            ))}
          </select>
        </div>

        {/* Metric */}
        <div className="flex flex-col space-y-2">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Activity size={14} className="text-purple-400" /> Métrica
          </label>
          <select
            name="metric"
            value={filters.metric}
            onChange={handleChange}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all appearance-none cursor-pointer"
          >
            <option value="Damage">Daño (Damage)</option>
            <option value="Healing">Sanación (Healing)</option>
          </select>
        </div>

        {/* Search Filter */}
        <div className="flex flex-col space-y-2">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Search size={14} className="text-amber-400" /> Buscar Personaje
          </label>
          <div className="relative w-full">
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleChange}
              placeholder="Ej: Thrall..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg pl-3 pr-8 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all placeholder-slate-400 dark:placeholder-slate-600 outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
