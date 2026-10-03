"use client";

import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { adminJson } from "../../lib/api";
import ActivityList, { ACTIVITY_TYPES, type ActivityResponse } from "../ActivityList";

const PAGE = 50;

/** Registro de actividad completo, filtrable por tipo y paginado hacia atrás. */
export default function ActivityLogPanel() {
  const [type, setType] = useState("all");
  const query = useInfiniteQuery({
    queryKey: ["adminActivity", "log", type],
    initialPageParam: "",
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams({ limit: String(PAGE) });
      if (pageParam) params.set("before", pageParam);
      if (type !== "all") params.set("type", type);
      return adminJson<ActivityResponse>(`/api/admin/activity?${params}`);
    },
    getNextPageParam: (last) =>
      last.data.length === PAGE ? last.data[last.data.length - 1].created_at : undefined,
  });

  const pages = query.data?.pages ?? [];
  const merged: ActivityResponse | undefined = pages.length
    ? { available: pages[0].available, data: pages.flatMap((p) => p.data) }
    : undefined;

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4">
        <h2 className="font-semibold">Registro de actividad</h2>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="h-9! w-44" aria-label="Tipo de acción">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las acciones</SelectItem>
            {ACTIVITY_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <ActivityList data={merged} loading={query.isLoading} />
      {query.hasNextPage && (
        <div className="border-t p-3 text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => query.fetchNextPage()}
            disabled={query.isFetchingNextPage}
          >
            {query.isFetchingNextPage && <Loader2 className="animate-spin" />}
            Cargar más
          </Button>
        </div>
      )}
    </Card>
  );
}
