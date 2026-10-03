"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, KeyRound, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { confirmDialog } from "@/components/confirm-dialog";
import { timeAgo, useNow } from "@/hooks/use-now";
import { cn } from "@/lib/utils";
import { adminJson } from "../../lib/api";
import type { AdminStatus } from "../../types";

interface SyncToken {
  id: string;
  name: string;
  token_prefix: string;
  officer_name: string | null;
  scopes: string[];
  expires_at: string | null;
  revoked_at: string | null;
  last_used_at: string | null;
  created_at: string;
}

interface TokensResponse {
  data: SyncToken[];
  scopes: string[];
}

const SCOPE_LABEL: Record<string, string> = {
  "skada:write": "Skada",
  "roster:write": "Roster",
  "raidcomposition:write": "Composición de raid",
  "blacklist:write": "Lista negra",
  "epgp:write": "EPGP",
  "raid-items:write": "Ítems de raid",
  "rules:read": "Leer reglas",
};

function CreateTokenDialog({
  open,
  scopes,
  onClose,
  onCreated,
  onStatus,
}: {
  open: boolean;
  scopes: string[];
  onClose: () => void;
  onCreated: (token: string, name: string) => void;
  onStatus: (s: AdminStatus) => void;
}) {
  const [name, setName] = useState("");
  const [officer, setOfficer] = useState("");
  const [all, setAll] = useState(true);
  const [picked, setPicked] = useState<string[]>([]);
  const [expires, setExpires] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const result = await adminJson<{ token: string; row: SyncToken }>("/api/admin/sync-tokens", {
        method: "POST",
        body: JSON.stringify({
          name,
          officerName: officer || null,
          scopes: all ? ["*"] : picked,
          expiresAt: expires ? new Date(`${expires}T23:59:59`).toISOString() : null,
        }),
      });
      onCreated(result.token, result.row.name);
    } catch (error) {
      onStatus({
        type: "error",
        message: error instanceof Error ? error.message : "No se pudo crear el token",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Crear token de sync</DialogTitle>
          <DialogDescription>
            Cada oficial usa su propio token en ScriptSkada. Solo se muestra una vez.
          </DialogDescription>
        </DialogHeader>
        <form id="token-form" onSubmit={submit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="token-name">Nombre</Label>
            <Input
              id="token-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej.: ScriptSkada de Christian"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="token-officer">Oficial (opcional)</Label>
            <Input
              id="token-officer"
              value={officer}
              onChange={(e) => setOfficer(e.target.value)}
              placeholder="Nombre que envía el addon en x-officer-name"
            />
            <p className="text-xs text-muted-foreground">
              Si lo indicas, el token solo funcionará cuando el addon envíe ese mismo nombre.
            </p>
          </div>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1.5 text-sm font-medium">Permisos</legend>
            <Label className="flex items-center gap-2.5 font-normal">
              <Checkbox checked={all} onCheckedChange={(v) => setAll(v === true)} />
              Todos (lo que usa ScriptSkada)
            </Label>
            {!all && (
              <div className="grid grid-cols-2 gap-2 pl-1">
                {scopes.map((scope) => (
                  <Label key={scope} className="flex items-center gap-2 font-normal">
                    <Checkbox
                      checked={picked.includes(scope)}
                      onCheckedChange={(v) =>
                        setPicked((prev) =>
                          v === true ? [...prev, scope] : prev.filter((s) => s !== scope),
                        )
                      }
                    />
                    {SCOPE_LABEL[scope] ?? scope}
                  </Label>
                ))}
              </div>
            )}
          </fieldset>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="token-expires">Caduca (opcional)</Label>
            <Input
              id="token-expires"
              type="date"
              value={expires}
              onChange={(e) => setExpires(e.target.value)}
            />
          </div>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="token-form"
            disabled={saving || !name.trim() || (!all && picked.length === 0)}
          >
            {saving && <Loader2 className="animate-spin" />}
            Crear token
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Tokens de ScriptSkada: crear, ver su último uso y revocar (antes solo por `npm run sync-token`). */
export default function SyncTokensPanel({ onStatus }: { onStatus: (s: AdminStatus) => void }) {
  const queryClient = useQueryClient();
  const now = useNow();
  const [creating, setCreating] = useState<number | null>(null);
  const [created, setCreated] = useState<{ token: string; name: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["adminSyncTokens"],
    queryFn: () => adminJson<TokensResponse>("/api/admin/sync-tokens"),
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["adminSyncTokens"] });
    queryClient.invalidateQueries({ queryKey: ["adminActivity"] });
    adminJson("/api/admin/overview?fresh=1")
      .catch(() => null)
      .then(() => queryClient.invalidateQueries({ queryKey: ["adminOverview"] }));
  };

  const revoke = async (token: SyncToken) => {
    const ok = await confirmDialog({
      title: `¿Revocar el token «${token.name}»?`,
      description: "ScriptSkada dejará de poder sincronizar con él. No se puede deshacer.",
      confirmLabel: "Revocar",
      destructive: true,
    });
    if (!ok) return;
    try {
      await adminJson(`/api/admin/sync-tokens?id=${token.id}`, { method: "DELETE" });
      onStatus({ type: "success", message: `Token «${token.name}» revocado` });
      refresh();
    } catch (error) {
      onStatus({
        type: "error",
        message: error instanceof Error ? error.message : "No se pudo revocar el token",
      });
    }
  };

  const tokens = data?.data ?? [];
  const active = tokens.filter((t) => !t.revoked_at);
  const revoked = tokens.filter((t) => t.revoked_at);

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex flex-col gap-1">
          <h2 className="font-semibold">Tokens de sync</h2>
          <p className="text-sm text-muted-foreground">
            Lo mismo que <code className="font-mono text-xs">npm run sync-token</code>, desde aquí.
          </p>
        </div>
        <Button onClick={() => setCreating(Date.now())}>
          <Plus /> Crear token
        </Button>
      </div>

      {created && (
        <div className="mx-4 mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-primary/40 bg-primary/5 p-3">
          <span className="min-w-56 flex-1 text-sm">
            Token «{created.name}» creado. <b className="font-semibold">Cópialo ahora:</b> no se
            volverá a mostrar.
          </span>
          <code className="max-w-full truncate rounded-md border bg-background px-2.5 py-1.5 font-mono text-xs">
            {created.token}
          </code>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              await navigator.clipboard.writeText(created.token);
              setCopied(true);
            }}
          >
            {copied ? <Check /> : <Copy />} {copied ? "Copiado" : "Copiar"}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setCreated(null)}>
            Listo
          </Button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className={cn("w-full min-w-[760px] text-sm", isLoading && "opacity-60")}>
          <thead>
            <tr className="border-t text-left text-muted-foreground">
              <th className="px-4 py-2 font-medium">Nombre</th>
              <th className="px-2 py-2 font-medium">Prefijo</th>
              <th className="px-2 py-2 font-medium">Permisos</th>
              <th className="px-2 py-2 font-medium">Oficial</th>
              <th className="px-2 py-2 font-medium">Último uso</th>
              <th className="px-4 py-2">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {[...active, ...revoked].map((t) => {
              const lastUse = t.last_used_at ? new Date(t.last_used_at).getTime() : null;
              const idle = !t.revoked_at && (!lastUse || now - lastUse > 7 * 86_400_000);
              const expired = t.expires_at && new Date(t.expires_at).getTime() < now;
              return (
                <tr
                  key={t.id}
                  className={cn(
                    "border-t",
                    t.revoked_at && "text-muted-foreground",
                    idle && "shadow-[inset_3px_0_0_var(--negative)]",
                  )}
                >
                  <td className="px-4 py-2.5 font-medium">
                    {t.name}
                    {t.revoked_at && (
                      <Badge variant="outline" className="ml-2 font-normal">
                        Revocado
                      </Badge>
                    )}
                    {expired && !t.revoked_at && (
                      <Badge variant="outline" className="ml-2 font-normal text-negative">
                        Caducado
                      </Badge>
                    )}
                  </td>
                  <td className="px-2 py-2.5 font-mono text-xs text-muted-foreground">
                    {t.token_prefix}…
                  </td>
                  <td className="px-2 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {t.scopes.map((s) => (
                        <span key={s} className="rounded-full bg-secondary px-2 py-0.5 text-xs">
                          {s === "*" ? "Todos" : (SCOPE_LABEL[s] ?? s)}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-2 py-2.5">{t.officer_name ?? "—"}</td>
                  <td className={cn("px-2 py-2.5", idle ? "text-negative" : "text-muted-foreground")}>
                    {lastUse ? timeAgo(lastUse, now) : "Nunca"}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {!t.revoked_at && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => revoke(t)}
                        className={cn(idle && "border-negative/40 text-negative hover:text-negative")}
                      >
                        Revocar
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {tokens.length === 0 && !isLoading && (
        <Empty className="border-t py-12">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <KeyRound />
            </EmptyMedia>
            <EmptyTitle>No hay tokens de sync</EmptyTitle>
          </EmptyHeader>
        </Empty>
      )}

      {creating && (
        <CreateTokenDialog
          key={creating}
          open
          scopes={data?.scopes ?? []}
          onClose={() => setCreating(null)}
          onStatus={onStatus}
          onCreated={(token, name) => {
            setCreating(null);
            setCreated({ token, name });
            setCopied(false);
            refresh();
          }}
        />
      )}
    </Card>
  );
}
