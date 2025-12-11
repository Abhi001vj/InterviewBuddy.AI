
import React, { useState, useEffect } from 'react';
import { X, Save, RotateCcw, FileText } from 'lucide-react';

interface RubricSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  currentGuide: string;
  onSave: (newGuide: string) => void;
  onReset: () => void;
  companyName: string;
}

const RubricSettings: React.FC<RubricSettingsProps> = ({ 
  isOpen, 
  onClose, 
  currentGuide, 
  onSave, 
  onReset,
  companyName 
}) => {
  const [text, setText] = useState(currentGuide);

  useEffect(() => {
    setText(currentGuide);
  }, [currentGuide, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 w-full max-w-3xl h-[80vh] rounded-2xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden animate-fadeIn">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-600/20 rounded-lg">
                <FileText size={24} className="text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Interview Guidelines Configuration</h2>
              <p className="text-slate-400 text-sm mt-0.5">Customizing AI Instructions for {companyName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-0 relative">
            <textarea 
                className="w-full h-full bg-slate-900 text-slate-300 font-mono text-sm p-6 outline-none resize-none"
                value={text}
                onChange={(e) => setText(e.target.value)}
                spellCheck={false}
                placeholder="Enter custom interview guidelines, rubrics, and instructions for the AI interviewer here..."
            />
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 bg-slate-950 flex justify-between items-center">
            <button 
                onClick={() => {
                    onReset();
                }}
                className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors text-sm font-medium"
            >
                <RotateCcw size={16} /> Reset to {companyName} Default
            </button>
            <div className="flex gap-3">
                <button 
                    onClick={onClose}
                    className="px-4 py-2 text-slate-300 hover:bg-slate-800 rounded-lg transition-colors text-sm font-medium"
                >
                    Cancel
                </button>
                <button 
                    onClick={() => { onSave(text); onClose(); }}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-lg shadow-blue-900/20 transition-all font-medium text-sm"
                >
                    <Save size={16} /> Save Changes
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default RubricSettings;
