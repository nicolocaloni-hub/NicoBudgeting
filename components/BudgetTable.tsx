
import React, { useState, useMemo } from 'react';
import { Category, BudgetLine, GlobalVar, Fringe } from '../types';

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
  const [visibleNoteCatId, setVisibleNoteCatId] = useState<string | null>(null);
  const [visibleNoteAccId, setVisibleNoteAccId] = useState<string | null>(null);

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

  return (
    <div className="flex-1 overflow-x-auto bg-white rounded-b-xl border-t border-slate-100 min-h-[500px]">
      <table className="w-full text-left border-collapse table-fixed min-w-[1024px]">
        <thead className="sticky top-0 bg-white/95 backdrop-blur-sm shadow-[0_1px_0_0_rgba(0,0,0,0.05)] z-20 border-b border-slate-100">
          <tr className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
            <th className="w-16 px-4 py-3 text-left">Code</th>
            <th className="px-4 py-3 text-left">Descrizione Voce</th>
            <th className="w-20 px-2 py-3 text-right">Q.ta</th>
            <th className="w-12 px-1 py-3 text-center">X</th>
            <th className="w-28 px-2 py-3 text-right">Tariffa</th>
            <th className="w-16 px-2 py-3 text-left pl-4">Unità</th>
            <th className="w-32 px-2 py-3 text-left">Oneri</th>
            <th className="w-32 px-4 py-3 text-right">Totale</th>
            <th className="w-12 px-1"></th>
          </tr>
        </thead>
        <tbody className="text-sm divide-y divide-slate-50">
          {filteredData.length === 0 && (
            <tr>
              <td colSpan={9} className="px-4 py-16 text-center text-slate-400 italic bg-slate-50/30">
                Nessun risultato per "{searchTerm}"
              </td>
            </tr>
          )}
          {filteredData.map(cat => {
            const isExpanded = expandedCategories.has(cat.id);
            const isNoteVisible = visibleNoteCatId === cat.id;
            return (
              <React.Fragment key={cat.id}>
                {/* CATEGORY ROW */}
                <tr 
                  className="bg-slate-50/50 hover:bg-indigo-50/30 cursor-pointer group transition-colors border-t border-slate-100" 
                  onClick={() => toggleCategory(cat.id)}
                >
                  <td className="px-4 py-3 font-mono text-xs font-bold text-slate-400 group-hover:text-indigo-500 transition-colors">
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 flex items-center justify-center transition-transform duration-200 ${isExpanded ? 'rotate-90 text-indigo-600' : 'text-slate-300'}`}>
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" /></svg>
                      </div>
                      {cat.code}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-800 text-xs uppercase tracking-wide group-hover:text-indigo-700 transition-colors">{cat.name}</span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); onAddAccount(cat.id); }} className="p-1 hover:bg-white rounded text-slate-400 hover:text-indigo-600 shadow-sm border border-transparent hover:border-slate-200" title="Aggiungi Riga"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg></button>
                        <button onClick={(e) => { e.stopPropagation(); setVisibleNoteCatId(isNoteVisible ? null : cat.id); }} className={`p-1 hover:bg-white rounded shadow-sm border border-transparent hover:border-slate-200 ${cat.notes ? 'text-indigo-500' : 'text-slate-400 hover:text-indigo-600'}`} title="Note"><span className="text-[10px] leading-none">📝</span></button>
                        <button onClick={(e) => { e.stopPropagation(); onDeleteCategory(cat.id); }} className="p-1 hover:bg-white rounded text-slate-400 hover:text-red-600 shadow-sm border border-transparent hover:border-slate-200" title="Elimina"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                      </div>
                    </div>
                  </td>
                  <td colSpan={5}></td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                    {cat.total.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
                  </td>
                  <td></td>
                </tr>

                {/* CATEGORY NOTES */}
                {isNoteVisible && (
                  <tr className="bg-indigo-50/10 border-b border-indigo-100/50">
                    <td className="px-10 py-2" colSpan={9}>
                      <textarea className="w-full bg-white border border-indigo-100 rounded-lg p-3 text-xs italic text-slate-600 focus:ring-1 focus:ring-indigo-400 outline-none transition-all shadow-inner" placeholder="Note categoria..." value={cat.notes || ''} onChange={(e) => onUpdateCategoryNotes(cat.id, e.target.value)} onClick={(e) => e.stopPropagation()} rows={2} />
                    </td>
                  </tr>
                )}

                {/* ACCOUNTS / LINES */}
                {isExpanded && cat.accounts.map(acc => {
                  const line = acc.lines[0] || { id: 'empty', description: acc.name, amount: '1', multiplierX: '1', rate: '0', unit: 'UNIT', fringeIds: [], total: 0 };
                  const isInactive = line.amount === '0';
                  const isAccNoteVisible = visibleNoteAccId === acc.id;
                  
                  return (
                    <React.Fragment key={acc.id}>
                      <tr className={`group transition-all hover:bg-white ${isInactive ? 'opacity-50 grayscale' : ''}`}>
                        {/* Code */}
                        <td className="px-4 py-2 font-mono text-[11px] text-slate-400 group-hover:text-slate-500 pl-8 border-l-2 border-transparent group-hover:border-indigo-500 transition-colors">
                          {acc.code}
                        </td>

                        {/* Description */}
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            <input 
                              type="text" 
                              value={acc.name} 
                              onChange={(e) => onUpdateAccountName(cat.id, acc.id, e.target.value)} 
                              className={`w-full bg-transparent border border-transparent rounded px-1.5 py-1 text-sm font-medium focus:bg-white focus:border-indigo-200 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all ${isInactive ? 'text-slate-400 line-through' : 'text-slate-700'}`}
                            />
                            <button 
                              onClick={(e) => { e.stopPropagation(); setVisibleNoteAccId(isAccNoteVisible ? null : acc.id); }} 
                              className={`opacity-0 group-hover:opacity-100 p-1 rounded transition-all shrink-0 ${acc.notes ? 'opacity-100 text-indigo-500' : 'text-slate-300 hover:text-indigo-500'}`}
                            >
                              <span className="text-[10px]">📝</span>
                            </button>
                          </div>
                        </td>
                        
                        {/* Quantity */}
                        <td className="px-2 py-2">
                          <input 
                            type="text" 
                            value={line.amount} 
                            onChange={(e) => onUpdateLine(cat.id, acc.id, line.id, 'amount', e.target.value)} 
                            className="w-full text-right bg-transparent border border-transparent hover:border-slate-200 rounded px-1.5 py-1 font-mono text-xs tabular-nums text-slate-700 focus:bg-white focus:border-indigo-300 focus:ring-0 outline-none" 
                          />
                        </td>
                        
                        {/* X Multiplier */}
                        <td className="px-1 py-2 text-center">
                          <input 
                            type="text" 
                            value={line.multiplierX} 
                            onChange={(e) => onUpdateLine(cat.id, acc.id, line.id, 'multiplierX', e.target.value)} 
                            className="w-full text-center bg-transparent border border-transparent hover:border-slate-200 rounded py-1 font-mono text-xs tabular-nums text-slate-500 focus:bg-white focus:border-indigo-300 focus:ring-0 outline-none" 
                          />
                        </td>
                        
                        {/* Rate */}
                        <td className="px-2 py-2">
                          <div className="relative">
                            <input 
                              type="text" 
                              value={line.rate} 
                              onChange={(e) => onUpdateLine(cat.id, acc.id, line.id, 'rate', e.target.value)} 
                              className="w-full text-right bg-transparent border border-transparent hover:bg-slate-50 hover:border-slate-200 rounded px-2 py-1 font-mono text-xs font-bold tabular-nums text-indigo-600 focus:bg-white focus:border-indigo-300 focus:ring-0 outline-none" 
                            />
                          </div>
                        </td>
                        
                        {/* Unit */}
                        <td className="px-2 py-2 pl-4">
                          <input 
                            type="text" 
                            value={line.unit} 
                            onChange={(e) => onUpdateLine(cat.id, acc.id, line.id, 'unit', e.target.value)} 
                            className="w-full bg-transparent border-none text-[10px] text-slate-400 font-bold uppercase tracking-wider px-1 focus:ring-0 outline-none hover:text-indigo-400" 
                          />
                        </td>

                        {/* Fringes (Oneri) */}
                        <td className="px-2 py-2 relative">
                          <div className="flex flex-wrap gap-1.5 items-center">
                            {line.fringeIds.map(fid => {
                              const f = fringes.find(f => f.id === fid);
                              return f ? (
                                <button 
                                  key={fid} 
                                  onClick={() => toggleLineFringe(cat.id, acc.id, line, fid)} 
                                  className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all cursor-pointer whitespace-nowrap"
                                  title={`Rimuovi ${f.name}`}
                                >
                                  {f.name.substring(0, 3).toUpperCase()}
                                </button>
                              ) : null;
                            })}
                            <button 
                              onClick={() => setOpenFringePicker(openFringePicker === line.id ? null : line.id)} 
                              className="w-5 h-5 flex items-center justify-center rounded-full border border-slate-200 text-slate-400 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                              title="Aggiungi Onere"
                            >
                              <span className="text-[12px] font-bold leading-none mb-0.5">+</span>
                            </button>
                          </div>
                          
                          {/* Dropdown Fringes */}
                          {openFringePicker === line.id && (
                            <div className="absolute top-full left-0 z-50 mt-2 w-56 bg-white rounded-xl shadow-[0_10px_30px_-10px_rgba(0,0,0,0.15)] border border-slate-100 p-2 animate-in fade-in slide-in-from-top-2">
                              <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-50 px-1">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Seleziona Oneri</p>
                                <button onClick={() => { const id = onAddFringe(); if (id) toggleLineFringe(cat.id, acc.id, line, id); }} className="text-[9px] text-indigo-600 font-black uppercase hover:underline">Nuovo +</button>
                              </div>
                              <div className="space-y-0.5 max-h-48 overflow-y-auto pr-1 scrollbar-hide">
                                {fringes.map(f => (
                                  <label key={f.id} className="flex items-center gap-2 p-2 hover:bg-indigo-50 rounded-lg cursor-pointer transition-colors group/fringe">
                                    <input type="checkbox" checked={line.fringeIds.includes(f.id)} onChange={() => toggleLineFringe(cat.id, acc.id, line, f.id)} className="rounded border-slate-300 text-indigo-600 w-3.5 h-3.5 focus:ring-offset-0 focus:ring-0" />
                                    <div className="flex flex-col">
                                      <span className="text-[11px] font-bold text-slate-700 group-hover/fringe:text-indigo-700">{f.name}</span>
                                      <span className="text-[9px] text-slate-400 font-mono">{(f.rate * 100).toFixed(1)}%</span>
                                    </div>
                                  </label>
                                ))}
                              </div>
                            </div>
                          )}
                        </td>

                        {/* Total */}
                        <td className="px-4 py-2 text-right font-mono text-xs font-bold text-slate-800 tabular-nums">
                          {acc.total.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
                        </td>

                        {/* Actions */}
                        <td className="px-1 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => onDeleteAccount(cat.id, acc.id)} className="p-1.5 text-slate-300 hover:text-red-500 rounded transition-all" title="Elimina Riga"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                        </td>
                      </tr>

                      {/* ACCOUNT NOTES */}
                      {isAccNoteVisible && (
                        <tr className="bg-white border-b border-slate-50">
                          <td className="px-4 py-0" colSpan={1}></td>
                          <td className="px-4 py-2" colSpan={8}>
                            <div className="flex items-start gap-2">
                              <span className="text-indigo-400 text-xs mt-2">↳</span>
                              <textarea className="w-full bg-slate-50 border border-slate-100 rounded-lg p-2 text-[11px] text-slate-500 focus:ring-1 focus:ring-indigo-300 outline-none shadow-sm transition-all" placeholder="Note riga..." value={acc.notes || ''} onChange={(e) => onUpdateAccountNotes(cat.id, acc.id, e.target.value)} onClick={(e) => e.stopPropagation()} rows={1} />
                            </div>
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
