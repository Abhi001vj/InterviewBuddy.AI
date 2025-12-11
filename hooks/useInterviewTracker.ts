
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { InterviewPhase, InterviewRound, AssessmentResult, RealTimeFeedback } from '../types';
import { INTERVIEW_PHASES } from '../constants';
import { assessInterviewProgress } from '../services/gemini';
import { WhiteboardRef } from '../components/Whiteboard';

interface UseInterviewTrackerProps {
  roundType: InterviewRound;
  transcript: { role: string, text: string }[];
  whiteboardRef: React.RefObject<WhiteboardRef>;
  code: string;
  textModel: string;
  rubric: string;
  onFeedback: (feedback: RealTimeFeedback) => void;
}

export const useInterviewTracker = ({
  roundType,
  transcript,
  whiteboardRef,
  code,
  textModel,
  rubric,
  onFeedback
}: UseInterviewTrackerProps) => {
  const [phases, setPhases] = useState<InterviewPhase[]>([]);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [timeSpent, setTimeSpent] = useState<{[key: string]: number}>({});
  const [isActive, setIsActive] = useState(false);
  const [scores, setScores] = useState<AssessmentResult['quality_scores']>({
    depth: 0, clarity: 0, technical: 0, practical: 0
  });
  const [completedSubSteps, setCompletedSubSteps] = useState<string[]>([]);
  
  const timerRef = useRef<number | null>(null);
  const assessTimerRef = useRef<number | null>(null);
  const lastTranscriptLengthRef = useRef(0);

  // Initialize phases based on round type
  useEffect(() => {
    const config = INTERVIEW_PHASES[roundType];
    setPhases(config);
    setCurrentPhaseIndex(0);
    setTimeSpent(config.reduce((acc, p) => ({ ...acc, [p.id]: 0 }), {}));
  }, [roundType]);

  // Main Timer
  useEffect(() => {
    if (isActive) {
      timerRef.current = window.setInterval(() => {
        if (phases.length > 0) {
          const currentId = phases[currentPhaseIndex]?.id;
          if (currentId) {
            setTimeSpent(prev => ({
              ...prev,
              [currentId]: (prev[currentId] || 0) + 1
            }));
          }
        }
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, phases, currentPhaseIndex]);

  // AI Assessment Loop (Every 30s if active and transcript updated)
  useEffect(() => {
    if (isActive) {
      assessTimerRef.current = window.setInterval(async () => {
        // Only assess if transcript has grown
        if (transcript.length > lastTranscriptLengthRef.current) {
          await runAssessment();
          lastTranscriptLengthRef.current = transcript.length;
        }
      }, 30000); // 30 seconds
    } else {
      if (assessTimerRef.current) clearInterval(assessTimerRef.current);
    }
    return () => {
      if (assessTimerRef.current) clearInterval(assessTimerRef.current);
    };
  }, [isActive, transcript, currentPhaseIndex, phases, rubric]);

  const runAssessment = async () => {
    if (!phases[currentPhaseIndex]) return;

    let canvasImage = undefined;
    if (whiteboardRef.current) {
      canvasImage = await whiteboardRef.current.getSnapshot();
    }

    const currentPhase = phases[currentPhaseIndex];
    
    // Call Gemini
    const result = await assessInterviewProgress({
      phase: currentPhase.name,
      timeSpent: timeSpent[currentPhase.id] || 0,
      chatHistory: transcript,
      canvasImage,
      codeContent: code,
      completedPhases: phases.slice(0, currentPhaseIndex).map(p => p.id),
      roundType,
      rubric
    }, textModel);

    if (result) {
      // Update Scores
      setScores(result.quality_scores);
      
      // Update Completed Substeps
      if (result.completed_substeps) {
        setCompletedSubSteps(prev => Array.from(new Set([...prev, ...result.completed_substeps!])));
      }

      // Handle Feedback
      if (result.immediate_feedback) {
        const type = result.red_flags.length > 0 ? 'error' : result.next_phase_ready ? 'success' : 'info';
        onFeedback({
          id: Date.now().toString(),
          message: result.immediate_feedback,
          type,
          timestamp: Date.now()
        });
      }
    }
  };

  const startTracker = () => setIsActive(true);
  const stopTracker = () => setIsActive(false);
  
  const advancePhase = () => {
    if (currentPhaseIndex < phases.length - 1) {
      setCurrentPhaseIndex(prev => prev + 1);
    }
  };

  const setPhase = (phaseId: string) => {
    const idx = phases.findIndex(p => p.id === phaseId);
    if (idx !== -1) setCurrentPhaseIndex(idx);
  };

  return {
    phases,
    currentPhase: phases[currentPhaseIndex],
    currentPhaseIndex,
    timeSpent,
    scores,
    completedSubSteps,
    startTracker,
    stopTracker,
    advancePhase,
    setPhase,
    runAssessment // Manual trigger
  };
};
