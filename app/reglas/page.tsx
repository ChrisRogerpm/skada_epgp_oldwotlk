"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  ScrollText, Shield, TrendingUp, TrendingDown, Search, 
  Loader2, Filter, ChevronDown, ChevronUp, Info, 
  Trophy, AlertTriangle, Coins, ExternalLink, CheckCircle2, XCircle
} from "lucide-react";

interface LootItem {
  category: string;
  item: string;
  requirement: string[];
  valueMin: number;
  icon: string;
}

interface RaidRule {
  raid: string;
  items: LootItem[];
}

interface BenefitItem {
  descripcion: string;
  valor: number;
  icon?: string;
}

interface BenefitCategory {
  category: string;
  items: BenefitItem[];
}

interface PenaltyItem {
  descripcion: string;
  valor: number;
  icon?: string;
}

interface PenaltyCategory {
  category: string;
  items: PenaltyItem[];
}

type RulesData = [
  { "Reglas de Loteo": RaidRule[] },
  { "Beneficios": BenefitCategory[] },
  { "Perjuicios": PenaltyCategory[] }
];

export default function RulesPage() {
  const [activeTab, setActiveTab] = useState<"loot" | "benefits" | "penalties">("loot");
  const [data, setData] = useState<RulesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRaids, setExpandedRaids] = useState<Set<string>>(new Set());
  
  // New Filter States
  const [selectedCategory, setSelectedCategory] = useState<string>("TODOS");
  const [myEP, setMyEP] = useState<number | null>(null);
  const [myCharacterName, setMyCharacterName] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const res = await fetch("/api/reglas");
        const json = await res.json();
        setData(json);
        
        // Find the "Reglas de Loteo" section in the array
        const lootSection = Array.isArray(json) 
          ? json.find((section: any) => section["Reglas de Loteo"])?.["Reglas de Loteo"]
          : null;

        // Default expand first raid in loot rules
        if (lootSection && lootSection.length > 0) {
          setExpandedRaids(new Set([lootSection[0].raid]));
        }

        // Fetch My Character EP if available
        const savedChar = localStorage.getItem("my_character");
        if (savedChar) {
          setMyCharacterName(savedChar);
          const epgpRes = await fetch("/api/epgp");
          const epgpData = await epgpRes.json();
          const me = epgpData.roster?.find((r: any) => r.main === savedChar);
          if (me) setMyEP(me.amount);
        }
      } catch (error) {
        console.error("Error fetching rules:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const toggleRaid = (raid: string) => {
    const newSet = new Set(expandedRaids);
    if (newSet.has(raid)) newSet.delete(raid);
    else newSet.add(raid);
    setExpandedRaids(newSet);
  };

  const categories = useMemo(() => {
    if (!data || !Array.isArray(data)) return ["TODOS"];
    const cats = new Set<string>(["TODOS"]);
    
    // Safety search for the correct array item
    const lootSection = (data as any[]).find((section: any) => section["Reglas de Loteo"])?.["Reglas de Loteo"];
    
    lootSection?.forEach((raid: any) => {
      raid.items?.forEach((item: any) => cats.add(item.category));
    });
    return Array.from(cats);
  }, [data]);

  const filteredLoot = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    
    // Safety search for the correct array item
    const lootRules = (data as any[]).find((section: any) => section["Reglas de Loteo"])?.["Reglas de Loteo"] || [];
    
    return lootRules.map((raid: any) => ({
      ...raid,
      items: (raid.items || []).filter((item: any) => {
        const matchesSearch = !searchTerm || 
          item.item.toLowerCase().includes(searchTerm.toLowerCase()) || 
          (item.requirement || []).some((req: any) => req.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesCategory = selectedCategory === "TODOS" || item.category === selectedCategory;
        
        return matchesSearch && matchesCategory;
      })
    })).filter((raid: any) => raid.items.length > 0);
  }, [data, searchTerm, selectedCategory]);

  const filteredBenefits = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    
    // Safety search for the correct array item
    const benefits = (data as any[]).find((section: any) => section["Beneficios"])?.["Beneficios"] || [];
    if (!searchTerm) return benefits;

    const term = searchTerm.toLowerCase();
    return benefits.map((cat: any) => ({
      ...cat,
      items: (cat.items || []).filter((item: any) => item.descripcion.toLowerCase().includes(term))
    })).filter((cat: any) => cat.items.length > 0);
    }, [data, searchTerm]);

    const filteredPenalties = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];

    // Safety search for the correct array item
    const penalties = (data as any[]).find((section: any) => section["Perjuicios"])?.["Perjuicios"] || [];

    if (!searchTerm) return penalties;

    const term = searchTerm.toLowerCase();
    return penalties.map((cat: any) => ({
      ...cat,
      items: (cat.items || []).filter((item: any) => item.descripcion.toLowerCase().includes(term))
    })).filter((cat: any) => cat.items.length > 0);
  }, [data, searchTerm]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
        <p className="text-slate-400 font-medium animate-pulse">Cargando normativas...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-200 p-4 md:p-8 lg:p-12 font-sans selection:bg-emerald-500/30">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Section */}
        <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 pb-6 border-b border-slate-800/60">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                <ScrollText className="text-emerald-400" size={28} />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 drop-shadow-sm leading-tight">
                  Reglas y Normativas
                </h1>
                {myCharacterName && myEP !== null && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded border border-blue-500/30 font-bold uppercase tracking-wider">
                      {myCharacterName}: {myEP.toLocaleString()} EP
                    </span>
                  </div>
                )}
              </div>
            </div>
            <p className="text-slate-400 text-sm md:text-base max-w-2xl">
              Consulta las reglas de loteo, requisitos de items BIS y el sistema de bonificaciones y penalizaciones.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
            {/* Tabs */}
            <div className="flex bg-slate-900/80 p-1.5 rounded-xl border border-slate-700/60 shadow-inner w-full sm:w-auto">
              <button
                onClick={() => { setActiveTab("loot"); setSearchTerm(""); }}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === "loot" 
                    ? "bg-slate-800 text-emerald-400 shadow-md border border-slate-700/50" 
                    : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
                }`}
              >
                <Trophy size={16} /> Loteo
              </button>
              <button
                onClick={() => { setActiveTab("benefits"); setSearchTerm(""); }}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === "benefits" 
                    ? "bg-slate-800 text-emerald-400 shadow-md border border-slate-700/50" 
                    : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
                }`}
              >
                <TrendingUp size={16} /> Beneficios
              </button>
              <button
                onClick={() => { setActiveTab("penalties"); setSearchTerm(""); }}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === "penalties" 
                    ? "bg-slate-800 text-emerald-400 shadow-md border border-slate-700/50" 
                    : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
                }`}
              >
                <TrendingDown size={16} /> Perjuicios
              </button>
            </div>

            <div className="relative group w-full sm:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900/80 border border-slate-700/60 rounded-xl py-2 pl-9 pr-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all shadow-inner"
              />
            </div>
          </div>
        </header>

        {/* Categories / Filter Bar */}
        {activeTab === "loot" && (
          <div className="flex flex-wrap items-center gap-2 pb-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mr-2">Filtrar Categoría:</span>
            {categories.map((cat: any) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border ${
                  selectedCategory === cat
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.1)]"
                    : "bg-slate-900/50 text-slate-500 border-slate-800 hover:border-slate-700 hover:text-slate-300"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Content Area */}
        <div className="space-y-6">
          {activeTab === "loot" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {filteredLoot.map((raidRule: any) => (
                <section key={raidRule.raid} className="bg-slate-900/40 rounded-2xl border border-slate-800/60 overflow-hidden shadow-xl backdrop-blur-sm">
                  <button 
                    onClick={() => toggleRaid(raidRule.raid)}
                    className="w-full flex items-center justify-between p-4 md:p-6 bg-slate-950/40 hover:bg-slate-900/60 transition-colors text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                        <Shield className="text-emerald-400" size={20} />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-slate-100">{raidRule.raid}</h2>
                        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Reglas de Loteo Heroico</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="hidden sm:inline-block text-[10px] font-bold text-slate-500 bg-slate-900/80 px-2 py-1 rounded border border-slate-800">
                        {raidRule.items.length} ÍTEMS
                      </span>
                      {expandedRaids.has(raidRule.raid) ? <ChevronUp className="text-slate-500" /> : <ChevronDown className="text-slate-500" />}
                    </div>
                  </button>

                  {expandedRaids.has(raidRule.raid) && (
                    <div className="p-4 md:p-6 space-y-4 animate-in slide-in-from-top-2 duration-200">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {raidRule.items.map((item: any, idx: number) => {
                          const isBIS = item.category.includes("BIS") || item.category.includes("ARMAS LK") || item.category.includes("MONTURA");
                          const canAfford = myEP !== null ? myEP >= item.valueMin : null;
                          
                          return (
                            <div key={idx} className={`relative bg-slate-950/60 rounded-xl border p-4 transition-all group shadow-sm overflow-hidden ${
                              isBIS ? 'border-orange-500/30 hover:border-orange-500/50' : 'border-slate-800/80 hover:border-emerald-500/30'
                            }`}>
                              {isBIS && (
                                <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 blur-2xl rounded-full -mr-10 -mt-10 pointer-events-none" />
                              )}
                              
                              <div className="flex gap-4 relative z-10">
                                <a 
                                  href={`https://wotlk.ultimowow.com/?search=${encodeURIComponent(item.item)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-14 h-14 rounded-lg overflow-hidden border-2 border-slate-800 group-hover:border-emerald-500/40 transition-colors bg-slate-900 shrink-0 relative"
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={item.icon} alt={item.item} className="w-full h-full object-cover" />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <ExternalLink size={14} className="text-white" />
                                  </div>
                                </a>
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex justify-between items-start mb-1">
                                    <h3 className={`font-bold text-base truncate pr-2 ${isBIS ? 'text-orange-400' : 'text-emerald-400'}`}>
                                      {item.item}
                                    </h3>
                                    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded border ${
                                      canAfford === true ? 'bg-green-500/10 border-green-500/20 text-green-400' : 
                                      canAfford === false ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                                      'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                                    }`}>
                                      <Coins size={12} />
                                      <span className="text-xs font-bold">{item.valueMin}</span>
                                      {canAfford === true && <CheckCircle2 size={10} />}
                                      {canAfford === false && <XCircle size={10} />}
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                      isBIS ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-slate-800 text-slate-400'
                                    }`}>
                                      {item.category}
                                    </span>
                                  </div>
                                  
                                  {item.requirement.length > 0 ? (
                                    <div className="space-y-1.5">
                                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                                        <Info size={10} /> Requisitos de Loteo:
                                      </div>
                                      <ul className="space-y-1">
                                        {item.requirement.map((req: any, rIdx: number) => (
                                          <li key={rIdx} className="text-xs text-slate-300 flex items-start gap-2 leading-tight">
                                            <div className={`w-1 h-1 rounded-full mt-1.5 shrink-0 ${isBIS ? 'bg-orange-500' : 'bg-emerald-500'}`} />
                                            {req}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  ) : (
                                    <p className="text-[10px] text-slate-500 italic">Sin requisitos específicos para lootear.</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </section>
              ))}
            </div>
          )}

          {activeTab === "benefits" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
              {filteredBenefits.map((cat: any, idx: number) => (
                <div key={idx} className="bg-slate-900/40 rounded-2xl border border-slate-800/60 overflow-hidden shadow-xl backdrop-blur-sm flex flex-col">
                  <div className="p-4 bg-emerald-500/10 border-b border-slate-800/60 flex items-center gap-3">
                    <TrendingUp className="text-emerald-400" size={18} />
                    <h2 className="font-bold text-slate-100">{cat.category}</h2>
                  </div>
                  <div className="p-2 flex-1">
                    <table className="w-full text-left">
                      <tbody className="divide-y divide-slate-800/40">
                        {cat.items.map((item: any, iIdx: number) => (
                          <tr key={iIdx} className="hover:bg-emerald-500/5 transition-colors">
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-3">
                                {item.icon && (
                                  <div className="w-8 h-8 rounded border border-slate-700 overflow-hidden bg-slate-900 shrink-0">
                                    <img src={item.icon} alt="Icon" className="w-full h-full object-cover" />
                                  </div>
                                )}
                                <span className="text-sm text-slate-300 leading-tight">{item.descripcion}</span>
                              </div>
                            </td>
                            <td className="px-3 py-3 text-right">
                              <span className="font-mono font-bold text-emerald-400">+{item.valor}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "penalties" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
              {filteredPenalties.map((cat: any, idx: number) => (
                <div key={idx} className="bg-slate-900/40 rounded-2xl border border-slate-800/60 overflow-hidden shadow-xl backdrop-blur-sm flex flex-col">
                  <div className="p-4 bg-red-500/10 border-b border-slate-800/60 flex items-center gap-3">
                    <AlertTriangle className="text-red-400" size={18} />
                    <h2 className="font-bold text-slate-100">{cat.category}</h2>
                  </div>
                  <div className="p-2 flex-1">
                    <table className="w-full text-left">
                      <tbody className="divide-y divide-slate-800/40">
                        {cat.items.map((item: any, iIdx: number) => (
                          <tr key={iIdx} className="hover:bg-red-500/5 transition-colors">
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-3">
                                {item.icon && (
                                  <div className="w-8 h-8 rounded border border-slate-700 overflow-hidden bg-slate-900 shrink-0">
                                    <img src={item.icon} alt="Icon" className="w-full h-full object-cover" />
                                  </div>
                                )}
                                <span className="text-sm text-slate-300 leading-tight">{item.descripcion}</span>
                              </div>
                            </td>
                            <td className="px-3 py-3 text-right">
                              <span className="font-mono font-bold text-red-400">{item.valor}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
