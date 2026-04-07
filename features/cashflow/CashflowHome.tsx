import React, { useState } from 'react';
import { ArchiveEntry } from '../../types';
import { CashflowSettings, CashflowMovement } from '../../types/cashflow';
import { useSettings } from '../../contexts/SettingsContext';
import { useTutorial } from '../../contexts/TutorialContext';

const ARCHIVE_KEY = 'nicobudget_archive_v1';
const SETTINGS_KEY_PREFIX = 'nccf_settings_';
const MOVEMENTS_KEY_PREFIX = 'nccf_movements_';

const getInitialSettings = (productionId: string): CashflowSettings => {
  const now = new Date();
  const thirtyDaysLater = new Date(now.getTime() + 30 * 86400000);
  return {
    productionId,
    startDate: now.toISOString().split('T')[0],
    endDate: thirtyDaysLater.toISOString().split('T')[0],
    initialCash: 10000,
    threshold: 2000
  };
};

const CashflowHome: React.FC<{ onSelect: (id: string) => void, onBack: () => void }> = ({ onSelect, onBack }) => {
  const { t } = useSettings();
  const { startTutorial } = useTutorial();
  const [productions] = useState<ArchiveEntry[]>(() => {
    const saved = localStorage.getItem(ARCHIVE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });
  const [editingSettings, setEditingSettings] = useState<CashflowSettings | null>(null);
  
  // Stati per la creazione di un nuovo cashflow
  const [isCreationModalOpen, setIsCreationModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newFlowData, setNewFlowData] = useState(() => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    return {
      title: `NUOVO CASHFLOW ${now.toLocaleDateString('it-IT')}`,
      date: dateStr,
      endDate: dateStr,
      initialCash: ''
    };
  });

  React.useEffect(() => {
    if (localStorage.getItem('tutorialFlow') === 'active') {
      localStorage.removeItem('tutorialFlow');
      startTutorial('cashflow');
    }
  }, [startTutorial]);

  const getProductionStats = (prodId: string, initialCash: number) => {
    const savedMoves = localStorage.getItem(`${MOVEMENTS_KEY_PREFIX}${prodId}`);
    if (!savedMoves) return { balance: initialCash };
    
    try {
      const movements: CashflowMovement[] = JSON.parse(savedMoves);
      
      const inflow = movements
        .filter(m => m.type === 'in')
        .reduce((sum, m) => sum + m.amount, 0);
        
      const spent = movements
        .filter(m => m.type === 'out')
        .reduce((sum, m) => sum + m.amount, 0);
        
      return { balance: initialCash + inflow - spent };
    } catch {
      return { balance: initialCash };
    }
  };

  const handleOpenSettings = (prod: ArchiveEntry) => {
    const savedSettings = localStorage.getItem(`${SETTINGS_KEY_PREFIX}${prod.id}`);
    if (savedSettings) {
      setEditingSettings(JSON.parse(savedSettings));
    } else {
      setEditingSettings(getInitialSettings(prod.id));
    }
  };

  const handleCreateNewFlow = () => {
    // Parsing robusto: rimuove spazi e converte virgola in punto per parseFloat
    const rawVal = newFlowData.initialCash.trim().replace(',', '.');
    const cash = parseFloat(rawVal);
    
    if (isNaN(cash)) {
      alert("Inserire un importo valido per la cassa iniziale.");
      return;
    }

    if (newFlowData.endDate < newFlowData.date) {
      alert("La data di fine non può essere precedente alla data di inizio.");
      return;
    }

    setIsSaving(true);
    const newId = 'prj-' + Math.random().toString(36).substr(2, 9);
    
    // 1. Crea l'entry in archivio
    const newEntry: ArchiveEntry = {
      id: newId,
      title: newFlowData.title.trim() || `CASHFLOW ${newFlowData.date}`,
      date: new Date().toLocaleDateString('it-IT'),
      total: 0,
      categories: [],
      fringes: []
    };

    const nextProductions = [newEntry, ...productions];
    localStorage.setItem(ARCHIVE_KEY, JSON.stringify(nextProductions));

    // 2. Crea le impostazioni Cashflow
    const newSettings: CashflowSettings = {
      productionId: newId,
      startDate: newFlowData.date,
      endDate: newFlowData.endDate,
      initialCash: cash,
      threshold: cash * 0.1 // 10% di default
    };
    localStorage.setItem(`${SETTINGS_KEY_PREFIX}${newId}`, JSON.stringify(newSettings));

    // 3. Navigazione
    setTimeout(() => {
      setIsSaving(false);
      setIsCreationModalOpen(false);
      onSelect(newId);
    }, 500);
  };

  const handleDeleteProduction = (id: string) => {
    if (confirm("Eliminare questa produzione? Questa azione rimuove definitivamente anche movimenti e dati collegati.")) {
      const nextProductions = productions.filter(p => p.id !== id);
      setProductions(nextProductions);
      localStorage.setItem(ARCHIVE_KEY, JSON.stringify(nextProductions));
      localStorage.removeItem(`${SETTINGS_KEY_PREFIX}${id}`);
      localStorage.removeItem(`${MOVEMENTS_KEY_PREFIX}${id}`);
      localStorage.removeItem(`ncbp_reportNotes_${id}`);
    }
  };

  const saveSettings = () => {
    if (!editingSettings) return;
    localStorage.setItem(`${SETTINGS_KEY_PREFIX}${editingSettings.productionId}`, JSON.stringify(editingSettings));
    onSelect(editingSettings.productionId);
  };

  const isCreateDisabled = isSaving || !newFlowData.initialCash || newFlowData.endDate < newFlowData.date;

  return (
    <div className={`min-h-screen bg-slate-50 p-6 md:p-12 font-sans ${(editingSettings || isCreationModalOpen) ? 'overflow-hidden' : ''}`}>
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <button onClick={onBack} className="p-2 hover:bg-white rounded-xl text-slate-400 border border-transparent hover:border-slate-200 transition-all">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div className="text-center">
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none text-center">Cashflow Daily</h1>
            <p className="text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-widest mt-1 text-center">Gestione Movimenti e Proiezioni</p>
          </div>
          <button 
            onClick={() => startTutorial('cashflow')} 
            className="p-1.5 hover:bg-white rounded-xl text-indigo-400 hover:text-indigo-600 border border-transparent hover:border-slate-200 transition-all"
            title="Avvia Tutorial"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </button>
        </header>

        <div className="tutorial-cashflow-list grid grid-cols-1 md:grid-cols-2 gap-4 pb-24">
          {productions.length === 0 && (
            <div className="col-span-2 py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Tocca il tasto + per iniziare.</p>
            </div>
          )}
          {productions.map(prod => {
            const savedS = localStorage.getItem(`${SETTINGS_KEY_PREFIX}${prod.id}`);
            const initialC = savedS ? JSON.parse(savedS).initialCash : 0;
            const stats = getProductionStats(prod.id, initialC);
            
            return (
              <div 
                key={prod.id} 
                onClick={() => handleOpenSettings(prod)} 
                className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all cursor-pointer group relative flex flex-col min-h-[160px]"
              >
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{prod.date}</span>
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </div>
                </div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-1 truncate pr-8">{prod.title}</h3>
                <div className="mt-auto flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Cassa Disponibile</span>
                    <p className="text-indigo-600 font-bold mono-font text-sm">{stats.balance.toLocaleString('it-IT')}€</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteProduction(prod.id); }} className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <button 
        onClick={() => setIsCreationModalOpen(true)}
        aria-label="Crea nuovo Cashflow Daily"
        className="tutorial-cashflow-new fixed bottom-4 right-4 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-indigo-500 transition-all active:scale-90 z-50 focus:outline-none"
      >
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {isCreationModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="p-8 space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Nuovo Cashflow Daily</h3>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Inizia il monitoraggio quotidiano</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Titolo Progetto</label>
                  <input 
                    type="text" 
                    value={newFlowData.title} 
                    onChange={e => setNewFlowData({...newFlowData, title: e.target.value.toUpperCase()})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-black outline-none focus:ring-2 focus:ring-indigo-500 h-[50px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Giorno di Inizio</label>
                    <input 
                      type="date" 
                      value={newFlowData.date} 
                      onChange={e => {
                        const newStart = e.target.value;
                        setNewFlowData(prev => ({
                          ...prev, 
                          date: newStart,
                          endDate: newStart > prev.endDate ? newStart : prev.endDate
                        }));
                      }}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 h-[50px]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Giorno di Fine</label>
                    <input 
                      type="date" 
                      min={newFlowData.date}
                      value={newFlowData.endDate} 
                      onChange={e => setNewFlowData({...newFlowData, endDate: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 h-[50px]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Cassa Iniziale (€)</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="0,00"
                      value={newFlowData.initialCash} 
                      onChange={e => setNewFlowData({...newFlowData, initialCash: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-4 pr-8 py-3 text-sm font-black text-indigo-600 outline-none focus:ring-2 focus:ring-indigo-500 h-[50px]"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-black text-slate-300">€</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  disabled={isSaving}
                  onClick={() => setIsCreationModalOpen(false)} 
                  className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 rounded-2xl transition-all h-[50px]"
                >
                  Annulla
                </button>
                <button 
                  disabled={isCreateDisabled}
                  onClick={handleCreateNewFlow}
                  className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-500 transition-all active:scale-95 h-[50px] disabled:opacity-50 disabled:active:scale-100"
                >
                  {isSaving ? 'CREAZIONE...' : 'CREA'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="p-8 space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Parametri Cashflow</h3>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Configura il monitoraggio finanziario</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Data Inizio</label>
                  <input type="date" value={editingSettings.startDate} onChange={e => setEditingSettings({...editingSettings, startDate: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 h-[50px]" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Data Fine</label>
                  <input type="date" value={editingSettings.endDate} onChange={e => setEditingSettings({...editingSettings, endDate: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 h-[50px]" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Cassa Iniziale (€)</label>
                <input type="number" value={editingSettings.initialCash} onChange={e => setEditingSettings({...editingSettings, initialCash: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-black text-indigo-600 outline-none focus:ring-2 focus:ring-indigo-500 h-[50px]" />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Soglia Allarme (€)</label>
                <input type="number" value={editingSettings.threshold} onChange={e => setEditingSettings({...editingSettings, threshold: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-black text-red-500 outline-none focus:ring-2 focus:ring-indigo-500 h-[50px]" />
              </div>

              <div className="pt-4 flex gap-3">
                <button onClick={() => setEditingSettings(null)} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 rounded-2xl transition-all h-[50px]">Annulla</button>
                <button onClick={saveSettings} className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-500 transition-all h-[50px]">Apri Dashboard</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashflowHome;