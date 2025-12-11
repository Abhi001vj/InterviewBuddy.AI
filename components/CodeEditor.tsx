import React, { useState } from 'react';
import { Play, CheckCircle, XCircle, Terminal, ChevronUp, ChevronDown, Loader2 } from 'lucide-react';
import { TestCase, TestResult, ProgrammingLanguage } from '../types';
import { LANGUAGES } from '../constants';

interface CodeEditorProps {
  code: string;
  onChange: (val: string) => void;
  onRun: () => void;
  isRunning: boolean;
  testCases: TestCase[];
  testResults: TestResult[] | null;
  feedback?: string;
  language: ProgrammingLanguage;
  onLanguageChange: (lang: ProgrammingLanguage) => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ 
  code, 
  onChange, 
  onRun, 
  isRunning, 
  testCases, 
  testResults,
  feedback,
  language,
  onLanguageChange
}) => {
  const [isConsoleOpen, setIsConsoleOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'cases' | 'results'>('cases');

  return (
    <div className="w-full h-full bg-[#1e1e1e] flex flex-col font-mono text-sm">
      {/* Editor Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#252526] text-slate-300 border-b border-[#1e1e1e]">
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
          <span className="text-xs text-slate-500">solution.{language === 'Python' ? 'py' : language === 'JavaScript' ? 'js' : 'cpp'}</span>
        </div>
        <button 
          onClick={() => {
            setActiveTab('results');
            onRun();
          }}
          disabled={isRunning}
          className={`flex items-center gap-2 px-3 py-1 rounded text-xs font-bold transition-all ${
            isRunning ? 'bg-slate-600 cursor-not-allowed' : 'bg-green-600 hover:bg-green-500 text-white'
          }`}
        >
          {isRunning ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} fill="currentColor" />}
          Run Code
        </button>
      </div>

      {/* Editor Area */}
      <div className="flex-1 relative border-b border-[#2d2d2d]">
        <textarea
          className="absolute inset-0 w-full h-full bg-transparent text-slate-200 p-4 resize-none outline-none font-mono leading-6"
          spellCheck={false}
          value={code}
          onChange={(e) => onChange(e.target.value)}
          style={{ tabSize: 4 }}
        />
      </div>

      {/* Console / Test Results Panel */}
      <div className={`flex flex-col bg-[#1e1e1e] transition-all duration-300 border-t border-[#333] ${isConsoleOpen ? 'h-72' : 'h-8'}`}>
        
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
                  className={`px-4 py-2 text-xs font-medium ${activeTab === 'cases' ? 'text-white border-b-2 border-blue-500' : 'text-slate-500'}`}
                >
                  Test Cases
                </button>
                <button 
                   onClick={(e) => { e.stopPropagation(); setActiveTab('results'); }}
                   className={`px-4 py-2 text-xs font-medium ${activeTab === 'results' ? 'text-white border-b-2 border-blue-500' : 'text-slate-500'}`}
                >
                  Test Results
                </button>
             </div>

             <div className="flex-1 overflow-auto p-4 bg-[#1e1e1e]">
                {activeTab === 'cases' && (
                  <div className="space-y-4">
                    {testCases.length === 0 ? (
                      <div className="text-slate-500 italic">No test cases generated yet. Select a DSA problem.</div>
                    ) : (
                      testCases.map((tc, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="text-xs text-slate-500">Case {idx + 1}</div>
                          <div className="p-2 bg-[#2d2d2d] rounded text-slate-300 font-mono text-xs">
                            <div className="mb-1"><span className="text-slate-500">Input:</span> {tc.input}</div>
                            <div><span className="text-slate-500">Expected:</span> {tc.output}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'results' && (
                  <div className="space-y-4">
                    {!testResults ? (
                      <div className="text-slate-500 italic">
                        {isRunning ? 'Executing code...' : 'Run code to see results.'}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {feedback && (
                           <div className="p-3 bg-blue-900/20 border border-blue-900/50 rounded text-blue-200 text-xs mb-4">
                              <div className="font-bold mb-1 flex items-center gap-2">
                                <Terminal size={12} /> Execution Analysis
                              </div>
                              {feedback}
                           </div>
                        )}
                        {testResults.map((res, idx) => (
                          <div key={idx} className="flex items-start gap-3 p-2 rounded hover:bg-[#2d2d2d] border border-transparent hover:border-[#333]">
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
                                     <span className="text-slate-300">{res.input}</span>
                                   </div>
                                   <div>
                                     <span className="text-slate-500 block mb-0.5">Expected</span>
                                     <span className="text-slate-300">{res.expected}</span>
                                   </div>
                                   <div className="col-span-2 border-t border-[#333] pt-1 mt-1">
                                     <span className="text-slate-500 block mb-0.5">Output</span>
                                     <span className={`${res.passed ? 'text-slate-300' : 'text-red-300'}`}>{res.actual}</span>
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
  );
};

export default CodeEditor;