
import { TargetCompany, TargetRole, InterviewRound, ProgrammingLanguage, InterviewPhase } from './types';

export const COMPANIES = Object.values(TargetCompany);
export const ROLES = Object.values(TargetRole);
export const ROUNDS = Object.values(InterviewRound);
export const LANGUAGES = Object.values(ProgrammingLanguage);

// Used for heavy reasoning tasks (Chat, Feedback, Assessment)
export const TEXT_MODELS = [
  { id: 'gemini-3-pro-preview', name: 'Gemini 3.0 Pro (Thinking)' },
  { id: 'gemini-2.0-pro-exp-02-05', name: 'Gemini 2.0 Pro (Complex Tasks)' },
  { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash (Fast)' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
];

// Used for instant utility tasks (Rewriting questions, Generating boilerplate code)
export const FAST_TEXT_MODEL = 'gemini-2.0-flash-exp';

export const LIVE_MODELS = [
  { id: 'gemini-2.5-flash-native-audio-preview-09-2025', name: 'Gemini 2.5 Flash Live (Preview)' },
  { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash Live' }
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
    "Design a Fraud Detection System",
    "Design an E-commerce Checkout (Frontend)",
    "Design a News Feed (Frontend)"
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

// --- PHASE DEFINITIONS ---

const ML_PHASES: InterviewPhase[] = [
    {
      id: 'framing',
      name: 'Problem Framing',
      duration: 420,
      minDuration: 300,
      required: true,
      subSteps: ['Clarify requirements', 'Business Objective', 'ML Objective', 'Constraints']
    },
    {
      id: 'design',
      name: 'High-Level Design',
      duration: 180,
      minDuration: 60,
      required: true,
      subSteps: ['Block diagram', 'Data flow', 'Key components']
    },
    {
      id: 'data',
      name: 'Data & Features',
      duration: 600,
      required: true,
      subSteps: ['Data Sources', 'Labeling', 'Feature Selection', 'Feature Engineering']
    },
    {
      id: 'modeling',
      name: 'Modeling',
      duration: 600,
      required: true,
      subSteps: ['Baseline', 'Model Selection', 'Architecture', 'Loss Functions']
    },
    {
      id: 'eval',
      name: 'Eval & Serving',
      duration: 420,
      required: true,
      subSteps: ['Offline Metrics', 'Online Metrics', 'Latency/Scale', 'Deployment']
    }
];

const BACKEND_PHASES: InterviewPhase[] = [
    {
      id: 'requirements',
      name: 'Requirements',
      duration: 300,
      required: true,
      subSteps: ['Functional Requirements', 'Non-Functional (CAP, Scale)', 'Back-of-envelope Math']
    },
    {
      id: 'api_db',
      name: 'API & Data Model',
      duration: 420,
      required: true,
      subSteps: ['API Endpoints Definition', 'Database Schema Design', 'SQL vs NoSQL Choice']
    },
    {
      id: 'hld',
      name: 'High-Level Design',
      duration: 300,
      required: true,
      subSteps: ['Draw Core Components', 'Data Flow', 'Load Balancers/Services']
    },
    {
      id: 'deep_dive',
      name: 'Deep Dive',
      duration: 600,
      required: true,
      subSteps: ['Scaling Strategies', 'Caching', 'Partitioning/Sharding', 'Bottlenecks']
    },
    {
      id: 'wrapup',
      name: 'Wrap Up',
      duration: 180,
      required: true,
      subSteps: ['Trade-offs', 'Failure Scenarios', 'Future Improvements']
    }
];

const FRONTEND_PHASES: InterviewPhase[] = [
    {
      id: 'requirements',
      name: 'Requirements',
      duration: 300,
      required: true,
      subSteps: ['User Stories/UX', 'Device Support', 'Performance Constraints', 'Accessibility']
    },
    {
      id: 'architecture',
      name: 'Component Arch',
      duration: 420,
      required: true,
      subSteps: ['Component Tree', 'Props/State Flow', 'Server vs Client Side Rendering']
    },
    {
      id: 'state',
      name: 'State Management',
      duration: 300,
      required: true,
      subSteps: ['Local vs Global State', 'Data Fetching Strategy', 'Caching/Store']
    },
    {
      id: 'perf_ux',
      name: 'Perf & UX',
      duration: 480,
      required: true,
      subSteps: ['Rendering Opt (LCP/CLS)', 'Network Optimization', 'Error Handling', 'A11y']
    },
    {
      id: 'api_interface',
      name: 'API Interface',
      duration: 300,
      required: true,
      subSteps: ['API Contract', 'Polling vs Sockets', 'Mocking/Testing Strategy']
    }
];

const DSA_PHASES: InterviewPhase[] = [
    {
      id: 'problem_understanding',
      name: 'Problem Understanding',
      duration: 120,
      required: true,
      subSteps: ['Ask clarifications', 'Restate problem', 'Identify constraints']
    },
    {
      id: 'approach_discussion',
      name: 'Approach Discussion',
      duration: 180,
      required: true,
      subSteps: ['Brute force approach', 'Optimal approach', 'Complexity analysis']
    },
    {
      id: 'implementation',
      name: 'Implementation',
      duration: 900,
      required: true,
      subSteps: ['Write clean code', 'Think aloud', 'Handle edge cases']
    },
    {
      id: 'verification',
      name: 'Verification',
      duration: 300,
      required: true,
      subSteps: ['Dry run', 'Test with examples', 'Debug if necessary']
    }
];

// Helper to get correct phases based on Round and Role
export const getInterviewPhases = (round: InterviewRound, role: TargetRole): InterviewPhase[] => {
    if (round === InterviewRound.DSA) {
        return DSA_PHASES;
    }
    
    // System Design Split
    if (role === TargetRole.FRONTEND_ANGULAR) {
        return FRONTEND_PHASES;
    }
    if (role === TargetRole.ML_ENGINEER || role === TargetRole.AI_ENGINEER) {
        return ML_PHASES;
    }
    // Default to Backend/Generic for Full Stack, Backend, etc.
    return BACKEND_PHASES;
};

// Legacy Export for backward compatibility if needed, though we should prefer the helper
export const INTERVIEW_PHASES = {
  [InterviewRound.SYSTEM_DESIGN]: BACKEND_PHASES,
  [InterviewRound.DSA]: DSA_PHASES
};

export const DSA_SCORING_DIMENSIONS = [
  { id: 'problem_solving', name: 'Problem Solving', weight: 0.25, criteria: ['Clarifying questions', 'Optimal approach', 'Complexity analysis'] },
  { id: 'coding', name: 'Coding', weight: 0.25, criteria: ['Clean code', 'Variable naming', 'Correct implementation'] },
  { id: 'verification', name: 'Verification', weight: 0.25, criteria: ['Dry run', 'Edge cases', 'Bug fixes'] },
  { id: 'communication', name: 'Communication', weight: 0.25, criteria: ['Think aloud', 'Explanation clarity', 'Collaboration'] }
];

export const SYSTEM_DESIGN_SCORING_DIMENSIONS = [
    { id: 'depth', name: 'Depth', weight: 0.25, criteria: ['Scale handling', 'Bottlenecks', 'Tradeoffs'] },
    { id: 'clarity', name: 'Clarity', weight: 0.25, criteria: ['Structured approach', 'Clear diagrams', 'Requirements'] },
    { id: 'technical', name: 'Technical', weight: 0.25, criteria: ['Technology choices', 'Data modeling', 'API design'] },
    { id: 'practical', name: 'Practicality', weight: 0.25, criteria: ['Feasibility', 'Operational readiness', 'Edge cases'] }
];
