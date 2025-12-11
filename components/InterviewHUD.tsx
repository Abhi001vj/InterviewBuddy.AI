
import React from 'react';
import { InterviewPhase, AssessmentResult, RealTimeFeedback } from '../types';
import { Clock, Target, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import Timeline from './Timeline';

interface InterviewHUDProps {
  phases: InterviewPhase[];
  currentPhaseIndex: number;
  timeSpent: {[key: string]: number};
  onPhaseClick: (phaseId: string) => void;
  feedbacks: RealTimeFeedback[];
  scores: AssessmentResult['quality_scores'];
}

const InterviewHUD: React.FC<InterviewHUDProps> = ({ 
  phases, 
  currentPhaseIndex, 
  timeSpent, 
  onPhaseClick,
  feedbacks,
  scores
}) => {
  const latestFeedback = feedbacks.length > 0 ? feedbacks[feedbacks.length - 1] : null;
  const currentPhase = phases.length > 0 ? phases[currentPhaseIndex] : null;
  const phaseTime = currentPhase ? (timeSpent[currentPhase.id] || 0) : 0;
  const targetTime = currentPhase?.duration || 0;
  
  // Calculate average score
  const avgScore = Math.round(
      (scores.depth + scores.clarity + scores.technical + scores.practical) / 4
  ) || 0;

  return (
    <div className="w-full bg-slate-900 border-b border-slate-800 flex flex-col relative z-20 shadow-xl">
      {/* Top Bar: Timeline & Stats */}
      <div className="flex items-center justify-between p-2 pl-4 pr-6 bg-slate-950">
         <div className="flex-1 overflow-hidden mr-4">
             {phases.length > 0 ? (
                 <Timeline 
                    phases={phases} 
                    currentPhaseIndex={currentPhaseIndex}
                    timeSpent={timeSpent}
                    onPhaseClick={onPhaseClick}
                 />
             ) : (
                 <div className="text-xs text-slate-600 italic px-2 py-3">Configure interview settings to see timeline...</div>
             )}
         </div>
         
         <div className="flex items-center gap-6 shrink-0 border-l border-slate-800 pl-6">
             {/* Phase Timer */}
             <div className="flex flex-col items-end">
                 <div className="flex items-center gap-2 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                     <Clock size={12} /> Phase Timer
                 </div>
                 <div className={`text-xl font-mono font-bold ${targetTime && phaseTime > targetTime ? 'text-red-400 animate-pulse' : 'text-slate-200'}`}>
                    {Math.floor(phaseTime / 60)}:{String(phaseTime % 60).padStart(2, '0')}
                    <span className="text-xs text-slate-600 ml-1 font-normal">/ {Math.floor(targetTime/60)}m</span>
                 </div>
             </div>

             {/* Live Score */}
             <div className="flex flex-col items-end">
                 <div className="flex items-center gap-2 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                     <Target size={12} /> Live Score
                 </div>
                 <div className={`text-xl font-bold ${avgScore > 70 ? 'text-green-400' : avgScore > 40 ? 'text-yellow-400' : 'text-slate-500'}`}>
                    {avgScore}
                    <span className="text-xs text-slate-600 ml-1 font-normal">/ 100</span>
                 </div>
             </div>
         </div>
      </div>

      {/* Live Vibe Check Widget (Contextual Feedback) */}
      {latestFeedback && (Date.now() - latestFeedback.timestamp < 15000) && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 z-50">
              <div className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg shadow-2xl border backdrop-blur-md animate-slideInDown
                  ${latestFeedback.type === 'error' ? 'bg-red-900/90 border-red-500 text-red-100' : 
                    latestFeedback.type === 'success' ? 'bg-green-900/90 border-green-500 text-green-100' : 
                    'bg-slate-800/90 border-blue-500 text-blue-100'}
              `}>
                  <div className="shrink-0">
                      {latestFeedback.type === 'error' ? <AlertTriangle size={20} /> :
                       latestFeedback.type === 'success' ? <CheckCircle size={20} /> :
                       <Info size={20} />}
                  </div>
                  <div>
                      <div className="text-xs font-bold opacity-70 uppercase tracking-wider mb-0.5">Live Vibe Check</div>
                      <div className="text-sm font-medium whitespace-nowrap">{latestFeedback.message}</div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default InterviewHUD;
