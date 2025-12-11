import React, { useEffect, useState } from 'react';
import { RealTimeFeedback } from '../types';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

interface FloatingFeedbackProps {
  feedbacks: RealTimeFeedback[];
  onDismiss: (id: string) => void;
}

const FloatingFeedback: React.FC<FloatingFeedbackProps> = ({ feedbacks, onDismiss }) => {
  return (
    <div className="fixed bottom-24 right-6 z-50 flex flex-col gap-3 w-80 pointer-events-none">
      {feedbacks.map((item) => (
        <div 
          key={item.id}
          className={`
            pointer-events-auto transform transition-all duration-500 ease-in-out animate-slideIn
            p-4 rounded-lg shadow-2xl border flex gap-3 items-start backdrop-blur-md
            ${item.type === 'error' ? 'bg-red-900/90 border-red-500 text-red-100' : 
              item.type === 'warning' ? 'bg-amber-900/90 border-amber-500 text-amber-100' :
              item.type === 'success' ? 'bg-green-900/90 border-green-500 text-green-100' :
              'bg-blue-900/90 border-blue-500 text-blue-100'}
          `}
        >
          <div className="mt-0.5 shrink-0">
            {item.type === 'error' && <AlertCircle size={18} />}
            {item.type === 'warning' && <AlertCircle size={18} />}
            {item.type === 'success' && <CheckCircle size={18} />}
            {item.type === 'info' && <Info size={18} />}
          </div>
          <div className="flex-1 text-sm leading-relaxed font-medium">
             {item.message}
          </div>
          <button 
            onClick={() => onDismiss(item.id)}
            className="opacity-60 hover:opacity-100 transition-opacity"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default FloatingFeedback;