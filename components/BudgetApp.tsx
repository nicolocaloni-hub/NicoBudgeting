
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { GlobalVar, Fringe, Category, BudgetLine, ArchiveEntry } from '../types';
import Sidebar from './Sidebar';
import BudgetTable from './BudgetTable';
import BudgetReport from './BudgetReport';
import SavedBudgetsList from './SavedBudgetsList';
import { recalculateBudget } from '../utils/calculations';

const ARCHIVE_KEY = 'nicobudget_archive_v1';
const CURRENT_PROJECT_KEY = 'nicobudget_current_v1';
const CUSTOM_TEMPLATE_KEY = 'nicobudget_custom_template_v1';

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
  { id: 'cat-1000', code: '1000', name: 'STORIA E DIRITTI', total: 0, accounts: [{ id: 'acc-1001', code: '1001', name: 'Diritti', total: 0, lines: [createEmptyLine('Opzione')] }] },
  { id: 'cat-1100', code: '1100', name: 'PRODUTTORI', total: 0, accounts: [{ id: 'acc-1101', code: '1101', name: 'Produttori', total: 0, lines: [createEmptyLine('Compenso')] }] },
  { id: 'cat-1200', code: '1200', name: 'REGIA', total: 0, accounts: [{ id: 'acc-1201', code: '1201', name: 'Regista', total: 0, lines: [createEmptyLine('Compenso')] }] },
  { id: 'cat-1300', code: '1300', name: 'CAST', total: 0, accounts: [{ id: 'acc-1301', code: '1301', name: 'Attori Principali', total: 0, lines: [createEmptyLine('Compenso')] }] },
  { id: 'cat-1400', code: '1400', name: 'SPESE DI VIAGGIO (SOPRA LA LINEA)', total: 0, accounts: [{ id: 'acc-1401', code: '1401', name: 'Viaggi', total: 0, lines: [createEmptyLine('Volo')] }] },
  { id: 'cat-1500', code: '1500', name: 'COMPARSE', total: 0, accounts: [{ id: 'acc-1501', code: '1501', name: 'Comparse', total: 0, lines: [createEmptyLine('Giornata')] }] },
  { id: 'cat-1600', code: '1600', name: 'PERSONALE DI PRODUZIONE', total: 0, accounts: [{ id: 'acc-1601', code: '1601', name: 'Staff', total: 0, lines: [createEmptyLine('Compenso')] }] },
  { id: 'cat-1700', code: '1700', name: 'PELLICOLA E SVILUPPO (PRODUZIONE)', total: 0, accounts: [{ id: 'acc-1701', code: '1701', name: 'Materiali', total: 0, lines: [createEmptyLine('Acquisto')] }] },
  { id: 'cat-1800', code: '1800', name: 'REPARTO CAMERA', total: 0, accounts: [{ id: 'acc-1801', code: '1801', name: 'Personale Camera', total: 0, lines: [createEmptyLine('Compenso')] }] },
  { id: 'cat-1900', code: '1900', name: 'COSTUMI', total: 0, accounts: [{ id: 'acc-1901', code: '1901', name: 'Personale Costumi', total: 0, lines: [createEmptyLine('Compenso')] }] },
  { id: 'cat-2000', code: '2000', name: 'TRUCCO E PARRUCCO', total: 0, accounts: [{ id: 'acc-2001', code: '2001', name: 'Personale Trucco', total: 0, lines: [createEmptyLine('Compenso')] }] },
  { id: 'cat-2100', code: '2100', name: 'SCENOGRAFIA', total: 0, accounts: [{ id: 'acc-2101', code: '2101', name: 'Personale Scenografia', total: 0, lines: [createEmptyLine('Compenso')] }] },
  { id: 'cat-2200', code: '2200', name: 'PROPS', total: 0, accounts: [{ id: 'acc-2201', code: '2201', name: 'Acquisti e Noleggi', total: 0, lines: [createEmptyLine('Noleggio')] }] },
  { id: 'cat-2300', code: '2300', name: 'REPARTO ARTISTICO', total: 0, accounts: [{ id: 'acc-2301', code: '2301', name: 'Personale Artistico', total: 0, lines: [createEmptyLine('Compenso')] }] },
  { id: 'cat-2400', code: '2400', name: 'COSTRUZIONI', total: 0, accounts: [{ id: 'acc-2401', code: '2401', name: 'Materiali Costruzione', total: 0, lines: [createEmptyLine('Acquisto')] }] },
  { id: 'cat-2500', code: '2500', name: 'VIDEO ASSIST', total: 0, accounts: [{ id: 'acc-2501', code: '2501', name: 'Noleggio Video', total: 0, lines: [createEmptyLine('Noleggio')] }] },
  { id: 'cat-2600', code: '2600', name: 'SUONO (PRESA DIRETTA)', total: 0, accounts: [{ id: 'acc-2601', code: '2601', name: 'Personale Suono', total: 0, lines: [createEmptyLine('Compenso')] }] },
  { id: 'cat-2700', code: '2700', name: 'ELETTRICISTI', total: 0, accounts: [{ id: 'acc-2701', code: '2701', name: 'Personale Elettricisti', total: 0, lines: [createEmptyLine('Compenso')] }] },
  { id: 'cat-2800', code: '2800', name: 'MACCHINISTI', total: 0, accounts: [{ id: 'acc-2801', code: '2801', name: 'Personale Macchinisti', total: 0, lines: [createEmptyLine('Compenso')] }] },
  { id: 'cat-2900', code: '2900', name: 'MEZZI E SERVIZI', total: 0, accounts: [{ id: 'acc-2901', code: '2901', name: 'Noleggio Mezzi', total: 0, lines: [createEmptyLine('Noleggio')] }] },
  { id: 'cat-3000', code: '3000', name: 'EFFETTI SPECIALI', total: 0, accounts: [{ id: 'acc-3001', code: '3001', name: 'SFX', total: 0, lines: [createEmptyLine('Servizio')] }] },
  { id: 'cat-3100', code: '3100', name: 'LOCATION', total: 0, accounts: [{ id: 'acc-3101', code: '3101', name: 'Affitto Location', total: 0, lines: [createEmptyLine('Canone')] }] },
  { id: 'cat-3200', code: '3200', name: 'TRASPORTI', total: 0, accounts: [{ id: 'acc-3201', code: '3201', name: 'Autisti e Mezzi', total: 0, lines: [createEmptyLine('Noleggio')] }] },
  { id: 'cat-3300', code: '3300', name: 'SECONDA UNITÀ', total: 0, accounts: [{ id: 'acc-3301', code: '3301', name: 'Personale 2a Unità', total: 0, lines: [createEmptyLine('Compenso')] }] },
  { id: 'cat-3400', code: '3400', name: 'MONTAGGIO', total: 0, accounts: [{ id: 'acc-3401', code: '3401', name: 'Montatori', total: 0, lines: [createEmptyLine('Compenso')] }] },
  { id: 'cat-3500', code: '3500', name: 'MUSICA', total: 0, accounts: [{ id: 'acc-3501', code: '3501', name: 'Diritti Musicali', total: 0, lines: [createEmptyLine('Licenza')] }] },
  { id: 'cat-3600', code: '3600', name: 'POST-PRODUZIONE AUDIO', total: 0, accounts: [{ id: 'acc-3601', code: '3601', name: 'Mix e Dubbing', total: 0, lines: [createEmptyLine('Turno')] }] },
  { id: 'cat-3700', code: '3700', name: 'POST-PRODUZIONE VIDEO', total: 0, accounts: [{ id: 'acc-3701', code: '3701', name: 'Color Correction', total: 0, lines: [createEmptyLine('Turno')] }] },
  { id: 'cat-3800', code: '3800', name: 'TITOLI', total: 0, accounts: [{ id: 'acc-3801', code: '3801', name: 'Grafica', total: 0, lines: [createEmptyLine('Forfait')] }] },
  { id: 'cat-3900', code: '3900', name: 'ASSICURAZIONI', total: 0, accounts: [{ id: 'acc-3901', code: '3901', name: 'Polizza', total: 0, lines: [createEmptyLine('Premio')] }] },
  { id: 'cat-4000', code: '4000', name: 'PUBBLICITÀ', total: 0, accounts: [{ id: 'acc-4001', code: '4001', name: 'Materiale Promo', total: 0, lines: [createEmptyLine('Stampa')] }] },
  { id: 'cat-4100', code: '4100', name: 'PRODUCT PLACEMENT', total: 0, accounts: [{ id: 'acc-4101', code: '4101', name: 'Agenzia', total: 0, lines: [createEmptyLine('Fee')] }] },
  { id: 'cat-4200', code: '4200', name: 'SPESE GENERALI', total: 0, accounts: [{ id: 'acc-4201', code: '4201', name: 'Ufficio', total: 0, lines: [createEmptyLine('Affitto')] }] },
];

