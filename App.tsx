
import React, { useState, useRef, useEffect } from 'react';
import { Settings, Play, Square, Mic, MicOff, Monitor, Code, Video, Sparkles, AlertCircle, Upload, BookOpen, BarChart2, FileText, LayoutTemplate, MessageSquare, ScanEye } from 'lucide-react';
import Whiteboard, { WhiteboardRef } from './components/Whiteboard';
import CodeEditor from './components/CodeEditor';
import InterviewHUD from './components/InterviewHUD';
import FeedbackModal from './components/FeedbackModal';
import GuidelinesModal from './components/GuidelinesModal';
import ConfigurationModal from './components/RubricSettings';
import FloatingFeedback from './components/FloatingFeedback';
import MetricsDashboard from './components/MetricsDashboard';
import FeedbackList from './components/FeedbackList';
import ChatPanel from './components/ChatPanel'; // New Import
import { useLiveSession } from './hooks/useLiveSession';
import { useInterviewTracker } from './hooks/useInterviewTracker';
import { useConfigStore } from './store/configStore';
import { InterviewConfig, InterviewRound, TargetCompany, TargetRole, TestCase, TestResult, ProgrammingLanguage, InterviewPhase, RealTimeFeedback } from './types';
import { COMPANIES, ROLES, ROUNDS, TOPICS, STARTER_CODE_TEMPLATES, TEXT_MODELS, LIVE_MODELS } from './constants';
import { rewriteQuestion, selectBestQuestion, generateDSAChallenge, analyzeCode, generateDetailedFeedback, assessInterviewProgress } from './services/gemini';

const INITIAL_CONFIG: InterviewConfig = {
  targetCompany: TargetCompany.GOOGLE,
  targetRole: TargetRole.FULL_STACK,
  roundType: InterviewRound.SYSTEM_DESIGN,
  topic: TOPICS[InterviewRound.SYSTEM_DESIGN][0],
  customQuestion: '',
  language: ProgrammingLanguage.PYTHON,
  textModel: TEXT_MODELS[0].id,
  liveModel: LIVE_MODELS[0].id
};

