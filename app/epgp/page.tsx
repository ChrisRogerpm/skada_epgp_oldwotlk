"use client";

import React, { useState, useMemo, useEffect } from "react";
import { BarChart2, Users, Search, ChevronDown, ChevronUp, Calendar, Clock, History, LayoutList, TrendingUp, TrendingDown, Loader2 } from "lucide-react";

// Define TypeScript interfaces for our data structure
interface Alter {
  name: string;
  class: string;
  icon: string;
}

interface RosterMember {
  main: string;
  class: string;
  amount: number;
  icon: string;
  alters: Alter[];
}

interface LogDetail {
  personaje: string;
  descripcion: string;
  valor: number;
  "EP/GP": string;
  fecha: string;
  hour: string;
}

export default function EPGPPage() {
  const [activeTab, setActiveTab] = useState<"roster" | "history">("roster");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  
  const [roster, setRoster] = useState<RosterMember[]>([]);
  const [historyLogs, setHistoryLogs] = useState<LogDetail[]>([]);
  const [lastUpdatedDate, setLastUpdatedDate] = useState("");
  const [lastUpdatedHour, setLastUpdatedHour] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [epgpRes, logsRes] = await Promise.all([
          fetch("/api/epgp"),
          fetch("/api/detalleepgp")
        ]);

        const epgpData = await epgpRes.json();
        const logsData = await logsRes.json();

        if (epgpData) {
          setRoster(epgpData.roster || []);
          setLastUpdatedDate(epgpData.date || "");
          setLastUpdatedHour(epgpData.hour || "");
        }

        if (logsData) {
          // Sort logs by date (DD/MM/YYYY) and hour (HH:MM:SS) in descending order
          const sortedLogs = [...logsData].sort((a, b) => {
            const [dayA, monthA, yearA] = a.fecha.split("/").map(Number);
            const [dayB, monthB, yearB] = b.fecha.split("/").map(Number);
            const [hourA, minA, secA] = a.hour.split(":").map(Number);
            const [hourB, minB, secB] = b.hour.split(":").map(Number);
            
            const dateA = new Date(yearA, monthA - 1, dayA, hourA, minA, secA).getTime();
            const dateB = new Date(yearB, monthB - 1, dayB, hourB, minB, secB).getTime();
            
            return dateB - dateA;
          });
          setHistoryLogs(sortedLogs);
        }
      } catch (error) {
        console.error("Error fetching EPGP data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);
  // Filter roster based on search term
  const filteredRoster = useMemo(() => {
    if (!searchTerm) return roster;
    
    const lowerSearch = searchTerm.toLowerCase();
    return roster.filter(member => 
      member.main.toLowerCase().includes(lowerSearch) ||
      member.alters?.some(alt => alt.name.toLowerCase().includes(lowerSearch))
    );
  }, [roster, searchTerm]);

  // Create a mapping of character name to their info (icon, class)
  const characterInfoMap = useMemo(() => {
    const map = new Map<string, { icon: string; class: string }>();
    roster.forEach(member => {
      map.set(member.main.toLowerCase(), { icon: member.icon, class: member.class });
      member.alters?.forEach(alt => {
        map.set(alt.name.toLowerCase(), { icon: alt.icon, class: alt.class });
      });
    });
    return map;
  }, [roster]);

  // Filter history based on search term
  const filteredHistory = useMemo(() => {
    if (!searchTerm) return historyLogs;
    
    const lowerSearch = searchTerm.toLowerCase();
    return historyLogs.filter(log => 
      log.personaje.toLowerCase().includes(lowerSearch) ||
      log.descripcion.toLowerCase().includes(lowerSearch) ||
      log.fecha.includes(lowerSearch)
    );
  }, [historyLogs, searchTerm]);

  // Handle row expansion
  const toggleRow = (mainName: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(mainName)) {
      newExpanded.delete(mainName);
    } else {
      newExpanded.add(mainName);
    }
    setExpandedRows(newExpanded);
  };

  // Helper function to get class color based on wow classes
  const getClassColor = (className: string) => {
    const colors: Record<string, string> = {
      DEATHKNIGHT: "text-red-500",
      DRUID: "text-orange-400",
      HUNTER: "text-green-500",
      MAGE: "text-cyan-300",
      PALADIN: "text-pink-300",
      PRIEST: "text-white",
      ROGUE: "text-yellow-200",
      SHAMAN: "text-blue-500",
      WARLOCK: "text-purple-500",
      WARRIOR: "text-amber-700",
    };
    return colors[className] || "text-slate-200";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
        <p className="text-slate-400 font-medium animate-pulse">Cargando datos de EPGP...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-200 p-4 md:p-8 lg:p-12 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-800/60">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
                <BarChart2 className="text-blue-400" size={28} />
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 drop-shadow-sm">
                Sistema EPGP
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
              <div className="flex items-center gap-1.5 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/50 shadow-sm">
                <Calendar size={14} className="text-blue-400" />
                <span>Actualizado: {lastUpdatedDate}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/50 shadow-sm">
                <Clock size={14} className="text-blue-400" />
                <span>Hora: {lastUpdatedHour}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/50 shadow-sm">
                <Users size={14} className="text-blue-400" />
                <span>Jugadores: {roster.length}</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            {/* Tabs */}
            <div className="flex bg-slate-900/80 p-1.5 rounded-xl border border-slate-700/60 shadow-inner w-full sm:w-auto">
              <button
                onClick={() => setActiveTab("roster")}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === "roster" 
                    ? "bg-slate-800 text-blue-400 shadow-md border border-slate-700/50" 
                    : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
                }`}
              >
                <LayoutList size={16} />
                Roster
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === "history" 
                    ? "bg-slate-800 text-blue-400 shadow-md border border-slate-700/50" 
                    : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
                }`}
              >
                <History size={16} />
                Historial
              </button>
            </div>

            <div className="relative group w-full sm:w-64 md:w-72">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
              </div>
              <input
                type="text"
                placeholder={activeTab === "roster" ? "Buscar personaje..." : "Buscar historial..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900/80 border border-slate-700/60 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all shadow-inner"
              />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="bg-slate-900/40 rounded-2xl border border-slate-800/60 overflow-hidden shadow-xl backdrop-blur-sm">
          {activeTab === "roster" ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-800/50 border-b border-slate-700/60 text-slate-400 text-xs uppercase tracking-wider">
                    <th className="px-4 py-2 font-semibold">Jugador (Main)</th>
                    <th className="px-4 py-2 font-semibold text-center">Clase</th>
                    <th className="px-4 py-2 font-semibold text-right">EP</th>
                    <th className="px-4 py-2 font-semibold text-center w-28">Alters</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-sm">
                  {filteredRoster.length > 0 ? (
                    filteredRoster.map((member) => (
                      <React.Fragment key={member.main}>
                        <tr 
                          onClick={() => toggleRow(member.main)}
                          className={`group cursor-pointer hover:bg-slate-800/30 transition-colors ${expandedRows.has(member.main) ? 'bg-slate-800/40' : ''}`}
                        >
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-2.5">
                              <div className="relative w-6 h-6 rounded overflow-hidden border border-slate-700 group-hover:border-blue-500/50 transition-colors bg-slate-800">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img 
                                  src={member.icon || "/api/placeholder/24/24"} 
                                  alt={member.class} 
                                  className="object-cover w-full h-full"
                                />
                              </div>
                              <span className={`font-semibold tracking-wide text-sm ${getClassColor(member.class)} drop-shadow-sm`}>
                                {member.main}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-2 text-center">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700/50 shadow-sm uppercase tracking-wider">
                              {member.class}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-right">
                            <span className="font-mono text-base font-bold text-slate-100 drop-shadow-sm">
                              {member.amount.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-center">
                            <div className="flex justify-center items-center gap-1.5">
                              <span className="text-xs font-semibold text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700/50">
                                {member.alters?.length || 0}
                              </span>
                              {member.alters && member.alters.length > 0 && (
                                <button 
                                  className="text-slate-400 group-hover:text-blue-400 transition-colors flex items-center justify-center p-0.5 rounded hover:bg-slate-700/60"
                                  aria-label="Toggle Alters"
                                >
                                  {expandedRows.has(member.main) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                        {/* Expanded Alters Row */}
                        {expandedRows.has(member.main) && member.alters && member.alters.length > 0 && (
                          <tr className="bg-slate-900/80 border-b border-slate-800/50">
                            <td colSpan={4} className="px-4 py-3">
                              <div className="pl-9 pr-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="flex items-center gap-1.5 mb-2">
                                  <Users size={12} className="text-slate-400" />
                                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    Alters Registrados de {member.main}
                                  </h4>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                                  {member.alters.map((alt) => (
                                    <div 
                                      key={alt.name} 
                                      className="flex items-center gap-2 bg-slate-800/40 p-1.5 rounded-lg border border-slate-700/40 hover:bg-slate-800/70 hover:border-slate-600/50 transition-all shadow-sm"
                                    >
                                      <div className="w-5 h-5 rounded overflow-hidden border border-slate-600 bg-slate-700">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img 
                                          src={alt.icon || "/api/placeholder/20/20"} 
                                          alt={alt.class} 
                                          className="object-cover w-full h-full"
                                        />
                                      </div>
                                      <div className="flex flex-col">
                                        <span className={`text-xs font-bold tracking-wide ${getClassColor(alt.class)} leading-tight`}>
                                          {alt.name}
                                        </span>
                                        <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider leading-tight">
                                          {alt.class}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-10 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Search size={24} className="text-slate-500 mb-1" />
                          <p className="text-base font-semibold text-slate-300">No se encontraron personajes</p>
                          <p className="text-xs">Intenta buscar con otro nombre o revisa la ortografía.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto animate-in fade-in duration-300">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-800/50 border-b border-slate-700/60 text-slate-400 text-xs uppercase tracking-wider">
                    <th className="px-4 py-2 font-semibold w-36">Fecha y Hora</th>
                    <th className="px-4 py-2 font-semibold">Personaje</th>
                    <th className="px-4 py-2 font-semibold">Descripción</th>
                    <th className="px-4 py-2 font-semibold text-center w-20">Tipo</th>
                    <th className="px-4 py-2 font-semibold text-right w-24">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {filteredHistory.length > 0 ? (
                    filteredHistory.map((log, index) => {
                      const isPositive = log.valor > 0;
                      const charInfo = characterInfoMap.get(log.personaje.toLowerCase());
                      return (
                        <tr key={index} className="hover:bg-slate-800/30 transition-colors">
                          <td className="px-4 py-2">
                            <div className="flex flex-col leading-tight">
                              <span className="text-slate-300 font-medium text-xs">{log.fecha}</span>
                              <span className="text-slate-500 text-[10px]">{log.hour}</span>
                            </div>
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-2">
                              {charInfo ? (
                                <div className="relative w-5 h-5 rounded overflow-hidden border border-slate-700 bg-slate-800 shrink-0 shadow-sm">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img 
                                    src={charInfo.icon} 
                                    alt={charInfo.class} 
                                    className="object-cover w-full h-full"
                                  />
                                </div>
                              ) : (
                                <div className="w-5 h-5 rounded bg-slate-800 border border-slate-700 shrink-0 flex items-center justify-center shadow-sm">
                                  <Users size={12} className="text-slate-500" />
                                </div>
                              )}
                              <span className={`font-semibold drop-shadow-sm text-sm ${charInfo ? getClassColor(charInfo.class) : 'text-blue-300'}`}>
                                {log.personaje}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-2">
                            <span className="text-slate-200 text-sm">
                              {log.descripcion}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-center">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-800/80 text-slate-400 border border-slate-700/50">
                              {log["EP/GP"]}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-right">
                            <div className={`flex items-center justify-end gap-1 font-mono text-sm font-bold drop-shadow-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                              {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                              {isPositive ? "+" : ""}{log.valor}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <History size={24} className="text-slate-500 mb-1" />
                          <p className="text-base font-semibold text-slate-300">No hay registros</p>
                          <p className="text-xs">No se encontraron movimientos que coincidan con la búsqueda.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
