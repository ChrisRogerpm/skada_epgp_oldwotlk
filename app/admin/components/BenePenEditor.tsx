"use client";

import { useState } from "react";
import Image from "next/image";
import { GripVertical, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PuntoUIItem } from "@/app/types/Reglas";
import { cn } from "@/lib/utils";

type BenePenType = "benefits" | "penalties";

export interface CategoryGroup {
  category: string;
  items: PuntoUIItem[];
}

interface BenePenEditorProps {
  type: BenePenType;
  categorized: CategoryGroup[];
  onAddCategory: () => void;
  onRemoveCategory: (category: string) => void;
  onRenameCategory: (oldName: string, newName: string) => void;
  onAddItem: (category: string) => void;
  onRemoveItem: (id: string) => void;
  onUpdateItemLocal: (
    id: string,
    field: "descripcion" | "icon" | "valor",
    value: string | number,
  ) => void;
  onPersistItem: (id: string) => void;
  onMoveItem: (id: string, direction: "up" | "down") => void;
  onReorderItem: (id: string, targetId: string) => void;
}

const THEME = {
  benefits: {
    title: "Bonificaciones",
    dot: "bg-positive",
    itemPlaceholder: "Descripción del bono…",
    addLabel: "Añadir bonificación",
    fallbackIcon: "https://wow.zamimg.com/images/wow/icons/large/inv_misc_coin_02.jpg",
    ring: "var(--positive)",
    value: "text-positive",
  },
  penalties: {
    title: "Sanciones",
    dot: "bg-negative",
    itemPlaceholder: "Descripción de la sanción…",
    addLabel: "Añadir sanción",
    fallbackIcon: "https://wow.zamimg.com/images/wow/icons/large/inv_misc_head_orc_01.jpg",
    ring: "var(--negative)",
    value: "text-negative",
  },
} as const;

/**
 * Columna de bonificaciones o sanciones. Los cambios se guardan al salir de
 * cada campo; el orden se cambia arrastrando el asa (o con ↑/↓ sobre ella).
 */
export default function BenePenEditor({
  type,
  categorized,
  onAddCategory,
  onRemoveCategory,
  onRenameCategory,
  onAddItem,
  onRemoveItem,
  onUpdateItemLocal,
  onPersistItem,
  onMoveItem,
  onReorderItem,
}: BenePenEditorProps) {
  const theme = THEME[type];
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);

  return (
    <section aria-labelledby={`${type}-title`} className="flex min-w-0 flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 id={`${type}-title`} className="flex items-center gap-2 font-semibold">
          <span className={cn("size-2 rounded-full", theme.dot)} />
          {theme.title}
        </h2>
        <Button variant="outline" size="sm" onClick={onAddCategory}>
          <Plus /> Categoría
        </Button>
      </div>

      {categorized.map((cat) => (
        <Card key={cat.category} className="gap-0 overflow-hidden py-0">
          <div className="flex items-center gap-2 border-b px-3 py-2">
            <Input
              key={cat.category}
              defaultValue={cat.category}
              onBlur={(e) => onRenameCategory(cat.category, e.target.value)}
              aria-label="Nombre de la categoría"
              className="h-8 border-transparent bg-transparent font-semibold shadow-none hover:border-input focus-visible:border-ring dark:bg-transparent"
            />
            <span className="shrink-0 text-xs text-muted-foreground">
              {cat.items.length} {cat.items.length === 1 ? "regla" : "reglas"}
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onRemoveCategory(cat.category)}
              aria-label={`Eliminar la categoría ${cat.category}`}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 />
            </Button>
          </div>
          <ul>
            {cat.items.map((item) => (
              <li
                key={item.id}
                onDragOver={(e) => {
                  if (!dragging) return;
                  e.preventDefault();
                  setOver(item.id);
                }}
                onDragLeave={() => setOver((o) => (o === item.id ? null : o))}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragging) onReorderItem(dragging, item.id);
                  setDragging(null);
                  setOver(null);
                }}
                className={cn(
                  "group flex items-center gap-2 px-2 py-1.5 transition-colors",
                  dragging === item.id && "opacity-40",
                  over === item.id && dragging !== item.id && "bg-primary/10",
                )}
              >
                <button
                  type="button"
                  draggable
                  onDragStart={(e) => {
                    setDragging(item.id);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  onDragEnd={() => {
                    setDragging(null);
                    setOver(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                      e.preventDefault();
                      onMoveItem(item.id, e.key === "ArrowUp" ? "up" : "down");
                    }
                  }}
                  aria-label={`Mover «${item.descripcion}» (arrastra o usa las flechas)`}
                  className="flex h-9 w-6 shrink-0 cursor-grab items-center justify-center rounded text-muted-foreground/60 hover:text-foreground active:cursor-grabbing"
                >
                  <GripVertical className="size-4" />
                </button>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="relative size-8 shrink-0 overflow-hidden rounded-md bg-muted"
                      style={{ boxShadow: `0 0 0 1.5px ${theme.ring}` }}
                      aria-label="Cambiar ícono"
                    >
                      <Image
                        src={item.icon || theme.fallbackIcon}
                        alt=""
                        fill
                        unoptimized
                        sizes="32px"
                        className="object-cover"
                      />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="flex w-72 flex-col gap-2">
                    <Label htmlFor={`icon-${item.id}`}>URL del ícono</Label>
                    <Input
                      id={`icon-${item.id}`}
                      value={item.icon}
                      onChange={(e) => onUpdateItemLocal(item.id, "icon", e.target.value)}
                      onBlur={() => onPersistItem(item.id)}
                      placeholder="https://wow.zamimg.com/images/wow/icons/large/…"
                    />
                    <p className="text-xs text-muted-foreground">
                      Pega el enlace de un ícono de wowhead/zamimg.
                    </p>
                  </PopoverContent>
                </Popover>
                <Input
                  value={item.descripcion}
                  onChange={(e) => onUpdateItemLocal(item.id, "descripcion", e.target.value)}
                  onBlur={() => onPersistItem(item.id)}
                  placeholder={theme.itemPlaceholder}
                  aria-label="Descripción"
                  className="h-9 min-w-0 flex-1 border-transparent bg-transparent shadow-none hover:border-input focus-visible:border-ring dark:bg-transparent"
                />
                <Input
                  type="number"
                  value={item.valor}
                  onChange={(e) =>
                    onUpdateItemLocal(item.id, "valor", parseInt(e.target.value) || 0)
                  }
                  onBlur={() => onPersistItem(item.id)}
                  aria-label="Puntos"
                  className={cn("h-9 w-20 text-right font-mono font-semibold", theme.value)}
                />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onRemoveItem(item.id)}
                  aria-label={`Eliminar «${item.descripcion}»`}
                  className="text-muted-foreground opacity-60 group-focus-within:opacity-100 group-hover:opacity-100 hover:text-destructive"
                >
                  <X />
                </Button>
              </li>
            ))}
            {cat.items.length === 0 && (
              <li className="px-3 py-5 text-center text-sm text-muted-foreground">
                Sin reglas todavía
              </li>
            )}
          </ul>
          <div className="p-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="w-full border-dashed text-muted-foreground"
              onClick={() => onAddItem(cat.category)}
            >
              <Plus /> {theme.addLabel}
            </Button>
          </div>
        </Card>
      ))}
    </section>
  );
}
