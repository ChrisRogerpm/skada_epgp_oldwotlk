"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Settings, Shield, Star } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { Kbd } from "@/components/ui/kbd";
import { ClassIcon } from "@/components/wow/class-icon";
import { CharacterName } from "@/components/wow/character-name";
import { useCommandMenu } from "@/components/command-menu";
import { ThemeToggle } from "@/app/components/ThemeToggle";
import { useMyCharacter } from "@/hooks/use-my-character";
import { useRoster } from "@/hooks/use-roster";
import { NAV_GROUPS, isActive } from "@/lib/nav";
import { formatPoints } from "@/lib/wow";

export function AppSidebar() {
  const pathname = usePathname();
  const { open: openSearch } = useCommandMenu();
  const { setOpenMobile } = useSidebar();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/" onClick={() => setOpenMobile(false)}>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Shield className="size-4" />
                </div>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate font-semibold">Old Legends</span>
                  <span className="truncate text-xs text-muted-foreground">WotLK · Hermandad</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => openSearch()}
              tooltip="Buscar (Ctrl K)"
              className="h-9 border bg-card text-muted-foreground shadow-none hover:text-foreground"
            >
              <Search />
              <span className="flex-1">Buscar…</span>
              <Kbd className="group-data-[collapsible=icon]:hidden">Ctrl K</Kbd>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {NAV_GROUPS.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-[11px] tracking-wider text-muted-foreground uppercase">
              {group.label}
            </SidebarGroupLabel>
            <SidebarMenu>
              {group.items.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(pathname, item.href)}
                    tooltip={item.label}
                    className="h-9 text-muted-foreground data-[active=true]:text-foreground [&>svg]:text-muted-foreground data-[active=true]:[&>svg]:text-primary"
                  >
                    <Link href={item.href} onClick={() => setOpenMobile(false)}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <MyCharacterCard />
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-1">
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith("/admin")}
              tooltip="Administración"
            >
              <Link href="/admin" onClick={() => setOpenMobile(false)}>
                <Settings />
                <span>Administración</span>
              </Link>
            </SidebarMenuButton>
            <div className="group-data-[collapsible=icon]:hidden">
              <ThemeToggle />
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

function MyCharacterCard() {
  const { myCharacter } = useMyCharacter();
  const { roster, rankOf } = useRoster();
  const { setOpenMobile } = useSidebar();
  const member = roster.find((m) => m.main === myCharacter);

  if (!myCharacter) {
    return (
      <Link
        href="/epgp"
        onClick={() => setOpenMobile(false)}
        className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground transition-colors hover:text-foreground group-data-[collapsible=icon]:hidden"
      >
        <span className="flex items-center gap-1.5 font-medium text-foreground">
          <Star className="size-3.5" /> Fija tu personaje
        </span>
        Márcalo con la estrella en EPGP para verlo siempre aquí.
      </Link>
    );
  }

  return (
    <Link
      href={`/epgp?personaje=${encodeURIComponent(myCharacter)}`}
      onClick={() => setOpenMobile(false)}
      className="flex items-center gap-2.5 rounded-lg border bg-background p-2 transition-colors hover:bg-accent group-data-[collapsible=icon]:hidden"
    >
      <ClassIcon cls={member?.class} src={member?.icon} size={32} />
      <div className="grid min-w-0 flex-1 leading-tight">
        <CharacterName cls={member?.class} className="truncate text-sm font-semibold">
          {myCharacter}
        </CharacterName>
        <span className="truncate text-xs text-muted-foreground tabular">
          {member
            ? `${formatPoints(member.amount)} pts · #${rankOf.get(member.main)}`
            : "No está en el roster"}
        </span>
      </div>
      <Star
        className="size-3.5 shrink-0 fill-highlight text-highlight"
        aria-label="Personaje fijado"
      />
    </Link>
  );
}
