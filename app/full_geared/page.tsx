"use client";

import { useState } from "react";
import Image from "next/image";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";
import { ChevronLeft, ChevronRight, Search, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { PageBody, PageHeader } from "@/components/page-header";
import { ClassIcon } from "@/components/wow/class-icon";
import { CharacterName } from "@/components/wow/character-name";
import type { FullGearedCharacter } from "../types/FullGearedCharacter";
import { getClassMeta } from "@/lib/wow";

const RAID_ICONS = {
  ICC: "https://wow.zamimg.com/images/wow/icons/large/achievement_boss_lichking.jpg",
  RS: "https://wotlk.ultimowow.com/static/images/wow/icons/large/spell_shadow_twilight.jpg",
};

const LIMIT = 15;
// Referencia para la barra de GearScore (techo práctico de ICC 25H).
const GS_CAP = 6500;

interface FullGearedResponse {
  data: FullGearedCharacter[];
  total: number;
  totalPages: number;
}

export default function FullGearedPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [debounced] = useDebounce(search, 400);

  const { data, isLoading, isFetching } = useQuery<FullGearedResponse>({
    queryKey: ["fullGeared", page, debounced],
    queryFn: async () => {
      const res = await fetch(`/api/full-geared?page=${page}&limit=${LIMIT}&search=${encodeURIComponent(debounced)}`);
      if (!res.ok) throw new Error("Error al obtener los personajes");
      return res.json();
    },
    placeholderData: keepPreviousData,
  });

  const rows = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <PageBody>
      <PageHeader
        title="Full Gear"
        description={`${data?.total ?? 0} personajes con el equipo completo de ICC o Sagrario Rubí heroico.`}
        actions={
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Buscar personaje o main…"
              aria-label="Buscar personaje"
              className="h-9 pl-8"
            />
          </div>
        }
      />

      <Card className="gap-0 overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Personaje</TableHead>
              <TableHead className="hidden sm:table-cell">Main</TableHead>
              <TableHead>Completado</TableHead>
              <TableHead className="w-[30%]">GearScore</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className={isFetching && !isLoading ? "opacity-60" : undefined}>
            {isLoading &&
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={4}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            {!isLoading && rows.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={4}>
                  <Empty className="py-12">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <ShieldCheck />
                      </EmptyMedia>
                      <EmptyTitle>Sin resultados</EmptyTitle>
                      <EmptyDescription>Nadie coincide con esa búsqueda.</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            )}
            {rows.map((c) => {
              const meta = getClassMeta(c.class);
              return (
                <TableRow key={c.id ?? c.name}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <ClassIcon cls={c.class} size={32} />
                      <div className="leading-tight">
                        <CharacterName cls={c.class} className="font-semibold">
                          {c.name}
                        </CharacterName>
                        <div className="text-xs text-muted-foreground">{meta?.name ?? c.class}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">{c.main}</TableCell>
                  <TableCell>
                    <div className="flex gap-1.5">
                      <RaidBadge label="ICC" done={!!c.icc} />
                      <RaidBadge label="RS" done={!!c.rs} />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <span className="w-12 text-right font-mono font-semibold tabular">{c.gs}</span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${Math.min(100, (c.gs / GS_CAP) * 100)}%`, background: meta?.hex ?? "var(--primary)" }}
                        />
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <span className="text-sm text-muted-foreground">
            Página {page} de {totalPages}
          </span>
          <Button variant="outline" size="icon" onClick={() => setPage((p) => p - 1)} disabled={page <= 1} aria-label="Página anterior">
            <ChevronLeft />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages} aria-label="Página siguiente">
            <ChevronRight />
          </Button>
        </div>
      )}
    </PageBody>
  );
}

function RaidBadge({ label, done }: { label: keyof typeof RAID_ICONS; done: boolean }) {
  return (
    <Badge variant={done ? "default" : "outline"} className={done ? "gap-1.5 pl-0.5" : "gap-1.5 pl-0.5 text-muted-foreground opacity-60"}>
      <span className="relative size-4 overflow-hidden rounded-sm">
        <Image src={RAID_ICONS[label]} alt="" fill unoptimized sizes="16px" className={done ? "object-cover" : "object-cover grayscale"} />
      </span>
      {label}
    </Badge>
  );
}
