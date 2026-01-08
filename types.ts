
export interface GlobalVar {
  id: string;
  name: string;
  value: number;
  description: string;
}

export interface Fringe {
  id: string;
  name: string;
  rate: number;
  isAppliedByDefault: boolean;
}

export interface BudgetLine {
  id: string;
  description: string;
  amount: string;
  multiplierX: string;
  multiplier4x: string;
  rate: string;
  unit: string;
  fringeIds: string[];
  total: number;
}

export interface Account {
  id: string;
  code: string;
  name: string;
  lines: BudgetLine[];
  total: number;
  notes?: string;
}

export interface Category {
  id: string;
  code: string;
  name: string;
  accounts: Account[];
  total: number;
  notes?: string;
}

export interface ArchiveEntry {
  id: string;
  title: string;
  date: string;
  total: number;
  categories: Category[];
  fringes: Fringe[];
}
