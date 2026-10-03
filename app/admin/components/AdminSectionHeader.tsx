import { cn } from "@/lib/utils";

interface AdminSectionHeaderProps {
  group: string;
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

/** Cabecera de cada sección del admin: ruta, título, descripción y acciones. */
export default function AdminSectionHeader({
  group,
  title,
  description,
  actions,
  className,
}: AdminSectionHeaderProps) {
  return (
    <header
      className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}
    >
      <div className="min-w-0 space-y-1.5">
        <p className="text-sm text-muted-foreground">Administración / {group}</p>
        <h1 className="text-2xl font-semibold tracking-tight md:text-[1.75rem]">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
