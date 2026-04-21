"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sword, BarChart2, ScrollText, Settings, UserX, Users, Shield, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import clsx from "clsx";

const NAV_ITEMS = [
  { href: "/skada", label: "Skada", icon: Sword },
  { href: "/raids", label: "Raids", icon: Users },
  { href: "/epgp", label: "Epgp", icon: BarChart2 },
  { href: "/full_geared", label: "Full Gear", icon: Shield },
  { href: "/reglas", label: "Reglas", icon: ScrollText },
  { href: "/lista_negra", label: "Lista Negra", icon: UserX },
  { href: "/admin", label: "Admin", icon: Settings },
];

export default function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Close menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <nav className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between h-16">
        {/* Left: Logo */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-emerald-500/10 rounded-lg border border-emerald-500/20 flex items-center justify-center group-hover:border-emerald-500/40 transition-all">
              <Shield className="text-emerald-400 w-5 h-5" />
            </div>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 font-black text-xl tracking-tighter uppercase font-display">
              Old Legends
            </span>
          </Link>

          <div className="hidden md:block h-6 w-px bg-white/10" />

          {/* Desktop Nav links */}
          <div className="hidden lg:flex items-center gap-1">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={clsx(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all font-display",
                    active
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-lg"
                      : "text-slate-500 hover:text-slate-200 hover:bg-white/5 border border-transparent",
                  )}
                >
                  <Icon size={14} />
                  {label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right: Mobile Menu Toggle */}
        <div className="lg:hidden">
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-slate-400 hover:text-white bg-white/5 rounded-xl border border-white/5 transition-all"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <div className={clsx(
        "lg:hidden absolute top-full left-0 w-full bg-slate-950 border-b border-white/5 transition-all duration-500 overflow-hidden",
        isOpen ? "max-h-[80vh] opacity-100 py-4" : "max-h-0 opacity-0 py-0"
      )}>
        <div className="px-4 space-y-2">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  "flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all",
                  active
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "text-slate-500 hover:text-slate-200 bg-white/[0.02]"
                )}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
