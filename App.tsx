import React, { useState, useCallback } from 'react';
import Header from './components/Header';
import ResultsDisplay from './components/ResultsDisplay';
import CareerSimulator from './components/CareerSimulator';
import LoadingIndicator from './components/LoadingIndicator';
import ChatInterface, { type Message } from './components/ChatInterface';
import LandingPage from './components/LandingPage';
import { getCareerAdvice } from './services/geminiService';
import type { AIResults } from './types';

type AppStep = 'landing' | 'chat' | 'loading' | 'results' | 'simulation' | 'error';
export type ConversationBranch = 'has_direction' | 'no_direction';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>('landing');
  const [results, setResults] = useState<AIResults | null>(null);
  const [selectedCareer, setSelectedCareer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleReset = useCallback(() => {
    setStep('landing');
    setResults(null);
    setError(null);
    setSelectedCareer(null);
  }, []);

  const handleApiError = useCallback((err: Error) => {
    setError(err.message || 'Đã xảy ra một lỗi không mong muốn.');
    setStep('error');
  }, []);

  const handleSurveySubmit = useCallback(async (history: Message[], branch: ConversationBranch) => {
    setStep('loading');
    setError(null);
    try {
      const aiResults = await getCareerAdvice(history, branch);
      setResults(aiResults);
      setStep('results');
    } catch (err) {
      handleApiError(err as Error);
    }
  }, [handleApiError]);

  const handleStartSimulation = useCallback((career: string) => {
    setSelectedCareer(career);
    setStep('simulation');
  }, []);
  
  const handleStart = useCallback(() => {
    setStep('chat');
  }, []);

  const renderContent = () => {
    switch (step) {
      case 'chat':
        return <ChatInterface onSubmit={handleSurveySubmit} onApiError={handleApiError} />;
      case 'loading':
        return <LoadingIndicator />;
      case 'results':
        if (results) {
          return <ResultsDisplay results={results} onStartSimulation={handleStartSimulation} onReset={handleReset} />;
        }
        return null;
      case 'simulation':
        if (selectedCareer) {
          return <CareerSimulator career={selectedCareer} onBack={() => setStep('results')} onApiError={handleApiError} />;
        }
        return null;
      case 'error':
        return (
          <div className="text-center p-8">
            <h2 className="text-2xl font-bold text-red-600">Đã xảy ra lỗi</h2>
            <p className="text-gray-700 dark:text-gray-300 mt-4">{error}</p>
            <button
              onClick={handleReset}
className="mt-6 py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Làm lại từ đầu
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  if (step === 'landing') {
    return <LandingPage onStart={handleStart} />;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col">
      <Header />
      <main>
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
