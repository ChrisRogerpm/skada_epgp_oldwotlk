"use client";

import { AlertCircle, LayoutDashboard, Loader2, Lock, Mail, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AdminLoginScreenProps {
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  loginError: string;
  isLoggingIn: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export default function AdminLoginScreen({
  email,
  setEmail,
  password,
  setPassword,
  loginError,
  isLoggingIn,
  onSubmit,
}: AdminLoginScreenProps) {
  return (
    <main className="min-h-screen bg-white dark:bg-slate-950 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-100 via-white to-white dark:from-slate-900 dark:via-slate-950 dark:to-black text-slate-800 dark:text-slate-200 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-700">
        <div className="text-center space-y-4">
          <div className="w-24 h-24 bg-gradient-to-br from-emerald-500/20 to-teal-500/5 rounded-3xl border border-emerald-500/30 flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(16,185,129,0.15)] group hover:scale-105 transition-transform duration-500">
            <Shield className="text-emerald-400 group-hover:rotate-12 transition-transform duration-500" size={48} />
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Panel Admin</h1>
            <p className="text-emerald-500/60 text-xs font-black uppercase tracking-[0.3em]">Gestión Old Legends</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/40 backdrop-blur-2xl border border-white/5 p-1 rounded-[2.5rem] shadow-2xl">
          <form onSubmit={onSubmit} className="bg-white dark:bg-slate-900/40 border border-white/5 p-8 rounded-[2.2rem] space-y-6">
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Identificación</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-400 transition-colors z-10" size={18} />
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@old-legends.com"
                    className="h-auto w-full bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-sm focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40 placeholder:text-slate-700"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Clave de Seguridad</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-400 transition-colors z-10" size={18} />
                  <Input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="h-auto w-full bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-sm focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40 placeholder:text-slate-700"
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

            <Button
              type="submit"
              disabled={isLoggingIn}
              className="h-auto w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-900 dark:text-white font-black py-4 rounded-2xl shadow-xl shadow-emerald-900/20 justify-center gap-3 uppercase tracking-widest text-xs group"
            >
              {isLoggingIn ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <span>Acceder al Portal</span>
                  <LayoutDashboard size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>
        </div>

        <div className="flex flex-col items-center gap-4 pt-4">
          <p className="text-center text-[10px] text-slate-600 font-bold uppercase tracking-[0.2em]">
            Solo Oficiales Autorizados
          </p>
          <div className="flex gap-2">
            <div className="w-1 h-1 rounded-full bg-slate-100 dark:bg-slate-800" />
            <div className="w-1 h-1 rounded-full bg-slate-100 dark:bg-slate-800" />
            <div className="w-1 h-1 rounded-full bg-slate-100 dark:bg-slate-800" />
          </div>
        </div>
      </div>
    </main>
  );
}
