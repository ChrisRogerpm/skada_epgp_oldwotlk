"use client";

import { useCallback, useState } from "react";
import {
  Coins,
  Gem,
  Loader2,
  LogOut,
  Search,
  ShieldCheck,
  ScrollText,
  UserCog,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PageBody } from "@/components/page-header";
import { cn } from "@/lib/utils";
import { useAdminAuth } from "./hooks/useAdminAuth";
import AdminLoginScreen from "./components/AdminLoginScreen";
import FullGearedSection from "./components/FullGearedSection";
import LootSection from "./components/LootSection";
import ReglasSection from "./components/ReglasSection";
import UsersSection from "./components/UsersSection";
import { AdminStatus } from "./types";

// La sección de Usuarios solo la ve este correo; el resto de admins ni la
// ven ni pueden entrar a ella (los permisos reales de escritura los sigue
// validando /api/admin/users con requireAdmin).
const USERS_SECTION_EMAIL = "christianrogerpm@gmail.com";

type SectionId = "loot" | "puntos" | "loteo" | "fullgeared" | "usuarios";

const BASE_SECTIONS = [
  { id: "loot" as const, label: "Botín", icon: Gem, searchPlaceholder: "Filtrar por jugador…" },
  {
    id: "puntos" as const,
    label: "Reglas de puntos",
    icon: Coins,
    searchPlaceholder: "Filtrar reglas…",
  },
  {
    id: "loteo" as const,
    label: "Reglas de loteo",
    icon: ScrollText,
    searchPlaceholder: "Filtrar ítems…",
  },
  {
    id: "fullgeared" as const,
    label: "Full Gear",
    icon: ShieldCheck,
    searchPlaceholder: "Filtrar personajes…",
  },
];
const USERS_SECTION = {
  id: "usuarios" as const,
  label: "Usuarios",
  icon: UserCog,
  searchPlaceholder: "Filtrar por email…",
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
  const [section, setSection] = useState<SectionId>("loot");
  const [search, setSearch] = useState("");

  const onStatus = useCallback((status: AdminStatus) => {
    const options = {
      description: status.description,
      action: status.action
        ? { label: status.action.label, onClick: status.action.onClick }
        : undefined,
      duration: status.action ? 8000 : undefined,
    };
    if (status.type === "success") toast.success(status.message, options);
    else toast.error(status.message, options);
  }, []);

  if (authLoading) {
    return (
      <div className="flex min-h-[calc(100svh-3.5rem)] items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Verificando sesión…
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

  const canSeeUsers = user.email === USERS_SECTION_EMAIL;
  const sections = canSeeUsers ? [...BASE_SECTIONS, USERS_SECTION] : BASE_SECTIONS;
  const current = sections.find((s) => s.id === section) ?? sections[0];

  return (
    <PageBody className="max-w-[1600px]">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Administración</h1>
        <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
          <Badge className="bg-blue-500/15 text-blue-600 hover:bg-blue-500/15 dark:text-blue-300">
            Rol: Oficial
          </Badge>
          <span className="hidden sm:inline">{user.email}</span>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut /> Salir
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-b md:flex-row md:items-end">
        <nav aria-label="Secciones de administración" className="-mb-px flex gap-1 overflow-x-auto">
          {sections.map((s) => {
            const active = s.id === current.id;
            return (
              <button
                key={s.id}
                type="button"
                aria-current={active ? "page" : undefined}
                onClick={() => {
                  setSection(s.id);
                  setSearch("");
                }}
                className={cn(
                  "flex h-11 shrink-0 items-center gap-2 border-b-2 px-3 text-sm font-medium transition-colors",
                  active
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                <s.icon className="size-4" />
                {s.label}
              </button>
            );
          })}
        </nav>
        <div className="relative mb-2 w-full md:ml-auto md:w-64">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={current.searchPlaceholder}
            aria-label="Filtrar"
            className="h-9 pl-8"
          />
        </div>
      </div>

      {current.id === "loot" && <LootSection search={search} onStatus={onStatus} />}
      {current.id === "puntos" && (
        <ReglasSection view="puntos" search={search} onStatus={onStatus} />
      )}
      {current.id === "loteo" && <ReglasSection view="loteo" search={search} onStatus={onStatus} />}
      {current.id === "fullgeared" && <FullGearedSection search={search} onStatus={onStatus} />}
      {current.id === "usuarios" && canSeeUsers && (
        <UsersSection search={search} onStatus={onStatus} />
      )}
    </PageBody>
  );
}
