import React, { createContext, useContext, useState, ReactNode } from 'react';
import Joyride, { Step, CallBackProps, STATUS } from 'react-joyride';
import { useSettings } from './SettingsContext';

interface TutorialContextType {
  startTutorial: (tutorialId: string) => void;
  stopTutorial: () => void;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

export const TutorialProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { theme } = useSettings();
  const [run, setRun] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);
  
  const tutorials: Record<string, Step[]> = {
    hub: [
      {
        target: 'body',
        content: 'Benvenuto in NicoBudget Pro! Questo tutorial ti guiderà attraverso le funzionalità principali.',
        placement: 'center',
        disableBeacon: true,
      },
      {
        target: '.tutorial-budget-banner',
        content: 'Questo è il Plan Budget Pro. Qui puoi creare e gestire i tuoi budget, aggiungere categorie, variabili globali e calcolare oneri in tempo reale.',
        placement: 'bottom',
      },
      {
        target: '.tutorial-cashflow-banner',
        content: 'Questo è il Cashflow Daily. Qui puoi monitorare le entrate e le uscite quotidiane, impostare soglie di allarme e tenere sotto controllo la cassa.',
        placement: 'bottom',
      },
      {
        target: '.tutorial-settings-btn',
        content: 'Qui trovi le impostazioni: puoi cambiare tema (chiaro/scuro), lingua e rivedere questo tutorial in qualsiasi momento.',
        placement: 'left',
      }
    ],
    budget: [
      {
        target: 'body',
        content: 'Benvenuto nel Plan Budget Pro! Scopriamo le sue funzionalità.',
        placement: 'center',
        disableBeacon: true,
      },
      {
        target: '.tutorial-budget-header',
        content: 'Qui in alto vedi il titolo del progetto (clicca per modificarlo), il totale del budget e il budget disponibile calcolato in tempo reale.',
        placement: 'bottom',
      },
      {
        target: '.tutorial-budget-add-category',
        content: 'Usa questo pulsante per aggiungere una nuova cartella (categoria) al tuo budget. Puoi anche aggiungere voci ed eliminare righe direttamente dalla tabella.',
        placement: 'top',
      },
      {
        target: 'body',
        content: 'Usa il menu laterale (o l\'icona in alto a sinistra su mobile) per navigare tra l\'Editor, l\'Archivio e i Report, e per salvare il tuo budget.',
        placement: 'center',
      }
    ],
    cashflow: [
      {
        target: 'body',
        content: 'Benvenuto nel Cashflow Daily! Gestisci le tue produzioni qui.',
        placement: 'center',
        disableBeacon: true,
      },
      {
        target: '.tutorial-cashflow-new',
        content: 'Clicca qui per creare una nuova produzione. Potrai impostare la cassa iniziale e la soglia di allarme.',
        placement: 'top',
      },
      {
        target: '.tutorial-cashflow-list',
        content: 'Qui appariranno le tue produzioni. Clicca su una produzione per gestirne le entrate, le uscite e visualizzare il report. Puoi anche eliminarle usando l\'icona del cestino.',
        placement: 'top',
      }
    ]
  };

  const startTutorial = (tutorialId: string) => {
    if (tutorials[tutorialId]) {
      setSteps(tutorials[tutorialId]);
      setRun(true);
    }
  };

  const stopTutorial = () => {
    setRun(false);
  };

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, action } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];
    if (finishedStatuses.includes(status)) {
      setRun(false);
      // Se finisce il tutorial dell'hub, imposta il flag per continuare
      if (steps === tutorials.hub && action !== 'skip') {
        localStorage.setItem('tutorialFlow', 'active');
      }
    }
  };

  return (
    <TutorialContext.Provider value={{ startTutorial, stopTutorial }}>
      {children}
      <Joyride
        steps={steps}
        run={run}
        continuous
        showSkipButton
        showProgress
        callback={handleJoyrideCallback}
        styles={{
          options: {
            primaryColor: '#6366f1', // indigo-500
            textColor: theme === 'dark' ? '#f8fafc' : '#0f172a',
            backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
            arrowColor: theme === 'dark' ? '#1e293b' : '#ffffff',
            overlayColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 10000,
            width: 320,
          },
          tooltip: {
            borderRadius: '24px',
            padding: '20px',
          },
          tooltipContainer: {
            textAlign: 'left'
          },
          tooltipContent: {
            padding: '10px 0',
            fontSize: '14px',
            lineHeight: '1.5',
          },
          buttonNext: {
            backgroundColor: '#6366f1',
            borderRadius: '12px',
            padding: '10px 20px',
            fontWeight: 'bold',
          },
          buttonBack: {
            color: '#6366f1',
            marginRight: '12px',
            fontWeight: 'bold',
          },
          buttonSkip: {
            color: theme === 'dark' ? '#94a3b8' : '#64748b',
          }
        }}
        floaterProps={{
          disableAnimation: true,
          styles: {
            floater: {
              filter: 'drop-shadow(0 20px 25px rgb(0 0 0 / 0.1)) drop-shadow(0 8px 10px rgb(0 0 0 / 0.1))'
            }
          }
        }}
        locale={{
          back: 'Indietro',
          close: 'Chiudi',
          last: 'Fine',
          next: 'Avanti',
          skip: 'Salta'
        }}
      />
    </TutorialContext.Provider>
  );
};

export const useTutorial = () => {
  const context = useContext(TutorialContext);
  if (context === undefined) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
};
