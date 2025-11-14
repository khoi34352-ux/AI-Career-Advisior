
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-slate-100 dark:bg-slate-900 z-20 shadow-md border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-3xl font-bold leading-tight bg-gradient-to-r from-violet-500 to-sky-400 text-transparent bg-clip-text">
          AI Career Advisor
        </h1>
        <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">
          Định hướng nghề nghiệp thông minh cho học sinh THPT Vĩnh Long
        </p>
      </div>
    </header>
  );
};

export default Header;