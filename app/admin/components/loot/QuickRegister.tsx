"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CircleAlert, CircleCheck, Link2, Link2Off, Loader2, NotebookPen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Kbd } from "@/components/ui/kbd";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { LootMatrix } from "@/app/types/Loot";
import { BOSSES_TRANSLATIONS } from "@/app/types/RaidLog";
import { useRoster } from "@/hooks/use-roster";
import { cn } from "@/lib/utils";
import { formatPoints } from "@/lib/wow";
import { useCharacterSearch } from "../../hooks/useCharacterSearch";
import { useLootRules } from "../../hooks/useLootRules";
import { adminJson } from "../../lib/api";
import CharacterSearchInput from "../shared/CharacterSearchInput";
import ItemSearchPicker from "../shared/ItemSearchPicker";
import { LOOT_RAIDS, type LootRaidCode, type LootWinRow } from "./types";

interface LinkPreview {
  encounter: {
    id: string;
    boss_name: string;
    raid_time: string;
    sessionLabel: string;
  } | null;
}

export interface QuickRegisterValues {
  personaje: string;
  class: string;
  raid: LootRaidCode;
  id_items: number[];
  note: string;
}

interface QuickRegisterProps {
  editing: LootWinRow | null;
  saving: boolean;
  onSubmit: (values: QuickRegisterValues, itemNames: Map<number, string>) => Promise<boolean>;
  onCancelEdit: () => void;
}

const EMPTY: QuickRegisterValues = { personaje: "", class: "", raid: "ICC", id_items: [], note: "" };

function fromRow(row: LootWinRow): QuickRegisterValues {
  const raid = LOOT_RAIDS.find((r) => r.value === row.item_raid?.toUpperCase())?.value ?? "ICC";
  return {
    personaje: row.personaje,
    class: row.class ?? "",
    raid,
    id_items: [row.id_item],
    note: row.note ?? "",
  };
}

/**
 * Registro rápido en una fila: jugador, raid, ítems y Enter. Debajo avisa si
 * alcanza el mínimo de loteo y a qué run quedará vinculado. Al editar una
 * entrega existente se reutiliza con un solo ítem.
 */
