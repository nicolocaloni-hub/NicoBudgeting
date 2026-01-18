import React, { useState } from 'react';
import { ArchiveEntry } from '../types';

interface SavedBudgetsListProps {
  archive: ArchiveEntry[];
  onLoad: (entry: ArchiveEntry) => void;
  onRename: (id: string, newTitle: string) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
}

const SavedBudgetsList: React.FC<SavedBudgetsListProps> = ({ archive, onLoad, onRename, onDelete, onBack }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempTitle, setTempTitle] = useState('');

  const startRename = (entry: ArchiveEntry) => {
    setEditingId(entry.id);
    setTempTitle(entry.title);
  };

  const confirmRename = (id: string) => {
    if (tempTitle.trim()) {
      onRename(id, tempTitle.trim());
      setEditingId(null);
    }
  };

  return (
    <div className="p-6 md:p-12 max-w-4xl mx-auto space-y-10 animate-in slide-in-from-bottom-4 duration-500">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-white rounded-xl text-slate-400 transition-all border border-transparent hover:border-slate-200">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div className="flex flex-col">
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Budget Salvati</h1>
            <p className="text-slate-400 text-xs font-medium">Cronologia snapshot e versioni del progetto.</p>
          </div>
        </div>
        <div className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100">
          {archive.length} Budget
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4">
        {archive.length === 0 && (
          <div className="text-center py-24 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200 space-y-4">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
            </div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Nessun budget salvato in archivio.</p>
          </div>
        )}

        {archive.map(entry => (
          <div 
            key={entry.id} 
            className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all group flex items-center justify-between gap-6"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{entry.date}</span>
                {editingId === entry.id ? (
                  <div className="flex gap-2">
                    <input 
                      autoFocus
                      type="text" 
                      value={tempTitle} 
                      onChange={(e) => setTempTitle(e.target.value)} 
                      className="bg-slate-50 border border-indigo-200 rounded-lg px-3 py-1 text-sm font-bold text-slate-900 outline-none"
                    />
                    <button onClick={() => confirmRename(entry.id)} className="text-indigo-600 font-bold text-[10px] hover:underline">OK</button>
                  </div>
                ) : (
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight truncate group-hover:text-indigo-600 transition-colors">{entry.title}</h3>
                )}
              </div>
              <p className="text-indigo-600 font-bold mono-font text-sm">
                {entry.total.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
              </p>
            </div>

            <div className="flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all">
               <button 
                  onClick={() => onLoad(entry)} 
                  className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-100 active:scale-95"
               >
                 Apri
               </button>
               <button 
                  onClick={() => startRename(entry)} 
                  className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-xl transition-all"
                  title="Rinomina"
               >
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
               </button>
               <button 
                  onClick={() => onDelete(entry.id)} 
                  className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-slate-50 rounded-xl transition-all"
                  title="Elimina"
               >
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
               </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SavedBudgetsList;