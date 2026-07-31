"use client";

import { ChevronLeft, ChevronRight, Loader2, ShieldMinus, ShieldPlus, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { useUsersAdmin } from "../hooks/useUsersAdmin";
import { AdminStatus } from "../types";

interface UsersSectionProps {
  search: string;
  onStatus: (status: AdminStatus) => void;
}

export default function UsersSection({ search, onStatus }: UsersSectionProps) {
  const {
    users,
    totalItems,
    currentPage,
    setCurrentPage,
    totalPages,
    isLoading,
    isSaving,
    userForm,
    setUserForm,
    registerUser,
    changeRole,
  } = useUsersAdmin(search, onStatus);

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* FORMULARIO DE REGISTRO */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="gap-0 bg-white dark:bg-slate-900/60 rounded-[2.5rem] border border-black/10 dark:border-white/10 p-8 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-cyan-500/10 rounded-2xl border border-cyan-500/20 flex items-center justify-center">
                <UserPlus className="text-cyan-400" size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Registrar Usuario</h3>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Acceso al Panel Admin</p>
              </div>
            </div>

            <form onSubmit={registerUser} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email</label>
                <Input
                  type="email"
                  required
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  placeholder="usuario@ejemplo.com"
                  className="h-auto w-full bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 rounded-xl py-4 px-4 text-sm focus-visible:ring-cyan-500/20 focus-visible:border-cyan-500/40 placeholder:text-slate-700"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Contraseña temporal</label>
                <Input
                  type="text"
                  required
                  minLength={6}
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                  className="h-auto w-full bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 rounded-xl py-4 px-4 text-sm focus-visible:ring-cyan-500/20 focus-visible:border-cyan-500/40 placeholder:text-slate-700"
                />
                <p className="text-[10px] text-slate-500 ml-1">Comparte esta contraseña con el usuario por un canal seguro.</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Rol</label>
                <div className="flex gap-3">
                  {(["user", "admin"] as const).map((roleOption) => (
                    <button
                      key={roleOption}
                      type="button"
                      onClick={() => setUserForm({ ...userForm, role: roleOption })}
                      className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest border transition-colors ${
                        userForm.role === roleOption
                          ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-400"
                          : "bg-slate-50 dark:bg-slate-950/30 border-slate-200 dark:border-slate-800 text-slate-500"
                      }`}
                    >
                      {roleOption === "admin" ? "Admin" : "Usuario"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={isSaving || !userForm.email || userForm.password.length < 6}
                  className="h-auto flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-slate-900 dark:text-white font-black py-4 rounded-2xl shadow-xl shadow-cyan-900/20 uppercase tracking-widest text-xs"
                >
                  {isSaving ? <Loader2 className="animate-spin mx-auto" size={20} /> : "Registrar"}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* LISTADO DE USUARIOS */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="gap-0 p-0 bg-white dark:bg-slate-900/40 rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl backdrop-blur-sm">
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Usuarios Registrados</h3>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Acceso al panel</p>
              </div>
              <Badge className="rounded-full bg-white/5 text-slate-600 dark:text-slate-400 uppercase tracking-widest border border-black/10 dark:border-white/10">
                {totalItems} Usuarios
              </Badge>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-950/40">
                    <TableHead className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Email</TableHead>
                    <TableHead className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Rol</TableHead>
                    <TableHead className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Alta</TableHead>
                    <TableHead className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-white/5">
                  {users.map((u) => (
                    <TableRow key={u.id} className="group">
                      <TableCell className="px-8 py-5">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{u.email}</span>
                      </TableCell>
                      <TableCell className="px-8 py-5">
                        <Badge
                          className={
                            u.role === "admin"
                              ? "rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-widest"
                              : "rounded bg-white/5 text-slate-500 border border-black/10 dark:border-white/10 uppercase tracking-widest"
                          }
                        >
                          {u.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-8 py-5">
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                          {new Date(u.created_at).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {u.role === "admin" ? (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => changeRole(u.id, "user")}
                              className="text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                              title="Quitar rol admin"
                            >
                              <ShieldMinus size={16} />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => changeRole(u.id, "admin")}
                              className="text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10"
                              title="Promover a admin"
                            >
                              <ShieldPlus size={16} />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {users.length === 0 && !isLoading && (
                    <TableRow>
                      <TableCell colSpan={4} className="px-8 py-20 text-center">
                        <p className="text-slate-500 text-xs font-black uppercase tracking-widest">No hay usuarios registrados</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="p-6 border-t border-white/5 flex items-center justify-between">
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                  Página {currentPage} de {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="bg-white/5 border border-black/10 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  >
                    <ChevronLeft size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="bg-white/5 border border-black/10 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  >
                    <ChevronRight size={16} />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
