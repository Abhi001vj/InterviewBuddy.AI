
import React, { useState, useRef, useEffect } from 'react';
import { Settings, Play, Square, Mic, MicOff, Monitor, Code, Video, Sparkles, AlertCircle, Upload, BookOpen, BarChart2, FileText } from 'lucide-react';
import Whiteboard, { WhiteboardRef } from './components/Whiteboard';
import CodeEditor from './components/CodeEditor';
import InterviewHUD from './components/InterviewHUD';
import FeedbackModal from './components/FeedbackModal';
import GuidelinesModal from './components/GuidelinesModal';
import RubricSettings from './components/RubricSettings';
import FloatingFeedback from './components/FloatingFeedback';
import MetricsDashboard from './components/MetricsDashboard';
import { useLiveSession } from './hooks/useLiveSession';
import { useInterviewTracker } from './hooks/useInterviewTracker';
import { InterviewConfig, InterviewRound, TargetCompany, TargetRole, TestCase, TestResult, ProgrammingLanguage, InterviewStage, FeedbackReport, RealTimeFeedback } from './types';
import { COMPANIES, ROLES, ROUNDS, TOPICS, STARTER_CODE_TEMPLATES, TEXT_MODELS, LIVE_MODELS } from './constants';
import { rewriteQuestion, selectBestQuestion, generateDSAChallenge, analyzeCode, generateDetailedFeedback } from './services/gemini';
import { ML_SYSTEM_DESIGN_RUBRIC, DSA_RUBRIC, FULL_INTERVIEW_GUIDE } from './utils/rubrics';
import { META_GUIDE, GOOGLE_GUIDE, GENERIC_GUIDE } from './utils/companyGuides';

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
  const [activeTab, setActiveTab] = useState<'whiteboard' | 'code'>('whiteboard');
  const [config, setConfig] = useState<InterviewConfig>(INITIAL_CONFIG);
  const [showConfig, setShowConfig] = useState(true);
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [showRubricSettings, setShowRubricSettings] = useState(false);
  
  // Custom Guidelines State
  const [activeGuide, setActiveGuide] = useState(GOOGLE_GUIDE);

  const [question, setQuestion] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Feedback State
  const [feedbacks, setFeedbacks] = useState<RealTimeFeedback[]>([]);
  const [feedbackReport, setFeedbackReport] = useState<FeedbackReport | null>(null);
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);

  // DSA State
  const [code, setCode] = useState(STARTER_CODE_TEMPLATES[ProgrammingLanguage.PYTHON]);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [testResults, setTestResults] = useState<TestResult[] | null>(null);
  const [dsaFeedback, setDsaFeedback] = useState<string | undefined>(undefined);
  const [isRunningCode, setIsRunningCode] = useState(false);

  const whiteboardRef = useRef<WhiteboardRef>(null);

  // Update default guide when company changes
  useEffect(() => {
    if (config.targetCompany === TargetCompany.META) setActiveGuide(META_GUIDE);
    else if (config.targetCompany === TargetCompany.GOOGLE) setActiveGuide(GOOGLE_GUIDE);
    else setActiveGuide(GENERIC_GUIDE);
  }, [config.targetCompany]);

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
    roundType: config.roundType,
    transcript: [], // We'll need to pass the live transcript here
    whiteboardRef,
    code,
    textModel: config.textModel,
    rubric: activeGuide,
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
        const bestQuestion = await selectBestQuestion(questions, config.targetCompany, config.targetRole, config.textModel);
        setConfig(prev => ({ ...prev, customQuestion: bestQuestion }));
        setQuestion(bestQuestion);
      }
      setIsProcessing(false);
    }
  };

  const handleRewrite = async () => {
    const sourceQ = config.customQuestion || config.topic;
    if (!sourceQ) return;
    setIsProcessing(true);
    const rewritten = await rewriteQuestion(sourceQ, config.targetCompany, config.targetRole, config.roundType, config.textModel);
    setConfig(prev => ({ ...prev, customQuestion: rewritten }));
    setQuestion(rewritten);
    setIsProcessing(false);
  };

  const handleLanguageChange = (lang: ProgrammingLanguage) => {
      setConfig(prev => ({ ...prev, language: lang }));
      if (code.length < 200) {
          setCode(STARTER_CODE_TEMPLATES[lang]);
      }
  };

  const handleRunCode = async () => {
    setIsRunningCode(true);
    setActiveTab('code');
    const results = await analyzeCode(code, question, testCases, config.language, config.textModel);
    setTestResults(results.results);
    setDsaFeedback(results.feedback);
    setIsRunningCode(false);
  };

  const initializeInterview = async () => {
    setIsProcessing(true);
    let finalQuestion = config.customQuestion || config.topic;
    
    // Auto-style if not styled
    if (!config.customQuestion.includes('Style as')) {
        // Attempt to style it automatically
         const styled = await rewriteQuestion(finalQuestion, config.targetCompany, config.targetRole, config.roundType, config.textModel);
         finalQuestion = styled;
    }
    
    setQuestion(finalQuestion);

    // Setup Stages based on Round
    if (config.roundType === InterviewRound.SYSTEM_DESIGN) {
      setActiveTab('whiteboard');
    } else {
      setActiveTab('code');
      const challenge = await generateDSAChallenge(finalQuestion, config.language, config.textModel);
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

  // Tool Handler
  const handleToolCall = async (toolCalls: any[]) => {
    const responses = [];
    for (const call of toolCalls) {
      if (call.name === 'updateInterviewStage') {
        const { stageId, status } = call.args;
        responses.push({
          id: call.id,
          name: call.name,
          response: { result: 'Stage tracking is now handled by the automated assessment system.' }
        });
      }
    }
    return responses;
  };

  // Live API Integration
  const getVisualContext = async () => {
    if (activeTab === 'whiteboard' && whiteboardRef.current) {
      const base64 = await whiteboardRef.current.getSnapshot();
      return { type: 'image', data: base64 } as const;
    } 
    return null;
  };

  const systemPrompt = `You are a strict but fair Senior Interviewer at ${config.targetCompany} interviewing a candidate for a ${config.targetRole} position. 
  The current round is ${config.roundType}.
  The specific problem is: "${question}".

  REFERENCE MATERIAL (OFFICIAL GUIDELINES):
  ${activeGuide}

  SPECIFIC RUBRIC FOR THIS INTERVIEW:
  ${config.roundType === InterviewRound.SYSTEM_DESIGN ? ML_SYSTEM_DESIGN_RUBRIC : DSA_RUBRIC}

  INSTRUCTIONS:
  1. Act exactly like a ${config.targetCompany} interviewer (Persona: Professional, probing, focuses on tradeoffs).
  2. The candidate is being tracked by an automated system for phase completion. Your job is to focus on the conversation.
  3. If System Design: 
     - Allow the candidate to lead. 
     - Intervene only if they are wildly off track or silent.
  4. If DSA:
     - Focus on the rubric: Verification, Edge cases, Clean code.
  
  Current Context:
  - User interface: ${activeTab === 'whiteboard' ? 'Whiteboard' : `Code Editor (${config.language})`}.
  `;

  const { connect, disconnect, isConnected, isSpeaking, error, transcript } = useLiveSession({
    onTranscriptUpdate: () => {}, 
    getVisualContext,
    systemInstruction: systemPrompt,
    onToolCall: handleToolCall,
    model: config.liveModel
  });

  const handleEndSession = async () => {
    disconnect();
    stopTracker();
    if (transcript.length > 0) {
      setIsGeneratingFeedback(true);
      const report = await generateDetailedFeedback(transcript, {
        company: config.targetCompany,
        role: config.targetRole,
        roundType: config.roundType,
        question: question
      }, activeGuide, config.textModel);
      setFeedbackReport(report);
      setIsGeneratingFeedback(false);
    }
  };

  const handleDismissFeedback = (id: string) => {
    setFeedbacks(prev => prev.filter(f => f.id !== id));
  };

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30">
      
      {/* Left Panel - Workspace */}
      <div className="flex-1 flex flex-col border-r border-slate-800">
        
        {/* Interview HUD (Always visible) */}
        <InterviewHUD 
            phases={phases}
            currentPhaseIndex={currentPhaseIndex}
            timeSpent={timeSpent}
            onPhaseClick={setPhase}
            feedbacks={feedbacks}
            scores={scores}
        />

        {/* Tabs */}
        <div className="h-12 flex items-center bg-slate-900 border-b border-slate-800 px-4">
          <button 
            onClick={() => setActiveTab('whiteboard')}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${activeTab === 'whiteboard' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Monitor size={16} /> System Design
          </button>
          <button 
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${activeTab === 'code' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Code size={16} /> Coding
          </button>
          
          <div className="flex-1" />
          
          {isConnected && (
            <button
               onClick={() => runAssessment()} 
               className="flex items-center gap-2 px-3 py-1 bg-blue-900/30 text-blue-300 rounded text-xs hover:bg-blue-900/50 transition-colors border border-blue-800"
            >
              <BarChart2 size={14} /> Analyze Progress
            </button>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 relative bg-slate-900">
          <div className={`absolute inset-0 ${activeTab === 'whiteboard' ? 'z-10' : 'z-0 invisible'}`}>
            <Whiteboard ref={whiteboardRef} onCanvasUpdate={() => {}} />
          </div>
          <div className={`absolute inset-0 ${activeTab === 'code' ? 'z-10' : 'z-0 invisible'}`}>
             <CodeEditor 
                code={code} 
                onChange={setCode}
                onRun={handleRunCode}
                isRunning={isRunningCode}
                testCases={testCases}
                testResults={testResults}
                feedback={dsaFeedback}
                language={config.language}
                onLanguageChange={handleLanguageChange}
             />
          </div>
          
          {/* Floating Feedback Overlay (Secondary) */}
          <FloatingFeedback feedbacks={feedbacks.filter(f => f.type === 'error')} onDismiss={handleDismissFeedback} />
        </div>
      </div>

      {/* Right Panel - Interviewer */}
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
                    onClick={() => setShowGuidelines(true)}
                    className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-blue-400 transition-colors"
                    title="Interview Guidelines"
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

        {/* Config / Status Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#0f172a]">
            
            {showConfig ? (
                <div className="p-6 space-y-5 animate-fadeIn">
                    {/* ... Existing Config Fields ... */}
                    
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Target Company</label>
                            <button 
                                onClick={() => setShowRubricSettings(true)}
                                className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1"
                            >
                                <FileText size={10} /> Customize Guidelines
                            </button>
                        </div>
                        <select 
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            value={config.targetCompany}
                            onChange={(e) => setConfig({...config, targetCompany: e.target.value as TargetCompany})}
                        >
                            {COMPANIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Role</label>
                        <select 
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            value={config.targetRole}
                            onChange={(e) => setConfig({...config, targetRole: e.target.value as TargetRole})}
                        >
                            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>

                    <div className="space-y-2">
                         <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Interview Type</label>
                         <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
                             {ROUNDS.map(r => (
                                 <button
                                    key={r}
                                    onClick={() => setConfig({...config, roundType: r})}
                                    className={`flex-1 text-xs py-2 rounded-md font-medium transition-all ${config.roundType === r ? 'bg-slate-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-300'}`}
                                 >
                                     {r === InterviewRound.DSA ? 'DSA' : 'Sys Design'}
                                 </button>
                             ))}
                         </div>
                    </div>

                    {/* Model Selection */}
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Reasoning Model (Text)</label>
                          <select 
                              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                              value={config.textModel}
                              onChange={(e) => setConfig({...config, textModel: e.target.value})}
                          >
                              {TEXT_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                          </select>
                      </div>
                      <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Live Model (Audio)</label>
                          <select 
                              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                              value={config.liveModel}
                              onChange={(e) => setConfig({...config, liveModel: e.target.value})}
                          >
                              {LIVE_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                          </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Question Source</label>
                        
                        {/* Topic Selector */}
                        <select 
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            value={config.topic}
                            onChange={(e) => setConfig({...config, topic: e.target.value, customQuestion: ''})}
                        >
                            <option value="" disabled>Select a Preset Topic</option>
                            {TOPICS[config.roundType].map(t => <option key={t} value={t}>{t}</option>)}
                        </select>

                        <div className="relative">
                            <div className="text-center text-[10px] text-slate-500 my-1">- OR -</div>
                            
                            {/* File Upload */}
                            <label className="flex items-center justify-center w-full p-2 mb-2 border border-dashed border-slate-700 rounded-lg cursor-pointer hover:bg-slate-800 transition-colors group">
                                <input type="file" accept=".txt,.csv" className="hidden" onChange={handleFileUpload} />
                                <Upload size={14} className="text-slate-500 group-hover:text-blue-400 mr-2" />
                                <span className="text-xs text-slate-500 group-hover:text-slate-300">Upload Question List (.txt)</span>
                            </label>

                            {/* Text Area */}
                            <textarea 
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none min-h-[100px] resize-y"
                                placeholder={config.roundType === InterviewRound.SYSTEM_DESIGN 
                                  ? "Paste system design requirements (e.g., Design Twitter)..." 
                                  : "Paste LeetCode problem name or description..."}
                                value={config.customQuestion}
                                onChange={(e) => {
                                    setConfig({...config, customQuestion: e.target.value});
                                }}
                            />
                            
                            {/* Transform Button */}
                            <button 
                                onClick={handleRewrite}
                                disabled={isProcessing || (!config.customQuestion && !config.topic)}
                                className="absolute bottom-3 right-3 text-[10px] bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white px-2 py-1.5 rounded-md flex items-center gap-1 transition-colors shadow-sm"
                            >
                                <Sparkles size={10} />
                                {isProcessing ? 'Thinking...' : `Style as ${config.targetCompany}`}
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
                            Configure your interview settings above and click start when you are ready.
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

      <RubricSettings 
        isOpen={showRubricSettings}
        onClose={() => setShowRubricSettings(false)}
        currentGuide={activeGuide}
        onSave={setActiveGuide}
        onReset={() => {
            if (config.targetCompany === TargetCompany.META) setActiveGuide(META_GUIDE);
            else if (config.targetCompany === TargetCompany.GOOGLE) setActiveGuide(GOOGLE_GUIDE);
            else setActiveGuide(GENERIC_GUIDE);
        }}
        companyName={config.targetCompany}
      />
    </div>
  );
}

export default App;
