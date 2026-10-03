"use client";

import { useState } from "react";
import { Loader2, Search, ShieldMinus, ShieldPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { cn } from "@/lib/utils";
import { useUsersAdmin } from "../hooks/useUsersAdmin";
import { AdminStatus } from "../types";
import AdminPagination from "./shared/AdminPagination";
import AdminSectionHeader from "./AdminSectionHeader";
import SyncTokensPanel from "./users/SyncTokensPanel";
import ActivityLogPanel from "./users/ActivityLogPanel";

interface UsersSectionProps {
  onStatus: (status: AdminStatus) => void;
}

export default function UsersSection({ onStatus }: UsersSectionProps) {
  const [tab, setTab] = useState("usuarios");
  return (
    <>
      <AdminSectionHeader
        group="Hermandad"
        title="Usuarios y accesos"
        description="Quién entra al panel, los tokens de ScriptSkada y el historial de cambios."
      />
      <Tabs value={tab} onValueChange={setTab} className="gap-4">
        <TabsList variant="line" className="w-full justify-start border-b">
          <TabsTrigger value="usuarios" className="flex-none px-3">
            Usuarios
          </TabsTrigger>
          <TabsTrigger value="tokens" className="flex-none px-3">
            Tokens de sync
          </TabsTrigger>
          <TabsTrigger value="actividad" className="flex-none px-3">
            Registro de actividad
          </TabsTrigger>
        </TabsList>
        <TabsContent value="usuarios">
          <UsersPanel onStatus={onStatus} />
        </TabsContent>
        <TabsContent value="tokens">
          <SyncTokensPanel onStatus={onStatus} />
        </TabsContent>
        <TabsContent value="actividad">
          <ActivityLogPanel />
        </TabsContent>
      </Tabs>
    </>
  );
}

function UsersPanel({ onStatus }: UsersSectionProps) {
  const [search, setSearch] = useState("");
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
    <div className="grid items-start gap-4 lg:grid-cols-[400px_minmax(0,1fr)]">
      <Card>
        <CardHeader>
          <CardTitle>Registrar usuario</CardTitle>
          <CardDescription>Acceso al panel de administración.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={registerUser} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="user-email">Email</Label>
              <Input
                id="user-email"
                type="email"
                required
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                placeholder="usuario@ejemplo.com"
                className="h-10"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="user-password">Contraseña temporal</Label>
              <Input
                id="user-password"
                type="text"
                required
                minLength={6}
                autoComplete="off"
                value={userForm.password}
                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                placeholder="Mínimo 6 caracteres"
                className="h-10"
              />
              <p className="text-xs text-muted-foreground">
                Compártela con el usuario por un canal seguro.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Rol</Label>
              <ToggleGroup
                type="single"
                variant="outline"
                value={userForm.role}
                onValueChange={(v) =>
                  v && setUserForm({ ...userForm, role: v as typeof userForm.role })
                }
                className="w-full"
              >
                <ToggleGroupItem value="user" className="flex-1">
                  Usuario
                </ToggleGroupItem>
                <ToggleGroupItem value="admin" className="flex-1">
                  Admin
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
            <Button
              type="submit"
              className="self-end"
              disabled={isSaving || !userForm.email || userForm.password.length < 6}
            >
              {isSaving && <Loader2 className="animate-spin" />}
              Registrar
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="gap-0 overflow-hidden py-0">
        <CardHeader className="border-b py-4">
          <CardTitle>Usuarios</CardTitle>
          <CardDescription>{totalItems} cuentas con acceso al panel</CardDescription>
          <CardAction>
            <div className="relative w-48">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filtrar por email…"
                aria-label="Filtrar por email"
                className="h-8 pl-8"
              />
            </div>
          </CardAction>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Email</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead className="hidden sm:table-cell">Alta</TableHead>
              <TableHead className="w-14">
                <span className="sr-only">Acciones</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className={cn(isLoading && "opacity-60")}>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.email}</TableCell>
                <TableCell>
                  <Badge variant={u.role === "admin" ? "default" : "secondary"}>
                    {u.role === "admin" ? "Admin" : "Usuario"}
                  </Badge>
                </TableCell>
                <TableCell className="hidden text-muted-foreground sm:table-cell">
                  {new Date(u.created_at).toLocaleDateString("es-PE")}
                </TableCell>
                <TableCell>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => changeRole(u.id, u.role === "admin" ? "user" : "admin")}
                        aria-label={u.role === "admin" ? "Quitar rol admin" : "Promover a admin"}
                      >
                        {u.role === "admin" ? <ShieldMinus /> : <ShieldPlus />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {u.role === "admin" ? "Quitar rol admin" : "Promover a admin"}
                    </TooltipContent>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && !isLoading && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={4}>
                  <Empty className="py-12">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <Users />
                      </EmptyMedia>
                      <EmptyTitle>No hay usuarios registrados</EmptyTitle>
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <AdminPagination page={currentPage} totalPages={totalPages} onChange={setCurrentPage} />
      </Card>
    </div>
  );
}
