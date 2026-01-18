export interface CashflowMovement {
  id: string;
  date: string; // ISO string YYYY-MM-DD
  amount: number;
  type: 'in' | 'out';
  category: string;
  note: string;
}

export interface CashflowSettings {
  productionId: string;
  startDate: string;
  endDate: string;
  initialCash: number;
  threshold: number;
}

export interface DailyBalance {
  date: string;
  balance: number;
  inflow: number;
  outflow: number;
  isThresholdBreached: boolean;
}