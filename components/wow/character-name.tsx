import { cn } from "@/lib/utils";
import { classStyle, getClassMeta } from "@/lib/wow";

interface CharacterNameProps extends React.ComponentProps<"span"> {
  cls?: string | null;
}

/** Nombre de personaje en el color de su clase, legible en tema claro y oscuro. */
export function CharacterName({ cls, className, style, ...props }: CharacterNameProps) {
  const known = !!getClassMeta(cls);
  return (
    <span
      className={cn("font-medium", known && "text-class", className)}
      style={{ ...classStyle(cls), ...style }}
      {...props}
    />
  );
}
