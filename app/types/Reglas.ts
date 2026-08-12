export interface LootItem {
  category: string;
  item: string;
  requirement: string[];
  valueMin: number;
  icon: string;
}

export interface RaidRule {
  raid: string;
  items: LootItem[];
}

export interface BenefitItem {
  descripcion: string;
  valor: number;
  icon?: string;
}

export interface BenefitCategory {
  category: string;
  items: BenefitItem[];
}

export interface PenaltyItem {
  descripcion: string;
  valor: number;
  icon?: string;
}

export interface PenaltyCategory {
  category: string;
  items: PenaltyItem[];
}

export type RulesData = [
  { "Reglas de Loteo": RaidRule[] },
  { Beneficios: BenefitCategory[] },
  { Perjuicios: PenaltyCategory[] },
];

// ---------------------------------------------------------------------------
// Modelo por fila usado por el admin (registro/edición individual en vez de
// "Guardar Todo"). Mismos códigos de raid que ya usa el módulo de Loot.
// ---------------------------------------------------------------------------

export type RaidCode = "ICC" | "RS" | "TOGC";

export const REGLAS_RAID_TABS: { value: RaidCode; label: string }[] = [
  { value: "ICC", label: "Icecrown Citadel" },
  { value: "RS", label: "Ruby Sanctum" },
  { value: "TOGC", label: "Trial of the Grand Crusader" },
];

export interface LootRuleUIItem {
  id: string;
  raidCode: RaidCode | null;
  category: string;
  name: string;
  icon: string;
  idItem: number | null;
  valueMin: number;
  requirement: string[];
}

export interface PuntoUIItem {
  id: string;
  categoria: string;
  descripcion: string;
  valor: number;
  icon: string;
  sortOrder: number;
}
