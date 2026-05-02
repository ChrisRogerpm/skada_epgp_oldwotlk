"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  UserX,
  Search,
  Loader2,
  AlertTriangle,
  Calendar,
  ShieldAlert,
  Ghost,
  Info,
  Clock,
  ChevronLeft,
  ChevronRight,
  Filter,
  Users,
} from "lucide-react";
import { BlacklistEntry } from "../types/BlacklistEntry";
import clsx from "clsx";

export default function ListaNegraPage() {
  const [data, setData] = useState<BlacklistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 20; // Reducido un poco para mejor visualización en móvil

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/lista_negra");
        if (!res.ok) throw new Error("Error al obtener los datos");
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filtrado
  const filteredData = useMemo(() => {
    setCurrentPage(1); // Resetear a página 1 al buscar
    if (!searchTerm) return data;
    const lowSearch = searchTerm.toLowerCase();
    return data.filter((entry) =>
      entry.nombre.toLowerCase().includes(lowSearch),
    );
  }, [data, searchTerm]);

  // Lógica de Paginación
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredData.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredData, currentPage]);

  // Formatear fecha a America/Lima
  const formatLimaDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat("es-PE", {
        timeZone: "America/Lima",
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(date);
    } catch (e) {
      return dateString;
    }
  };

  const formatLimaTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat("es-PE", {
        timeZone: "America/Lima",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }).format(date);
    } catch (e) {
      return "";
    }
  };

  return (
    <main className="min-h-screen bg-white dark:bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-100 via-white to-white dark:from-slate-900 dark:via-slate-950 dark:to-black text-slate-800 dark:text-slate-200 p-4 md:p-8 lg:p-12 font-sans selection:bg-red-500/40 relative overflow-hidden">
      {/* Background decoration elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-600/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-orange-600/10 blur-[100px] rounded-full" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-800/50">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-wider animate-pulse">
              <ShieldAlert size={12} />
              Registro de Seguridad
            </div>
            <div className="flex flex-col gap-1">
              <h1 className="text-3xl md:text-5xl font-black tracking-tightest font-display">
                LISTA{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-500 to-red-600 drop-shadow-lg">
                  NEGRA
                </span>
              </h1>
              <p className="text-slate-600 dark:text-slate-400 max-w-xl text-base font-medium leading-relaxed font-display">
                Supervisión y control de jugadores restringidos. Los registros
                son permanentes y mantenidos por el consejo de oficiales.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white dark:bg-slate-900/40 backdrop-blur-md border border-slate-200 dark:border-slate-800/80 p-3 rounded-2xl shadow-xl font-display">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">
              Total
            </span>
            <span className="text-xl font-black text-slate-900 dark:text-white">
              {data.length}
            </span>
          </div>
        </header>

        {/* Search Bar */}
        <div className="flex items-center gap-4">
          <div className="relative w-full group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-red-500 transition-colors">
              <Search size={18} />
            </div>
            <input
              type="text"
              placeholder="Escribe el nombre del personaje para buscar..."
              className="block w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500/40 transition-all backdrop-blur-sm text-base"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* List/Table Section */}
        <section className="min-h-[400px]">
          {error ? (
            <div className="w-full flex flex-col items-center justify-center py-20 bg-red-950/10 border-2 border-dashed border-red-900/30 rounded-3xl text-center">
              <div className="text-red-500 bg-red-950/40 p-5 rounded-2xl mb-6 ring-4 ring-red-500/10">
                <AlertTriangle size={48} />
              </div>
              <h3 className="text-2xl font-black text-red-400 mb-3 tracking-tight">
                ERROR DE COMUNICACIÓN
              </h3>
              <p className="text-red-300/60 max-w-sm mx-auto">{error}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-32 gap-6">
                  <div className="relative">
                    <div className="w-20 h-20 border-4 border-red-500/10 border-t-red-500 rounded-full animate-spin" />
                    <UserX
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-red-500/50"
                      size={32}
                    />
                  </div>
                  <p className="text-red-400 font-black tracking-widest uppercase animate-pulse">
                    Iniciando escaneo de base de datos...
                  </p>
                </div>
              ) : paginatedData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900/20 rounded-3xl border border-slate-200 dark:border-slate-800/40 border-dashed">
                  <Ghost size={64} className="text-slate-700 mb-6" />
                  <p className="text-2xl font-black text-slate-800 dark:text-slate-200 mb-2">
                    SIN REGISTROS
                  </p>
                  <p className="text-slate-500 italic">
                    No se encontró ninguna coincidencia en la base de datos.
                  </p>
                </div>
              ) : (
                <>
                  {/* Mobile View: Cards */}
                  <div className="grid grid-cols-1 gap-4 md:hidden">
                    {paginatedData.map((entry) => (
                      <div
                        key={entry.id}
                        className="bg-white dark:bg-slate-900/40 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl p-4 hover:border-red-500/30 transition-all"
                      >
                        <div className="flex items-center gap-4 mb-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-red-500 shadow-inner">
                            <ShieldAlert size={20} />
                          </div>
                          <div>
                            <h4 className="text-lg font-black text-slate-900 dark:text-white">
                              {entry.nombre}
                            </h4>
                            <span className="text-[10px] text-red-500 font-bold uppercase tracking-tighter">
                              Estado: BLOQUEADO
                            </span>
                          </div>
                        </div>
                        {entry.reason && (
                          <div className="mb-3 px-3 py-2 bg-red-500/5 border border-red-500/10 rounded-xl">
                            <p className="text-xs text-slate-600 dark:text-slate-400 italic">
                              "{entry.reason}"
                            </p>
                          </div>
                        )}
                        <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800/50">
                          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-xs">
                            <Calendar size={12} className="text-red-500/50" />
                            <span>{formatLimaDate(entry.created_at)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-500 text-[10px]">
                            <Clock size={10} />
                            <span>{formatLimaTime(entry.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop View: Table */}
                  <div className="hidden md:block overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/40 backdrop-blur-md shadow-2xl">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-white dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
                          <th className="py-4 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                            Personaje
                          </th>
                          <th className="py-4 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                            Motivo / Razón
                          </th>
                          <th className="py-4 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                            Fecha de Registro
                          </th>
                          <th className="py-4 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-right">
                            Estado
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/30">
                        {paginatedData.map((entry) => (
                          <tr
                            key={entry.id}
                            className="group hover:bg-red-500/[0.02] transition-colors"
                          >
                            <td className="py-4 px-8">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-red-500 group-hover:scale-110 group-hover:bg-red-500/10 transition-all duration-300 shadow-lg">
                                  <ShieldAlert size={20} />
                                </div>
                                <div>
                                  <span className="block font-black text-lg text-slate-900 dark:text-white transition-colors">
                                    {entry.nombre}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-8">
                              <p className="text-slate-600 dark:text-slate-400 text-sm line-clamp-2 max-w-xs group-hover:text-slate-700 dark:text-slate-300 transition-colors">
                                {entry.reason || "Sin motivo especificado"}
                              </p>
                            </td>
                            <td className="py-4 px-8">
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold mb-0.5">
                                  <Calendar
                                    size={14}
                                    className="text-red-500"
                                  />
                                  <span className="text-sm">
                                    {formatLimaDate(entry.created_at)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-500 text-[10px] font-medium">
                                  <Clock size={12} />
                                  <span>
                                    {formatLimaTime(entry.created_at)}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-8 text-right">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[9px] font-black uppercase tracking-widest shadow-sm">
                                <span className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />
                                Baneado
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Section */}
                  {totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-8">
                      <div className="flex items-center gap-4 text-slate-500 text-sm font-bold order-2 sm:order-1">
                        <span className="uppercase tracking-[0.1em]">
                          Página
                        </span>
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-xl text-slate-900 dark:text-white">
                          {currentPage} / {totalPages}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 order-1 sm:order-2">
                        <button
                          onClick={() =>
                            setCurrentPage((prev) => Math.max(prev - 1, 1))
                          }
                          disabled={currentPage === 1}
                          className={clsx(
                            "flex items-center gap-2 px-5 py-3 rounded-2xl border font-black uppercase text-xs tracking-widest transition-all",
                            currentPage === 1
                              ? "border-slate-200 dark:border-slate-800 text-slate-700 bg-white dark:bg-slate-900/20 cursor-not-allowed"
                              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:text-white hover:bg-slate-100 dark:bg-slate-800 hover:border-slate-600 active:scale-95",
                          )}
                        >
                          <ChevronLeft size={16} />
                          Anterior
                        </button>

                        <div className="hidden lg:flex items-center gap-1 px-4">
                          {/* Dots or simple pages for space */}
                          {[...Array(totalPages)].map((_, i) => {
                            const p = i + 1;
                            if (
                              totalPages > 7 &&
                              Math.abs(p - currentPage) > 1 &&
                              p !== 1 &&
                              p !== totalPages
                            ) {
                              if (p === 2 || p === totalPages - 1)
                                return (
                                  <span key={p} className="text-slate-800 mx-1">
                                    ...
                                  </span>
                                );
                              return null;
                            }
                            return (
                              <button
                                key={p}
                                onClick={() => setCurrentPage(p)}
                                className={clsx(
                                  "w-10 h-10 rounded-xl text-xs font-black transition-all",
                                  currentPage === p
                                    ? "bg-red-500 text-slate-900 dark:text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                                    : "text-slate-500 hover:text-slate-900 dark:text-white hover:bg-slate-100 dark:bg-slate-800",
                                )}
                              >
                                {p}
                              </button>
                            );
                          })}
                        </div>

                        <button
                          onClick={() =>
                            setCurrentPage((prev) =>
                              Math.min(prev + 1, totalPages),
                            )
                          }
                          disabled={currentPage === totalPages}
                          className={clsx(
                            "flex items-center gap-2 px-5 py-3 rounded-2xl border font-black uppercase text-xs tracking-widest transition-all",
                            currentPage === totalPages
                              ? "border-slate-200 dark:border-slate-800 text-slate-700 bg-white dark:bg-slate-900/20 cursor-not-allowed"
                              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:text-white hover:bg-slate-100 dark:bg-slate-800 hover:border-slate-600 active:scale-95",
                          )}
                        >
                          Siguiente
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </section>

        {/* Action Footer */}
        <footer className="pt-12 border-t border-slate-200 dark:border-slate-800/50">
          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-6 justify-between">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-600 dark:text-slate-400">
                <Users size={32} />
              </div>
              <div>
                <h5 className="text-xl font-black text-slate-900 dark:text-white mb-1">
                  ¿Falta alguien?
                </h5>
                <p className="text-slate-500 text-sm max-w-md font-medium">
                  Si detectas a un jugador que debería estar aquí, reportalo
                  inmediatamente con las pruebas necesarias.
                </p>
              </div>
            </div>
            <a
              href="https://discord.gg/your-invite"
              target="_blank"
              className="w-full md:w-auto px-8 py-4 bg-white text-black font-black uppercase text-xs tracking-[0.2em] rounded-2xl hover:bg-red-500 hover:text-slate-900 dark:text-white transition-all text-center"
            >
              Contactar Oficiales
            </a>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-8 px-4 text-slate-600 text-[10px] font-black uppercase tracking-[0.3em]">
            <div className="flex items-center gap-4">
              <span>Skada EPGP</span>
              <span className="w-1 h-1 rounded-full bg-slate-100 dark:bg-slate-800" />
              <span>Lista Negra Module v2.0</span>
            </div>
            <div className="flex items-center gap-2">
              <Info size={12} />
              <span>Solo lectura para miembros generales</span>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
