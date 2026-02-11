
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { GlobalVar, Fringe, Category, BudgetLine, Account, ArchiveEntry } from '../types';
import Sidebar from './Sidebar';
import BudgetTable from './BudgetTable';
import BudgetReport from './BudgetReport';
import SavedBudgetsList from './SavedBudgetsList';
import { recalculateBudget } from '../utils/calculations';

const ARCHIVE_KEY = 'nicobudget_archive_v1';
const CURRENT_PROJECT_KEY = 'nicobudget_current_v1';

const INITIAL_GLOBALS: GlobalVar[] = [
  { id: 'g1', name: 'SETTIMANE_RIPRESE', value: 8, description: 'Settimane totali' },
];

const createEmptyLine = (description: string): BudgetLine => ({
  id: 'l-' + Math.random().toString(36).substr(2, 9),
  description: description,
  amount: '1', 
  multiplierX: '1',
  rate: '0',
  unit: 'D', // Default a Giorni come richiesto
  fringeIds: [],
  total: 0
});

const getChartOfAccountsTemplate = (): Category[] => [
  {
    id: 'cat-1000', code: '1000', name: 'SVILUPPO E SCENEGGIATURA', total: 0,
    accounts: [
      { id: 'acc-0101', code: '0101', name: 'Sceneggiatore / Screenwriter', total: 0, lines: [createEmptyLine('Prestazione')] },
      { id: 'acc-0103', code: '0103', name: 'Story Editor', total: 0, lines: [createEmptyLine('Prestazione')] },
      { id: 'acc-0104', code: '0104', name: 'Script Consultant', total: 0, lines: [createEmptyLine('Prestazione')] },
      { id: 'acc-0105', code: '0105', name: 'Script Coordinator', total: 0, lines: [createEmptyLine('Prestazione')] },
    ]
  },
  {
    id: 'cat-2000', code: '2000', name: 'PRODUZIONE CREATIVA (PRODUCERS)', total: 0,
    accounts: [
      { id: 'acc-0201', code: '0201', name: 'Executive Producer', total: 0, lines: [createEmptyLine('Compenso')] },
      { id: 'acc-0202', code: '0202', name: 'Producer', total: 0, lines: [createEmptyLine('Compenso')] },
      { id: 'acc-0203', code: '0203', name: 'Supervising Producer', total: 0, lines: [createEmptyLine('Compenso')] },
      { id: 'acc-0204', code: '0204', name: 'Line Producer', total: 0, lines: [createEmptyLine('Compenso')] },
      { id: 'acc-0205', code: '0205', name: 'Associate Producer', total: 0, lines: [createEmptyLine('Compenso')] },
      { id: 'acc-0206', code: '0206', name: "Producer's Assistant", total: 0, lines: [createEmptyLine('Compenso')] },
    ]
  },
  {
    id: 'cat-3000', code: '3000', name: 'REGIA (DIRECTION)', total: 0,
    accounts: [
      { id: 'acc-0301', code: '0301', name: 'Director', total: 0, lines: [createEmptyLine('Regia')] },
      { id: 'acc-0304', code: '0304', name: 'Co-Director', total: 0, lines: [createEmptyLine('Regia')] },
      { id: 'acc-0306', code: '0306', name: 'First Assistant Director', total: 0, lines: [createEmptyLine('Prestazione')] },
      { id: 'acc-0307', code: '0307', name: 'Second Assistant Director', total: 0, lines: [createEmptyLine('Prestazione')] },
      { id: 'acc-1704', code: '1704', name: 'Script Supervisor', total: 0, lines: [createEmptyLine('Prestazione')] },
    ]
  },
  {
    id: 'cat-4000', code: '4000', name: 'CAST (PRINCIPALE E SECONDARIO)', total: 0,
    accounts: [
      { id: 'acc-0401', code: '0401', name: 'Lead / Principal Cast', total: 0, lines: [createEmptyLine('Prestazione')] },
      { id: 'acc-0402', code: '0402', name: 'Supporting Cast', total: 0, lines: [createEmptyLine('Prestazione')] },
      { id: 'acc-0403', code: '0403', name: 'Casting Director', total: 0, lines: [createEmptyLine('Prestazione')] },
      { id: 'acc-0407', code: '0407', name: 'Casting Assistant', total: 0, lines: [createEmptyLine('Prestazione')] },
      { id: 'acc-1406', code: '1406', name: 'Stunt Coordinator', total: 0, lines: [createEmptyLine('Prestazione')] },
      { id: 'acc-1407', code: '1407', name: 'Stunt Performer', total: 0, lines: [createEmptyLine('Prestazione')] },
    ]
  },
  {
    id: 'cat-1700', code: '1700', name: 'PRODUZIONE (OFFICE & SET)', total: 0,
    accounts: [
      { id: 'acc-1701', code: '1701', name: 'Unit Production Manager (UPM)', total: 0, lines: [createEmptyLine('Prestazione')] },
      { id: 'acc-1707', code: '1707', name: 'Production Coordinator', total: 0, lines: [createEmptyLine('Prestazione')] },
      { id: 'acc-1708', code: '1708', name: 'Assistant Production Coordinator', total: 0, lines: [createEmptyLine('Prestazione')] },
      { id: 'acc-1705', code: '1705', name: 'Production Accountant', total: 0, lines: [createEmptyLine('Prestazione')] },
      { id: 'acc-1711', code: '1711', name: 'Production Assistant / Runner', total: 0, lines: [createEmptyLine('Prestazione')] },
    ]
  },
  {
    id: 'cat-2200', code: '2200', name: 'SCENOGRAFIA E ART DEPARTMENT', total: 0,
    accounts: [
      { id: 'acc-2201', code: '2201', name: 'Production Designer', total: 0, lines: [createEmptyLine('Prestazione')] },
      { id: 'acc-2202', code: '2202', name: 'Art Director', total: 0, lines: [createEmptyLine('Prestazione')] },
      { id: 'acc-2203', code: '2203', name: 'Assistant Art Director', total: 0, lines: [createEmptyLine('Prestazione')] },
      { id: 'acc-2301', code: '2301', name: 'Construction Coordinator', total: 0, lines: [createEmptyLine('Prestazione')] },
    ]
  },
  {
    id: 'cat-3300', code: '3300', name: 'CAMERA DEPARTMENT', total: 0,
    accounts: [
      { id: 'acc-3301', code: '3301', name: 'Director of Photography', total: 0, lines: [createEmptyLine('Prestazione')] },
      { id: 'acc-3302', code: '3302', name: 'Camera Operator', total: 0, lines: [createEmptyLine('Prestazione')] },
      { id: 'acc-3304', code: '3304', name: '1st Assistant Camera', total: 0, lines: [createEmptyLine('Prestazione')] },
      { id: 'acc-3305', code: '3305', name: '2nd Assistant Camera', total: 0, lines: [createEmptyLine('Prestazione')] },
      { id: 'acc-3306', code: '3306', name: 'Digital Imaging Technician (DIT)', total: 0, lines: [createEmptyLine('Prestazione')] },
    ]
  },
  {
    id: 'cat-3200', code: '3200', name: 'LUCI (LIGHTING)', total: 0,
    accounts: [
      { id: 'acc-3201', code: '3201', name: 'Gaffer', total: 0, lines: [createEmptyLine('Prestazione')] },
      { id: 'acc-3202', code: '3202', name: 'Best Boy Electric', total: 0, lines: [createEmptyLine('Prestazione')] },
      { id: 'acc-3204', code: '3204', name: 'Lighting Technician', total: 0, lines: [createEmptyLine('Prestazione')] },
    ]
  },
  {
    id: 'cat-3400', code: '3400', name: 'SUONO (SOUND)', total: 0,
    accounts: [
      { id: 'acc-3401', code: '3401', name: 'Production Sound Mixer', total: 0, lines: [createEmptyLine('Prestazione')] },
      { id: 'acc-3402', code: '3402', name: 'Boom Operator', total: 0, lines: [createEmptyLine('Prestazione')] },
      { id: 'acc-3403', code: '3403', name: 'Sound Utility', total: 0, lines: [createEmptyLine('Prestazione')] },
    ]
  },
  {
    id: 'cat-5000', code: '5000', name: 'POST-PRODUZIONE', total: 0,
    accounts: [
      { id: 'acc-5001', code: '5001', name: 'Film Editor', total: 0, lines: [createEmptyLine('Prestazione')] },
      { id: 'acc-5002', code: '5002', name: 'Assistant Editor', total: 0, lines: [createEmptyLine('Prestazione')] },
      { id: 'acc-5101', code: '5101', name: 'Composer', total: 0, lines: [createEmptyLine('Prestazione')] },
      { id: 'acc-5201', code: '5201', name: 'Sound Editor', total: 0, lines: [createEmptyLine('Prestazione')] },
      { id: 'acc-5301', code: '5301', name: 'Colorist', total: 0, lines: [createEmptyLine('Prestazione')] },
    ]
  }
];

const BudgetApp: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [projectId, setProjectId] = useState(() => 'prj-' + Math.random().toString(36).substr(2, 9));
  const [currentView, setCurrentView] = useState<'editor' | 'report' | 'archive'>('editor');
  const [projectTitle, setProjectTitle] = useState('NUOVO PROGETTO');
  const [tempProjectTitle, setTempProjectTitle] = useState('NUOVO PROGETTO');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  
  const titleContainerRef = useRef<HTMLDivElement>(null);

  const [fringes, setFringes] = useState<Fringe[]>(() => [
    { id: 'f1', name: 'Contributi Previdenziali', rate: 0.15, isAppliedByDefault: true },
  ]);
  const [categories, setCategories] = useState<Category[]>(() => getChartOfAccountsTemplate());
  const [archive, setArchive] = useState<ArchiveEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [availableBudget, setAvailableBudget] = useState<string | null>(null);

  // Stati Modal "Aggiungi Cartella"
  const [isAddFolderModalOpen, setIsAddFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderCode, setNewFolderCode] = useState('');

  useEffect(() => {
    const savedArchive = localStorage.getItem(ARCHIVE_KEY);
    if (savedArchive) try { setArchive(JSON.parse(savedArchive)); } catch (e) {}
    
    const savedCurrent = localStorage.getItem(CURRENT_PROJECT_KEY);
    if (savedCurrent) {
      try {
        const data = JSON.parse(savedCurrent);
        setProjectId(data.projectId || 'prj-' + Math.random().toString(36).substr(2, 9));
        setProjectTitle(data.projectTitle || 'PROGETTO SENZA TITOLO');
        setTempProjectTitle(data.projectTitle || 'PROGETTO SENZA TITOLO');
        setFringes(data.fringes || []);
        setCategories(data.categories || getChartOfAccountsTemplate());
        setAvailableBudget(data.availableBudget || null);
      } catch (e) {}
    }
  }, []);

  // Gestione Outside Click per il titolo
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (isEditingTitle && titleContainerRef.current && !titleContainerRef.current.contains(event.target as Node)) {
        handleSaveTitle();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isEditingTitle, tempProjectTitle]);

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

  const handleAddLine = useCallback((catId: string, accId: string) => {
    setCategories(prev => {
      const next = prev.map(cat => {
        if (cat.id !== catId) return cat;
        return {
          ...cat,
          accounts: cat.accounts.map(acc => {
            if (acc.id !== accId) return acc;
            return {
              ...acc,
              lines: [...acc.lines, createEmptyLine('Nuova riga')]
            };
          })
        };
      });
      return recalculateBudget(next, INITIAL_GLOBALS, fringes);
    });
  }, [fringes]);

  const handleDeleteLine = useCallback((catId: string, accId: string, lineId: string) => {
    setCategories(prev => {
      const next = prev.map(cat => {
        if (cat.id !== catId) return cat;
        return {
          ...cat,
          accounts: cat.accounts.map(acc => {
            if (acc.id !== accId) return acc;
            return {
              ...acc,
              lines: acc.lines.filter(line => line.id !== lineId)
            };
          })
        };
      });
      return recalculateBudget(next, INITIAL_GLOBALS, fringes);
    });
  }, [fringes]);

  const handleSaveTitle = () => {
    const trimmed = tempProjectTitle.trim();
    if (trimmed) {
      setProjectTitle(trimmed);
    } else {
      setTempProjectTitle(projectTitle);
    }
    setIsEditingTitle(false);
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      alert("Il nome della cartella è obbligatorio.");
      return;
    }

    let code = newFolderCode.trim();
    if (!code) {
      const codes = categories.map(c => parseInt(c.code)).filter(c => !isNaN(c));
      const maxCode = codes.length > 0 ? Math.max(...codes) : 0;
      code = (maxCode + 100).toString();
    }

    if (isNaN(Number(code))) {
      alert("Il codice deve essere un valore numerico.");
      return;
    }

    if (categories.some(cat => cat.code === code)) {
      alert(`Errore: Il codice ${code} è già presente nel budget corrente.`);
      return;
    }

    const newCat: Category = {
      id: 'cat-' + Math.random().toString(36).substr(2, 9),
      code: code,
      name: newFolderName.trim().toUpperCase(),
      accounts: [],
      total: 0
    };

    setCategories(prev => [...prev, newCat]);
    setIsAddFolderModalOpen(false);
    setNewFolderName('');
    setNewFolderCode('');
  };

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
    alert("Copia salvata correttamente.");
  };

  const handleLoadBudget = (entry: ArchiveEntry) => {
    setProjectId(entry.id);
    setProjectTitle(entry.title);
    setTempProjectTitle(entry.title);
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
    if (confirm("Vuoi creare un nuovo budget? Verrà caricata la struttura predefinita (COA) con quantità di default = 1.")) {
      const newProjectId = 'prj-' + Math.random().toString(36).substr(2, 9);
      const seededCategories = getChartOfAccountsTemplate().map(cat => ({
        ...cat,
        id: 'cat-' + Math.random().toString(36).substr(2, 9),
        accounts: cat.accounts.map(acc => ({
          ...acc,
          id: 'acc-' + Math.random().toString(36).substr(2, 9),
          lines: acc.lines.map(line => ({
            ...line,
            id: 'l-' + Math.random().toString(36).substr(2, 9),
            amount: '1', // Default quantity
            total: 0
          })),
          total: 0
        })),
        total: 0
      }));

      setProjectId(newProjectId);
      setProjectTitle("NUOVO PROGETTO");
      setTempProjectTitle("NUOVO PROGETTO");
      setCategories(seededCategories);
      setFringes([
        { id: 'f1', name: 'Contributi Previdenziali', rate: 0.15, isAppliedByDefault: true },
      ]);
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
        <header className="bg-white border-b border-slate-100 px-6 py-2.5 flex items-center justify-between shadow-sm shrink-0 print:hidden">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="flex flex-col gap-1 shrink-0">
              <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 focus:outline-none" title="Torna alla Suite">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg focus:outline-none" title="Apri Menu">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
            </div>
            
            <div ref={titleContainerRef} className="group flex flex-col min-w-0 max-w-full">
              <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest group-hover:text-indigo-600 transition-colors">PROGETTO</span>
              {isEditingTitle ? (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    type="text"
                    value={tempProjectTitle}
                    onChange={(e) => setTempProjectTitle(e.target.value.toUpperCase())}
                    onBlur={handleSaveTitle}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveTitle();
                      if (e.key === 'Escape') {
                        setIsEditingTitle(false);
                        setTempProjectTitle(projectTitle);
                      }
                    }}
                    maxLength={60}
                    className="bg-slate-50 border-b-2 border-indigo-500 text-sm font-black text-slate-900 outline-none w-full max-w-[200px] md:max-w-[400px] h-[24px]"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2 min-w-0">
                  <h1 
                    onClick={() => setIsEditingTitle(true)}
                    className="text-sm font-black text-slate-900 uppercase tracking-tighter truncate max-w-[150px] md:max-w-[400px] cursor-pointer hover:text-indigo-600 transition-colors leading-none"
                  >
                    {projectTitle}
                  </h1>
                </div>
              )}
            </div>
          </div>
          
          <div 
            onClick={() => setCurrentView('report')}
            className="flex items-center gap-6 shrink-0 ml-4 cursor-pointer group hover:bg-indigo-50 p-2 rounded-xl transition-all active:scale-95"
          >
            <div className="text-right">
              <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest group-hover:text-indigo-400 transition-colors">Totale Budget</span>
              <span className="text-xl font-black text-indigo-600 mono-font leading-none flex items-center gap-1">
                {grandTotal.toLocaleString('it-IT')}€
                <svg className="w-3 h-3 text-indigo-300 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </span>
            </div>
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
                    <button 
                      onClick={() => setIsAddFolderModalOpen(true)}
                      className="h-[44px] w-[44px] flex items-center justify-center bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-500 transition-all shrink-0 active:scale-95 group"
                      title="Aggiungi Cartella (Categoria)"
                    >
                      <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                  <div className="hidden md:flex flex-col items-end">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Editing</span>
                    <span className="text-[10px] font-black text-indigo-400 tracking-widest uppercase truncate max-w-[150px]">{projectTitle}</span>
                  </div>
               </div>
               
               <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                 <BudgetTable 
                    categories={categories} globals={INITIAL_GLOBALS} fringes={fringes} searchTerm={searchTerm}
                    onUpdateLine={handleUpdateLine} 
                    onUpdateAccountName={(catId, accId, name) => {
                       setCategories(prev => prev.map(c => c.id === catId ? {...c, accounts: c.accounts.map(a => a.id === accId ? {...a, name} : a)} : c));
                    }}
                    onAddLine={handleAddLine} 
                    onDeleteLine={handleDeleteLine}
                    onAddFringe={() => {
                      const id = Math.random().toString();
                      setFringes([...fringes, { id, name: 'Nuovo Onere', rate: 0.20, isAppliedByDefault: false }]);
                      return id;
                    }} 
                    onAddAccount={(catId) => {
                      setCategories(prev => prev.map(c => c.id === catId ? {...c, accounts: [...c.accounts, { id: 'acc-'+Math.random(), code: (parseInt(c.code)+1).toString(), name: 'Nuovo Account', lines: [createEmptyLine('Nuova voce')], total: 0 }]} : c));
                    }} 
                    onDeleteAccount={(catId, accId) => {
                      setCategories(prev => prev.map(c => c.id === catId ? {...c, accounts: c.accounts.filter(a => a.id !== accId)} : c));
                    }} 
                    onDeleteCategory={(catId) => {
                      if (confirm("Sei sicuro di voler eliminare questa cartella e tutto il suo contenuto?")) {
                        setCategories(prev => prev.filter(c => c.id !== catId));
                      }
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
              fringes={fringes}
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

      {/* MODAL AGGIUNGI CARTELLA */}
      {isAddFolderModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="p-8 space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Aggiungi Cartella</h3>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Crea una nuova categoria nel budget</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Nome Cartella (Obbligatorio)</label>
                  <input 
                    autoFocus
                    type="text" 
                    value={newFolderName} 
                    onChange={e => setNewFolderName(e.target.value)} 
                    placeholder="es: SUONO, STUNT, VFX..."
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all h-[50px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Codice (Auto-generato se vuoto)</label>
                  <input 
                    type="text" 
                    value={newFolderCode} 
                    onChange={e => setNewFolderCode(e.target.value.replace(/\D/g, ''))} 
                    placeholder="es: 2400"
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-black text-indigo-600 outline-none focus:ring-2 focus:ring-indigo-500 transition-all h-[50px]"
                  />
                </div>
                
                <p className="text-[9px] text-slate-400 italic px-1">
                  La cartella verrà inserita in fondo alla lista e potrà contenere sottocartelle (account).
                </p>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  onClick={() => setIsAddFolderModalOpen(false)} 
                  className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 rounded-2xl transition-all h-[50px]"
                >
                  Annulla
                </button>
                <button 
                  onClick={handleCreateFolder} 
                  className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-500 transition-all active:scale-95 h-[50px]"
                >
                  Crea Cartella
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetApp;
