"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  X, History, TrendingUp, Shield, Loader2, Calendar, 
  ArrowUpCircle, ArrowDownCircle, Info
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer 
} from "recharts";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import clsx from "clsx";

interface Transaction {
  id: string | number;
  personaje: string;
  valor: number;
  descripcion: string;
  fecha: string; // Formato dd/mm/yyyy
  hour: string; // Formato hh:mm:ss
  "EP/GP"?: string;
}

interface CharacterHistoryModalProps {
  mainName: string;
  alters?: string[];
  isOpen: boolean;
  onClose: () => void;
}

export default function CharacterHistoryModal({ mainName, alters = [], isOpen, onClose }: CharacterHistoryModalProps) {
  // Lista con todos los nombres (Main + Alters)
  const allNames = [mainName, ...alters];
  const namesQuery = allNames.join(",");

  const parseDate = (d: string, h: string) => {
    const [day, month, year] = d.split('/').map(Number);
    const [hour, min, sec] = h.split(':').map(Number);
    return new Date(year, month - 1, day, hour, min, sec);
  };

  const { data: history = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ["epgpHistory", namesQuery],
    queryFn: async () => {
      const res = await fetch(`/api/epgp/history?names=${encodeURIComponent(namesQuery)}`);
      if (!res.ok) throw new Error("Failed to fetch history");
      return res.json();
    },
    enabled: isOpen && !!mainName,
  });

  useEffect(() => {
    if (isOpen && history.length > 0 && (window as any).$WowheadPower) {
      setTimeout(() => (window as any).$WowheadPower.refreshLinks(), 100);
    }
  }, [isOpen, history]);

  if (!isOpen) return null;

  // Ordenar cronológicamente antes de procesar el gráfico
  const chronologicalHistory = [...history].sort((a, b) => {
    return parseDate(a.fecha, a.hour).getTime() - parseDate(b.fecha, b.hour).getTime();
  });

  // Procesar datos para el gráfico de evolución (EP Acumulado del Jugador)
  const chartData = chronologicalHistory.reduce((acc: any[], curr, idx) => {
    const prevEP = idx > 0 ? acc[idx - 1].ep : 0;
    const newEP = prevEP + curr.valor;
    
    acc.push({
      date: curr.fecha.split('/').slice(0, 2).join('/'),
      ep: newEP,
    });
    return acc;
  }, []);

  // Volver a ordenar de más reciente a más antiguo para la lista
  const displayHistory = [...chronologicalHistory].reverse();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="p-6 md:p-8 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Shield size={28} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter">{mainName}</h3>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                Bitácora Global ({allNames.length} Personajes)
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
            <X size={24} className="text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <Loader2 className="animate-spin text-emerald-500" size={40} />
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Calculando Bitácora Combinada...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-20 bg-slate-950/30 rounded-3xl border border-dashed border-slate-800">
              <Info className="mx-auto text-slate-700 mb-4" size={48} />
              <p className="text-slate-400 font-bold uppercase text-xs">No hay registros detallados para este jugador o sus alters.</p>
            </div>
          ) : (
            <>
              {/* Gráfico de Evolución */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-2">
                  <TrendingUp size={16} className="text-emerald-400" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Evolución de EP Acumulado</span>
                </div>
                <div className="h-[250px] bg-slate-950/50 rounded-3xl p-4 border border-slate-800/50">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorEp" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="date" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '12px' }}
                        itemStyle={{ color: '#10b981', fontSize: '12px', fontWeight: 'bold' }}
                      />
                      <Area type="monotone" dataKey="ep" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorEp)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Lista de Transacciones */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-2">
                  <History size={16} className="text-cyan-400" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Bitácora Global de Eventos</span>
                </div>
                <div className="grid gap-3">
                  {displayHistory.map((log, idx) => (
                    <div key={idx} className="bg-slate-950/40 hover:bg-slate-900/60 transition-colors border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 group">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={clsx(
                          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all group-hover:rotate-6",
                          log.valor > 0 ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"
                        )}>
                          {log.valor > 0 ? <ArrowUpCircle size={20} /> : <ArrowDownCircle size={20} />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-slate-100 uppercase tracking-tight truncate">
                              {log.descripcion.split(/(\[.*?\])/).map((part, i) => {
                                if (part.startsWith("[") && part.endsWith("]")) {
                                  const itemName = part.slice(1, -1);
                                  return (
                                    <a
                                      key={i}
                                      href={`https://www.wowhead.com/wotlk/search?q=${encodeURIComponent(itemName)}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-emerald-400 hover:text-emerald-300 underline decoration-emerald-500/30"
                                    >
                                      {part}
                                    </a>
                                  );
                                }
                                return part;
                              })}
                            </p>
                            <span className={clsx(
                              "text-[8px] px-1.5 py-0.5 rounded font-black border uppercase",
                              log.personaje === mainName ? "bg-blue-500/10 border-blue-500/30 text-blue-400" : "bg-purple-500/10 border-purple-500/30 text-purple-400"
                            )}>
                              {log.personaje}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Calendar size={12} className="text-slate-600" />
                            <span className="text-[10px] font-bold text-slate-500 uppercase">
                              {format(parseDate(log.fecha, log.hour), "PPP", { locale: es })} • {log.hour}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6 px-4 md:border-l md:border-slate-800">
                        <div className="text-right">
                          <p className="text-[9px] font-black text-slate-600 uppercase">Valor</p>
                          <p className={clsx("text-sm font-black", log.valor >= 0 ? "text-emerald-400" : "text-red-400")}>
                            {log.valor >= 0 ? `+${log.valor}` : log.valor}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 bg-slate-950/50 border-t border-slate-800 text-center">
          <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">Sistema de Auditoría EPGP • Old Legends</p>
        </div>
      </div>
    </div>
  );
}
