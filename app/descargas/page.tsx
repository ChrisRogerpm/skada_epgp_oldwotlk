export const revalidate = 60;

import type { Metadata } from "next";
import { Download, ExternalLink, HardDrive } from "lucide-react";
import { GetDownloadsUseCase } from "@/src/application/useCases/GetDownloadsUseCase";
import { SupabaseDownloadsRepository } from "@/src/infrastructure/repositories/SupabaseDownloadsRepository";
import { Badge } from "@/components/ui/badge";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { PageBody, PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Descargas" };

export default async function DescargasPage() {
  const useCase = new GetDownloadsUseCase(new SupabaseDownloadsRepository());
  const downloads = await useCase.execute();

  const groups = Object.entries(
    downloads.reduce<Record<string, typeof downloads>>((acc, item) => {
      const type = item.type || "Otros";
      (acc[type] ??= []).push(item);
      return acc;
    }, {}),
  );

  return (
    <PageBody>
      <PageHeader
        title="Descargas"
        description="Clientes, addons, parches y herramientas recomendadas para jugar con la hermandad."
      />

      {downloads.length === 0 ? (
        <Empty className="border border-dashed py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <HardDrive />
            </EmptyMedia>
            <EmptyTitle>No hay descargas disponibles</EmptyTitle>
            <EmptyDescription>Vuelve más tarde o pregunta a un oficial.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        groups.map(([type, items]) => (
          <section key={type} className="flex flex-col gap-3">
            <h2 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              {type}
              <Badge variant="secondary">{items.length}</Badge>
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((item) => (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 rounded-xl border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Download className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{item.nameFile}</span>
                    <span className="text-xs text-muted-foreground">Abre el enlace de descarga</span>
                  </span>
                  <ExternalLink className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
                </a>
              ))}
            </div>
          </section>
        ))
      )}
    </PageBody>
  );
}
