import React from 'react';
import { X, Award, AlertTriangle, BookOpen, CheckCircle } from 'lucide-react';
import { FeedbackReport } from '../types';

interface FeedbackModalProps {
  report: FeedbackReport | null;
  onClose: () => void;
  isLoading: boolean;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ report, onClose, isLoading }) => {
  if (!report && !isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 w-full max-w-4xl h-[90vh] rounded-2xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden animate-fadeIn">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950">
          <div>
            <h2 className="text-2xl font-bold text-white">Interview Feedback Report</h2>
            <p className="text-slate-400 text-sm mt-1">AI Analysis based on Meta/FAANG Rubrics</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
            <X size={24} className="text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-blue-300 animate-pulse">Generating detailed analysis...</p>
            </div>
          ) : report ? (
            <div className="space-y-8">
              
              {/* Summary Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="col-span-2 bg-slate-800/50 p-6 rounded-xl border border-slate-700">
                  <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                    <BookOpen size={20} className="text-blue-400" /> Executive Summary
                  </h3>
                  <p className="text-slate-300 leading-relaxed text-sm">{report.summary}</p>
                </div>
                <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 flex flex-col items-center justify-center text-center">
                  <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-400 to-purple-400 mb-2">
                    {report.overallScore}/10
                  </div>
                  <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Overall Score</span>
                </div>
              </div>

              {/* Strengths & Weaknesses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-green-900/10 border border-green-900/30 p-6 rounded-xl">
                  <h3 className="text-green-400 font-bold mb-4 flex items-center gap-2">
                    <CheckCircle size={18} /> Strengths (Green Flags)
                  </h3>
                  <ul className="space-y-2">
                    {report.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-green-100/80">
                        <span className="mt-1.5 w-1.5 h-1.5 bg-green-500 rounded-full shrink-0"></span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-red-900/10 border border-red-900/30 p-6 rounded-xl">
                  <h3 className="text-red-400 font-bold mb-4 flex items-center gap-2">
                    <AlertTriangle size={18} /> Areas for Improvement (Red Flags)
                  </h3>
                  <ul className="space-y-2">
                    {report.weaknesses.map((w, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-red-100/80">
                        <span className="mt-1.5 w-1.5 h-1.5 bg-red-500 rounded-full shrink-0"></span>
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Detailed Breakdown */}
              <div>
                <h3 className="text-lg font-bold text-white mb-4">Stage-by-Stage Analysis</h3>
                <div className="space-y-4">
                  {report.stages.map((stage, idx) => (
                    <div key={idx} className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-blue-200">{stage.stage}</span>
                        <div className="flex gap-1">
                          {[1,2,3,4,5].map(star => (
                            <div key={star} className={`w-2 h-2 rounded-full ${star <= stage.score ? 'bg-blue-500' : 'bg-slate-700'}`} />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-slate-400">{stage.feedback}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Detailed Markdown Content */}
              <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 font-mono text-sm text-slate-400 whitespace-pre-wrap">
                 {report.detailedAssessment}
              </div>

            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;