const BudgetApp: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [archive, setArchive] = useState<ArchiveEntry[]>(() => {
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

  const [projectData] = useState(() => {
    const saved = localStorage.getItem(CURRENT_PROJECT_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        let loadedCategories = data.categories || getChartOfAccountsTemplate();
        // Migration: ensure category names are updated even for existing saved budgets
        loadedCategories = loadedCategories.map((cat: Category) => {
          if (cat.code === '1500' && (cat.name === 'COMPARSE E FIGURAZIONI' || cat.name === 'comparse e figurazioni')) {
            return { ...cat, name: 'COMPARSE' };
          }
          if (cat.code === '2100' && (cat.name === 'ARREDAMENTO' || cat.name === 'arredamento')) {
            return { ...cat, name: 'SCENOGRAFIA' };
          }
          if (cat.code === '2300' && (cat.name === 'REPARTO SCENOGRAFIA' || cat.name === 'reparto scenografia')) {
            return { ...cat, name: 'REPARTO ARTISTICO' };
          }
          if (cat.code === '3800' && (cat.name === 'TITOLI E OTTICHE' || cat.name === 'titoli e ottiche')) {
            return { ...cat, name: 'TITOLI' };
          }
          return cat;
        });
        return {
          projectId: data.projectId || 'prj-' + Math.random().toString(36).substring(2, 11),
          projectTitle: data.projectTitle || 'PROGETTO SENZA TITOLO',
          fringes: data.fringes || [],
          categories: loadedCategories,
          availableBudget: data.availableBudget || null
        };
      } catch {
        return null;
      }
    }
    return null;
  });

  const [projectId, setProjectId] = useState(() => projectData?.projectId || 'prj-' + Math.random().toString(36).substring(2, 11));
  const [currentView, setCurrentView] = useState<'editor' | 'report' | 'archive'>('editor');
  const [projectTitle, setProjectTitle] = useState(() => projectData?.projectTitle || 'NUOVO PROGETTO');
  const [tempProjectTitle, setTempProjectTitle] = useState(() => projectData?.projectTitle || 'NUOVO PROGETTO');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  
  const titleContainerRef = useRef<HTMLDivElement>(null);

  const [fringes, setFringes] = useState<Fringe[]>(() => projectData?.fringes || [
    { id: 'f1', name: 'Contributi Previdenziali', rate: 0.15, isAppliedByDefault: true },
  ]);
  const [categories, setCategories] = useState<Category[]>(() => projectData?.categories || getChartOfAccountsTemplate());
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [availableBudget, setAvailableBudget] = useState<string | null>(() => projectData?.availableBudget || null);

  // Stati Modal "Aggiungi Cartella"
  const [isAddFolderModalOpen, setIsAddFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderCode, setNewFolderCode] = useState('');

  useEffect(() => {
    // No-op effect to replace the one that was setting state from localStorage
  }, []);

  const handleSaveTitle = useCallback(() => {
    const trimmed = tempProjectTitle.trim();
    if (trimmed) {
      setProjectTitle(trimmed);
    } else {
      setTempProjectTitle(projectTitle);
    }
    setIsEditingTitle(false);
  }, [tempProjectTitle, projectTitle]);

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
  }, [isEditingTitle, handleSaveTitle]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const data = { projectId, projectTitle, fringes, categories, availableBudget };
      localStorage.setItem(CURRENT_PROJECT_KEY, JSON.stringify(data));
    }, 1000);
    return () => clearTimeout(timer);
  }, [projectId, projectTitle, fringes, categories, availableBudget]);

  const grandTotal = useMemo(() => categories.reduce((sum, cat) => sum + cat.total, 0), [categories]);

  const handleUpdateLine = useCallback((catId: string, accId: string, lineId: string, field: keyof BudgetLine, value: string | number | string[]) => {
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
    let loadedCategories = entry.categories;
    // Migration: ensure category names are updated even for archived budgets
    loadedCategories = loadedCategories.map((cat: Category) => {
      if (cat.code === '1500' && (cat.name === 'COMPARSE E FIGURAZIONI' || cat.name === 'comparse e figurazioni')) {
        return { ...cat, name: 'COMPARSE' };
      }
      if (cat.code === '2100' && (cat.name === 'ARREDAMENTO' || cat.name === 'arredamento')) {
        return { ...cat, name: 'SCENOGRAFIA' };
      }
      if (cat.code === '2300' && (cat.name === 'REPARTO SCENOGRAFIA' || cat.name === 'reparto scenografia')) {
        return { ...cat, name: 'REPARTO ARTISTICO' };
      }
      if (cat.code === '3800' && (cat.name === 'TITOLI E OTTICHE' || cat.name === 'titoli e ottiche')) {
        return { ...cat, name: 'TITOLI' };
      }
      return cat;
    });

    const newData = {
      projectId: entry.id,
      projectTitle: entry.title,
      fringes: entry.fringes,
      categories: loadedCategories,
      availableBudget: entry.availableBudget || null
    };
    localStorage.setItem(CURRENT_PROJECT_KEY, JSON.stringify(newData));

    setProjectId(entry.id);
    setProjectTitle(entry.title);
    setTempProjectTitle(entry.title);
    setCategories(loadedCategories);
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
    setIsResetModalOpen(true);
  };

  const performReset = () => {
    const newProjectId = 'prj-' + Math.random().toString(36).substr(2, 9);
    
    // Check for custom template
    const customTemplate = localStorage.getItem(CUSTOM_TEMPLATE_KEY);
    let baseCategories = getChartOfAccountsTemplate();
    
    if (customTemplate) {
      try {
        baseCategories = JSON.parse(customTemplate);
      } catch (e) {
        console.error("Failed to parse custom template", e);
      }
    }

    const seededCategories = baseCategories.map(cat => ({
      ...cat,
      id: 'cat-' + Math.random().toString(36).substr(2, 9),
      accounts: cat.accounts.map(acc => ({
        ...acc,
        id: 'acc-' + Math.random().toString(36).substr(2, 9),
        lines: acc.lines.map(line => ({
          ...line,
          id: 'l-' + Math.random().toString(36).substr(2, 9),
          amount: '1', // Default quantity
          total: 0,
          rate: '0',
          multiplierX: '1',
          unit: '',
          fringeIds: []
        })),
        total: 0
      })),
      total: 0
    }));

    const newFringes: Fringe[] = [
      { id: 'f1', name: 'Contributi Previdenziali', rate: 0.15, isAppliedByDefault: true },
    ];

    const newData = {
      projectId: newProjectId,
      projectTitle: "NUOVO PROGETTO",
      fringes: newFringes,
      categories: seededCategories,
      availableBudget: null
    };

    // 1. Atomic Write to Storage
    try {
      localStorage.setItem(CURRENT_PROJECT_KEY, JSON.stringify(newData));
    } catch (e) {
      console.error("Failed to save reset state", e);
      alert("Errore durante il salvataggio del nuovo progetto.");
      return;
    }

    // 2. Update UI State
    setProjectId(newProjectId);
    setProjectTitle("NUOVO PROGETTO");
    setTempProjectTitle("NUOVO PROGETTO");
    setCategories(seededCategories);
    setFringes(newFringes);
    setAvailableBudget(null);
    setCurrentView('editor');
    setIsResetModalOpen(false);
  };

  const handleSaveTemplate = () => {
    if (confirm("Vuoi salvare l'attuale struttura delle categorie come template predefinito per i nuovi budget?")) {
      // We save the structure but reset totals and IDs to make it a clean template
      const templateCategories = categories.map(cat => ({
        ...cat,
        total: 0,
        accounts: cat.accounts.map(acc => ({
          ...acc,
          total: 0,
          lines: acc.lines.map(line => ({
            ...line,
            total: 0,
            amount: '1' // Reset quantity to 1 for template
          }))
        }))
      }));
      
      localStorage.setItem(CUSTOM_TEMPLATE_KEY, JSON.stringify(templateCategories));
      alert("Template salvato con successo! Verrà usato per ogni 'Nuovo Budget'.");
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
        onSaveTemplate={handleSaveTemplate}
        onNavigate={(v) => setCurrentView(v === 'archive' ? 'archive' : 'editor')} 
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* MODAL DI RESET BUDGET */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setIsResetModalOpen(false)}>
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="p-8 text-center space-y-6">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Nuovo Budget?</h3>
                <p className="text-slate-500 text-xs font-medium leading-relaxed">
                  Sei sicuro di voler creare un nuovo budget?<br/>
                  <span className="font-bold text-red-500">Tutte le cifre inserite verranno cancellate.</span>
                </p>
              </div>
              <div className="flex flex-col gap-2 pt-2">
                <button onClick={performReset} className="w-full py-4 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-100 hover:bg-emerald-400 transition-all active:scale-95">Conferma e Crea</button>
                <button onClick={() => setIsResetModalOpen(false)} className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 rounded-2xl transition-all">Annulla</button>
              </div>
            </div>
          </div>
        </div>
      )}

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
              key={projectId}
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
