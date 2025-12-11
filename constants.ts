
import { TargetCompany, TargetRole, InterviewRound, ProgrammingLanguage, InterviewPhase } from './types';

export const COMPANIES = Object.values(TargetCompany);
export const ROLES = Object.values(TargetRole);
export const ROUNDS = Object.values(InterviewRound);
export const LANGUAGES = Object.values(ProgrammingLanguage);

export const TEXT_MODELS = [
  { id: 'gemini-3-pro-preview', name: 'Gemini 3.0 Pro (Reasoning)' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Fast)' },
];

export const LIVE_MODELS = [
  { id: 'gemini-2.5-flash-native-audio-preview-09-2025', name: 'Gemini 2.5 Flash Live' }
];

export const TOPICS = {
  [InterviewRound.SYSTEM_DESIGN]: [
    "Design Twitter / X",
    "Design WhatsApp / Messenger",
    "Design a URL Shortener",
    "Design a Rate Limiter",
    "Design Youtube / Netflix",
    "Design Uber / Lyft",
    "Design a Web Crawler",
    "Design a Distributed Cache",
    "Design a Recommendation System",
    "Design a Fraud Detection System"
  ],
  [InterviewRound.DSA]: [
    "Two Sum",
    "Merge K Sorted Lists",
    "Trapping Rain Water",
    "LRU Cache",
    "Word Search II",
    "Median of Two Sorted Arrays",
    "Reverse Nodes in k-Group"
  ]
};

export const STARTER_CODE_TEMPLATES = {
  [ProgrammingLanguage.PYTHON]: `# Write your solution here
class Solution:
    def solve(self, input_data):
        # Time Complexity: O(n)
        # Space Complexity: O(1)
        pass
`,
  [ProgrammingLanguage.JAVASCRIPT]: `/**
 * @param {any} inputData
 * @return {any}
 */
class Solution {
    solve(inputData) {
        // Time Complexity: O(n)
        // Space Complexity: O(1)
        return null;
    }
}
`,
  [ProgrammingLanguage.CPP]: `#include <vector>
#include <iostream>

using namespace std;

class Solution {
public:
    void solve() {
        // Time Complexity: O(n)
        // Space Complexity: O(1)
    }
};
`
};

export const INTERVIEW_PHASES: { [key in InterviewRound]: InterviewPhase[] } = {
  [InterviewRound.SYSTEM_DESIGN]: [
    {
      id: 'framing',
      name: 'Problem Framing',
      duration: 420, // 7 minutes
      minDuration: 300, // 5 mins minimum per spec
      required: true,
      subSteps: [
        'Clarify functional requirements',
        'Clarify non-functional requirements',
        'Establish Business Objective',
        'Define ML Objective'
      ]
    },
    {
      id: 'design',
      name: 'High-Level Design',
      duration: 180, // 3 minutes
      minDuration: 60,
      required: true,
      subSteps: ['Block diagram', 'Data flow', 'Key components identification']
    },
    {
      id: 'data',
      name: 'Data & Features',
      duration: 600, // 10 minutes
      required: true,
      subSteps: [
        'Training Data Sources',
        'Labeling Strategy',
        'Feature Selection',
        'Feature Engineering'
      ]
    },
    {
      id: 'modeling',
      name: 'Modeling',
      duration: 600, // 10 minutes
      required: true,
      subSteps: [
        'Benchmark/Baseline Model',
        'Model Selection Tradeoffs',
        'Architecture Details',
        'Loss Functions'
      ]
    },
    {
      id: 'eval',
      name: 'Inference & Evaluation',
      duration: 420, // 7 minutes
      required: true,
      subSteps: [
        'Offline Metrics',
        'Online Metrics (A/B)',
        'Inference Latency/Scale',
        'Deployment Strategy'
      ]
    }
  ],
  [InterviewRound.DSA]: [
    {
      id: 'problem_understanding',
      name: 'Problem Understanding',
      duration: 120, // 2 minutes
      required: true,
      subSteps: ['Ask clarifications', 'Restate problem', 'Identify constraints']
    },
    {
      id: 'approach_discussion',
      name: 'Approach Discussion',
      duration: 180, // 3 minutes
      required: true,
      subSteps: ['Brute force approach', 'Optimal approach', 'Complexity analysis (Big O)']
    },
    {
      id: 'implementation',
      name: 'Implementation',
      duration: 900, // 15 minutes
      required: true,
      subSteps: ['Write clean code', 'Think aloud', 'Handle edge cases']
    },
    {
      id: 'verification',
      name: 'Verification',
      duration: 300, // 5 minutes
      required: true,
      subSteps: ['Dry run', 'Test with examples', 'Debug if necessary']
    }
  ]
};

// Legacy support for simple lists if needed, but updated to map to new phases
export const ML_SYSTEM_DESIGN_STAGES = INTERVIEW_PHASES[InterviewRound.SYSTEM_DESIGN].map(p => ({
  id: p.id,
  label: `${p.name}`,
  status: 'pending' as const,
  description: p.subSteps.join(', '),
  timeSpent: 0,
  expectedDuration: p.duration || 0
}));

export const DSA_STAGES = INTERVIEW_PHASES[InterviewRound.DSA].map(p => ({
  id: p.id,
  label: `${p.name}`,
  status: 'pending' as const,
  description: p.subSteps.join(', '),
  timeSpent: 0,
  expectedDuration: p.duration || 0
}));
