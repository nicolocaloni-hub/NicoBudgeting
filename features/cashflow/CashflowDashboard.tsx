import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
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
  const [showAddModal, setShowAddModal] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [productionTitle, setProductionTitle] = useState('PROGETTO');

  const [newMovement, setNewMovement] = useState<Partial<CashflowMovement>>({
    type: 'out',
    amount: 0,
    category: 'Varie',
    note: ''
  });

  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const savedSettings = localStorage.getItem(`${SETTINGS_KEY_PREFIX}${productionId}`);
    const savedMovements = localStorage.getItem(`${MOVEMENTS_KEY_PREFIX}${productionId}`);
    const archive = localStorage.getItem(ARCHIVE_KEY);

    if (savedSettings) setSettings(JSON.parse(savedSettings));
    if (savedMovements) setMovements(JSON.parse(savedMovements));
    
    if (archive) {
      const prod = JSON.parse(archive).find((p: any) => p.id === productionId);
      if (prod) setProductionTitle(prod.title);
    }

    const today = new Date().toISOString().split('T')[0];
    setCurrentDate(today);
  }, [productionId]);

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
    const todayIndex = dailyBalances.findIndex(b => b.date === currentDate);
    const todayData = dailyBalances[todayIndex] || { balance: 0 };
    
    const totalIn = movements.reduce((sum, m) => m.type === 'in' ? sum + m.amount : sum, 0);
    const totalOut = movements.reduce((sum, m) => m.type === 'out' ? sum + m.amount : sum, 0);
    
    return {
      currentBalance: todayData.balance,
      totalIn,
      totalOut,
      net: totalIn - totalOut
    };
  }, [dailyBalances, currentDate, movements]);

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

  const handleAddMovement = () => {
    if (!newMovement.amount || newMovement.amount <= 0) return;
    
    const move: CashflowMovement = {
      id: Math.random().toString(36).substr(2, 9),
      date: currentDate,
      amount: Number(newMovement.amount),
      type: newMovement.type as 'in' | 'out',
      category: newMovement.category || 'Varie',
      note: newMovement.note || ''
    };
    
    const nextMovements = [...movements, move];
    setMovements(nextMovements);
    localStorage.setItem(`${MOVEMENTS_KEY_PREFIX}${productionId}`, JSON.stringify(nextMovements));
    setShowAddModal(false);
    setNewMovement({ type: 'out', amount: 0, category: 'Varie', note: '' });
  };

  const handleDeleteMovement = (id: string) => {
    const next = movements.filter(m => m.id !== id);
    setMovements(next);
    localStorage.setItem(`${MOVEMENTS_KEY_PREFIX}${productionId}`, JSON.stringify(next));
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
        alert(`La condivisione file non è supportata dal tuo browser. Il file è stato scaricato: condividilo manualmente (es. tramite WhatsApp).`);
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error("Share error:", error);
        alert("Errore durante la condivisione del report.");
      }
    } finally {
      setIsSharing(false);
    }
  };

  if (!settings) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header / Toolbar */}
      <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 border border-transparent hover:border-slate-200 transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div className="flex flex-col">
            <h1 className="text-sm md:text-lg font-black text-slate-900 uppercase tracking-tighter truncate max-w-[150px] md:max-w-[300px]">{productionTitle}</h1>
            <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">Dashboard Cashflow</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            disabled={isGeneratingReport || isSharing}
            onClick={() => setShowAddModal(true)} 
            aria-label="Aggiungi movimento"
            className="w-10 h-10 flex items-center justify-center bg-white text-emerald-600 border border-emerald-100 rounded-xl hover:bg-emerald-50 transition-all active:scale-90 shadow-sm disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
          </button>
          
          <button 
            disabled={isGeneratingReport || isSharing}
            onClick={handlePrint} 
            aria-label="Stampa report cashflow"
            className="w-10 h-10 flex items-center justify-center bg-white text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all active:scale-90 shadow-sm disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
          </button>

          <button 
            disabled={isGeneratingReport || isSharing}
            onClick={handleShare} 
            aria-label="Condividi report cashflow"
            className="w-10 h-10 flex items-center justify-center bg-white text-indigo-600 border border-indigo-200 rounded-xl hover:bg-indigo-50 transition-all active:scale-90 shadow-sm disabled:opacity-50"
          >
            {isSharing ? (
              <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
            )}
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
        {/* Main Stats - Aggiornata a grid-cols-2 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Uscite Totali</span>
            <p className="text-xl font-black mono-font text-red-500">
              -{stats.totalOut.toLocaleString('it-IT')}€
            </p>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Budget Residuo</span>
            <p className="text-xl font-black mono-font text-slate-900">
              {stats.net.toLocaleString('it-IT')}€
            </p>
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
               <button onClick={handlePlayToggle} className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all shadow-sm ${isPlaying ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400 hover:text-indigo-600'}`}>
                 {isPlaying ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                 ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                 )}
               </button>
               <div className="flex flex-col">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Velocità</span>
                  <select value={speed} onChange={e => setSpeed(Number(e.target.value))} className="bg-transparent text-[10px] font-black text-indigo-600 uppercase tracking-widest outline-none border-none p-0 focus:ring-0">
                    <option value={1}>1x Normale</option>
                    <option value={2}>2x Veloce</option>
                    <option value={5}>5x Ultra</option>
                  </select>
               </div>
            </div>
          </div>

          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyBalances} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  hide={true}
                />
                <YAxis 
                  domain={['auto', 'auto']}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                  tickFormatter={(val) => `${(val/1000).toFixed(0)}k`}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', color: '#64748b' }}
                />
                <Area type="monotone" dataKey="balance" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorBalance)" />
                <ReferenceLine y={settings.threshold} stroke="#ef4444" strokeDasharray="5 5" label={{ value: 'SOGLIA', position: 'insideTopRight', fill: '#ef4444', fontSize: 10, fontWeight: 900 }} />
                <ReferenceLine x={currentDate} stroke="#1e293b" strokeWidth={2} label={{ value: 'OGGI', position: 'top', fill: '#1e293b', fontSize: 10, fontWeight: 900 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Details & Movement List */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Cronologia Movimenti</h3>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{movements.length} Operazioni</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50">
                  <th className="px-6 py-4">Data</th>
                  <th className="px-6 py-4">Categoria</th>
                  <th className="px-6 py-4">Nota</th>
                  <th className="px-6 py-4 text-right">Importo</th>
                  <th className="px-6 py-4 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {movements.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center text-slate-300 italic text-xs uppercase tracking-widest font-black">Nessun movimento registrato</td>
                  </tr>
                )}
                {movements.sort((a,b) => b.date.localeCompare(a.date)).map(m => (
                  <tr key={m.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4 text-xs font-bold text-slate-400 whitespace-nowrap">{new Date(m.date).toLocaleDateString('it-IT')}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-slate-100 rounded-lg text-[9px] font-black text-slate-600 uppercase tracking-widest">{m.category}</span>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-600 truncate max-w-[200px]">{m.note || '-'}</td>
                    <td className={`px-6 py-4 text-right font-black mono-font text-xs ${m.type === 'in' ? 'text-emerald-500' : 'text-red-500'}`}>
                      {m.type === 'in' ? '+' : '-'}{m.amount.toLocaleString('it-IT')}€
                    </td>
                    <td className="px-6 py-4">
                      <button onClick={() => handleDeleteMovement(m.id)} className="p-2 text-slate-200 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Movement Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="p-8 space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Aggiungi Movimento</h3>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Registra una transazione per oggi</p>
              </div>

              <div className="space-y-4">
                <div className="flex p-1 bg-slate-100 rounded-2xl">
                  <button onClick={() => setNewMovement({...newMovement, type: 'in'})} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${newMovement.type === 'in' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}>Entrata (+)</button>
                  <button onClick={() => setNewMovement({...newMovement, type: 'out'})} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${newMovement.type === 'out' ? 'bg-white text-red-500 shadow-sm' : 'text-slate-400'}`}>Uscita (-)</button>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Importo (€)</label>
                  <input type="number" placeholder="0,00" value={newMovement.amount || ''} onChange={e => setNewMovement({...newMovement, amount: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-black text-indigo-600 h-[50px] outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Categoria</label>
                  <input type="text" placeholder="es: Personale, Trasporti, Scenografia..." value={newMovement.category} onChange={e => setNewMovement({...newMovement, category: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-black h-[50px] outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Nota / Descrizione</label>
                  <input type="text" placeholder="Dettagli movimento..." value={newMovement.note} onChange={e => setNewMovement({...newMovement, note: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold h-[50px] outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button onClick={() => setShowAddModal(false)} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 rounded-2xl h-[50px] transition-all">Annulla</button>
                <button onClick={handleAddMovement} className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-500 active:scale-95 h-[50px] transition-all">Registra</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashflowDashboard;