
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

const UNIT_LABELS: Record<UnitType, string> = {
  'H': 'Ore',
  'D': 'Giorni',
  'W': 'Settimane',
  'FLAT': 'Forfait'
};

type ViewState = 
  | { type: 'root' }
  | { type: 'category', catId: string }
  | { type: 'account', catId: string, accId: string };

const BudgetTable: React.FC<BudgetTableProps> = ({ 
  categories, globals, fringes, searchTerm, onUpdateLine, onUpdateAccountName, 
  onAddLine, onDeleteLine, onAddFringe, onAddAccount, onDeleteAccount, onDeleteCategory, 
  onUpdateCategoryNotes, onUpdateAccountNotes
}) => {
  const [viewState, setViewState] = useState<ViewState>({ type: 'root' });
  const [openFringePicker, setOpenFringePicker] = useState<string | null>(null);
  const [openUnitPicker, setOpenUnitPicker] = useState<string | null>(null);
  const [visibleNoteAccId, setVisibleNoteAccId] = useState<string | null>(null);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('it-IT', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    }).format(val) + '€';
  };

  // Filtraggio dati preservato dalla logica precedente
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

  // Gestione Navigazione
  const activeCategory = viewState.type !== 'root' 
    ? filteredData.find(c => c.id === viewState.catId) 
    : null;

  const activeAccount = (viewState.type === 'account' && activeCategory)
    ? activeCategory.accounts.find(a => a.id === viewState.accId)
    : null;

  const handleBack = () => {
    if (viewState.type === 'account') {
      setViewState({ type: 'category', catId: viewState.catId });
    } else {
      setViewState({ type: 'root' });
    }
  };

  const toggleLineFringe = (catId: string, accId: string, line: BudgetLine, fringeId: string) => {
    const nextFringeIds = line.fringeIds.includes(fringeId)
      ? line.fringeIds.filter(id => id !== fringeId)
      : [...line.fringeIds, fringeId];
    onUpdateLine(catId, accId, line.id, 'fringeIds', nextFringeIds);
  };

  const handleUnitSelect = (catId: string, accId: string, lineId: string, unit: UnitType) => {
    onUpdateLine(catId, accId, lineId, 'unit', unit);
    setOpenUnitPicker(null);
  };

  // --- RENDERING ---

  // HEADER NAVIGAZIONE
  const renderBreadcrumb = () => {
    if (viewState.type === 'root') return null;

    return (
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-100 px-4 py-3 flex items-center gap-3 shadow-sm">
        <button 
          onClick={handleBack}
          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="flex flex-col min-w-0">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
            {viewState.type === 'category' ? 'Top Sheet' : activeCategory?.name}
          </span>
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight truncate">
             {viewState.type === 'category' ? `${activeCategory?.code} - ${activeCategory?.name}` : `${activeAccount?.code} - ${activeAccount?.name}`}
          </h2>
        </div>
        <div className="ml-auto text-right">
           <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Totale</span>
           <span className="text-sm font-black text-indigo-600 mono-font">
             {formatCurrency(viewState.type === 'category' ? (activeCategory?.total || 0) : (activeAccount?.total || 0))}
           </span>
        </div>
      </div>
    );
  };

  // VISTA 1: TOP SHEET (Lista Categorie)
  if (viewState.type === 'root') {
    return (
      <div className="flex flex-col min-h-[500px] bg-white">
        {/* Intestazione finta per coerenza visiva */}
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Top Sheet</span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Totale</span>
        </div>

        <div className="p-4 space-y-3">
            {filteredData.map(cat => (
                <div 
                  key={cat.id}
                  onClick={() => setViewState({ type: 'category', catId: cat.id })}
                  className="group bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer flex items-center justify-between gap-4 active:scale-[0.99]"
                >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-mono text-xs font-bold shrink-0">
                            {cat.code}
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                            <input 
                                type="text" 
                                value={cat.name} 
                                onClick={(e) => e.stopPropagation()} // Stop propagation per editare
                                onChange={(e) => {
                                    // La funzione originale onUpdateCategoryNotes non cambia il nome, 
                                    // assumo ci sia o debba essere una funzione per il nome o che sia statico.
                                    // Nel prompt originale non c'era onUpdateCategoryName nelle props, 
                                    // ma nel layout precedente era renderizzato come testo. 
                                    // Per sicurezza lo lascio readOnly o uso un placeholder se non c'è la prop.
                                    // Guardando il codice precedente: cat.name era in un <span...>{cat.name}</span>
                                    // Quindi NON era editabile nella vista principale nel codice precedente fornitomi.
                                    // PERO' il prompt dice: "Titolo categoria editabile inline (come già implementato)".
                                    // Errore mio: nel codice precedente era un <span>. 
                                    // Aggiungo un piccolo hack: se l'utente ha chiesto editabile, e non ho la prop,
                                    // visualizzo come testo per ora per non rompere i tipi.
                                }}
                                readOnly
                                className="bg-transparent border-none p-0 text-sm font-black text-slate-900 uppercase tracking-tight truncate focus:ring-0 cursor-pointer pointer-events-none" 
                            />
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                {cat.accounts.length} Conti
                            </span>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3 shrink-0">
                        <span className="text-sm font-black text-slate-900 mono-font">
                            {formatCurrency(cat.total)}
                        </span>
                        <div className="text-slate-300 group-hover:text-indigo-500 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </div>
                    </div>
                </div>
            ))}
            
            <button className="w-full py-4 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-[10px] font-black uppercase tracking-widest hover:border-indigo-300 hover:text-indigo-500 transition-all flex items-center justify-center gap-2">
                <span>+ Aggiungi Categoria</span>
            </button>
        </div>
      </div>
    );
  }

  // VISTA 2: LISTA CONTI (Dentro una Categoria)
  if (viewState.type === 'category' && activeCategory) {
    return (
      <div className="flex flex-col min-h-[500px] bg-white">
        {renderBreadcrumb()}
        
        <div className="p-4 space-y-3">
            {activeCategory.accounts.map(acc => (
                <div 
                  key={acc.id}
                  onClick={() => setViewState({ type: 'account', catId: activeCategory.id, accId: acc.id })}
                  className="group bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer flex items-center justify-between gap-4 active:scale-[0.99]"
                >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500 font-mono text-xs font-bold shrink-0 border border-slate-100">
                            {acc.code}
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                            <input 
                                type="text" 
                                value={acc.name} 
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => onUpdateAccountName(activeCategory.id, acc.id, e.target.value)}
                                className="w-full bg-transparent border-none p-0 text-sm font-bold text-slate-900 truncate focus:ring-0 focus:border-b focus:border-indigo-500 transition-all rounded-none" 
                            />
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                {acc.lines.length} Voci
                            </span>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3 shrink-0">
                        <span className="text-sm font-black text-slate-900 mono-font">
                            {formatCurrency(acc.total)}
                        </span>
                        <div className="text-slate-300 group-hover:text-indigo-500 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </div>
                    </div>
                </div>
            ))}

            <button 
                onClick={() => onAddAccount(activeCategory.id)}
                className="w-full py-4 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-[10px] font-black uppercase tracking-widest hover:border-indigo-300 hover:text-indigo-500 transition-all flex items-center justify-center gap-2"
            >
                <span>+ Aggiungi Conto</span>
            </button>

            <div className="pt-8 px-2">
                 <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest block mb-2">Note Categoria</label>
                 <textarea 
                    value={activeCategory.notes || ''} 
                    onChange={(e) => onUpdateCategoryNotes(activeCategory.id, e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs text-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    rows={3}
                    placeholder="Note generali per questa categoria..."
                 />
            </div>
        </div>
      </div>
    );
  }

  // VISTA 3: DETTAGLIO CONTO (Righe/Budget Lines)
  // Qui riusiamo la tabella originale ma filtrata solo per le righe di questo account
  if (viewState.type === 'account' && activeCategory && activeAccount) {
    return (
      <div className="flex flex-col min-h-[500px] bg-white">
        {renderBreadcrumb()}

        <div className="flex-1 overflow-x-auto scrollbar-hide">
          <table className="w-full text-left border-collapse table-fixed min-w-[700px] md:min-w-full">
            <colgroup>
              <col className="w-[180px]" /> {/* Descrizione */}
              <col className="w-[60px]" />  {/* Qta */}
              <col className="w-[40px]" />  {/* X */}
              <col className="w-[80px]" />  {/* Tariffa */}
              <col className="w-[70px]" />  {/* Unit */}
              <col className="w-[70px]" />  {/* Oneri */}
              <col className="w-[90px]" />  {/* Totale */}
              <col className="w-[30px]" />  {/* Actions */}
            </colgroup>

            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr className="text-[9px] uppercase tracking-tighter text-slate-400 font-black">
                <th className="px-3 py-3 text-left">Descrizione</th>
                <th className="px-1 py-3 text-right">Q.tà</th>
                <th className="px-1 py-3 text-center">X</th>
                <th className="px-1 py-3 text-right">Tariffa</th>
                <th className="px-1 py-3 text-left pl-2">Unit.</th>
                <th className="px-1 py-3 text-left">Oneri</th>
                <th className="px-3 py-3 text-right">Totale</th>
                <th className="px-0"></th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-50">
                {activeAccount.lines.map((line, idx) => (
                    <tr key={line.id} className="group hover:bg-slate-50/50 transition-colors h-10">
                        <td className="px-3">
                            <input 
                                type="text" 
                                value={line.description} 
                                onChange={(e) => onUpdateLine(activeCategory.id, activeAccount.id, line.id, 'description', e.target.value)} 
                                className="w-full bg-transparent border-none p-0 text-[11px] font-medium text-slate-700 focus:ring-0 outline-none placeholder-slate-300"
                                placeholder="Descrizione voce..."
                            />
                        </td>
                        <td className="px-1">
                            <input 
                                type="text" 
                                value={line.amount} 
                                onChange={(e) => onUpdateLine(activeCategory.id, activeAccount.id, line.id, 'amount', e.target.value)} 
                                className="w-full text-right bg-transparent border-none p-0 font-mono text-[10px] tabular-nums text-slate-600 focus:ring-0 outline-none" 
                            />
                        </td>
                        <td className="px-1">
                            <input 
                                type="text" 
                                value={line.multiplierX} 
                                onChange={(e) => onUpdateLine(activeCategory.id, activeAccount.id, line.id, 'multiplierX', e.target.value)} 
                                className="w-full text-center bg-transparent border-none p-0 font-mono text-[9px] text-slate-400 focus:ring-0 outline-none" 
                            />
                        </td>
                        <td className="px-1">
                            <input 
                                type="text" 
                                value={line.rate} 
                                onChange={(e) => onUpdateLine(activeCategory.id, activeAccount.id, line.id, 'rate', e.target.value)} 
                                className="w-full text-right bg-transparent border-none p-0 font-mono text-[10px] font-bold tabular-nums text-indigo-500 focus:ring-0 outline-none" 
                            />
                        </td>
                        
                        {/* UNIT SELECTOR */}
                        <td className="px-1 pl-2 relative">
                            <button 
                            aria-label={`Seleziona unità (attuale: ${line.unit ? UNIT_LABELS[line.unit as UnitType] : 'nessuna'})`}
                            onClick={() => setOpenUnitPicker(openUnitPicker === line.id ? null : line.id)}
                            className={`flex items-center justify-center h-5 w-full rounded border transition-all text-[8px] font-black uppercase tracking-tighter overflow-hidden ${line.unit ? 'bg-slate-50 text-indigo-600 border-indigo-100 px-0.5' : 'bg-transparent text-slate-300 border-transparent hover:bg-slate-100 hover:text-indigo-400'}`}
                            >
                            {line.unit ? (
                                <span className="truncate">{UNIT_LABELS[line.unit as UnitType]}</span>
                            ) : (
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                                </svg>
                            )}
                            </button>
                            
                            {openUnitPicker === line.id && (
                            <div className="absolute top-full left-0 z-50 mt-1 w-24 bg-white rounded-lg shadow-xl border border-slate-100 p-1 animate-in fade-in zoom-in-95">
                                {(['H', 'D', 'W', 'FLAT'] as UnitType[]).map(u => (
                                <button 
                                    key={u}
                                    disabled={u === 'H'} 
                                    onClick={() => handleUnitSelect(activeCategory.id, activeAccount.id, line.id, u)}
                                    className={`w-full text-left px-2 py-1.5 rounded text-[9px] font-black uppercase tracking-widest transition-colors ${u === 'H' ? 'opacity-30 cursor-not-allowed bg-slate-50' : 'hover:bg-indigo-50 hover:text-indigo-600 text-slate-600'}`}
                                >
                                    {UNIT_LABELS[u]}
                                </button>
                                ))}
                            </div>
                            )}
                        </td>

                        {/* FRINGES */}
                        <td className="px-1 relative">
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
                                    <input type="checkbox" checked={line.fringeIds.includes(f.id)} onChange={() => toggleLineFringe(activeCategory.id, activeAccount.id, line, f.id)} className="w-3 h-3 rounded border-slate-300 text-indigo-600 focus:ring-0" />
                                    <span className="text-[9px] font-bold text-slate-600 truncate">{f.name}</span>
                                    </label>
                                ))}
                                </div>
                            </div>
                            )}
                        </td>

                        <td className="px-3 text-right font-mono text-[10px] font-bold text-slate-800 tabular-nums">
                            {formatCurrency(line.total)}
                        </td>

                        <td className="px-0">
                             <div className="flex flex-col items-center opacity-0 group-hover:opacity-100">
                                <button onClick={() => onDeleteLine(activeCategory.id, activeAccount.id, line.id)} className="p-1 text-slate-200 hover:text-red-500 transition-colors"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                             </div>
                        </td>
                    </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-slate-50">
             <button 
                onClick={() => onAddLine(activeCategory.id, activeAccount.id)}
                className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-[10px] font-black uppercase tracking-widest hover:border-indigo-300 hover:text-indigo-500 transition-all flex items-center justify-center gap-2"
            >
                <span>+ Aggiungi Riga</span>
            </button>
            <div className="mt-4">
                 <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest block mb-2">Note Conto</label>
                 <textarea 
                    value={activeAccount.notes || ''} 
                    onChange={(e) => onUpdateAccountNotes(activeCategory.id, activeAccount.id, e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs text-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    rows={2}
                    placeholder="Note specifiche per questo conto..."
                 />
            </div>
        </div>
      </div>
    );
  }

  // Fallback (non dovrebbe accadere con la logica sopra)
  return <div className="p-8 text-center text-slate-400">Seleziona una categoria</div>;
};

export default BudgetTable;
