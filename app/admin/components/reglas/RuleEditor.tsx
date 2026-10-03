"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Loader2, Minus, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ItemIcon, itemNameClass } from "@/components/wow/item-icon";
import { CharacterName } from "@/components/wow/character-name";
import type { LootMatrix } from "@/app/types/Loot";
import { REGLAS_RAID_TABS } from "@/app/types/Reglas";
import { useRoster } from "@/hooks/use-roster";
import { cn } from "@/lib/utils";
import { formatPoints, itemQuality, itemUrl } from "@/lib/wow";
import type { LootRuleForm } from "../../hooks/useReglasLoteoAdmin";
import ItemSearchPicker from "../shared/ItemSearchPicker";

const NEW_CATEGORY = "__new__";
const STEP = 50;
const BINS = 12;

interface RuleEditorProps {
  initial: LootRuleForm;
  categories: string[];
  requirementOptions: string[];
  saving: boolean;
  onSave: (form: LootRuleForm) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

/** Distribución de puntos del roster con la línea del mínimo: cuántos podrían lotear el ítem. */
function Reach({ min }: { min: number }) {
  const { ranked } = useRoster();
  const amounts = ranked.map((m) => m.amount);
  const max = Math.max(1, ...amounts);
  const binSize = Math.ceil(max / BINS);
  const bins = Array.from({ length: BINS }, (_, i) => ({
    from: i * binSize,
    count: amounts.filter((a) => a >= i * binSize && a < (i + 1) * binSize).length,
  }));
  const peak = Math.max(1, ...bins.map((b) => b.count));
  const eligible = ranked.filter((m) => m.amount >= min);

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium">
        Con este mínimo pueden lotearlo{" "}
        <span className="text-positive">
          {eligible.length} de {ranked.length}
        </span>
      </p>
      <div aria-hidden="true" className="flex h-14 items-end gap-0.5">
        {bins.map((b) => (
          <span
            key={b.from}
            className={cn(
              "flex-1 rounded-sm",
              b.from + binSize > min ? "bg-primary" : "bg-muted-foreground/30",
            )}
            style={{ height: `${Math.max(4, (b.count / peak) * 100)}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between font-mono text-xs text-muted-foreground tabular">
        <span>0</span>
        <span>{formatPoints(min)}</span>
        <span>{formatPoints(max)}</span>
      </div>
      {eligible.length > 0 && (
        <ol className="flex flex-col gap-1 text-sm">
          {eligible.slice(0, 3).map((m, i) => (
            <li key={m.main} className="flex items-center gap-2">
              <span className="w-4 font-mono text-xs text-muted-foreground">{i + 1}</span>
              <CharacterName cls={m.class} className="flex-1 truncate">
                {m.main}
              </CharacterName>
              <span className="font-mono tabular">{formatPoints(m.amount)}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

/** Editor de una regla de loteo, al lado de la tabla. */
export default function RuleEditor({
  initial,
  categories,
  requirementOptions,
  saving,
  onSave,
  onCancel,
  onDelete,
}: RuleEditorProps) {
  const [form, setForm] = useState(initial);
  const [newCategory, setNewCategory] = useState(
    !!initial.categoria && !categories.includes(initial.categoria),
  );
  const [reqDraft, setReqDraft] = useState("");

  const { data: matrix } = useQuery<LootMatrix>({
    queryKey: ["lootMatrix", form.raidCode],
    queryFn: async () => {
      const res = await fetch(`/api/loot/matrix?raid=${form.raidCode}`);
      if (!res.ok) throw new Error("Error al obtener los ítems");
      return res.json();
    },
  });
  const itemOptions = useMemo(() => matrix?.items ?? [], [matrix]);
  const q = itemQuality(form.idItem);

  const addRequirement = (text: string) => {
    const value = text.trim();
    if (!value || form.requisitos.includes(value)) return;
    setForm({ ...form, requisitos: [...form.requisitos, value] });
    setReqDraft("");
  };
  const suggestions = requirementOptions.filter((r) => !form.requisitos.includes(r)).slice(0, 4);
  const valid = !!form.categoria.trim() && !!form.nombreItem;

  return (
    <Card className="gap-5 p-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (valid) onSave(form);
        }}
        className="flex flex-col gap-5"
        aria-label={form.id ? "Editar regla" : "Nueva regla"}
      >
        <div className="flex items-center gap-3">
          {form.nombreItem ? (
            <ItemIcon src={form.iconUrl} name={form.nombreItem} quality={q} size={44} />
          ) : (
            <span className="size-11 rounded-md border border-dashed" />
          )}
          <div className="min-w-0 flex-1">
            <h2 className={cn("truncate font-semibold", form.nombreItem && itemNameClass(q))}>
              {form.nombreItem || (form.id ? "Editar regla" : "Nueva regla")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {form.raidCode}
              {form.categoria ? ` · ${form.categoria}` : ""}
            </p>
          </div>
          <Button type="button" variant="ghost" size="icon-sm" onClick={onCancel} aria-label="Cerrar">
            <X />
          </Button>
        </div>

        {!form.id && (
          <div className="flex flex-col gap-1.5">
            <Label>Raid</Label>
            <ToggleGroup
              type="single"
              variant="outline"
              value={form.raidCode}
              onValueChange={(v) =>
                v && setForm({ ...form, raidCode: v as LootRuleForm["raidCode"], idItem: null, nombreItem: "", iconUrl: "" })
              }
            >
              {REGLAS_RAID_TABS.map((t) => (
                <ToggleGroupItem
                  key={t.value}
                  value={t.value}
                  title={t.label}
                  className="h-9 flex-1 data-[state=on]:bg-secondary data-[state=on]:font-semibold"
                >
                  {t.value === "TOGC" ? "ToGC" : t.value}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="rule-item">Ítem</Label>
          <ItemSearchPicker
            id="rule-item"
            items={itemOptions}
            selectedIds={form.idItem !== null ? [form.idItem] : []}
            onToggle={(id) => {
              const item = itemOptions.find((i) => i.id_item === id);
              if (item) setForm({ ...form, idItem: id, nombreItem: item.name, iconUrl: item.icon });
            }}
            triggerLabel="Elige un ítem…"
            emptyLabel="Sin ítems para esta raid"
            fallbackLabel={form.idItem === null ? form.nombreItem || undefined : undefined}
            fallbackIcon={form.iconUrl}
          />
          {form.nombreItem && (
            <a
              href={itemUrl(form.idItem, form.nombreItem)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="size-3" /> Ver en la base de datos
            </a>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="rule-cat">Categoría</Label>
          {newCategory || categories.length === 0 ? (
            <div className="flex gap-2">
              <Input
                id="rule-cat"
                value={form.categoria}
                onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                placeholder="Nombre de la nueva categoría"
                className="h-9"
              />
              {categories.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setNewCategory(false);
                    setForm({ ...form, categoria: "" });
                  }}
                >
                  Existente
                </Button>
              )}
            </div>
          ) : (
            <Select
              value={form.categoria || undefined}
              onValueChange={(v) => {
                if (v === NEW_CATEGORY) {
                  setNewCategory(true);
                  setForm({ ...form, categoria: "" });
                } else setForm({ ...form, categoria: v });
              }}
            >
              <SelectTrigger id="rule-cat" className="h-9! w-full">
                <SelectValue placeholder="Elige una categoría" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
                <SelectItem value={NEW_CATEGORY}>+ Nueva categoría…</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="rule-min">Puntos mínimos</Label>
          <div className="flex gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="icon-lg"
              aria-label={`Restar ${STEP}`}
              onClick={() => setForm({ ...form, valorMinimo: Math.max(0, form.valorMinimo - STEP) })}
            >
              <Minus />
            </Button>
            <Input
              id="rule-min"
              type="number"
              inputMode="numeric"
              value={form.valorMinimo}
              onChange={(e) => setForm({ ...form, valorMinimo: parseInt(e.target.value) || 0 })}
              className="h-9 text-center font-mono"
            />
            <Button
              type="button"
              variant="outline"
              size="icon-lg"
              aria-label={`Sumar ${STEP}`}
              onClick={() => setForm({ ...form, valorMinimo: form.valorMinimo + STEP })}
            >
              <Plus />
            </Button>
          </div>
          {initial.id && initial.valorMinimo !== form.valorMinimo && (
            <span className="text-xs text-muted-foreground">
              Antes: <span className="font-mono">{formatPoints(initial.valorMinimo)}</span>
            </span>
          )}
        </div>

        <Reach min={form.valorMinimo} />

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="rule-req">Requisitos</Label>
          <div className="flex flex-wrap gap-1.5">
            {form.requisitos.map((req) => (
              <span
                key={req}
                className="flex h-7 items-center gap-1 rounded-full bg-secondary pr-1 pl-2.5 text-sm"
              >
                {req}
                <button
                  type="button"
                  aria-label={`Quitar ${req}`}
                  onClick={() =>
                    setForm({ ...form, requisitos: form.requisitos.filter((r) => r !== req) })
                  }
                  className="rounded-full p-0.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              </span>
            ))}
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => addRequirement(s)}
                className="h-7 rounded-full border border-dashed px-2.5 text-sm text-muted-foreground hover:text-foreground"
              >
                + {s}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              id="rule-req"
              value={reqDraft}
              onChange={(e) => setReqDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addRequirement(reqDraft);
                }
              }}
              placeholder="Otro requisito…"
              className="h-9"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => addRequirement(reqDraft)}
              disabled={!reqDraft.trim()}
            >
              Añadir
            </Button>
          </div>
        </div>

        <div className="flex gap-2">
          <Button type="submit" className="h-9 flex-1" disabled={saving || !valid}>
            {saving && <Loader2 className="animate-spin" />}
            {form.id ? "Guardar" : "Crear regla"}
          </Button>
          <Button type="button" variant="outline" className="h-9" onClick={onCancel}>
            Cancelar
          </Button>
          {onDelete && (
            <Button
              type="button"
              variant="outline"
              size="icon-lg"
              onClick={onDelete}
              aria-label="Eliminar regla"
              className="border-negative/40 text-negative hover:text-negative"
            >
              <Trash2 />
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}
