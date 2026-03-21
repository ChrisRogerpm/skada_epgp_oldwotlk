"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Settings, Database, Save, AlertCircle, CheckCircle2, Loader2,
  FileText, Users, Trophy, Plus, X, Shield, TrendingUp, TrendingDown, Edit3, Search,
  ChevronDown, ChevronUp, Copy, LogOut, Lock, Mail, Trash2, LayoutDashboard, ExternalLink
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
  const [activeReglasTab, setActiveReglasTab] = useState<"loteo" | "beneficios" | "sanciones">("loteo");

  const [lootRules, setLootRules] = useState<any[]>([]);
  const [benefits, setBenefits] = useState<any[]>([]);
  const [penalties, setPenalties] = useState<any[]>([]);
  
  // Ref to track if data has been fetched to avoid multiple calls
  const fetchedRef = useRef(false);

  const sections = [
    { id: "reglas", label: "Reglas & Loot", icon: Trophy, color: "text-orange-400" },
    { id: "epgp", label: "Sistema EPGP", icon: Users, color: "text-emerald-400" },
    { id: "skada", label: "Logs Skada", icon: FileText, color: "text-blue-400" },
  ];

  // Auth Observer
  useEffect(() => {
    // Single subscription to auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setAuthLoading(false);
      
      // Reset fetched ref if user logs out
      if (!currentUser) {
        fetchedRef.current = false;
      }
    });

    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
      }
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Optimized fetch rules effect
  useEffect(() => {
    // Only fetch if we have a user, we are in the right section, 
    // AND we haven't fetched successfully yet in this mount cycle
    if (user && activeSection === "reglas" && !fetchedRef.current && !isLoading) {
      fetchRules();
    }
  }, [user?.id, activeSection]); // Use user.id instead of user object to avoid ref-change triggers

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
      // Reset ref on successful login to ensure fresh data
      fetchedRef.current = false;
    } catch (error: any) {
      setLoginError(error.message || "Error al intentar iniciar sesión.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      fetchedRef.current = false;
      setLootRules([]);
      setBenefits([]);
      setPenalties([]);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const fetchRules = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const res = await fetch("/api/reglas");
      if (!res.ok) throw new Error("Error al obtener reglas");
      const data = await res.json();
      
      const loot = data.find((s: any) => s["Reglas de Loteo"])?.["Reglas de Loteo"] || [];
      const bene = data.find((s: any) => s["Beneficios"])?.["Beneficios"] || [];
      const perj = data.find((s: any) => s["Perjuicios"])?.["Perjuicios"] || [];
      
      setLootRules(loot);
      setBenefits(bene);
      setPenalties(perj);
      fetchedRef.current = true;
    } catch (error) {
      console.error("Error fetching rules:", error);
      setStatus({ type: "error", message: "Error al cargar datos del servidor" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveReglas = async () => {
    setIsSaving(true);
    setStatus(null);
    console.log("Iniciando guardado de reglas...");

    try {
      // 1. Borrar reglas anteriores con filtros basados en columnas que sí existen
      // Usamos 'raid' para reglas_loteo y 'tipo' para reglas_puntos
      const { error: delLootError } = await supabase.from('reglas_loteo').delete().not('raid', 'is', null);
      if (delLootError) {
        console.error("Error al borrar reglas_loteo:", delLootError);
        throw new Error(`Error al limpiar Loteo: ${delLootError.message || delLootError.code || JSON.stringify(delLootError)}`);
      }

      const { error: delPointsError } = await supabase.from('reglas_puntos').delete().not('tipo', 'is', null);
      if (delPointsError) {
        console.error("Error al borrar reglas_puntos:", delPointsError);
        throw new Error(`Error al limpiar Bonos/Sanciones: ${delPointsError.message || delPointsError.code || JSON.stringify(delPointsError)}`);
      }
      
      // 2. Guardar reglas de loteo
      const flatLootItems = lootRules.flatMap(raid => 
        raid.items.map((item: any) => ({
          raid: raid.raid,
          categoria_item: item.category,
          nombre_item: item.item,
          requisitos: item.requirement,
          valor_minimo: item.valueMin,
          icon_url: item.icon
        }))
      );

      if (flatLootItems.length > 0) {
        const { error: lootInsertError } = await supabase
          .from('reglas_loteo')
          .insert(flatLootItems);
        
        if (lootInsertError) {
          console.error("Error al insertar en reglas_loteo:", lootInsertError);
          throw lootInsertError;
        }
      }

      // 3. Guardar puntos (beneficios y perjuicios)
      const formattedPoints = [
        ...benefits.flatMap(b => b.items.map((item: any) => ({
          tipo: 'beneficio',
          categoria: b.category,
          descripcion: item.descripcion,
          valor: item.valor,
          icon_url: item.icon
        }))),
        ...penalties.flatMap(p => p.items.map((item: any) => ({
          tipo: 'perjuicio',
          categoria: p.category,
          descripcion: item.descripcion,
          valor: item.valor,
          icon_url: item.icon
        })))
      ];

      if (formattedPoints.length > 0) {
        const { error: pointsError } = await supabase
          .from('reglas_puntos')
          .insert(formattedPoints);

        if (pointsError) {
          console.error("Error al insertar en reglas_puntos:", pointsError);
          throw pointsError;
        }
      }
      
      setStatus({ type: "success", message: "Cambios guardados correctamente en la base de datos" });
      setTimeout(() => setStatus(null), 5000);
    } catch (error: any) {
      console.error("Error crítico detallado:", error);
      const errorMessage = error.message || (typeof error === 'object' ? JSON.stringify(error) : String(error));
      setStatus({ type: "error", message: "Error al guardar: " + errorMessage });
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
    setLootRules(prev => {
      const newList = [...prev];
      newList[raidIndex] = {
        ...newList[raidIndex],
        items: [
          ...newList[raidIndex].items,
          {
            category: "ITEM BIS",
            item: "Nuevo Ítem",
            requirement: [],
            valueMin: 100,
            icon: "https://wow.zamimg.com/images/wow/icons/large/inv_misc_questionmark.jpg"
          }
        ]
      };
      return newList;
    });
  };

  const cloneItem = (raidIndex: number, itemIndex: number) => {
    setLootRules(prev => {
      const newList = [...prev];
      const items = [...newList[raidIndex].items];
      const itemToClone = JSON.parse(JSON.stringify(items[itemIndex]));
      itemToClone.item = `${itemToClone.item} (Copia)`;
      items.splice(itemIndex + 1, 0, itemToClone);
      newList[raidIndex] = { ...newList[raidIndex], items };
      return newList;
    });
  };

  const updateItem = (raidIndex: number, itemIndex: number, field: string, value: any) => {
    setLootRules(prev => {
      const newList = [...prev];
      const items = [...newList[raidIndex].items];
      let newValue = value;
      if (field === "requirement" && typeof value === "string") {
        newValue = value.split("\n").filter((s: string) => s.trim() !== "");
      }
      items[itemIndex] = { ...items[itemIndex], [field]: newValue };
      newList[raidIndex] = { ...newList[raidIndex], items };
      return newList;
    });
  };

  const removeItem = (raidIndex: number, itemIndex: number) => {
    setLootRules(prev => {
      const newList = [...prev];
      const items = newList[raidIndex].items.filter((_: any, i: number) => i !== itemIndex);
      newList[raidIndex] = { ...newList[raidIndex], items };
      return newList;
    });
  };

  const updateBenePenSection = (type: "benefits" | "penalties", index: number, field: string, value: any) => {
    const setter = type === "benefits" ? setBenefits : setPenalties;
    setter(prev => {
      const newData = [...prev];
      newData[index] = { ...newData[index], [field]: value };
      return newData;
    });
  };

  const addBenePenItem = (type: "benefits" | "penalties", catIndex: number) => {
    const setter = type === "benefits" ? setBenefits : setPenalties;
    setter(prev => {
      const newData = [...prev];
      const items = [...newData[catIndex].items, {
        descripcion: type === "benefits" ? "Nuevo Beneficio" : "Nuevo Perjuicio",
        valor: type === "benefits" ? 50 : -50,
        icon: type === "benefits" ? "https://wow.zamimg.com/images/wow/icons/large/inv_misc_coin_02.jpg" : "https://wow.zamimg.com/images/wow/icons/large/inv_misc_head_orc_01.jpg"
      }];
      newData[catIndex] = { ...newData[catIndex], items };
      return newData;
    });
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
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          <Settings className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-500 w-6 h-6" />
        </div>
        <div className="text-center space-y-2">
          <p className="text-white font-black tracking-widest text-sm uppercase">Cargando Sistema</p>
          <p className="text-slate-500 text-xs font-medium animate-pulse">Verificando credenciales de acceso...</p>
        </div>
      </div>
    );
  }

  // LOGIN SCREEN
  if (!user) {
    return (
      <main className="min-h-screen bg-slate-950 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-200 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-700">
          <div className="text-center space-y-4">
            <div className="w-24 h-24 bg-gradient-to-br from-emerald-500/20 to-teal-500/5 rounded-3xl border border-emerald-500/30 flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(16,185,129,0.15)] group hover:scale-105 transition-transform duration-500">
              <Shield className="text-emerald-400 group-hover:rotate-12 transition-transform duration-500" size={48} />
            </div>
            <div className="space-y-1">
              <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Panel Admin</h1>
              <p className="text-emerald-500/60 text-xs font-black uppercase tracking-[0.3em]">Gestión Old Legends</p>
            </div>
          </div>

          <div className="bg-slate-900/40 backdrop-blur-2xl border border-white/5 p-1 rounded-[2.5rem] shadow-2xl">
            <form onSubmit={handleLogin} className="bg-slate-900/40 border border-white/5 p-8 rounded-[2.2rem] space-y-6">
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Identificación</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-400 transition-colors" size={18} />
                    <input 
                      type="email" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@old-legends.com"
                      className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 transition-all text-white placeholder:text-slate-700"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Clave de Seguridad</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-400 transition-colors" size={18} />
                    <input 
                      type="password" 
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 transition-all text-white placeholder:text-slate-700"
                    />
                  </div>
                </div>
              </div>

              {loginError && (
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold flex items-center gap-3 animate-in slide-in-from-top-1">
                  <AlertCircle size={16} />
                  {loginError}
                </div>
              )}

              <button 
                type="submit" 
                disabled={isLoggingIn}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-3 uppercase tracking-widest text-xs group"
              >
                {isLoggingIn ? <Loader2 className="animate-spin" size={20} /> : (
                  <>
                    <span>Acceder al Portal</span>
                    <LayoutDashboard size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="flex flex-col items-center gap-4 pt-4">
            <p className="text-center text-[10px] text-slate-600 font-bold uppercase tracking-[0.2em]">
              Solo Oficiales Autorizados
            </p>
            <div className="flex gap-2">
              <div className="w-1 h-1 rounded-full bg-slate-800" />
              <div className="w-1 h-1 rounded-full bg-slate-800" />
              <div className="w-1 h-1 rounded-full bg-slate-800" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  // MAIN ADMIN PANEL
  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-emerald-500/30">
      
      {/* Floating Notifications (Toasts) */}
      {status && (
        <div className="fixed top-8 right-8 z-[100] w-full max-w-sm animate-in fade-in slide-in-from-right-8 duration-500">
          <div className={clsx(
            "p-5 rounded-3xl border shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-start gap-4 backdrop-blur-2xl",
            status.type === "success" 
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
              : "bg-red-500/10 border-red-500/20 text-red-400"
          )}>
            <div className={clsx(
              "p-2 rounded-xl shrink-0",
              status.type === "success" ? "bg-emerald-500/20" : "bg-red-500/20"
            )}>
              {status.type === "success" ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-sm uppercase tracking-tight">
                {status.type === "success" ? "¡Sincronización Exitosa!" : "Error de Sistema"}
              </p>
              <p className="text-xs opacity-80 font-medium leading-relaxed mt-1">
                {status.type === "success" ? "Los datos se han actualizado correctamente en la base de datos de Supabase." : status.message}
              </p>
            </div>
            <button 
              onClick={() => setStatus(null)} 
              className="p-1 hover:bg-white/10 rounded-lg transition-colors shrink-0"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-emerald-500/5 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] bg-blue-500/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[50%] h-[20%] bg-purple-500/5 rounded-full blur-[120px]" />
      </div>

      {/* Floating Save Button */}
      <div className="fixed bottom-8 right-8 z-50 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <button
          onClick={handleSaveReglas}
          disabled={isSaving || isLoading}
          className="flex items-center gap-3 px-8 py-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white rounded-3xl font-black transition-all shadow-2xl shadow-emerald-950/50 group border border-emerald-400/20 active:scale-95"
        >
          {isSaving ? (
            <Loader2 className="animate-spin" size={24} />
          ) : (
            <Save size={24} className="group-hover:scale-110 group-hover:rotate-6 transition-transform" />
          )}
          <span className="hidden md:inline uppercase tracking-widest text-xs">
            {isSaving ? "Guardando Cambios..." : "Guardar Todo"}
          </span>
        </button>
      </div>

      <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row min-h-screen relative">
        
        {/* Sidebar Navigation */}
        <aside className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-white/5 p-6 lg:p-8 space-y-10 lg:sticky lg:top-0 h-fit lg:h-screen flex flex-col backdrop-blur-md bg-slate-950/30">
          <div className="flex items-center gap-4 px-2">
            <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 shadow-inner">
              <Shield className="text-emerald-400" size={28} />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-black text-white tracking-tighter uppercase leading-none">Admin</h1>
              <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-widest truncate">Portal Old Legends</p>
            </div>
          </div>

          <nav className="space-y-2 flex-1">
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] px-4 mb-4">Sistemas</p>
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => { setActiveSection(section.id as any); setAdminSearch(""); }}
                className={clsx(
                  "w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-bold transition-all border group relative overflow-hidden",
                  activeSection === section.id 
                    ? "bg-white/[0.03] text-white border-white/10 shadow-xl" 
                    : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.02] border-transparent"
                )}
              >
                {activeSection === section.id && (
                  <div className={clsx("absolute left-0 top-0 bottom-0 w-1 bg-current opacity-60", section.color.replace("text-", "bg-"))} />
                )}
                <section.icon className={clsx("transition-transform duration-300 group-hover:scale-110", activeSection === section.id ? section.color : "text-slate-600")} size={20} />
                <span className="flex-1 text-left">{section.label}</span>
                {activeSection === section.id && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />}
              </button>
            ))}
          </nav>

          <div className="pt-6 border-t border-white/5 space-y-4">
            <div className="bg-slate-900/50 rounded-2xl p-4 border border-white/5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-xs font-black text-emerald-400 border border-white/5">
                {user.email?.[0].toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">{user.email}</p>
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-tighter">Administrador</p>
              </div>
            </div>
            <button 
              onClick={handleLogout} 
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[10px] font-black text-slate-500 hover:text-red-400 hover:bg-red-500/5 transition-all border border-transparent hover:border-red-500/10 uppercase tracking-widest"
            >
              <LogOut size={14} /> Cerrar Sesión
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 p-6 md:p-10 lg:p-12 space-y-10 overflow-x-hidden">
          
          {/* Top Bar */}
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 pb-8 border-b border-white/5">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-widest">Live System</span>
                <span className="text-slate-600">/</span>
                <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{sections.find(s => s.id === activeSection)?.label}</span>
              </div>
              <h2 className="text-3xl font-black text-white tracking-tighter uppercase">
                {activeSection === "reglas" ? "Editor de Reglas" : activeSection === "epgp" ? "Configuración EPGP" : "Gestión de Logs"}
              </h2>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors" size={18} />
                <input 
                  type="text"
                  placeholder="Filtrar por raid o ítem..."
                  value={adminSearch}
                  onChange={(e) => setAdminSearch(e.target.value)}
                  className="w-full md:w-80 bg-slate-900/50 border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 transition-all placeholder:text-slate-700 font-medium"
                />
              </div>
            </div>
          </header>

          {status && (
            <div className={clsx(
              "p-5 rounded-[2rem] border flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500 shadow-2xl",
              status.type === "success" 
                ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400" 
                : "bg-red-500/5 border-red-500/20 text-red-400"
            )}>
              <div className="flex items-center gap-4">
                <div className={clsx("p-2 rounded-xl", status.type === "success" ? "bg-emerald-500/20" : "bg-red-500/20")}>
                  {status.type === "success" ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                </div>
                <div>
                  <p className="font-black text-sm uppercase tracking-tight">{status.type === "success" ? "Operación Exitosa" : "Error de Sistema"}</p>
                  <p className="text-xs opacity-80 font-medium">{status.message}</p>
                </div>
              </div>
              <button onClick={() => setStatus(null)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <X size={18} />
              </button>
            </div>
          )}

          <div className="animate-in fade-in slide-in-from-bottom-2 duration-700">
            {activeSection === "reglas" ? (
              <div className="space-y-10">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-40 space-y-6">
                    <div className="relative">
                      <div className="w-20 h-20 border-4 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin" />
                      <Database className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-500 w-8 h-8 opacity-50" />
                    </div>
                    <div className="text-center">
                      <p className="text-white font-black tracking-widest text-sm uppercase">Sincronizando Datos</p>
                      <p className="text-slate-600 text-[10px] font-black uppercase mt-1">Conectando con Supabase Engine...</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* SUB-TABS NAVIGATION */}
                    <div className="flex items-center gap-1 p-1 bg-slate-900/50 rounded-2xl border border-white/5 w-fit">
                      <button 
                        onClick={() => setActiveReglasTab("loteo")}
                        className={clsx(
                          "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2",
                          activeReglasTab === "loteo" ? "bg-orange-500/10 text-orange-400 shadow-lg border border-orange-500/20" : "text-slate-500 hover:text-slate-300"
                        )}
                      >
                        <Trophy size={14} /> Loteo
                      </button>
                      <button 
                        onClick={() => setActiveReglasTab("beneficios")}
                        className={clsx(
                          "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2",
                          activeReglasTab === "beneficios" ? "bg-emerald-500/10 text-emerald-400 shadow-lg border border-emerald-500/20" : "text-slate-500 hover:text-slate-300"
                        )}
                      >
                        <TrendingUp size={14} /> Bonos
                      </button>
                      <button 
                        onClick={() => setActiveReglasTab("sanciones")}
                        className={clsx(
                          "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2",
                          activeReglasTab === "sanciones" ? "bg-red-500/10 text-red-400 shadow-lg border border-red-500/20" : "text-slate-500 hover:text-slate-300"
                        )}
                      >
                        <TrendingDown size={14} /> Sanciones
                      </button>
                    </div>

                    {/* LOTEO SECTION */}
                    {activeReglasTab === "loteo" && (
                      <section className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-orange-500/10 rounded-2xl border border-orange-500/20 flex items-center justify-center shadow-lg">
                              <Trophy className="text-orange-400" size={24} />
                            </div>
                            <div>
                              <h3 className="text-xl font-black text-white uppercase tracking-tight">Reglas de Loteo</h3>
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Gestión de prioridad por Raid</p>
                            </div>
                          </div>
                          <button 
                            onClick={addRaid} 
                            className="flex items-center gap-3 px-6 py-3 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 rounded-2xl text-[10px] font-black border border-orange-500/30 transition-all uppercase tracking-[0.15em] active:scale-95"
                          >
                            <Plus size={18} /> Nueva Raid
                          </button>
                        </div>

                        <div className="space-y-6">
                          {filteredLootRules.length === 0 ? (
                            <div className="bg-slate-900/20 border border-dashed border-white/5 rounded-[2rem] p-20 text-center">
                              <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-6 text-slate-700 border border-white/5 shadow-inner">
                                <Search size={32} />
                              </div>
                              <h4 className="text-white font-black uppercase mb-2">No se encontraron resultados</h4>
                              <p className="text-slate-500 text-sm max-w-xs mx-auto">Ajusta tu búsqueda o crea una nueva configuración de raid.</p>
                            </div>
                          ) : (
                            filteredLootRules.map((raid, rIdx) => {
                              const isExpanded = expandedRaids.has(rIdx);
                              return (
                                <div key={rIdx} className={clsx(
                                  "group bg-slate-900/40 rounded-[2.5rem] border transition-all duration-500 overflow-hidden",
                                  isExpanded ? "border-white/10 shadow-2xl bg-slate-900/60" : "border-white/5 hover:border-white/10"
                                )}>
                                  <div 
                                    onClick={() => toggleRaidExpand(rIdx)}
                                    className="p-6 md:p-8 bg-slate-950/40 border-b border-white/5 flex items-center justify-between cursor-pointer"
                                  >
                                    <div className="flex items-center gap-6 flex-1 min-w-0">
                                      <div className={clsx(
                                        "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-inner",
                                        isExpanded ? "bg-orange-500/20 text-orange-400 rotate-6" : "bg-slate-800/50 text-slate-600"
                                      )}>
                                        <Shield size={24} />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <input 
                                          value={raid.raid}
                                          onClick={(e) => e.stopPropagation()}
                                          onChange={(e) => {
                                            const nl = [...lootRules];
                                            nl[rIdx].raid = e.target.value;
                                            setLootRules(nl);
                                          }}
                                          className="bg-transparent border-none text-2xl font-black text-white focus:ring-0 outline-none w-full p-0 placeholder-slate-800 uppercase tracking-tighter"
                                          placeholder="Nombre de la Raid"
                                        />
                                        <div className="flex items-center gap-3 mt-1">
                                          <span className="text-[10px] font-black text-emerald-500/60 uppercase tracking-widest">
                                            {raid.items.length} Objetos Registrados
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                      <button 
                                        onClick={(e) => { 
                                          e.stopPropagation(); 
                                          if(confirm("¿Eliminar permanentemente esta raid y todos sus ítems?")) 
                                            setLootRules(lootRules.filter((_, i) => i !== rIdx)); 
                                        }}
                                        className="p-3 text-slate-700 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                        title="Eliminar Raid"
                                      >
                                        <Trash2 size={20} />
                                      </button>
                                      <div className={clsx("p-2 rounded-full transition-transform duration-500 bg-white/5", isExpanded && "rotate-180")}>
                                        <ChevronDown size={20} className="text-slate-500" />
                                      </div>
                                    </div>
                                  </div>

                                  {isExpanded && (
                                    <div className="p-6 md:p-8 space-y-6 animate-in slide-in-from-top-4 duration-500">
                                      <div className="grid grid-cols-1 gap-4">
                                        {raid.items.map((item: any, iIdx: number) => (
                                          <div key={iIdx} className="bg-slate-950/60 border border-white/5 rounded-[1.5rem] p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-start group/item hover:border-white/10 hover:bg-slate-900/60 transition-all shadow-inner">
                                            <div className="md:col-span-1 flex justify-center">
                                              <div className="relative group/icon cursor-pointer">
                                                <img 
                                                  src={item.icon} 
                                                  alt="icon" 
                                                  className="w-14 h-14 rounded-2xl border-2 border-slate-800 mx-auto object-cover bg-slate-900 group-hover/icon:border-emerald-500 transition-all shadow-2xl" 
                                                  onError={(e) => {(e.target as HTMLImageElement).src = "https://wow.zamimg.com/images/wow/icons/large/inv_misc_questionmark.jpg"}}
                                                />
                                                <div className="absolute -bottom-1 -right-1 bg-slate-900 rounded-lg p-1 border border-white/10 opacity-0 group-hover/item:opacity-100 transition-all scale-75 group-hover:scale-100">
                                                  <Edit3 size={12} className="text-emerald-400" />
                                                </div>
                                              </div>
                                            </div>
                                            
                                            <div className="md:col-span-4 space-y-4">
                                              <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Identificador Ítem</label>
                                                <input 
                                                  value={item.item} 
                                                  onChange={(e) => updateItem(rIdx, iIdx, "item", e.target.value)} 
                                                  className="w-full bg-slate-900/50 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white font-black focus:border-emerald-500/50 outline-none transition-all" 
                                                />
                                              </div>
                                              <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Icon URL</label>
                                                <div className="flex gap-2">
                                                  <input 
                                                    value={item.icon} 
                                                    onChange={(e) => updateItem(rIdx, iIdx, "icon", e.target.value)}
                                                    placeholder="https://..."
                                                    className="flex-1 bg-slate-900/30 border border-white/5 rounded-xl px-4 py-2 text-[10px] text-slate-500 focus:text-slate-300 outline-none font-mono"
                                                  />
                                                  <a href={item.icon} target="_blank" className="p-2 bg-white/5 rounded-xl text-slate-500 hover:text-emerald-400 transition-colors">
                                                    <ExternalLink size={14} />
                                                  </a>
                                                </div>
                                              </div>
                                            </div>

                                            <div className="md:col-span-2 space-y-4">
                                              <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Categoría</label>
                                                <input 
                                                  value={item.category} 
                                                  onChange={(e) => updateItem(rIdx, iIdx, "category", e.target.value)} 
                                                  className="w-full bg-slate-900/50 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-slate-400 uppercase font-black focus:border-emerald-500/50 outline-none transition-all" 
                                                />
                                              </div>
                                              <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">EP Mínimo</label>
                                                <div className="relative">
                                                  <input 
                                                    type="number" 
                                                    value={item.valueMin} 
                                                    onChange={(e) => updateItem(rIdx, iIdx, "valueMin", parseInt(e.target.value) || 0)} 
                                                    className="w-full bg-slate-950/50 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-emerald-400 font-black focus:border-emerald-500/50 outline-none transition-all pr-10" 
                                                  />
                                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-emerald-900/60 uppercase">pts</span>
                                                </div>
                                              </div>
                                            </div>

                                            <div className="md:col-span-4 space-y-1.5">
                                              <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Requisitos Específicos</label>
                                              <textarea 
                                                value={item.requirement.join("\n")} 
                                                onChange={(e) => updateItem(rIdx, iIdx, "requirement", e.target.value)} 
                                                rows={4} 
                                                placeholder="Ej: Solo Tanques Principal&#10;Mínimo 4/5 Tier 10&#10;Asistencia 80%+"
                                                className="w-full bg-slate-900/50 border border-white/5 rounded-2xl px-4 py-3 text-xs text-slate-300 resize-none focus:border-emerald-500/50 outline-none leading-relaxed transition-all placeholder:text-slate-800" 
                                              />
                                            </div>

                                            <div className="md:col-span-1 flex flex-row md:flex-col justify-end items-center gap-2 h-full py-1">
                                              <button onClick={() => cloneItem(rIdx, iIdx)} title="Duplicar ítem" className="p-3 text-slate-600 hover:text-cyan-400 transition-all bg-white/[0.02] hover:bg-cyan-500/10 rounded-2xl border border-white/5 hover:border-cyan-500/20 active:scale-90">
                                                <Copy size={16} />
                                              </button>
                                              <button onClick={() => removeItem(rIdx, iIdx)} title="Eliminar ítem" className="p-3 text-slate-600 hover:text-red-400 transition-all bg-white/[0.02] hover:bg-red-500/10 rounded-2xl border border-white/5 hover:border-red-500/20 active:scale-90">
                                                <Trash2 size={16} />
                                              </button>
                                            </div>
                                          </div>
                                        ))}
                                        
                                        <button 
                                          onClick={() => addItemToRaid(rIdx)} 
                                          className="w-full py-6 border-2 border-dashed border-white/5 hover:border-emerald-500/30 rounded-[1.5rem] text-slate-600 hover:text-emerald-400 hover:bg-emerald-500/5 transition-all group overflow-hidden relative"
                                        >
                                          <div className="flex items-center justify-center gap-3 relative z-10">
                                            <Plus size={20} className="group-hover:rotate-90 transition-transform duration-500" />
                                            <span className="text-xs font-black uppercase tracking-[0.2em]">Registrar Nuevo Objeto en {raid.raid}</span>
                                          </div>
                                          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/[0.03] to-emerald-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      </section>
                    )}

                    {/* BENE/PEN SECTIONS */}
                    {activeReglasTab === "beneficios" && (
                      <section className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 flex items-center justify-center shadow-lg">
                              <TrendingUp className="text-emerald-400" size={24} />
                            </div>
                            <div>
                              <h3 className="text-xl font-black text-white uppercase tracking-tight">Bonificaciones</h3>
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Incrementos de EP</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => setBenefits([...benefits, { category: "Nueva Categoría", items: [] }])} 
                            className="flex items-center gap-3 px-6 py-3 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-2xl text-[10px] font-black border border-emerald-500/30 transition-all uppercase tracking-[0.15em] active:scale-95"
                          >
                            <Plus size={18} /> Nueva Categoría
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                          {benefits.map((cat, cIdx) => (
                            <div key={cIdx} className="bg-slate-900/40 rounded-[2rem] border border-white/5 p-6 space-y-6 shadow-xl hover:border-white/10 transition-colors">
                              <div className="flex items-center gap-4">
                                <input 
                                  value={cat.category} 
                                  onChange={(e) => updateBenePenSection("benefits", cIdx, "category", e.target.value)} 
                                  className="bg-slate-950/60 border border-white/5 rounded-xl px-4 py-3 text-sm font-black text-white w-full focus:border-emerald-500/50 outline-none uppercase tracking-wider transition-all" 
                                />
                                <button onClick={() => setBenefits(benefits.filter((_, i) => i !== cIdx))} className="p-3 text-slate-700 hover:text-red-400 transition-colors">
                                  <Trash2 size={18} />
                                </button>
                              </div>
                              <div className="grid grid-cols-1 gap-3">
                                {cat.items.map((item: any, iIdx: number) => (
                                  <div key={iIdx} className="bg-slate-950/40 border border-white/5 rounded-2xl p-4 space-y-4 group/bene hover:bg-slate-900/60 transition-all">
                                    <div className="flex items-center gap-4">
                                      <div className="relative group/icon shrink-0">
                                        <img 
                                          src={item.icon} 
                                          alt="icon" 
                                          className="w-12 h-12 rounded-xl border border-white/10 object-cover bg-slate-900 shadow-lg group-hover/icon:border-emerald-500 transition-all" 
                                          onError={(e) => {(e.target as HTMLImageElement).src = "https://wow.zamimg.com/images/wow/icons/large/inv_misc_questionmark.jpg"}}
                                        />
                                      </div>
                                      <div className="flex-1 min-w-0 space-y-1.5">
                                        <input 
                                          value={item.descripcion} 
                                          onChange={(e) => {
                                            const nd = [...benefits];
                                            nd[cIdx].items[iIdx].descripcion = e.target.value;
                                            setBenefits(nd);
                                          }} 
                                          placeholder="Descripción del bono..." 
                                          className="bg-transparent border-none text-xs w-full text-white focus:ring-0 outline-none font-bold p-0" 
                                        />
                                        <input 
                                          value={item.icon} 
                                          onChange={(e) => {
                                            const nd = [...benefits];
                                            nd[cIdx].items[iIdx].icon = e.target.value;
                                            setBenefits(nd);
                                          }} 
                                          placeholder="URL del icono..." 
                                          className="bg-transparent border-none text-[9px] w-full text-slate-600 focus:text-slate-400 focus:ring-0 outline-none font-mono p-0" 
                                        />
                                      </div>
                                      <div className="shrink-0 flex flex-col items-end gap-2">
                                        <div className="relative">
                                          <input 
                                            type="number" 
                                            value={item.valor} 
                                            onChange={(e) => {
                                              const nd = [...benefits];
                                              nd[cIdx].items[iIdx].valor = parseInt(e.target.value) || 0;
                                              setBenefits(nd);
                                            }} 
                                            className="bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-sm w-20 text-emerald-400 font-black text-right outline-none focus:border-emerald-500/50 transition-all" 
                                          />
                                        </div>
                                        <button 
                                          onClick={() => {
                                            const nd = [...benefits];
                                            nd[cIdx].items = nd[cIdx].items.filter((_: any, i: number) => i !== iIdx);
                                            setBenefits(nd);
                                          }} 
                                          className="text-slate-800 hover:text-red-400 opacity-0 group-hover/bene:opacity-100 transition-all active:scale-90"
                                        >
                                          <X size={16} />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                                <button 
                                  onClick={() => addBenePenItem("benefits", cIdx)} 
                                  className="w-full py-3 border border-dashed border-white/5 rounded-xl text-[10px] font-black text-slate-600 hover:text-emerald-400 hover:bg-emerald-500/5 transition-all uppercase tracking-[0.2em]"
                                >
                                  + Añadir Bonificación
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {activeReglasTab === "sanciones" && (
                      <section className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-red-500/10 rounded-2xl border border-red-500/20 flex items-center justify-center shadow-lg">
                              <TrendingDown className="text-red-400" size={24} />
                            </div>
                            <div>
                              <h3 className="text-xl font-black text-white uppercase tracking-tight">Sanciones</h3>
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Descuentos de EP</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => setPenalties([...penalties, { category: "Nueva Categoría", items: [] }])} 
                            className="flex items-center gap-3 px-6 py-3 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-2xl text-[10px] font-black border border-red-500/30 transition-all uppercase tracking-[0.15em] active:scale-95"
                          >
                            <Plus size={18} /> Nueva Categoría
                          </button>
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                          {penalties.map((cat, cIdx) => (
                            <div key={cIdx} className="bg-slate-900/40 rounded-[2rem] border border-white/5 p-6 space-y-6 shadow-xl hover:border-white/10 transition-colors">
                              <div className="flex items-center gap-4">
                                <input 
                                  value={cat.category} 
                                  onChange={(e) => updateBenePenSection("penalties", cIdx, "category", e.target.value)} 
                                  className="bg-slate-950/60 border border-white/5 rounded-xl px-4 py-3 text-sm font-black text-white w-full focus:border-red-500/50 outline-none uppercase tracking-wider transition-all" 
                                />
                                <button onClick={() => setPenalties(penalties.filter((_, i) => i !== cIdx))} className="p-3 text-slate-700 hover:text-red-400 transition-colors">
                                  <Trash2 size={18} />
                                </button>
                              </div>
                              <div className="grid grid-cols-1 gap-3">
                                {cat.items.map((item: any, iIdx: number) => (
                                  <div key={iIdx} className="bg-slate-950/40 border border-white/5 rounded-2xl p-4 space-y-4 group/perj hover:bg-slate-900/60 transition-all">
                                    <div className="flex items-center gap-4">
                                      <div className="relative group/icon shrink-0">
                                        <img 
                                          src={item.icon} 
                                          alt="icon" 
                                          className="w-12 h-12 rounded-xl border border-white/10 object-cover bg-slate-900 shadow-lg group-hover/icon:border-red-500 transition-all" 
                                          onError={(e) => {(e.target as HTMLImageElement).src = "https://wow.zamimg.com/images/wow/icons/large/inv_misc_questionmark.jpg"}}
                                        />
                                      </div>
                                      <div className="flex-1 min-w-0 space-y-1.5">
                                        <input 
                                          value={item.descripcion} 
                                          onChange={(e) => {
                                            const nd = [...penalties];
                                            nd[cIdx].items[iIdx].descripcion = e.target.value;
                                            setPenalties(nd);
                                          }} 
                                          placeholder="Descripción de la sanción..." 
                                          className="bg-transparent border-none text-xs w-full text-white focus:ring-0 outline-none font-bold p-0" 
                                        />
                                        <input 
                                          value={item.icon} 
                                          onChange={(e) => {
                                            const nd = [...penalties];
                                            nd[cIdx].items[iIdx].icon = e.target.value;
                                            setPenalties(nd);
                                          }} 
                                          placeholder="URL del icono..." 
                                          className="bg-transparent border-none text-[9px] w-full text-slate-600 focus:text-slate-400 focus:ring-0 outline-none font-mono p-0" 
                                        />
                                      </div>
                                      <div className="shrink-0 flex flex-col items-end gap-2">
                                        <div className="relative">
                                          <input 
                                            type="number" 
                                            value={item.valor} 
                                            onChange={(e) => {
                                              const nd = [...penalties];
                                              nd[cIdx].items[iIdx].valor = parseInt(e.target.value) || 0;
                                              setPenalties(nd);
                                            }} 
                                            className="bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-sm w-20 text-red-400 font-black text-right outline-none focus:border-red-500/50 transition-all" 
                                          />
                                        </div>
                                        <button 
                                          onClick={() => {
                                            const nd = [...penalties];
                                            nd[cIdx].items = nd[cIdx].items.filter((_: any, i: number) => i !== iIdx);
                                            setPenalties(nd);
                                          }} 
                                          className="text-slate-800 hover:text-red-400 opacity-0 group-hover/perj:opacity-100 transition-all active:scale-90"
                                        >
                                          <X size={16} />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                                <button 
                                  onClick={() => addBenePenItem("penalties", cIdx)} 
                                  className="w-full py-3 border border-dashed border-white/5 rounded-xl text-[10px] font-black text-slate-600 hover:text-red-400 hover:bg-red-500/5 transition-all uppercase tracking-[0.2em]"
                                >
                                  + Añadir Sanción
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div className="bg-slate-900/40 rounded-[3rem] border border-white/5 p-24 text-center animate-in fade-in duration-1000 shadow-2xl backdrop-blur-3xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-blue-500/5 opacity-50" />
                <div className="relative z-10">
                  <div className="w-24 h-24 bg-slate-950 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-white/5 shadow-[0_0_50px_rgba(0,0,0,0.5)] group-hover:scale-110 transition-transform duration-500">
                    <Database className="text-slate-800 group-hover:text-emerald-500/40 transition-colors duration-500" size={48} />
                  </div>
                  <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">Módulo en Desarrollo</h2>
                  <p className="text-slate-500 max-w-sm mx-auto text-sm leading-relaxed font-medium">
                    Estamos integrando la arquitectura para el procesamiento de logs de {activeSection}. La sincronización de datos estará disponible próximamente.
                  </p>
                  <div className="mt-10 flex justify-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500/30 animate-bounce" />
                    <div className="w-2 h-2 rounded-full bg-emerald-500/30 animate-bounce [animation-delay:0.2s]" />
                    <div className="w-2 h-2 rounded-full bg-emerald-500/30 animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
