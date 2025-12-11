import React from 'react';
import { AssessmentResult } from '../types';
import { Target, Zap, BookOpen, Code, Clock } from 'lucide-react';

interface MetricsDashboardProps {
  scores: AssessmentResult['quality_scores'];
  timeData: { spent: number; expected: number | null; label: string };
}

const MetricBar = ({ label, score, color }: { label: string, score: number, color: string }) => (
  <div className="space-y-1">
    <div className="flex justify-between text-xs font-medium text-slate-400">
      <span>{label}</span>
      <span>{score}/100</span>
    </div>
    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
      <div 
        className={`h-full rounded-full transition-all duration-1000 ease-out ${color}`} 
        style={{ width: `${Math.max(5, score)}%` }}
      />
    </div>
  </div>
);

const MetricsDashboard: React.FC<MetricsDashboardProps> = ({ scores, timeData }) => {
  return (
    <div className="p-6 space-y-6 bg-slate-900/50">
      
      {/* Time Tracking */}
      <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
         <div className="flex items-center gap-2 mb-3 text-slate-300">
            <Clock size={16} className="text-blue-400" />
            <span className="text-xs font-bold uppercase tracking-wider">Phase Timer</span>
         </div>
         <div className="flex justify-between items-end mb-2">
            <div>
               <div className="text-sm font-medium text-white">{timeData.label}</div>
               <div className="text-xs text-slate-500">
                  Target: {timeData.expected ? Math.floor(timeData.expected / 60) + 'm' : 'Flex'}
               </div>
            </div>
            <div className={`text-xl font-mono font-bold ${timeData.expected && timeData.spent > timeData.expected ? 'text-red-400 animate-pulse' : 'text-slate-200'}`}>
               {Math.floor(timeData.spent / 60)}:{String(timeData.spent % 60).padStart(2, '0')}
            </div>
         </div>
         {timeData.expected && (
            <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div 
                   className={`h-full transition-all duration-1000 ${timeData.spent > timeData.expected ? 'bg-red-500' : 'bg-blue-500'}`}
                   style={{ width: `${Math.min(100, (timeData.spent / timeData.expected) * 100)}%` }}
                />
            </div>
         )}
      </div>

      {/* Live Scores */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
          <Target size={14} /> Live Assessment
        </h3>
        
        <MetricBar 
          label="Depth of Analysis" 
          score={scores.depth} 
          color="bg-purple-500" 
        />
        <MetricBar 
          label="Communication Clarity" 
          score={scores.clarity} 
          color="bg-blue-500" 
        />
        <MetricBar 
          label="Technical Accuracy" 
          score={scores.technical} 
          color="bg-green-500" 
        />
        <MetricBar 
          label="Practicality" 
          score={scores.practical} 
          color="bg-orange-500" 
        />
      </div>

      <div className="p-3 bg-slate-800/30 rounded-lg border border-slate-800 text-xs text-slate-500 leading-relaxed">
         AI scores update periodically based on your verbal explanation, code, and diagramming.
      </div>
    </div>
  );
};

export default MetricsDashboard;