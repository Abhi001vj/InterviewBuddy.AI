import React from 'react';
import { CheckCircle2, Circle, XCircle, AlertCircle, ArrowRight, PlayCircle } from 'lucide-react';
import { InterviewPhase } from '../types';

interface TimelineProps {
  phases: InterviewPhase[];
  currentPhaseIndex: number;
  timeSpent: {[key: string]: number};
  onPhaseClick: (phaseId: string) => void;
}

const Timeline: React.FC<TimelineProps> = ({ phases, currentPhaseIndex, timeSpent, onPhaseClick }) => {
  
  const getStatusColor = (index: number) => {
    if (index < currentPhaseIndex) return 'border-green-500/50 bg-green-900/20 text-green-200';
    if (index === currentPhaseIndex) return 'border-blue-500/50 bg-blue-900/20 text-blue-200 shadow-[0_0_15px_rgba(59,130,246,0.3)]';
    return 'border-slate-800 bg-slate-900/50 text-slate-600';
  };

  const getIcon = (index: number) => {
     if (index < currentPhaseIndex) return <CheckCircle2 size={16} className="text-green-500" />;
     if (index === currentPhaseIndex) return <PlayCircle size={16} className="text-blue-500 animate-pulse" />;
     return <Circle size={16} />;
  };

  return (
    <div className="w-full bg-slate-950 border-b border-slate-800 p-2">
      <div className="flex items-center justify-between max-w-7xl mx-auto overflow-x-auto pb-2 custom-scrollbar gap-2 px-2">
        {phases.map((phase, idx) => {
          const isActive = idx === currentPhaseIndex;
          const isPast = idx < currentPhaseIndex;
          const spent = timeSpent[phase.id] || 0;
          const duration = phase.duration || 0;
          
          return (
            <React.Fragment key={phase.id}>
              <div 
                onClick={() => onPhaseClick(phase.id)}
                className={`flex flex-col gap-1 min-w-[160px] p-2 rounded-lg border transition-all duration-300 cursor-pointer hover:bg-slate-900 ${getStatusColor(idx)}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {getIcon(idx)}
                  <span className={`text-[11px] font-bold uppercase tracking-wider ${isActive ? 'text-white' : ''}`}>
                    {phase.name}
                  </span>
                </div>
                
                {/* Progress Mini Bar */}
                {duration > 0 && (
                   <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 ${spent > duration ? 'bg-red-500' : isActive ? 'bg-blue-500' : isPast ? 'bg-green-500' : 'bg-slate-700'}`} 
                        style={{ width: `${Math.min(100, (spent / duration) * 100)}%` }}
                      />
                   </div>
                )}
                
                <div className="flex justify-between text-[9px] opacity-70 font-mono mt-1">
                   <span>{Math.floor(spent / 60)}:{String(spent % 60).padStart(2, '0')}</span>
                   {duration > 0 && <span>/ {Math.floor(duration / 60)}m</span>}
                </div>
              </div>
              
              {idx < phases.length - 1 && (
                <div className="text-slate-800 shrink-0">
                  <ArrowRight size={14} />
                </div>
              )}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  );
};

export default Timeline;