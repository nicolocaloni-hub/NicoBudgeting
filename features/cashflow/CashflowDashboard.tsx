import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, ReferenceLine, AreaChart, Area 
} from 'recharts';
import { CashflowSettings, CashflowMovement, DailyBalance } from '../../types/cashflow';
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
  const [showFormModal, setShowFormModal] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  
  // Stato per il titolo editabile
  const [productionTitle, setProductionTitle] = useState('PROGETTO');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState('');
  const titleContainerRef = useRef<HTMLDivElement>(null);
  
  // Stato per dettaglio e editing movimenti
  const [selectedMovement, setSelectedMovement] = useState<CashflowMovement | null>(null);
  const [movementToEdit, setMovementToEdit] = useState<CashflowMovement | null>(null);

  const [formData, setFormData] = useState<Partial<CashflowMovement>>({
    type: 'out',
    amount: 0,
    category: 'Varie',
    note: ''
  });

  const timerRef = useRef<number | null>(null);

  // Gestione tasto ESC e Click Outside per titoli e modali
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedMovement) setSelectedMovement(null);
        if (showFormModal) setShowFormModal(false);
        if (isEditingTitle) {
          setIsEditingTitle(false);
          setTempTitle(productionTitle);
        }
      }
    };

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (isEditingTitle && titleContainerRef.current && !titleContainerRef.current.contains(event.target as Node)) {
        handleSaveTitle();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [selectedMovement, showFormModal, isEditingTitle, productionTitle]);

  useEffect(() => {
    const savedSettings = localStorage.getItem(`${SETTINGS_KEY_PREFIX}${productionId}`);
    const savedMovements = localStorage.getItem(`${MOVEMENTS_KEY_PREFIX}${productionId}`);
    const archive = localStorage.getItem(ARCHIVE_KEY);

    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings);
      setSettings(parsedSettings);
      
      // Inizializza currentDate con today se è nel range, altrimenti usa startDate
      const today = new Date().toISOString().split('T')[0];
      if (today >= parsedSettings.startDate && today <= parsedSettings.endDate) {
        setCurrentDate(today);
      } else {
        setCurrentDate(parsedSettings.startDate);
      }
    }
    
    if (savedMovements) setMovements(JSON.parse(savedMovements));
    
    if (archive) {
      const prod = JSON.parse(archive).find((p: any) => p.id === productionId);
      if (prod) {
        setProductionTitle(prod.title);
        setTempTitle(prod.title);
      }
    }
  }, [productionId]);

  const handleSaveTitle = () => {
    const trimmed = tempTitle.trim();
    if (trimmed && trimmed !== productionTitle) {
      setProductionTitle(trimmed);
      const archiveRaw = localStorage.getItem(ARCHIVE_KEY);
      if (archiveRaw) {
        try {
          const archive = JSON.parse(archiveRaw);
          const updatedArchive = archive.map((p: any) => 
            p.id === productionId ? { ...p, title: trimmed } : p
          );
          localStorage.setItem(ARCHIVE_KEY, JSON.stringify(updatedArchive));
        } catch (e) {
          console.error("Errore salvataggio titolo nell'archivio:", e);
        }
      }
    } else {
      setTempTitle(productionTitle);
    }
    setIsEditingTitle(false);
  };

  const dailyBalances = useMemo(() => {
    if (!settings) return [];
    
    const balances: DailyBalance[] = [];
    let runningBalance = settings.initialCash;
    
    let current = new Date(settings.startDate);
    const end = new Date(settings.endDate);
    
    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      const dayMovements = movements.filter(m => m.date === dateStr);
      
      const inflow = dayMovements.filter(m => m.type === 'in').reduce((sum, m) => sum + m.amount, 0);
      const outflow = dayMovements.filter(m => m.type === 'out').reduce((sum, m) => sum + m.amount, 0);
      
      runningBalance += (inflow - outflow);
      
      balances.push({
        date: dateStr,
        balance: runningBalance,
        inflow,
        outflow,
        isThresholdBreached: runningBalance < settings.threshold
      });
      
      current.setDate(current.getDate() + 1);
    }
    
    return balances;
  }, [settings, movements]);

  const stats = useMemo(() => {
    const totalIn = movements.reduce((sum, m) => m.type === 'in' ? sum + m.amount : sum, 0);
    const totalOut = movements.reduce((sum, m) => m.type === 'out' ? sum + m.amount : sum, 0);
    const initialCash = settings?.initialCash || 0;
    const budgetResiduo = initialCash + totalIn - totalOut;
    
    return {
      totalOut,
      budgetResiduo
    };
  }, [settings, movements]);

  // Navigazione Giorno
  const navigateDay = (offset: number) => {
    if (!settings) return;
    const current = new Date(currentDate);
    current.setDate(current.getDate() + offset);
    const nextStr = current.toISOString().split('T')[0];
    
    if (nextStr >= settings.startDate && nextStr <= settings.endDate) {
      setCurrentDate(nextStr);
    }
  };

  // Movimenti filtrati per il giorno selezionato
  const dailyMovements = useMemo(() => {
    return movements.filter(m => m.date === currentDate);
  }, [movements, currentDate]);

  const handlePlayToggle = () => {
    if (isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      timerRef.current = window.setInterval(() => {
        setCurrentDate(prev => {
          const nextDate = new Date(prev);
          nextDate.setDate(nextDate.getDate() + 1);
          const nextStr = nextDate.toISOString().split('T')[0];
          if (settings && nextStr > settings.endDate) {
            clearInterval(timerRef.current!);
            setIsPlaying(false);
            return prev;
          }
          return nextStr;
        });
      }, 1000 / speed);
    }
  };

  const handleSaveMovement = () => {
    if (!formData.amount || formData.amount <= 0) return;
    
    let nextMovements: CashflowMovement[];
    
    if (movementToEdit) {
      nextMovements = movements.map(m => m.id === movementToEdit.id ? {
        ...m,
        amount: Number(formData.amount),
        type: formData.type as 'in' | 'out',
        category: formData.category || 'Varie',
        note: formData.note || ''
      } : m);
    } else {
      const move: CashflowMovement = {
        id: Math.random().toString(36).substr(2, 9),
        date: currentDate,
        amount: Number(formData.amount),
        type: formData.type as 'in' | 'out',
        category: formData.category || 'Varie',
        note: formData.note || ''
      };
      nextMovements = [...movements, move];
    }
    
    setMovements(nextMovements);
    localStorage.setItem(`${MOVEMENTS_KEY_PREFIX}${productionId}`, JSON.stringify(nextMovements));
    setShowFormModal(false);
    setMovementToEdit(null);
    setFormData({ type: 'out', amount: 0, category: 'Varie', note: '' });
  };

  const handleDeleteMovement = (id: string) => {
    if (confirm("Sei sicuro di voler eliminare questo movimento?")) {
      const next = movements.filter(m => m.id !== id);
      setMovements(next);
      localStorage.setItem(`${MOVEMENTS_KEY_PREFIX}${productionId}`, JSON.stringify(next));
    }
  };

  const startEdit = (m: CashflowMovement) => {
    setMovementToEdit(m);
    setFormData({
      amount: m.amount,
      type: m.type,
      category: m.category,
      note: m.note
    });
    setShowFormModal(true);
  };

  const handlePrint = () => {
    if (!settings) return;
    setIsGeneratingReport(true);
    try {
      const { doc, fileName } = exportCashflowPdf({
        productionTitle,
        settings,
        movements
      });
      doc.save(fileName);
    } catch (error) {
      console.error("PDF Export error:", error);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleShare = async () => {
    if (!settings) return;
    setIsSharing(true);
    try {
      const { doc, fileName } = exportCashflowPdf({
        productionTitle,
        settings,
        movements
      });
      const pdfBlob = doc.output('blob');
      const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });
      if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        await navigator.share({
          files: [pdfFile],
          title: `Report Cashflow: ${productionTitle}`,
          text: `In allegato il report cashflow aggiornato per ${productionTitle}.`
        });
      } else {
        doc.save(fileName);
        alert(`La condivisione file non è supportata dal tuo browser. Il file è stato scaricato: condividilo manualmente.`);
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') alert("Errore durante la condivisione del report.");
    } finally {
      setIsSharing(false);
    }
  };

  if (!settings) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header / Toolbar */}
      <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <button onClick={onBack} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 border border-transparent hover:border-slate-200 transition-all shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          
          <div ref={titleContainerRef} className="flex flex-col min-w-0 flex-1 group">
            {isEditingTitle ? (
              <input
                autoFocus
                type="text"
                value={tempTitle}
                maxLength={60}
                onChange={(e) => setTempTitle(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveTitle();
                }}
                onBlur={handleSaveTitle}
                className="text-sm md:text-lg font-black text-slate-900 uppercase tracking-tighter bg-slate-50 border-b-2 border-indigo-500 outline-none w-full max-w-[400px]"
                aria-label="Rinomina Cashflow"
              />
            ) : (
              <h1 
                onClick={() => { setIsEditingTitle(true); setTempTitle(productionTitle); }}
                className="text-sm md:text-lg font-black text-slate-900 uppercase tracking-tighter truncate max-w-full md:max-w-[400px] cursor-pointer hover:text-indigo-600 transition-colors"
              >
                {productionTitle}
              </h1>
            )}
            <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">Dashboard Cashflow</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-4">
          <button onClick={() => { setMovementToEdit(null); setFormData({type: 'out', amount: 0, category: 'Varie', note: ''}); setShowFormModal(true); }} className="w-10 h-10 flex items-center justify-center bg-white text-emerald-600 border border-emerald-100 rounded-xl hover:bg-emerald-50 transition-all active:scale-90 shadow-sm"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg></button>
          <button onClick={handlePrint} className="w-10 h-10 flex items-center justify-center bg-white text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all active:scale-90 shadow-sm"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg></button>
          <button onClick={handleShare} className="w-10 h-10 flex items-center justify-center bg-white text-indigo-600 border border-indigo-200 rounded-xl hover:bg-indigo-50 transition-all active:scale-90 shadow-sm">{isSharing ? <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>}</button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
        {/* KPI */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Uscite Totali</span>
            <p className="text-xl font-black mono-font text-red-500">-{stats.totalOut.toLocaleString('it-IT')}€</p>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Budget Residuo</span>
            <p className={`text-xl font-black mono-font ${stats.budgetResiduo < settings.threshold ? 'text-red-500' : 'text-slate-900'}`}>{stats.budgetResiduo.toLocaleString('it-IT')}€</p>
          </div>
        </div>

        {/* Chart Section */}
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm h-[400px] flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex flex-col">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Proiezione Cashflow</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(currentDate).toLocaleDateString('it-IT', { dateStyle: 'full' })}</p>
            </div>
            <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-100">
               <button onClick={handlePlayToggle} className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all shadow-sm ${isPlaying ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400 hover:text-indigo-600'}`}>{isPlaying ? <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg> : <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>}</button>
               <select value={speed} onChange={e => setSpeed(Number(e.target.value))} className="bg-transparent text-[10px] font-black text-indigo-600 uppercase tracking-widest outline-none border-none p-0 focus:ring-0 cursor-pointer">
                 <option value={1}>1x</option>
                 <option value={2}>2x</option>
                 <option value={5}>5x</option>
               </select>
            </div>
          </div>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyBalances} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs><linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/><stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" hide={true} />
                <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} tickFormatter={(val) => `${(val/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} labelStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', color: '#64748b' }} />
                <Area type="monotone" dataKey="balance" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorBalance)" />
                <ReferenceLine y={settings.threshold} stroke="#ef4444" strokeDasharray="5 5" />
                <ReferenceLine x={currentDate} stroke="#1e293b" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* BARRA NAVIGAZIONE GIORNO */}
        <div className="flex items-center justify-between bg-white px-4 py-3 rounded-2xl border border-slate-100 shadow-sm">
          <button 
            onClick={() => navigateDay(-1)} 
            disabled={currentDate <= settings.startDate}
            aria-label="Giorno precedente"
            className="p-2 text-slate-400 hover:text-indigo-600 disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-90"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
          </button>
          
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-0.5">Vista Giornaliera</span>
            <span className="text-xs font-black text-slate-900 uppercase">
              {new Date(currentDate).toLocaleDateString('it-IT', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })}
            </span>
          </div>

          <button 
            onClick={() => navigateDay(1)} 
            disabled={currentDate >= settings.endDate}
            aria-label="Giorno successivo"
            className="p-2 text-slate-400 hover:text-indigo-600 disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-90"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>

        {/* Cronologia Movimenti */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Movimenti del Giorno</h3>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{dailyMovements.length} Operazioni</span>
          </div>
          
          <div className="space-y-3 pb-24">
            {dailyMovements.length === 0 && (
              <div className="py-20 text-center bg-white rounded-[2rem] border-2 border-dashed border-slate-200">
                <p className="text-slate-300 italic text-[10px] uppercase tracking-widest font-black">Nessun movimento registrato oggi</p>
              </div>
            )}
            {dailyMovements.map(m => (
              <div key={m.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group active:bg-slate-50 transition-colors">
                <div className="flex-1 min-w-0 cursor-pointer mr-4" onClick={() => setSelectedMovement(m)}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="px-2 py-0.5 bg-slate-50 rounded text-[9px] font-black text-slate-500 uppercase tracking-widest border border-slate-100 truncate max-w-[150px]">{m.category}</span>
                  </div>
                  <p className="text-xs font-bold text-slate-700 leading-snug line-clamp-2 mb-1.5">{m.note || 'Nessuna nota descrittiva'}</p>
                  <p className={`text-sm font-black mono-font ${m.type === 'in' ? 'text-emerald-500' : 'text-red-500'}`}>
                    {m.type === 'in' ? '+' : '-'}{m.amount.toLocaleString('it-IT')}€
                  </p>
                </div>
                <div className="flex flex-col gap-1 border-l border-slate-50 pl-2 shrink-0">
                  <button onClick={(e) => { e.stopPropagation(); startEdit(m); }} className="p-2.5 text-slate-200 hover:text-indigo-600 transition-all active:scale-90" aria-label="Modifica">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteMovement(m.id); }} className="p-2.5 text-slate-200 hover:text-red-500 transition-all active:scale-90" aria-label="Elimina">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal Dettaglio Movimento */}
      {selectedMovement && (
        <div 
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px] animate-in fade-in duration-300" 
          onClick={() => setSelectedMovement(null)}
        >
          <div 
            className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto" 
            onClick={e => e.stopPropagation()}
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dettaglio Movimento</span>
                  <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight">{selectedMovement.category}</h4>
                </div>
                <div className={`text-xl font-black mono-font ${selectedMovement.type === 'in' ? 'text-emerald-500' : 'text-red-500'}`}>
                  {selectedMovement.type === 'in' ? '+' : '-'}{selectedMovement.amount.toLocaleString('it-IT')}€
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">Data</span>
                  <p className="text-xs font-bold text-slate-900">{new Date(selectedMovement.date).toLocaleDateString('it-IT', { dateStyle: 'full' })}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">Tipo</span>
                  <p className={`text-xs font-bold ${selectedMovement.type === 'in' ? 'text-emerald-600' : 'text-red-500'}`}>
                    {selectedMovement.type === 'in' ? 'ENTRATA' : 'USCITA'}
                  </p>
                </div>
              </div>
              
              <div className="bg-slate-50 p-6 rounded-3xl">
                <span className="text-[9px] font-black text-slate-400 uppercase block mb-2">Note / Descrizione</span>
                <p className="text-sm font-medium text-slate-600 leading-relaxed italic">{selectedMovement.note || 'Nessuna descrizione inserita.'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form Add/Edit Modal */}
      {showFormModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="p-8 space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">{movementToEdit ? 'Modifica Movimento' : 'Aggiungi Movimento'}</h3>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">{movementToEdit ? 'Aggiorna i dati della transazione' : 'Registra una nuova operazione'}</p>
              </div>
              <div className="space-y-4">
                <div className="flex p-1 bg-slate-100 rounded-2xl">
                  <button onClick={() => setFormData({...formData, type: 'in'})} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${formData.type === 'in' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}>Entrata (+)</button>
                  <button onClick={() => setFormData({...formData, type: 'out'})} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${formData.type === 'out' ? 'bg-white text-red-500 shadow-sm' : 'text-slate-400'}`}>Uscita (-)</button>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Importo (€)</label>
                  <input type="number" placeholder="0,00" value={formData.amount || ''} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-black text-indigo-600 h-[50px] outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Categoria</label>
                  <input type="text" placeholder="es: Personale, Trasporti..." value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-black h-[50px] outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Nota / Descrizione</label>
                  <input type="text" placeholder="Dettagli movimento..." value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold h-[50px] outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button onClick={() => { setShowFormModal(false); setMovementToEdit(null); }} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 rounded-2xl h-[50px] transition-all">Annulla</button>
                <button onClick={handleSaveMovement} className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-500 active:scale-95 h-[50px] transition-all">{movementToEdit ? 'Aggiorna' : 'Registra'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashflowDashboard;