// components/LoadingModal.jsx
import React from 'react';

const LoadingModal = ({ message }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white text-black px-8 py-6 rounded-xl shadow-xl text-2xl animate-pulse">
        {message || "처리 중..."}
      </div>
    </div>
  );
};

export default LoadingModal;