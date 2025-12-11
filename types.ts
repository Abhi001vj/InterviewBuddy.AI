
export enum InterviewRound {
  SYSTEM_DESIGN = 'System Design',
  DSA = 'Data Structures & Algorithms'
}

export enum TargetCompany {
  GOOGLE = 'Google',
  META = 'Meta',
  AMAZON = 'Amazon',
  NETFLIX = 'Netflix',
  APPLE = 'Apple',
  UBER = 'Uber',
  MICROSOFT = 'Microsoft',
  ATLASSIAN = 'Atlassian',
  ORACLE = 'Oracle',
  NVIDIA = 'Nvidia'
}

export enum TargetRole {
  FRONTEND_ANGULAR = 'Angular Frontend Engineer',
  FULL_STACK = 'Full Stack Engineer',
  ML_ENGINEER = 'Machine Learning Engineer',
  AI_ENGINEER = 'AI Engineer',
  BACKEND_PYTHON = 'Senior Python Backend Engineer'
}

export enum ProgrammingLanguage {
  PYTHON = 'Python',
  JAVASCRIPT = 'JavaScript',
  CPP = 'C++'
}

export interface InterviewConfig {
  targetCompany: TargetCompany;
  targetRole: TargetRole;
  roundType: InterviewRound;
  topic: string;
  customQuestion: string;
  language: ProgrammingLanguage;
  textModel: string;
  liveModel: string;
}

export interface DrawingShape {
  id: string;
  type: 'rect' | 'cylinder' | 'line' | 'text' | 'arrow';
  x: number;
  y: number;
  width?: number;
  height?: number;
  text?: string;
  endX?: number;
  endY?: number;
  color: string;
}

export interface TestCase {
  input: string;
  output: string;
}

export interface TestResult {
  input: string;
  expected: string;
  actual: string;
  passed: boolean;
  logs?: string;
}

export interface DSAChallenge {
  starterCode: string;
  testCases: TestCase[];
}

export type StageStatus = 'pending' | 'active' | 'completed' | 'skipped' | 'failed' | 'warning';

export interface InterviewPhase {
  id: string;
  name: string;
  duration: number | null; // seconds
  minDuration?: number;
  required: boolean;
  subSteps: string[];
}

export interface InterviewStage {
  id: string;
  label: string;
  status: StageStatus;
  description?: string;
  timeSpent: number;
  expectedDuration?: number;
}

export interface RealTimeFeedback {
  id: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
  timestamp: number;
}

export interface AssessmentResult {
  phase_completion: number; // 0-100
  quality_scores: {
    depth: number;
    clarity: number;
    technical: number;
    practical: number;
  };
  red_flags: string[];
  green_flags: string[];
  immediate_feedback: string;
  next_phase_ready: boolean;
  next_phase_reason: string;
  overall_impression: string;
  completed_substeps?: string[];
}

export interface FeedbackReport {
  overallScore: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  stages: {
    stage: string;
    feedback: string;
    score: number; // 1-5
  }[];
  detailedAssessment: string; // Markdown
}
