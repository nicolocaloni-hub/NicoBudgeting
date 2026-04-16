
import React, { useState, useEffect } from 'react';
import BudgetApp from './components/BudgetApp';
import CashflowHome from './features/cashflow/CashflowHome';
import CashflowDashboard from './features/cashflow/CashflowDashboard';
import { useSettings } from './contexts/SettingsContext';
import { useTutorial } from './contexts/TutorialContext';
import { db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';

type View = 'hub' | 'budget' | 'cashflow-home' | 'cashflow-dashboard';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('hub');
  const [selectedProductionId, setSelectedProductionId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [sharedBudgetId, setSharedBudgetId] = useState<string | null>(null);
  const { theme, setTheme, language, setLanguage, t } = useSettings();
  const { startTutorial } = useTutorial();

  // Router basato su hash per compatibilità con il requisito delle route
  useEffect(() => {
    const handleHash = () => {
      try {
        const hash = window.location.hash;
        const urlParams = new URLSearchParams(window.location.search);
        const sharedId = urlParams.get('sharedId');
        
        if (sharedId) {
          setSharedBudgetId(sharedId);
          setCurrentView('budget');
          return;
        }

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
      {currentView === 'budget' && <BudgetApp onBack={() => navigate('hub')} sharedBudgetId={sharedBudgetId} />}
      {currentView === 'cashflow-home' && <CashflowHome onSelect={(id) => navigate('cashflow-dashboard', id)} onBack={() => navigate('hub')} />}
      {currentView === 'cashflow-dashboard' && selectedProductionId && <CashflowDashboard productionId={selectedProductionId} onBack={() => navigate('cashflow-home')} />}
      
      {currentView === 'hub' && (
        <div className={`min-h-screen flex flex-col items-center justify-start p-6 pt-12 md:pt-24 font-sans selection:bg-indigo-500 selection:text-white transition-colors duration-500 ${theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'}`}>
          <div className="max-w-xl w-full space-y-10">
            
            {/* Page Header */}
            <div className="text-center space-y-1 relative">
              <div className="flex flex-col items-center leading-tight">
                <h1 className={`text-4xl font-black tracking-tighter uppercase transition-colors duration-500 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>SmartSet</h1>
                <div className="relative inline-block">
                  <div className="absolute right-full pr-4 top-1">
                    <button 
                      onClick={() => setShowSettings(!showSettings)}
                      className="tutorial-settings-btn text-slate-400 hover:text-indigo-600 transition-colors duration-300 focus:outline-none"
                      title={t.theme}
                    >
                      <svg className={`w-8 h-8 transition-transform duration-500 ${showSettings ? 'rotate-90' : 'rotate-0'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>
                  </div>
                  <h1 className={`text-4xl font-black tracking-tighter uppercase text-center transition-colors duration-500 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Production<br/>Suite</h1>
                </div>
              </div>
              <p className="text-slate-400 text-sm font-medium tracking-tight mt-2">{t.subtitle}</p>

              {/* Settings Dropdown */}
              {showSettings && (
                <div className={`absolute left-0 top-full mt-4 w-64 rounded-2xl shadow-xl border p-4 z-50 text-left transition-colors duration-500 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t.theme}</h3>
                      <div className={`flex rounded-xl p-1 transition-colors duration-500 ${theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'}`}>
                        <button 
                          onClick={() => setTheme('light')}
                          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${theme === 'light' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-400'}`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                          {t.light}
                        </button>
                        <button 
                          onClick={() => setTheme('dark')}
                          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${theme === 'dark' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-400'}`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                          {t.dark}
                        </button>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t.language}</h3>
                      <div className={`flex rounded-xl p-1 transition-colors duration-500 ${theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'}`}>
                        <button 
                          onClick={() => setLanguage('it')}
                          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${language === 'it' ? (theme === 'dark' ? 'bg-slate-800 text-indigo-400 shadow-sm' : 'bg-white text-indigo-600 shadow-sm') : 'text-slate-500 hover:text-slate-400'}`}
                        >
                          IT
                        </button>
                        <button 
                          onClick={() => setLanguage('en')}
                          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${language === 'en' ? (theme === 'dark' ? 'bg-slate-800 text-indigo-400 shadow-sm' : 'bg-white text-indigo-600 shadow-sm') : 'text-slate-500 hover:text-slate-400'}`}
                        >
                          EN
                        </button>
                      </div>
                    </div>
                    <div>
                      <button
                        onClick={() => {
                          setShowSettings(false);
                          startTutorial('hub');
                        }}
                        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all ${theme === 'dark' ? 'bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Tutorial
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {/* Plan budget pro Card */}
              <div 
                onClick={() => navigate('budget')}
                className={`tutorial-budget-banner group relative p-6 rounded-[2rem] border shadow-sm hover:shadow-xl cursor-pointer transition-all duration-300 ${theme === 'dark' ? 'bg-slate-800 border-slate-700 hover:border-indigo-500' : 'bg-white border-slate-100 hover:border-indigo-200'}`}
              >
                <div className="flex items-start gap-5">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300 shadow-inner ${theme === 'dark' ? 'bg-indigo-900/50 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white' : 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white'}`}>
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h2 className={`text-xl font-black uppercase tracking-tight transition-colors duration-500 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{t.planBudgetTitle}</h2>
                      <div className={`transition-all ${theme === 'dark' ? 'text-slate-500 group-hover:text-indigo-400' : 'text-slate-300 group-hover:text-indigo-600'} group-hover:translate-x-1`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                      </div>
                    </div>
                    <p className={`text-[10px] font-black uppercase tracking-[0.15em] mb-2 transition-colors duration-500 ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`}>{t.planBudgetSub}</p>
                    <p className={`text-xs leading-relaxed font-medium transition-colors duration-500 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-400'}`}>{t.planBudgetDesc}</p>
                  </div>
                </div>
              </div>

              {/* Cashflow Daily Card */}
              <div 
                onClick={() => navigate('cashflow-home')}
                className={`tutorial-cashflow-banner group relative p-6 rounded-[2rem] border shadow-sm hover:shadow-xl cursor-pointer transition-all duration-300 ${theme === 'dark' ? 'bg-slate-800 border-slate-700 hover:border-emerald-500' : 'bg-white border-slate-100 hover:border-emerald-200'}`}
              >
                <div className="flex items-start gap-5">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300 shadow-inner ${theme === 'dark' ? 'bg-emerald-900/50 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white' : 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white'}`}>
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h2 className={`text-xl font-black uppercase tracking-tight transition-colors duration-500 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{t.cashflowTitle}</h2>
                      <div className={`transition-all ${theme === 'dark' ? 'text-slate-500 group-hover:text-emerald-400' : 'text-slate-300 group-hover:text-emerald-600'} group-hover:translate-x-1`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                      </div>
                    </div>
                    <p className={`text-[10px] font-black uppercase tracking-[0.15em] mb-2 transition-colors duration-500 ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>{t.cashflowSub}</p>
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
