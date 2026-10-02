"use client";

import Image from "next/image";
import { ChevronDown, ChevronUp, Plus, Trash2, X } from "lucide-react";
import { PuntoUIItem } from "@/app/types/Reglas";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type BenePenType = "benefits" | "penalties";

interface CategoryGroup {
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
}

const THEME = {
  benefits: {
    itemPlaceholder: "Descripción del bono…",
    addLabel: "Añadir bonificación",
    fallbackIcon: "https://wow.zamimg.com/images/wow/icons/large/inv_misc_coin_02.jpg",
    ring: "var(--positive)",
    value: "text-positive",
  },
  penalties: {
    itemPlaceholder: "Descripción de la sanción…",
    addLabel: "Añadir sanción",
    fallbackIcon: "https://wow.zamimg.com/images/wow/icons/large/inv_misc_head_orc_01.jpg",
    ring: "var(--negative)",
    value: "text-negative",
  },
} as const;

/** Editor en línea de bonificaciones/sanciones: los cambios se guardan al salir de cada campo. */
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
}: BenePenEditorProps) {
  const theme = THEME[type];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Los cambios se guardan automáticamente al salir de cada campo.
        </p>
        <Button variant="outline" onClick={onAddCategory}>
          <Plus /> Nueva categoría
        </Button>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {categorized.map((cat) => (
          <Card key={cat.category} className="gap-0 overflow-hidden py-0">
            <div className="flex items-center gap-2 border-b p-3">
              <Input
                key={cat.category}
                defaultValue={cat.category}
                onBlur={(e) => onRenameCategory(cat.category, e.target.value)}
                aria-label="Nombre de la categoría"
                className="h-9 border-transparent bg-transparent font-medium shadow-none hover:border-input focus-visible:border-ring dark:bg-transparent"
              />
              <Badge variant="secondary">{cat.items.length}</Badge>
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
            <ul className="divide-y">
              {cat.items.map((item, index) => (
                <li key={item.id} className="group flex items-center gap-2 px-3 py-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="relative size-9 shrink-0 overflow-hidden rounded-md bg-muted"
                        style={{ boxShadow: `0 0 0 1.5px ${theme.ring}` }}
                        aria-label="Cambiar ícono"
                      >
                        <Image
                          src={item.icon || theme.fallbackIcon}
                          alt=""
                          fill
                          unoptimized
                          sizes="36px"
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
                    className="h-9 flex-1 border-transparent bg-transparent shadow-none hover:border-input focus-visible:border-ring dark:bg-transparent"
                  />
                  <Input
                    type="number"
                    value={item.valor}
                    onChange={(e) =>
                      onUpdateItemLocal(item.id, "valor", parseInt(e.target.value) || 0)
                    }
                    onBlur={() => onPersistItem(item.id)}
                    aria-label="Valor"
                    className={cn("h-9 w-20 text-right font-mono font-semibold", theme.value)}
                  />
                  <div className="flex items-center opacity-60 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                    <div className="flex flex-col">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        disabled={index === 0}
                        onClick={() => onMoveItem(item.id, "up")}
                        aria-label="Subir"
                      >
                        <ChevronUp />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        disabled={index === cat.items.length - 1}
                        onClick={() => onMoveItem(item.id, "down")}
                        aria-label="Bajar"
                      >
                        <ChevronDown />
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onRemoveItem(item.id)}
                      aria-label="Eliminar"
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X />
                    </Button>
                  </div>
                </li>
              ))}
              {cat.items.length === 0 && (
                <li className="px-3 py-6 text-center text-sm text-muted-foreground">
                  Sin reglas todavía
                </li>
              )}
            </ul>
            <div className="border-t p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => onAddItem(cat.category)}
              >
                <Plus /> {theme.addLabel}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
