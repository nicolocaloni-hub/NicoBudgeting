
import { GlobalVar, Fringe, BudgetLine, Account, Category } from '../types';

/**
 * Converte input testuale in valore numerico.
 * Supporta variabili globali, virgole europee e pulizia stringhe.
 */
export const parseValue = (val: string | number, globals: GlobalVar[]): number => {
  if (typeof val === 'number') return val;
  if (!val || typeof val !== 'string') return 0;
  
  const trimmed = val.trim();
  if (!trimmed) return 0;

  // Risoluzione variabili globali (es. SETTIMANE_RIPRESE)
  const global = globals.find(g => g.name.toUpperCase() === trimmed.toUpperCase());
  if (global) return global.value;

  // Gestione separatore decimale e sanificazione
  const sanitized = trimmed.replace(',', '.').replace(/[^-0-9.]/g, '');
  const num = parseFloat(sanitized);
  
  return isNaN(num) ? 0 : num;
};

/**
 * Utility specifica per il parsing di importi monetari senza supporto a variabili globali.
 */
export const parseCurrency = (val: string | null): number | null => {
  if (val === null || val === undefined || val.trim() === '') return null;
  const sanitized = val.replace(',', '.').replace(/[^-0-9.]/g, '');
  const num = parseFloat(sanitized);
  return isNaN(num) ? null : num;
};

/**
 * Calcola il totale di una riga includendo oneri sociali.
 */
export const calculateLineTotal = (
  line: BudgetLine,
  globals: GlobalVar[],
  fringes: Fringe[]
): number => {
  // DOMINIO: Se quantity (amount) è vuota o invalida, trattala come 1. Se è "0", trattala come 0.
  const rawAmt = line.amount.trim();
  const amt = (rawAmt === '') ? 1 : parseValue(line.amount, globals);
  
  const x = parseValue(line.multiplierX, globals) || 1;
  const x4 = parseValue(line.multiplier4x, globals) || 1;
  const rate = parseValue(line.rate, globals);
  
  const subtotal = amt * x * x4 * rate;
  
  // Calcolo Oneri Sociali
  const fringeTotal = (line.fringeIds || []).reduce((acc, fid) => {
    const fringe = fringes.find(f => f.id === fid);
    return acc + (fringe ? subtotal * fringe.rate : 0);
  }, 0);
  
  return subtotal + fringeTotal;
};

/**
 * Ricalcola l'intera gerarchia del budget in modo immutabile.
 */
export const recalculateBudget = (
  categories: Category[],
  globals: GlobalVar[],
  fringes: Fringe[]
): Category[] => {
  return categories.map(cat => {
    const updatedAccounts = cat.accounts.map(acc => {
      const updatedLines = acc.lines.map(line => ({
        ...line,
        total: calculateLineTotal(line, globals, fringes)
      }));
      
      const accTotal = updatedLines.reduce((sum, l) => sum + l.total, 0);
      return { 
        ...acc, 
        lines: updatedLines, 
        total: Math.round(accTotal * 100) / 100 
      };
    });
    
    const catTotal = updatedAccounts.reduce((sum, a) => sum + a.total, 0);
    return { 
      ...cat, 
      accounts: updatedAccounts, 
      total: Math.round(catTotal * 100) / 100 
    };
  });
};
