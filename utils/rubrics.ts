
export const ML_SYSTEM_DESIGN_RUBRIC = `
ML SYSTEM DESIGN FRAMEWORK:
1. Problem Framing: Clarify scope, business & ML objectives (Metrics).
2. High-Level Design: Data flow from source to inference.
3. Data & Features: Labeling strategies, feature engineering, embeddings.
4. Modeling: Baseline vs SOTA, architecture choices, loss functions.
5. Eval & Serving: Offline/Online metrics, latency, A/B testing.
`;

export const BACKEND_SYSTEM_DESIGN_RUBRIC = `
DISTRIBUTED SYSTEM DESIGN FRAMEWORK:
1. Requirements: Functional (API capabilities) & Non-Functional (Scale, Latency, Consistency).
2. API & Data Model: REST/RPC/GraphQL definitions, Schema (SQL vs NoSQL), Partitioning keys.
3. High-Level Design: Load Balancers, Services, Caching layers, Message Queues.
4. Deep Dive: Handling bottlenecks, Scaling (Horizontal vs Vertical), Database Sharding, Concurrency.
5. Wrap-up: Failure scenarios, Monitoring, Trade-offs made.
`;

export const FRONTEND_SYSTEM_DESIGN_RUBRIC = `
FRONTEND SYSTEM DESIGN FRAMEWORK:
1. Requirements: User Experience (UX), Device constraints, Accessibility (a11y), Performance goals.
2. Architecture: Component hierarchy, Routing, Client-side vs Server-side rendering (CSR/SSR).
3. State Management: Local vs Global state, API Data caching (React Query/Apollo), Normalization.
4. Performance: Critical Rendering Path, Lazy loading, Bundle size, Network optimization.
5. API Interface: Polling vs WebSockets, Error handling, Optimistic updates.
`;

export const DSA_RUBRIC = `
CODING INTERVIEW RUBRIC:
1. Problem Solving: Ask clarifications, analyze constraints, Big-O analysis.
2. Coding: Clean, modular, syntactically correct code.
3. Verification: Dry run with examples, check edge cases (empty, null, large inputs).
4. Communication: Think out loud, explain tradeoffs.
`;

export const FULL_INTERVIEW_GUIDE = `
# System Design Interview Delivery Frameworks

## 1. Backend / Distributed Systems
*   **Requirements**: Functional & Non-Functional (CAP theorem, Scale).
*   **Data**: Schema design is critical. Choose SQL/NoSQL wisely.
*   **Design**: Draw boxes & arrows. Discuss Load Balancers, Caches, DBs.
*   **Deep Dive**: Pick one component (e.g., "How to scale the counter?").

## 2. Frontend Systems
*   **RADIO Framework**: Requirements, Architecture, Data/State, Interface, Optimizations.
*   **Focus**: User experience, bundle splitting, rendering performance (LCP/CLS), accessibility.

## 3. Machine Learning Systems
*   **Focus**: The lifecycle of data. Feature selection, Model training pipeline, Evaluation metrics, Serving latency.

---

# Coding Interviews (DSA)
1.  **Understand**: Clarify input/output.
2.  **Plan**: Brute force -> Optimal.
3.  **Code**: Write it out.
4.  **Test**: Walk through line-by-line.
`;
