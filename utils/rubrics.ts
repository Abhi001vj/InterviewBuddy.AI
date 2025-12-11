
export const ML_SYSTEM_DESIGN_RUBRIC = `
ML SYSTEM DESIGN DELIVERY FRAMEWORK:

1. Problem Framing (5-7 mins)
- Clarify the problem: Scope, constraints, scale.
- Establish Business Objective: What is the value? (e.g., increase revenue, reduce harm).
- Decide on ML Objective: Translate business goal to ML task (Ranking, Classification, etc.) and metric.
* Green Flag: Asks detailed questions, defines clear objectives.
* Red Flag: Jumps to solution, naive ML objective, ignores business value.

2. High-Level Design (2-3 mins)
- Block diagram of inputs -> system -> outputs.
- Key components (Data ingestion, Training, Inference, Action).
* Green Flag: Covers full lifecycle.
* Red Flag: Too much focus on generic SWE details (DB choice) instead of ML components.

3. Data and Features (10 mins)
- Training Data: Sources, labeling (supervised/semi-supervised), bias handling.
- Features: Selection, hypothesis for predictive power, encodings (embeddings, one-hot).
* Green Flag: Uses unsupervised data, strong feature hypothesis, discusses representation.
* Red Flag: Laundry list of weak features, ignores representation.

4. Modeling (10 mins)
- Benchmark/Baseline: Simple heuristic or simple model first.
- Model Selection: Tradeoffs between models (e.g., Logistic Regression vs. Two-Tower NN).
- Architecture: Layers, activations, loss function details.
* Green Flag: Starts simple, compares tradeoffs, understands architecture details.
* Red Flag: Jumps to complex model without justification, hand-waves details.

5. Inference and Evaluation (7 mins)
- Evaluation: Offline (Precision/Recall, NDCG) vs Online (CTR, A/B Test). Ties back to business objective.
- Inference: Latency, caching, distillation, scale.
* Green Flag: Metrics tie to business, considers inference cost/latency.
* Red Flag: Metrics disconnected from business, ignores inference constraints.
`;

export const DSA_RUBRIC = `
CODING INTERVIEW RUBRIC:

1. Problem Solving
- Ask clarification questions.
- Discuss multiple approaches (Brute force -> Optimal).
- Analyze Time/Space complexity.
* Red Flag: Jumping to code without understanding, silent thinking.

2. Coding
- Clean, readable code.
- Standard variable naming.
- Idiomatic language usage.

3. Verification
- Proactive verification (Dry run).
- Check edge cases (Null, Empty, Large inputs).
- Don't rely on interviewer to find bugs.

4. Communication
- Explain thought process while coding.
- Take hints well.
`;

export const FULL_INTERVIEW_GUIDE = `
# ML System Design in a Hurry: Delivery Framework

The best way to structure your system design interviews is to focus on the most important aspects. 

## 1. Problem Framing (5-7 minutes)
Your job is to:
1.  **Clarify the problem**: Ask targeted questions (Users? Scale? Latency? Constraints?).
2.  **Establish Business Objective**: "Increase revenue" is vague. "Reduce unwanted exposure of harmful content" is specific.
3.  **Decide on ML Objective**: Translate business goal to ML task (e.g., Ranking, Classification) and metric (e.g., NDCG, Precision@k).

*   **Green Flags**: detailed questions, clear business objective, clear ML objective.
*   **Red Flags**: naive ML objective, no questions asked, unclear design goals.

## 2. High-Level Design (2-3 minutes)
Set up scaffolding. A simple block diagram showing inputs -> system components -> outputs.
*   **Focus**: Lifecycle from data inputs to actions taken.
*   **Avoid**: Getting bogged down in generic database choices.

## 3. Data and Features (10 minutes)
1.  **Training Data**: Sources? Labels? (Supervised/Semi-supervised/Unsupervised).
2.  **Features**: Raw data -> Transformations -> Encodings (Embeddings, One-hot).
*   **Green Flags**: Uses semi-supervised/unsupervised data, impactful features, discusses representation.
*   **Red Flags**: Laundry list of features, ignores representation details.

## 4. Modeling (10 minutes)
1.  **Benchmark/Baseline**: Start with a simple heuristic or simple model.
2.  **Model Selection**: Tradeoffs (e.g., Deep Learning vs. Trees).
3.  **Model Architecture**: Loss functions, layers, activations.
*   **Green Flags**: Starts with baseline, discusses tradeoffs, details architecture.
*   **Red Flags**: Jumps to complex model immediately, hand-waves details.

## 5. Inference and Evaluation (7 minutes)
1.  **Evaluation**: Offline metrics vs. Online (A/B testing). Link back to Business Objective.
2.  **Inference**: Latency, caching, scaling, quantization.
*   **Green Flags**: Metrics tie to business, practical inference constraints considered.
*   **Red Flags**: Metrics disconnected from business, ignores inference costs.

---

# Meta Interview Preparation Guide

## Coding Interviews
Assessed in 4 areas:
1.  **Problem Solving**: Ask clarification questions. Present multiple solutions. Don't jump to coding immediately.
2.  **Coding**: Clean, readable, optimized code.
3.  **Verification**: Proactive verification (dry run). Check edge cases.
4.  **Communication**: Talk while you code. Explain decisions.

## Behavioral Interview
Focus on **IMPACT**. Use **STAR** format (Situation, Task, Action, Result).
Signals assessed:
*   **Conflict Resolution**: How you resolve disagreements. Focus on the goal, not the person.
*   **Empathy**: Understanding team members/users.
*   **Growth**: Receiving feedback, learning from mistakes.
*   **Proactive**: Acting without being told.
*   **Perseverance**: Ownership of difficult tasks.
*   **Ambiguity**: Moving forward when things are unclear.
`;
