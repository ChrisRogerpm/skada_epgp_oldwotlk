"use client";

import { useState } from "react";
import { FileText, Search, Settings, Shield, Trophy, UserCog, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAdminAuth } from "./hooks/useAdminAuth";
import AdminLoginScreen from "./components/AdminLoginScreen";
import AdminSidebar, { AdminSectionId } from "./components/AdminSidebar";
import AdminStatusToast from "./components/AdminStatusToast";
import FullGearedSection from "./components/FullGearedSection";
import ReglasSection from "./components/ReglasSection";
import UsersSection from "./components/UsersSection";
import { AdminStatus } from "./types";

const SECTIONS = [
  { id: "reglas" as const, label: "Reglas & Loot", icon: Trophy, color: "text-orange-400" },
  { id: "epgp" as const, label: "Sistema EPGP", icon: Users, color: "text-emerald-400" },
  { id: "skada" as const, label: "Logs Skada", icon: FileText, color: "text-blue-400" },
  { id: "fullgeared" as const, label: "Full ICC/RS", icon: Shield, color: "text-purple-400" },
  { id: "usuarios" as const, label: "Usuarios", icon: UserCog, color: "text-cyan-400" },
];

const SECTION_TITLES: Record<AdminSectionId, string> = {
  reglas: "Editor de Reglas",
  epgp: "Configuración EPGP",
  skada: "Gestión de Logs",
  fullgeared: "Full ICC & RS",
  usuarios: "Gestión de Usuarios",
};

export default function AdminPage() {
  const {
    user,
    authLoading,
    email,
    setEmail,
    password,
    setPassword,
    loginError,
    isLoggingIn,
    handleLogin,
    handleLogout,
  } = useAdminAuth();

  const [activeSection, setActiveSection] = useState<AdminSectionId>("reglas");
  const [adminSearch, setAdminSearch] = useState("");
  const [status, setStatus] = useState<AdminStatus | null>(null);

  const handleSectionChange = (id: AdminSectionId) => {
    setActiveSection(id);
    setAdminSearch("");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center space-y-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          <Settings className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-500 w-6 h-6" />
        </div>
        <div className="text-center space-y-2">
          <p className="text-slate-900 dark:text-white font-black tracking-widest text-sm uppercase">Cargando Sistema</p>
          <p className="text-slate-500 text-xs font-medium animate-pulse">Verificando credenciales de acceso...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <AdminLoginScreen
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        loginError={loginError}
        isLoggingIn={isLoggingIn}
        onSubmit={handleLogin}
      />
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-sans selection:bg-emerald-500/30">
      <AdminStatusToast status={status} onClose={() => setStatus(null)} />

      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-emerald-500/5 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] bg-blue-500/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[50%] h-[20%] bg-purple-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row min-h-screen relative">
        <AdminSidebar
          sections={SECTIONS}
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
          user={user}
          onLogout={handleLogout}
        />

        {/* Main Content */}
        <div className="flex-1 p-6 md:p-10 lg:p-12 space-y-10 overflow-x-hidden">
          {/* Top Bar */}
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-white/5">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="px-2 py-0.5 rounded text-[9px] md:text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-widest">Live System</span>
                <span className="text-slate-600">/</span>
                <span className="text-slate-600 dark:text-slate-400 text-[9px] md:text-[10px] font-black uppercase tracking-widest truncate max-w-[150px] md:max-w-none">
                  {SECTIONS.find((s) => s.id === activeSection)?.label}
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">
                {SECTION_TITLES[activeSection]}
              </h2>
            </div>

            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="relative group w-full md:w-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors z-10" size={18} />
                <Input
                  type="text"
                  placeholder="Filtrar..."
                  value={adminSearch}
                  onChange={(e) => setAdminSearch(e.target.value)}
                  className="h-auto w-full md:w-64 lg:w-80 bg-white dark:bg-slate-900/50 border-white/5 rounded-2xl py-3 pl-12 pr-4 text-sm focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40 placeholder:text-slate-700 font-medium"
                />
              </div>
            </div>
          </header>

          <div className="animate-in fade-in slide-in-from-bottom-2 duration-700">
            {activeSection === "reglas" ? (
              <ReglasSection search={adminSearch} onStatus={setStatus} />
            ) : activeSection === "fullgeared" ? (
              <FullGearedSection search={adminSearch} onStatus={setStatus} />
            ) : activeSection === "usuarios" ? (
              <UsersSection search={adminSearch} onStatus={setStatus} />
            ) : (
              <div className="bg-white dark:bg-slate-900/40 rounded-[3rem] border border-white/5 p-24 text-center animate-in fade-in duration-1000 shadow-2xl backdrop-blur-3xl relative overflow-hidden group">
                {/* ... existing development placeholder ... */}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
