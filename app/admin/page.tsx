"use client";

import { useCallback, useState } from "react";
import { Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageBody } from "@/components/page-header";
import { useAdminAuth } from "./hooks/useAdminAuth";
import { attentionCount, useAdminOverview } from "./hooks/useAdminOverview";
import AdminLoginScreen from "./components/AdminLoginScreen";
import AdminNav, { ADMIN_SECTIONS, type AdminSectionId } from "./components/AdminNav";
import PanelSection from "./components/PanelSection";
import FullGearedSection from "./components/FullGearedSection";
import LootSection from "./components/LootSection";
import ReglasSection from "./components/ReglasSection";
import UsersSection from "./components/UsersSection";
import { AdminStatus } from "./types";

// La sección de Usuarios y accesos solo la ve este correo; el resto de admins
// ni la ven ni pueden entrar a ella (los permisos reales de escritura los
// siguen validando las rutas /api/admin/* con requireAdmin).
const USERS_SECTION_EMAIL = "christianrogerpm@gmail.com";

function initialSection(): AdminSectionId {
  if (typeof window === "undefined") return "panel";
  const value = new URLSearchParams(window.location.search).get("seccion");
  return ADMIN_SECTIONS.some((s) => s.id === value) ? (value as AdminSectionId) : "panel";
}

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
  const [section, setSection] = useState<AdminSectionId>(initialSection);
  const { data: overview } = useAdminOverview(!!user);

  const onStatus = useCallback((status: AdminStatus) => {
    const options = {
      description: status.description,
      action: status.action
        ? { label: status.action.label, onClick: status.action.onClick }
        : undefined,
      duration: status.action ? 10000 : undefined,
    };
    if (status.type === "success") toast.success(status.message, options);
    else toast.error(status.message, options);
  }, []);

  const goTo = useCallback((id: AdminSectionId) => {
    setSection(id);
    const url = new URL(window.location.href);
    if (id === "panel") url.searchParams.delete("seccion");
    else url.searchParams.set("seccion", id);
    window.history.replaceState(null, "", url);
    window.scrollTo({ top: 0 });
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
  const missingRules =
    overview?.attention.itemsWithoutRule.reduce((acc, r) => acc + r.count, 0) ?? 0;
  const items = ADMIN_SECTIONS.filter((s) => s.id !== "usuarios" || canSeeUsers).map((s) => ({
    ...s,
    badge:
      s.id === "panel"
        ? { value: attentionCount(overview), tone: "warning" as const }
        : s.id === "loteo"
          ? { value: missingRules, tone: "muted" as const }
          : undefined,
  }));
  const current = items.some((s) => s.id === section) ? section : "panel";

  return (
    <PageBody className="max-w-[1600px]">
      <div className="flex items-center justify-between gap-2 lg:hidden">
        <span className="truncate text-sm text-muted-foreground">{user.email}</span>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut /> Salir
        </Button>
      </div>
      <div className="flex flex-col gap-4 lg:flex-row lg:gap-8">
        <AdminNav
          items={items}
          active={current}
          onSelect={goTo}
          email={user.email}
          lastSync={overview?.lastSync}
          onLogout={handleLogout}
        />
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          {current === "panel" && (
            <PanelSection onNavigate={goTo} canSeeUsers={canSeeUsers} onStatus={onStatus} />
          )}
          {current === "loot" && <LootSection onStatus={onStatus} />}
          {current === "puntos" && <ReglasSection view="puntos" onStatus={onStatus} />}
          {current === "loteo" && <ReglasSection view="loteo" onStatus={onStatus} />}
          {current === "fullgeared" && <FullGearedSection onStatus={onStatus} />}
          {current === "usuarios" && canSeeUsers && <UsersSection onStatus={onStatus} />}
        </div>
      </div>
    </PageBody>
  );
}
