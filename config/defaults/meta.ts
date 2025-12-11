export const META_DEFAULT_CONFIG = {
  name: "Meta ML Engineer",
  company: "Meta",
  role: "ML Engineer",
  
  guidelines: {
    ml_design: `# ML System Design Interview Framework (Meta)

## Interview Structure (45 minutes)

### Phase 1: Problem Framing (5-7 minutes)
- Clarify problem scope & constraints
- Establish Business Objective (Value)
- Define ML Objective (Metric)
- Ask about scale (Billions of users)

### Phase 2: High-Level Design (2-3 minutes)
- End-to-end data flow
- Key components (Ingestion -> Training -> Serving)
- Real-time vs Batch

### Phase 3: Data & Features (10 minutes)
- Data Sources & Labeling
- Feature Engineering (User, Content, Context)
- Representation (Embeddings)

### Phase 4: Modeling (10 minutes)
- Baseline Model
- Advanced Architecture (Two-Tower, etc.)
- Loss Functions
- Training Strategy

### Phase 5: Inference & Evaluation (7 minutes)
- Evaluation Metrics (Offline/Online)
- Serving Architecture (Latency, Cost)
- Monitoring`,

    coding: `# Coding Interview Framework (Meta)
- 2 Problems in 45 mins
- Verification is CRITICAL (Test without prompting)
- No Dynamic Programming
- Focus on Arrays, Strings, HashMaps, Graphs
- Clean, production-ready code`,

    behavioral: `# Behavioral (Meta)
- Conflict Resolution
- Continuous Growth
- Embracing Ambiguity
- Driving Results
- Communication`
  },

  rubrics: {
    ml_design: `ML System Design Rubric (Meta)
- Problem Navigation (25%)
- Training Data (20%)
- Feature Engineering (15%)
- Modeling (20%)
- Evaluation & Deployment (20%)
Bonus: Viral content, Real-time personalization`,

    coding: `Coding Rubric (Meta)
- Problem Solving (25%)
- Coding (25%)
- Verification (25%) - CRITICAL
- Communication (25%)`
  },

  prompts: {
    assessment: `You are a Meta Interviewer. Assess the candidate based on Meta's high bar for scale and engineering excellence.
    
    Current Phase: {current_phase}
    
    Check for:
    - Scale considerations (billions of users)
    - Practical trade-offs
    - Proactive verification (for coding)
    
    Respond in JSON.`,
    
    feedback: `Provide brief, actionable feedback for a Meta interview. Mention scale if relevant.`,
    
    scoring: `Score based on Meta's 4-pillar rubric. Verification is mandatory for coding.`,
    
    report: `Generate a detailed hiring recommendation for Meta.`
  },

  settings: {
    targetLevel: 'L5 (Senior)',
    enableRealtimeFeedback: true,
    enableVoiceFeedback: true,
    showProgressBar: true,
    showLiveScores: true,
    strictTiming: false,
    assessmentFrequency: 30,
    feedbackVerbosity: 'moderate'
  }
};