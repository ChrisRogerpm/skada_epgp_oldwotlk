"use client";

import React, { useState, useMemo, useEffect } from "react";
import { 
  BarChart2, Users, Search, ChevronDown, ChevronUp, Calendar, Clock, 
  History, LayoutList, TrendingUp, TrendingDown, Loader2, Grid, List,
  Maximize2, Minimize2, Star, Filter, CalendarDays, X
} from "lucide-react";

// Helpers para manejo de fechas
const getLimaISODate = () => {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = { timeZone: "America/Lima", year: 'numeric', month: '2-digit', day: '2-digit' };
  const parts = new Intl.DateTimeFormat('en-US', options).formatToParts(now);
  const find = (type: string) => parts.find(p => p.type === type)?.value;
  return `${find('year')}-${find('month')}-${find('day')}`;
};

const isoToLogDate = (iso: string) => {
  if (!iso) return "";
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

const logToIsoDate = (log: string) => {
  if (!log) return "";
  const [d, m, y] = log.split('/');
  return `${y}-${m}-${d}`;
};

// Interfaces
interface Alter { name: string; class: string; icon: string; }
interface RosterMember { main: string; class: string; amount: number; icon: string; alters: Alter[]; }
interface LogDetail { personaje: string; descripcion: string; valor: number; "EP/GP": string; fecha: string; hour: string; }

const WOW_CLASSES = ["DEATHKNIGHT", "DRUID", "HUNTER", "MAGE", "PALADIN", "PRIEST", "ROGUE", "SHAMAN", "WARLOCK", "WARRIOR"];

export default function EPGPPage() {
  const [activeTab, setActiveTab] = useState<"roster" | "history">("roster");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  
  const [roster, setRoster] = useState<RosterMember[]>([]);
  const [historyLogs, setHistoryLogs] = useState<LogDetail[]>([]);
  const [lastUpdatedDate, setLastUpdatedDate] = useState("");
  const [lastUpdatedHour, setLastUpdatedHour] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  // Timezone & Filtering states
  const [selectedDate, setSelectedDate] = useState<string>(isoToLogDate(getLimaISODate()));
  const [sortConfig, setSortConfig] = useState<{ key: 'main' | 'class' | 'amount', direction: 'asc' | 'desc' }>({ key: 'amount', direction: 'desc' });
  const [historySortConfig, setHistorySortConfig] = useState<{ key: 'fecha' | 'valor', direction: 'asc' | 'desc' }>({ key: 'fecha', direction: 'desc' });
  const [selectedClasses, setSelectedClasses] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [myCharacter, setMyCharacter] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  // Helper functions for UI
  const getClassColor = (className: string) => {
    const colors: Record<string, string> = {
      DEATHKNIGHT: "text-red-500", DRUID: "text-orange-400", HUNTER: "text-green-500",
      MAGE: "text-cyan-300", PALADIN: "text-pink-300", PRIEST: "text-white",
      ROGUE: "text-yellow-200", SHAMAN: "text-blue-500", WARLOCK: "text-purple-500",
      WARRIOR: "text-amber-700",
    };
    return colors[className] || "text-slate-200";
  };

  const getClassBgColor = (className: string) => {
    const colors: Record<string, string> = {
      DEATHKNIGHT: "bg-red-500", DRUID: "bg-orange-400", HUNTER: "bg-green-500",
      MAGE: "bg-cyan-300", PALADIN: "bg-pink-300", PRIEST: "bg-slate-300",
      ROGUE: "bg-yellow-200", SHAMAN: "bg-blue-500", WARLOCK: "bg-purple-500",
      WARRIOR: "bg-amber-700",
    };
    return colors[className] || "bg-blue-500";
  };

  // 1. Carga inicial del Roster y Datos generales
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoading(true);
        const epgpRes = await fetch("/api/epgp");
        const epgpData = await epgpRes.json();
        if (epgpData) {
          setRoster(epgpData.roster || []);
          if (epgpData.date) {
            const [y, m, d] = epgpData.date.split('-');
            setLastUpdatedDate(`${d}/${m}/${y}`);
          }
          setLastUpdatedHour(epgpData.hour || "");
        }
      } catch (error) {
        console.error("Error fetching EPGP data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
    const savedChar = localStorage.getItem("my_character");
    if (savedChar) setMyCharacter(savedChar);
  }, []);

  // 2. Carga dinámica del historial cuando cambia la fecha
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setIsHistoryLoading(true);
        const queryDate = selectedDate || "all";
        const logsRes = await fetch(`/api/detalleepgp?fecha=${encodeURIComponent(queryDate)}`);
        const logsData = await logsRes.json();
        setHistoryLogs(logsData || []);
      } catch (error) {
        console.error("Error fetching logs:", error);
      } finally {
        setIsHistoryLoading(false);
      }
    };
    fetchLogs();
  }, [selectedDate]);

  const handleSetMyCharacter = (name: string) => {
    const newValue = myCharacter === name ? "" : name;
    setMyCharacter(newValue);
    if (newValue) localStorage.setItem("my_character", newValue);
    else localStorage.removeItem("my_character");
  };

  const toggleClassFilter = (wowClass: string) => {
    const newFilters = new Set(selectedClasses);
    if (newFilters.has(wowClass)) newFilters.delete(wowClass);
    else newFilters.add(wowClass);
    setSelectedClasses(newFilters);
  };

  const processedRoster = useMemo(() => {
    let filtered = roster;
    if (selectedClasses.size > 0) filtered = filtered.filter(member => selectedClasses.has(member.class.toUpperCase()));
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(member => member.main.toLowerCase().includes(lowerSearch) || member.alters?.some(alt => alt.name.toLowerCase().includes(lowerSearch)));
    }
    return [...filtered].sort((a, b) => {
      let comparison = 0;
      if (sortConfig.key === 'main') comparison = a.main.localeCompare(b.main);
      else if (sortConfig.key === 'class') comparison = a.class.localeCompare(b.class);
      else if (sortConfig.key === 'amount') comparison = a.amount - b.amount;
      if (a.main === myCharacter) return -1;
      if (b.main === myCharacter) return 1;
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [roster, searchTerm, selectedClasses, sortConfig, myCharacter]);

  const maxEP = useMemo(() => Math.max(...roster.map(m => m.amount), 1), [roster]);

  const characterInfoMap = useMemo(() => {
    const map = new Map<string, { icon: string; class: string }>();
    roster.forEach(member => {
      map.set(member.main.toLowerCase(), { icon: member.icon, class: member.class });
      member.alters?.forEach(alt => map.set(alt.name.toLowerCase(), { icon: alt.icon, class: alt.class }));
    });
    return map;
  }, [roster]);

  const processedHistory = useMemo(() => {
    let filtered = historyLogs;
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(log => log.personaje.toLowerCase().includes(lowerSearch) || log.descripcion.toLowerCase().includes(lowerSearch));
    }
    return [...filtered].sort((a, b) => {
      if (historySortConfig.key === 'valor') return historySortConfig.direction === 'asc' ? a.valor - b.valor : b.valor - a.valor;
      const [da, ma, ya] = a.fecha.split("/").map(Number);
      const [db, mb, yb] = b.fecha.split("/").map(Number);
      const [ha, mia, sa] = a.hour.split(":").map(Number);
      const [hb, mib, sb] = b.hour.split(":").map(Number);
      const dateA = new Date(ya, ma - 1, da, ha, mia, sa).getTime();
      const dateB = new Date(yb, mb - 1, db, hb, mib, sb).getTime();
      return historySortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
    });
  }, [historyLogs, searchTerm, historySortConfig]);

  const toggleRow = (mainName: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(mainName)) newExpanded.delete(mainName);
    else newExpanded.add(mainName);
    setExpandedRows(newExpanded);
  };

  if (isLoading) return <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4"><Loader2 className="w-12 h-12 text-blue-500 animate-spin" /><p className="text-slate-400 font-medium">Cargando EPGP...</p></div>;

  return (
    <main className="min-h-screen bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-200 p-4 md:p-8 lg:p-12 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 pb-6 border-b border-slate-800/60">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 shadow-md"><BarChart2 className="text-blue-400" size={28} /></div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Sistema EPGP</h1>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm text-slate-400">
              <div className="flex items-center gap-1.5 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/50 shadow-sm"><Calendar size={14} className="text-blue-400" /><span>TZ Lima: {lastUpdatedDate}</span></div>
              <div className="flex items-center gap-1.5 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/50 shadow-sm"><Clock size={14} className="text-blue-400" /><span>{lastUpdatedHour}</span></div>
              <div className="flex items-center gap-1.5 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/50 shadow-sm"><Users size={14} className="text-blue-400" /><span>{roster.length} Jugadores</span></div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
            <div className="flex bg-slate-900/80 p-1.5 rounded-xl border border-slate-700/60 shadow-inner w-full sm:w-auto">
              <button onClick={() => setActiveTab("roster")} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === "roster" ? "bg-slate-800 text-blue-400 shadow-md border border-slate-700/50" : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"}`}><LayoutList size={16} /> Roster</button>
              <button onClick={() => setActiveTab("history")} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === "history" ? "bg-slate-800 text-blue-400 shadow-md border border-slate-700/50" : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"}`}><History size={16} /> Historial</button>
            </div>
            <div className="relative group w-full sm:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="h-4 w-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" /></div>
              <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-slate-900/80 border border-slate-700/60 rounded-xl py-2 pl-9 pr-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all shadow-inner" />
            </div>
            <button onClick={() => setShowFilters(!showFilters)} className={`p-2 rounded-xl border transition-all flex-shrink-0 ${showFilters || selectedClasses.size > 0 ? "bg-blue-500/20 border-blue-500/50 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.1)]" : "bg-slate-900/80 border-slate-700/60 text-slate-400 hover:bg-slate-800"}`} title="Filtros"><Filter size={18} /></button>
          </div>
        </header>

        {showFilters && (
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 animate-in fade-in slide-in-from-top-2 duration-200 backdrop-blur-sm shadow-lg space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {activeTab === "roster" ? (
                <>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Filtrar por Clase</p>
                    <div className="flex flex-wrap gap-1.5">{WOW_CLASSES.map(cls => (<button key={cls} onClick={() => toggleClassFilter(cls)} className={`px-2 py-1 text-[10px] font-bold rounded border transition-all ${selectedClasses.has(cls) ? `${getClassBgColor(cls)} text-slate-950 border-transparent shadow-sm` : `bg-slate-800/50 text-slate-400 border-slate-700 hover:bg-slate-700 ${getClassColor(cls)}`}`}>{cls}</button>))}</div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Vista</p>
                    <div className="flex bg-slate-950 rounded-lg p-1 border border-slate-800">
                      <button onClick={() => setViewMode('table')} className={`p-1.5 rounded-md ${viewMode === 'table' ? 'bg-slate-800 text-blue-400' : 'text-slate-500'}`}><List size={16} /></button>
                      <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-slate-800 text-blue-400' : 'text-slate-500'}`}><Grid size={16} /></button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="w-full sm:w-auto">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Filtrar por Fecha (Lima TZ)</p>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><CalendarDays size={16} className="text-blue-400" /></div>
                      <input 
                        type="date" 
                        value={logToIsoDate(selectedDate)}
                        onChange={(e) => setSelectedDate(isoToLogDate(e.target.value))}
                        className="bg-slate-950 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 [color-scheme:dark] cursor-pointer"
                      />
                    </div>
                    {selectedDate && (
                      <button 
                        onClick={() => setSelectedDate("")}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold hover:bg-red-500/20 transition-all"
                      >
                        <X size={14} /> Quitar filtro
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="bg-slate-900/40 rounded-2xl border border-slate-800/60 overflow-hidden shadow-xl backdrop-blur-sm min-h-[50vh] relative">
          {isHistoryLoading && activeTab === "history" && (
            <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] z-50 flex items-center justify-center rounded-2xl">
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            </div>
          )}

          {activeTab === "roster" ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider font-semibold select-none">
                    <th className="px-4 py-3 cursor-pointer hover:bg-slate-800/50 transition-colors">Jugador (Main)</th>
                    <th className="px-4 py-3 text-center">Clase</th>
                    <th className="px-4 py-3 text-right">EP Actual</th>
                    <th className="px-4 py-3 text-center">Alters</th>
                    <th className="px-4 py-3 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {processedRoster.length > 0 ? (
                    processedRoster.map((member) => (
                      <React.Fragment key={member.main}>
                        <tr onClick={() => toggleRow(member.main)} className={`group cursor-pointer transition-colors ${member.main === myCharacter ? 'bg-blue-900/10' : 'hover:bg-slate-800/30'}`}>
                          <td className="px-4 py-3 flex items-center gap-3">
                            <div className={`relative w-8 h-8 rounded border overflow-hidden bg-slate-800 ${member.main === myCharacter ? 'border-blue-400 shadow-sm' : 'border-slate-700'}`}><img src={member.icon || "/api/placeholder/32/32"} alt={member.class} className="object-cover w-full h-full" /></div>
                            <span className={`font-semibold text-sm ${getClassColor(member.class)}`}>{member.main}</span>
                          </td>
                          <td className="px-4 py-3 text-center"><span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-900/80 text-slate-300 border border-slate-700/50 uppercase">{member.class}</span></td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-slate-100">{member.amount.toLocaleString()}</td>
                          <td className="px-4 py-3 text-center"><span className="font-semibold text-slate-300 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-700/50 text-[10px]">{member.alters?.length || 0}</span></td>
                          <td className="px-4 py-3 text-center"><button onClick={(e) => { e.stopPropagation(); handleSetMyCharacter(member.main); }} className={`p-1.5 rounded-lg transition-all ${member.main === myCharacter ? 'text-yellow-400 bg-yellow-400/10' : 'text-slate-600 hover:text-yellow-400'}`}><Star size={16} className={member.main === myCharacter ? "fill-yellow-400" : ""} /></button></td>
                        </tr>
                        {expandedRows.has(member.main) && member.alters && member.alters.length > 0 && (
                          <tr className={`border-b border-slate-800/50 ${member.main === myCharacter ? 'bg-blue-900/5' : 'bg-slate-900/80'}`}>
                            <td colSpan={5} className="px-4 py-3"><div className="pl-12 grid grid-cols-2 sm:grid-cols-4 gap-2 animate-in fade-in slide-in-from-top-2 duration-200">{member.alters.map((alt) => (<div key={alt.name} className="flex items-center gap-2.5 bg-slate-950/60 p-2 rounded-lg border border-slate-800/60"><div className="w-6 h-6 rounded overflow-hidden border border-slate-700 bg-slate-800 shrink-0"><img src={alt.icon || "/api/placeholder/24/24"} alt={alt.class} className="object-cover w-full h-full" /></div><div className="flex flex-col min-w-0"><span className={`text-xs font-bold truncate ${getClassColor(alt.class)}`}>{alt.name}</span><span className="text-[9px] text-slate-500 font-semibold uppercase">{alt.class}</span></div></div>))}</div></td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  ) : (
                    <tr><td colSpan={5} className="px-4 py-16 text-center text-slate-400"><div className="flex flex-col items-center justify-center gap-3"><Search size={32} className="text-slate-600" /><p className="text-lg font-semibold text-slate-300">No se encontraron personajes</p></div></td></tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="p-4 bg-slate-950/40 border-b border-slate-800/60 flex items-center justify-between">
                <div className="flex items-center gap-2"><CalendarDays size={18} className="text-blue-400" /><span className="text-sm font-bold text-slate-300">Registros del {selectedDate || "Todos los tiempos"}</span></div>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-900 px-2 py-1 rounded border border-slate-800">{processedHistory.length} REGISTROS</span>
              </div>
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider font-semibold select-none">
                    <th className="px-4 py-3 w-36">Hora</th>
                    <th className="px-4 py-3">Personaje</th>
                    <th className="px-4 py-3">Descripción</th>
                    <th className="px-4 py-3 text-center">Tipo</th>
                    <th className="px-4 py-3 text-right w-28">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {processedHistory.length > 0 ? (
                    processedHistory.map((log, index) => {
                      const isPositive = log.valor > 0;
                      const charInfo = characterInfoMap.get(log.personaje.toLowerCase());
                      const myCharData = roster.find(r => r.main === myCharacter);
                      const isMeOrMyAlter = myCharacter && (log.personaje === myCharacter || (myCharData?.alters?.some(a => a.name === log.personaje) ?? false));
                      return (
                        <tr key={index} className={`hover:bg-slate-800/30 transition-colors relative ${isMeOrMyAlter ? 'bg-blue-900/10' : ''}`}>
                          <td className="px-4 py-2.5 relative">
                            {isMeOrMyAlter && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-r-full shadow-lg z-10"></div>}
                            <div className="flex flex-col leading-tight"><span className="text-slate-300 font-medium text-xs">{log.hour}</span><span className="text-slate-500 text-[9px]">{log.fecha}</span></div>
                          </td>
                          <td className="px-4 py-2.5"><div className="flex items-center gap-2.5"><div className="relative w-6 h-6 rounded border border-slate-700 bg-slate-800 shrink-0 shadow-sm">{charInfo ? <img src={charInfo.icon} alt={charInfo.class} className="object-cover w-full h-full" /> : <Users size={14} className="text-slate-500 p-1" />}</div><span className={`font-semibold text-sm ${charInfo ? getClassColor(charInfo.class) : 'text-blue-300'}`}>{log.personaje}</span></div></td>
                          <td className="px-4 py-2.5"><span className="text-slate-300 text-sm">{log.descripcion}</span></td>
                          <td className="px-4 py-2.5 text-center"><span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-900/80 text-slate-400 border border-slate-700/50 uppercase tracking-wider">{log["EP/GP"]}</span></td>
                          <td className="px-4 py-2.5 text-right"><div className={`flex items-center justify-end gap-1.5 font-mono text-sm font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>{isPositive ? "+" : ""}{log.valor}</div></td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-16 text-center">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <History size={32} className="text-slate-600" />
                          <p className="text-lg font-semibold text-slate-300">No hay registros para este día</p>
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
