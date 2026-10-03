"use client";

import {
  Coins,
  Gem,
  LayoutDashboard,
  LogOut,
  ScrollText,
  ShieldCheck,
  UserCog,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { timeAgo, useNow } from "@/hooks/use-now";
import { cn } from "@/lib/utils";

export type AdminSectionId = "panel" | "loot" | "puntos" | "loteo" | "fullgeared" | "usuarios";

export interface AdminNavItem {
  id: AdminSectionId;
  label: string;
  icon: LucideIcon;
  group: string;
  badge?: { value: number; tone: "warning" | "muted" };
}

export const ADMIN_SECTIONS: Omit<AdminNavItem, "badge">[] = [
  { id: "panel", label: "Panel", icon: LayoutDashboard, group: "General" },
  { id: "loot", label: "Botín", icon: Gem, group: "Botín" },
  { id: "puntos", label: "Reglas de puntos", icon: Coins, group: "Reglas" },
  { id: "loteo", label: "Reglas de loteo", icon: ScrollText, group: "Reglas" },
  { id: "fullgeared", label: "Full Gear", icon: ShieldCheck, group: "Hermandad" },
  { id: "usuarios", label: "Usuarios y accesos", icon: UserCog, group: "Hermandad" },
];

interface AdminNavProps {
  items: AdminNavItem[];
  active: AdminSectionId;
  onSelect: (id: AdminSectionId) => void;
  email: string | undefined;
  lastSync: { at: string; tokenName: string } | null | undefined;
  onLogout: () => void;
}

function NavBadge({ badge }: { badge: NonNullable<AdminNavItem["badge"]> }) {
  return (
    <span
      className={cn(
        "ml-auto rounded-full px-1.5 font-mono text-xs tabular",
        badge.tone === "warning" ? "bg-highlight/15 text-highlight" : "text-muted-foreground",
      )}
    >
      {badge.value}
    </span>
  );
}

/** Menú propio del panel: columna lateral en escritorio, fila deslizable en el móvil. */
export default function AdminNav({
  items,
  active,
  onSelect,
  email,
  lastSync,
  onLogout,
}: AdminNavProps) {
  const now = useNow();
  const groups = items.reduce<{ name: string; items: AdminNavItem[] }[]>((acc, item) => {
    const group = acc.find((g) => g.name === item.group);
    if (group) group.items.push(item);
    else acc.push({ name: item.group, items: [item] });
    return acc;
  }, []);

  const syncStatus = (
    <div className="flex flex-col gap-1 rounded-lg border bg-card p-2.5 text-xs">
      <span className="flex items-center gap-2 text-sm">
        <span
          className={cn(
            "size-2 rounded-full",
            lastSync && now - new Date(lastSync.at).getTime() < 86_400_000
              ? "bg-positive"
              : "bg-muted-foreground",
          )}
        />
        Sync ScriptSkada
      </span>
      <span className="text-muted-foreground">
        {lastSync
          ? `Último envío ${timeAgo(new Date(lastSync.at).getTime(), now)}`
          : "Sin envíos registrados"}
      </span>
    </div>
  );

  return (
    <>
      {/* Móvil y tableta: fila deslizable */}
      <nav aria-label="Secciones de administración" className="-mx-4 lg:hidden">
        <ul className="flex gap-1 overflow-x-auto px-4 pb-1">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                aria-current={item.id === active ? "page" : undefined}
                onClick={() => onSelect(item.id)}
                className={cn(
                  "flex h-10 shrink-0 items-center gap-2 rounded-lg px-3 text-sm whitespace-nowrap transition-colors",
                  item.id === active
                    ? "bg-secondary font-medium text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <item.icon className="size-4" />
                {item.label}
                {item.badge && item.badge.value > 0 && <NavBadge badge={item.badge} />}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Escritorio: columna lateral */}
      <aside className="hidden w-56 shrink-0 lg:block">
        <nav
          aria-label="Secciones de administración"
          className="sticky top-20 flex flex-col gap-5"
        >
          {groups.map((group) => (
            <div key={group.name} className="flex flex-col gap-0.5">
              <span className="px-2.5 py-1.5 text-xs text-muted-foreground">{group.name}</span>
              {group.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-current={item.id === active ? "page" : undefined}
                  onClick={() => onSelect(item.id)}
                  className={cn(
                    "flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-left text-sm transition-colors",
                    item.id === active
                      ? "bg-secondary font-medium text-foreground"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                  )}
                >
                  <item.icon className="size-4" />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && item.badge.value > 0 && <NavBadge badge={item.badge} />}
                </button>
              ))}
            </div>
          ))}

          <div className="flex flex-col gap-2 border-t pt-4">
            {syncStatus}
            <div className="flex items-center gap-2 px-1">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold uppercase">
                {email?.[0] ?? "?"}
              </span>
              <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground" title={email}>
                {email}
              </span>
              <Button variant="ghost" size="icon-sm" onClick={onLogout} aria-label="Cerrar sesión">
                <LogOut />
              </Button>
            </div>
          </div>
        </nav>
      </aside>
    </>
  );
}
