import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';
type Language = 'it' | 'en';

interface SettingsContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  language: Language;
  setLanguage: (language: Language) => void;
  t: Record<string, string>;
}

const translations = {
  it: {
    subtitle: "Strumenti professionali per la gestione finanziaria cinematografica.",
    planBudgetTitle: "Plan budget pro",
    planBudgetSub: "pianificazione finanziaria",
    planBudgetDesc: "Gestione professionale di categorie, variabili globali e oneri dinamici in tempo reale.",
    cashflowTitle: "Cashflow Daily",
    cashflowSub: "monitoraggio finanziario quotidiano",
    theme: "Tema",
    light: "Chiaro",
    dark: "Scuro",
    language: "Lingua",
    // Budget App
    newProject: "NUOVO PROGETTO",
    budgetEditor: "Budget Editor",
    budgetArchive: "Archivio Budget",
    reportExport: "Report & Export",
    totalBudget: "Totale Budget",
    available: "Disponibile",
    addCategory: "Aggiungi Categoria",
    saveTemplate: "Salva Template",
    // Cashflow Home
    yourProductions: "Le Tue Produzioni",
    newProduction: "Nuova Produzione",
    noProductions: "Nessuna produzione attiva",
    startCreating: "Inizia creando la tua prima produzione per monitorare il cashflow.",
    // Cashflow Dashboard
    cashflowDashboard: "Dashboard Cashflow",
    initialCash: "Cassa Iniziale",
    alarmThreshold: "Soglia Allarme",
    totalIncome: "Totale Entrate",
    totalExpenses: "Totale Uscite",
    currentBalance: "Saldo Attuale"
  },
  en: {
    subtitle: "Professional tools for cinematic financial management.",
    planBudgetTitle: "Plan budget pro",
    planBudgetSub: "financial planning",
    planBudgetDesc: "Professional management of categories, global variables, and real-time dynamic fringes.",
    cashflowTitle: "Cashflow Daily",
    cashflowSub: "daily financial monitoring",
    theme: "Theme",
    light: "Light",
    dark: "Dark",
    language: "Language",
    // Budget App
    newProject: "NEW PROJECT",
    budgetEditor: "Budget Editor",
    budgetArchive: "Budget Archive",
    reportExport: "Report & Export",
    totalBudget: "Total Budget",
    available: "Available",
    addCategory: "Add Category",
    saveTemplate: "Save Template",
    // Cashflow Home
    yourProductions: "Your Productions",
    newProduction: "New Production",
    noProductions: "No active productions",
    startCreating: "Start by creating your first production to monitor cashflow.",
    // Cashflow Dashboard
    cashflowDashboard: "Cashflow Dashboard",
    initialCash: "Initial Cash",
    alarmThreshold: "Alarm Threshold",
    totalIncome: "Total Income",
    totalExpenses: "Total Expenses",
    currentBalance: "Current Balance"
  }
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme');
    return (savedTheme as Theme) || 'light';
  });

  const [language, setLanguageState] = useState<Language>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as Language) || 'it';
  });

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
    localStorage.setItem('language', newLanguage);
  };

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const t = translations[language];

  return (
    <SettingsContext.Provider value={{ theme, setTheme, language, setLanguage, t }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
