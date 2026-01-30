import React, { useState, useEffect, useMemo, useRef } from 'react';
import { CashflowSettings, CashflowMovement } from '../../types/cashflow';
import { exportCashflowPdf } from '../../utils/exportCashflowPdf';

const SETTINGS_KEY_PREFIX = 'nccf_settings_';
const MOVEMENTS_KEY_PREFIX = 'nccf_movements_';
const ARCHIVE_KEY = 'nicobudget_archive_v1';

const CashflowDashboard: React.FC<{ productionId: string, onBack: () => void }> = ({ productionId, onBack }) => {
  const [settings, setSettings] = useState<CashflowSettings | null>(null);
  const [movements, setMovements] = useState<CashflowMovement[]>([]);
  const [currentDate, setCurrentDate] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  
  // Stati per la gestione dei movimenti
  const [newMove, setNewMove] = useState<Partial<CashflowMovement>>({ type: 'out', amount: 0, category: 'Varie', note: '' });
  const [movementToDelete, setMovementToDelete] = useState<CashflowMovement | null>(null);
  const [viewingMovement, setViewingMovement] = useState<CashflowMovement | null>(null);

  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const s = localStorage.getItem(`${SETTINGS_KEY_PREFIX}${productionId}`);
    const m = localStorage.getItem(`${MOVEMENTS_KEY_PREFIX}${productionId}`);
    if (s) {
      const parsed = JSON.parse(s);
      setSettings(parsed);
      setCurrentDate(parsed.startDate);
    }
    if (m) setMovements(JSON.parse(m));
  }, [productionId]);

  // Calcolo del budget speso fino alla data corrente selezionata
  const spentSoFar = useMemo(() => {
    return movements
      .filter(m => m.date <= currentDate && m.type === 'out')
      .reduce((sum, m) => sum + m.amount, 0);
  }, [movements, currentDate]);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = window.setInterval(() => {
        setCurrentDate(prev => {
          const next = new Date(prev);
          next.setDate(next.getDate() + 1);
          const nextStr = next.toISOString().split('T')[0];
          if (settings && nextStr > settings.endDate) {
            setIsPlaying(false);
            return prev;
          }
          return nextStr;
        });
      }, 1000 / speed);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPlaying, speed, settings]);

  const handleSaveMovement = () => {
    let nextMovements: CashflowMovement[];
    
    if (newMove.id) {
      // MODIFICA
      nextMovements = movements.map(m => m.id === newMove.id ? { 
        ...m, 
        amount: Number(newMove.amount) || 0,
        type: newMove.type as 'in' | 'out',
        category: newMove.category || 'Varie',
        note: newMove.note || ''
      } : m);
    } else {
      // CREAZIONE
      const m: CashflowMovement = {
        id: Math.random().toString(36).substr(2, 9),
        date: currentDate,
        amount: Number(newMove.amount) || 0,
        type: newMove.type as 'in' | 'out',
        category: newMove.category || 'Varie',
        note: newMove.note || ''
      };
      nextMovements = [...movements, m];
    }

    setMovements(nextMovements);
    localStorage.setItem(`${MOVEMENTS_KEY_PREFIX}${productionId}`, JSON.stringify(nextMovements));
    setShowAddModal(false);
    setNewMove({ type: 'out', amount: 0, category: 'Varie', note: '' });
  };

  const handleOpenEdit = (m: CashflowMovement) => {
    setNewMove(m);
    setShowAddModal(true);
  };

  const handleOpenAdd = () => {
    setNewMove({ type: 'out', amount: 0, category: 'Varie', note: '' });
    setShowAddModal(true);
  };

  const handlePrintReport = async () => {
    if (!settings) return;
    setIsGeneratingReport(true);
    
    try {
      // Recupero il titolo della produzione dall'archivio
      const archiveRaw = localStorage.getItem(ARCHIVE_KEY);
      let productionTitle = "PRODUZIONE SENZA TITOLO";
      if (archiveRaw) {
        const archive = JSON.parse(archiveRaw);
        const entry = archive.find((e: any) => e.id === productionId);
        if (entry) productionTitle = entry.title;
      }

      exportCashflowPdf({
        productionTitle,
        settings,
        movements
      });
    } catch (err) {
      console.error("Errore generazione report:", err);
      alert("Si è verificato un errore durante la generazione del report.");
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const confirmDelete = () => {
    if (!movementToDelete) return;
    const next = movements.filter(x => x.id !== movementToDelete.id);
    setMovements(next);
    localStorage.setItem(`${MOVEMENTS_KEY_PREFIX}${productionId}`, JSON.stringify(next));
    setMovementToDelete(null);
  };

  if (!settings) return null;

  const todaysMovements = movements.filter(m => m.date === currentDate);
  const dayInflow = todaysMovements.filter(m => m.type === 'in').reduce((sum, m) => sum + m.amount, 0);
  const dayOutflow = todaysMovements.filter(m => m.type === 'out').reduce((sum, m) => sum + m.amount, 0);

  return (
    <div className={`h-screen flex flex-col bg-slate-50 font-sans overflow-hidden ${showAddModal || movementToDelete || viewingMovement ? 'overflow-hidden' : ''}`}>
      <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between shadow-sm z-10 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
             <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">SPESO FINORA</span>
             <span className="text-xl font-black mono-font leading-none text-red-600">
               {spentSoFar.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
             </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={handleOpenAdd} 
            title="Aggiungi movimento"
            aria-label="Aggiungi movimento"
            className="w-11 h-11 flex items-center justify-center bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-500 active:scale-95 transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
          </button>
          <button 
            onClick={handlePrintReport} 
            disabled={isGeneratingReport}
            title="Stampa report cashflow"
            aria-label="Stampa report cashflow"
            className="w-11 h-11 flex items-center justify-center bg-white text-slate-600 border border-slate-200 rounded-2xl shadow-sm hover:bg-slate-50 active:scale-95 transition-all disabled:opacity-50"
          >
            {isGeneratingReport ? (
               <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            )}
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
        {/* Playhead Controls */}
        <div className="bg-white px-6 py-5 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="flex items-center justify-center gap-4 md:gap-6">
            <button 
              onClick={() => {
                const d = new Date(currentDate); 
                d.setDate(d.getDate() - 1);
                const dStr = d.toISOString().split('T')[0];
                if (dStr >= settings.startDate) setCurrentDate(dStr);
              }} 
              className="w-12 h-12 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-white border border-slate-100 rounded-2xl transition-all active:scale-90 shadow-sm"
              title="Giorno Precedente"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.445 14.832A1 1 0 0010 14V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4zM16.445 14.832A1 1 0 0018 14V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z"/>
              </svg>
            </button>

            <button 
              onClick={() => setIsPlaying(!isPlaying)} 
              className={`w-14 h-14 flex items-center justify-center rounded-2xl shadow-xl transition-all active:scale-95 ${isPlaying ? 'bg-indigo-100 text-indigo-600 border border-indigo-200' : 'bg-indigo-600 text-white shadow-indigo-200'}`}
              title={isPlaying ? "Pausa" : "Play"}
            >
              {isPlaying ? (
                <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              )}
            </button>

            <button 
              onClick={() => {
                const d = new Date(currentDate); 
                d.setDate(d.getDate() + 1);
                const dStr = d.toISOString().split('T')[0];
                if (dStr <= settings.endDate) setCurrentDate(dStr);
              }} 
              className="w-12 h-12 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-white border border-slate-100 rounded-2xl transition-all active:scale-90 shadow-sm"
              title="Giorno Successivo"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4zM11.555 5.168A1 1 0 0010 6v8a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4z"/>
              </svg>
            </button>
          </div>

          <div className="flex flex-col items-center">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">
               {new Date(currentDate).toLocaleDateString('it-IT', { weekday: 'long' })}
             </span>
             <h4 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter mono-font leading-none">
               {new Date(currentDate).toLocaleDateString('it-IT')}
             </h4>
          </div>

          <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            {[1, 2, 4].map(s => (
              <button 
                key={s} 
                onClick={() => setSpeed(s)} 
                className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${speed === s ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {s}X
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tighter">Movimenti del Giorno</h3>
            <div className="flex gap-6">
               <div className="flex flex-col items-end">
                 <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Inflow</span>
                 <span className="text-xs font-bold text-slate-700">+{dayInflow.toLocaleString()} €</span>
               </div>
               <div className="flex flex-col items-end">
                 <span className="text-[8px] font-black text-red-500 uppercase tracking-widest">Outflow</span>
                 <span className="text-xs font-bold text-slate-700">-{dayOutflow.toLocaleString()} €</span>
               </div>
            </div>
          </div>
          
          <div className="space-y-3">
            {todaysMovements.length === 0 && (
              <div className="text-center py-12 bg-slate-50/30 rounded-3xl border border-dashed border-slate-100">
                <p className="text-slate-300 text-[10px] uppercase font-black tracking-[0.2em] italic">Nessun movimento registrato</p>
              </div>
            )}
            {todaysMovements.map(m => (
              <div 
                key={m.id} 
                onClick={() => setViewingMovement(m)}
                className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 group transition-all hover:shadow-md hover:border-indigo-100 cursor-pointer"
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${m.type === 'in' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                    {m.type === 'in' ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none block mb-0.5 truncate">{m.category}</span>
                    <h5 className="text-sm font-bold text-slate-800 leading-tight truncate">{m.note}</h5>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 shrink-0 ml-4">
                  <span className={`text-sm font-black mono-font whitespace-nowrap tabular-nums leading-none ${m.type === 'in' ? 'text-emerald-600' : 'text-red-600'}`}>
                    {m.type === 'in' ? '+' : '-'}{m.amount.toLocaleString('it-IT')}€
                  </span>
                  
                  <div className="flex flex-col items-center gap-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button 
                      onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleOpenEdit(m); }} 
                      className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-indigo-600 transition-all"
                      title="Modifica"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setMovementToDelete(m);
                      }} 
                      className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-red-500 transition-all"
                      title="Elimina"
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
      </div>

      {/* Add/Edit Movement Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="p-8 space-y-6">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter text-center">
                {newMove.id ? 'Modifica Movimento' : 'Nuovo Movimento'}
              </h3>
              
              <div className="flex bg-gray-100 p-1 rounded-2xl">
                <button 
                  onClick={() => setNewMove({...newMove, type: 'in'})} 
                  aria-pressed={newMove.type === 'in'}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all duration-200 ${
                    newMove.type === 'in' 
                      ? 'bg-green-600 text-white shadow-md hover:bg-green-700' 
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                  }`}
                >
                  ENTRATA
                </button>
                <button 
                  onClick={() => setNewMove({...newMove, type: 'out'})} 
                  aria-pressed={newMove.type === 'out'}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all duration-200 ${
                    newMove.type === 'out' 
                      ? 'bg-red-600 text-white shadow-md hover:bg-red-700' 
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                  }`}
                >
                  USCITA
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Importo (€)</label>
                <input 
                  type="number" 
                  autoFocus
                  value={newMove.amount || ''} 
                  onChange={e => setNewMove({...newMove, amount: Number(e.target.value)})} 
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-lg font-black outline-none focus:ring-2 focus:ring-indigo-500 transition-all h-[54px]" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Nota</label>
                <input 
                  type="text" 
                  value={newMove.note} 
                  onChange={e => setNewMove({...newMove, note: e.target.value})} 
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all h-[54px]" 
                  placeholder="Causale..." 
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button onClick={() => setShowAddModal(false)} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 rounded-2xl transition-all h-[54px]">Chiudi</button>
                <button onClick={handleSaveMovement} className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-500 active:scale-95 transition-all h-[54px]">
                  {newMove.id ? 'AGGIORNA' : 'SALVA'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Conferma Eliminazione */}
      {movementToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setMovementToDelete(null)}>
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="p-8 space-y-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Eliminare movimento?</h3>
                <p className="text-slate-500 text-xs font-medium leading-relaxed">
                  Sei sicuro di voler eliminare questo movimento? Questa azione è irreversibile e influirà sul saldo della produzione.
                </p>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setMovementToDelete(null)} 
                  className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 rounded-2xl transition-all h-[54px]"
                >
                  Annulla
                </button>
                <button 
                  onClick={confirmDelete} 
                  className="flex-[2] py-4 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-red-100 hover:bg-red-500 active:scale-95 transition-all h-[54px]"
                >
                  Elimina
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Dettaglio Movimento (Read Only) */}
      {viewingMovement && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setViewingMovement(null)}>
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Dettaglio movimento</h3>
                <button onClick={() => setViewingMovement(null)} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tipo</span>
                  <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full ${viewingMovement.type === 'in' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                    {viewingMovement.type === 'in' ? 'Entrata' : 'Uscita'}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nota / Causale</span>
                  <p className="text-sm font-bold text-slate-800 leading-tight bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {viewingMovement.note || 'Nessuna nota aggiuntiva'}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-slate-50 pt-4">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Importo</span>
                  <span className={`text-lg font-black mono-font ${viewingMovement.type === 'in' ? 'text-emerald-600' : 'text-red-600'}`}>
                    {viewingMovement.type === 'in' ? '+' : '-'}{viewingMovement.amount.toLocaleString('it-IT')}€
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Data</span>
                  <span className="text-xs font-bold text-slate-600">
                    {new Date(viewingMovement.date).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Categoria</span>
                  <span className="text-xs font-bold text-slate-600">{viewingMovement.category}</span>
                </div>
              </div>

              <div className="pt-2">
                <button 
                  onClick={() => setViewingMovement(null)} 
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 active:scale-95 transition-all h-[54px]"
                >
                  Chiudi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashflowDashboard;