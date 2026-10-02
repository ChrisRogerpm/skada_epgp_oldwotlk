"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import { Moon, Star, Sun } from "lucide-react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Kbd } from "@/components/ui/kbd";
import { ClassIcon } from "@/components/wow/class-icon";
import { CharacterName } from "@/components/wow/character-name";
import { ItemIcon } from "@/components/wow/item-icon";
import { useRoster } from "@/hooks/use-roster";
import { useMyCharacter } from "@/hooks/use-my-character";
import { NAV_ITEMS } from "@/lib/nav";
import { formatPoints, getClassMeta } from "@/lib/wow";

const fold = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

// Coincidencia por subcadena (sin tildes): el filtro difuso de cmdk devolvía
// demasiados falsos positivos con un roster de cientos de nombres.
function containsFilter(value: string, search: string) {
  const v = fold(value);
  return fold(search)
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => v.includes(term))
    ? 1
    : 0;
}

const CommandMenuContext = createContext<{ open: () => void }>({ open: () => {} });

export function useCommandMenu() {
  return useContext(CommandMenuContext);
}

interface LootRuleEntry {
  item: string;
  icon: string;
  category: string;
  valueMin: number;
  raid: string;
}

/** Búsqueda global (Ctrl/⌘ K): páginas, personajes, ítems de las reglas y acciones. */
export function CommandMenuProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();
  const { roster, rankOf } = useRoster();
  const { myCharacter, toggleMyCharacter } = useMyCharacter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const { data: rules } = useQuery<unknown[]>({
    queryKey: ["reglas"],
    queryFn: async () => {
      const res = await fetch("/api/reglas");
      if (!res.ok) throw new Error("Error al obtener las reglas");
      return res.json();
    },
    enabled: open,
  });

  const lootRules = useMemo<LootRuleEntry[]>(() => {
    if (!Array.isArray(rules)) return [];
    const section = (rules as Record<string, unknown>[]).find((s) => s["Reglas de Loteo"])?.[
      "Reglas de Loteo"
    ] as { raid: string; items: Omit<LootRuleEntry, "raid">[] }[] | undefined;
    return (section ?? []).flatMap((r) => (r.items ?? []).map((i) => ({ ...i, raid: r.raid })));
  }, [rules]);

  const characters = useMemo(
    () =>
      roster.flatMap((m) => [
        { name: m.main, cls: m.class, icon: m.icon, main: m.main, amount: m.amount, isAlt: false },
        ...(m.alters ?? []).map((a) => ({
          name: a.name,
          cls: a.class,
          icon: a.icon,
          main: m.main,
          amount: m.amount,
          isAlt: true,
        })),
      ]),
    [roster],
  );

  const run = useCallback((fn: () => void) => {
    setOpen(false);
    fn();
  }, []);

  const ctx = useMemo(() => ({ open: () => setOpen(true) }), []);

  return (
    <CommandMenuContext.Provider value={ctx}>
      {children}
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Búsqueda global"
        description="Busca personajes, ítems, reglas y páginas"
      >
        <Command filter={containsFilter}>
          <div className="relative">
            <CommandInput placeholder="Buscar personaje, ítem o regla…" />
            <Kbd className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2">Esc</Kbd>
          </div>
          <CommandList className="max-h-[420px]">
            <CommandEmpty>Sin resultados.</CommandEmpty>
            <CommandGroup heading="Personajes">
              {characters.map((c) => (
                <CommandItem
                  key={c.name}
                  value={`personaje ${c.name} ${c.isAlt ? c.main : ""} ${getClassMeta(c.cls)?.name ?? ""}`}
                  onSelect={() =>
                    run(() => router.push(`/epgp?personaje=${encodeURIComponent(c.main)}`))
                  }
                >
                  <ClassIcon cls={c.cls} src={c.icon} size={22} />
                  <CharacterName cls={c.cls}>{c.name}</CharacterName>
                  <span className="truncate text-xs text-muted-foreground">
                    {c.isAlt
                      ? `alter de ${c.main}`
                      : `${formatPoints(c.amount)} pts · #${rankOf.get(c.main)}`}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
            {lootRules.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Ítems y reglas">
                  {lootRules.map((r, i) => (
                    <CommandItem
                      key={`${r.raid}-${r.item}-${i}`}
                      value={`ítem ${r.item} ${r.category} ${r.raid}`}
                      onSelect={() =>
                        run(() => router.push(`/reglas?q=${encodeURIComponent(r.item)}`))
                      }
                    >
                      <ItemIcon src={r.icon} name={r.item} size={22} />
                      <span className="text-purple-600 dark:text-purple-400">{r.item}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {r.category} · mín. {formatPoints(r.valueMin)} pts
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
            <CommandSeparator />
            <CommandGroup heading="Páginas">
              {NAV_ITEMS.map((item) => (
                <CommandItem
                  key={item.href}
                  value={`página ${item.label} ${item.description}`}
                  onSelect={() => run(() => router.push(item.href))}
                >
                  <item.icon />
                  <span>{item.label}</span>
                  <span className="truncate text-xs text-muted-foreground">{item.description}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Acciones">
              {myCharacter && (
                <CommandItem
                  value="acción quitar mi personaje"
                  onSelect={() => run(() => toggleMyCharacter(myCharacter))}
                >
                  <Star />
                  <span>Dejar de fijar a {myCharacter}</span>
                </CommandItem>
              )}
              <CommandItem
                value="acción cambiar tema claro oscuro"
                onSelect={() => run(() => setTheme(resolvedTheme === "dark" ? "light" : "dark"))}
              >
                {resolvedTheme === "dark" ? <Sun /> : <Moon />}
                <span>Cambiar a tema {resolvedTheme === "dark" ? "claro" : "oscuro"}</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
          <div className="flex gap-4 border-t px-3 py-2 text-xs text-muted-foreground">
            <span>↑↓ navegar</span>
            <span>↵ abrir</span>
            <span>Esc cerrar</span>
          </div>
        </Command>
      </CommandDialog>
    </CommandMenuContext.Provider>
  );
}
