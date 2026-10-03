"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, ScrollText, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { ItemIcon, itemNameClass } from "@/components/wow/item-icon";
import type { LootMatrix } from "@/app/types/Loot";
import { REGLAS_RAID_TABS, type RaidCode } from "@/app/types/Reglas";
import { useRoster } from "@/hooks/use-roster";
import { cn } from "@/lib/utils";
import { formatPoints, itemQuality } from "@/lib/wow";
import {
  EMPTY_RULE_FORM,
  ruleToForm,
  useReglasLoteoAdmin,
  type LootRuleForm,
} from "../hooks/useReglasLoteoAdmin";
import { AdminStatus } from "../types";
import AdminSectionHeader from "./AdminSectionHeader";
import RuleEditor from "./reglas/RuleEditor";

const SHORT: Record<RaidCode, string> = { ICC: "ICC", RS: "RS", TOGC: "ToGC" };

export default function ReglasLoteoSection({ onStatus }: { onStatus: (s: AdminStatus) => void }) {
  const { rules, isLoading, isSaving, categories, requirementOptions, saveRule, deleteRule } =
    useReglasLoteoAdmin(onStatus);
  const { ranked } = useRoster();
  const [raid, setRaid] = useState<RaidCode>("ICC");
  const [search, setSearch] = useState("");
  const [showMissing, setShowMissing] = useState(false);
  // Clave del formulario abierto (cambiarla reinicia el editor) y sus valores iniciales.
  const [editor, setEditor] = useState<{ key: string; form: LootRuleForm } | null>(null);

  const { data: matrix } = useQuery<LootMatrix>({
    queryKey: ["lootMatrix", raid],
    queryFn: async () => {
      const res = await fetch(`/api/loot/matrix?raid=${raid}`);
      if (!res.ok) throw new Error("Error al obtener los ítems");
      return res.json();
    },
  });

  const raidRules = useMemo(() => rules.filter((r) => r.raidCode === raid), [rules, raid]);
  const covered = useMemo(() => new Set(raidRules.map((r) => r.idItem)), [raidRules]);
  const catalog = useMemo(() => matrix?.items ?? [], [matrix]);
  const missing = catalog.filter((i) => !covered.has(i.id_item));
  const coveredCount = catalog.length - missing.length;

  const term = search.trim().toLowerCase();
  const groups = useMemo(() => {
    const visible = raidRules.filter(
      (r) =>
        !term || r.name.toLowerCase().includes(term) || r.category.toLowerCase().includes(term),
    );
    const map = new Map<string, typeof visible>();
    visible.forEach((r) => map.set(r.category, [...(map.get(r.category) ?? []), r]));
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([category, list]) => ({
        category,
        list: [...list].sort((a, b) => b.valueMin - a.valueMin),
      }));
  }, [raidRules, term]);
  const missingVisible = missing.filter((i) => !term || i.name.toLowerCase().includes(term));

  const reach = (min: number) => ranked.filter((m) => m.amount >= min).length;

  const openNew = (item?: { id_item: number; name: string; icon: string }) =>
    setEditor({
      key: `new-${item?.id_item ?? Date.now()}`,
      form: {
        ...EMPTY_RULE_FORM,
        raidCode: raid,
        categoria: categories[0] ?? "",
        ...(item ? { idItem: item.id_item, nombreItem: item.name, iconUrl: item.icon } : {}),
      },
    });

  const editing = editor?.form.id ?? null;

  return (
    <>
      <AdminSectionHeader
        group="Reglas"
        title="Reglas de loteo"
        description="Puntos mínimos y requisitos para lotear cada ítem. El addon las recibe en el próximo sync."
        actions={
          <>
            <Tabs value={raid} onValueChange={(v) => setRaid(v as RaidCode)}>
              <TabsList>
                {REGLAS_RAID_TABS.map((t) => (
                  <TabsTrigger key={t.value} value={t.value} title={t.label} className="gap-1.5">
                    {SHORT[t.value]}
                    <span className="font-mono text-xs text-muted-foreground">
                      {rules.filter((r) => r.raidCode === t.value).length}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <Button onClick={() => openNew()}>
              <Plus /> Nueva regla
            </Button>
          </>
        }
      />

      {catalog.length > 0 && (
        <Card
          className={cn(
            "flex-row flex-wrap items-center gap-3 px-4 py-3",
            missing.length > 0 && "border-highlight/35 bg-highlight/5 dark:bg-highlight/5",
          )}
        >
          <div className="flex min-w-60 flex-1 flex-col gap-2">
            <span className="text-sm">
              <b className="font-semibold">
                {coveredCount} de {catalog.length}
              </b>{" "}
              ítems de {SHORT[raid]} tienen regla
              {missing.length > 0 && (
                <span className="text-highlight"> · {missing.length} sin regla</span>
              )}
            </span>
            <div
              role="img"
              aria-label={`${Math.round((coveredCount / catalog.length) * 100)} % de los ítems con regla`}
              className="h-1.5 overflow-hidden rounded-full bg-muted"
            >
              <div
                className="h-full bg-primary"
                style={{ width: `${(coveredCount / catalog.length) * 100}%` }}
              />
            </div>
          </div>
          {missing.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMissing((v) => !v)}
              className="border-highlight/40 text-highlight hover:text-highlight"
            >
              {showMissing ? "Ocultar los ítems sin regla" : `Mostrar los ${missing.length} sin regla`}
            </Button>
          )}
        </Card>
      )}

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card className="order-2 gap-0 overflow-hidden py-0 xl:order-1">
          <div className="p-3">
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar ítem o categoría…"
                aria-label="Buscar regla"
                className="h-9 pl-8"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className={cn("w-full min-w-[640px] text-sm", isLoading && "opacity-60")}>
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="px-4 py-2 font-medium">Ítem</th>
                  <th className="px-2 py-2 text-right font-medium">Mínimo</th>
                  <th className="px-2 py-2 font-medium">Requisitos</th>
                  <th className="px-4 py-2 text-right font-medium">Alcanzan</th>
                </tr>
              </thead>
              {showMissing && missingVisible.length > 0 && (
                <tbody>
                  <tr>
                    <td
                      colSpan={4}
                      className="border-t bg-highlight/10 px-4 py-2 text-xs font-medium tracking-wide text-highlight uppercase"
                    >
                      Sin regla · {missingVisible.length}
                    </td>
                  </tr>
                  {missingVisible.map((item) => (
                    <tr key={item.id_item} className="border-t">
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2.5">
                          <ItemIcon
                            src={item.icon}
                            name={item.name}
                            quality={itemQuality(item.id_item)}
                            size={30}
                          />
                          <span className={cn("font-medium", itemNameClass(itemQuality(item.id_item)))}>
                            {item.name}
                          </span>
                        </div>
                      </td>
                      <td colSpan={3} className="px-4 py-2 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-dashed border-highlight/50 text-highlight hover:text-highlight"
                          onClick={() => openNew(item)}
                        >
                          <Plus /> Añadir regla
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              )}
              {groups.map((group) => (
                <tbody key={group.category}>
                  <tr>
                    <td
                      colSpan={4}
                      className="border-t bg-muted/40 px-4 py-2 text-xs font-medium tracking-wide text-muted-foreground uppercase"
                    >
                      {group.category} · {group.list.length}
                    </td>
                  </tr>
                  {group.list.map((rule) => {
                    const q = itemQuality(rule.idItem);
                    return (
                      <tr
                        key={rule.id}
                        onClick={() => setEditor({ key: rule.id, form: ruleToForm(rule, raid) })}
                        className={cn(
                          "cursor-pointer border-t transition-colors hover:bg-muted/30",
                          editing === rule.id && "bg-primary/10 hover:bg-primary/10",
                        )}
                      >
                        <td className="px-4 py-2">
                          <button
                            type="button"
                            className="flex items-center gap-2.5 text-left"
                            aria-label={`Editar la regla de ${rule.name}`}
                          >
                            <ItemIcon src={rule.icon} name={rule.name} quality={q} size={30} />
                            <span className={cn("max-w-72 truncate font-medium", itemNameClass(q))}>
                              {rule.name}
                            </span>
                          </button>
                        </td>
                        <td className="px-2 py-2 text-right font-mono font-semibold tabular">
                          {formatPoints(rule.valueMin)}
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex flex-wrap gap-1">
                            {rule.requirement.length ? (
                              rule.requirement.map((r) => (
                                <span
                                  key={r}
                                  className="rounded-full bg-secondary px-2 py-0.5 text-xs"
                                >
                                  {r}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground">Sin requisitos</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2 text-right font-mono tabular">
                          {ranked.length ? reach(rule.valueMin) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              ))}
            </table>
          </div>
          {groups.length === 0 && !isLoading && (
            <Empty className="border-t py-12">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ScrollText />
                </EmptyMedia>
                <EmptyTitle>
                  {term ? "Ninguna regla coincide con la búsqueda" : "Sin reglas para esta raid"}
                </EmptyTitle>
              </EmptyHeader>
            </Empty>
          )}
        </Card>

        <div className="order-1 xl:sticky xl:top-20 xl:order-2">
          {editor ? (
            <RuleEditor
              key={editor.key}
              initial={editor.form}
              categories={categories}
              requirementOptions={requirementOptions}
              saving={isSaving}
              onCancel={() => setEditor(null)}
              onSave={async (form) => {
                if (await saveRule(form)) setEditor(null);
              }}
              onDelete={
                editor.form.id
                  ? async () => {
                      if (await deleteRule({ id: editor.form.id!, name: editor.form.nombreItem }))
                        setEditor(null);
                    }
                  : undefined
              }
            />
          ) : (
            <Card className="hidden items-center gap-2 border-dashed p-6 text-center text-sm text-muted-foreground xl:flex">
              <ScrollText className="size-5" />
              Elige una regla para editarla o crea una nueva.
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
