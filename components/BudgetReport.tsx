import React, { useState, useEffect } from 'react';
import { Category, ReportNotes } from '../types';

interface BudgetReportProps {
  projectId: string;
  projectTitle: string;
  categories: Category[];
  grandTotal: number;
  onBack: () => void;
}

const BudgetReport: React.FC<BudgetReportProps> = ({ projectId, projectTitle, categories, grandTotal, onBack }) => {
  const [notes, setNotes] = useState<ReportNotes>({ leftNote: '', rightNote: '' });
  const STORAGE_KEY = `ncbp_reportNotes_${projectId}`;

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setNotes(JSON.parse(saved));
  }, [projectId]);

  const saveNotes = (updated: Partial<ReportNotes>) => {
    const next = { ...notes, ...updated };
    setNotes(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white min-h-full">
      {/* Report Header for screen only */}
      <div className="bg-slate-50 border-b border-slate-100 px-8 py-4 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-white rounded-xl text-slate-400 transition-all border border-transparent hover:border-slate-200">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Anteprima Report</h2>
        </div>
        <button onClick={handlePrint} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 flex items-center gap-2 hover:bg-indigo-500 transition-all active:scale-95">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
          Stampa / PDF
        </button>
      </div>

      <div className="p-8 md:p-12 max-w-5xl mx-auto space-y-12 print:p-0 print:max-w-none">
        
        {/* Intestazione Documento */}
        <div className="flex justify-between items-start border-b-4 border-slate-900 pb-8">
          <div className="space-y-4">
             <div className="flex flex-col">
               <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] mb-1">Budget Top Sheet</span>
               <h1 className="text-5xl font-black text-slate-900 uppercase tracking-tighter leading-none">{projectTitle}</h1>
             </div>
             <div className="flex gap-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
               <span>Versione: 1.0</span>
               <span>Data Export: {new Date().toLocaleDateString('it-IT')}</span>
             </div>
          </div>
          <div className="text-right">
             <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Estimated Budget</span>
             <span className="text-4xl font-black text-indigo-600 mono-font">{grandTotal.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}</span>
          </div>
        </div>

        {/* Note Editor Panels */}
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest print:hidden">Note Produzione (SX)</label>
            <textarea 
              value={notes.leftNote} 
              onChange={(e) => saveNotes({ leftNote: e.target.value })}
              placeholder="Inserisci note aggiuntive per il report..."
              className="w-full min-h-[100px] p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-medium text-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-inner print:bg-transparent print:border-none print:p-0 print:shadow-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest print:hidden">Note Finanziarie (DX)</label>
            <textarea 
              value={notes.rightNote} 
              onChange={(e) => saveNotes({ rightNote: e.target.value })}
              placeholder="Inserisci dettagli finanziari o disclaimer..."
              className="w-full min-h-[100px] p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-medium text-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-inner print:bg-transparent print:border-none print:p-0 print:shadow-none"
            />
          </div>
        </div>

        {/* Tabella Riepilogo Categorie */}
        <div className="space-y-6">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-2">Riepilogo per Categoria</h3>
          <div className="divide-y divide-slate-100 border border-slate-100 rounded-3xl overflow-hidden print:border-none print:rounded-none">
            {categories.map(cat => (
              <div key={cat.id} className="flex justify-between items-center p-5 bg-white hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-black text-indigo-600 mono-font w-12">{cat.code}</span>
                  <span className="text-sm font-black text-slate-900 uppercase tracking-tight">{cat.name}</span>
                </div>
                <span className="text-sm font-black text-slate-700 mono-font">{cat.total.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Report */}
        <div className="pt-12 border-t border-slate-200 flex justify-between items-center">
          <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">Generated by NicoBudget Pro • Cinematographic Ecosystem</p>
          <div className="flex gap-4">
            <div className="w-12 h-1 bg-slate-100 rounded-full"></div>
            <div className="w-12 h-1 bg-indigo-100 rounded-full"></div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body { background: white !important; }
          .print\\:hidden { display: none !important; }
          .print\\:p-0 { padding: 0 !important; }
          .print\\:border-none { border: none !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:max-w-none { max-width: none !important; }
          @page { margin: 2cm; }
        }
      `}} />
    </div>
  );
};

export default BudgetReport;