import React, { useEffect } from 'react';
import CloseIcon from './icons/CloseIcon';

export interface ToastProps {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ id, message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, 5000); // Auto close after 5 seconds
    return () => clearTimeout(timer);
  }, [id, onClose]);

  const bgColors = {
    success: 'bg-emerald-600',
    error: 'bg-rose-600',
    info: 'bg-slate-800'
  };

  const iconMap = {
    success: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
      </svg>
    ),
    error: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
    ),
    info: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
    )
  };

  return (
    <div className={`${bgColors[type]} text-white px-4 py-3 rounded-lg shadow-xl flex items-start gap-3 min-w-[320px] max-w-md animate-slide-left pointer-events-auto border border-white/10`}>
      <div className="mt-0.5 shrink-0 opacity-90">
        {iconMap[type]}
      </div>
      <div className="flex-grow text-sm font-medium leading-5 pt-0.5 text-white/95">{message}</div>
      <button 
        onClick={() => onClose(id)} 
        className="text-white/70 hover:text-white transition-colors shrink-0 -mt-1 -mr-1 p-1"
      >
        <div className="transform scale-75">
             <CloseIcon />
        </div>
      </button>
    </div>
  );
};

export default Toast;