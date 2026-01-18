
import React, { Component, ErrorInfo, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

/**
 * Props per l'ErrorBoundary.
 * Definiamo 'children' come opzionale per evitare errori di tipizzazione nel rendering JSX.
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

// Error Boundary per catturare errori di rendering
// Utilizziamo interfacce esplicite per garantire che TypeScript riconosca correttamente 'this.state' e 'this.props'
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  // Metodo statico richiesto per aggiornare lo stato in caso di errore
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  // Lifecycle method per il logging degli errori
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("React Error Boundary caught an error:", error, errorInfo);
  }

  render() {
    // Gestione dell'interfaccia di errore
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900 p-10 font-mono text-red-400 overflow-auto">
          <div className="max-w-4xl w-full bg-slate-800 p-8 rounded-3xl border-2 border-red-500/50 shadow-2xl">
            <h1 className="text-2xl font-black mb-4 uppercase tracking-tighter">Errore di Applicazione ⚠️</h1>
            <p className="mb-6 text-slate-300">L'applicazione ha riscontrato un errore fatale durante il rendering:</p>
            <div className="bg-black/50 p-4 rounded-xl mb-6 border border-red-900/30">
              <code className="text-sm block whitespace-pre-wrap">{this.state.error?.toString()}</code>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-red-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-500 transition-all"
            >
              Ricarica Applicazione
            </button>
          </div>
        </div>
      );
    }
    // Rendering standard dei figli
    return this.props.children;
  }
}

// Global listeners per errori fuori da React (es. problemi di caricamento moduli)
window.onerror = (message, source, lineno, colno, error) => {
  console.error("Global Error:", message, error);
};

window.onunhandledrejection = (event) => {
  console.error("Unhandled Promise Rejection:", event.reason);
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Impossibile trovare l'elemento root");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
