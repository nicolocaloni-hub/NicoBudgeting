import React, { useState, useEffect } from 'react';
import { ArchiveEntry } from '../../types';
import { CashflowSettings } from '../../types/cashflow';

const ARCHIVE_KEY = 'nicobudget_archive_v1';
const SETTINGS_KEY_PREFIX = 'nccf_settings_';

const CashflowHome: React.FC<{ onSelect: (id: string) => void, onBack: () => void }> = ({ onSelect, onBack }) => {
  const [productions, setProductions] = useState<ArchiveEntry[]>([]);
  const [editingSettings, setEditingSettings] = useState<CashflowSettings | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(ARCHIVE_KEY);
    if (saved) setProductions(JSON.parse(saved));
  }, []);

  const handleOpenSettings = (prod: ArchiveEntry) => {
    const savedSettings = localStorage.getItem(`${SETTINGS_KEY_PREFIX}${prod.id}`);
    if (savedSettings) {
      setEditingSettings(JSON.parse(savedSettings));
    } else {
      setEditingSettings({
        productionId: prod.id,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        initialCash: 10000,
        threshold: 2000
      });
    }
  };

  const saveSettings = () => {
    if (!editingSettings) return;
    localStorage.setItem(`${SETTINGS_KEY_PREFIX}${editingSettings.productionId}`, JSON.stringify(editingSettings));
    onSelect(editingSettings.productionId);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <button onClick={onBack} className="p-2 hover:bg-white rounded-xl text-slate-400 border border-transparent hover:border-slate-200 transition-all">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div className="text-center">
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Cashflow Daily</h1>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Seleziona una Produzione</p>
          </div>
          <div className="w-10" />
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {productions.length === 0 && (
            <div className="col-span-2 py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
              <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Nessuna produzione nell'archivio Budget.</p>
              <p className="text-slate-300 text-[10px] mt-2 italic">Crea e salva una copia in Nico Budget Pro per iniziare.</p>
            </div>
          )}
          {productions.map(prod => (
            <div key={prod.id} onClick={() => handleOpenSettings(prod)} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all cursor-pointer group">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{prod.date}</span>
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </div>
              </div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-1">{prod.title}</h3>
              <p className="text-indigo-600 font-bold mono-font text-sm">{prod.total.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}</p>
            </div>
          ))}
        </div>
      </div>

      {editingSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="p-8 space-y-6">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter text-center">Parametri Cashflow</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Data Inizio</label>
                  <input type="date" value={editingSettings.startDate} onChange={e => setEditingSettings({...editingSettings, startDate: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Data Fine</label>
                  <input type="date" value={editingSettings.endDate} onChange={e => setEditingSettings({...editingSettings, endDate: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Cassa Iniziale (€)</label>
                <input type="number" value={editingSettings.initialCash} onChange={e => setEditingSettings({...editingSettings, initialCash: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-black text-indigo-600 outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Soglia di Allarme (€)</label>
                <input type="number" value={editingSettings.threshold} onChange={e => setEditingSettings({...editingSettings, threshold: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-black text-red-500 outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="pt-4 flex gap-3">
                <button onClick={() => setEditingSettings(null)} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 rounded-2xl transition-all">Annulla</button>
                <button onClick={saveSettings} className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-500 transition-all">Apri Dashboard</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashflowHome;