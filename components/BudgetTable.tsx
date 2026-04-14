
import React, { useState, useMemo, useRef } from 'react';
import { Category, BudgetLine, GlobalVar, Fringe, UnitType } from '../types';
import LineEditorModal from './LineEditorModal';

interface BudgetTableProps {
  categories: Category[];
  globals: GlobalVar[];
  fringes: Fringe[];
  searchTerm: string;
  onUpdateLine: (catId: string, accId: string, lineId: string, field: keyof BudgetLine, value: string | number | string[]) => void;
  onUpdateAccountName: (catId: string, accId: string, name: string) => void;
  onAddLine: (catId: string, accId: string) => string;
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

type DeleteConfirm = {
  type: 'category' | 'account';
  catId: string;
  accId?: string;
  name: string;
};

const BudgetTable: React.FC<BudgetTableProps> = ({ 
  categories, fringes, searchTerm, onUpdateLine, onUpdateAccountName, 
  onAddLine, onDeleteLine, onAddAccount, onDeleteAccount, onDeleteCategory, 
  onUpdateCategoryNotes, onUpdateAccountNotes
}) => {
  const [viewState, setViewState] = useState<ViewState>({ type: 'root' });
  const [openFringePicker, setOpenFringePicker] = useState<string | null>(null);
  const [openUnitPicker, setOpenUnitPicker] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirm | null>(null);
  const [editingLineId, setEditingLineId] = useState<string | null>(null);

  // Refs per gestione Long Press professionale
  const longPressTimerRef = useRef<number | null>(null);
  const pressStartPosRef = useRef<{ x: number, y: number }>({ x: 0, y: 0 });
  const preventClickRef = useRef(false);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('it-IT', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    }).format(val) + '€';
  };

  // Filtraggio dati
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

  // --- HOOKS DI GESTIONE EVENTI (Category & Account Cards) ---
  
  const handlePointerDown = (e: React.PointerEvent, target: DeleteConfirm) => {
    // Registriamo posizione iniziale
    pressStartPosRef.current = { x: e.clientX, y: e.clientY };
    preventClickRef.current = false;

    // Avviamo il timer per il long press (1,5 secondi)
    longPressTimerRef.current = window.setTimeout(() => {
      preventClickRef.current = true;
      setDeleteConfirm(target);
      // Micro-vibrazione 12ms come richiesto
      if ('vibrate' in navigator) navigator.vibrate(12);
    }, 1500);
  };

  const handlePointerUp = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    // Se l'utente muove il dito di più di 10px (es. per scrollare), cancelliamo il timer
    const dist = Math.sqrt(
      Math.pow(e.clientX - pressStartPosRef.current.x, 2) + 
      Math.pow(e.clientY - pressStartPosRef.current.y, 2)
    );
    if (dist > 10 && longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleCardClick = (e: React.MouseEvent, action: () => void) => {
    // Se il long press è stato attivato, preveniamo l'azione del click (navigazione)
    if (preventClickRef.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    action();
  };

  const executeDelete = () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === 'category') {
      onDeleteCategory(deleteConfirm.catId);
      if (viewState.type !== 'root') setViewState({ type: 'root' });
    } else if (deleteConfirm.type === 'account' && deleteConfirm.accId) {
      onDeleteAccount(deleteConfirm.catId, deleteConfirm.accId);
      if (viewState.type === 'account') setViewState({ type: 'category', catId: deleteConfirm.catId });
    }
    setDeleteConfirm(null);
  };

  // --- RENDERING ---

  const renderBreadcrumb = () => {
    if (viewState.type === 'root') return null;
    return (
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-100 px-4 py-3 flex items-center gap-3 shadow-sm">
        <button onClick={handleBack} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="flex flex-col min-w-0">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{viewState.type === 'category' ? 'Top Sheet' : activeCategory?.name}</span>
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight truncate">
             {viewState.type === 'category' ? `${activeCategory?.code} - ${activeCategory?.name}` : `${activeAccount?.code} - ${activeAccount?.name}`}
          </h2>
        </div>
        <div className="ml-auto text-right">
           <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Totale</span>
           <span className="text-sm font-black text-indigo-600 mono-font">{formatCurrency(viewState.type === 'category' ? (activeCategory?.total || 0) : (activeAccount?.total || 0))}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-[500px] bg-white relative">
      {renderBreadcrumb()}

      {/* MODAL DI ELIMINAZIONE */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="p-8 text-center space-y-6">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Elimina {deleteConfirm.type === 'category' ? 'Categoria' : 'Conto'}?</h3>
                <p className="text-slate-500 text-xs font-medium leading-relaxed">
                  Stai eliminando <span className="font-bold text-slate-900">"{deleteConfirm.name}"</span>.<br/>Questa azione eliminerà anche tutti i conti e le righe contenute.
                </p>
              </div>
              <div className="flex flex-col gap-2 pt-2">
                <button onClick={executeDelete} className="w-full py-4 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-red-100 hover:bg-red-500 transition-all active:scale-95">Elimina Definitivamente</button>
                <button onClick={() => setDeleteConfirm(null)} className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 rounded-2xl transition-all">Annulla</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VISTA 1: TOP SHEET */}
      {viewState.type === 'root' && (
        <>
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Top Sheet</span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Totale</span>
          </div>
          <div className="p-4 space-y-3">
              {filteredData.map(cat => (
                  <button 
                    key={cat.id}
                    onPointerDown={(e) => handlePointerDown(e, { type: 'category', catId: cat.id, name: cat.name })}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                    onPointerMove={handlePointerMove}
                    onContextMenu={(e) => e.preventDefault()}
                    onClick={(e) => handleCardClick(e, () => setViewState({ type: 'category', catId: cat.id }))}
                    className="w-full group bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer flex items-center justify-between gap-4 active:scale-[0.99] select-none text-left focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    style={{ touchAction: 'manipulation', WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none' }}
                  >
                      <div className="flex items-center gap-4 flex-1 min-w-0 pointer-events-none">
                          <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-mono text-xs font-bold shrink-0">{cat.code}</div>
                          <div className="flex flex-col min-w-0 flex-1">
                              <span className="text-sm font-black text-slate-900 uppercase tracking-tight truncate">{cat.name}</span>
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{cat.accounts.length} Conti</span>
                          </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 pointer-events-none">
                          <span className="text-sm font-black text-slate-900 mono-font">{formatCurrency(cat.total)}</span>
                          <div className="text-slate-300 group-hover:text-indigo-500 transition-colors">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                          </div>
                      </div>
                  </button>
              ))}
              <button className="w-full py-4 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-[10px] font-black uppercase tracking-widest hover:border-indigo-300 hover:text-indigo-500 transition-all flex items-center justify-center gap-2">
                  <span>+ Aggiungi Categoria</span>
              </button>
          </div>
        </>
      )}

      {/* VISTA 2: LISTA CONTI */}
      {viewState.type === 'category' && activeCategory && (
        <div className="p-4 space-y-3">
            {activeCategory.accounts.map(acc => (
                <button 
                  key={acc.id}
                  onPointerDown={(e) => handlePointerDown(e, { type: 'account', catId: activeCategory.id, accId: acc.id, name: acc.name })}
                  onPointerUp={handlePointerUp}
                  onPointerLeave={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                  onPointerMove={handlePointerMove}
                  onContextMenu={(e) => e.preventDefault()}
                  onClick={(e) => handleCardClick(e, () => setViewState({ type: 'account', catId: activeCategory.id, accId: acc.id }))}
                  className="w-full group bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer flex items-center justify-between gap-4 active:scale-[0.99] select-none text-left focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  style={{ touchAction: 'manipulation', WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none' }}
                >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500 font-mono text-xs font-bold shrink-0 border border-slate-100">{acc.code}</div>
                        <div className="flex flex-col min-w-0 flex-1">
                            {/* Input gestito con stopPropagation per permettere editing senza navigare */}
                            <input 
                                type="text" 
                                value={acc.name} 
                                onClick={(e) => e.stopPropagation()}
                                onPointerDown={(e) => e.stopPropagation()}
                                onChange={(e) => onUpdateAccountName(activeCategory.id, acc.id, e.target.value)}
                                className="w-full bg-transparent border-none p-0 text-sm font-bold text-slate-900 truncate focus:ring-0 focus:border-b focus:border-indigo-500 transition-all rounded-none" 
                            />
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{acc.lines.length} Voci</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 pointer-events-none">
                        <span className="text-sm font-black text-slate-900 mono-font">{formatCurrency(acc.total)}</span>
                        <div className="text-slate-300 group-hover:text-indigo-500 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </div>
                    </div>
                </button>
            ))}
            <button onClick={() => onAddAccount(activeCategory.id)} className="w-full py-4 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-[10px] font-black uppercase tracking-widest hover:border-indigo-300 hover:text-indigo-500 transition-all flex items-center justify-center gap-2">
                <span>+ Aggiungi Conto</span>
            </button>
            <div className="pt-8 px-2">
                 <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest block mb-2">Note Categoria</label>
                 <textarea value={activeCategory.notes || ''} onChange={(e) => onUpdateCategoryNotes(activeCategory.id, e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs text-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" rows={3} placeholder="Note generali per questa categoria..." />
            </div>
        </div>
      )}

      {/* VISTA 3: DETTAGLIO CONTO */}
      {viewState.type === 'account' && activeCategory && activeAccount && (
        <div className="flex flex-col min-h-[500px]">
          <div className="flex-1 overflow-x-auto scrollbar-hide">
            <table className="w-full text-left border-collapse table-fixed min-w-[500px] md:min-w-full">
              <colgroup>
                <col className="w-[140px] md:w-[180px]" /><col className="w-[40px] md:w-[60px]" /><col className="w-[30px] md:w-[40px]" /><col className="w-[60px] md:w-[80px]" /><col className="w-[50px] md:w-[70px]" /><col className="w-[50px] md:w-[70px]" /><col className="w-[70px] md:w-[90px]" /><col className="w-[30px]" />
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
                  {activeAccount.lines.map((line) => (
                      <tr 
                        key={line.id} 
                        onClick={() => setEditingLineId(line.id)}
                        className="group hover:bg-slate-50/50 transition-colors h-10 cursor-pointer"
                      >
                          <td className="px-3">
                              <div className="w-full text-[11px] font-medium text-slate-700 truncate">{line.description || <span className="text-slate-300 italic">Nuova riga</span>}</div>
                          </td>
                          <td className="px-1">
                              <div className="w-full text-right font-mono text-[10px] tabular-nums text-slate-600">{line.amount}</div>
                          </td>
                          <td className="px-1">
                              <div className="w-full text-center font-mono text-[9px] text-slate-400">{line.multiplierX}</div>
                          </td>
                          <td className="px-1">
                              <div className="w-full text-right font-mono text-[10px] font-bold tabular-nums text-indigo-500">{line.rate}</div>
                          </td>
                          <td className="px-1 pl-2">
                              <div className={`flex items-center justify-center h-5 w-full rounded border text-[8px] font-black uppercase tracking-tighter overflow-hidden ${line.unit ? 'bg-slate-50 text-indigo-600 border-indigo-100 px-0.5' : 'bg-transparent text-slate-300 border-transparent'}`}>
                                {line.unit ? <span className="truncate">{UNIT_LABELS[line.unit as UnitType]}</span> : '-'}
                              </div>
                          </td>
                          <td className="px-1">
                              <div className="flex flex-wrap gap-0.5 items-center">
                              {line.fringeIds.length > 0 ? (
                                  <div className="px-1 py-0.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded text-[8px] font-black">{line.fringeIds.length} ON.</div>
                              ) : (
                                  <div className="w-4 h-4 flex items-center justify-center text-slate-300"><span className="text-[10px]">-</span></div>
                              )}
                              </div>
                          </td>
                          <td className="px-3 text-right font-mono text-[10px] font-bold text-slate-800 tabular-nums">{formatCurrency(line.total)}</td>
                          <td className="px-0 text-center">
                              <button 
                                onClick={(e) => { e.stopPropagation(); onDeleteLine(activeCategory.id, activeAccount.id, line.id); }} 
                                className="opacity-0 group-hover:opacity-100 p-1 text-slate-200 hover:text-red-500 transition-colors focus:outline-none"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                          </td>
                      </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-slate-50">
               <button onClick={() => {
                 const newId = onAddLine(activeCategory.id, activeAccount.id);
                 setEditingLineId(newId);
               }} className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-[10px] font-black uppercase tracking-widest hover:border-indigo-300 hover:text-indigo-500 transition-all flex items-center justify-center gap-2"><span>+ Aggiungi Riga</span></button>
               <div className="mt-4">
                    <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest block mb-2">Note Conto</label>
                    <textarea value={activeAccount.notes || ''} onChange={(e) => onUpdateAccountNotes(activeCategory.id, activeAccount.id, e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs text-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" rows={2} placeholder="Note specifiche per questo conto..." />
               </div>
          </div>
        </div>
      )}
      {/* MODAL MODIFICA RIGA */}
      {editingLineId && activeCategory && activeAccount && (
        <LineEditorModal
          line={activeAccount.lines.find(l => l.id === editingLineId)!}
          fringes={fringes}
          onUpdate={(field, value) => onUpdateLine(activeCategory.id, activeAccount.id, editingLineId, field, value)}
          onDelete={() => {
            onDeleteLine(activeCategory.id, activeAccount.id, editingLineId);
            setEditingLineId(null);
          }}
          onClose={() => setEditingLineId(null)}
        />
      )}
    </div>
  );
};

export default BudgetTable;
