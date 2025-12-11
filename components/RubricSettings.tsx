import React, { useState, useEffect } from 'react';
import { X, Save, RotateCcw, FileText, Settings, MessageSquare, BookOpen, AlertTriangle } from 'lucide-react';
import { useConfigStore } from '../store/configStore';

interface ConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyName: string;
}

const ConfigurationModal: React.FC<ConfigurationModalProps> = ({ 
  isOpen, 
  onClose,
  companyName
}) => {
  const { config, updateGuideline, updateRubric, updatePrompt, updateSettings, resetToDefault } = useConfigStore();
  const [activeTab, setActiveTab] = useState<'guidelines' | 'rubrics' | 'prompts' | 'settings'>('guidelines');
  const [subTab, setSubTab] = useState<string>('ml_design');

  if (!isOpen) return null;

  const renderEditor = (
    value: string, 
    onChange: (val: string) => void, 
    placeholder: string
  ) => (
    <textarea 
        className="w-full h-full bg-slate-900 text-slate-300 font-mono text-xs p-4 outline-none resize-none border border-slate-700 rounded-lg focus:border-blue-500 transition-colors"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        placeholder={placeholder}
    />
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-950 w-full max-w-5xl h-[85vh] rounded-2xl border border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-fadeIn">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-600/20 rounded-lg border border-purple-500/30">
                <Settings size={20} className="text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Interview Configuration</h2>
              <p className="text-slate-400 text-xs mt-0.5">Customize AI behavior for {companyName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
            {/* Sidebar Tabs */}
            <div className="w-48 bg-slate-900 border-r border-slate-800 flex flex-col p-2 gap-1">
                {[
                    { id: 'guidelines', label: 'Guidelines', icon: BookOpen },
                    { id: 'rubrics', label: 'Rubrics', icon: FileText },
                    { id: 'prompts', label: 'AI Prompts', icon: MessageSquare },
                    { id: 'settings', label: 'Settings', icon: Settings },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                            activeTab === tab.id 
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                        }`}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 flex flex-col bg-slate-950 p-6 overflow-hidden">
                
                {/* Sub-tabs (if applicable) */}
                {activeTab !== 'settings' && (
                    <div className="flex gap-2 mb-4 border-b border-slate-800 pb-1">
                        {(activeTab === 'guidelines' ? ['ml_design', 'coding', 'behavioral'] :
                          activeTab === 'rubrics' ? ['ml_design', 'coding'] :
                          ['assessment', 'feedback', 'scoring', 'report']).map(st => (
                            <button
                                key={st}
                                onClick={() => setSubTab(st)}
                                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
                                    subTab === st 
                                        ? 'border-blue-500 text-blue-400' 
                                        : 'border-transparent text-slate-500 hover:text-slate-300'
                                }`}
                            >
                                {st.replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                )}

                <div className="flex-1 relative">
                    {activeTab === 'guidelines' && renderEditor(
                        config.guidelines[subTab as keyof typeof config.guidelines],
                        (val) => updateGuideline(subTab as keyof typeof config.guidelines, val),
                        "Enter interview guidelines..."
                    )}
                    
                    {activeTab === 'rubrics' && renderEditor(
                        config.rubrics[subTab as keyof typeof config.rubrics],
                        (val) => updateRubric(subTab as keyof typeof config.rubrics, val),
                        "Enter scoring rubric..."
                    )}

                    {activeTab === 'prompts' && (
                        <div className="h-full flex flex-col gap-2">
                             <div className="bg-blue-900/10 border border-blue-900/30 p-2 rounded text-[10px] text-blue-300 flex gap-2 flex-wrap">
                                 <span className="font-bold text-blue-200">Variables:</span>
                                 <code>{`{interview_type}`}</code>
                                 <code>{`{current_phase}`}</code>
                                 <code>{`{time_spent}`}</code>
                                 <code>{`{chat_history}`}</code>
                                 <code>{`{guidelines}`}</code>
                             </div>
                             {renderEditor(
                                config.prompts[subTab as keyof typeof config.prompts],
                                (val) => updatePrompt(subTab as keyof typeof config.prompts, val),
                                "Enter system prompt..."
                            )}
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="space-y-6 p-4">
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">General Settings</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <label className="flex items-center justify-between bg-slate-900 p-3 rounded-lg border border-slate-800">
                                        <span className="text-sm text-slate-300">Real-time Feedback</span>
                                        <input 
                                            type="checkbox" 
                                            checked={config.settings.enableRealtimeFeedback}
                                            onChange={(e) => updateSettings({ enableRealtimeFeedback: e.target.checked })}
                                            className="w-4 h-4 accent-blue-600"
                                        />
                                    </label>
                                    <label className="flex items-center justify-between bg-slate-900 p-3 rounded-lg border border-slate-800">
                                        <span className="text-sm text-slate-300">Voice Feedback</span>
                                        <input 
                                            type="checkbox" 
                                            checked={config.settings.enableVoiceFeedback}
                                            onChange={(e) => updateSettings({ enableVoiceFeedback: e.target.checked })}
                                            className="w-4 h-4 accent-blue-600"
                                        />
                                    </label>
                                     <label className="flex items-center justify-between bg-slate-900 p-3 rounded-lg border border-slate-800">
                                        <span className="text-sm text-slate-300">Strict Timing</span>
                                        <input 
                                            type="checkbox" 
                                            checked={config.settings.strictTiming}
                                            onChange={(e) => updateSettings({ strictTiming: e.target.checked })}
                                            className="w-4 h-4 accent-blue-600"
                                        />
                                    </label>
                                </div>
                            </div>
                            
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Target Level</h3>
                                <select 
                                    value={config.settings.targetLevel}
                                    onChange={(e) => updateSettings({ targetLevel: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-blue-500 outline-none"
                                >
                                    <option>L3 (Entry)</option>
                                    <option>L4 (Mid-Level)</option>
                                    <option>L5 (Senior)</option>
                                    <option>L6 (Staff)</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-between items-center">
            <button 
                onClick={resetToDefault}
                className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors text-sm font-medium"
            >
                <RotateCcw size={14} /> Reset to Default
            </button>
            <div className="flex gap-3">
                <button 
                    onClick={onClose}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-lg shadow-blue-900/20 transition-all font-medium text-sm flex items-center gap-2"
                >
                    <Save size={16} /> Done
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigurationModal;