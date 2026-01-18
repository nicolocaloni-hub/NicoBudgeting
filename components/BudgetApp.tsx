import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GlobalVar, Fringe, Category, BudgetLine, Account, ArchiveEntry, ReportNotes } from '../types';
import Sidebar from './Sidebar';
import BudgetTable from './BudgetTable';
import BudgetReport from './BudgetReport';
import SavedBudgetsList from './SavedBudgetsList';
import { recalculateBudget, parseCurrency } from '../utils/calculations';

const ARCHIVE_KEY = 'nicobudget_archive_v1';
const CURRENT_PROJECT_KEY = 'nicobudget_current_v1';

const INITIAL_GLOBALS: GlobalVar[] = [
  { id: 'g1', name: 'SETTIMANE_RIPRESE', value: 8, description: 'Settimane totali' },
];

const createLine = (description: string): BudgetLine => ({
  id: 'l-' + Math.random().toString(36).substr(2, 9),
  description: description,
  amount: '1', 
  multiplierX: '1',
  rate: '0',
  unit: 'UNIT',
  fringeIds: [],
  total: 0
});

const getInitialCategories = (): Category[] => [
  {
    id: 'cat-1000', code: '1000', name: 'Soggetto e Diritti', total: 0,
    accounts: [
      { id: 'acc-1001', code: '1001', name: 'Compensi Sceneggiatura', total: 0, lines: [createLine('Sceneggiatura')] },
      { id: 'acc-1002', code: '1002', name: 'Diritti Storia / Opzioni', total: 0, lines: [createLine('Diritti')] },
    ]
  }
];

const getInitialFringesList = (): Fringe[] => [
  { id: 'f1', name: 'Contributi Previdenziali', rate: 0.15, isAppliedByDefault: true },
];

