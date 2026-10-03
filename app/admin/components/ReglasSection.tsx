"use client";

import { useState } from "react";
import { Check, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { timeAgo, useNow } from "@/hooks/use-now";
import { formatSigned } from "@/lib/wow";
import { useReglasPuntosAdmin } from "../hooks/useReglasPuntosAdmin";
import { AdminStatus } from "../types";
import AdminSectionHeader from "./AdminSectionHeader";
import ReglasLoteoSection from "./ReglasLoteoSection";
import BenePenEditor, { type CategoryGroup } from "./BenePenEditor";

interface ReglasSectionProps {
  onStatus: (status: AdminStatus) => void;
  view: "puntos" | "loteo";
}

export default function ReglasSection({ onStatus, view }: ReglasSectionProps) {
  if (view === "loteo") return <ReglasLoteoSection onStatus={onStatus} />;
  return <PuntosSection onStatus={onStatus} />;
}

/** Vista previa de la lista que descarga ScriptSkada. */
function AddonPreview({ groups }: { groups: { title: string; categories: CategoryGroup[] }[] }) {
  return (
    <Card className="gap-3 p-4">
      <div className="flex flex-col gap-1">
        <h2 className="font-semibold">Así lo verá el addon</h2>
        <p className="text-sm text-muted-foreground">
          Lo que descarga ScriptSkada en el próximo sync.
        </p>
      </div>
      <div className="max-h-[32rem] overflow-y-auto rounded-lg border bg-muted/40 p-3 font-mono text-xs leading-relaxed">
        {groups.map((g) =>
          g.categories
            .filter((c) => c.items.length > 0)
            .map((c) => (
              <div key={`${g.title}-${c.category}`} className="mb-2 last:mb-0">
                <div className="text-muted-foreground">
                  -- {g.title} · {c.category}
                </div>
                {c.items.map((i) => (
                  <div key={i.id} className="flex justify-between gap-3">
                    <span className="truncate">{i.descripcion || "(sin descripción)"}</span>
                    <span className={i.valor >= 0 ? "text-positive" : "text-negative"}>
                      {formatSigned(i.valor)}
                    </span>
                  </div>
                ))}
              </div>
            )),
        )}
      </div>
      <p className="text-sm text-muted-foreground">
        Arrastra el asa para reordenar; los cambios se guardan al salir de cada campo.
      </p>
    </Card>
  );
}

function PuntosSection({ onStatus }: Omit<ReglasSectionProps, "view">) {
  const [search, setSearch] = useState("");
  const benefits = useReglasPuntosAdmin("beneficio", search, onStatus);
  const penalties = useReglasPuntosAdmin("perjuicio", search, onStatus);
  const now = useNow(5_000);
  const savedAt = Math.max(benefits.savedAt ?? 0, penalties.savedAt ?? 0);

  const editorProps = (hook: typeof benefits) => ({
    categorized: hook.categorized,
    onAddCategory: hook.addCategory,
    onRemoveCategory: hook.removeCategory,
    onRenameCategory: hook.renameCategory,
    onAddItem: hook.addItem,
    onRemoveItem: hook.removeItem,
    onUpdateItemLocal: hook.updateItemLocal,
    onPersistItem: hook.persistItem,
    onMoveItem: hook.moveItem,
    onReorderItem: hook.reorderItem,
  });

  return (
    <>
      <AdminSectionHeader
        group="Reglas"
        title="Reglas de puntos"
        description="Bonificaciones y sanciones que el addon ofrece al asignar puntos."
        actions={
          <>
            {savedAt > 0 && (
              <span className="flex items-center gap-1.5 text-sm text-positive" aria-live="polite">
                <Check className="size-4" /> Guardado · {timeAgo(savedAt, now)}
              </span>
            )}
            <div className="relative w-full sm:w-56">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filtrar reglas…"
                aria-label="Filtrar reglas"
                className="h-9 pl-8"
              />
            </div>
          </>
        }
      />
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_320px]">
        <BenePenEditor type="benefits" {...editorProps(benefits)} />
        <BenePenEditor type="penalties" {...editorProps(penalties)} />
        <div className="md:col-span-2 xl:sticky xl:top-20 xl:col-span-1">
          <AddonPreview
            groups={[
              { title: "Bonificaciones", categories: benefits.categorized },
              { title: "Sanciones", categories: penalties.categorized },
            ]}
          />
        </div>
      </div>
    </>
  );
}