function App() {
  // Use Zustand Store for Global Configuration
  const { config: globalConfig, loadPreset } = useConfigStore();
  
  // Local Interview State
  const [interviewConfig, setInterviewConfig] = useState<InterviewConfig>(INITIAL_CONFIG);
  const [showConfig, setShowConfig] = useState(true);
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [showConfigurationModal, setShowConfigurationModal] = useState(false);
  const [showFeedbackList, setShowFeedbackList] = useState(false);
  const [showChatPanel, setShowChatPanel] = useState(false); // New State

  const [question, setQuestion] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Feedback State
  const [feedbacks, setFeedbacks] = useState<RealTimeFeedback[]>([]);
  const [feedbackReport, setFeedbackReport] = useState<any | null>(null);
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);

  // DSA State
  const [code, setCode] = useState(STARTER_CODE_TEMPLATES[ProgrammingLanguage.PYTHON]);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [testResults, setTestResults] = useState<TestResult[] | null>(null);
  const [dsaFeedback, setDsaFeedback] = useState<string | undefined>(undefined);
  const [isRunningCode, setIsRunningCode] = useState(false);

  const whiteboardRef = useRef<WhiteboardRef>(null);
  const lastWhiteboardVersion = useRef(0); // Track version for optimization

  // Load Preset when Company Changes
  useEffect(() => {
    if (interviewConfig.targetCompany === TargetCompany.META) loadPreset('meta');
    else if (interviewConfig.targetCompany === TargetCompany.GOOGLE) loadPreset('google');
  }, [interviewConfig.targetCompany, loadPreset]);

  // Handle Tab Change - Synced with Round Type
  const handleRoundChange = (round: InterviewRound) => {
      setInterviewConfig(prev => ({ ...prev, roundType: round }));
  };

  // Select Active Guide based on Round
  const currentRubric = interviewConfig.roundType === InterviewRound.SYSTEM_DESIGN 
    ? globalConfig.rubrics.ml_design 
    : globalConfig.rubrics.coding;

  const currentGuideline = interviewConfig.roundType === InterviewRound.SYSTEM_DESIGN 
    ? globalConfig.guidelines.ml_design 
    : globalConfig.guidelines.coding;

  // --- Interview Tracker Hook ---
  const { 
    phases, 
    currentPhase, 
    currentPhaseIndex, 
    timeSpent, 
    scores, 
    startTracker, 
    stopTracker, 
    setPhase,
    runAssessment
  } = useInterviewTracker({
    roundType: interviewConfig.roundType,
    transcript: [], 
    whiteboardRef,
    code,
    textModel: interviewConfig.textModel,
    rubric: currentRubric + '\n\n' + currentGuideline,
    onFeedback: (fb) => setFeedbacks(prev => [...prev, fb])
  });

  // Logic Handlers
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsProcessing(true);
      const file = e.target.files[0];
      const text = await file.text();
      const questions = text.split('\n').map(q => q.trim()).filter(q => q.length > 5);
      
      if (questions.length > 0) {
        const bestQuestion = await selectBestQuestion(questions, interviewConfig.targetCompany, interviewConfig.targetRole, interviewConfig.textModel);
        setInterviewConfig(prev => ({ ...prev, customQuestion: bestQuestion }));
        setQuestion(bestQuestion);
      }
      setIsProcessing(false);
    }
  };

  const handleRewrite = async () => {
    const sourceQ = interviewConfig.customQuestion || interviewConfig.topic;
    if (!sourceQ) return;
    setIsProcessing(true);
    const rewritten = await rewriteQuestion(sourceQ, interviewConfig.targetCompany, interviewConfig.targetRole, interviewConfig.roundType, interviewConfig.textModel);
    setInterviewConfig(prev => ({ ...prev, customQuestion: rewritten }));
    setQuestion(rewritten);
    setIsProcessing(false);
  };

  const handleLanguageChange = (lang: ProgrammingLanguage) => {
      setInterviewConfig(prev => ({ ...prev, language: lang }));
      if (code.length < 200) {
          setCode(STARTER_CODE_TEMPLATES[lang]);
      }
  };

  const handleRunCode = async () => {
    setIsRunningCode(true);
    const results = await analyzeCode(code, question, testCases, interviewConfig.language, interviewConfig.textModel);
    setTestResults(results.results);
    setDsaFeedback(results.feedback);
    setIsRunningCode(false);
  };

  const [transcriptData, setTranscriptData] = useState<{role: string, text: string}[]>([]);

  const handleTranscriptUpdate = (role: 'user' | 'model', text: string) => {
      setTranscriptData(prev => [...prev, { role, text }]);
  };

  const getVisualContext = async () => {
    if (interviewConfig.roundType === InterviewRound.SYSTEM_DESIGN && whiteboardRef.current) {
      const base64 = await whiteboardRef.current.getSnapshot();
      return { type: 'image', data: base64 } as const;
    } 
    return null;
  };
  
  // Callback for useLiveSession to check if visual data needs sending
  const shouldSendVisual = () => {
      if (interviewConfig.roundType !== InterviewRound.SYSTEM_DESIGN || !whiteboardRef.current) return false;
      const currentVersion = whiteboardRef.current.getVersion();
      if (currentVersion > lastWhiteboardVersion.current) {
          lastWhiteboardVersion.current = currentVersion;
          return true;
      }
      return false;
  };

  const systemPrompt = `You are a strict but fair Senior Interviewer at ${interviewConfig.targetCompany}.
  Role: ${interviewConfig.targetRole}
  Round: ${interviewConfig.roundType}
  Question: "${question}"

  GUIDELINES:
  ${currentGuideline}

  RUBRIC:
  ${currentRubric}

  INSTRUCTIONS:
  Act as the interviewer. Be professional.
  ${interviewConfig.roundType === InterviewRound.DSA ? 'Focus on verification and edge cases.' : 'Focus on tradeoffs and scale.'}
  `;

  const { connect, disconnect, isConnected, isSpeaking, error, transcript: liveTranscript } = useLiveSession({
    onTranscriptUpdate: handleTranscriptUpdate,
    getVisualContext,
    systemInstruction: systemPrompt,
    onToolCall: async (calls) => [],
    model: interviewConfig.liveModel,
    shouldSendVisual // Optimized visual streaming
  });

  const initializeInterview = async () => {
    setIsProcessing(true);
    let finalQuestion = interviewConfig.customQuestion || interviewConfig.topic;
    
    if (!interviewConfig.customQuestion.includes('Style as')) {
         const styled = await rewriteQuestion(finalQuestion, interviewConfig.targetCompany, interviewConfig.targetRole, interviewConfig.roundType, interviewConfig.textModel);
         finalQuestion = styled;
    }
    
    setQuestion(finalQuestion);

    if (interviewConfig.roundType === InterviewRound.DSA) {
      const challenge = await generateDSAChallenge(finalQuestion, interviewConfig.language, interviewConfig.textModel);
      setCode(challenge.starterCode);
      setTestCases(challenge.testCases);
      setTestResults(null);
      setDsaFeedback(undefined);
    }
    
    setIsProcessing(false);
    setShowConfig(false);
    setFeedbackReport(null);
    setFeedbacks([]);
    startTracker();
    connect();
  };

  const handleEndSession = async () => {
    disconnect();
    stopTracker();
    if (liveTranscript.length > 0) {
      setIsGeneratingFeedback(true);
      const report = await generateDetailedFeedback(
          liveTranscript, 
          {
            company: interviewConfig.targetCompany,
            role: interviewConfig.targetRole,
            roundType: interviewConfig.roundType,
            question: question
          }, 
          currentRubric, 
          interviewConfig.textModel,
          globalConfig.prompts.report 
      );
      setFeedbackReport(report);
      setIsGeneratingFeedback(false);
    }
  };

  // Manual Evaluation Trigger
  const handleEvaluateDrawing = async () => {
      if (whiteboardRef.current) {
          const snapshot = await whiteboardRef.current.getSnapshot();
          const feedback = await assessInterviewProgress({
              phase: currentPhase?.name || 'General',
              timeSpent: 0,
              chatHistory: liveTranscript,
              canvasImage: snapshot,
              completedPhases: [],
              roundType: interviewConfig.roundType,
              rubric: currentRubric,
              promptTemplate: "Analyze the attached system design diagram. Provide specific feedback on architecture, scalability, and missing components."
          }, interviewConfig.textModel);
          
          if (feedback?.immediate_feedback) {
              setFeedbacks(prev => [...prev, {
                  id: Date.now().toString(),
                  message: feedback.immediate_feedback,
                  type: 'info',
                  timestamp: Date.now()
              }]);
          }
      }
  };

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30">
      
      {/* Left Panel - Workspace */}
      <div className="flex-1 flex flex-col border-r border-slate-800 relative">
        
        {/* Interview HUD (Always visible) */}
        <InterviewHUD 
            phases={phases}
            currentPhaseIndex={currentPhaseIndex}
            timeSpent={timeSpent}
            onPhaseClick={setPhase}
            feedbacks={feedbacks}
            scores={scores}
            roundType={interviewConfig.roundType}
        />

        {/* Tabs / Header */}
        <div className="h-12 flex items-center bg-slate-900 border-b border-slate-800 px-4 justify-between">
          <div className="flex items-center">
              <button 
                onClick={() => handleRoundChange(InterviewRound.SYSTEM_DESIGN)}
                className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${interviewConfig.roundType === InterviewRound.SYSTEM_DESIGN ? 'bg-slate-800 text-white border-t border-x border-slate-700' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <Monitor size={16} /> System Design
              </button>
              <button 
                onClick={() => handleRoundChange(InterviewRound.DSA)}
                className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${interviewConfig.roundType === InterviewRound.DSA ? 'bg-slate-800 text-white border-t border-x border-slate-700' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <Code size={16} /> Coding
              </button>
          </div>
          
          <div className="flex items-center gap-2">
              {interviewConfig.roundType === InterviewRound.SYSTEM_DESIGN && (
                 <button 
                    onClick={handleEvaluateDrawing}
                    className="flex items-center gap-1.5 px-3 py-1 bg-purple-900/40 text-purple-300 border border-purple-800/50 rounded text-xs hover:bg-purple-900/60 transition-colors"
                    title="Ask AI to analyze your diagram now"
                 >
                    <ScanEye size={14} /> Eval Board
                 </button>
              )}

              <button 
                onClick={() => setShowFeedbackList(!showFeedbackList)}
                className={`p-2 rounded-full transition-colors relative ${showFeedbackList ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
                title="Feedback History"
              >
                  <AlertCircle size={18} />
                  {feedbacks.length > 0 && (
                      <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  )}
              </button>
              
              {isConnected && (
                <button
                   onClick={() => runAssessment()} 
                   className="flex items-center gap-2 px-3 py-1 bg-blue-900/30 text-blue-300 rounded text-xs hover:bg-blue-900/50 transition-colors border border-blue-800"
                >
                  <BarChart2 size={14} /> Analyze
                </button>
              )}
          </div>
        </div>

        {/* Feedback List Overlay */}
        <FeedbackList 
            feedbacks={feedbacks} 
            isOpen={showFeedbackList} 
            onClose={() => setShowFeedbackList(false)} 
        />

        {/* Content Area */}
        <div className="flex-1 relative bg-slate-900">
          <div className={`absolute inset-0 ${interviewConfig.roundType === InterviewRound.SYSTEM_DESIGN ? 'z-10' : 'z-0 invisible'}`}>
            <Whiteboard ref={whiteboardRef} onCanvasUpdate={() => {}} />
          </div>
          <div className={`absolute inset-0 ${interviewConfig.roundType === InterviewRound.DSA ? 'z-10' : 'z-0 invisible'}`}>
             <CodeEditor 
                code={code} 
                onChange={setCode}
                onRun={handleRunCode}
                isRunning={isRunningCode}
                testCases={testCases}
                testResults={testResults}
                feedback={dsaFeedback}
                language={interviewConfig.language}
                onLanguageChange={handleLanguageChange}
             />
          </div>
          
          <FloatingFeedback feedbacks={feedbacks.filter(f => f.type === 'error' || f.type === 'warning').slice(-1)} onDismiss={(id) => setFeedbacks(prev => prev.filter(p => p.id !== id))} />
        </div>
      </div>

      {/* Right Panel - Interviewer / Chat */}
      <div className="w-96 flex flex-col bg-slate-900 shadow-2xl z-20 border-l border-slate-800">
        
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-950">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/20">
                    <Sparkles size={18} className="text-white" />
                </div>
                <div>
                    <h1 className="font-bold text-white leading-tight">TechInterview.AI</h1>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Gemini 2.5 Live</span>
                </div>
            </div>
            <div className="flex gap-2">
                 <button 
                    onClick={() => setShowChatPanel(!showChatPanel)}
                    className={`p-2 rounded-full transition-colors ${showChatPanel ? 'bg-slate-800 text-purple-400' : 'text-slate-400 hover:text-white'}`}
                    title="Thinking Chat"
                 >
                    <MessageSquare size={20} />
                 </button>
                 <button 
                    onClick={() => setShowGuidelines(true)}
                    className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-blue-400 transition-colors"
                    title="Guidelines"
                >
                    <BookOpen size={20} />
                </button>
                <button 
                    onClick={() => {
                        if(isConnected) handleEndSession();
                        setShowConfig(!showConfig);
                    }}
                    className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
                    title="Configuration"
                >
                    <Settings size={20} />
                </button>
            </div>
        </div>

        {/* Content Area: Config, Live Status, or Chat */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#0f172a] relative">
            
            {showChatPanel ? (
                <div className="absolute inset-0 z-10">
                    <ChatPanel apiKey={process.env.API_KEY} model={interviewConfig.textModel} />
                </div>
            ) : showConfig ? (
                <div className="p-6 space-y-5 animate-fadeIn">
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Target Company</label>
                            <button 
                                onClick={() => setShowConfigurationModal(true)}
                                className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1"
                            >
                                <LayoutTemplate size={10} /> Customize Presets
                            </button>
                        </div>
                        <select 
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            value={interviewConfig.targetCompany}
                            onChange={(e) => setInterviewConfig({...interviewConfig, targetCompany: e.target.value as TargetCompany})}
                        >
                            {COMPANIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Role</label>
                        <select 
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            value={interviewConfig.targetRole}
                            onChange={(e) => setInterviewConfig({...interviewConfig, targetRole: e.target.value as TargetRole})}
                        >
                            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>

                    {/* Model Selection */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Reasoning Model (Text)</label>
                        <select 
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            value={interviewConfig.textModel}
                            onChange={(e) => setInterviewConfig({...interviewConfig, textModel: e.target.value})}
                        >
                            {TEXT_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Live Model (Audio)</label>
                        <select 
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            value={interviewConfig.liveModel}
                            onChange={(e) => setInterviewConfig({...interviewConfig, liveModel: e.target.value})}
                        >
                            {LIVE_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                    </div>

                    {/* Question Source */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Question Source</label>
                        <select 
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            value={interviewConfig.topic}
                            onChange={(e) => setInterviewConfig({...interviewConfig, topic: e.target.value, customQuestion: ''})}
                        >
                            <option value="" disabled>Select a Preset Topic</option>
                            {TOPICS[interviewConfig.roundType].map(t => <option key={t} value={t}>{t}</option>)}
                        </select>

                        <div className="relative">
                            <div className="text-center text-[10px] text-slate-500 my-1">- OR -</div>
                            <textarea 
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none min-h-[80px] resize-y"
                                placeholder={interviewConfig.roundType === InterviewRound.SYSTEM_DESIGN 
                                  ? "Paste system design requirements (e.g., Design Twitter)..." 
                                  : "Paste LeetCode problem name or description..."}
                                value={interviewConfig.customQuestion}
                                onChange={(e) => {
                                    setInterviewConfig({...interviewConfig, customQuestion: e.target.value});
                                }}
                            />
                            <button 
                                onClick={handleRewrite}
                                disabled={isProcessing || (!interviewConfig.customQuestion && !interviewConfig.topic)}
                                className="absolute bottom-3 right-3 text-[10px] bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white px-2 py-1.5 rounded-md flex items-center gap-1 transition-colors shadow-sm"
                            >
                                <Sparkles size={10} />
                                {isProcessing ? 'Thinking...' : `Style as ${interviewConfig.targetCompany}`}
                            </button>
                        </div>
                    </div>
                </div>
            ) : isConnected ? (
               <div className="flex flex-col h-full">
                  <MetricsDashboard 
                     scores={scores} 
                     timeData={{
                        spent: timeSpent[currentPhase?.id] || 0,
                        expected: currentPhase?.duration || null,
                        label: currentPhase?.name || 'Interview'
                     }}
                     roundType={interviewConfig.roundType}
                  />
                  <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6">
                       <div className="relative">
                           {isSpeaking && <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-20"></div>}
                           <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 ${isSpeaking ? 'bg-blue-500/10 scale-105' : 'bg-slate-800'}`}>
                               <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${isSpeaking ? 'bg-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.6)]' : 'bg-slate-700 border-2 border-green-500/50'}`}>
                                   <Mic size={24} className="text-white" />
                               </div>
                           </div>
                       </div>
                       <div>
                          <div className="text-sm font-medium text-white mb-1">AI Interviewer Active</div>
                          <div className="text-xs text-slate-500">{isSpeaking ? "Speaking..." : "Listening..."}</div>
                       </div>
                  </div>
               </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-full space-y-6 text-center p-6">
                    <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center">
                         <MicOff size={32} className="text-slate-600" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-lg font-bold text-white">Ready to Start</h2>
                        <p className="text-xs text-slate-400 leading-relaxed max-w-[200px] mx-auto">
                            Select your interview type and configuration to begin.
                        </p>
                    </div>
                </div>
            )}
        </div>

        {/* Action Footer */}
        <div className="p-6 border-t border-slate-800 bg-slate-950 z-30">
            {error && (
                <div className="mb-4 p-3 bg-red-900/20 border border-red-900/50 rounded-lg flex items-start gap-3 text-xs text-red-200">
                    <AlertCircle size={14} className="mt-0.5 shrink-0" />
                    <span>{error}</span>
                </div>
            )}
            
            {!isConnected ? (
                <button 
                    onClick={initializeInterview}
                    disabled={isProcessing}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                    {isProcessing ? <Sparkles className="animate-spin" size={20}/> : <Play size={20} fill="currentColor" />}
                    {isProcessing ? 'Preparing...' : 'Start Interview'}
                </button>
            ) : (
                <button 
                    onClick={handleEndSession}
                    className="w-full py-4 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-900/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                    <Square size={20} fill="currentColor" />
                    End Session
                </button>
            )}
        </div>
      </div>

      {/* Modals */}
      <FeedbackModal 
        report={feedbackReport} 
        onClose={() => setFeedbackReport(null)} 
        isLoading={isGeneratingFeedback} 
      />
      
      <GuidelinesModal 
        isOpen={showGuidelines} 
        onClose={() => setShowGuidelines(false)} 
      />

      <ConfigurationModal 
        isOpen={showConfigurationModal}
        onClose={() => setShowConfigurationModal(false)}
        companyName={interviewConfig.targetCompany}
      />
    </div>
  );
}

export default App;
