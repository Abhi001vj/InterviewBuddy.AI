import React, { useRef, useEffect } from 'react';
import { RealTimeFeedback } from '../types';
import { AlertCircle, CheckCircle, Info, X, MessageSquare, AlertTriangle } from 'lucide-react';

interface FeedbackListProps {
  feedbacks: RealTimeFeedback[];
  isOpen: boolean;
  onClose: () => void;
}

const FeedbackList: React.FC<FeedbackListProps> = ({ feedbacks, isOpen, onClose }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [feedbacks, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="absolute top-14 right-4 w-96 max-h-[500px] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-40 flex flex-col animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-slate-800 bg-slate-950 rounded-t-xl">
        <div className="flex items-center gap-2">
          <MessageSquare size={16} className="text-blue-400" />
          <h3 className="text-sm font-bold text-white">AI Feedback History</h3>
          <span className="bg-blue-900/50 text-blue-200 text-[10px] px-1.5 py-0.5 rounded-full border border-blue-800">
            {feedbacks.length}
          </span>
        </div>
        <button 
          onClick={onClose}
          className="p-1 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
        {feedbacks.length === 0 ? (
          <div className="text-center py-8 px-4">
            <div className="bg-slate-800/50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
               <Info size={24} className="text-slate-600" />
            </div>
            <p className="text-slate-500 text-sm">No feedback yet. Start the interview!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {feedbacks.map((item) => (
              <div 
                key={item.id}
                className={`
                  p-3 rounded-lg border text-xs leading-relaxed flex gap-3
                  ${item.type === 'error' ? 'bg-red-950/30 border-red-900/50 text-red-200' : 
                    item.type === 'warning' ? 'bg-amber-950/30 border-amber-900/50 text-amber-200' :
                    item.type === 'success' ? 'bg-green-950/30 border-green-900/50 text-green-200' :
                    'bg-slate-800/50 border-slate-700 text-blue-200'}
                `}
              >
                <div className="shrink-0 mt-0.5">
                  {item.type === 'error' && <AlertCircle size={14} className="text-red-400" />}
                  {item.type === 'warning' && <AlertTriangle size={14} className="text-amber-400" />}
                  {item.type === 'success' && <CheckCircle size={14} className="text-green-400" />}
                  {item.type === 'info' && <Info size={14} className="text-blue-400" />}
                </div>
                <div className="flex-1">
                  <div className="font-medium mb-0.5">{item.message}</div>
                  <div className="text-[10px] opacity-60">
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackList;