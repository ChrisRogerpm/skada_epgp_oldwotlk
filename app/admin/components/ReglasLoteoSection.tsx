"use client";

import { useState } from "react";
import { ExternalLink, Loader2, Pencil, Plus, ScrollText, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { ItemIcon } from "@/components/wow/item-icon";
import { REGLAS_RAID_TABS } from "@/app/types/Reglas";
import { cn } from "@/lib/utils";
import { formatPoints, itemUrl } from "@/lib/wow";
import { useReglasLoteoAdmin } from "../hooks/useReglasLoteoAdmin";
import { AdminStatus } from "../types";
import ItemSearchPicker from "./shared/ItemSearchPicker";

interface ReglasLoteoSectionProps {
  search: string;
  onStatus: (status: AdminStatus) => void;
}

const NEW_CATEGORY = "__new__";

export default function ReglasLoteoSection({ search, onStatus }: ReglasLoteoSectionProps) {
  const {
    rulesForActiveRaid,
    isLoading,
    isSaving,
    activeRaid,
    setActiveRaid,
    isDrawerOpen,
    form,
    setForm,
    itemOptions,
    categories,
    openCreate,
    openEdit,
    closeDrawer,
    pickItem,
    addRequirement,
    removeRequirement,
    saveItem,
    deleteItem,
  } = useReglasLoteoAdmin(search, onStatus);
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [reqDraft, setReqDraft] = useState("");

  const submitRequirement = () => {
    addRequirement(reqDraft);
    setReqDraft("");
  };

  const categoryKnown = !form.categoria || categories.includes(form.categoria);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Tabs value={activeRaid} onValueChange={(v) => setActiveRaid(v as typeof activeRaid)}>
          <TabsList>
            {REGLAS_RAID_TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Button className="ml-auto" onClick={openCreate}>
          <Plus /> Agregar regla
        </Button>
      </div>

      <Card className="gap-0 overflow-hidden py-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Ítem</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead className="text-right">Mínimo</TableHead>
              <TableHead className="hidden md:table-cell">Requisitos</TableHead>
              <TableHead className="w-20">
                <span className="sr-only">Acciones</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className={cn(isLoading && "opacity-60")}>
            {rulesForActiveRaid.map((rule) => (
              <TableRow key={rule.id}>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <ItemIcon src={rule.icon} name={rule.name} size={30} />
                    <span className="max-w-64 truncate font-medium">{rule.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{rule.category}</Badge>
                </TableCell>
                <TableCell className="text-right font-mono font-semibold tabular">
                  {formatPoints(rule.valueMin)}
                </TableCell>
                <TableCell className="hidden whitespace-normal md:table-cell">
                  <div className="flex flex-wrap gap-1">
                    {rule.requirement.length ? (
                      rule.requirement.map((r, i) => (
                        <Badge
                          key={i}
                          variant="secondary"
                          className="h-auto py-0.5 text-left whitespace-normal"
                        >
                          {r}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => openEdit(rule)}
                      aria-label="Editar regla"
                    >
                      <Pencil />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => deleteItem(rule.id)}
                      aria-label="Eliminar regla"
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {rulesForActiveRaid.length === 0 && !isLoading && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={5}>
                  <Empty className="py-12">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <ScrollText />
                      </EmptyMedia>
                      <EmptyTitle>Sin reglas para esta raid</EmptyTitle>
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Sheet open={isDrawerOpen} onOpenChange={(open) => !open && closeDrawer()}>
        <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
          <SheetHeader className="border-b">
            <SheetTitle>{form.id ? "Editar regla de loteo" : "Nueva regla de loteo"}</SheetTitle>
            <SheetDescription>Ítem, categoría, puntos mínimos y requisitos.</SheetDescription>
          </SheetHeader>
          <form
            id="loteo-form"
            onSubmit={saveItem}
            className="flex flex-1 flex-col gap-5 overflow-y-auto p-4"
          >
            <div className="flex flex-col gap-2">
              <Label>Raid</Label>
              <Tabs
                value={form.raidCode}
                onValueChange={(v) =>
                  setForm({ ...form, raidCode: v as typeof form.raidCode, idItem: null })
                }
              >
                <TabsList className="w-full">
                  {REGLAS_RAID_TABS.map((t) => (
                    <TabsTrigger key={t.value} value={t.value} className="flex-1">
                      {t.value}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="loteo-item">Ítem</Label>
              <ItemSearchPicker
                id="loteo-item"
                items={itemOptions}
                selectedIds={form.idItem !== null ? [form.idItem] : []}
                onToggle={pickItem}
                triggerLabel={`Elige un ítem de ${form.raidCode}…`}
                emptyLabel={`Sin ítems para ${form.raidCode}`}
                fallbackLabel={form.idItem === null ? form.nombreItem || undefined : undefined}
                fallbackIcon={form.iconUrl}
              />
              {form.nombreItem && (
                <a
                  href={itemUrl(form.idItem, form.nombreItem)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <ExternalLink className="size-3" /> Ver en la base de datos
                </a>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="loteo-cat">Categoría</Label>
              {isNewCategory || !categoryKnown ? (
                <div className="flex gap-2">
                  <Input
                    id="loteo-cat"
                    value={form.categoria}
                    onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                    placeholder="Nombre de la nueva categoría"
                    className="h-10"
                    autoFocus
                  />
                  {categories.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10"
                      onClick={() => {
                        setIsNewCategory(false);
                        setForm({ ...form, categoria: "" });
                      }}
                    >
                      Elegir existente
                    </Button>
                  )}
                </div>
              ) : (
                <Select
                  value={form.categoria || undefined}
                  onValueChange={(v) => {
                    if (v === NEW_CATEGORY) {
                      setIsNewCategory(true);
                      setForm({ ...form, categoria: "" });
                    } else setForm({ ...form, categoria: v });
                  }}
                >
                  <SelectTrigger id="loteo-cat" className="h-10! w-full">
                    <SelectValue placeholder="Elige una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                    <SelectItem value={NEW_CATEGORY}>+ Nueva categoría…</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="loteo-min">Puntos mínimos</Label>
              <Input
                id="loteo-min"
                type="number"
                inputMode="numeric"
                value={form.valorMinimo}
                onChange={(e) => setForm({ ...form, valorMinimo: parseInt(e.target.value) || 0 })}
                className="h-10 font-mono"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="loteo-req">Requisitos</Label>
              {form.requisitos.length > 0 && (
                <ul className="flex flex-col gap-1.5">
                  {form.requisitos.map((req, idx) => (
                    <li
                      key={idx}
                      className="flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm"
                    >
                      <span className="flex-1">{req}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => removeRequirement(idx)}
                        aria-label={`Quitar requisito ${req}`}
                      >
                        <X />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex gap-2">
                <Input
                  id="loteo-req"
                  value={reqDraft}
                  onChange={(e) => setReqDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      submitRequirement();
                    }
                  }}
                  placeholder="Ej.: Main, Full Gear ICC…"
                  className="h-10"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="h-10"
                  onClick={submitRequirement}
                  disabled={!reqDraft.trim()}
                >
                  <Plus /> Añadir
                </Button>
              </div>
            </div>
          </form>
          <SheetFooter className="flex-row justify-end border-t">
            <Button type="button" variant="outline" onClick={closeDrawer}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="loteo-form"
              disabled={isSaving || !form.categoria || !form.nombreItem}
            >
              {isSaving && <Loader2 className="animate-spin" />}
              {form.id ? "Guardar cambios" : "Agregar regla"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
