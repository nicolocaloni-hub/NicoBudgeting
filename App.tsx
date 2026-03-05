
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
      {currentView === 'budget' && <BudgetApp onBack={() => navigate('hub')} />}
      {currentView === 'cashflow-home' && <CashflowHome onSelect={(id) => navigate('cashflow-dashboard', id)} onBack={() => navigate('hub')} />}
      {currentView === 'cashflow-dashboard' && selectedProductionId && <CashflowDashboard productionId={selectedProductionId} onBack={() => navigate('cashflow-home')} />}
      
      {currentView === 'hub' && (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-start p-6 pt-12 md:pt-24 font-sans selection:bg-indigo-500 selection:text-white">
          <div className="max-w-xl w-full space-y-10">
            
            {/* Page Header */}
            <div className="text-center space-y-1">
              <div className="flex flex-col items-center leading-tight">
                <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">SmartSet</h1>
                <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Production Suite</h1>
              </div>
              <p className="text-slate-400 text-sm font-medium tracking-tight">Strumenti professionali per la gestione finanziaria cinematografica.</p>
            </div>

            <div className="space-y-4">
              {/* Plan budget pro Card */}
              <div 
                onClick={() => navigate('budget')}
                className="group relative bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-200 cursor-pointer transition-all duration-300"
              >
                <div className="flex items-start gap-5">
                  <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-inner">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Plan budget pro</h2>
                      <div className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                      </div>
                    </div>
                    <p className="text-indigo-600 text-[10px] font-black uppercase tracking-[0.15em] mb-2">pianificazione finanziaria</p>
                    <p className="text-slate-400 text-xs leading-relaxed font-medium">Gestione professionale di categorie, variabili globali e oneri dinamici in tempo reale.</p>
                  </div>
                </div>
              </div>

              {/* Cashflow Daily Card */}
              <div 
                onClick={() => navigate('cashflow-home')}
                className="group relative bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-emerald-200 cursor-pointer transition-all duration-300"
              >
                <div className="flex items-start gap-5">
                  <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 shadow-inner">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Cashflow Daily</h2>
                      <div className="text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                      </div>
                    </div>
                    <p className="text-emerald-600 text-[10px] font-black uppercase tracking-[0.15em] mb-2">monitoraggio finanziario quotidiano</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center pt-8 flex flex-col items-center gap-1.5">
              <p className="text-slate-300 text-[9px] font-black uppercase tracking-[0.4em]">SmartSet</p>
              <p className="text-slate-300 text-[9px] font-black uppercase tracking-[0.4em]">powered by Nicolò Caloni</p>
              <a 
                href="https://www.instagram.com/nicolo.cc?igsh=MXJ1bXRoejJ5bTJzcw==" 
                target="_blank" 
                rel="noopener noreferrer"
                aria-label="Apri Instagram @nicolo.cc"
                className="text-slate-300 text-[9px] font-black uppercase tracking-[0.4em] no-underline hover:text-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-300 rounded px-1 transition-all"
              >
                @nicolo.cc
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default App;
