import React, { useState, useMemo, useEffect } from 'react';
import { Category, Account, BudgetLine, GlobalVar, Fringe } from '../types';

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
  categories, globals, fringes, searchTerm, onUpdateLine, onUpdateAccountName, onAddLine, onDeleteLine, 
  onAddFringe, onAddAccount, onDeleteAccount, onDeleteCategory, onUpdateCategoryNotes, onUpdateAccountNotes
}) => {
  // Stato iniziale: Set vuoto per avere tutte le categorie chiuse al caricamento
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

  // Rimossa l'espansione automatica durante la ricerca per rispettare il requisito di apertura manuale

  const toggleCategory = (id: string) => {
    const next = new Set(expandedCategories);
    if (next.has(id)) next.delete(id); else next.add(id);
    setExpandedCategories(next);
  };

  const handleAddAccountManualOnly = (catId: string) => {
    // Non espande più automaticamente la categoria
    onAddAccount(catId);
  };

  const toggleLineFringe = (catId: string, accId: string, line: BudgetLine, fringeId: string) => {
    const nextFringeIds = line.fringeIds.includes(fringeId)
      ? line.fringeIds.filter(id => id !== fringeId)
      : [...line.fringeIds, fringeId];
    onUpdateLine(catId, accId, line.id, 'fringeIds', nextFringeIds);
  };

  return (
    <div className="flex-1 overflow-x-auto bg-white rounded-b-xl border-t border-slate-100">
      <table className="w-full text-left border-collapse table-fixed min-w-[1150px]">
        <thead className="sticky top-0 bg-white shadow-[0_1px_0_0_rgba(0,0,0,0.05)] z-20">
          <tr className="text-[10px] uppercase tracking-[0.15em] text-slate-400 font-black">
            <th className="w-24 px-4 py-4">Codice</th>
            <th className="px-4 py-4">Figura Professionale / Descrizione</th>
            <th className="w-20 px-2 py-4 text-center">Q.tà</th>
            <th className="w-14 px-1 py-4 text-center">X</th>
            <th className="w-14 px-1 py-4 text-center">4X</th>
            <th className="w-28 px-2 py-4">Tariffa</th>
            <th className="w-18 px-2 py-4">Unità</th>
            <th className="w-44 px-4 py-4">Oneri</th>
            <th className="w-36 px-4 py-4 text-right">Totale</th>
            <th className="w-12 px-2"></th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {filteredData.length === 0 && (
            <tr>
              <td colSpan={10} className="px-4 py-20 text-center text-slate-400 italic bg-slate-50/30">
                Nessun risultato trovato per "{searchTerm}"
              </td>
            </tr>
          )}
          {filteredData.map(cat => {
            const isExpanded = expandedCategories.has(cat.id);
            const isNoteVisible = visibleNoteCatId === cat.id;
            return (
              <React.Fragment key={cat.id}>
                <tr 
                  className="bg-slate-50/80 hover:bg-slate-100/80 cursor-pointer border-b border-slate-100 group/cat transition-colors" 
                  onClick={() => toggleCategory(cat.id)}
                >
                  <td className="px-4 py-4 font-black text-indigo-600 text-xs">
                    <div className="flex items-center gap-2">
                      <div className={`w-3.5 h-3.5 flex items-center justify-center rounded bg-indigo-600 text-white transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
                        <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" />
                        </svg>
                      </div>
                      <span className="tracking-widest">{cat.code}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 font-black text-indigo-600 flex items-center gap-4 uppercase tracking-tight">
                    <span>{cat.name}</span>
                    <div className="flex gap-1">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleAddAccountManualOnly(cat.id); }} 
                        className="w-7 h-7 flex items-center justify-center bg-white shadow-sm border border-slate-200 rounded-md hover:bg-indigo-600 hover:border-indigo-600 hover:text-white text-slate-400 transition-all active:scale-90" 
                        title="Aggiungi Sottocartella"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setVisibleNoteCatId(isNoteVisible ? null : cat.id); }} 
                        className={`w-7 h-7 flex items-center justify-center shadow-sm border rounded-md transition-all active:scale-90 ${cat.notes ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-200 text-slate-400 hover:bg-indigo-600 hover:border-indigo-600 hover:text-white'}`}
                        title="Note Categoria"
                      >
                        <span className="text-[10px]">📝</span>
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onDeleteCategory(cat.id); }} 
                        className="w-7 h-7 flex items-center justify-center bg-white shadow-sm border border-slate-200 rounded-md hover:bg-red-600 hover:border-red-600 hover:text-white text-slate-400 transition-all active:scale-90" 
                        title="Elimina Cartella"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </td>
                  <td colSpan={6}></td>
                  <td className="px-4 py-4 font-black text-right text-slate-900 mono-font text-base">
                    {cat.total.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
                  </td>
                  <td></td>
                </tr>

                {isNoteVisible && (
                  <tr className="bg-indigo-50/30 border-b border-indigo-100">
                    <td className="px-4 py-4" colSpan={10}>
                      <textarea 
                        className="w-full bg-white border border-indigo-200 rounded-xl p-3 text-xs italic text-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-inner"
                        placeholder="Inserisci note per questa categoria..."
                        value={cat.notes || ''}
                        onChange={(e) => onUpdateCategoryNotes(cat.id, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                  </tr>
                )}

                {isExpanded && cat.accounts.map(acc => {
                  const mainLine = acc.lines[0] || { id: 'empty', description: acc.name, amount: '1', multiplierX: '1', multiplier4x: '1', rate: '0', unit: 'UNIT', fringeIds: [], total: 0 };
                  const isInactive = mainLine.amount === '0';
                  const isAccNoteVisible = visibleNoteAccId === acc.id;
                  
                  return (
                    <React.Fragment key={acc.id}>
                      <tr className={`border-b border-slate-50 hover:bg-indigo-50/20 group transition-colors animate-in slide-in-from-left-2 duration-200 ${isInactive ? 'opacity-40 grayscale-[0.5]' : ''}`}>
                        <td className="px-10 py-3 font-bold text-slate-300 text-[11px] mono-font">{acc.code}</td>
                        <td className="px-4 py-3 flex items-center gap-2">
                          <input 
                            type="text" 
                            value={acc.name} 
                            onChange={(e) => onUpdateAccountName(cat.id, acc.id, e.target.value)} 
                            className={`flex-1 bg-transparent border-none font-semibold focus:ring-1 focus:ring-indigo-200 rounded px-1 transition-all ${isInactive ? 'text-slate-400' : 'text-slate-600'}`}
                          />
                          <button 
                            onClick={(e) => { e.stopPropagation(); setVisibleNoteAccId(isAccNoteVisible ? null : acc.id); }}
                            className={`p-1 rounded transition-all active:scale-90 shrink-0 ${acc.notes ? 'text-indigo-600' : 'text-slate-200 group-hover:text-slate-400 hover:text-indigo-600'}`}
                            title="Note Sottocartella"
                          >
                            <span className="text-[10px]">📝</span>
                          </button>
                        </td>
                        
                        <td className="px-1 py-3 text-center">
                          <input 
                            type="text" 
                            value={mainLine.amount} 
                            onChange={(e) => onUpdateLine(cat.id, acc.id, mainLine.id, 'amount', e.target.value)} 
                            className={`w-full text-center bg-transparent border border-transparent hover:border-slate-200 focus:bg-white focus:border-indigo-400 rounded py-1 mono-font text-xs transition-all outline-none ${isInactive ? 'text-red-500 font-black' : ''}`} 
                          />
                        </td>
                        
                        <td className="px-1 py-3 text-center">
                          <input 
                            type="text" 
                            value={mainLine.multiplierX} 
                            onChange={(e) => onUpdateLine(cat.id, acc.id, mainLine.id, 'multiplierX', e.target.value)} 
                            className="w-full text-center bg-transparent border border-transparent hover:border-slate-200 focus:bg-white focus:border-indigo-400 rounded py-1 mono-font text-xs transition-all outline-none" 
                          />
                        </td>
                        
                        <td className="px-1 py-3 text-center">
                          <input 
                            type="text" 
                            value={mainLine.multiplier4x} 
                            onChange={(e) => onUpdateLine(cat.id, acc.id, mainLine.id, 'multiplier4x', e.target.value)} 
                            className="w-full text-center bg-transparent border border-transparent hover:border-slate-200 focus:bg-white focus:border-indigo-400 rounded py-1 mono-font text-xs transition-all outline-none" 
                          />
                        </td>
                        
                        <td className="px-1 py-3">
                          <input 
                            type="text" 
                            value={mainLine.rate} 
                            onChange={(e) => onUpdateLine(cat.id, acc.id, mainLine.id, 'rate', e.target.value)} 
                            className="w-full text-left px-2 bg-indigo-50/50 border border-indigo-100/50 rounded py-1 mono-font text-xs font-bold text-indigo-700 focus:bg-white focus:border-indigo-400 transition-all outline-none" 
                          />
                        </td>
                        
                        <td className="px-1 py-3">
                          <input 
                            type="text" 
                            value={mainLine.unit} 
                            onChange={(e) => onUpdateLine(cat.id, acc.id, mainLine.id, 'unit', e.target.value)} 
                            className="w-full bg-transparent border-none text-[9px] text-slate-400 font-bold uppercase focus:ring-1 focus:ring-indigo-100 rounded px-1 outline-none" 
                          />
                        </td>

                        <td className="px-4 py-3 relative">
                          <div className="flex flex-wrap gap-1 items-center">
                            {mainLine.fringeIds.map(fid => {
                              const f = fringes.find(f => f.id === fid);
                              return f ? (
                                <button 
                                  key={fid} 
                                  onClick={() => toggleLineFringe(cat.id, acc.id, mainLine, fid)}
                                  className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black bg-indigo-100 text-indigo-700 border border-indigo-200 uppercase hover:bg-red-500 hover:text-white hover:border-red-600 transition-all shadow-sm"
                                  title={`Rimuovi ${f.name}`}
                                >
                                  {f.name.substring(0, 3)}
                                </button>
                              ) : null;
                            })}
                            <button 
                              onClick={() => setOpenFringePicker(openFringePicker === mainLine.id ? null : mainLine.id)} 
                              className="w-5 h-5 flex items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                            >
                              <span className="text-xs font-black">+</span>
                            </button>
                          </div>
                          
                          {openFringePicker === mainLine.id && (
                            <div className="absolute top-full left-0 z-50 mt-1 w-60 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 overflow-hidden animate-in fade-in slide-in-from-top-2">
                              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-50">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Oneri Disponibili</p>
                                <button onClick={() => { const id = onAddFringe(); if (id) toggleLineFringe(cat.id, acc.id, mainLine, id); }} className="text-[10px] text-indigo-600 font-black hover:text-indigo-800 uppercase tracking-tighter underline underline-offset-4">Nuovo +</button>
                              </div>
                              <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
                                {fringes.length === 0 && <p className="text-[10px] text-slate-400 italic p-2">Nessun onere creato.</p>}
                                {fringes.map(f => (
                                  <label key={f.id} className="flex items-center gap-3 p-2 hover:bg-indigo-50 rounded-xl cursor-pointer group/label transition-colors">
                                    <input type="checkbox" checked={mainLine.fringeIds.includes(f.id)} onChange={() => toggleLineFringe(cat.id, acc.id, mainLine, f.id)} className="rounded-md border-slate-300 text-indigo-600 w-4 h-4 focus:ring-indigo-500" />
                                    <div className="flex flex-col">
                                      <span className="text-[11px] font-bold text-slate-700 group-hover/label:text-indigo-900">{f.name}</span>
                                      <span className="text-[10px] font-medium text-slate-400 group-hover/label:text-indigo-500">{(f.rate * 100).toFixed(1)}%</span>
                                    </div>
                                  </label>
                                ))}
                              </div>
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-3 text-right font-bold text-slate-900 mono-font text-xs">
                          {acc.total.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
                        </td>

                        <td className="px-2 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => onDeleteAccount(cat.id, acc.id)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </td>
                      </tr>

                      {isAccNoteVisible && (
                        <tr className="bg-indigo-50/10 border-b border-slate-50">
                          <td className="px-10 py-3" colSpan={10}>
                            <textarea 
                              className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-500 focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
                              placeholder="Note per questa sottocartella..."
                              value={acc.notes || ''}
                              onChange={(e) => onUpdateAccountNotes(cat.id, acc.id, e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                            />
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