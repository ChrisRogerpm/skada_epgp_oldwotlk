"use client";

import React, { useState, useEffect } from "react";
import { 
  Settings, Database, Save, AlertCircle, CheckCircle2, Loader2,
  FileText, Users, Trophy, Plus, X, Shield, TrendingUp, TrendingDown, Edit3, Search,
  ChevronDown, ChevronUp, Copy, LogOut, Lock, Mail, Trash2
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { 
  User 
} from "@supabase/supabase-js";
import clsx from "clsx";

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // Login states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Admin Panel states
  const [activeSection, setActiveSection] = useState<"skada" | "epgp" | "reglas">("reglas");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error", message: string } | null>(null);
  
  const [adminSearch, setAdminSearch] = useState("");
  const [expandedRaids, setExpandedRaids] = useState<Set<number>>(new Set([0]));

  const [lootRules, setLootRules] = useState<any[]>([]);
  const [benefits, setBenefits] = useState<any[]>([]);
  const [penalties, setPenalties] = useState<any[]>([]);

  const sections = [
    { id: "skada", label: "Logs Skada", icon: FileText, color: "text-blue-400" },
    { id: "epgp", label: "Sistema EPGP", icon: Users, color: "text-emerald-400" },
    { id: "reglas", label: "Reglas & Loot", icon: Trophy, color: "text-orange-400" },
  ];

  // Auth Observer
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user && activeSection === "reglas") {
      fetchRules();
    }
  }, [user, activeSection]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError("");
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    } catch (error: any) {
      console.log("Login error:", error.message);
      setLoginError(error.message || "Error al intentar iniciar sesión.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const fetchRules = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/reglas");
      const data = await res.json();
      
      const loot = data.find((s: any) => s["Reglas de Loteo"])?.["Reglas de Loteo"] || [];
      const bene = data.find((s: any) => s["Beneficios"])?.["Beneficios"] || [];
      const perj = data.find((s: any) => s["Perjuicios"])?.["Perjuicios"] || [];
      
      setLootRules(loot);
      setBenefits(bene);
      setPenalties(perj);
    } catch (error) {
      console.error("Error fetching rules:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveReglas = async () => {
    setIsSaving(true);
    setStatus(null);
    try {
      // 1. Borrar reglas anteriores para un guardado limpio (opcional pero recomendado para sync completo)
      await supabase.from('reglas_loteo').delete().neq('id', -1);
      await supabase.from('reglas_puntos').delete().neq('id', -1);
      
      // 2. Guardar reglas de loteo
      const { error: lootError } = await supabase
        .from('reglas_loteo')
        .insert(lootRules.map((r, i) => ({ 
          id: i + 1, 
          raid: r.raid, 
          items: r.items 
        })));
      
      if (lootError) throw lootError;

      // 3. Guardar puntos (beneficios y perjuicios)
      const formattedPoints = [
        ...benefits.map((b, i) => ({ 
          id: i + 1, 
          tipo: 'beneficio', 
          category: b.category, 
          items: b.items 
        })),
        ...penalties.map((p, i) => ({ 
          id: benefits.length + i + 1, 
          tipo: 'perjuicio', 
          category: p.category, 
          items: p.items 
        }))
      ];

      const { error: pointsError } = await supabase
        .from('reglas_puntos')
        .insert(formattedPoints);

      if (pointsError) throw pointsError;
      
      setStatus({ type: "success", message: "Reglas actualizadas minuciosamente en Supabase" });
      setTimeout(() => setStatus(null), 5000);
    } catch (error: any) {
      console.error("Error al guardar reglas:", error);
      setStatus({ type: "error", message: "Error al guardar: " + error.message });
    } finally {
      setIsSaving(false);
    }
  };

  // Logic functions
  const addRaid = () => {
    setLootRules([{ raid: "Nueva Raid", items: [] }, ...lootRules]);
    setExpandedRaids(new Set([0, ...Array.from(expandedRaids).map(i => i + 1)]));
  };

  const toggleRaidExpand = (index: number) => {
    const next = new Set(expandedRaids);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    setExpandedRaids(next);
  };

  const addItemToRaid = (raidIndex: number) => {
    const newLoot = [...lootRules];
    newLoot[raidIndex].items.push({
      category: "ITEM BIS",
      item: "Nuevo Ítem",
      requirement: [],
      valueMin: 100,
      icon: "https://wow.zamimg.com/images/wow/icons/large/inv_misc_questionmark.jpg"
    });
    setLootRules(newLoot);
  };

  const cloneItem = (raidIndex: number, itemIndex: number) => {
    const newLoot = [...lootRules];
    const itemToClone = { ...newLoot[raidIndex].items[itemIndex] };
    itemToClone.item = `${itemToClone.item} (Copia)`;
    newLoot[raidIndex].items.splice(itemIndex + 1, 0, itemToClone);
    setLootRules(newLoot);
  };

  const updateItem = (raidIndex: number, itemIndex: number, field: string, value: any) => {
    const newLoot = [...lootRules];
    if (field === "requirement") {
      newLoot[raidIndex].items[itemIndex][field] = value.split("\n").filter((s: string) => s.trim() !== "");
    } else {
      newLoot[raidIndex].items[itemIndex][field] = value;
    }
    setLootRules(newLoot);
  };

  const removeItem = (raidIndex: number, itemIndex: number) => {
    if (!confirm("¿Eliminar este ítem?")) return;
    const newLoot = [...lootRules];
    newLoot[raidIndex].items = newLoot[raidIndex].items.filter((_: any, i: number) => i !== itemIndex);
    setLootRules(newLoot);
  };

  const updateBenePenSection = (type: "benefits" | "penalties", index: number, field: string, value: any) => {
    const setter = type === "benefits" ? setBenefits : setPenalties;
    const data = type === "benefits" ? [...benefits] : [...penalties];
    data[index][field] = value;
    setter(data);
  };

  const addBenePenItem = (type: "benefits" | "penalties", catIndex: number) => {
    const setter = type === "benefits" ? setBenefits : setPenalties;
    const data = type === "benefits" ? [...benefits] : [...penalties];
    data[catIndex].items.push({
      descripcion: type === "benefits" ? "Nuevo Beneficio" : "Nuevo Perjuicio",
      valor: type === "benefits" ? 50 : -50,
      icon: type === "benefits" ? "https://wow.zamimg.com/images/wow/icons/large/inv_misc_coin_02.jpg" : "https://wow.zamimg.com/images/wow/icons/large/inv_misc_head_orc_01.jpg"
    });
    setter(data);
  };

  const filteredLootRules = React.useMemo(() => {
    if (!adminSearch) return lootRules;
    const term = adminSearch.toLowerCase();
    return lootRules.map(raid => ({
      ...raid,
      items: raid.items.filter((item: any) => 
        item.item.toLowerCase().includes(term) || 
        item.category.toLowerCase().includes(term) ||
        raid.raid.toLowerCase().includes(term)
      )
    })).filter(raid => raid.items.length > 0 || raid.raid.toLowerCase().includes(term));
  }, [lootRules, adminSearch]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
        <p className="text-slate-500 font-bold tracking-widest text-xs uppercase animate-pulse">Verificando sesión...</p>
      </div>
    );
  }

  // LOGIN SCREEN
  if (!user) {
    return (
      <main className="min-h-screen bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-200 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-500">
          <div className="text-center space-y-2">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl border border-emerald-500/20 flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
              <Settings className="text-emerald-400" size={40} />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase">Panel Admin</h1>
            <p className="text-slate-500 text-sm font-medium">Ingresa tus credenciales de Old Legends</p>
          </div>

          <form onSubmit={handleLogin} className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/60 p-8 rounded-3xl shadow-2xl space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email de acceso</label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-400 transition-colors" size={18} />
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="correo@ejemplo.com"
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 transition-all text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Contraseña</label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-400 transition-colors" size={18} />
                  <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 transition-all text-white"
                  />
                </div>
              </div>
            </div>

            {loginError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold flex items-center gap-2 animate-shake">
                <AlertCircle size={14} />
                {loginError}
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoggingIn}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black py-3 rounded-xl transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
            >
              {isLoggingIn ? <Loader2 className="animate-spin" size={18} /> : "Iniciar Sesión"}
            </button>
          </form>

          <p className="text-center text-[10px] text-slate-600 font-bold uppercase tracking-widest">
            Acceso restringido solo para personal autorizado
          </p>
        </div>
      </main>
    );
  }

  // MAIN ADMIN PANEL
  return (
    <main className="min-h-screen bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-200 p-4 md:p-8 lg:p-12 font-sans relative">
      
      {/* Floating Save Button */}
      <div className="fixed bottom-8 right-8 z-50 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <button
          onClick={handleSaveReglas}
          disabled={isSaving || isLoading}
          className="flex items-center gap-3 px-6 py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-2xl font-bold transition-all shadow-2xl shadow-emerald-500/20 group border border-emerald-400/20"
        >
          {isSaving ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} className="group-hover:scale-110 transition-transform" />}
          <span className="hidden md:inline">{isSaving ? "Guardando..." : "Guardar Cambios"}</span>
        </button>
      </div>

      <div className="max-w-7xl mx-auto space-y-8 pb-20">
        
        {/* Header */}
        <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 pb-6 border-b border-slate-800/60">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
              <Settings className="text-emerald-400" size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white">Portal Administrativo</h1>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-slate-400 text-xs font-medium">{user.email}</p>
                <button onClick={handleLogout} className="text-slate-600 hover:text-red-400 transition-colors ml-2 flex items-center gap-1 text-[10px] font-black uppercase tracking-tighter">
                  <LogOut size={12} /> Salir
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
            <div className="relative w-full sm:w-80 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors" size={18} />
              <input 
                type="text"
                placeholder="Buscar en el editor..."
                value={adminSearch}
                onChange={(e) => setAdminSearch(e.target.value)}
                className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all"
              />
            </div>
          </div>
        </header>

        {status && (
          <div className={clsx(
            "p-4 rounded-xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-2",
            status.type === "success" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"
          )}>
            {status.type === "success" ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            <p className="font-medium text-sm">{status.message}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          
          <aside className="lg:col-span-1 space-y-2 lg:sticky lg:top-24 h-fit">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-4 mb-2">Secciones</p>
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => { setActiveSection(section.id as any); setAdminSearch(""); }}
                className={clsx(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all border",
                  activeSection === section.id ? "bg-slate-900 text-white border-slate-700 shadow-lg" : "text-slate-500 hover:text-slate-300 hover:bg-slate-900/40 border-transparent"
                )}
              >
                <section.icon className={activeSection === section.id ? section.color : ""} size={18} />
                {section.label}
              </button>
            ))}
          </aside>

          <div className="lg:col-span-4 space-y-8">
            {activeSection === "reglas" ? (
              <div className="space-y-10 animate-in fade-in duration-500">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-32 space-y-4">
                    <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
                    <p className="text-slate-500 font-bold tracking-widest text-xs uppercase animate-pulse">Consultando Firestore...</p>
                  </div>
                ) : (
                  <>
                    {/* LOTEO SECTION */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Trophy className="text-orange-400" size={24} />
                          <h2 className="text-xl font-black text-white uppercase tracking-tight">Reglas de Loteo</h2>
                        </div>
                        <button onClick={addRaid} className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 rounded-xl text-xs font-black border border-orange-500/30 transition-all uppercase">
                          <Plus size={16} /> Nueva Raid
                        </button>
                      </div>

                      <div className="space-y-4">
                        {filteredLootRules.map((raid, rIdx) => {
                          const isExpanded = expandedRaids.has(rIdx);
                          return (
                            <div key={rIdx} className="bg-slate-900/40 rounded-2xl border border-slate-800/60 overflow-hidden transition-all duration-300 hover:border-slate-700/80 shadow-xl">
                              <div 
                                onClick={() => toggleRaidExpand(rIdx)}
                                className="p-4 md:p-5 bg-slate-950/40 border-b border-slate-800/60 flex items-center justify-between cursor-pointer group"
                              >
                                <div className="flex items-center gap-4 flex-1">
                                  <div className={clsx("p-2 rounded-lg transition-colors", isExpanded ? "bg-orange-500/20 text-orange-400" : "bg-slate-800 text-slate-500")}>
                                    <Shield size={18} />
                                  </div>
                                  <input 
                                    value={raid.raid}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) => {
                                      const nl = [...lootRules];
                                      nl[rIdx].raid = e.target.value;
                                      setLootRules(nl);
                                    }}
                                    className="bg-transparent border-none text-lg font-bold text-white focus:ring-0 outline-none w-full max-w-md p-0 placeholder-slate-700"
                                    placeholder="Nombre de la Raid"
                                  />
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-[10px] font-bold text-slate-600 bg-slate-900 px-2 py-1 rounded border border-slate-800 uppercase tracking-tighter">
                                    {raid.items.length} ítems
                                  </span>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); if(confirm("¿Eliminar toda la raid?")) setLootRules(lootRules.filter((_, i) => i !== rIdx)); }}
                                    className="p-2 text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                  {isExpanded ? <ChevronUp className="text-slate-500" /> : <ChevronDown className="text-slate-500" />}
                                </div>
                              </div>

                              {isExpanded && (
                                <div className="p-4 md:p-6 space-y-4 animate-in slide-in-from-top-2 duration-300">
                                  <div className="grid grid-cols-1 gap-4">
                                    {raid.items.map((item: any, iIdx: number) => (
                                      <div key={iIdx} className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-start group/item hover:border-slate-700 transition-colors shadow-inner">
                                        <div className="md:col-span-1">
                                          <div className="relative group/icon cursor-pointer">
                                            <img 
                                              src={item.icon} 
                                              alt="icon" 
                                              className="w-12 h-12 rounded-lg border-2 border-slate-800 mx-auto object-cover bg-slate-900 group-hover/icon:border-emerald-500 transition-all" 
                                              onError={(e) => {(e.target as HTMLImageElement).src = "https://wow.zamimg.com/images/wow/icons/large/inv_misc_questionmark.jpg"}}
                                            />
                                            <div className="absolute -top-1 -right-1 bg-slate-900 rounded-full p-1 border border-slate-700 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                              <Edit3 size={10} className="text-slate-400" />
                                            </div>
                                          </div>
                                        </div>
                                        <div className="md:col-span-3 space-y-2">
                                          <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block">Ítem & Icono</label>
                                          <input value={item.item} onChange={(e) => updateItem(rIdx, iIdx, "item", e.target.value)} className="bg-slate-900/80 border border-slate-700/50 rounded-lg px-3 py-1.5 text-xs w-full text-white font-bold focus:border-emerald-500 outline-none" />
                                          <input 
                                            value={item.icon} 
                                            onChange={(e) => updateItem(rIdx, iIdx, "icon", e.target.value)}
                                            placeholder="URL del Icono"
                                            className="bg-slate-900/30 border border-slate-800 rounded px-2 py-1 text-[9px] w-full text-slate-500 focus:text-slate-300 outline-none font-mono"
                                          />
                                        </div>
                                        <div className="md:col-span-2 space-y-2">
                                          <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block">Categoría</label>
                                          <input value={item.category} onChange={(e) => updateItem(rIdx, iIdx, "category", e.target.value)} className="bg-slate-900/80 border border-slate-700/50 rounded-lg px-3 py-1.5 text-xs w-full text-slate-400 uppercase font-bold focus:border-emerald-500 outline-none" />
                                          <div className="flex items-center gap-2">
                                            <div className="flex-1">
                                              <label className="text-[9px] font-bold text-slate-700 uppercase block mb-1">EP Mínimo</label>
                                              <input type="number" value={item.valueMin} onChange={(e) => updateItem(rIdx, iIdx, "valueMin", parseInt(e.target.value))} className="bg-slate-900/80 border border-slate-700/50 rounded-lg px-3 py-1.5 text-xs w-full text-emerald-400 font-black focus:border-emerald-500 outline-none" />
                                            </div>
                                          </div>
                                        </div>
                                        <div className="md:col-span-5 space-y-2">
                                          <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block">Requisitos de Loteo</label>
                                          <textarea 
                                            value={item.requirement.join("\n")} 
                                            onChange={(e) => updateItem(rIdx, iIdx, "requirement", e.target.value)} 
                                            rows={3} 
                                            placeholder="Escribe un requisito por línea..."
                                            className="bg-slate-900/80 border border-slate-700/50 rounded-lg px-3 py-2 text-xs w-full text-slate-300 resize-none focus:border-emerald-500 outline-none leading-relaxed" 
                                          />
                                        </div>
                                        <div className="md:col-span-1 flex flex-row md:flex-col justify-center items-center gap-2 h-full pt-4 md:pt-6">
                                          <button onClick={() => cloneItem(rIdx, iIdx)} title="Duplicar ítem" className="p-2 text-slate-600 hover:text-cyan-400 transition-colors bg-slate-900/50 rounded-lg border border-slate-800 hover:border-cyan-500/30">
                                            <Copy size={14} />
                                          </button>
                                          <button onClick={() => removeItem(rIdx, iIdx)} title="Eliminar ítem" className="p-2 text-slate-600 hover:text-red-400 transition-colors bg-slate-900/50 rounded-lg border border-slate-800 hover:border-red-500/30">
                                            <Trash2 size={14} />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                    <button 
                                      onClick={() => addItemToRaid(rIdx)} 
                                      className="w-full py-4 border-2 border-dashed border-slate-800 hover:border-emerald-500/40 rounded-xl text-slate-600 hover:text-emerald-400 hover:bg-emerald-500/5 transition-all group"
                                    >
                                      <div className="flex items-center justify-center gap-2">
                                        <Plus size={18} className="group-hover:scale-125 transition-transform" />
                                        <span className="text-xs font-black uppercase tracking-widest">Añadir nuevo ítem a {raid.raid}</span>
                                      </div>
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* BENE/PEN SECTIONS */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 pt-6">
                      {/* BENEFICIOS */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <TrendingUp className="text-emerald-400" size={22} />
                            <h2 className="text-lg font-black text-white uppercase tracking-tight">Beneficios</h2>
                          </div>
                          <button onClick={() => setBenefits([...benefits, { category: "Nueva Categoría", items: [] }])} className="p-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-xl border border-emerald-500/30 transition-all">
                            <Plus size={16} />
                          </button>
                        </div>
                        <div className="space-y-4">
                          {benefits.map((cat, cIdx) => (
                            <div key={cIdx} className="bg-slate-900/40 rounded-2xl border border-slate-800/60 p-4 space-y-4 shadow-lg">
                              <div className="flex items-center gap-3">
                                <input value={cat.category} onChange={(e) => updateBenePenSection("benefits", cIdx, "category", e.target.value)} className="bg-slate-950/60 border border-slate-700/50 rounded-lg px-3 py-1.5 text-sm font-black text-white w-full focus:border-emerald-500 outline-none" />
                                <button onClick={() => setBenefits(benefits.filter((_, i) => i !== cIdx))} className="p-2 text-slate-600 hover:text-red-400 transition-colors">
                                  <Trash2 size={16} />
                                </button>
                              </div>
                              <div className="space-y-2">
                                {cat.items.map((item: any, iIdx: number) => (
                                  <div key={iIdx} className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-3 space-y-3 group/bene">
                                    <div className="flex items-center gap-3">
                                      <div className="relative group/icon shrink-0">
                                        <img 
                                          src={item.icon} 
                                          alt="icon" 
                                          className="w-10 h-10 rounded-lg border border-slate-800 object-cover bg-slate-900" 
                                          onError={(e) => {(e.target as HTMLImageElement).src = "https://wow.zamimg.com/images/wow/icons/large/inv_misc_questionmark.jpg"}}
                                        />
                                      </div>
                                      <div className="flex-1 min-w-0 space-y-1">
                                        <input value={item.descripcion} onChange={(e) => {
                                          const nd = [...benefits];
                                          nd[cIdx].items[iIdx].descripcion = e.target.value;
                                          setBenefits(nd);
                                        }} placeholder="Descripción" className="bg-transparent border-none text-xs w-full text-slate-200 focus:ring-0 outline-none font-bold" />
                                        <input value={item.icon} onChange={(e) => {
                                          const nd = [...benefits];
                                          nd[cIdx].items[iIdx].icon = e.target.value;
                                          setBenefits(nd);
                                        }} placeholder="URL del icono" className="bg-transparent border-none text-[9px] w-full text-slate-500 focus:ring-0 outline-none font-mono" />
                                      </div>
                                      <div className="shrink-0 flex flex-col items-end gap-2">
                                        <input type="number" value={item.valor} onChange={(e) => {
                                          const nd = [...benefits];
                                          nd[cIdx].items[iIdx].valor = parseInt(e.target.value);
                                          setBenefits(nd);
                                        }} className="bg-slate-900 border border-slate-700/50 rounded px-2 py-1 text-xs w-16 text-emerald-400 font-bold text-right outline-none" />
                                        <button onClick={() => {
                                          const nd = [...benefits];
                                          nd[cIdx].items = nd[cIdx].items.filter((_: any, i: number) => i !== iIdx);
                                          setBenefits(nd);
                                        }} className="text-slate-700 hover:text-red-400 opacity-0 group-hover/bene:opacity-100 transition-opacity">
                                          <X size={14} />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                                <button onClick={() => addBenePenItem("benefits", cIdx)} className="w-full py-2 border border-dashed border-slate-800 rounded-xl text-[10px] font-bold text-slate-600 hover:text-emerald-400 hover:border-emerald-500/30 transition-all uppercase tracking-widest">
                                  + Añadir Item
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* PERJUICIOS */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <TrendingDown className="text-red-400" size={22} />
                            <h2 className="text-lg font-black text-white uppercase tracking-tight">Perjuicios</h2>
                          </div>
                          <button onClick={() => setPenalties([...penalties, { category: "Nueva Categoría", items: [] }])} className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl border border-red-500/30 transition-all">
                            <Plus size={16} />
                          </button>
                        </div>
                        <div className="space-y-4">
                          {penalties.map((cat, cIdx) => (
                            <div key={cIdx} className="bg-slate-900/40 rounded-2xl border border-slate-800/60 p-4 space-y-4 shadow-lg">
                              <div className="flex items-center gap-3">
                                <input value={cat.category} onChange={(e) => updateBenePenSection("penalties", cIdx, "category", e.target.value)} className="bg-slate-950/60 border border-slate-700/50 rounded-lg px-3 py-1.5 text-sm font-black text-white w-full focus:border-emerald-500 outline-none" />
                                <button onClick={() => setPenalties(penalties.filter((_, i) => i !== cIdx))} className="p-2 text-slate-600 hover:text-red-400 transition-colors">
                                  <Trash2 size={16} />
                                </button>
                              </div>
                              <div className="space-y-2">
                                {cat.items.map((item: any, iIdx: number) => (
                                  <div key={iIdx} className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-3 space-y-3 group/perj">
                                    <div className="flex items-center gap-3">
                                      <div className="relative group/icon shrink-0">
                                        <img 
                                          src={item.icon} 
                                          alt="icon" 
                                          className="w-10 h-10 rounded-lg border border-slate-800 object-cover bg-slate-900" 
                                          onError={(e) => {(e.target as HTMLImageElement).src = "https://wow.zamimg.com/images/wow/icons/large/inv_misc_questionmark.jpg"}}
                                        />
                                      </div>
                                      <div className="flex-1 min-w-0 space-y-1">
                                        <input value={item.descripcion} onChange={(e) => {
                                          const nd = [...penalties];
                                          nd[cIdx].items[iIdx].descripcion = e.target.value;
                                          setPenalties(nd);
                                        }} placeholder="Descripción" className="bg-transparent border-none text-xs w-full text-slate-200 focus:ring-0 outline-none font-bold" />
                                        <input value={item.icon} onChange={(e) => {
                                          const nd = [...penalties];
                                          nd[cIdx].items[iIdx].icon = e.target.value;
                                          setPenalties(nd);
                                        }} placeholder="URL del icono" className="bg-transparent border-none text-[9px] w-full text-slate-500 focus:ring-0 outline-none font-mono" />
                                      </div>
                                      <div className="shrink-0 flex flex-col items-end gap-2">
                                        <input type="number" value={item.valor} onChange={(e) => {
                                          const nd = [...penalties];
                                          nd[cIdx].items[iIdx].valor = parseInt(e.target.value);
                                          setPenalties(nd);
                                        }} className="bg-slate-900 border border-slate-700/50 rounded px-2 py-1 text-xs w-16 text-red-400 font-bold text-right outline-none" />
                                        <button onClick={() => {
                                          const nd = [...penalties];
                                          nd[cIdx].items = nd[cIdx].items.filter((_: any, i: number) => i !== iIdx);
                                          setPenalties(nd);
                                        }} className="text-slate-700 hover:text-red-400 opacity-0 group-hover/perj:opacity-100 transition-opacity">
                                          <X size={14} />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                                <button onClick={() => addBenePenItem("penalties", cIdx)} className="w-full py-2 border border-dashed border-slate-800 rounded-xl text-[10px] font-bold text-slate-600 hover:text-red-400 hover:border-red-500/30 transition-all uppercase tracking-widest">
                                  + Añadir Item
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="bg-slate-900/40 rounded-2xl border border-slate-800/60 p-16 text-center animate-in fade-in duration-500 shadow-2xl backdrop-blur-md">
                <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-800 shadow-inner">
                  <Database className="text-slate-700" size={40} />
                </div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Módulo en Desarrollo</h2>
                <p className="text-slate-500 max-w-sm mx-auto text-sm leading-relaxed">
                  Estamos trabajando para integrar el procesamiento automático de logs de {activeSection}. Pronto podrás subir tus archivos exportados directamente.
                </p>
                <div className="mt-8 flex justify-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500/40 animate-pulse" />
                  <div className="w-2 h-2 rounded-full bg-emerald-500/40 animate-pulse delay-75" />
                  <div className="w-2 h-2 rounded-full bg-emerald-500/40 animate-pulse delay-150" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
