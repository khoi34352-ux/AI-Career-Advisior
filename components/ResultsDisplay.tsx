
import React, { useState } from 'react';
import type { AIResults } from '../types';
import MindMapDisplay from './MindMapDisplay';

interface ResultsDisplayProps {
  results: AIResults;
  onStartSimulation: (career: string) => void;
  onReset: () => void;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results, onStartSimulation, onReset }) => {
  const { recommendedCareers, mindmap, finalMotivation } = results;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const handleSendReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionStatus('sending');
    try {
      // Create a transformed version of the results for the webhook to handle object arrays gracefully.
      const reportDataForWebhook = {
        ...results,
        recommendedCareers: results.recommendedCareers.map(career => ({
          ...career,
          // Convert the universities array into a single formatted string for make.com.
          universities: career.universities
            .map(uni => `${uni.name} (${uni.region}) - ĐC: ${uni.admissionScore}`)
            .join('\n'),
        })),
      };

      const response = await fetch('https://hook.us2.make.com/0nq1micr7qg1d0svezmyayb20xueccu9', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentName,
          parentEmail,
          reportData: reportDataForWebhook, // Send the transformed data
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      setSubmissionStatus('success');
      setTimeout(() => {
        setIsModalOpen(false);
      }, 3000);

    } catch (error) {
      console.error('Failed to send report:', error);
      setSubmissionStatus('error');
    }
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
    // Reset state after a short delay to allow for fade-out animations
    setTimeout(() => {
        setStudentName('');
        setParentEmail('');
        setSubmissionStatus('idle');
    }, 300);
  };

  return (
    <>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg shadow-xl p-8 space-y-12">
          
          {/* Section 1: Recommended Careers */}
          <div>
            <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-8">
              Ngành Nghề Phù Hợp Dành Cho Bạn
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {(recommendedCareers || []).map((rec, index) => (
                <div key={index} className="bg-slate-100 dark:bg-slate-700/50 p-6 rounded-lg shadow-md flex flex-col">
                  <h3 className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mb-3">{rec.career}</h3>
                  <p className="text-gray-700 dark:text-gray-300 mb-4 flex-grow"><strong className="font-semibold">Lý do:</strong> {rec.reason}</p>
                  
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Trường Đại học gợi ý:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-300">
                      {(rec.universities || []).map((uni, uniIndex) => (
                        <li key={uniIndex}>
                          {uni.name} ({uni.region}) - ĐC: {uni.admissionScore}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={() => onStartSimulation(rec.career)}
                    className="mt-auto w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Bắt đầu Mô phỏng
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Mind Map */}
          {mindmap && (
            <div className="border-t border-gray-200 dark:border-slate-700 pt-12">
               <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-2">
                Sơ Đồ Tư Duy Phát Triển Bản Thân
              </h2>
               <p className="text-center text-gray-600 dark:text-gray-300 mb-8">Đây là lộ trình gợi ý giúp bạn xây dựng nền tảng vững chắc cho sự nghiệp tương lai.</p>
              <div className="bg-white dark:bg-slate-900 p-2 sm:p-6 rounded-lg shadow-md overflow-y-auto max-h-[75vh]">
                <MindMapDisplay mindmap={mindmap} />
              </div>
            </div>
          )}

          {/* Section 3: Final Motivation */}
          {finalMotivation && (
            <div className="border-t border-gray-200 dark:border-slate-700 pt-12">
              <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-8">
                Lời Nhắn Từ AI
              </h2>
              <div className="max-w-3xl mx-auto">
                  <blockquote className="relative p-4 text-xl italic border-l-4 bg-slate-100 text-neutral-600 border-neutral-500 quote dark:bg-slate-700 dark:border-gray-500 dark:text-gray-200">
                      <div className="stylistic-quote-mark" aria-hidden="true">&ldquo;</div>
                      <p className="mb-4">{finalMotivation}</p>
                  </blockquote>
              </div>
            </div>
          )}

          {/* Section 4: Action Buttons */}
          <div className="border-t border-gray-200 dark:border-slate-700 pt-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <button
                  onClick={() => {
                      setSubmissionStatus('idle'); 
                      setStudentName(''); 
                      setParentEmail(''); 
                      setIsModalOpen(true);
                  }}
                  className="w-full max-w-sm py-3 px-8 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
              >
                  Gửi Báo Cáo cho Phụ huynh
              </button>
              <button
                  onClick={onReset}
                  className="w-full max-w-sm py-3 px-8 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-slate-600 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
              >
                  Làm lại từ đầu
              </button>
            </div>
          </div>
        </div>
         <style>{`
          .quote .stylistic-quote-mark {
              font-size: 5rem;
              line-height: 1;
              position: absolute;
              top: -0.5rem;
              left: -1.5rem;
              color: #e5e5e5;
              font-family: 'Georgia', serif;
          }
          .dark .quote .stylistic-quote-mark {
              color: #4a5568;
          }
         `}</style>
      </div>
      
      {/* Modal for sending report */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 transition-opacity duration-300" aria-modal="true" role="dialog">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md p-6 relative transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale">
            <button onClick={closeModal} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Gửi Báo Cáo Tư Vấn</h3>

            {submissionStatus === 'success' ? (
              <div className="text-center py-8">
                  <svg className="w-16 h-16 mx-auto text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  <p className="text-lg font-medium mt-4 text-gray-800 dark:text-gray-200">Gửi thành công!</p>
                  <p className="text-gray-600 dark:text-gray-400">Báo cáo sẽ sớm được gửi đến email phụ huynh.</p>
              </div>
            ) : submissionStatus === 'error' ? (
                 <div className="text-center py-8">
                    <svg className="w-16 h-16 mx-auto text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
                    <p className="text-lg font-medium mt-4 text-gray-800 dark:text-gray-200">Gửi thất bại!</p>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">Đã xảy ra lỗi. Vui lòng thử lại.</p>
                    <button onClick={() => setSubmissionStatus('idle')} className="py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Thử lại</button>
                </div>
            ) : (
              <form onSubmit={handleSendReport} className="space-y-4">
                <div>
                  <label htmlFor="studentName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Họ và tên của bạn</label>
                  <input
                    type="text"
                    id="studentName"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    required
                    className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="parentEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email của phụ huynh</label>
                  <input
                    type="email"
                    id="parentEmail"
                    value={parentEmail}
                    onChange={(e) => setParentEmail(e.target.value)}
                    required
                    className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div className="pt-2 flex justify-end gap-3">
                    <button type="button" onClick={closeModal} className="py-2 px-4 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600">
                        Hủy
                    </button>
                    <button
                        type="submit"
                        disabled={submissionStatus === 'sending' || !studentName || !parentEmail}
                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 dark:disabled:bg-indigo-800 disabled:cursor-not-allowed"
                    >
                        {submissionStatus === 'sending' ? 'Đang gửi...' : 'Gửi'}
                    </button>
                </div>
              </form>
            )}
          </div>
          <style>{`
            @keyframes fade-in-scale {
              from {
                opacity: 0;
                transform: scale(0.95);
              }
              to {
                opacity: 1;
                transform: scale(1);
              }
            }
            .animate-fade-in-scale {
              animation: fade-in-scale 0.2s ease-out forwards;
            }
          `}</style>
        </div>
      )}
    </>
  );
};

export default ResultsDisplay;
