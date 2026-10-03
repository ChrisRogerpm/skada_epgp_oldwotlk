"use client";

import { useMemo, useState } from "react";
import { Copy, Gem, History, Loader2, Pencil, Search, Trash2, UserRoundPen } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { ItemIcon, itemNameClass } from "@/components/wow/item-icon";
import { ClassIcon } from "@/components/wow/class-icon";
import { CharacterName } from "@/components/wow/character-name";
import { BOSSES_TRANSLATIONS } from "@/app/types/RaidLog";
import { raidShort } from "@/lib/raids";
import { cn } from "@/lib/utils";
import { itemQuality, limaIsoDate } from "@/lib/wow";
import { useCharacterSearch } from "../../hooks/useCharacterSearch";
import type { EpgpSearchResult } from "../../types";
import AdminPagination from "../shared/AdminPagination";
import CharacterSearchInput from "../shared/CharacterSearchInput";
import { LOOT_RAIDS, type LootWinRow, type LootWinsPage } from "./types";

export interface LootFilters {
  search: string;
  raid: string;
  days: string;
  source: "all" | "sync" | "manual";
}

interface LootEntriesProps {
  data: LootWinsPage | undefined;
  loading: boolean;
  filters: LootFilters;
  onFiltersChange: (filters: LootFilters) => void;
  page: number;
  onPageChange: (page: number) => void;
  editingId: number | null;
  busy: boolean;
  onEdit: (row: LootWinRow) => void;
  onDelete: (rows: LootWinRow[]) => void;
  onReassign: (rows: LootWinRow[], to: EpgpSearchResult) => Promise<boolean>;
}

/** Fecha de la noche a la que pertenece una entrega (la de su raid, o la de registro). */
function nightOf(row: LootWinRow) {
  if (row.raid_date) return row.raid_date;
  return row.created_at ? limaIsoDate(new Date(row.created_at)) : "";
}

function timeOf(row: LootWinRow) {
  if (row.raid_time) return row.raid_time.slice(0, 5);
  if (!row.created_at) return "";
  return new Date(row.created_at).toLocaleTimeString("es-PE", {
    timeZone: "America/Lima",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function nightLabel(iso: string) {
  if (!iso) return "Sin fecha";
  const label = format(parseISO(iso), "EEEE dd/MM", { locale: es });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function ReassignButton({
  count,
  onApply,
}: {
  count: number;
  onApply: (to: EpgpSearchResult) => Promise<boolean>;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const chars = useCharacterSearch();
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <UserRoundPen /> Cambiar jugador
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="flex w-80 flex-col gap-2">
        <p className="text-sm font-medium">
          Asignar {count === 1 ? "la entrega" : `las ${count} entregas`} a…
        </p>
        <CharacterSearchInput
          value={text}
          results={chars.results}
          loading={chars.loading}
          onChange={(t) => {
            setText(t);
            chars.search(t);
          }}
          onSelect={async (r) => {
            chars.clear();
            if (await onApply(r)) {
              setOpen(false);
              setText("");
            }
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

/** Entregas agrupadas por noche de raid, con filtros, selección múltiple y aviso de copias. */
export default function LootEntries({
  data,
  loading,
  filters,
  onFiltersChange,
  page,
  onPageChange,
  editingId,
  busy,
  onEdit,
  onDelete,
  onReassign,
}: LootEntriesProps) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const rows = useMemo(() => data?.data ?? [], [data]);

  // La selección solo vale para las filas visibles.
  const visibleSelected = rows.filter((r) => selected.has(r.id));

  const groups = useMemo(() => {
    const map = new Map<string, LootWinRow[]>();
    for (const row of rows) {
      const key = nightOf(row);
      map.set(key, [...(map.get(key) ?? []), row]);
    }
    return [...map.entries()].map(([night, list]) => {
      // Misma entrega repetida (jugador + ítem en la misma noche): la primera vale, el resto son copias.
      const seen = new Set<string>();
      const copies = new Set<number>();
      [...list]
        .sort((a, b) => (a.source === "manual" ? -1 : 0) - (b.source === "manual" ? -1 : 0))
        .forEach((r) => {
          const key = `${r.personaje.toLowerCase()}|${r.id_item}`;
          if (seen.has(key)) copies.add(r.id);
          else seen.add(key);
        });
      const raids = [...new Set(list.map((r) => (r.boss_name ? raidShort(r.boss_name) : null)))]
        .filter(Boolean)
        .join(" · ");
      return { night, list, copies, raids };
    });
  }, [rows]);

  const toggle = (id: number, on: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  const allOn = rows.length > 0 && visibleSelected.length === rows.length;

  const setFilter = (patch: Partial<LootFilters>) => {
    setSelected(new Set());
    onFiltersChange({ ...filters, ...patch });
  };

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <div className="flex flex-wrap items-center gap-2 p-3">
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={filters.search}
            onChange={(e) => setFilter({ search: e.target.value })}
            placeholder="Filtrar por jugador…"
            aria-label="Filtrar por jugador"
            className="h-9 pl-8"
          />
        </div>
        <Select value={filters.raid} onValueChange={(v) => setFilter({ raid: v })}>
          <SelectTrigger className="h-9! w-36" aria-label="Raid">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las raids</SelectItem>
            {LOOT_RAIDS.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.short}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filters.days} onValueChange={(v) => setFilter({ days: v })}>
          <SelectTrigger className="h-9! w-40" aria-label="Periodo">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 días</SelectItem>
            <SelectItem value="30">Últimos 30 días</SelectItem>
            <SelectItem value="0">Todo el historial</SelectItem>
          </SelectContent>
        </Select>
        <ToggleGroup
          type="single"
          size="sm"
          value={filters.source}
          onValueChange={(v) => v && setFilter({ source: v as LootFilters["source"] })}
          aria-label="Origen"
          className="gap-1"
        >
          {(
            [
              ["all", "Todos"],
              ["sync", "Sync"],
              ["manual", "Manual"],
            ] as const
          ).map(([v, l]) => (
            <ToggleGroupItem
              key={v}
              value={v}
              className="h-8 rounded-full! border! px-3 text-xs data-[state=on]:bg-secondary"
            >
              {l}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <span className="ml-auto text-sm text-muted-foreground">
          {loading ? <Loader2 className="size-4 animate-spin" /> : `${data?.total ?? 0} entregas`}
        </span>
      </div>

      {visibleSelected.length > 0 && (
        <div
          role="toolbar"
          aria-label="Acciones sobre la selección"
          className="mx-3 mb-2 flex flex-wrap items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-sm"
        >
          <span className="font-medium">
            {visibleSelected.length}{" "}
            {visibleSelected.length === 1 ? "seleccionada" : "seleccionadas"}
          </span>
          <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
            Quitar selección
          </Button>
          <span className="flex-1" />
          <ReassignButton
            count={visibleSelected.length}
            onApply={async (to) => {
              const ok = await onReassign(visibleSelected, to);
              if (ok) setSelected(new Set());
              return ok;
            }}
          />
          <Button
            variant="outline"
            size="sm"
            disabled={busy}
            className="border-negative/40 text-negative hover:text-negative"
            onClick={() => {
              onDelete(visibleSelected);
              setSelected(new Set());
            }}
          >
            <Trash2 /> Eliminar
          </Button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className={cn("w-full min-w-[760px] text-sm", loading && "opacity-60")}>
          <thead>
            <tr className="text-left text-muted-foreground">
              <th className="w-10 px-4 py-2 font-medium">
                <Checkbox
                  checked={allOn}
                  onCheckedChange={(v) =>
                    setSelected(v === true ? new Set(rows.map((r) => r.id)) : new Set())
                  }
                  aria-label="Seleccionar todo"
                />
              </th>
              <th className="px-2 py-2 font-medium">Ítem</th>
              <th className="px-2 py-2 font-medium">Jugador</th>
              <th className="px-2 py-2 font-medium">Run / jefe</th>
              <th className="px-2 py-2 font-medium">Origen</th>
              <th className="px-2 py-2 text-right font-medium">Hora</th>
              <th className="w-20 px-4 py-2">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          {groups.map((group) => (
            <tbody key={group.night || "none"}>
              <tr>
                <td colSpan={7} className="border-t bg-muted/40 px-4 py-2">
                  <span className="font-semibold">{nightLabel(group.night)}</span>
                  <span className="text-muted-foreground">
                    {group.raids ? ` · ${group.raids}` : ""} · {group.list.length}{" "}
                    {group.list.length === 1 ? "entrega" : "entregas"}
                  </span>
                  {group.copies.size > 0 && (
                    <Badge
                      variant="outline"
                      className="ml-2 border-highlight/40 bg-highlight/10 text-highlight"
                    >
                      {group.copies.size}{" "}
                      {group.copies.size === 1 ? "posible copia" : "posibles copias"}
                    </Badge>
                  )}
                </td>
              </tr>
              {group.list.map((row) => {
                const q = itemQuality(row.id_item);
                const isCopy = group.copies.has(row.id);
                const checked = selected.has(row.id);
                return (
                  <tr
                    key={row.id}
                    className={cn(
                      "border-t transition-colors hover:bg-muted/30",
                      checked && "bg-primary/5",
                      editingId === row.id && "bg-primary/10",
                      isCopy && "shadow-[inset_3px_0_0_var(--highlight)]",
                    )}
                  >
                    <td className="px-4 py-2">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(v) => toggle(row.id, v === true)}
                        aria-label={`Seleccionar ${row.item_name} de ${row.personaje}`}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex items-center gap-2.5">
                        <ItemIcon src={row.item_icon} name={row.item_name} quality={q} size={30} />
                        <span className={cn("max-w-60 truncate font-medium", itemNameClass(q))}>
                          {row.item_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex items-center gap-2">
                        <ClassIcon cls={row.class} size={22} />
                        <CharacterName cls={row.class}>{row.personaje}</CharacterName>
                      </div>
                    </td>
                    <td className="px-2 py-2 text-muted-foreground">
                      {row.id_raids ? (
                        <span className="text-foreground">
                          {BOSSES_TRANSLATIONS[row.boss_name] ?? row.boss_name}
                        </span>
                      ) : (
                        <span
                          className="flex items-center gap-1 text-amber-600 dark:text-amber-400"
                          title={row.note || "Sin raid vinculada"}
                        >
                          <History className="size-3.5" /> Sin vincular
                          {row.note ? ` · ${row.note}` : ""}
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-2">
                      {isCopy && row.source !== "manual" ? (
                        <Button
                          variant="outline"
                          size="xs"
                          disabled={busy}
                          className="rounded-full border-highlight/40 text-highlight hover:text-highlight"
                          onClick={() => onDelete([row])}
                        >
                          <Copy /> Quitar copia
                        </Button>
                      ) : (
                        <Badge
                          variant="outline"
                          className={
                            row.source === "manual"
                              ? "border-amber-500/40 text-amber-600 dark:text-amber-400"
                              : "text-muted-foreground"
                          }
                        >
                          {row.source === "manual" ? "Manual" : "Sync"}
                        </Badge>
                      )}
                    </td>
                    <td className="px-2 py-2 text-right font-mono text-muted-foreground tabular">
                      {timeOf(row)}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex justify-end gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => onEdit(row)}
                          aria-label={`Editar ${row.item_name} de ${row.personaje}`}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => onDelete([row])}
                          aria-label={`Eliminar ${row.item_name} de ${row.personaje}`}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          ))}
        </table>
      </div>
      {rows.length === 0 && !loading && (
        <Empty className="border-t py-12">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Gem />
            </EmptyMedia>
            <EmptyTitle>No hay entregas con estos filtros</EmptyTitle>
          </EmptyHeader>
        </Empty>
      )}
      <AdminPagination
        page={page}
        totalPages={data?.totalPages ?? 1}
        onChange={(p) => {
          setSelected(new Set());
          onPageChange(p);
        }}
      />
    </Card>
  );
}
