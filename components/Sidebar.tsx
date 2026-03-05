
import React from 'react';
import { Fringe } from '../types';

interface SidebarProps {
  fringes: Fringe[];
  currentView: 'editor' | 'summary' | 'archive';
  onUpdateFringe: (id: string, field: keyof Fringe, value: string | number | boolean) => void;
  onDeleteFringe: (id: string) => void;
  onAddFringe: () => void;
  onArchiveBudget: () => void;
  onResetBudget: () => void;
  onSaveTemplate: () => void;
  onNavigate: (view: 'editor' | 'summary' | 'archive') => void;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  fringes, 
  currentView,
  onUpdateFringe,
  onDeleteFringe,
  onAddFringe,
  onArchiveBudget,
  onResetBudget,
  onSaveTemplate,
  onNavigate,
  isOpen, 
  onClose 
}) => {
  return (
    <>
      <div 
        className={`fixed inset-0 bg-slate-900/50 z-40 lg:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        flex flex-col h-full border-r border-slate-700
      `}>
        <div className="p-6 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex flex-col cursor-pointer" onClick={() => onNavigate('editor')}>
            <span className="font-black tracking-tighter text-indigo-400 text-lg">SMARTSET</span>
            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.3em]">PRO EDITION</span>
          </div>
          <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
          {/* Azioni Principali */}
          <div className="space-y-3">
            <button 
              onClick={() => {
                onArchiveBudget();
                onClose();
              }}
              className="w-full flex items-center justify-start gap-3 px-4 py-3 bg-slate-800/50 hover:bg-slate-700/50 rounded-2xl transition-all text-[10px] font-black tracking-widest text-emerald-400 active:scale-95 border border-emerald-900/30 shadow-lg"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
              SALVA COPIA
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                try {
                  onResetBudget();
                } catch (err) {
                  console.error("Errore onResetBudget:", err);
                }
                onClose();
              }}
              className="w-full flex items-center gap-3 px-4 py-3 bg-slate-800/50 hover:bg-slate-700/50 text-red-500 rounded-2xl border border-red-900/30 font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-lg"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
              </svg>
              NUOVO BUDGET
            </button>

            <button 
              onClick={() => {
                onSaveTemplate();
                onClose();
              }}
              className="w-full flex items-center justify-start gap-3 px-4 py-3 bg-slate-800/50 hover:bg-slate-700/50 rounded-2xl transition-all text-[10px] font-black tracking-widest text-indigo-400 active:scale-95 border border-indigo-900/30 shadow-lg"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              SALVA TEMPLATE
            </button>
          </div>

          {/* Navigazione */}
          <nav className="space-y-1">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">Navigazione</h2>
            
            <button 
              onClick={() => { onNavigate('editor'); onClose(); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-[10px] font-black tracking-widest ${currentView === 'editor' ? 'bg-slate-800 text-indigo-400' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              EDITOR BUDGET
            </button>

            <button 
              onClick={() => { onNavigate('archive'); onClose(); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-[10px] font-black tracking-widest ${currentView === 'archive' ? 'bg-slate-800 text-indigo-400' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
              ARCHIVIO BUDGET
            </button>
          </nav>
        </div>

        {/* Oneri Sociali - Spostato in fondo con wrapper mt-auto e scroll indipendente */}
        <div className="mt-auto p-6 border-t border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Oneri Sociali</h2>
            <button 
              onClick={onAddFringe}
              className="text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors font-bold flex items-center gap-1"
            >
              + NUOVO
            </button>
          </div>
          
          <div className="mt-3 max-h-64 overflow-y-auto pr-1 space-y-3 scrollbar-hide">
            {fringes.length === 0 && (
              <div className="text-center py-4 text-slate-600 text-[9px] uppercase tracking-widest italic">Nessun onere</div>
            )}
            {fringes.map(f => (
              <div key={f.id} className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 group relative hover:border-slate-700 transition-all">
                <div className="flex flex-col gap-2">
                  <input 
                    type="text"
                    value={f.name}
                    onChange={(e) => onUpdateFringe(f.id, 'name', e.target.value)}
                    className="bg-transparent text-xs font-bold text-slate-200 border-none focus:ring-0 p-0"
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <input 
                        type="number"
                        value={Math.round(f.rate * 100 * 10) / 10}
                        onChange={(e) => onUpdateFringe(f.id, 'rate', parseFloat(e.target.value) / 100)}
                        className="w-12 bg-transparent border-none rounded text-xs text-indigo-400 font-bold mono-font p-0 focus:ring-0"
                      />
                      <span className="text-[10px] text-slate-600 font-black">%</span>
                    </div>
                    <button 
                      onClick={() => onDeleteFringe(f.id)}
                      className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </aside>
    </>
  );
};

export default Sidebar;
