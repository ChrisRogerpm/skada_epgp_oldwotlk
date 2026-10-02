"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { CircleCheck, CircleX, ScrollText, Search, TrendingDown, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { PageBody, PageHeader } from "@/components/page-header";
import { ClientOnly } from "@/components/client-only";
import { ItemIcon, itemNameClass } from "@/components/wow/item-icon";
import { CharacterName } from "@/components/wow/character-name";
import { useMyCharacter } from "@/hooks/use-my-character";
import { useRoster } from "@/hooks/use-roster";
import { cn } from "@/lib/utils";
import { formatPoints, itemUrl, refreshWowheadLinks } from "@/lib/wow";

interface LootRule {
  category: string;
  item: string;
  requirement: string[];
  valueMin: number;
  icon: string;
  idItem?: number | null;
}

interface RaidRule {
  raid: string;
  items: LootRule[];
}

interface PointRule {
  descripcion: string;
  valor: number;
  icon?: string;
}

interface PointCategory {
  category: string;
  items: PointRule[];
}

type RulesData = Record<string, unknown>[];

const ALL = "__all__";

const isHighlight = (category: string) => /BIS|ARMAS LK|MONTURA|LEGEND/i.test(category);

export default function ReglasPage() {
  return (
    <Suspense>
      <ClientOnly>
        <ReglasView />
      </ClientOnly>
    </Suspense>
  );
}

