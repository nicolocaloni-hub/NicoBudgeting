import React, { useState, useEffect } from 'react';
import BudgetApp from './components/BudgetApp';
import CashflowHome from './features/cashflow/CashflowHome';
import CashflowDashboard from './features/cashflow/CashflowDashboard';

type View = 'hub' | 'budget' | 'cashflow-home' | 'cashflow-dashboard';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('hub');
  const [selectedProductionId, setSelectedProductionId] = useState<string | null>(null);

  // Router basato su hash per compatibilità con il requisito delle route
  useEffect(() => {
    const handleHash = () => {
      try {
        const hash = window.location.hash;
        if (hash === '#/budget') setCurrentView('budget');
        else if (hash === '#/cashflow') setCurrentView('cashflow-home');
        else if (hash.startsWith('#/cashflow/')) {
          const id = hash.split('/')[2];
          setSelectedProductionId(id);
          setCurrentView('cashflow-dashboard');
        } else {
          setCurrentView('hub');
        }
      } catch (err) {
        console.error("Router error:", err);
      }
    };
    window.addEventListener('hashchange', handleHash);
    handleHash();
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const navigate = (view: View, id?: string) => {
    if (view === 'hub') window.location.hash = '/';
    else if (view === 'budget') window.location.hash = '/budget';
    else if (view === 'cashflow-home') window.location.hash = '/cashflow';
    else if (view === 'cashflow-dashboard' && id) window.location.hash = `/cashflow/${id}`;
  };

  return (
    <>
      {/* Debug Badge */}
      <div className="fixed top-2 right-2 z-[9999] pointer-events-none opacity-50">
        <span className="bg-emerald-500 text-white text-[8px] font-black uppercase px-2 py-1 rounded-full shadow-lg border border-emerald-400">
          App loaded ✅
        </span>
      </div>

      {currentView === 'budget' && <BudgetApp onBack={() => navigate('hub')} />}
      {currentView === 'cashflow-home' && <CashflowHome onSelect={(id) => navigate('cashflow-dashboard', id)} onBack={() => navigate('hub')} />}
      {currentView === 'cashflow-dashboard' && selectedProductionId && <CashflowDashboard productionId={selectedProductionId} onBack={() => navigate('cashflow-home')} />}
      
      {currentView === 'hub' && (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 md:p-12 font-sans selection:bg-indigo-500 selection:text-white">
          <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Nico Budget Pro Card */}
            <div 
              onClick={() => navigate('budget')}
              className="group relative bg-indigo-600 p-10 rounded-[3rem] overflow-hidden cursor-pointer hover:scale-[1.02] transition-all duration-500 shadow-2xl shadow-indigo-900/50"
            >
              <div className="absolute top-0 right-0 p-8 text-indigo-400 group-hover:rotate-12 transition-transform duration-500 opacity-20">
                <svg className="w-40 h-40" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/></svg>
              </div>
              <div className="relative z-10 space-y-6">
                <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center text-white backdrop-blur-md">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                  <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Nico Budget<br/>Pro</h2>
                  <p className="text-indigo-200 text-sm mt-4 font-bold uppercase tracking-widest">Pianificazione Movie Magic</p>
                </div>
                <div className="pt-8">
                  <span className="inline-flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] group-hover:gap-4 transition-all">
                    Apri Budgeter <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </span>
                </div>
              </div>
            </div>

            {/* Cashflow Daily Card */}
            <div 
              onClick={() => navigate('cashflow-home')}
              className="group relative bg-emerald-600 p-10 rounded-[3rem] overflow-hidden cursor-pointer hover:scale-[1.02] transition-all duration-500 shadow-2xl shadow-emerald-900/50"
            >
              <div className="absolute top-0 right-0 p-8 text-emerald-400 group-hover:-rotate-12 transition-transform duration-500 opacity-20">
                <svg className="w-40 h-40" fill="currentColor" viewBox="0 0 20 20"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/></svg>
              </div>
              <div className="relative z-10 space-y-6">
                <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center text-white backdrop-blur-md">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                </div>
                <div>
                  <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Cashflow<br/>Daily</h2>
                  <p className="text-emerald-200 text-sm mt-4 font-bold uppercase tracking-widest">Proiezioni e Playhead</p>
                </div>
                <div className="pt-8">
                  <span className="inline-flex items-center gap-2 px-6 py-3 bg-white text-emerald-600 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] group-hover:gap-4 transition-all">
                    Apri Cashflow <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </span>
                </div>
              </div>
            </div>

          </div>
          <div className="fixed bottom-12 text-center">
            <p className="text-slate-600 text-[9px] font-black uppercase tracking-[0.4em]">Cinematographic Production Ecosystem • Pro Edition</p>
          </div>
        </div>
      )}
    </>
  );
};

export default App;