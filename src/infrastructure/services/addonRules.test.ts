import { describe, expect, it } from "vitest";
import { toAddonRules } from "./addonRules";

describe("toAddonRules", () => {
  it("mapea reglas_puntos al formato del addon respetando el orden", () => {
    const rules = toAddonRules([
      {
        tipo: "beneficio",
        categoria: "Icecrown Citadel (ICC)",
        descripcion: "ICC - Dientefrio",
        valor: 10,
      },
      {
        tipo: "perjuicio",
        categoria: "Otros",
        descripcion: "Otros - Inasistencia RS",
        valor: "-100",
      },
    ]);
    expect(rules).toEqual([
      {
        categoria: "Icecrown Citadel (ICC)",
        description: "ICC - Dientefrio",
        value: 10,
        tipo: "beneficio",
      },
      {
        categoria: "Otros",
        description: "Otros - Inasistencia RS",
        value: -100,
        tipo: "perjuicio",
      },
    ]);
  });

  it("descarta filas sin descripción o con valor no numérico", () => {
    const rules = toAddonRules([
      { categoria: "Otros", descripcion: "", valor: 5 },
      { categoria: "Otros", descripcion: "Sin valor", valor: "abc" },
      { descripcion: "Sin categoría", valor: 1 },
    ]);
    expect(rules).toEqual([
      { categoria: "Otros", description: "Sin categoría", value: 1, tipo: null },
    ]);
  });
});
