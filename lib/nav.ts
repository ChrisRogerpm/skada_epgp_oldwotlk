import {
  BarChart3,
  Download,
  Gem,
  House,
  ScrollText,
  ShieldCheck,
  Swords,
  UserX,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  description: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Raid",
    items: [
      {
        href: "/",
        label: "Inicio",
        icon: House,
        description: "Resumen de tu personaje y la última raid",
      },
      { href: "/skada", label: "Skada", icon: Swords, description: "Daño y sanación por jefe" },
      {
        href: "/raids",
        label: "Raids",
        icon: Users,
        description: "Composición de grupos y botín por raid",
      },
      {
        href: "/full_geared",
        label: "Full Gear",
        icon: ShieldCheck,
        description: "Personajes con equipo completo ICC/RS",
      },
    ],
  },
  {
    label: "Botín",
    items: [
      {
        href: "/epgp",
        label: "EPGP",
        icon: BarChart3,
        description: "Roster de puntos e historial",
      },
      { href: "/loot", label: "Loot", icon: Gem, description: "Quién ganó qué ítem en cada raid" },
      {
        href: "/reglas",
        label: "Reglas",
        icon: ScrollText,
        description: "Beneficios, perjuicios y reglas de loteo",
      },
    ],
  },
  {
    label: "Hermandad",
    items: [
      {
        href: "/lista_negra",
        label: "Lista negra",
        icon: UserX,
        description: "Jugadores vetados y motivo",
      },
      {
        href: "/descargas",
        label: "Descargas",
        icon: Download,
        description: "Addons, parches y herramientas",
      },
    ],
  },
];

export const NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

export function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function findNav(pathname: string) {
  for (const group of NAV_GROUPS) {
    const item = group.items.find((i) => isActive(pathname, i.href));
    if (item) return { group, item };
  }
  if (pathname.startsWith("/admin")) {
    return { group: { label: "Administración", items: [] }, item: null };
  }
  return null;
}
