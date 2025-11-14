import React from 'react';

interface LandingPageProps {
  onStart: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  return (
    <div className="min-h-screen w-full flex flex-col bg-slate-950">
      {/* Header */}
      <header className="w-full bg-[#1e1e1e] text-white p-3 flex justify-between items-center flex-shrink-0 border-b border-slate-700/50">
        <h1 className="text-base font-semibold pl-2">AI Career Advisor</h1>
        <div className="flex items-center gap-5 text-slate-400">
          <div className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <span className="text-sm">Device</span>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 cursor-pointer hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.664 0l3.181-3.183m-4.991-2.696a8.25 8.25 0 00-11.664 0l-3.181 3.183" />
          </svg>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 cursor-pointer hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M20.25 20.25v-4.5m0 4.5h-4.5m4.5 0L15 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9M3.75 20.25h4.5m-4.5 0v-4.5m0 4.5L9 15" />
          </svg>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow w-full flex flex-col items-center justify-center text-white bg-gradient-to-br from-violet-600 to-sky-400 p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        
        <div className="text-center z-10 flex flex-col items-center flex-grow justify-center pt-16 sm:pt-0">
          {/* Doodle Icon */}
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mb-4 opacity-90">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846-.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.572L16.5 21.75l-.398-1.178a3.375 3.375 0 00-2.456-2.456L12.75 18l1.178-.398a3.375 3.375 0 002.456-2.456L16.5 14.25l.398 1.178a3.375 3.375 0 002.456 2.456L20.25 18l-1.178.398a3.375 3.375 0 00-2.456 2.456z" />
          </svg>

          <h1 className="text-4xl md:text-6xl font-extrabold mb-3 tracking-tight">
            AI Career Advisor
          </h1>
          <p className="text-lg md:text-xl mb-10 font-light max-w-xl">
            Khám phá tiềm năng - Định hướng tương lai
          </p>

          <button
            onClick={onStart}
            className="bg-white text-indigo-600 font-bold py-4 px-8 rounded-full shadow-2xl hover:bg-gray-100 transform hover:scale-105 transition-all duration-300 ease-in-out flex items-center gap-3"
            aria-label="Bắt đầu khảo sát"
          >
            Bắt đầu khảo sát
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path transform="rotate(-45 12 12)" d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"></path>
            </svg>
          </button>
        </div>

        <div className="pb-8 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl w-full z-10">
          <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 text-center flex flex-col items-center transition-all duration-300 hover:bg-white/20">
            <div className="mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0l-.07.042m15.482 0l.07.042m-15.552 0a46.176 46.176 0 015.522-2.322m10.03 0a46.175 46.175 0 01-5.522-2.322m0 0a21.08 21.08 0 00-9.228 5.772M12 21a21.08 21.08 0 009.228-5.772" />
              </svg>
            </div>
            <h3 className="font-bold text-xl mb-2">Phân tích chuyên sâu</h3>
            <p className="text-sm font-light opacity-80">AI phân tích tâm lý, sở thích và năng lực của bạn</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 text-center flex flex-col items-center transition-all duration-300 hover:bg-white/20">
             <div className="mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="font-bold text-xl mb-2">Đề xuất cá nhân hóa</h3>
            <p className="text-sm font-light opacity-80">Gợi ý ngành nghề và trường học phù hợp nhất</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 text-center flex flex-col items-center transition-all duration-300 hover:bg-white/20">
            <div className="mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
              </svg>
            </div>
            <h3 className="font-bold text-xl mb-2">Lộ trình rõ ràng</h3>
            <p className="text-sm font-light opacity-80">Kế hoạch phát triển từng bước để thành công</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-[#1e1e1e] p-1 flex justify-end items-center flex-shrink-0 border-t border-slate-700/50">
         <div className="p-1 cursor-pointer rounded-md hover:bg-slate-700/50 transition-colors">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
         </div>
      </footer>
    </div>
  );
};

export default LandingPage;