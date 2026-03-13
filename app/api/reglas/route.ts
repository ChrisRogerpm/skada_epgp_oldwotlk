import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

export async function GET() {
  console.log("Reglas API: Iniciando revisión de Beneficios y Perjuicios...");
  try {
    // 1. Obtener Loteo
    const { data: lootRows, error: lootError } = await supabase
      .from("reglas_loteo")
      .select(
        "raid, categoria_item, nombre_item, requisitos, valor_minimo, icon_url",
      )
      .order("raid", { ascending: true });

    if (lootError) console.error("Error Loteo:", lootError);

    // 2. Obtener Puntos
    const { data: pointsRows, error: pointsError } = await supabase
      .from("reglas_puntos")
      .select("tipo, categoria, descripcion, valor, icon_url");
    // .order("category", { ascending: true });

    if (pointsError) console.error("Error Puntos:", pointsError);

    // --- PROCESAR LOTEO (Ya funciona) ---
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
    const result = [
      { "Reglas de Loteo": Object.values(lootMap) },
      { Beneficios: beneficios },
      { Perjuicios: perjuicios },
    ];

    console.log(
      `Reglas API: Beneficios (${beneficios.length}), Perjuicios (${perjuicios.length})`,
    );
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error crítico:", error);
    return NextResponse.json({ error: "Error de servidor" }, { status: 500 });
  }
}
