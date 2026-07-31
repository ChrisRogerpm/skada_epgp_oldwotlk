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
