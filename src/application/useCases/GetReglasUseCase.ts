import { IReglasRepository } from "@/src/domain/repositories/IReglasRepository";

export class GetReglasUseCase {
  constructor(private readonly repository: IReglasRepository) {}

  async execute(): Promise<any[]> {
    const lootRows = await this.repository.getLoteo();
    const pointsRows = await this.repository.getPuntos();

    // --- PROCESAR LOTEO ---
    const lootMap: Record<string, any> = {};
    (lootRows || []).forEach((row) => {
      const raidName = row.raid || "Otras Reglas";
      if (!lootMap[raidName]) lootMap[raidName] = { raid: raidName, items: [] };
      lootMap[raidName].items.push({
        category: row.categoria_item,
        item: row.nombre_item,
        requirement: Array.isArray(row.requisitos)
          ? row.requisitos
          : row.requisitos
            ? [row.requisitos]
            : [],
        valueMin: row.valor_minimo,
        icon:
          row.icon_url ||
          "https://wow.zamimg.com/images/wow/icons/large/inv_misc_questionmark.jpg",
      });
    });

    // --- PROCESAR PUNTOS (Beneficios y Perjuicios) ---
    const processPoints = (rows: any[], target: string) => {
      const categoriesMap: Record<string, any> = {};

      rows.forEach((row) => {
        const rowTipo = String(row.tipo || "").toLowerCase();
        if (rowTipo !== target.toLowerCase()) return;

        const catName = row.categoria || "General";
        if (!categoriesMap[catName]) {
          categoriesMap[catName] = { category: catName, items: [] };
        }

        // Caso A: La fila ya tiene un array de 'items' (Estructura anidada del Admin)
        if (Array.isArray(row.items)) {
          categoriesMap[catName].items.push(...row.items);
        }
        // Caso B: La fila es un ítem individual (Estructura plana)
        else if (row.descripcion) {
          categoriesMap[catName].items.push({
            descripcion: row.descripcion,
            valor: row.valor,
            icon:
              row.icon_url ||
              "https://wow.zamimg.com/images/wow/icons/large/inv_misc_coin_02.jpg",
          });
        }
      });

      return Object.values(categoriesMap);
    };

    const beneficios = processPoints(pointsRows || [], "beneficio");
    const perjuicios = processPoints(pointsRows || [], "perjuicio");
    
    return [
      { "Reglas de Loteo": Object.values(lootMap) },
      { Beneficios: beneficios },
      { Perjuicios: perjuicios },
    ];
  }
}
