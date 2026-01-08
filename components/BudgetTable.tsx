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
    <div className="flex-1 overflow-x-auto bg-white rounded-b-xl border-t border-slate-100">
      <table className="w-full text-left border-collapse table-fixed min-w-[980px]">
        <thead className="sticky top-0 bg-white shadow-[0_1px_0_0_rgba(0,0,0,0.05)] z-20">
          <tr className="text-[10px] uppercase tracking-wider text-slate-400 font-black">
            <th className="w-20 px-3 py-3">Codice</th>
            <th className="px-3 py-3">Descrizione Voce</th>
            <th className="w-16 px-1 py-3 text-center">Q.tà</th>
            <th className="w-12 px-1 py-3 text-center">X</th>
            <th className="w-24 px-1 py-3 text-left">Tariffa</th>
            <th className="w-16 px-1 py-3">Unità</th>
            <th className="w-40 px-3 py-3">Oneri</th>
            <th className="w-32 px-3 py-3 text-right">Totale</th>
            <th className="w-10 px-1"></th>
          </tr>
        </thead>
        <tbody className="text-sm">
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
                <tr 
                  className="bg-slate-50/80 hover:bg-slate-100/80 cursor-pointer border-b border-slate-100 group transition-colors" 
                  onClick={() => toggleCategory(cat.id)}
                >
                  <td className="px-3 py-3 font-black text-indigo-600 text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-3 h-3 flex items-center justify-center rounded bg-indigo-600 text-white transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                        <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 20 20"><path d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" /></svg>
                      </div>
                      <span className="tracking-tighter">{cat.code}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 font-black text-indigo-600 flex items-center gap-3 uppercase tracking-tighter">
                    <span>{cat.name}</span>
                    <div className="flex gap-1">
                      <button onClick={(e) => { e.stopPropagation(); onAddAccount(cat.id); }} className="w-6 h-6 flex items-center justify-center bg-white shadow-sm border border-slate-200 rounded hover:bg-indigo-600 hover:text-white text-slate-400 transition-all active:scale-90"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg></button>
                      <button onClick={(e) => { e.stopPropagation(); setVisibleNoteCatId(isNoteVisible ? null : cat.id); }} className={`w-6 h-6 flex items-center justify-center shadow-sm border rounded transition-all active:scale-90 ${cat.notes ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-200 text-slate-400 hover:bg-indigo-600 hover:text-white'}`}><span className="text-[9px]">📝</span></button>
                      <button onClick={(e) => { e.stopPropagation(); onDeleteCategory(cat.id); }} className="w-6 h-6 flex items-center justify-center bg-white shadow-sm border border-slate-200 rounded hover:bg-red-600 hover:text-white text-slate-400 transition-all active:scale-90"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                    </div>
                  </td>
                  <td colSpan={5}></td>
                  <td className="px-3 py-3 font-black text-right text-slate-900 mono-font text-sm">
                    {cat.total.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
                  </td>
                  <td></td>
                </tr>

                {isNoteVisible && (
                  <tr className="bg-indigo-50/20 border-b border-indigo-100">
                    <td className="px-4 py-2" colSpan={9}>
                      <textarea className="w-full bg-white border border-indigo-100 rounded-lg p-2 text-xs italic text-slate-600 focus:ring-1 focus:ring-indigo-400 outline-none transition-all shadow-inner" placeholder="Note categoria..." value={cat.notes || ''} onChange={(e) => onUpdateCategoryNotes(cat.id, e.target.value)} onClick={(e) => e.stopPropagation()} />
                    </td>
                  </tr>
                )}

                {isExpanded && cat.accounts.map(acc => {
                  const line = acc.lines[0] || { id: 'empty', description: acc.name, amount: '1', multiplierX: '1', rate: '0', unit: 'UNIT', fringeIds: [], total: 0 };
                  const isInactive = line.amount === '0';
                  const isAccNoteVisible = visibleNoteAccId === acc.id;
                  
                  return (
                    <React.Fragment key={acc.id}>
                      <tr className={`border-b border-slate-50 hover:bg-indigo-50/10 group transition-colors ${isInactive ? 'opacity-40 grayscale-[0.3]' : ''}`}>
                        <td className="px-6 py-2 font-bold text-slate-300 text-[10px] mono-font">{acc.code}</td>
                        <td className="px-3 py-2 flex items-center gap-1.5">
                          <input type="text" value={acc.name} onChange={(e) => onUpdateAccountName(cat.id, acc.id, e.target.value)} className={`flex-1 bg-transparent border-none font-semibold focus:ring-0 rounded px-0 text-xs transition-all ${isInactive ? 'text-slate-400' : 'text-slate-600'}`} />
                          <button onClick={(e) => { e.stopPropagation(); setVisibleNoteAccId(isAccNoteVisible ? null : acc.id); }} className={`p-1 rounded transition-all shrink-0 ${acc.notes ? 'text-indigo-600' : 'text-slate-200 group-hover:text-slate-400 hover:text-indigo-600'}`}><span className="text-[9px]">📝</span></button>
                        </td>
                        
                        <td className="px-1 py-2 text-center">
                          <input type="text" value={line.amount} onChange={(e) => onUpdateLine(cat.id, acc.id, line.id, 'amount', e.target.value)} className="w-full text-center bg-transparent border border-transparent hover:border-slate-100 focus:bg-white focus:border-indigo-300 rounded py-0.5 mono-font text-xs outline-none" />
                        </td>
                        
                        <td className="px-1 py-2 text-center">
                          <input type="text" value={line.multiplierX} onChange={(e) => onUpdateLine(cat.id, acc.id, line.id, 'multiplierX', e.target.value)} className="w-full text-center bg-transparent border border-transparent hover:border-slate-100 focus:bg-white focus:border-indigo-300 rounded py-0.5 mono-font text-xs outline-none" />
                        </td>
                        
                        <td className="px-1 py-2">
                          <input type="text" value={line.rate} onChange={(e) => onUpdateLine(cat.id, acc.id, line.id, 'rate', e.target.value)} className="w-full text-left px-1.5 bg-indigo-50/30 border border-indigo-100/30 rounded py-0.5 mono-font text-xs font-bold text-indigo-700 focus:bg-white focus:border-indigo-300 outline-none" />
                        </td>
                        
                        <td className="px-1 py-2">
                          <input type="text" value={line.unit} onChange={(e) => onUpdateLine(cat.id, acc.id, line.id, 'unit', e.target.value)} className="w-full bg-transparent border-none text-[9px] text-slate-400 font-black uppercase px-1 focus:ring-0 outline-none" />
                        </td>

                        <td className="px-3 py-2 relative">
                          <div className="flex flex-wrap gap-1 items-center">
                            {line.fringeIds.map(fid => {
                              const f = fringes.find(f => f.id === fid);
                              return f ? (
                                <button key={fid} onClick={() => toggleLineFringe(cat.id, acc.id, line, fid)} className="inline-flex items-center px-1.5 py-0 rounded text-[8px] font-black bg-indigo-50 text-indigo-600 border border-indigo-100 uppercase hover:bg-red-500 hover:text-white transition-all shadow-none">{f.name.substring(0, 3)}</button>
                              ) : null;
                            })}
                            <button onClick={() => setOpenFringePicker(openFringePicker === line.id ? null : line.id)} className="w-4 h-4 flex items-center justify-center rounded bg-slate-100 text-slate-500 hover:bg-indigo-600 hover:text-white transition-all"><span className="text-[10px] font-black">+</span></button>
                          </div>
                          
                          {openFringePicker === line.id && (
                            <div className="absolute top-full left-0 z-50 mt-1 w-56 bg-white rounded-xl shadow-xl border border-slate-100 p-2 animate-in fade-in slide-in-from-top-1">
                              <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-50">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Oneri</p>
                                <button onClick={() => { const id = onAddFringe(); if (id) toggleLineFringe(cat.id, acc.id, line, id); }} className="text-[9px] text-indigo-600 font-black uppercase hover:underline">Nuovo +</button>
                              </div>
                              <div className="space-y-0.5 max-h-48 overflow-y-auto pr-1 scrollbar-hide">
                                {fringes.map(f => (
                                  <label key={f.id} className="flex items-center gap-2 p-1.5 hover:bg-indigo-50 rounded-lg cursor-pointer transition-colors">
                                    <input type="checkbox" checked={line.fringeIds.includes(f.id)} onChange={() => toggleLineFringe(cat.id, acc.id, line, f.id)} className="rounded border-slate-300 text-indigo-600 w-3.5 h-3.5" />
                                    <div className="flex flex-col">
                                      <span className="text-[10px] font-bold text-slate-700">{f.name}</span>
                                      <span className="text-[9px] text-slate-400">{(f.rate * 100).toFixed(1)}%</span>
                                    </div>
                                  </label>
                                ))}
                              </div>
                            </div>
                          )}
                        </td>

                        <td className="px-3 py-2 text-right font-bold text-slate-900 mono-font text-xs">
                          {acc.total.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
                        </td>

                        <td className="px-1 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => onDeleteAccount(cat.id, acc.id)} className="p-1 text-slate-300 hover:text-red-500 rounded transition-all"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                        </td>
                      </tr>

                      {isAccNoteVisible && (
                        <tr className="bg-indigo-50/5 border-b border-slate-50">
                          <td className="px-6 py-1.5" colSpan={9}>
                            <textarea className="w-full bg-white border border-slate-100 rounded-lg p-2 text-[11px] text-slate-500 focus:ring-1 focus:ring-indigo-300 outline-none shadow-sm" placeholder="Note sottocartella..." value={acc.notes || ''} onChange={(e) => onUpdateAccountNotes(cat.id, acc.id, e.target.value)} onClick={(e) => e.stopPropagation()} />
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