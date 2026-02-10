
import { GlobalVar, Fringe, BudgetLine, Account, Category, UnitType } from '../types';

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
 * Calcola il totale di una riga includendo oneri sociali e conversioni di unità.
 */
export const calculateLineTotal = (
  line: BudgetLine,
  globals: GlobalVar[],
  fringes: Fringe[]
): number => {
  const rawAmt = line.amount.trim();
  // Consideriamo 'amount' come GIORNI per default se non diversamente specificato
  const days = (rawAmt === '') ? 1 : parseValue(line.amount, globals);
  const x = parseValue(line.multiplierX, globals) || 1;
  const rate = parseValue(line.rate, globals);
  
  const unit = (line.unit || 'D') as UnitType;
  let timeMultiplier = 0;

  switch (unit) {
    case 'W':
      // 1 Settimana = 7 Giorni
      timeMultiplier = days / 7;
      break;
    case 'FLAT':
      // Forfait: il tempo non influisce sul calcolo base
      timeMultiplier = 1;
      break;
    case 'H':
      // Ore: disabilitato/1:1 (necessiterebbe ore/giorno)
      timeMultiplier = days; 
      break;
    case 'D':
    default:
      // Giorni: 1:1
      timeMultiplier = days;
      break;
  }

  const subtotal = timeMultiplier * x * rate;
  
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
