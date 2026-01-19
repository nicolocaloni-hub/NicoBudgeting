import React, { useState, useEffect, useMemo, useRef } from 'react';
import { CashflowSettings, CashflowMovement, DailyBalance } from '../../types/cashflow';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const SETTINGS_KEY_PREFIX = 'nccf_settings_';
const MOVEMENTS_KEY_PREFIX = 'nccf_movements_';

const CashflowDashboard: React.FC<{ productionId: string, onBack: () => void }> = ({ productionId, onBack }) => {
  const [settings, setSettings] = useState<CashflowSettings | null>(null);
  const [movements, setMovements] = useState<CashflowMovement[]>([]);
  const [currentDate, setCurrentDate] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMove, setNewMove] = useState<Partial<CashflowMovement>>({ type: 'out', amount: 0, category: 'Varie', note: '' });

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

  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const movesUpToToday = movements.filter(m => m.date <= todayStr);
    
    const inflow = movesUpToToday.filter(m => m.type === 'in').reduce((sum, m) => sum + m.amount, 0);
    const spent = movesUpToToday.filter(m => m.type === 'out').reduce((sum, m) => sum + m.amount, 0);
    
    return { spent, inflow };
  }, [movements]);

  const dailyBalances = useMemo(() => {
    if (!settings) return [];
    const start = new Date(settings.startDate);
    const end = new Date(settings.endDate);
    const data: DailyBalance[] = [];
    let runningBalance = settings.initialCash;

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dStr = d.toISOString().split('T')[0];
      const dayMoves = movements.filter(m => m.date === dStr);
      const inflow = dayMoves.filter(m => m.type === 'in').reduce((sum, m) => sum + m.amount, 0);
      const outflow = dayMoves.filter(m => m.type === 'out').reduce((sum, m) => sum + m.amount, 0);
      runningBalance += (inflow - outflow);
      
      data.push({
        date: dStr,
        balance: runningBalance,
        inflow,
        outflow,
        isThresholdBreached: runningBalance < settings.threshold
      });
    }
    return data;
  }, [settings, movements]);

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

  const handleAddMovement = () => {
    const m: CashflowMovement = {
      id: Math.random().toString(36).substr(2, 9),
      date: currentDate,
      amount: Number(newMove.amount) || 0,
      type: newMove.type as 'in' | 'out',
      category: newMove.category || 'Varie',
      note: newMove.note || ''
    };
    const next = [...movements, m];
    setMovements(next);
    localStorage.setItem(`${MOVEMENTS_KEY_PREFIX}${productionId}`, JSON.stringify(next));
    setShowAddModal(false);
    setNewMove({ type: 'out', amount: 0, category: 'Varie', note: '' });
  };

  if (!settings) return null;

  const currentDayData = dailyBalances.find(b => b.date === currentDate);
  const todaysMovements = movements.filter(m => m.date === currentDate);

  const dayInflow = todaysMovements.filter(m => m.type === 'in').reduce((sum, m) => sum + m.amount, 0);
  const dayOutflow = todaysMovements.filter(m => m.type === 'out').reduce((sum, m) => sum + m.amount, 0);

  return (
    <div className={`h-screen flex flex-col bg-slate-50 font-sans overflow-hidden ${showAddModal ? 'overflow-hidden' : ''}`}>
      <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between shadow-sm z-10 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
          <div>
             <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">SALDO DISPONIBILE</span>
             <span className={`text-xl font-black mono-font leading-none ${currentDayData?.isThresholdBreached ? 'text-red-500 animate-pulse' : 'text-emerald-600'}`}>
               {currentDayData?.balance.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
             </span>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setShowAddModal(true)} 
            className="bg-indigo-600 text-white px-4 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-indigo-500 shadow-lg shadow-indigo-100 active:scale-95 transition-all min-h-[44px]"
          >
            + MOVIMENTO
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm h-80 relative overflow-hidden">
          <div className="absolute top-6 left-10 z-10">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span> 
              Proiezione Cashflow
            </h3>
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyBalances} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorBal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" hide />
              <YAxis hide domain={['auto', 'auto']} />
              <Tooltip labelStyle={{fontWeight: 900, color: '#4f46e5'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
              <ReferenceLine y={settings.threshold} stroke="#ef4444" strokeDasharray="3 3" />
              <ReferenceLine x={currentDate} stroke="#4f46e5" strokeWidth={2} />
              <Area type="monotone" dataKey="balance" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorBal)" animationDuration={500} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Playhead Controls - Corretti per Uniformità e Dimensioni Mobile */}
        <div className="bg-white px-6 py-5 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center justify-center gap-4 md:gap-6">
            <button 
              onClick={() => {
                const d = new Date(currentDate); d.setDate(d.getDate() - 1);
                const ds = d.toISOString().split('T')[0];
                if (ds >= settings.startDate) setCurrentDate(ds);
              }} 
              className="w-12 h-12 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-slate-50 border border-slate-100 rounded-2xl transition-all active:scale-90"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M8.445 14.832A1 1 0 0010 14V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4zM16.445 14.832A1 1 0 0018 14V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z"/></svg>
            </button>
            <button 
              onClick={() => setIsPlaying(!isPlaying)} 
              className={`w-14 h-14 flex items-center justify-center rounded-2xl shadow-xl transition-all active:scale-95 ${isPlaying ? 'bg-indigo-100 text-indigo-600 border border-indigo-200' : 'bg-indigo-600 text-white shadow-indigo-100'}`}
            >
              {isPlaying ? <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg> : <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>}
            </button>
            <button 
              onClick={() => {
                const d = new Date(currentDate); d.setDate(d.getDate() + 1);
                const ds = d.toISOString().split('T')[0];
                if (ds <= settings.endDate) setCurrentDate(ds);
              }} 
              className="w-12 h-12 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-slate-50 border border-slate-100 rounded-2xl transition-all active:scale-90"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4zM11.555 5.168A1 1 0 0010 6v8a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4z"/></svg>
            </button>
          </div>

          <div className="flex flex-col items-center">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">{new Date(currentDate).toLocaleDateString('it-IT', { weekday: 'long' })}</span>
             <h4 className="text-2xl font-black text-slate-900 tracking-tighter mono-font leading-none">{new Date(currentDate).toLocaleDateString('it-IT')}</h4>
          </div>

          <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
            {[1, 2, 4].map(s => (
              <button key={s} onClick={() => setSpeed(s)} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${speed === s ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>{s}X</button>
            ))}
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tighter">Movimenti del Giorno</h3>
            
            {/* Riepilogo Inflow/Outflow giornaliero */}
            <div className="flex gap-4 text-right">
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">INFLOW</span>
                <span className="text-xs font-bold text-slate-900">+{dayInflow.toLocaleString()}€</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">OUTFLOW</span>
                <span className="text-xs font-bold text-red-500">-{dayOutflow.toLocaleString()}€</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            {todaysMovements.length === 0 && <p className="text-center py-10 text-slate-300 text-[10px] uppercase font-bold tracking-widest italic">Nessun movimento registrato</p>}
            {todaysMovements.map(m => (
              <div key={m.id} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100 group transition-all">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${m.type === 'in' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={m.type === 'in' ? "M19 14l-7 7m0 0l-7-7m7 7V3" : "M5 10l7-7m0 0l7 7m-7-7v18"} /></svg>
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{m.category}</span>
                    <h5 className="text-sm font-bold text-slate-700">{m.note}</h5>
                  </div>
                </div>
                <span className={`text-sm font-black mono-font ${m.type === 'in' ? 'text-emerald-600' : 'text-red-600'}`}>
                  {m.type === 'in' ? '+' : '-'}{m.amount.toLocaleString()}€
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Movement Modal - Switch Entrata/Uscita Colorato */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="p-8 space-y-6">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter text-center">Nuovo Movimento</h3>
              
              <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100 h-[60px]">
                <button 
                  onClick={() => setNewMove({...newMove, type: 'in'})} 
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all ${newMove.type === 'in' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400'}`}
                >
                  ENTRATA
                </button>
                <button 
                  onClick={() => setNewMove({...newMove, type: 'out'})} 
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all ${newMove.type === 'out' ? 'bg-red-500 text-white shadow-lg' : 'text-slate-400'}`}
                >
                  USCITA
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Importo (€)</label>
                <input type="number" value={newMove.amount} onChange={e => setNewMove({...newMove, amount: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-lg font-black outline-none focus:ring-2 focus:ring-indigo-500 h-[50px]" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Nota</label>
                <input type="text" value={newMove.note} onChange={e => setNewMove({...newMove, note: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 h-[50px]" placeholder="Dettaglio spesa..." />
              </div>
              <div className="pt-4 flex gap-3">
                <button onClick={() => setShowAddModal(false)} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 rounded-2xl transition-all h-[50px]">Esci</button>
                <button onClick={handleAddMovement} className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-500 active:scale-95 transition-all h-[50px]">Salva</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashflowDashboard;