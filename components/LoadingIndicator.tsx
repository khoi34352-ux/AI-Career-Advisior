import React, { useState, useEffect } from 'react';

const loadingTexts = [
  "Đang phân tích câu trả lời của bạn...",
  "Đối chiếu với hàng ngàn hồ sơ năng lực...",
  "AI đang suy luận để tìm ra lựa chọn tốt nhất...",
  "Xây dựng sơ đồ tư duy cá nhân hóa...",
  "Sắp xong rồi, chờ một chút nhé!",
];

const LoadingIndicator: React.FC = () => {
  const [textIndex, setTextIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTextIndex((prevIndex) => (prevIndex + 1) % loadingTexts.length);
    }, 2500); // Change text every 2.5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center text-center p-8" style={{ minHeight: '60vh' }}>
      <svg className="animate-spin h-12 w-12 text-indigo-600 dark:text-indigo-400 mb-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">AI đang làm việc...</h2>
      <p className="text-lg text-gray-600 dark:text-gray-300 transition-opacity duration-500 ease-in-out">
        {loadingTexts[textIndex]}
      </p>
    </div>
  );
};

export default LoadingIndicator;