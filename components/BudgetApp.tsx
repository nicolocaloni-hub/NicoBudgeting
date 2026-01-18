import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GlobalVar, Fringe, Category, BudgetLine, Account, ArchiveEntry } from '../types';
import Sidebar from './Sidebar';
import BudgetTable from './BudgetTable';
import { recalculateBudget, parseCurrency } from '../utils/calculations';
import { exportBudgetPdf } from '../utils/exportBudgetPdf';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

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
  },
  {
    id: 'cat-1100', code: '1100', name: 'Produttori', total: 0,
    accounts: [
      { id: 'acc-1101', code: '1101', name: 'Produttore Esecutivo', total: 0, lines: [createLine('Prod. Esecutivo')] },
    ]
  }
];

const getInitialFringesList = (): Fringe[] => [
  { id: 'f1', name: 'Contributi Previdenziali', rate: 0.15, isAppliedByDefault: true },
  { id: 'f2', name: 'Assicurazione Sanitaria', rate: 0.05, isAppliedByDefault: true },
];

const BudgetApp: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [projectId, setProjectId] = useState(() => 'prj-' + Math.random().toString(36).substr(2, 9));
  const [currentView, setCurrentView] = useState<'editor' | 'summary' | 'archive'>('editor');
  const [projectTitle, setProjectTitle] = useState('NUOVO PROGETTO');
  const [fringes, setFringes] = useState<Fringe[]>(getInitialFringesList());
  const [categories, setCategories] = useState<Category[]>(() => recalculateBudget(getInitialCategories(), INITIAL_GLOBALS, getInitialFringesList()));
  const [archive, setArchive] = useState<ArchiveEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAddCatModalOpen, setIsAddCatModalOpen] = useState(false);
  const [newCatData, setNewCatData] = useState({ code: '', name: '' });
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [availableBudget, setAvailableBudget] = useState<string | null>(null);
  const [isCapModalOpen, setIsCapModalOpen] = useState(false);
  const [tempCap, setTempCap] = useState('');

  useEffect(() => {
    const savedArchive = localStorage.getItem(ARCHIVE_KEY);
    if (savedArchive) try { setArchive(JSON.parse(savedArchive)); } catch (e) {}
    const savedCurrent = localStorage.getItem(CURRENT_PROJECT_KEY);
    if (savedCurrent) {
      try {
        const data = JSON.parse(savedCurrent);
        setProjectId(data.projectId);
        setProjectTitle(data.projectTitle);
        setFringes(data.fringes);
        setCategories(data.categories);
        if (data.availableBudget !== undefined) setAvailableBudget(data.availableBudget);
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      const data = { projectId, projectTitle, fringes, categories, availableBudget };
      localStorage.setItem(CURRENT_PROJECT_KEY, JSON.stringify(data));
    }, 1000);
    return () => clearTimeout(timer);
  }, [projectId, projectTitle, fringes, categories, availableBudget]);

  const grandTotal = useMemo(() => categories.reduce((sum, cat) => sum + cat.total, 0), [categories]);
  const budgetData = useMemo(() => {
    const cap = parseCurrency(availableBudget);
    if (cap === null || cap <= 0) return null;
    return { cap, remaining: cap - grandTotal };
  }, [availableBudget, grandTotal]);

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

  const chartData = useMemo(() => {
    return [...categories].sort((a, b) => b.total - a.total).slice(0, 5).map(cat => ({
      name: cat.name.length > 15 ? cat.name.substring(0, 12) + '...' : cat.name,
      total: cat.total
    }));
  }, [categories]);

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden text-slate-900 font-sans relative">
      <Sidebar 
        fringes={fringes} currentView={currentView} isOpen={isSidebarOpen}
        onUpdateFringe={(id, f, v) => setFringes(fringes.map(fr => fr.id === id ? {...fr, [f]: v} : fr))}
        onDeleteFringe={(id) => setFringes(fringes.filter(f => f.id !== id))}
        onAddFringe={() => setFringes([...fringes, { id: Math.random().toString(), name: 'Nuovo', rate: 0, isAppliedByDefault: false }])}
        onArchiveBudget={() => {}} onResetBudget={() => {}} onNavigate={setCurrentView} onClose={() => setIsSidebarOpen(false)}
      />

      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between shadow-sm shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
            <h1 className="text-sm font-black text-slate-900 uppercase tracking-tighter">{projectTitle}</h1>
          </div>
          <div className="text-right">
            <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Totale Budget</span>
            <span className="text-xl font-black text-indigo-600 mono-font">{grandTotal.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
           <div className="bg-white p-6 rounded-2xl border border-slate-100 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700 }} />
                  <YAxis hide />
                  <Tooltip />
                  <Bar dataKey="total" fill="#4f46e5" radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
           </div>
           
           <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
             <BudgetTable 
                categories={categories} globals={INITIAL_GLOBALS} fringes={fringes} searchTerm={searchTerm}
                onUpdateLine={handleUpdateLine} onUpdateAccountName={() => {}} onAddLine={() => {}} onDeleteLine={() => {}}
                onAddFringe={() => null} onAddAccount={() => {}} onDeleteAccount={() => {}} onDeleteCategory={() => {}}
                onUpdateCategoryNotes={() => {}} onUpdateAccountNotes={() => {}}
             />
           </div>
        </div>
      </main>
    </div>
  );
};

export default BudgetApp;