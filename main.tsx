
import React, { ErrorInfo, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

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
 * Fix: Utilizzo esplicito di React.Component per risolvere gli errori di proprietà mancanti (state, props).
 */
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    // Fix: Inizializzazione dello stato nel costruttore garantendo la corrispondenza con ErrorBoundaryState
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("React Error Boundary caught an error:", error, errorInfo);
  }

  render() {
    // Fix: Accesso a this.state garantito dall'estensione di React.Component
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900 p-10 font-mono text-red-400 overflow-auto">
          <div className="max-w-4xl w-full bg-slate-800 p-8 rounded-3xl border-2 border-red-500/50 shadow-2xl">
            <h1 className="text-2xl font-black mb-4 uppercase tracking-tighter text-white">Errore Critico ⚠️</h1>
            <p className="mb-6 text-slate-300">L'applicazione ha riscontrato un errore fatale:</p>
            <div className="bg-black/50 p-4 rounded-xl mb-6 border border-red-900/30 overflow-auto max-h-[40vh]">
              {/* Fix: Accesso sicuro all'errore nello stato */}
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
    // Fix: Accesso a this.props.children garantito dall'estensione di React.Component
    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
}
