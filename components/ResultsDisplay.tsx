import React, { useState, useEffect } from 'react';
import type { AIResults, RecommendedCareer } from '../types';
import MindMapDisplay from './MindMapDisplay';
import HollandChart from './HollandChart'; // 1. Import component biểu đồ

interface ResultsDisplayProps {
  results: AIResults;
  onStartSimulation: (career: string) => void;
  onReset: () => void;
  onSaveCompanion: (studentName: string, career: string, skills: any) => void;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results, onStartSimulation, onReset, onSaveCompanion }) => {
  const { recommendedCareers, finalMotivation, hollandAnalysis } = results; // 2. Lấy thêm dữ liệu Holland

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  
  const [selectedCareer, setSelectedCareer] = useState<RecommendedCareer | null>(null);
  const [favoritedCareer, setFavoritedCareer] = useState<RecommendedCareer | null>(null);

  useEffect(() => {
    if (recommendedCareers && recommendedCareers.length > 0 && !selectedCareer) {
        setSelectedCareer(recommendedCareers[0]);
    }
  }, [recommendedCareers, selectedCareer]);

  // ... (Giữ nguyên logic handleFavoriteCareer và handleSendReport của bạn)
  const handleFavoriteCareer = async (career: RecommendedCareer) => {
    setFavoritedCareer(career);
    setSelectedCareer(career);
    try {
      await fetch('https://hook.us2.make.com/0nq1micr7qg1d0svezmyayb20xueccu9', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'career_favorited',
          careerName: career.career,
          reason: career.reason,
          hollandCode: hollandAnalysis?.primaryCode, // Thêm dữ liệu vào webhook
          timestamp: new Date().toISOString()
        }),
      });
    } catch (error) {
      console.error('Failed to send favorite career webhook:', error);
    }
  };

  const handleSendReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!favoritedCareer) return;
    setSubmissionStatus('sending');
    try {
      const universitiesString = favoritedCareer.universities
        .map(uni => `- ${uni.name} (${uni.region}): ${uni.admissionScore}`)
        .join('\n');

      const processedCareer = { ...favoritedCareer, universities: universitiesString };
      
      const reportPayload = {
        studentName,
        parentEmail,
        submissionDate: new Date().toISOString(),
        reportData: {
            recommendedCareers: [processedCareer],
            hollandAnalysis: results.hollandAnalysis, // Gửi cả điểm số Holland về Email
            finalMotivation: results.finalMotivation,
            supportiveAdvice: results.supportiveAdvice,
            skills: results.skills,
            mindmap_core: favoritedCareer.mindmap?.center || favoritedCareer.career,
            incomeReference: favoritedCareer.incomeReference,
        }
      };

      const response = await fetch('https://hook.us2.make.com/0nq1micr7qg1d0svezmyayb20xueccu9', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportPayload),
      });

      if (!response.ok) throw new Error('Network response was not ok');
      setSubmissionStatus('success');
      onSaveCompanion(studentName, favoritedCareer.career, results.skills);
      setTimeout(() => setIsModalOpen(false), 3000);
    } catch (error) {
      setSubmissionStatus('error');
    }
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => {
        setStudentName('');
        setParentEmail('');
        setSubmissionStatus('idle');
    }, 300);
  };

  return (
    <>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="bg-slate-50 dark:bg-slate-800 rounded-3xl shadow-xl p-8 space-y-12">
          
          {/* SECTION 0: HOLLAND ANALYSIS - PHẦN MỚI THÊM VÀO */}
          {hollandAnalysis && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-indigo-100 dark:border-indigo-900/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-bold uppercase tracking-wider">
                    Phân tích khoa học
                  </span>
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white">
                    Mã Holland của bạn là <span className="text-indigo-600">{hollandAnalysis.primaryCode}</span>
                  </h2>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed italic">
                    "{hollandAnalysis.description}"
                  </p>
                  <div className="flex gap-2 pt-2">
                    {hollandAnalysis.primaryCode.split('').map((char, i) => (
                      <div key={i} className="flex flex-col items-center p-2 bg-slate-50 dark:bg-slate-800 rounded-lg w-16">
                        <span className="text-xl font-bold text-indigo-500">{char}</span>
                        <span className="text-[10px] text-slate-400">Top {i+1}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* HIỂN THỊ BIỂU ĐỒ RADAR TẠI ĐÂY */}
                <div className="flex justify-center bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                  <HollandChart scores={hollandAnalysis.scores} />
                </div>
              </div>
            </div>
          )}

          {/* Section 1: Recommended Careers */}
          <div>
            <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-2">
              Top 3 Ngành Nghề Gợi Ý
            </h2>
             <p className="text-center text-gray-600 dark:text-gray-300 mb-8">
                Dựa trên phân tích <strong>{hollandAnalysis?.primaryCode}</strong>, đây là các công việc bạn sẽ phát huy tối đa tiềm năng.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {(recommendedCareers || []).map((rec, index) => {
                const isSelectedForViewing = selectedCareer?.career === rec.career;
                const isFavorited = favoritedCareer?.career === rec.career;
                return (
                    <div 
                        key={index} 
                        className={`p-6 rounded-2xl shadow-md flex flex-col transition-all duration-300 border-2 cursor-pointer ${
                            isSelectedForViewing 
                            ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500 ring-2 ring-indigo-300 transform scale-[1.02]' 
                            : 'bg-white dark:bg-slate-700 border-transparent hover:border-slate-300'
                        }`}
                        onClick={() => setSelectedCareer(rec)}
                    >
                      {/* Thêm Match Rate nếu có */}
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{rec.career}</h3>
                        {rec.matchRate && (
                          <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-1 rounded-full font-bold">
                            {rec.matchRate}% Match
                          </span>
                        )}
                      </div>
                      
                      <p className="text-gray-700 dark:text-gray-300 mb-4 flex-grow text-sm leading-relaxed">
                        <strong className="font-semibold">Phù hợp vì:</strong> {rec.reason}
                      </p>
                      
                      {/* ... (Phần Universities giữ nguyên như file cũ của bạn) */}
                      <div className="mb-4">
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2 text-sm uppercase tracking-tight">Trường Đại học gợi ý:</h4>
                        <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                          {(rec.universities || []).slice(0, 2).map((uni, uniIndex) => (
                            <li key={uniIndex} className="flex items-center gap-1">
                              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>
                              {uni.name}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="mt-auto space-y-3">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleFavoriteCareer(rec);
                            }}
                            className={`w-full py-2 px-4 rounded-xl font-medium text-sm transition-all ${
                                isFavorited
                                ? 'bg-green-600 text-white shadow-lg shadow-green-200'
                                : 'bg-slate-100 dark:bg-slate-600 text-gray-700 dark:text-white hover:bg-slate-200'
                            }`}
                        >
                             {isFavorited ? "✓ Đã chọn làm mục tiêu" : "Chọn ngành yêu thích"}
                        </button>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onStartSimulation(rec.career);
                            }}
                            className="w-full py-2 px-4 rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none"
                        >
                            Dùng thử thực tế (Mô phỏng)
                        </button>
                      </div>
                    </div>
                );
              })}
            </div>
          </div>

          {/* ... (Các phần Mindmap, Motivation và Modal phía sau giữ nguyên) */}
          {/* Section 2: Mind Map */}
          {selectedCareer && selectedCareer.mindmap && (
            <div className="border-t border-gray-200 dark:border-slate-700 pt-12 animate-fade-in">
               <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-2">
                Sơ Đồ Lộ Trình: {selectedCareer.career}
              </h2>
              <div className="bg-white dark:bg-slate-900 p-2 sm:p-6 rounded-2xl shadow-inner mt-6">
                <MindMapDisplay mindmap={selectedCareer.mindmap} />
              </div>
            </div>
          )}

          {/* ... Lời nhắn AI và Nút hành động cuối cùng ... */}
          {finalMotivation && (
             <div className="border-t border-gray-200 dark:border-slate-700 pt-12">
               <div className="max-w-3xl mx-auto">
                   <blockquote className="relative p-8 text-xl italic border-l-8 bg-indigo-50 text-indigo-900 border-indigo-500 dark:bg-slate-700 dark:text-gray-200 rounded-2xl shadow-sm">
                       <p className="mb-4 leading-relaxed font-medium">"{finalMotivation}"</p>
                       <footer className="text-right text-sm font-bold text-indigo-400">— AI Career Mentor</footer>
                   </blockquote>
               </div>
             </div>
          )}

          <div className="border-t border-gray-200 dark:border-slate-700 pt-12 text-center">
             <div className="flex flex-col items-center gap-4">
               <button
                   onClick={() => setIsModalOpen(true)}
                   disabled={!favoritedCareer}
                   className="w-full max-w-sm py-4 px-8 shadow-xl text-lg font-bold rounded-2xl text-white bg-emerald-600 hover:bg-emerald-700 transition-all transform hover:scale-105 disabled:bg-gray-400"
               >
                   {favoritedCareer ? `Chốt ngành "${favoritedCareer.career}"` : "Vui lòng chọn 1 ngành nghề"}
               </button>
               <button onClick={onReset} className="text-slate-400 hover:text-indigo-600 text-sm font-medium transition-colors">
                  Làm lại từ đầu
               </button>
             </div>
          </div>
        </div>
      </div>
      
      {/* ... Giữ nguyên Modal cũ của bạn ... */}
      {isModalOpen && (
         <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            {/* Modal code của bạn ở đây... */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md p-8 relative animate-fade-in-scale">
               {/* Nội dung form cũ */}
               <button onClick={closeModal} className="absolute top-4 right-4 text-slate-400"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
               <h3 className="text-2xl font-black mb-6">Xác nhận lựa chọn</h3>
               <form onSubmit={handleSendReport} className="space-y-4">
                  <input type="text" placeholder="Tên của bạn" value={studentName} onChange={(e) => setStudentName(e.target.value)} className="w-full p-3 rounded-xl border dark:bg-slate-700" required />
                  <input type="email" placeholder="Email phụ huynh" value={parentEmail} onChange={(e) => setParentEmail(e.target.value)} className="w-full p-3 rounded-xl border dark:bg-slate-700" required />
                  <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg">Gửi báo cáo ngay</button>
               </form>
            </div>
         </div>
      )}
    </>
  );
};

export default ResultsDisplay;
