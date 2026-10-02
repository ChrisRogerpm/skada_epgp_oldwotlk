import Image from "next/image";
import { cn } from "@/lib/utils";
import { getClassMeta, UNKNOWN_ICON } from "@/lib/wow";

interface ClassIconProps {
  cls?: string | null;
  /** Ícono propio (spec de Skada, ícono del roster); si falta se usa el de la clase. */
  src?: string | null;
  size?: number;
  className?: string;
}

/** Ícono de clase con un anillo del color de la clase. */
export function ClassIcon({ cls, src, size = 28, className }: ClassIconProps) {
  const meta = getClassMeta(cls);
  const url = src || meta?.icon || UNKNOWN_ICON;
  return (
    <span
      className={cn("relative inline-flex shrink-0 overflow-hidden rounded-md bg-muted", className)}
      style={{
        width: size,
        height: size,
        boxShadow: `0 0 0 1px ${meta ? `${meta.hex}99` : "var(--border)"}`,
      }}
      title={meta?.name}
    >
      <Image src={url} alt={meta?.name ?? "Clase"} fill unoptimized sizes={`${size}px`} className="object-cover" />
    </span>
  );
}
