import React, { useState, useEffect } from 'react';
import { startSimulation, evaluateSimulation } from '../services/geminiService';
import type { SimulationPlan, SimulationReport, UserAnswer } from '../types';
import LoadingIndicator from './LoadingIndicator';

interface CareerSimulatorProps {
  career: string;
  onBack: () => void;
  onApiError: (error: Error) => void;
}

type SimulationStatus = 'loadingPlan' | 'intro' | 'inProgress' | 'loadingReport' | 'report' | 'error';

const CompetencyBar: React.FC<{ label: string; score: number }> = ({ label, score }) => {
    const percentage = score * 10;
    return (
        <div>
            <div className="flex justify-between mb-1">
                <span className="text-base font-medium text-gray-700 dark:text-gray-300">{label}</span>
                <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">{score}/10</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${percentage}%` }}></div>
            </div>
        </div>
    );
};

const SimulationReportDisplay: React.FC<{ report: SimulationReport; career: string, onRestart: () => void }> = ({ report, career, onRestart }) => {
    const { strengths, improvements, competencySummary, developmentSuggestions, refinedRecommendations } = report;
    return (
      <div className="space-y-8">
        <div>
           <h3 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-6">Kết quả Mô phỏng: {career}</h3>
        </div>

        {/* Competency Summary */}
        <div className="bg-slate-100 dark:bg-slate-700/50 p-6 rounded-lg">
          <h4 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Tổng quan năng lực</h4>
          <div className="space-y-4">
             <CompetencyBar label="Tư duy phản biện" score={competencySummary.criticalThinking} />
             <CompetencyBar label="Kỹ năng chuyên môn" score={competencySummary.professionalSkills} />
             <CompetencyBar label="Giao tiếp & Hợp tác" score={competencySummary.communication} />
             <CompetencyBar label="Ứng biến & Thích nghi" score={competencySummary.adaptability} />
          </div>
        </div>
        
        {/* Strengths and Improvements */}
        <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-emerald-50 dark:bg-emerald-900/30 p-5 rounded-lg border border-emerald-200 dark:border-emerald-700">
                <h4 className="text-lg font-semibold text-emerald-800 dark:text-emerald-300 mb-2">✅ Điểm mạnh</h4>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{strengths}</p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/30 p-5 rounded-lg border border-amber-200 dark:border-amber-700">
                <h4 className="text-lg font-semibold text-amber-800 dark:text-amber-300 mb-2">💡 Cần cải thiện</h4>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{improvements}</p>
            </div>
        </div>

        {/* Suggestions */}
        <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-slate-100 dark:bg-slate-700/50 p-5 rounded-lg">
                <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">🚀 Lộ trình phát triển</h4>
                <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                    {developmentSuggestions.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
            </div>
            <div className="bg-slate-100 dark:bg-slate-700/50 p-5 rounded-lg">
                <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">🧭 Hướng đi liên quan</h4>
                <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                    {refinedRecommendations.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
            </div>
        </div>
        <div className="text-center pt-4">
          <button onClick={onRestart} className="py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
              Thử lại mô phỏng này
          </button>
        </div>
      </div>
    );
};

const CareerSimulator: React.FC<CareerSimulatorProps> = ({ career, onBack, onApiError }) => {
  const [status, setStatus] = useState<SimulationStatus>('loadingPlan');
  const [plan, setPlan] = useState<SimulationPlan | null>(null);
  const [report, setReport] = useState<SimulationReport | null>(null);
  const [answers, setAnswers] = useState<UserAnswer[]>([]);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState('');

  const loadSimulationPlan = async () => {
    setStatus('loadingPlan');
    setAnswers([]);
    setCurrentTaskIndex(0);
    setCurrentAnswer('');
    try {
      const simulationPlan = await startSimulation(career);
      setPlan(simulationPlan);
      setStatus('intro');
    } catch (err) {
      onApiError(err as Error);
      setStatus('error');
    }
  };

  useEffect(() => {
    loadSimulationPlan();
  }, [career]);

  const handleNext = async () => {
    if (!plan) return;
    
    const currentTask = plan.tasks[currentTaskIndex];
    const newAnswers: UserAnswer[] = [...answers, { taskDescription: currentTask.description, answer: currentAnswer }];
    setAnswers(newAnswers);
    setCurrentAnswer('');

    if (currentTaskIndex < plan.tasks.length - 1) {
      setCurrentTaskIndex(currentTaskIndex + 1);
    } else {
      setStatus('loadingReport');
      try {
        const result = await evaluateSimulation(career, newAnswers);
        setReport(result);
        setStatus('report');
      } catch (err) {
        onApiError(err as Error);
        setStatus('error');
      }
    }
  };
  
  const renderContent = () => {
    switch (status) {
      case 'loadingPlan':
        return <LoadingIndicator />;
      
      case 'intro':
        return (
            <div className="text-center">
                <h3 className="text-xl font-semibold text-indigo-600 dark:text-indigo-400 mb-6">{plan?.career}</h3>
                <p className="prose prose-lg dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 mb-8 whitespace-pre-line">{plan?.introduction}</p>
                <button onClick={() => setStatus('inProgress')} className="py-3 px-8 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                    Bắt đầu
                </button>
            </div>
        );

      case 'inProgress':
        if (!plan) return null;
        const task = plan.tasks[currentTaskIndex];
        const progress = ((currentTaskIndex + 1) / plan.tasks.length) * 100;

        return (
          <div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mb-6">
                <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
            </div>
            <p className="text-sm text-center text-gray-500 dark:text-gray-400 mb-4">Nhiệm vụ {currentTaskIndex + 1} / {plan.tasks.length}</p>
            <p className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-6 text-center">{task.description}</p>
            
            {task.type === 'multiple-choice' && (
              <div className="flex flex-col gap-4">
                {task.options?.map((option, index) => (
                  <button key={index} onClick={() => { setCurrentAnswer(option); }} className={`w-full text-left p-4 border rounded-lg transition-colors ${currentAnswer === option ? 'bg-indigo-100 dark:bg-indigo-900 border-indigo-500 ring-2 ring-indigo-500' : 'bg-slate-100 dark:bg-slate-700/50 border-slate-300 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
                    {option}
                  </button>
                ))}
              </div>
            )}
            
            {task.type === 'text-input' && (
              <textarea
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder="Nhập câu trả lời của bạn..."
                rows={5}
                className="w-full p-3 border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              />
            )}
            
            <div className="mt-8 text-center">
              <button onClick={handleNext} disabled={!currentAnswer.trim()} className="py-2 px-8 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 dark:disabled:bg-indigo-800">
                {currentTaskIndex === plan.tasks.length - 1 ? 'Hoàn thành & Xem kết quả' : 'Tiếp theo'}
              </button>
            </div>
          </div>
        );

      case 'loadingReport':
        return <LoadingIndicator />;

      case 'report':
        return report && <SimulationReportDisplay report={report} career={career} onRestart={loadSimulationPlan} />;
        
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="bg-slate-50 dark:bg-slate-800 rounded-lg shadow-xl p-8 relative min-h-[60vh]">
        <button onClick={onBack} className="absolute top-4 left-4 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 z-10">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
        </button>
        <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">Career Path Simulator</h2>
        {status !== 'report' && <h3 className="text-xl font-semibold text-center text-indigo-600 dark:text-indigo-400 mb-6">{career}</h3>}
        
        <div className="mt-8 border-t border-gray-200 dark:border-slate-700 pt-6">
            {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default CareerSimulator;
