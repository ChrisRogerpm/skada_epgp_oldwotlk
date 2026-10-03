"use client";

import { useState } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { confirmDialog } from "@/components/confirm-dialog";
import { useAdminOverview } from "../hooks/useAdminOverview";
import { adminJson } from "../lib/api";
import { AdminStatus } from "../types";
import AdminSectionHeader from "./AdminSectionHeader";
import QuickRegister, { type QuickRegisterValues } from "./loot/QuickRegister";
import LootEntries, { type LootFilters } from "./loot/LootEntries";
import SyncReview from "./loot/SyncReview";
import type { LootWinRow, LootWinsPage } from "./loot/types";

const PAGE_SIZE = 40;

interface RegisterResponse {
  data: { id: number }[];
  linked: { sessionLabel: string; boss_name: string } | null;
}

export default function LootSection({ onStatus }: { onStatus: (status: AdminStatus) => void }) {
  const queryClient = useQueryClient();
  const [view, setView] = useState("registrar");
  const [filters, setFilters] = useState<LootFilters>({
    search: "",
    raid: "all",
    days: "7",
    source: "all",
  });
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<LootWinRow | null>(null);
  const [busy, setBusy] = useState(false);
  const { data: overview } = useAdminOverview();
  const toReview = (overview?.attention.duplicates ?? 0) + (overview?.attention.missing ?? 0);

  const params = new URLSearchParams({
    page: String(page),
    limit: String(PAGE_SIZE),
    search: filters.search,
    days: filters.days,
  });
  if (filters.raid !== "all") params.set("raid", filters.raid);
  if (filters.source !== "all") params.set("source", filters.source);

  const wins = useQuery({
    queryKey: ["adminLoot", params.toString()],
    queryFn: () => adminJson<LootWinsPage>(`/api/loot?${params}`),
    placeholderData: keepPreviousData,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["adminLoot"] });
    queryClient.invalidateQueries({ queryKey: ["lootMatrix"] });
    queryClient.invalidateQueries({ queryKey: ["adminActivity"] });
    queryClient.invalidateQueries({ queryKey: ["adminOverview"] });
  };

  const fail = (error: unknown, fallback: string) =>
    onStatus({ type: "error", message: error instanceof Error ? error.message : fallback });

  const removeRows = async (ids: number[], silent = false) => {
    await adminJson(`/api/loot?ids=${ids.join(",")}`, { method: "DELETE" });
    refresh();
    if (!silent) {
      onStatus({
        type: "success",
        message: ids.length === 1 ? "Entrega eliminada" : `${ids.length} entregas eliminadas`,
      });
    }
  };

  const submit = async (values: QuickRegisterValues, names: Map<number, string>) => {
    setBusy(true);
    try {
      if (editing) {
        await adminJson("/api/loot", {
          method: "PUT",
          body: JSON.stringify({
            id: editing.id,
            personaje: values.personaje,
            class: values.class,
            id_item: values.id_items[0],
            id_raids: editing.id_raids,
            note: values.note || null,
          }),
        });
        onStatus({ type: "success", message: "Entrega actualizada" });
        setEditing(null);
      } else {
        const result = await adminJson<RegisterResponse>("/api/loot", {
          method: "POST",
          body: JSON.stringify({
            personaje: values.personaje,
            class: values.class,
            id_items: values.id_items,
            raid: values.raid,
            note: values.note || null,
          }),
        });
        const ids = result.data.map((r) => r.id);
        onStatus({
          type: "success",
          message: ids.length > 1 ? `${ids.length} ítems registrados` : "Botín registrado",
          description: `${values.id_items.map((id) => names.get(id)).filter(Boolean).join(", ")} → ${values.personaje}${
            result.linked ? ` · ${result.linked.sessionLabel}` : " · sin vincular"
          }`,
          action: {
            label: "Deshacer",
            onClick: () =>
              removeRows(ids, true)
                .then(() => onStatus({ type: "success", message: "Registro deshecho" }))
                .catch((e) => fail(e, "No se pudo deshacer")),
          },
        });
      }
      refresh();
      return true;
    } catch (error) {
      fail(error, "Error al guardar");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const deleteRows = async (rows: LootWinRow[]) => {
    const ok = await confirmDialog({
      title:
        rows.length === 1
          ? `¿Eliminar ${rows[0].item_name} de ${rows[0].personaje}?`
          : `¿Eliminar ${rows.length} entregas?`,
      description: "Dejarán de figurar como ganadas en la matriz de botín.",
      confirmLabel: "Eliminar",
      destructive: true,
    });
    if (!ok) return;
    setBusy(true);
    try {
      await removeRows(rows.map((r) => r.id));
      if (editing && rows.some((r) => r.id === editing.id)) setEditing(null);
    } catch (error) {
      fail(error, "Error al eliminar");
    } finally {
      setBusy(false);
    }
  };

  const reassign = async (rows: LootWinRow[], to: { nombre_alter: string; clase: string }) => {
    setBusy(true);
    try {
      for (const row of rows) {
        await adminJson("/api/loot", {
          method: "PUT",
          body: JSON.stringify({
            id: row.id,
            personaje: to.nombre_alter,
            class: to.clase,
            id_item: row.id_item,
            id_raids: row.id_raids,
            note: row.note ?? null,
          }),
        });
      }
      onStatus({
        type: "success",
        message:
          rows.length === 1
            ? `Entrega asignada a ${to.nombre_alter}`
            : `${rows.length} entregas asignadas a ${to.nombre_alter}`,
      });
      refresh();
      return true;
    } catch (error) {
      fail(error, "No se pudo cambiar el jugador");
      refresh();
      return false;
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <AdminSectionHeader
        group="Botín"
        title="Botín"
        description="Registra lo que se entrega en la raid y revisa lo que trae el sync."
      />
      <Tabs value={view} onValueChange={setView} className="gap-4">
        <TabsList variant="line" className="w-full justify-start border-b">
          <TabsTrigger value="registrar" className="flex-none px-3">
            Registrar
          </TabsTrigger>
          <TabsTrigger value="revision" className="flex-none gap-2 px-3">
            Revisión del sync
            {toReview > 0 && (
              <Badge className="h-5 bg-highlight/15 px-1.5 font-mono text-highlight hover:bg-highlight/15">
                {toReview}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="registrar" className="flex flex-col gap-4">
          <QuickRegister
            editing={editing}
            saving={busy}
            onSubmit={submit}
            onCancelEdit={() => setEditing(null)}
          />
          <LootEntries
            data={wins.data}
            loading={wins.isFetching}
            filters={filters}
            onFiltersChange={(f) => {
              setFilters(f);
              setPage(1);
            }}
            page={page}
            onPageChange={setPage}
            editingId={editing?.id ?? null}
            busy={busy}
            onEdit={(row) => {
              setEditing(row);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            onDelete={deleteRows}
            onReassign={reassign}
          />
        </TabsContent>
        <TabsContent value="revision">
          <SyncReview onStatus={onStatus} />
        </TabsContent>
      </Tabs>
    </>
  );
}
