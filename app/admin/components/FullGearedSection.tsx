"use client";

import { useState } from "react";
import { Loader2, Pencil, ShieldCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { ClassIcon } from "@/components/wow/class-icon";
import { CharacterName } from "@/components/wow/character-name";
import { cn } from "@/lib/utils";
import { getClassMeta } from "@/lib/wow";
import { useFullGearedAdmin } from "../hooks/useFullGearedAdmin";
import { AdminStatus } from "../types";
import CharacterSearchInput from "./shared/CharacterSearchInput";
import AdminPagination from "./shared/AdminPagination";

interface FullGearedSectionProps {
  search: string;
  onStatus: (status: AdminStatus) => void;
}

export default function FullGearedSection({ search, onStatus }: FullGearedSectionProps) {
  const {
    characters,
    totalItems,
    currentPage,
    setCurrentPage,
    totalPages,
    isLoading,
    isSaving,
    isSearchingChar,
    charSearchResults,
    charForm,
    setCharForm,
    searchCharacters,
    selectSearchResult,
    editCharacter,
    resetForm,
    saveCharacter,
    deleteCharacter,
  } = useFullGearedAdmin(search, onStatus);
  const [query, setQuery] = useState("");

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[400px_minmax(0,1fr)]">
      <Card>
        <CardHeader>
          <CardTitle>{charForm.id ? "Editar personaje" : "Registrar personaje"}</CardTitle>
          <CardDescription>Marca qué raids tiene completas y su GearScore.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveCharacter} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="fg-search">Buscar en EPGP</Label>
              <CharacterSearchInput
                id="fg-search"
                value={query}
                results={charSearchResults}
                loading={isSearchingChar}
                onChange={(text) => {
                  setQuery(text);
                  searchCharacters(text);
                }}
                onSelect={(r) => {
                  selectSearchResult(r);
                  setQuery("");
                }}
              />
            </div>

            <div className="flex items-center gap-3 rounded-lg border p-3">
              {charForm.name ? (
                <>
                  <ClassIcon cls={charForm.class} size={36} />
                  <div className="min-w-0 flex-1 leading-tight">
                    <CharacterName cls={charForm.class} className="block truncate font-semibold">
                      {charForm.name}
                    </CharacterName>
                    <span className="text-xs text-muted-foreground">
                      {getClassMeta(charForm.class)?.name ?? charForm.class} · main{" "}
                      {charForm.main || "—"}
                    </span>
                  </div>
                </>
              ) : (
                <span className="text-sm text-muted-foreground">
                  Elige un personaje del roster.
                </span>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="fg-gs">GearScore</Label>
              <Input
                id="fg-gs"
                type="number"
                inputMode="numeric"
                value={charForm.gs || ""}
                onChange={(e) => setCharForm({ ...charForm, gs: parseInt(e.target.value) || 0 })}
                className="h-10 font-mono"
              />
            </div>

            <fieldset className="flex flex-col gap-3">
              <legend className="mb-2 text-sm font-medium">Raids completas</legend>
              <Label className="flex items-center gap-2.5 font-normal">
                <Checkbox
                  checked={!!charForm.icc}
                  onCheckedChange={(v) => setCharForm({ ...charForm, icc: v === true })}
                />
                Ciudadela de la Corona de Hielo (ICC)
              </Label>
              <Label className="flex items-center gap-2.5 font-normal">
                <Checkbox
                  checked={!!charForm.rs}
                  onCheckedChange={(v) => setCharForm({ ...charForm, rs: v === true })}
                />
                Sagrario Rubí (RS)
              </Label>
            </fieldset>

            <div className="flex justify-end gap-2">
              {(charForm.id || charForm.name) && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              )}
              <Button type="submit" disabled={isSaving || !charForm.name}>
                {isSaving && <Loader2 className="animate-spin" />}
                {charForm.id ? "Guardar cambios" : "Registrar"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="gap-0 overflow-hidden py-0">
        <CardHeader className="border-b py-4">
          <CardTitle>Full Gear</CardTitle>
          <CardDescription>Personajes con equipo completo</CardDescription>
          <CardAction>
            <Badge variant="secondary">{totalItems} personajes</Badge>
          </CardAction>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Personaje</TableHead>
              <TableHead className="hidden sm:table-cell">Main</TableHead>
              <TableHead className="text-right">GS</TableHead>
              <TableHead>Raids</TableHead>
              <TableHead className="w-20">
                <span className="sr-only">Acciones</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className={cn(isLoading && "opacity-60")}>
            {characters.map((c) => (
              <TableRow key={c.id ?? c.name} className={cn(charForm.id === c.id && "bg-primary/5")}>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <ClassIcon cls={c.class} size={28} />
                    <CharacterName cls={c.class} className="font-semibold">
                      {c.name}
                    </CharacterName>
                  </div>
                </TableCell>
                <TableCell className="hidden text-muted-foreground sm:table-cell">
                  {c.main}
                </TableCell>
                <TableCell className="text-right font-mono font-semibold tabular">{c.gs}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {!!c.icc && <Badge>ICC</Badge>}
                    {!!c.rs && <Badge variant="secondary">RS</Badge>}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => editCharacter(c)}
                      aria-label="Editar"
                    >
                      <Pencil />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => c.id && deleteCharacter(c.id)}
                      aria-label="Eliminar"
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {characters.length === 0 && !isLoading && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={5}>
                  <Empty className="py-12">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <ShieldCheck />
                      </EmptyMedia>
                      <EmptyTitle>Sin personajes registrados</EmptyTitle>
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <AdminPagination page={currentPage} totalPages={totalPages} onChange={setCurrentPage} />
      </Card>
    </div>
  );
}