export default function QuickRegister({
  editing,
  saving,
  onSubmit,
  onCancelEdit,
}: QuickRegisterProps) {
  const [values, setValues] = useState<QuickRegisterValues>(EMPTY);
  const [showNote, setShowNote] = useState(false);
  // Al pasar a editar otra fila se recargan los campos (patrón "estado derivado del prop").
  const [editingId, setEditingId] = useState<number | null>(null);
  if ((editing?.id ?? null) !== editingId) {
    setEditingId(editing?.id ?? null);
    setValues(editing ? fromRow(editing) : EMPTY);
    setShowNote(!!editing?.note);
  }

  const chars = useCharacterSearch();
  const { memberByName } = useRoster();
  const { minByItem } = useLootRules();

  const { data: matrix } = useQuery<LootMatrix>({
    queryKey: ["lootMatrix", values.raid],
    queryFn: async () => {
      const res = await fetch(`/api/loot/matrix?raid=${values.raid}`);
      if (!res.ok) throw new Error("Error al obtener los ítems");
      return res.json();
    },
  });
  const itemOptions = matrix?.items ?? [];

  const known = !!values.class && !!values.personaje;
  const { data: link, isFetching: linking } = useQuery<LinkPreview>({
    queryKey: ["lootLink", values.personaje.toLowerCase(), values.raid],
    queryFn: () =>
      adminJson(
        `/api/loot/link?personaje=${encodeURIComponent(values.personaje)}&raid=${values.raid}`,
      ),
    enabled: known && !editing,
    staleTime: 60_000,
  });

  const member = values.personaje ? memberByName.get(values.personaje.toLowerCase()) : undefined;
  const mins = values.id_items.map((id) => minByItem.get(id)).filter((v): v is number => v != null);
  const requiredMin = mins.length ? Math.max(...mins) : null;
  const multiple = !editing;
  const count = values.id_items.length;
  const canSubmit = known && count > 0 && !saving;

  const toggleItem = (id: number) =>
    setValues((prev) => ({
      ...prev,
      id_items: !multiple
        ? [id]
        : prev.id_items.includes(id)
          ? prev.id_items.filter((x) => x !== id)
          : [...prev.id_items, id],
    }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    const names = new Map(itemOptions.map((i) => [i.id_item, i.name]));
    const ok = await onSubmit(values, names);
    if (ok && !editing) {
      // Se conserva la raid: lo normal es seguir repartiendo botín de la misma.
      setValues({ ...EMPTY, raid: values.raid });
      setShowNote(false);
    }
  };

  return (
    <Card className={cn("gap-3.5 p-4", editing && "border-primary/50")}>
      {editing && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span>
            Editando la entrega de <b className="font-medium">{editing.item_name}</b>
          </span>
          <Button variant="ghost" size="sm" onClick={onCancelEdit}>
            Cancelar edición
          </Button>
        </div>
      )}
      <form onSubmit={submit} aria-label="Registro rápido" className="flex flex-col gap-3.5">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex min-w-52 flex-1 flex-col gap-1.5">
            <Label htmlFor="q-player">Jugador</Label>
            <CharacterSearchInput
              id="q-player"
              value={values.personaje}
              valueClass={values.class}
              results={chars.results}
              loading={chars.loading}
              onChange={(text) => {
                setValues((prev) => ({ ...prev, personaje: text, class: "" }));
                chars.search(text);
              }}
              onSelect={(r) => {
                setValues((prev) => ({ ...prev, personaje: r.nombre_alter, class: r.clase }));
                chars.clear();
              }}
            />
          </div>
          <fieldset className="flex flex-col gap-1.5">
            <legend className="mb-1.5 text-sm font-medium">Raid</legend>
            <ToggleGroup
              type="single"
              variant="outline"
              value={values.raid}
              onValueChange={(v) =>
                v && setValues((prev) => ({ ...prev, raid: v as LootRaidCode, id_items: [] }))
              }
              className="h-10"
            >
              {LOOT_RAIDS.map((r) => (
                <ToggleGroupItem
                  key={r.value}
                  value={r.value}
                  title={r.label}
                  aria-label={r.label}
                  className="h-10 px-3.5 data-[state=on]:bg-secondary data-[state=on]:font-semibold"
                >
                  {r.short}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </fieldset>
          <div className="flex min-w-64 flex-[2] flex-col gap-1.5">
            <Label htmlFor="q-items">{multiple ? "Ítems" : "Ítem"}</Label>
            <ItemSearchPicker
              id="q-items"
              items={itemOptions}
              selectedIds={values.id_items}
              onToggle={toggleItem}
              multiple={multiple}
              triggerLabel={`Buscar ítem de ${LOOT_RAIDS.find((r) => r.value === values.raid)?.short}…`}
              emptyLabel="Sin ítems para esta raid"
            />
          </div>
          <Button type="submit" className="h-10" disabled={!canSubmit}>
            {saving && <Loader2 className="animate-spin" />}
            {editing ? "Guardar" : count > 1 ? `Registrar ${count}` : "Registrar"}
            {!editing && <Kbd className="bg-primary-foreground/15 text-primary-foreground">↵</Kbd>}
          </Button>
        </div>

        {showNote && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="q-note">Nota</Label>
            <Textarea
              id="q-note"
              value={values.note}
              onChange={(e) => setValues((prev) => ({ ...prev, note: e.target.value }))}
              placeholder="Ej.: loot histórico, reporte del oficial…"
              rows={2}
            />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
          {member && count > 0 && (
            <span
              className={cn(
                "flex items-center gap-1.5",
                requiredMin != null && member.amount < requiredMin
                  ? "text-negative"
                  : "text-positive",
              )}
            >
              {requiredMin != null && member.amount < requiredMin ? (
                <CircleAlert className="size-4" />
              ) : (
                <CircleCheck className="size-4" />
              )}
              {requiredMin == null
                ? "Sin mínimo en las reglas de loteo"
                : member.amount >= requiredMin
                  ? `Alcanza el mínimo (${formatPoints(requiredMin)} pts)`
                  : `No alcanza el mínimo (${formatPoints(requiredMin)} pts)`}
            </span>
          )}
          {member && (
            <span className="text-muted-foreground">
              {member.main === values.personaje ? "Main" : `Alter de ${member.main}`} ·{" "}
              <span className="font-mono text-foreground tabular">
                {formatPoints(member.amount)} pts
              </span>
            </span>
          )}
          {known && !editing && (
            <span className="flex items-center gap-1.5 text-muted-foreground">
              {linking ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : link?.encounter ? (
                <Link2 className="size-3.5" />
              ) : (
                <Link2Off className="size-3.5" />
              )}
              {link?.encounter ? (
                <span>
                  Se vinculará a{" "}
                  <b className="font-medium text-foreground">
                    {link.encounter.sessionLabel} ·{" "}
                    {BOSSES_TRANSLATIONS[link.encounter.boss_name] ?? link.encounter.boss_name}{" "}
                    {link.encounter.raid_time.slice(0, 5)}
                  </b>
                </span>
              ) : linking ? (
                "Buscando su raid…"
              ) : (
                "Sin raid reciente: quedará sin vincular"
              )}
            </span>
          )}
          <span className="ml-auto flex items-center gap-3">
            {!showNote && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={() => setShowNote(true)}
              >
                <NotebookPen /> Añadir nota
              </Button>
            )}
            {!editing && (
              <span className="text-muted-foreground">Puedes deshacerlo desde el aviso</span>
            )}
          </span>
        </div>
      </form>
    </Card>
  );
}