const BudgetApp: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [projectId, setProjectId] = useState(() => 'prj-' + Math.random().toString(36).substr(2, 9));
  const [currentView, setCurrentView] = useState<'editor' | 'report' | 'archive'>('editor');
  const [projectTitle, setProjectTitle] = useState('NUOVO PROGETTO');
  const [fringes, setFringes] = useState<Fringe[]>(getInitialFringesList());
  const [categories, setCategories] = useState<Category[]>(() => recalculateBudget(getInitialCategories(), INITIAL_GLOBALS, getInitialFringesList()));
  const [archive, setArchive] = useState<ArchiveEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [availableBudget, setAvailableBudget] = useState<string | null>(null);

  // Caricamento iniziale
  useEffect(() => {
    const savedArchive = localStorage.getItem(ARCHIVE_KEY);
    if (savedArchive) try { setArchive(JSON.parse(savedArchive)); } catch (e) {}
    
    const savedCurrent = localStorage.getItem(CURRENT_PROJECT_KEY);
    if (savedCurrent) {
      try {
        const data = JSON.parse(savedCurrent);
        setProjectId(data.projectId || 'prj-' + Math.random().toString(36).substr(2, 9));
        setProjectTitle(data.projectTitle || 'PROGETTO SENZA TITOLO');
        setFringes(data.fringes || getInitialFringesList());
        setCategories(data.categories || getInitialCategories());
        setAvailableBudget(data.availableBudget || null);
      } catch (e) {}
    }
  }, []);

  // Autosave stato corrente
  useEffect(() => {
    const timer = setTimeout(() => {
      const data = { projectId, projectTitle, fringes, categories, availableBudget };
      localStorage.setItem(CURRENT_PROJECT_KEY, JSON.stringify(data));
    }, 1000);
    return () => clearTimeout(timer);
  }, [projectId, projectTitle, fringes, categories, availableBudget]);

  const grandTotal = useMemo(() => categories.reduce((sum, cat) => sum + cat.total, 0), [categories]);

  const handleUpdateLine = useCallback((catId: string, accId: string, lineId: string, field: keyof BudgetLine, value: any) => {
    setCategories(prev => {
      const next = prev.map(cat => {
        if (cat.id !== catId) return cat;
        return {
          ...cat,
          accounts: cat.accounts.map(acc => {
            if (acc.id !== accId) return acc;
            return {
              ...acc,
              lines: acc.lines.map(line => line.id === lineId ? { ...line, [field]: value } : line)
            };
          })
        };
      });
      return recalculateBudget(next, INITIAL_GLOBALS, fringes);
    });
  }, [fringes]);

  const handleArchiveBudget = () => {
    const newEntry: ArchiveEntry = {
      id: 'sav-' + Date.now(),
      title: projectTitle,
      date: new Date().toLocaleString('it-IT'),
      total: grandTotal,
      categories,
      fringes,
      availableBudget
    };
    const nextArchive = [newEntry, ...archive];
    setArchive(nextArchive);
    localStorage.setItem(ARCHIVE_KEY, JSON.stringify(nextArchive));
    alert("Snapshot salvato correttamente in archivio.");
  };

  const handleLoadBudget = (entry: ArchiveEntry) => {
    setProjectId(entry.id);
    setProjectTitle(entry.title);
    setCategories(entry.categories);
    setFringes(entry.fringes);
    setAvailableBudget(entry.availableBudget || null);
    setCurrentView('editor');
  };

  const handleRenameBudget = (id: string, newTitle: string) => {
    const nextArchive = archive.map(a => a.id === id ? { ...a, title: newTitle } : a);
    setArchive(nextArchive);
    localStorage.setItem(ARCHIVE_KEY, JSON.stringify(nextArchive));
  };

  const handleDeleteBudget = (id: string) => {
    if (confirm("Sei sicuro di voler eliminare definitivamente questo budget salvato?")) {
      const nextArchive = archive.filter(a => a.id !== id);
      setArchive(nextArchive);
      localStorage.setItem(ARCHIVE_KEY, JSON.stringify(nextArchive));
    }
  };

  const handleResetBudget = () => {
    if (confirm("Vuoi creare un nuovo budget? Perderai le modifiche non salvate in una copia.")) {
      setProjectId('prj-' + Math.random().toString(36).substr(2, 9));
      setProjectTitle("NUOVO PROGETTO");
      setCategories(getInitialCategories());
      setFringes(getInitialFringesList());
      setAvailableBudget(null);
      setCurrentView('editor');
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden text-slate-900 font-sans relative">
      <Sidebar 
        fringes={fringes} 
        currentView={currentView === 'archive' ? 'archive' : 'editor'} 
        isOpen={isSidebarOpen}
        onUpdateFringe={(id, f, v) => setFringes(fringes.map(fr => fr.id === id ? {...fr, [f]: v} : fr))}
        onDeleteFringe={(id) => setFringes(fringes.filter(f => f.id !== id))}
        onAddFringe={() => setFringes([...fringes, { id: Math.random().toString(), name: 'Nuovo', rate: 0, isAppliedByDefault: false }])}
        onArchiveBudget={handleArchiveBudget} 
        onResetBudget={handleResetBudget} 
        onNavigate={(v) => setCurrentView(v === 'archive' ? 'archive' : 'editor')} 
        onClose={() => setIsSidebarOpen(false)}
      />

      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Header con trigger per Report */}
        <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between shadow-sm shrink-0 print:hidden">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
            <div 
              onClick={() => setCurrentView('report')} 
              className="cursor-pointer group flex items-center gap-2 hover:bg-slate-50 p-2 rounded-xl transition-all"
              title="Apri Report Stampabile"
            >
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest group-hover:text-indigo-600 transition-colors">PROGETTO</span>
                <h1 className="text-sm font-black text-slate-900 uppercase tracking-tighter flex items-center gap-2">
                  {projectTitle}
                  <svg className="w-3 h-3 text-slate-300 group-hover:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </h1>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-right">
              <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Totale Budget</span>
              <span className="text-xl font-black text-indigo-600 mono-font leading-none">{grandTotal.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}</span>
            </div>
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-slate-500"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg></button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          {currentView === 'editor' && (
            <div className="p-6 md:p-8 space-y-6 animate-in fade-in duration-300">
               <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100">
                  <div className="flex-1 max-w-md flex items-center gap-2">
                    <div className="flex-1 relative">
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                      <input 
                        type="text" 
                        placeholder="Cerca account o codice..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-50 border-none rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none h-[40px]"
                      />
                    </div>
                    {/* Pulsante "+" Blu richiesto */}
                    <button 
                      onClick={handleResetBudget}
                      className="h-[40px] w-[40px] flex items-center justify-center bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-500 transition-all shrink-0 active:scale-95 group"
                      title="Nuovo Budget / Produzione"
                    >
                      <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                  <input 
                    type="text" 
                    value={projectTitle} 
                    onChange={(e) => setProjectTitle(e.target.value.toUpperCase())}
                    className="hidden md:block bg-transparent border-none text-right font-black text-[10px] text-slate-400 tracking-widest focus:ring-0 uppercase"
                  />
               </div>
               
               <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                 <BudgetTable 
                    categories={categories} globals={INITIAL_GLOBALS} fringes={fringes} searchTerm={searchTerm}
                    onUpdateLine={handleUpdateLine} 
                    onUpdateAccountName={(catId, accId, name) => {
                       setCategories(prev => prev.map(c => c.id === catId ? {...c, accounts: c.accounts.map(a => a.id === accId ? {...a, name} : a)} : c));
                    }}
                    onAddLine={() => {}} 
                    onDeleteLine={() => {}}
                    onAddFringe={() => {
                      const id = Math.random().toString();
                      setFringes([...fringes, { id, name: 'Nuovo Onere', rate: 0.20, isAppliedByDefault: false }]);
                      return id;
                    }} 
                    onAddAccount={(catId) => {
                      setCategories(prev => prev.map(c => c.id === catId ? {...c, accounts: [...c.accounts, { id: 'acc-'+Math.random(), code: (parseInt(c.code)+1).toString(), name: 'Nuovo Account', lines: [createLine('Nuova voce')], total: 0 }]} : c));
                    }} 
                    onDeleteAccount={(catId, accId) => {
                      setCategories(prev => prev.map(c => c.id === catId ? {...c, accounts: c.accounts.filter(a => a.id !== accId)} : c));
                    }} 
                    onDeleteCategory={(catId) => {
                      setCategories(prev => prev.filter(c => c.id !== catId));
                    }}
                    onUpdateCategoryNotes={(catId, notes) => setCategories(prev => prev.map(c => c.id === catId ? {...c, notes} : c))}
                    onUpdateAccountNotes={(catId, accId, notes) => setCategories(prev => prev.map(c => c.id === catId ? {...c, accounts: c.accounts.map(a => a.id === accId ? {...a, notes} : a)} : c))}
                 />
               </div>
            </div>
          )}

          {currentView === 'report' && (
            <BudgetReport 
              projectId={projectId}
              projectTitle={projectTitle}
              categories={categories}
              grandTotal={grandTotal}
              onBack={() => setCurrentView('editor')}
            />
          )}

          {currentView === 'archive' && (
            <SavedBudgetsList 
              archive={archive}
              onLoad={handleLoadBudget}
              onRename={handleRenameBudget}
              onDelete={handleDeleteBudget}
              onBack={() => setCurrentView('editor')}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default BudgetApp;