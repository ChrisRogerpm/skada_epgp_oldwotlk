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

  it("agrega el loteo con el formato histórico de ep_reasons.lua, después de los puntos", () => {
    const rules = toAddonRules(
      [
        {
          tipo: "beneficio",
          categoria: "Icecrown Citadel (ICC)",
          descripcion: "ICC - Dientefrio",
          valor: 10,
        },
      ],
      [
        {
          raid: "Icecrown Citadel (ICC)",
          nombre_item: "Garra cruel de Sindragosa",
          id_item: 50633,
          valor_minimo: 100,
        },
        {
          raid: "Icecrown Citadel (ICC)",
          nombre_item: "Ábaco de Althor",
          id_item: 50366,
          valor_minimo: 50,
        },
        { raid: "Ruby Sanctum (RS)", nombre_item: "Sin ID", valor_minimo: 20 },
      ],
    );
    expect(rules.map((r) => [r.description, r.value])).toEqual([
      ["ICC - Dientefrio", 10],
      ["Icecrown Citadel (ICC) - Ábaco de Althor (50366)", -50],
      ["Icecrown Citadel (ICC) - Garra cruel de Sindragosa (50633)", -100],
      ["Ruby Sanctum (RS) - Sin ID", -20],
    ]);
    expect(rules[1]).toMatchObject({ categoria: "Icecrown Citadel (ICC)", tipo: "loteo" });
  });

  it("descarta ítems sin nombre o sin valor mínimo y no repite descripciones", () => {
    const item = {
      raid: "Ruby Sanctum (RS)",
      nombre_item: "Pieza",
      id_item: 1,
      valor_minimo: 10,
    };
    const rules = toAddonRules(
      [],
      [
        item,
        item,
        { raid: "Ruby Sanctum (RS)", nombre_item: "", valor_minimo: 5 },
        { ...item, id_item: 2, valor_minimo: null },
      ],
    );
    expect(rules.map((r) => r.description)).toEqual(["Ruby Sanctum (RS) - Pieza (1)"]);
  });
});
