"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Search, TriangleAlert, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { PageBody, PageHeader } from "@/components/page-header";
import { BlacklistEntry } from "../types/BlacklistEntry";

const PER_PAGE = 20;

const dateFmt = new Intl.DateTimeFormat("es-PE", { timeZone: "America/Lima", day: "2-digit", month: "short", year: "numeric" });
const timeFmt = new Intl.DateTimeFormat("es-PE", { timeZone: "America/Lima", hour: "2-digit", minute: "2-digit" });

function safeFormat(fmt: Intl.DateTimeFormat, value: string) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : fmt.format(d);
}

export default function ListaNegraPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data = [], isLoading, error } = useQuery<BlacklistEntry[]>({
    queryKey: ["listaNegra"],
    queryFn: async () => {
      const res = await fetch("/api/lista_negra");
      if (!res.ok) throw new Error("Error al obtener la lista negra");
      return res.json();
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? data.filter((e) => e.nombre.toLowerCase().includes(q)) : data;
  }, [data, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const current = Math.min(page, totalPages);
  const rows = filtered.slice((current - 1) * PER_PAGE, current * PER_PAGE);

  return (
    <PageBody>
      <PageHeader
        title="Lista negra"
        description={`${data.length} jugadores vetados. Los registros los mantiene el consejo de oficiales.`}
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
              placeholder="Buscar personaje…"
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
              <TableHead>Motivo</TableHead>
              <TableHead className="text-right">Fecha</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={3}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            {(error || (!isLoading && rows.length === 0)) && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={3}>
                  <Empty className="py-12">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">{error ? <TriangleAlert /> : <UserX />}</EmptyMedia>
                      <EmptyTitle>{error ? "No se pudo cargar la lista" : "Sin registros"}</EmptyTitle>
                      <EmptyDescription>
                        {error ? "Inténtalo de nuevo en unos segundos." : search ? "Nadie coincide con esa búsqueda." : "La lista está vacía."}
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            )}
            {rows.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-8 items-center justify-center rounded-md bg-destructive/10 text-destructive">
                      <UserX className="size-4" />
                    </span>
                    <span className="font-semibold">{entry.nombre}</span>
                  </div>
                </TableCell>
                <TableCell className="whitespace-normal text-muted-foreground">
                  {entry.reason || <span className="italic">Sin motivo especificado</span>}
                </TableCell>
                <TableCell className="text-right text-xs tabular">
                  <div>{safeFormat(dateFmt, entry.created_at)}</div>
                  <div className="text-muted-foreground">{safeFormat(timeFmt, entry.created_at)}</div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <span className="text-sm text-muted-foreground">
            Página {current} de {totalPages}
          </span>
          <Button variant="outline" size="icon" onClick={() => setPage(current - 1)} disabled={current <= 1} aria-label="Página anterior">
            <ChevronLeft />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setPage(current + 1)} disabled={current >= totalPages} aria-label="Página siguiente">
            <ChevronRight />
          </Button>
        </div>
      )}
    </PageBody>
  );
}
