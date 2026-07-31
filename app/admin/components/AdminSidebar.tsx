"use client";

import { LucideIcon, LogOut, Shield } from "lucide-react";
import clsx from "clsx";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";

export type AdminSectionId = "skada" | "epgp" | "reglas" | "fullgeared" | "usuarios";

interface AdminSection {
  id: AdminSectionId;
  label: string;
  icon: LucideIcon;
  color: string;
}

interface AdminSidebarProps {
  sections: AdminSection[];
  activeSection: AdminSectionId;
  onSectionChange: (id: AdminSectionId) => void;
  user: User;
  onLogout: () => void;
}

export default function AdminSidebar({ sections, activeSection, onSectionChange, user, onLogout }: AdminSidebarProps) {
  return (
    <aside className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-white/5 p-6 lg:p-8 space-y-10 lg:sticky lg:top-0 h-fit lg:h-screen flex flex-col backdrop-blur-md bg-slate-50 dark:bg-slate-950/30">
      <div className="flex items-center gap-4 px-2">
        <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 shadow-inner">
          <Shield className="text-emerald-400" size={28} />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">Admin</h1>
          <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-widest truncate">Portal Old Legends</p>
        </div>
      </div>

      <nav className="space-y-2 flex-1">
        <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] px-4 mb-4">Sistemas</p>
        {sections.map((section) => (
          <Button
            key={section.id}
            variant="ghost"
            aria-current={activeSection === section.id ? "page" : undefined}
            onClick={() => onSectionChange(section.id)}
            className={clsx(
              "h-auto w-full justify-start gap-4 px-5 py-4 rounded-2xl text-sm font-bold border group relative overflow-hidden",
              activeSection === section.id
                ? "bg-white/[0.03] text-slate-900 dark:text-white border-black/10 dark:border-white/10 shadow-xl hover:bg-white/[0.03] hover:text-slate-900 dark:hover:text-white"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-300 hover:bg-white/[0.02] border-transparent",
            )}
          >
            {activeSection === section.id && (
              <div className={clsx("absolute left-0 top-0 bottom-0 w-1 bg-current opacity-60", section.color.replace("text-", "bg-"))} />
            )}
            <section.icon
              className={clsx("transition-transform duration-300 group-hover:scale-110", activeSection === section.id ? section.color : "text-slate-600")}
              size={20}
            />
            <span className="flex-1 text-left">{section.label}</span>
            {activeSection === section.id && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />}
          </Button>
        ))}
      </nav>

      <div className="pt-6 border-t border-white/5 space-y-4">
        <div className="bg-white dark:bg-slate-900/50 rounded-2xl p-4 border border-white/5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-black text-emerald-400 border border-white/5">
            {user.email?.[0].toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user.email}</p>
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-tighter">Administrador</p>
          </div>
        </div>
        <Button
          variant="ghost"
          onClick={onLogout}
          className="h-auto w-full justify-center gap-2 px-4 py-3 rounded-xl text-[10px] font-black text-slate-500 hover:text-red-400 hover:bg-red-500/5 border border-transparent hover:border-red-500/10 uppercase tracking-widest"
        >
          <LogOut size={14} /> Cerrar Sesión
        </Button>
      </div>
    </aside>
  );
}