function ReglasView() {
  const params = useSearchParams();
  const [search, setSearch] = useState(params.get("q") ?? "");
  const [raid, setRaid] = useState<string | null>(null);
  const [category, setCategory] = useState(ALL);
  const { myCharacter } = useMyCharacter();
  const { memberByName } = useRoster();
  const me = myCharacter ? memberByName.get(myCharacter.toLowerCase()) : undefined;

  const { data, isLoading } = useQuery<RulesData>({
    queryKey: ["reglas"],
    queryFn: async () => {
      const res = await fetch("/api/reglas");
      if (!res.ok) throw new Error("Error al obtener las reglas");
      return res.json();
    },
  });

  const section = <T,>(name: string): T[] =>
    Array.isArray(data) ? ((data.find((s) => s[name])?.[name] as T[]) ?? []) : [];
  const lootRules = section<RaidRule>("Reglas de Loteo");
  const benefits = section<PointCategory>("Beneficios");
  const penalties = section<PointCategory>("Perjuicios");

  const q = search.trim().toLowerCase();
  const hasItem = (r: RaidRule) => r.items.some((i) => i.item.toLowerCase().includes(q));
  // Si la búsqueda (p. ej. desde Ctrl K) apunta a un ítem de otra raid, se muestra esa raid.
  const chosen = lootRules.find((r) => r.raid === raid);
  const activeRaid =
    (chosen && (!q || hasItem(chosen)) ? chosen.raid : null) ??
    (q ? lootRules.find(hasItem)?.raid : null) ??
    chosen?.raid ??
    lootRules[0]?.raid ??
    null;
  const raidRule = lootRules.find((r) => r.raid === activeRaid);

  const categories = [...new Set((raidRule?.items ?? []).map((i) => i.category))];

  const loot = (raidRule?.items ?? []).filter(
    (i) =>
      (category === ALL || i.category === category) &&
      (!q ||
        i.item.toLowerCase().includes(q) ||
        i.requirement?.some((r) => r.toLowerCase().includes(q))),
  );

  const filterPoints = (cats: PointCategory[]) =>
    cats
      .map((c) => ({
        ...c,
        items: c.items.filter((i) => !q || i.descripcion.toLowerCase().includes(q)),
      }))
      .filter((c) => c.items.length);

  const affordable = me ? (raidRule?.items ?? []).filter((i) => me.amount >= i.valueMin).length : 0;

  useEffect(() => {
    refreshWowheadLinks();
  }, [activeRaid, category, q, data]);

  return (
    <PageBody>
      <PageHeader
        title="Reglas de la hermandad"
        description="Cómo se ganan y se pierden puntos, y qué se necesita para lotear cada ítem."
        actions={
          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar regla, ítem o requisito…"
              aria-label="Buscar en las reglas"
              className="h-9 pl-8"
            />
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <PointsCard
          title="Beneficios"
          tone="positive"
          categories={filterPoints(benefits)}
          loading={isLoading}
        />
        <PointsCard
          title="Perjuicios"
          tone="negative"
          categories={filterPoints(penalties)}
          loading={isLoading}
        />
      </div>

      <section className="flex flex-col gap-3">
        <Card className="gap-0 overflow-hidden p-0">
          <div className="flex flex-wrap items-center gap-2 border-b px-4 py-3">
            <h2 className="mr-1 font-semibold">Reglas de loteo</h2>
            {lootRules.length > 0 && (
              <Tabs
                value={activeRaid ?? undefined}
                onValueChange={(v) => {
                  setRaid(v);
                  setCategory(ALL);
                }}
              >
                <TabsList>
                  {lootRules.map((r) => (
                    <TabsTrigger key={r.raid} value={r.raid}>
                      {r.raid}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            )}
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-8! w-48" aria-label="Categoría">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todas las categorías</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {me && raidRule && (
              <span className="ml-auto flex h-8 items-center gap-2 rounded-md border border-positive/30 bg-positive/10 px-3 text-sm">
                <CircleCheck className="size-4 text-positive" />
                <CharacterName cls={me.class} className="font-semibold">
                  {me.main}
                </CharacterName>
                <span className="text-muted-foreground">
                  ({formatPoints(me.amount)} pts) puede lotear {affordable} de{" "}
                  {raidRule.items.length}
                </span>
              </span>
            )}
          </div>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="min-w-56">Ítem</TableHead>
                <TableHead className="hidden md:table-cell">Categoría</TableHead>
                <TableHead className="hidden w-[45%] lg:table-cell">Requisitos</TableHead>
                <TableHead className="text-right">Mínimo</TableHead>
                {me && <TableHead className="text-right">Tu estado</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5}>
                      <Skeleton className="h-9 w-full" />
                    </TableCell>
                  </TableRow>
                ))}
              {!isLoading && loot.length === 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={5}>
                    <Empty className="py-12">
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <ScrollText />
                        </EmptyMedia>
                        <EmptyTitle>Sin reglas que coincidan</EmptyTitle>
                        <EmptyDescription>
                          Cambia la búsqueda, la raid o la categoría.
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  </TableCell>
                </TableRow>
              )}
              {loot.map((rule, idx) => {
                const quality = isHighlight(rule.category) ? "legendary" : "epic";
                const missing = me ? rule.valueMin - me.amount : 0;
                return (
                  <TableRow key={`${rule.item}-${idx}`}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <ItemIcon src={rule.icon} name={rule.item} quality={quality} size={36} />
                        <div className="min-w-0">
                          <a
                            href={itemUrl(rule.idItem, rule.item)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn(
                              "font-medium whitespace-normal hover:underline",
                              itemNameClass(quality),
                            )}
                          >
                            {rule.item}
                          </a>
                          <div className="flex flex-wrap gap-1 pt-1 lg:hidden">
                            <Badge variant="outline" className="md:hidden">
                              {rule.category}
                            </Badge>
                            {rule.requirement?.map((r) => (
                              <Badge
                                key={r}
                                variant="secondary"
                                className="h-auto py-0.5 text-left whitespace-normal"
                              >
                                {r}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge
                        variant="outline"
                        className={cn(
                          isHighlight(rule.category) &&
                            "border-orange-500/40 text-orange-600 dark:text-orange-400",
                        )}
                      >
                        {rule.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden whitespace-normal lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {rule.requirement?.length ? (
                          rule.requirement.map((r) => (
                            <Badge
                              key={r}
                              variant="secondary"
                              className="h-auto py-0.5 text-left whitespace-normal"
                            >
                              {r}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">Sin requisitos</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold tabular">
                      {formatPoints(rule.valueMin)}
                    </TableCell>
                    {me && (
                      <TableCell className="text-right">
                        {missing <= 0 ? (
                          <Badge className="bg-positive/15 text-positive hover:bg-positive/15">
                            <CircleCheck /> Alcanza
                          </Badge>
                        ) : (
                          <Badge className="bg-negative/15 text-negative hover:bg-negative/15">
                            <CircleX /> Faltan {formatPoints(missing)}
                          </Badge>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
        {me && (
          <p className="text-xs text-muted-foreground">
            «Alcanza» solo compara tus puntos con el mínimo; los requisitos (clase, rol, full gear…)
            los revisan los oficiales.
          </p>
        )}
      </section>
    </PageBody>
  );
}

function PointsCard({
  title,
  tone,
  categories,
  loading,
}: {
  title: string;
  tone: "positive" | "negative";
  categories: PointCategory[];
  loading: boolean;
}) {
  const Icon = tone === "positive" ? TrendingUp : TrendingDown;
  const count = categories.reduce((s, c) => s + c.items.length, 0);
  return (
    <Card className="gap-0 pb-0">
      <CardHeader className="border-b pb-4">
        <CardTitle className="flex items-center gap-2">
          <span
            className={cn(
              "flex size-7 items-center justify-center rounded-md",
              tone === "positive" ? "bg-positive/15 text-positive" : "bg-negative/15 text-negative",
            )}
          >
            <Icon className="size-4" />
          </span>
          {title}
        </CardTitle>
        <CardDescription>{count} reglas</CardDescription>
      </CardHeader>
      <CardContent className="max-h-[380px] overflow-y-auto px-0">
        {loading ? (
          <div className="space-y-2 p-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">Sin reglas que coincidan.</p>
        ) : (
          categories.map((cat) => (
            <section key={cat.category}>
              <h3 className="px-6 pt-4 pb-1 text-xs font-medium text-muted-foreground">
                {cat.category}
              </h3>
              <ul>
                {cat.items.map((rule, i) => (
                  <li
                    key={`${rule.descripcion}-${i}`}
                    className="flex items-center gap-3 px-6 py-2"
                  >
                    <span
                      className={cn(
                        "relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted",
                        tone === "positive" ? "text-positive" : "text-negative",
                      )}
                      style={{
                        boxShadow: `0 0 0 1.5px ${tone === "positive" ? "var(--positive)" : "var(--negative)"}`,
                      }}
                    >
                      {rule.icon ? (
                        <Image
                          src={rule.icon}
                          alt=""
                          fill
                          unoptimized
                          sizes="32px"
                          className="object-cover"
                        />
                      ) : (
                        <Icon className="size-4" />
                      )}
                    </span>
                    <span className="flex-1 text-sm">{rule.descripcion}</span>
                    <span
                      className={cn(
                        "min-w-14 rounded-md px-2 py-0.5 text-center font-mono text-sm font-semibold tabular",
                        tone === "positive"
                          ? "bg-positive/10 text-positive"
                          : "bg-negative/10 text-negative",
                      )}
                    >
                      {tone === "positive" ? "+" : "−"}
                      {formatPoints(Math.abs(rule.valor))}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </CardContent>
    </Card>
  );
}
