
import React, { useState } from 'react';
import { Play, CheckCircle, XCircle, Terminal, ChevronUp, ChevronDown, Loader2, PanelLeft, FileText } from 'lucide-react';
import { TestCase, TestResult, ProgrammingLanguage } from '../types';
import { LANGUAGES } from '../constants';

interface CodeEditorProps {
  code: string;
  onChange: (val: string) => void;
  onRun: () => void;
  isRunning: boolean;
  testCases: TestCase[];
  testResults: TestResult[] | null;
  language: ProgrammingLanguage;
  onLanguageChange: (lang: ProgrammingLanguage) => void;
  problemDescription?: string;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ 
  code, 
  onChange, 
  onRun, 
  isRunning, 
  testCases, 
  testResults,
  language,
  onLanguageChange,
  problemDescription
}) => {
  const [isConsoleOpen, setIsConsoleOpen] = useState(true);
  const [showProblem, setShowProblem] = useState(true);
  const [activeTab, setActiveTab] = useState<'cases' | 'results'>('cases');

  return (
    <div className="w-full h-full bg-[#1e1e1e] flex flex-col font-mono text-sm">
      {/* Editor Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#252526] text-slate-300 border-b border-[#1e1e1e] shrink-0">
        <div className="flex items-center gap-4">
          <button 
             onClick={() => setShowProblem(!showProblem)}
             className={`p-1.5 rounded hover:bg-[#333] transition-colors ${showProblem ? 'text-blue-400 bg-[#333]' : 'text-slate-400'}`}
             title="Toggle Problem Description"
          >
              <PanelLeft size={16} />
          </button>

          <div className="h-4 w-px bg-[#444]"></div>

          <div className="flex items-center gap-3">
            <select 
              value={language}
              onChange={(e) => onLanguageChange(e.target.value as ProgrammingLanguage)}
              className="bg-[#333] text-slate-200 text-xs rounded px-2 py-1 border border-[#444] focus:outline-none focus:border-blue-500"
            >
              {LANGUAGES.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
            <span className="text-xs text-slate-500 hidden sm:inline">solution.{language === 'Python' ? 'py' : language === 'JavaScript' ? 'js' : 'cpp'}</span>
          </div>
        </div>

        <button 
          onClick={() => {
            setActiveTab('results');
            onRun();
          }}
          disabled={isRunning}
          className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold transition-all ${
            isRunning ? 'bg-slate-600 cursor-not-allowed' : 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/20'
          }`}
        >
          {isRunning ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} fill="currentColor" />}
          Run Code
        </button>
      </div>

      {/* Main Content Area (Split View) */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Panel: Problem Description */}
        {showProblem && (
            <div className="w-1/3 min-w-[300px] max-w-[50%] bg-[#1e1e1e] border-r border-[#333] flex flex-col">
                <div className="px-4 py-2 bg-[#252526] border-b border-[#333] flex items-center gap-2 text-slate-300">
                    <FileText size={14} className="text-blue-400" />
                    <span className="text-xs font-bold uppercase tracking-wider">Problem Description</span>
                </div>
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {problemDescription ? (
                        <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap text-slate-300 font-sans leading-relaxed">
                            {problemDescription}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-600 space-y-2">
                             <FileText size={32} opacity={0.2} />
                             <span className="text-xs italic">Select a problem to view details</span>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* Right Panel: Editor + Console */}
        <div className="flex-1 flex flex-col min-w-0">
             {/* Code Area */}
            <div className="flex-1 relative">
                <textarea
                className="absolute inset-0 w-full h-full bg-[#1e1e1e] text-slate-200 p-4 resize-none outline-none font-mono leading-6"
                spellCheck={false}
                value={code}
                onChange={(e) => onChange(e.target.value)}
                style={{ tabSize: 4 }}
                />
            </div>

            {/* Console / Test Results Panel */}
            <div className={`flex flex-col bg-[#1e1e1e] transition-all duration-300 border-t border-[#333] shrink-0 ${isConsoleOpen ? 'h-72' : 'h-8'}`}>
                
                {/* Console Header */}
                <div 
                className="flex items-center justify-between px-4 h-8 bg-[#252526] cursor-pointer hover:bg-[#2d2d2d]"
                onClick={() => setIsConsoleOpen(!isConsoleOpen)}
                >
                <div className="flex items-center gap-2 text-slate-400">
                    <Terminal size={14} />
                    <span className="text-xs font-medium">Console</span>
                </div>
                {isConsoleOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                </div>

                {/* Console Content */}
                {isConsoleOpen && (
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Tabs */}
                    <div className="flex border-b border-[#333]">
                        <button 
                        onClick={(e) => { e.stopPropagation(); setActiveTab('cases'); }}
                        className={`px-4 py-2 text-xs font-medium transition-colors ${activeTab === 'cases' ? 'text-white border-b-2 border-blue-500 bg-[#1e1e1e]' : 'text-slate-500 hover:text-slate-300 bg-[#252526]'}`}
                        >
                        Test Cases
                        </button>
                        <button 
                        onClick={(e) => { e.stopPropagation(); setActiveTab('results'); }}
                        className={`px-4 py-2 text-xs font-medium transition-colors ${activeTab === 'results' ? 'text-white border-b-2 border-blue-500 bg-[#1e1e1e]' : 'text-slate-500 hover:text-slate-300 bg-[#252526]'}`}
                        >
                        Test Results
                        </button>
                    </div>

                    <div className="flex-1 overflow-auto p-4 bg-[#1e1e1e]">
                        {activeTab === 'cases' && (
                        <div className="space-y-4">
                            {testCases.length === 0 ? (
                            <div className="text-slate-500 italic text-xs">No test cases generated yet. Select a DSA problem.</div>
                            ) : (
                            testCases.map((tc, idx) => (
                                <div key={idx} className="space-y-1">
                                <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Case {idx + 1}</div>
                                <div className="p-3 bg-[#2d2d2d] rounded border border-[#333] text-slate-300 font-mono text-xs space-y-2">
                                    <div className="flex gap-2">
                                        <span className="text-slate-500 w-12 shrink-0">Input:</span> 
                                        <span className="text-green-300">{tc.input}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="text-slate-500 w-12 shrink-0">Output:</span> 
                                        <span className="text-blue-300">{tc.output}</span>
                                    </div>
                                </div>
                                </div>
                            ))
                            )}
                        </div>
                        )}

                        {activeTab === 'results' && (
                        <div className="space-y-4">
                            {!testResults ? (
                            <div className="text-slate-500 italic text-xs flex flex-col gap-2">
                                {isRunning ? (
                                    <>
                                        <Loader2 className="animate-spin" size={20} />
                                        <span>Executing code on remote runner...</span>
                                    </>
                                ) : 'Run code to see execution results.'}
                            </div>
                            ) : (
                            <div className="space-y-4">
                                {testResults.map((res, idx) => (
                                <div key={idx} className="flex items-start gap-3 p-2 rounded hover:bg-[#2d2d2d] border border-transparent hover:border-[#333] transition-colors">
                                    <div className="mt-0.5">
                                        {res.passed ? <CheckCircle size={14} className="text-green-500" /> : <XCircle size={14} className="text-red-500" />}
                                    </div>
                                    <div className="space-y-1 flex-1">
                                        <div className="flex items-center justify-between">
                                        <span className={`text-xs font-bold ${res.passed ? 'text-green-400' : 'text-red-400'}`}>
                                            {res.passed ? 'Accepted' : 'Wrong Answer'}
                                        </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-[#111] p-2 rounded border border-[#333]">
                                        <div>
                                            <span className="text-slate-500 block mb-0.5">Input</span>
                                            <span className="text-slate-300 break-all">{res.input}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 block mb-0.5">Expected</span>
                                            <span className="text-slate-300 break-all">{res.expected}</span>
                                        </div>
                                        <div className="col-span-2 border-t border-[#333] pt-1 mt-1">
                                            <span className="text-slate-500 block mb-0.5">Output</span>
                                            <span className={`${res.passed ? 'text-slate-300' : 'text-red-300'} break-all`}>{res.actual}</span>
                                        </div>
                                        </div>
                                    </div>
                                </div>
                                ))}
                            </div>
                            )}
                        </div>
                        )}
                    </div>
                </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;
