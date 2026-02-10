
import React, { useState, useMemo } from 'react';
import { Category, BudgetLine, GlobalVar, Fringe, UnitType } from '../types';

interface BudgetTableProps {
  categories: Category[];
  globals: GlobalVar[];
  fringes: Fringe[];
  searchTerm: string;
  onUpdateLine: (catId: string, accId: string, lineId: string, field: keyof BudgetLine, value: any) => void;
  onUpdateAccountName: (catId: string, accId: string, name: string) => void;
  onAddLine: (catId: string, accId: string) => void;
  onDeleteLine: (catId: string, accId: string, lineId: string) => void;
  onAddFringe: (defaultName?: string) => string | null;
  onAddAccount: (catId: string) => void;
  onDeleteAccount: (catId: string, accId: string) => void;
  onDeleteCategory: (catId: string) => void;
  onUpdateCategoryNotes: (catId: string, notes: string) => void;
  onUpdateAccountNotes: (catId: string, accId: string, notes: string) => void;
}

const BudgetTable: React.FC<BudgetTableProps> = ({ 
  categories, globals, fringes, searchTerm, onUpdateLine, onUpdateAccountName, 
  onAddFringe, onAddAccount, onDeleteAccount, onDeleteCategory, 
  onUpdateCategoryNotes, onUpdateAccountNotes
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [openFringePicker, setOpenFringePicker] = useState<string | null>(null);
  const [openUnitPicker, setOpenUnitPicker] = useState<string | null>(null);
  const [visibleNoteCatId, setVisibleNoteCatId] = useState<string | null>(null);
  const [visibleNoteAccId, setVisibleNoteAccId] = useState<string | null>(null);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('it-IT', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    }).format(val) + '€';
  };

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return categories;
    const term = searchTerm.toLowerCase().trim();
    return categories.map(cat => {
      const catMatches = cat.name.toLowerCase().includes(term) || cat.code.includes(term);
      const matchingAccounts = cat.accounts.filter(acc => 
        acc.name.toLowerCase().includes(term) || 
        acc.code.includes(term) ||
        acc.lines.some(l => l.description.toLowerCase().includes(term))
      );
      if (catMatches || matchingAccounts.length > 0) {
        return { ...cat, accounts: catMatches ? cat.accounts : matchingAccounts };
      }
      return null;
    }).filter(Boolean) as Category[];
  }, [categories, searchTerm]);

  const toggleCategory = (id: string) => {
    const next = new Set(expandedCategories);
    if (next.has(id)) next.delete(id); else next.add(id);
    setExpandedCategories(next);
  };

  const toggleLineFringe = (catId: string, accId: string, line: BudgetLine, fringeId: string) => {
    const nextFringeIds = line.fringeIds.includes(fringeId)
      ? line.fringeIds.filter(id => id !== fringeId)
      : [...line.fringeIds, fringeId];
    onUpdateLine(catId, accId, line.id, 'fringeIds', nextFringeIds);
  };

  const handleUnitSelect = (catId: string, accId: string, lineId: string, unit: UnitType) => {
    onUpdateLine(catId, accId, lineId, 'unit', unit);
    // Opzionale: se FLAT, imposta quantità a 1 per pulizia visiva, ma lascia editabile
    if (unit === 'FLAT') {
        // onUpdateLine(catId, accId, lineId, 'amount', '1'); // Commentato per lasciare libertà
    }
    setOpenUnitPicker(null);
  };

  return (
    <div className="flex-1 overflow-x-auto bg-white rounded-b-xl border-t border-slate-100 min-h-[500px] scrollbar-hide">
      <table className="w-full text-left border-collapse table-fixed min-w-[700px] md:min-w-[1024px]">
        <colgroup>
          <col className="w-[52px]" /> 
          <col className="w-auto" />   
          <col className="w-[42px]" /> 
          <col className="w-[22px]" /> 
          <col className="w-[82px]" /> 
          <col className="w-[52px]" /> 
          <col className="w-[68px]" /> 
          <col className="w-[94px]" /> 
          <col className="w-[32px]" /> 
        </colgroup>

        <thead className="sticky top-0 bg-white/95 backdrop-blur-sm z-20 border-b border-slate-100 shadow-sm">
          <tr className="text-[9px] uppercase tracking-tighter text-slate-400 font-black">
            <th className="px-1.5 py-2.5 text-left">Cod.</th>
            <th className="px-1.5 py-2.5 text-left">Voce di spesa</th>
            <th className="px-1 py-2.5 text-right">Q.tà</th>
            <th className="px-0 py-2.5 text-center">X</th>
            <th className="px-1.5 py-2.5 text-right">Tariffa</th>
            <th className="px-1.5 py-2.5 text-left">Unit.</th>
            <th className="px-1.5 py-2.5 text-left">Oneri</th>
            <th className="px-1.5 py-2.5 text-right sticky right-0 bg-white/95">Totale</th>
            <th className="px-0"></th>
          </tr>
        </thead>

        <tbody className="text-[11px] divide-y divide-slate-50">
          {filteredData.map(cat => {
            const isExpanded = expandedCategories.has(cat.id);
            return (
              <React.Fragment key={cat.id}>
                <tr className="bg-slate-50/60 hover:bg-indigo-50/40 cursor-pointer group transition-all border-t border-slate-100 h-9" onClick={() => toggleCategory(cat.id)}>
                  <td className="px-1.5 font-mono text-[10px] font-bold text-slate-400 group-hover:text-indigo-500">
                    <div className="flex items-center gap-1">
                      <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-90 text-indigo-600' : 'text-slate-300'}`}>
                        <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" /></svg>
                      </div>
                      {cat.code}
                    </div>
                  </td>
                  <td className="px-1.5 truncate min-w-0">
                    <span className="font-black text-slate-800 uppercase tracking-tight truncate">{cat.name}</span>
                  </td>
                  <td colSpan={5}></td>
                  <td className="px-1.5 text-right font-mono font-black text-slate-900 tabular-nums sticky right-0 bg-slate-50/60 group-hover:bg-indigo-50/40">
                    {formatCurrency(cat.total)}
                  </td>
                  <td></td>
                </tr>

                {isExpanded && cat.accounts.map(acc => {
                  const line = acc.lines[0] || { id: 'empty', unit: 'D', amount: '1', multiplierX: '1', rate: '0', fringeIds: [], total: 0 };
                  const isAccNoteVisible = visibleNoteAccId === acc.id;
                  
                  return (
                    <React.Fragment key={acc.id}>
                      <tr className="group transition-all hover:bg-slate-50/30 h-8">
                        <td className="px-1.5 font-mono text-[10px] text-slate-300 pl-4">{acc.code}</td>
                        <td className="px-1.5 min-w-0">
                          <input type="text" value={acc.name} onChange={(e) => onUpdateAccountName(cat.id, acc.id, e.target.value)} className="w-full bg-transparent border-none p-0 text-[11px] font-medium text-slate-700 focus:ring-0 outline-none truncate hover:bg-slate-100 rounded px-1 transition-colors" />
                        </td>
                        <td className="px-1">
                          <input type="text" value={line.amount} onChange={(e) => onUpdateLine(cat.id, acc.id, line.id, 'amount', e.target.value)} className="w-full text-right bg-transparent border-none p-0 font-mono text-[10px] tabular-nums text-slate-600 focus:ring-0 outline-none" />
                        </td>
                        <td className="px-0">
                          <input type="text" value={line.multiplierX} onChange={(e) => onUpdateLine(cat.id, acc.id, line.id, 'multiplierX', e.target.value)} className="w-full text-center bg-transparent border-none p-0 font-mono text-[9px] text-slate-400 focus:ring-0 outline-none" />
                        </td>
                        <td className="px-1.5">
                          <input type="text" value={line.rate} onChange={(e) => onUpdateLine(cat.id, acc.id, line.id, 'rate', e.target.value)} className="w-full text-right bg-transparent border-none p-0 font-mono text-[10px] font-bold tabular-nums text-indigo-500 focus:ring-0 outline-none" />
                        </td>
                        
                        {/* UNIT SELECTOR */}
                        <td className="px-1.5 relative">
                          <button 
                            aria-label="Seleziona unità"
                            onClick={() => setOpenUnitPicker(openUnitPicker === line.id ? null : line.id)}
                            className={`flex items-center justify-center h-5 w-full rounded border transition-all text-[9px] font-black uppercase tracking-tight ${line.unit ? 'bg-slate-50 text-indigo-600 border-indigo-100' : 'bg-transparent text-slate-300 border-transparent hover:bg-slate-100 hover:text-indigo-400'}`}
                          >
                            {line.unit || (
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                                </svg>
                            )}
                          </button>
                          
                          {openUnitPicker === line.id && (
                            <div className="absolute top-full left-0 z-50 mt-1 w-20 bg-white rounded-lg shadow-xl border border-slate-100 p-1 animate-in fade-in zoom-in-95">
                              {(['H', 'D', 'W', 'FLAT'] as UnitType[]).map(u => (
                                <button 
                                  key={u}
                                  disabled={u === 'H'} // H disabilitato come da specifiche
                                  onClick={() => handleUnitSelect(cat.id, acc.id, line.id, u)}
                                  className={`w-full text-left px-2 py-1.5 rounded text-[9px] font-black uppercase tracking-widest transition-colors ${u === 'H' ? 'opacity-30 cursor-not-allowed bg-slate-50' : 'hover:bg-indigo-50 hover:text-indigo-600 text-slate-600'}`}
                                >
                                  {u}
                                </button>
                              ))}
                            </div>
                          )}
                        </td>

                        <td className="px-1.5 relative">
                          <div className="flex flex-wrap gap-0.5 items-center">
                            {line.fringeIds.length > 0 ? (
                              <button onClick={() => setOpenFringePicker(openFringePicker === line.id ? null : line.id)} className="px-1 py-0.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded text-[8px] font-black hover:bg-indigo-100">{line.fringeIds.length} ON.</button>
                            ) : (
                              <button onClick={() => setOpenFringePicker(openFringePicker === line.id ? null : line.id)} className="w-4 h-4 flex items-center justify-center text-slate-300 hover:text-indigo-500 opacity-0 group-hover:opacity-100"><span className="text-[10px]">+</span></button>
                            )}
                          </div>
                          {openFringePicker === line.id && (
                            <div className="absolute top-full left-0 z-50 mt-1 w-40 bg-white rounded-lg shadow-xl border border-slate-100 p-1.5 animate-in fade-in zoom-in-95">
                              <p className="text-[8px] font-black text-slate-400 uppercase mb-1.5 px-1">Oneri Sociali</p>
                              <div className="space-y-0.5 max-h-40 overflow-y-auto scrollbar-hide">
                                {fringes.map(f => (
                                  <label key={f.id} className="flex items-center gap-1.5 p-1 hover:bg-slate-50 rounded cursor-pointer transition-colors">
                                    <input type="checkbox" checked={line.fringeIds.includes(f.id)} onChange={() => toggleLineFringe(cat.id, acc.id, line, f.id)} className="w-3 h-3 rounded border-slate-300 text-indigo-600 focus:ring-0" />
                                    <span className="text-[9px] font-bold text-slate-600 truncate">{f.name}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="px-1.5 text-right font-mono text-[10px] font-bold text-slate-800 tabular-nums sticky right-0 bg-white group-hover:bg-slate-50/30">
                          {formatCurrency(acc.total)}
                        </td>
                        <td className="px-0">
                          <div className="flex flex-col items-center opacity-0 group-hover:opacity-100">
                             <button onClick={() => setVisibleNoteAccId(isAccNoteVisible ? null : acc.id)} className={`p-0.5 transition-colors ${acc.notes ? 'text-indigo-500' : 'text-slate-200 hover:text-indigo-400'}`}><span className="text-[8px]">📝</span></button>
                             <button onClick={() => onDeleteAccount(cat.id, acc.id)} className="p-0.5 text-slate-200 hover:text-red-500 transition-colors"><svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                          </div>
                        </td>
                      </tr>
                      {isAccNoteVisible && (
                        <tr className="bg-indigo-50/10">
                          <td colSpan={1}></td>
                          <td colSpan={8} className="px-1.5 py-1">
                            <textarea className="w-full bg-white border border-slate-100 rounded p-1.5 text-[10px] text-slate-500 focus:ring-1 focus:ring-indigo-200 outline-none shadow-inner" placeholder="Note riga..." value={acc.notes || ''} onChange={(e) => onUpdateAccountNotes(cat.id, acc.id, e.target.value)} rows={1} />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default BudgetTable;
