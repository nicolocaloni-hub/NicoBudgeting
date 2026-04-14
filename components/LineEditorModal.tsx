import React, { useState, useEffect } from 'react';
import { BudgetLine, Fringe, UnitType } from '../types';

const UNIT_LABELS: Record<UnitType, string> = {
  'H': 'Ore',
  'D': 'Giorni',
  'W': 'Settimane',
  'FLAT': 'Forfait'
};

interface LineEditorModalProps {
  line: BudgetLine;
  fringes: Fringe[];
  onUpdate: (field: keyof BudgetLine, value: string | number | string[]) => void;
  onDelete: () => void;
  onClose: () => void;
}

const LineEditorModal: React.FC<LineEditorModalProps> = ({ line, fringes, onUpdate, onDelete, onClose }) => {
  const [openFringePicker, setOpenFringePicker] = useState(false);

  // Close on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-8 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Modifica Riga</h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto max-h-[70vh]">
          {/* Descrizione */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Descrizione</label>
            <input 
              type="text" 
              value={line.description} 
              onChange={(e) => onUpdate('description', e.target.value)} 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" 
              placeholder="Descrizione voce..." 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Quantità */}
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Quantità</label>
              <input 
                type="text" 
                inputMode="decimal"
                value={line.amount} 
                onChange={(e) => onUpdate('amount', e.target.value)} 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-mono text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" 
              />
            </div>

            {/* Moltiplicatore */}
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Moltiplicatore (X)</label>
              <input 
                type="text" 
                inputMode="decimal"
                value={line.multiplierX} 
                onChange={(e) => onUpdate('multiplierX', e.target.value)} 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-mono text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Tariffa */}
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Tariffa (€)</label>
              <input 
                type="text" 
                inputMode="decimal"
                value={line.rate} 
                onChange={(e) => onUpdate('rate', e.target.value)} 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-mono font-bold text-indigo-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" 
              />
            </div>

            {/* Unità */}
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Unità</label>
              <div className="relative">
                <select 
                  value={line.unit || ''} 
                  onChange={(e) => onUpdate('unit', e.target.value as UnitType)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-700 appearance-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                >
                  <option value="" disabled>Seleziona...</option>
                  {(['D', 'W', 'FLAT'] as UnitType[]).map(u => (
                    <option key={u} value={u}>{UNIT_LABELS[u]}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>
          </div>

          {/* Oneri */}
          <div className="relative">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Oneri Sociali</label>
            <button 
              onClick={() => setOpenFringePicker(!openFringePicker)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium text-slate-700 flex items-center justify-between focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            >
              <span className="truncate">
                {line.fringeIds.length > 0 
                  ? `${line.fringeIds.length} oneri selezionati` 
                  : 'Nessun onere'}
              </span>
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            
            {openFringePicker && (
              <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 p-2 animate-in fade-in zoom-in-95">
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {fringes.length === 0 ? (
                    <p className="text-xs text-slate-400 p-2 text-center">Nessun onere disponibile</p>
                  ) : (
                    fringes.map(f => (
                      <label key={f.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">
                        <input 
                          type="checkbox" 
                          checked={line.fringeIds.includes(f.id)} 
                          onChange={() => { 
                            const next = line.fringeIds.includes(f.id) 
                              ? line.fringeIds.filter(id => id !== f.id) 
                              : [...line.fringeIds, f.id]; 
                            onUpdate('fringeIds', next); 
                          }} 
                          className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" 
                        />
                        <span className="text-sm font-bold text-slate-700">{f.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex gap-3">
          <button 
            onClick={() => {
              if (window.confirm('Sei sicuro di voler eliminare questa riga?')) {
                onDelete();
              }
            }}
            className="px-4 py-3 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-sm font-bold transition-all active:scale-[0.98]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
          <button 
            onClick={onClose}
            className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-sm shadow-indigo-200 transition-all active:scale-[0.98]"
          >
            Fatto
          </button>
        </div>
      </div>
    </div>
  );
};

export default LineEditorModal;
