"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useReglasPuntosAdmin } from "../hooks/useReglasPuntosAdmin";
import { AdminStatus } from "../types";
import ReglasLoteoSection from "./ReglasLoteoSection";
import BenePenEditor from "./BenePenEditor";

interface ReglasSectionProps {
  search: string;
  onStatus: (status: AdminStatus) => void;
  view: "puntos" | "loteo";
}

export default function ReglasSection({ search, onStatus, view }: ReglasSectionProps) {
  if (view === "loteo") return <ReglasLoteoSection search={search} onStatus={onStatus} />;
  return <PuntosSection search={search} onStatus={onStatus} />;
}

function PuntosSection({ search, onStatus }: Omit<ReglasSectionProps, "view">) {
  const [tab, setTab] = useState("beneficios");
  const benefits = useReglasPuntosAdmin("beneficio", search, onStatus);
  const penalties = useReglasPuntosAdmin("perjuicio", search, onStatus);

  return (
    <Tabs value={tab} onValueChange={setTab} className="gap-4">
      <TabsList>
        <TabsTrigger value="beneficios">Bonificaciones</TabsTrigger>
        <TabsTrigger value="sanciones">Sanciones</TabsTrigger>
      </TabsList>
      <TabsContent value="beneficios">
        <BenePenEditor
          type="benefits"
          categorized={benefits.categorized}
          onAddCategory={benefits.addCategory}
          onRemoveCategory={benefits.removeCategory}
          onRenameCategory={benefits.renameCategory}
          onAddItem={benefits.addItem}
          onRemoveItem={benefits.removeItem}
          onUpdateItemLocal={benefits.updateItemLocal}
          onPersistItem={benefits.persistItem}
          onMoveItem={benefits.moveItem}
        />
      </TabsContent>
      <TabsContent value="sanciones">
        <BenePenEditor
          type="penalties"
          categorized={penalties.categorized}
          onAddCategory={penalties.addCategory}
          onRemoveCategory={penalties.removeCategory}
          onRenameCategory={penalties.renameCategory}
          onAddItem={penalties.addItem}
          onRemoveItem={penalties.removeItem}
          onUpdateItemLocal={penalties.updateItemLocal}
          onPersistItem={penalties.persistItem}
          onMoveItem={penalties.moveItem}
        />
      </TabsContent>
    </Tabs>
  );
}
