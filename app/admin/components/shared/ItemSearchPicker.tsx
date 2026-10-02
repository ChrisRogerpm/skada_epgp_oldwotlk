"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ItemIcon } from "@/components/wow/item-icon";
import { cn } from "@/lib/utils";
import { itemQuality } from "@/lib/wow";

export interface ItemSearchOption {
  id: number | string;
  id_item: number;
  name: string;
  icon: string;
}

interface ItemSearchPickerProps {
  items: ItemSearchOption[];
  selectedIds: number[];
  onToggle: (idItem: number) => void;
  /** Permite elegir varios a la vez (chips + no cierra al elegir). Por defecto, uno solo. */
  multiple?: boolean;
  triggerLabel: string;
  emptyLabel?: string;
  /**
   * Nombre/ícono a mostrar en el botón cuando no hay match en `items` pero ya
   * existe un valor guardado sin vincular al catálogo (filas viejas cargadas
   * a mano, antes de que existiera este selector).
   */
  fallbackLabel?: string;
  fallbackIcon?: string;
  id?: string;
}

/**
 * Selector de ítem con buscador + ícono, reusado por el admin de Loot y el
 * de Reglas de Loteo: en vez de tipear nombre/URL de ícono a mano, se elige
 * del catálogo real y ambos se completan solos.
 */
export default function ItemSearchPicker({
  items,
  selectedIds,
  onToggle,
  multiple = false,
  triggerLabel,
  emptyLabel = "Sin ítems disponibles",
  fallbackLabel,
  fallbackIcon,
  id,
}: ItemSearchPickerProps) {
  const [open, setOpen] = useState(false);
  const selected = items.filter((item) => selectedIds.includes(item.id_item));

  return (
    <div className="flex flex-col gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="h-10 w-full justify-start px-2.5 font-normal"
          >
            {selected.length === 0 && fallbackLabel ? (
              <>
                <ItemIcon src={fallbackIcon} name={fallbackLabel} size={24} />
                <span className="truncate">{fallbackLabel}</span>
                <Badge
                  variant="outline"
                  className="border-amber-500/40 text-amber-600 dark:text-amber-400"
                >
                  sin vincular
                </Badge>
              </>
            ) : selected.length === 0 ? (
              <span className="text-muted-foreground">{triggerLabel}</span>
            ) : !multiple || selected.length === 1 ? (
              <>
                <ItemIcon
                  src={selected[0].icon}
                  name={selected[0].name}
                  quality={itemQuality(selected[0].id_item)}
                  size={24}
                />
                <span className="truncate">{selected[0].name}</span>
              </>
            ) : (
              <span>{selected.length} ítems seleccionados</span>
            )}
            <ChevronsUpDown className="ml-auto text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-(--radix-popover-trigger-width) min-w-72 p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar ítem…" />
            <CommandList>
              <CommandEmpty>{emptyLabel}</CommandEmpty>
              <CommandGroup>
                {items.map((item) => {
                  const on = selectedIds.includes(item.id_item);
                  return (
                    <CommandItem
                      key={item.id}
                      value={`${item.name} ${item.id_item}`}
                      onSelect={() => {
                        onToggle(item.id_item);
                        if (!multiple) setOpen(false);
                      }}
                    >
                      <ItemIcon
                        src={item.icon}
                        name={item.name}
                        quality={itemQuality(item.id_item)}
                        size={24}
                      />
                      <span className="flex-1 truncate">{item.name}</span>
                      <Check className={cn("size-4", on ? "opacity-100" : "opacity-0")} />
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {multiple && selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((item) => (
            <Badge key={item.id_item} variant="secondary" className="h-7 gap-1.5 pr-1 pl-1">
              <ItemIcon
                src={item.icon}
                name={item.name}
                quality={itemQuality(item.id_item)}
                size={18}
              />
              <span className="max-w-40 truncate">{item.name}</span>
              <button
                type="button"
                onClick={() => onToggle(item.id_item)}
                className="rounded-sm p-0.5 text-muted-foreground hover:text-foreground"
                aria-label={`Quitar ${item.name}`}
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
