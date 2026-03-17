"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  UserX, Search, Loader2, AlertTriangle, Calendar, ShieldAlert,
  Ghost, Info, Clock, ChevronLeft, ChevronRight
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
  const rowsPerPage = 25;

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
    return data.filter(entry => 
      entry.nombre.toLowerCase().includes(lowSearch)
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
      return new Intl.DateTimeFormat('es-PE', {
        timeZone: 'America/Lima',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }).format(date);
    } catch (e) {
      return dateString;
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-200 p-4 md:p-8 lg:p-12 font-sans selection:bg-red-500/30">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-800/60">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.15)]">
                <UserX className="text-red-400" size={28} />
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400 drop-shadow-sm">
                Lista Negra
              </h1>
            </div>
            <p className="text-slate-400 max-w-2xl font-medium">
              Registro de jugadores con restricciones o sanciones dentro de la hermandad.
            </p>
          </div>
        </header>

        {/* Search Bar & Stats */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full max-w-md group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors group-focus-within:text-red-400 text-slate-500">
              <Search size={18} />
            </div>
            <input
              type="text"
              placeholder="Buscar por nombre de personaje..."
              className="block w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500/40 transition-all backdrop-blur-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {!loading && (
            <div className="text-slate-400 text-sm font-medium bg-slate-900/40 px-4 py-2 rounded-lg border border-slate-800/50">
              Total: <span className="text-red-400">{filteredData.length}</span> registros
            </div>
          )}
        </div>

        {/* Content */}
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          {error ? (
            <div className="w-full flex-1 flex flex-col items-center justify-center p-12 bg-red-950/20 border border-red-900/50 rounded-xl text-center backdrop-blur-sm">
              <div className="text-red-500 bg-red-950/50 p-4 rounded-full mb-4">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-bold text-red-400 mb-2">Error al cargar los datos</h3>
              <p className="text-red-300/70 max-w-md">{error}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-full bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden backdrop-blur-sm bg-opacity-70 flex flex-col max-w-4xl mx-auto">
                <div className="overflow-x-auto">
                  <table className="w-full text-left whitespace-nowrap border-collapse">
                    <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="py-4 px-8">Personaje</th>
                        <th className="py-4 px-8">Fecha de Registro (Lima)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50 relative">
                      {loading && (
                        <tr>
                          <td colSpan={2} className="py-20 text-center">
                            <div className="flex flex-col items-center justify-center gap-3">
                              <Loader2 size={32} className="text-red-500 animate-spin" />
                              <p className="text-red-400 font-medium">Cargando registros...</p>
                            </div>
                          </td>
                        </tr>
                      )}

                      {!loading && paginatedData.length === 0 ? (
                        <tr>
                          <td colSpan={2} className="px-8 py-20 text-center text-slate-400">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <Ghost size={40} className="text-slate-600 mb-1" />
                              <p className="text-xl font-semibold text-slate-300">Sin resultados</p>
                              <p className="text-sm italic">No se encontraron registros.</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        !loading && paginatedData.map((entry) => (
                          <tr key={entry.id} className="hover:bg-red-500/[0.03] transition-colors group">
                            <td className="py-5 px-8">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-red-400 group-hover:scale-110 transition-transform">
                                  <ShieldAlert size={20} />
                                </div>
                                <span className="font-bold text-lg text-slate-100 group-hover:text-red-300 transition-colors">
                                  {entry.nombre}
                                </span>
                              </div>
                            </td>
                            <td className="py-5 px-8">
                              <div className="flex items-center gap-3 text-slate-300 font-medium">
                                <Calendar size={16} className="text-red-500/70" />
                                <div className="flex flex-col">
                                  <span>{formatLimaDate(entry.created_at)}</span>
                                  <span className="text-[10px] text-slate-500 uppercase tracking-tighter flex items-center gap-1">
                                    <Clock size={10} /> America/Lima
                                  </span>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {!loading && totalPages > 1 && (
                  <div className="px-8 py-4 bg-slate-950/50 border-t border-slate-800 flex items-center justify-between gap-4">
                    <div className="text-xs text-slate-500 font-medium">
                      Página <span className="text-slate-300">{currentPage}</span> de <span className="text-slate-300">{totalPages}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className={clsx(
                          "p-2 rounded-lg border transition-all",
                          currentPage === 1 
                            ? "border-slate-800 text-slate-700 cursor-not-allowed" 
                            : "border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-red-400 active:scale-95"
                        )}
                      >
                        <ChevronLeft size={18} />
                      </button>
                      
                      <div className="flex items-center gap-1">
                        {[...Array(totalPages)].map((_, i) => {
                          const page = i + 1;
                          // Mostrar solo algunas páginas si hay demasiadas
                          if (totalPages > 5 && Math.abs(page - currentPage) > 1 && page !== 1 && page !== totalPages) {
                             if (page === 2 || page === totalPages - 1) return <span key={page} className="text-slate-700">...</span>;
                             return null;
                          }
                          return (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={clsx(
                                "w-8 h-8 rounded-lg text-xs font-bold transition-all",
                                currentPage === page
                                  ? "bg-red-500/20 text-red-400 border border-red-500/40"
                                  : "text-slate-500 hover:text-slate-300 hover:bg-slate-800"
                              )}
                            >
                              {page}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className={clsx(
                          "p-2 rounded-lg border transition-all",
                          currentPage === totalPages 
                            ? "border-slate-800 text-slate-700 cursor-not-allowed" 
                            : "border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-red-400 active:scale-95"
                        )}
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Footer info */}
        <footer className="pt-6 flex items-center gap-2 text-slate-500 text-xs italic justify-center">
          <Info size={14} />
          <span>La lista negra es gestionada por los oficiales. Si crees que hay un error, contacta con un oficial en Discord.</span>
        </footer>
      </div>
    </main>
  );
}
