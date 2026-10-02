import Image from "next/image";
import { cn } from "@/lib/utils";
import { ITEM_QUALITY, ItemQuality, UNKNOWN_ICON } from "@/lib/wow";

interface ItemIconProps {
  src?: string | null;
  name?: string;
  size?: number;
  quality?: ItemQuality;
  className?: string;
}

/** Ícono de ítem con borde del color de su calidad (épico por defecto). */
export function ItemIcon({ src, name, size = 32, quality = "epic", className }: ItemIconProps) {
  return (
    <span
      className={cn("relative inline-flex shrink-0 overflow-hidden rounded-md bg-muted", className)}
      style={{ width: size, height: size, boxShadow: `0 0 0 1.5px ${ITEM_QUALITY[quality]}` }}
    >
      <Image src={src || UNKNOWN_ICON} alt={name ?? ""} fill unoptimized sizes={`${size}px`} className="object-cover" />
    </span>
  );
}

/** Color de texto del nombre de un ítem según su calidad. */
export function itemNameClass(quality: ItemQuality = "epic") {
  return quality === "legendary"
    ? "text-orange-600 dark:text-orange-400"
    : quality === "rare"
      ? "text-blue-600 dark:text-blue-400"
      : "text-purple-600 dark:text-purple-400";
}
