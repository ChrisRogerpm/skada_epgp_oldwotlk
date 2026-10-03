"use client";

import { useState } from "react";
import { Loader2, Pencil, Plus, Search, ShieldCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toggle } from "@/components/ui/toggle";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { ClassIcon } from "@/components/wow/class-icon";
import { CharacterName } from "@/components/wow/character-name";
import { FullGearedCharacter } from "@/src/domain/entities/FullGeared";
import { timeAgo, useNow } from "@/hooks/use-now";
import { cn } from "@/lib/utils";
import { getClassMeta } from "@/lib/wow";
import { useCharacterSearch } from "../hooks/useCharacterSearch";
import { EMPTY_FULL_GEAR_FORM, useFullGearedAdmin } from "../hooks/useFullGearedAdmin";
import { AdminStatus, FullGearedForm } from "../types";
import AdminSectionHeader from "./AdminSectionHeader";
import CharacterSearchInput from "./shared/CharacterSearchInput";

const STALE_MS = 30 * 24 * 3600 * 1000;

type RaidFilter = "all" | "icc" | "rs";

function FullGearSheet({
  form,
  open,
  saving,
  onClose,
  onSave,
}: {
  form: FullGearedForm;
  open: boolean;
  saving: boolean;
  onClose: () => void;
  onSave: (form: FullGearedForm) => void;
}) {
  const [values, setValues] = useState(form);
  const [query, setQuery] = useState("");
  const chars = useCharacterSearch();

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle>{values.id ? `Actualizar a ${values.name}` : "Marcar personaje"}</SheetTitle>
          <SheetDescription>GearScore y raids que ya tiene completas.</SheetDescription>
        </SheetHeader>
        <form
          id="fg-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (values.name) onSave(values);
          }}
          className="flex flex-1 flex-col gap-5 overflow-y-auto p-4"
        >
          {!values.id && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fg-search">Personaje</Label>
              <CharacterSearchInput
                id="fg-search"
                value={query}
                results={chars.results}
                loading={chars.loading}
                onChange={(text) => {
                  setQuery(text);
                  chars.search(text);
                }}
                onSelect={(r) => {
                  setValues({ ...values, name: r.nombre_alter, class: r.clase, main: r.main });
                  setQuery("");
                  chars.clear();
                }}
              />
            </div>
          )}
          <div className="flex items-center gap-3 rounded-lg border p-3">
            {values.name ? (
              <>
                <ClassIcon cls={values.class} size={36} />
                <div className="min-w-0 flex-1 leading-tight">
                  <CharacterName cls={values.class} className="block truncate font-semibold">
                    {values.name}
                  </CharacterName>
                  <span className="text-xs text-muted-foreground">
                    {getClassMeta(values.class)?.name ?? values.class} ·{" "}
                    {values.main && values.main !== values.name ? `alter de ${values.main}` : "main"}
                  </span>
                </div>
              </>
            ) : (
              <span className="text-sm text-muted-foreground">Elige un personaje del roster.</span>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fg-gs">GearScore</Label>
            <Input
              id="fg-gs"
              type="number"
              inputMode="numeric"
              value={values.gs || ""}
              onChange={(e) => setValues({ ...values, gs: parseInt(e.target.value) || 0 })}
              className="h-10 font-mono"
            />
          </div>
          <fieldset className="flex flex-col gap-3">
            <legend className="mb-2 text-sm font-medium">Full Gear en</legend>
            <Label className="flex items-center gap-2.5 font-normal">
              <Checkbox
                checked={!!values.icc}
                onCheckedChange={(v) => setValues({ ...values, icc: v === true })}
              />
              Ciudadela de la Corona de Hielo (ICC)
            </Label>
            <Label className="flex items-center gap-2.5 font-normal">
              <Checkbox
                checked={!!values.rs}
                onCheckedChange={(v) => setValues({ ...values, rs: v === true })}
              />
              Sagrario Rubí (RS)
            </Label>
          </fieldset>
        </form>
        <SheetFooter className="flex-row justify-end border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="fg-form" disabled={saving || !values.name}>
            {saving && <Loader2 className="animate-spin" />}
            {values.id ? "Guardar" : "Marcar"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export default function FullGearedSection({ onStatus }: { onStatus: (s: AdminStatus) => void }) {
  const { characters, isLoading, isSaving, saveCharacter, toggleRaid, deleteCharacter } =
    useFullGearedAdmin(onStatus);
  const now = useNow();
  const [raid, setRaid] = useState<RaidFilter>("all");
  const [staleOnly, setStaleOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [sheet, setSheet] = useState<{ key: string; form: FullGearedForm } | null>(null);

  const reviewedAt = (c: FullGearedCharacter) =>
    new Date(c.updated_at ?? c.created_at ?? 0).getTime();
  const isStale = (c: FullGearedCharacter) => now - reviewedAt(c) > STALE_MS;
  const staleCount = characters.filter(isStale).length;
  const maxGs = Math.max(1, ...characters.map((c) => c.gs || 0));
  const term = search.trim().toLowerCase();

  const visible = characters
    .filter((c) => raid === "all" || !!c[raid])
    .filter((c) => !staleOnly || isStale(c))
    .filter(
      (c) => !term || c.name.toLowerCase().includes(term) || c.main?.toLowerCase().includes(term),
    )
    .sort((a, b) => (b.gs || 0) - (a.gs || 0));

  const openEdit = (c: FullGearedCharacter) =>
    setSheet({
      key: `edit-${c.id}`,
      form: {
        id: c.id ?? null,
        name: c.name,
        class: c.class,
        main: c.main,
        gs: c.gs,
        icc: !!c.icc,
        rs: !!c.rs,
      },
    });

  return (
    <>
      <AdminSectionHeader
        group="Hermandad"
        title="Full Gear"
        description="Personajes equipados que ya no compiten por botín en esa raid."
        actions={
          <Button
            onClick={() => setSheet({ key: `new-${Date.now()}`, form: EMPTY_FULL_GEAR_FORM })}
          >
            <Plus /> Marcar personaje
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Tabs value={raid} onValueChange={(v) => setRaid(v as RaidFilter)}>
          <TabsList>
            {(
              [
                ["all", "Todos", characters.length],
                ["icc", "ICC", characters.filter((c) => c.icc).length],
                ["rs", "RS", characters.filter((c) => c.rs).length],
              ] as const
            ).map(([value, label, count]) => (
              <TabsTrigger key={value} value={value} className="gap-1.5">
                {label}
                <span className="font-mono text-xs text-muted-foreground">{count}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        {staleCount > 0 && (
          <Toggle
            pressed={staleOnly}
            onPressedChange={setStaleOnly}
            variant="outline"
            size="sm"
            className="rounded-full border-highlight/40 text-highlight data-[state=on]:bg-highlight/15 data-[state=on]:text-highlight"
          >
            Sin revisar hace +30 días · {staleCount}
          </Toggle>
        )}
        <div className="relative ml-auto w-full sm:w-56">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar personaje…"
            aria-label="Buscar personaje"
            className="h-9 pl-8"
          />
        </div>
      </div>

      <Card className="gap-0 overflow-hidden py-0">
        <div className="overflow-x-auto">
          <table className={cn("w-full min-w-[720px] text-sm", isLoading && "opacity-60")}>
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">Personaje</th>
                <th className="px-2 py-2.5 font-medium">GearScore</th>
                <th className="px-2 py-2.5 font-medium">Full Gear en</th>
                <th className="px-2 py-2.5 font-medium">Revisado</th>
                <th className="w-24 px-4 py-2.5">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((c) => {
                const stale = isStale(c);
                return (
                  <tr
                    key={c.id ?? c.name}
                    className={cn(
                      "border-t",
                      stale && "shadow-[inset_3px_0_0_var(--highlight)]",
                    )}
                  >
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <ClassIcon cls={c.class} size={30} />
                        <div className="leading-tight">
                          <CharacterName cls={c.class} className="block font-semibold">
                            {c.name}
                          </CharacterName>
                          <span className="text-xs text-muted-foreground">
                            {c.main && c.main !== c.name ? `Alter de ${c.main}` : "Main"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-2.5">
                      <div className="flex min-w-44 items-center gap-2.5">
                        <span className="w-12 font-mono tabular">{c.gs || "—"}</span>
                        <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                          <span
                            className={cn("block h-full", stale ? "bg-highlight" : "bg-primary")}
                            style={{ width: `${((c.gs || 0) / maxGs) * 100}%` }}
                          />
                        </span>
                      </div>
                    </td>
                    <td className="px-2 py-2.5">
                      <div className="flex gap-1.5">
                        {(["icc", "rs"] as const).map((r) => (
                          <Toggle
                            key={r}
                            size="sm"
                            variant="outline"
                            pressed={!!c[r]}
                            onPressedChange={() => toggleRaid(c, r)}
                            aria-label={`${c.name}: Full Gear en ${r.toUpperCase()}`}
                            className="h-7 min-w-12 border-dashed text-xs text-muted-foreground data-[state=on]:border-solid data-[state=on]:border-primary/40 data-[state=on]:bg-primary/15 data-[state=on]:text-positive"
                          >
                            {r.toUpperCase()}
                          </Toggle>
                        ))}
                      </div>
                    </td>
                    <td
                      className={cn(
                        "px-2 py-2.5",
                        stale ? "text-highlight" : "text-muted-foreground",
                      )}
                    >
                      {timeAgo(reviewedAt(c), now)}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex justify-end gap-0.5">
                        {stale ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEdit(c)}
                            className="border-highlight/40 text-highlight hover:text-highlight"
                          >
                            Actualizar GS
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => openEdit(c)}
                            aria-label={`Editar a ${c.name}`}
                          >
                            <Pencil />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => deleteCharacter(c)}
                          aria-label={`Quitar a ${c.name}`}
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
          </table>
        </div>
        {visible.length === 0 && !isLoading && (
          <Empty className="border-t py-12">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ShieldCheck />
              </EmptyMedia>
              <EmptyTitle>Ningún personaje con estos filtros</EmptyTitle>
            </EmptyHeader>
          </Empty>
        )}
      </Card>
      <p className="text-sm text-muted-foreground">
        Pulsa ICC o RS en una fila para marcarla o quitarla al momento.
      </p>

      {sheet && (
        <FullGearSheet
          key={sheet.key}
          form={sheet.form}
          open
          saving={isSaving}
          onClose={() => setSheet(null)}
          onSave={async (form) => {
            if (await saveCharacter(form)) setSheet(null);
          }}
        />
      )}
    </>
  );
}
