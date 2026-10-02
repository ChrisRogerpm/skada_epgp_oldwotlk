"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useCommandMenu } from "@/components/command-menu";
import { findNav } from "@/lib/nav";
import { useRoster } from "@/hooks/use-roster";
import { timeAgo, useNow } from "@/hooks/use-now";
import { cn } from "@/lib/utils";

export function AppHeader() {
  const pathname = usePathname();
  const { open } = useCommandMenu();
  const nav = findNav(pathname);

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem className="hidden md:block">
            <BreadcrumbLink asChild>
              <Link href="/">Old Legends</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {nav && (
            <>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="hidden md:block">{nav.group.label}</BreadcrumbItem>
              {nav.item && nav.item.href !== "/" && (
                <>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{nav.item.label}</BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              )}
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>
      <div className="ml-auto flex items-center gap-2">
        <SyncStatus />
        <Button
          variant="ghost"
          size="icon"
          aria-label="Buscar"
          onClick={open}
          className="md:hidden"
        >
          <Search />
        </Button>
      </div>
    </header>
  );
}

/** Última sincronización del roster EPGP enviada por ScriptSkada (hora de Lima). */
function SyncStatus() {
  const { updatedDate, updatedHour } = useRoster();
  const now = useNow();
  if (!updatedDate) return null;
  const at = Date.parse(`${updatedDate}T${updatedHour || "00:00:00"}-05:00`);
  if (Number.isNaN(at)) return null;
  const stale = now - at > 24 * 3600 * 1000;
  return (
    <span
      className="hidden h-7 items-center gap-2 rounded-full border px-2.5 text-xs text-muted-foreground sm:flex"
      title={`Última sincronización: ${updatedDate} ${updatedHour ?? ""} (Lima)`}
    >
      <span className={cn("size-1.5 rounded-full", stale ? "bg-highlight" : "bg-primary")} />
      Sincronizado con ScriptSkada · {timeAgo(at, now)}
    </span>
  );
}
