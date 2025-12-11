
import React from 'react';
import { X, BookOpen, FileText } from 'lucide-react';
import { FULL_INTERVIEW_GUIDE } from '../utils/rubrics';

interface GuidelinesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GuidelinesModal: React.FC<GuidelinesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 w-full max-w-4xl h-[85vh] rounded-2xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden animate-fadeIn">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/20 rounded-lg">
                <BookOpen size={24} className="text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Interview Guidelines & Framework</h2>
              <p className="text-slate-400 text-sm mt-0.5">Reference material for Meta/FAANG interviews</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-900">
           <div className="prose prose-invert prose-blue max-w-none">
                <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 mb-8">
                     <h3 className="text-lg font-bold text-blue-300 mb-2 flex items-center gap-2">
                        <FileText size={18} /> How to use this guide
                     </h3>
                     <p className="text-slate-300 text-sm">
                        This guide outlines the specific Delivery Framework used in System Design interviews and the signals assessed in Behavioral/Coding rounds at top tech companies. 
                        The AI interviewer will track your progress against these exact stages.
                     </p>
                </div>

                <div className="whitespace-pre-wrap font-sans text-slate-300 leading-relaxed">
                    {FULL_INTERVIEW_GUIDE.split('\n').map((line, i) => {
                        if (line.startsWith('# ')) {
                            return <h1 key={i} className="text-2xl font-bold text-white mt-8 mb-4 border-b border-slate-700 pb-2">{line.replace('# ', '')}</h1>
                        }
                        if (line.startsWith('## ')) {
                            return <h2 key={i} className="text-xl font-bold text-blue-200 mt-6 mb-3">{line.replace('## ', '')}</h2>
                        }
                        if (line.trim().startsWith('* Green Flag')) {
                             return <div key={i} className="flex items-start gap-2 text-green-300 my-1 bg-green-900/10 p-2 rounded"><span className="font-bold">✓</span> {line.replace('* ', '')}</div>
                        }
                        if (line.trim().startsWith('* Red Flag')) {
                             return <div key={i} className="flex items-start gap-2 text-red-300 my-1 bg-red-900/10 p-2 rounded"><span className="font-bold">✗</span> {line.replace('* ', '')}</div>
                        }
                        if (line.trim().startsWith('- ')) {
                            return <li key={i} className="ml-4 text-slate-300 my-1">{line.replace('- ', '')}</li>
                        }
                        return <p key={i} className="my-1">{line}</p>
                    })}
                </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default GuidelinesModal;
