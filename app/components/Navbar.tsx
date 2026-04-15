"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sword, BarChart2, ScrollText, Settings, UserX, Users } from "lucide-react";
import clsx from "clsx";

const NAV_ITEMS = [
  { href: "/skada", label: "Skada", icon: Sword },
  { href: "/raids", label: "Raids", icon: Users },
  { href: "/epgp", label: "Epgp", icon: BarChart2 },
  { href: "/reglas", label: "Reglas", icon: ScrollText },
  { href: "/lista_negra", label: "Lista Negra", icon: UserX },
  { href: "/admin", label: "Admin", icon: Settings },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/60">
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 flex items-center gap-6 h-14">
        {/* Logo */}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 font-extrabold text-lg tracking-tight select-none">
          Old Legends
        </span>

        <div className="h-5 w-px bg-slate-800" />

        {/* Nav links */}
        <div className="flex items-center gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  "flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all",
                  active
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent",
                )}
              >
                <Icon size={15} />
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
