export const GOOGLE_DEFAULT_CONFIG = {
  name: "Google ML SWE",
  company: "Google",
  role: "ML Software Engineer",
  
  guidelines: {
    ml_design: `# ML System Design (Google)
- Massive scale focus
- Distributed systems (Bigtable, Spanner)
- Algorithmic rigor
- Privacy (Differential Privacy)
- TFX Pipelines`,

    coding: `# Coding (Google)
- Graph Algorithms
- Dynamic Programming
- Mathematical rigor
- Complexity Analysis (Big-O) is mandatory`,

    behavioral: `# Behavioral (Google)
- Googleyness
- Leadership
- Technical Impact`
  },

  rubrics: {
    ml_design: `ML System Design Rubric (Google)
- Problem Understanding (20%)
- System Architecture (25%)
- Data & Features (15%)
- Modeling (25%)
- Evaluation & Serving (15%)`,

    coding: `Coding Rubric (Google)
- Algorithm Knowledge (30%)
- Coding (30%)
- Problem Solving (25%)
- Communication (15%)`
  },

  prompts: {
    assessment: `You are a Google Interviewer. Assess based on algorithmic depth and scale.`,
    feedback: `Provide feedback emphasizing optimization and scale.`,
    scoring: `Score based on Google's rubric. Complexity analysis is required.`,
    report: `Generate a detailed hiring recommendation for Google.`
  },

  settings: {
    targetLevel: 'L4 (Mid)',
    enableRealtimeFeedback: true,
    enableVoiceFeedback: true,
    showProgressBar: true,
    showLiveScores: true,
    strictTiming: false,
    assessmentFrequency: 30,
    feedbackVerbosity: 'moderate'
  }
};