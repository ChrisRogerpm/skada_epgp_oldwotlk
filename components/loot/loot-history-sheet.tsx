"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Gem } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { ClassIcon } from "@/components/wow/class-icon";
import { CharacterName } from "@/components/wow/character-name";
import { ItemIcon, itemNameClass } from "@/components/wow/item-icon";
import type { LootWinDetailed } from "@/app/types/Loot";
import { BOSSES_TRANSLATIONS } from "@/app/types/RaidLog";
import { resolveItemDisplayName, resolveWowheadItemId } from "@/src/domain/constants/constants";
import { cn } from "@/lib/utils";
import { itemQuality, itemUrl, refreshWowheadLinks } from "@/lib/wow";

interface LootHistorySheetProps {
  main: { name: string; class?: string; icon?: string; alters: string[] } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Todos los ítems ganados por un main y sus alters. */
export function LootHistorySheet({ main, open, onOpenChange }: LootHistorySheetProps) {
  const names = main ? [main.name, ...main.alters] : [];
  const namesQuery = names.join(",");

  const { data: history = [], isLoading } = useQuery<LootWinDetailed[]>({
    queryKey: ["lootHistory", namesQuery],
    queryFn: async () => {
      const res = await fetch(`/api/loot/history?names=${encodeURIComponent(namesQuery)}`);
      if (!res.ok) throw new Error("Error al obtener el historial de loot");
      return res.json();
    },
    enabled: open && !!main,
  });

  useEffect(() => {
    if (open && history.length) refreshWowheadLinks();
  }, [open, history]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b p-5">
          <div className="flex items-center gap-3 pr-8">
            <ClassIcon cls={main?.class} src={main?.icon} size={44} />
            <div className="min-w-0">
              <SheetTitle className="truncate text-lg">
                <CharacterName cls={main?.class} className="font-semibold">
                  {main?.name}
                </CharacterName>
              </SheetTitle>
              <SheetDescription>
                {history.length} {history.length === 1 ? "ítem ganado" : "ítems ganados"}
                {main?.alters.length ? ` · incluye ${main.alters.length} ${main.alters.length === 1 ? "alter" : "alters"}` : ""}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>
        <ScrollArea className="min-h-0 flex-1">
          {isLoading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : history.length === 0 ? (
            <Empty className="py-16">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Gem />
                </EmptyMedia>
                <EmptyTitle>Sin botín todavía</EmptyTitle>
                <EmptyDescription>Este jugador y sus alters aún no han ganado ítems.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <ul className="divide-y px-5">
              {history.map((w) => {
                const q = itemQuality(w.id_item);
                const name = resolveItemDisplayName(w.item_raid, w.id_item, w.class, w.item_name);
                const date = w.raid_date || w.created_at;
                return (
                  <li key={w.id} className="flex items-center gap-3 py-3">
                    <ItemIcon src={w.item_icon} name={name} quality={q} size={36} />
                    <div className="min-w-0 flex-1">
                      <a
                        href={itemUrl(resolveWowheadItemId(w.item_raid, w.id_item, w.class))}
                        target="_blank"
                        rel="noreferrer"
                        className={cn("block truncate text-sm font-medium hover:underline", itemNameClass(q))}
                      >
                        {name}
                      </a>
                      <p className="truncate text-xs text-muted-foreground">
                        {[w.boss_name ? (BOSSES_TRANSLATIONS[w.boss_name] ?? w.boss_name) : null, date ? format(parseISO(date), "d MMM yyyy", { locale: es }) : null]
                          .filter(Boolean)
                          .join(" · ") || "Registro histórico"}
                        {w.personaje !== main?.name && <> · {w.personaje}</>}
                      </p>
                      {!w.id_raids && w.note && <p className="truncate text-xs text-muted-foreground italic">“{w.note}”</p>}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="outline">{w.item_raid}</Badge>
                      {w.source === "manual" && <Badge variant="secondary">Manual</Badge>}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
