import { itemUrl } from "@/lib/wow";

/** Texto de EPGP donde los "[Ítem]" se vuelven enlaces con tooltip de ultimowow. */
export function ItemDescription({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\[.*?\]|\(ID:\s*\d+\))/i).map((part, i) => {
        const id = part.match(/^\(ID:\s*(\d+)\)$/i)?.[1];
        if (id) {
          return (
            <a
              key={i}
              href={itemUrl(Number(id))}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-purple-600 underline-offset-2 hover:underline dark:text-purple-400"
            >
              (ver ítem)
            </a>
          );
        }
        if (part.startsWith("[") && part.endsWith("]")) {
          const name = part.slice(1, -1);
          return (
            <a
              key={i}
              href={itemUrl(null, name)}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-purple-600 underline-offset-2 hover:underline dark:text-purple-400"
            >
              {part}
            </a>
          );
        }
        return part;
      })}
    </>
  );
}

/** Movimiento de botín: el addon escribe "[Ítem]" o "Raid - Ítem (ID:12345)". */
export function isLootEntry(text: string) {
  return /\[.*?\]|\(ID:\s*\d+\)/i.test(text);
}
