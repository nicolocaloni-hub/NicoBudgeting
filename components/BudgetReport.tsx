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
    <div className="bg-white min-h-full w-full overflow-x-hidden relative">
      {/* Report Header for screen only */}
      <div className="bg-slate-50 border-b border-slate-100 px-4 md:px-8 py-4 flex items-center justify-between sticky top-0 z-40 print:hidden">
        <div className="flex items-center gap-2 md:gap-4">
          <button onClick={onBack} className="p-2 hover:bg-white rounded-xl text-slate-400 transition-all border border-transparent hover:border-slate-200">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h2 className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest truncate max-w-[120px] md:max-w-none">Anteprima Report</h2>
        </div>
        <button onClick={handlePrint} className="bg-indigo-600 text-white px-4 md:px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 flex items-center gap-2 hover:bg-indigo-500 transition-all active:scale-95">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
          <span className="hidden sm:inline">Stampa / PDF</span>
          <span className="sm:hidden">Stampa</span>
        </button>
      </div>

      {/* Contenitore Foglio Report: Centrato e Responsive */}
      <div className="px-4 py-8 md:p-12 w-full max-w-[900px] mx-auto space-y-8 md:space-y-12 print:p-0 print:max-w-none print:w-full overflow-x-hidden">
        
        {/* Intestazione Documento */}
        <div className="flex flex-col md:flex-row justify-between items-start border-b-4 border-slate-900 pb-8 gap-6 w-full">
          <div className="space-y-4 w-full md:w-auto">
             <div className="flex flex-col">
               <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] mb-1">Budget Top Sheet</span>
               {/* Titolo responsive: text-2xl su mobile, text-5xl su desktop */}
               <h1 className="text-2xl md:text-5xl font-black text-slate-900 uppercase tracking-tighter leading-tight break-words">
                 {projectTitle}
               </h1>
             </div>
             <div className="flex flex-wrap gap-4 md:gap-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
               <span>Versione: 1.0</span>
               <span>Data Export: {new Date().toLocaleDateString('it-IT')}</span>
             </div>
          </div>
          <div className="text-left md:text-right w-full md:w-auto">
             <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Estimated Budget</span>
             {/* Importo responsive: text-2xl su mobile, text-4xl su desktop */}
             <span className="text-2xl md:text-4xl font-black text-indigo-600 mono-font break-all whitespace-normal">
                {grandTotal.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
             </span>
          </div>
        </div>

        {/* Note Editor Panels: 1 colonna su mobile, 2 su desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 w-full">
          <div className="space-y-2 w-full">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest print:hidden px-1">Note Produzione (SX)</label>
            <textarea 
              value={notes.leftNote} 
              onChange={(e) => saveNotes({ leftNote: e.target.value })}
              placeholder="Note aggiuntive..."
              className="w-full min-h-[100px] p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-medium text-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-inner print:bg-transparent print:border-none print:p-0 print:shadow-none resize-none"
            />
          </div>
          <div className="space-y-2 w-full">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest print:hidden px-1">Note Finanziarie (DX)</label>
            <textarea 
              value={notes.rightNote} 
              onChange={(e) => saveNotes({ rightNote: e.target.value })}
              placeholder="Dettagli finanziari..."
              className="w-full min-h-[100px] p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-medium text-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-inner print:bg-transparent print:border-none print:p-0 print:shadow-none resize-none"
            />
          </div>
        </div>

        {/* Tabella Riepilogo Categorie: Scroll isolato solo per la tabella */}
        <div className="space-y-6 w-full overflow-hidden">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-2">Riepilogo per Categoria</h3>
          <div className="w-full overflow-x-auto scrollbar-hide pb-2">
            <div className="min-w-[320px] divide-y divide-slate-100 border border-slate-100 rounded-3xl overflow-hidden print:border-none print:rounded-none">
              {categories.map(cat => (
                <div key={cat.id} className="flex justify-between items-center p-4 md:p-5 bg-white hover:bg-slate-50 transition-colors gap-3">
                  <div className="flex items-center gap-3 md:gap-4 min-w-0">
                    <span className="text-[10px] md:text-xs font-black text-indigo-600 mono-font w-8 md:w-12 shrink-0">{cat.code}</span>
                    <span className="text-xs md:text-sm font-black text-slate-900 uppercase tracking-tight truncate pr-2">{cat.name}</span>
                  </div>
                  <span className="text-xs md:text-sm font-black text-slate-700 mono-font shrink-0">
                    {cat.total.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Report */}
        <div className="pt-8 md:pt-12 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left w-full">
          <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] leading-relaxed">
            Generated by NicoBudget Pro • Cinematographic Production Ecosystem
          </p>
          <div className="flex gap-4">
            <div className="w-12 h-1 bg-slate-100 rounded-full"></div>
            <div className="w-12 h-1 bg-indigo-100 rounded-full"></div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body { background: white !important; overflow: visible !important; }
          .print\\:hidden { display: none !important; }
          .print\\:p-0 { padding: 0 !important; }
          .print\\:border-none { border: none !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:max-w-none { max-width: none !important; }
          .print\\:w-full { width: 100% !important; }
          @page { margin: 1.5cm; }
          * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
        }
      `}} />
    </div>
  );
};

export default BudgetReport;