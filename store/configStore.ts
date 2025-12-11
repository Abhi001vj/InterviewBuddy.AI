import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { FullConfig, SettingsType } from '../types';
import { META_DEFAULT_CONFIG } from '../config/defaults/meta';
import { GOOGLE_DEFAULT_CONFIG } from '../config/defaults/google';

interface ConfigState {
  config: FullConfig;
  selectedPreset: 'meta' | 'google' | 'custom';
  
  // Actions
  loadPreset: (preset: 'meta' | 'google' | 'custom') => void;
  updateGuideline: (type: keyof FullConfig['guidelines'], value: string) => void;
  updateRubric: (type: keyof FullConfig['rubrics'], value: string) => void;
  updatePrompt: (type: keyof FullConfig['prompts'], value: string) => void;
  updateSettings: (settings: Partial<SettingsType>) => void;
  resetToDefault: () => void;
  importConfig: (config: FullConfig) => void;
  exportConfig: () => string;
}

export const useConfigStore = create<ConfigState>()(
  persist(
    (set, get) => ({
      config: META_DEFAULT_CONFIG as FullConfig,
      selectedPreset: 'meta',
      
      loadPreset: (preset) => {
        let newConfig = get().config;
        if (preset === 'meta') newConfig = META_DEFAULT_CONFIG as FullConfig;
        if (preset === 'google') newConfig = GOOGLE_DEFAULT_CONFIG as FullConfig;
        
        set({ config: newConfig, selectedPreset: preset });
      },
      
      updateGuideline: (type, value) => {
        set((state) => ({
          config: {
            ...state.config,
            guidelines: {
              ...state.config.guidelines,
              [type]: value
            }
          },
          selectedPreset: 'custom'
        }));
      },
      
      updateRubric: (type, value) => {
        set((state) => ({
          config: {
            ...state.config,
            rubrics: {
              ...state.config.rubrics,
              [type]: value
            }
          },
          selectedPreset: 'custom'
        }));
      },
      
      updatePrompt: (type, value) => {
        set((state) => ({
          config: {
            ...state.config,
            prompts: {
              ...state.config.prompts,
              [type]: value
            }
          },
          selectedPreset: 'custom'
        }));
      },
      
      updateSettings: (settings) => {
        set((state) => ({
          config: {
            ...state.config,
            settings: {
              ...state.config.settings,
              ...settings
            }
          }
        }));
      },
      
      resetToDefault: () => {
        const preset = get().selectedPreset;
        const config = preset === 'google' ? GOOGLE_DEFAULT_CONFIG : META_DEFAULT_CONFIG;
        set({ config: config as FullConfig });
      },
      
      importConfig: (config) => {
        set({ config, selectedPreset: 'custom' });
      },
      
      exportConfig: () => {
        return JSON.stringify(get().config, null, 2);
      }
    }),
    {
      name: 'interview-config-storage'
    }
  )
);