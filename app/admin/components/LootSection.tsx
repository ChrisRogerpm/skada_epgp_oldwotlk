"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CircleAlert, CircleCheck, Gem, History, Loader2, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { ItemIcon, itemNameClass } from "@/components/wow/item-icon";
import { ClassIcon } from "@/components/wow/class-icon";
import { CharacterName } from "@/components/wow/character-name";
import { LOOT_RAID_TABS } from "@/app/types/Loot";
import { BOSSES_TRANSLATIONS } from "@/app/types/RaidLog";
import { useRoster } from "@/hooks/use-roster";
import { cn } from "@/lib/utils";
import { formatPoints, itemQuality } from "@/lib/wow";
import { useLootAdmin } from "../hooks/useLootAdmin";
import { AdminStatus } from "../types";
import ItemSearchPicker from "./shared/ItemSearchPicker";
import CharacterSearchInput from "./shared/CharacterSearchInput";
import AdminPagination from "./shared/AdminPagination";

interface LootSectionProps {
  search: string;
  onStatus: (status: AdminStatus) => void;
}

export default function LootSection({ search, onStatus }: LootSectionProps) {
  const {
    wins,
    totalItems,
    currentPage,
    setCurrentPage,
    totalPages,
    isLoading,
    isSaving,
    isSearchingChar,
    charSearchResults,
    itemOptions,
    winForm,
    setWinForm,
    searchCharacters,
    selectSearchResult,
    editWin,
    resetForm,
    saveWin,
    deleteWin,
  } = useLootAdmin(search, onStatus);
  const { memberByName } = useRoster();
  const [sourceFilter, setSourceFilter] = useState<"all" | "sync" | "manual">("all");

  // Mínimo de loteo de cada ítem (reglas), para avisar si el jugador alcanza.
  const { data: rules } = useQuery<Record<string, unknown>[]>({
    queryKey: ["reglas"],
    queryFn: async () => {
      const res = await fetch("/api/reglas");
      if (!res.ok) throw new Error("Error al obtener las reglas");
      return res.json();
    },
  });
  const minByItem = useMemo(() => {
    const map = new Map<number, number>();
    const section = (rules ?? []).find((r) => r["Reglas de Loteo"])?.["Reglas de Loteo"] as
      { items: { idItem?: number | null; valueMin: number }[] }[] | undefined;
    section?.forEach((r) => r.items?.forEach((i) => i.idItem && map.set(i.idItem, i.valueMin)));
    return map;
  }, [rules]);

  // Editar un registro existente siempre es de un solo ítem (es una fila);
  // registrar uno nuevo admite elegir varios de una sola vez.
  const isMultiSelect = !winForm.id;
  const member = winForm.personaje ? memberByName.get(winForm.personaje.toLowerCase()) : undefined;
  const count = winForm.id_items.length;
  const mins = winForm.id_items
    .map((id) => minByItem.get(id))
    .filter((v): v is number => v != null);
  const requiredMin = mins.length ? Math.max(...mins) : null;
  const visibleWins =
    sourceFilter === "all" ? wins : wins.filter((w) => (w.source ?? "sync") === sourceFilter);

  const toggleItem = (id_item: number) => {
    if (!isMultiSelect) {
      setWinForm((prev) => ({ ...prev, id_items: [id_item] }));
      return;
    }
    setWinForm((prev) => ({
      ...prev,
      id_items: prev.id_items.includes(id_item)
        ? prev.id_items.filter((id) => id !== id_item)
        : [...prev.id_items, id_item],
    }));
  };

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[400px_minmax(0,1fr)]">
      <Card>
        <CardHeader>
          <CardTitle>{winForm.id ? "Editar registro" : "Registrar botín"}</CardTitle>
          <CardDescription>
            {winForm.id
              ? "Corrige el ítem, el personaje o la nota."
              : "Asigna uno o varios ítems a un jugador."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveWin} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="loot-character">Jugador</Label>
              <CharacterSearchInput
                id="loot-character"
                value={winForm.personaje}
                valueClass={winForm.class}
                results={charSearchResults}
                loading={isSearchingChar}
                onChange={(text) => {
                  setWinForm({ ...winForm, personaje: text });
                  searchCharacters(text);
                }}
                onSelect={selectSearchResult}
              />
              {member && (
                <p className="text-xs text-muted-foreground">
                  {member.main === winForm.personaje ? "Main" : `Alter de ${member.main}`} ·{" "}
                  <span className="font-mono tabular">{formatPoints(member.amount)} pts</span>
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label>Raid</Label>
              <Tabs
                value={winForm.raid}
                onValueChange={(v) => setWinForm({ ...winForm, raid: v, id_items: [] })}
              >
                <TabsList className="w-full">
                  {LOOT_RAID_TABS.map((t) => (
                    <TabsTrigger key={t.value} value={t.value} title={t.label} className="flex-1">
                      {t.short}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="loot-items">{isMultiSelect ? "Ítems" : "Ítem"}</Label>
              <ItemSearchPicker
                id="loot-items"
                items={itemOptions}
                selectedIds={winForm.id_items}
                onToggle={toggleItem}
                multiple={isMultiSelect}
                triggerLabel={isMultiSelect ? "Elige uno o más ítems…" : "Elige un ítem…"}
                emptyLabel={`Sin ítems para ${winForm.raid}`}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="loot-note">
                Nota <span className="font-normal text-muted-foreground">(opcional)</span>
              </Label>
              <Textarea
                id="loot-note"
                value={winForm.note}
                onChange={(e) => setWinForm({ ...winForm, note: e.target.value })}
                placeholder="Ej.: loot histórico, reporte del oficial…"
                rows={3}
              />
            </div>

            {member && count > 0 && (
              <div
                className={cn(
                  "flex items-start gap-2.5 rounded-lg p-3 text-sm",
                  requiredMin != null && member.amount < requiredMin
                    ? "bg-negative/10"
                    : "bg-muted",
                )}
              >
                {requiredMin != null && member.amount < requiredMin ? (
                  <CircleAlert className="mt-0.5 size-4 shrink-0 text-negative" />
                ) : (
                  <CircleCheck className="mt-0.5 size-4 shrink-0 text-positive" />
                )}
                <span>
                  {member.main} tiene{" "}
                  <b className="font-mono tabular">{formatPoints(member.amount)} pts</b>.{" "}
                  {requiredMin == null
                    ? "Los ítems elegidos no tienen mínimo en las reglas de loteo."
                    : member.amount >= requiredMin
                      ? `Alcanza el mínimo de loteo (${formatPoints(requiredMin)} pts).`
                      : `No alcanza el mínimo de loteo (${formatPoints(requiredMin)} pts).`}
                </span>
              </div>
            )}

            <div className="flex justify-end gap-2">
              {(winForm.id || winForm.personaje || count > 0) && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              )}
              <Button type="submit" disabled={isSaving || !winForm.personaje || count === 0}>
                {isSaving && <Loader2 className="animate-spin" />}
                {winForm.id
                  ? "Guardar cambios"
                  : count > 1
                    ? `Registrar ${count} ítems`
                    : "Registrar ítem"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="gap-0 overflow-hidden py-0">
        <CardHeader className="border-b py-4">
          <CardTitle>Registros de botín</CardTitle>
          <CardDescription>{totalItems} registros · sync automático y manuales</CardDescription>
          <CardAction>
            <ToggleGroup
              type="single"
              size="sm"
              value={sourceFilter}
              onValueChange={(v) => v && setSourceFilter(v as typeof sourceFilter)}
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
                  className="h-7 rounded-full! border! px-3 text-xs data-[state=on]:bg-secondary"
                >
                  {l}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </CardAction>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Ítem</TableHead>
              <TableHead>Jugador</TableHead>
              <TableHead className="hidden md:table-cell">Jefe · fecha</TableHead>
              <TableHead>Origen</TableHead>
              <TableHead className="w-20">
                <span className="sr-only">Acciones</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className={cn(isLoading && "opacity-60")}>
            {visibleWins.map((win) => {
              const q = itemQuality(win.id_item);
              return (
                <TableRow key={win.id} className={cn(winForm.id === win.id && "bg-primary/5")}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <ItemIcon src={win.item_icon} name={win.item_name} quality={q} size={30} />
                      <span className={cn("max-w-56 truncate font-medium", itemNameClass(q))}>
                        {win.item_name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <ClassIcon cls={win.class} size={22} />
                      <CharacterName cls={win.class}>{win.personaje}</CharacterName>
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
                    {win.id_raids ? (
                      <>
                        <div className="text-foreground">
                          {BOSSES_TRANSLATIONS[win.boss_name] ?? win.boss_name}
                        </div>
                        {win.item_raid} · {win.raid_date}
                      </>
                    ) : (
                      <span
                        className="flex items-center gap-1 text-amber-600 dark:text-amber-400"
                        title={win.note || "Sin sesión de raid registrada"}
                      >
                        <History className="size-3" /> Histórico{win.note ? ` · ${win.note}` : ""}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        win.source === "manual"
                          ? "border-amber-500/40 text-amber-600 dark:text-amber-400"
                          : "text-muted-foreground"
                      }
                    >
                      {win.source === "manual" ? "Manual" : "Sync"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => editWin(win)}
                        aria-label="Editar registro"
                      >
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => deleteWin(win.id)}
                        aria-label="Eliminar registro"
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {visibleWins.length === 0 && !isLoading && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={5}>
                  <Empty className="py-12">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <Gem />
                      </EmptyMedia>
                      <EmptyTitle>No hay registros de botín</EmptyTitle>
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
