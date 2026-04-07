

import React, { ErrorInfo, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { SettingsProvider } from './contexts/SettingsContext';
import { TutorialProvider } from './contexts/TutorialContext';

/**
 * Props per l'ErrorBoundary.
 */
interface ErrorBoundaryProps {
  children?: ReactNode;
}

/**
 * Stato dell'ErrorBoundary.
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary per catturare errori di rendering.
 * Utilizziamo React.Component per garantire che props e state siano correttamente tipizzati.
 */
// Utilizziamo React.Component per garantire che TypeScript risolva correttamente i membri della classe base.
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // Dichiarazione esplicita della proprietà state per risolvere errori di compilazione in alcuni ambienti.
  public state: ErrorBoundaryState;
  // Dichiarazione esplicita della proprietà props per risolvere l'errore di compilazione dove props non viene rilevata correttamente sulla classe.
  public props: ErrorBoundaryProps;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    // Inizializzazione dello stato iniziale per risolvere l'errore sulla proprietà 'state' mancante.
    this.state = { hasError: false, error: null };
    // Inizializzazione esplicita della proprietà props per soddisfare i controlli di tipo.
    this.props = props;
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("React Error Boundary caught an error:", error, errorInfo);
  }

  render() {
    // Verifica dello stato di errore garantita dall'estensione di React.Component.
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900 p-10 font-mono text-red-400 overflow-auto">
          <div className="max-w-4xl w-full bg-slate-800 p-8 rounded-3xl border-2 border-red-500/50 shadow-2xl">
            <h1 className="text-2xl font-black mb-4 uppercase tracking-tighter text-white">Errore Critico ⚠️</h1>
            <p className="mb-6 text-slate-300">L'applicazione ha riscontrato un errore fatale:</p>
            <div className="bg-black/50 p-4 rounded-xl mb-6 border border-red-900/30 overflow-auto max-h-[40vh]">
              {/* Accesso allo stato dell'errore per visualizzare lo stack trace. */}
              <code className="text-sm block whitespace-pre-wrap">{this.state.error?.stack || this.state.error?.toString()}</code>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-red-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-500 transition-all shadow-xl shadow-red-900/20"
            >
              Ricarica Applicazione
            </button>
          </div>
        </div>
      );
    }
    // Accesso a this.props.children garantito dall'ereditarietà corretta di React.Component.
    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ErrorBoundary>
        <SettingsProvider>
          <TutorialProvider>
            <App />
          </TutorialProvider>
        </SettingsProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
}
