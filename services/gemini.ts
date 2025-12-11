
import { GoogleGenAI, Schema, Type } from "@google/genai";
import { TestCase, TestResult, DSAChallenge, ProgrammingLanguage, FeedbackReport, AssessmentResult } from "../types";
import { ML_SYSTEM_DESIGN_RUBRIC, DSA_RUBRIC } from "../utils/rubrics";

const getAI = () => {
  if (!process.env.API_KEY) {
    throw new Error("API Key missing");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const rewriteQuestion = async (
  question: string, 
  company: string, 
  role: string,
  round: string,
  model: string
): Promise<string> => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: `Rewrite the following interview question to match the specific style, tone, difficulty, and typical constraints of a ${company} ${role} interview for a ${round} round.
      
      For Google: Focus on scalability, edge cases, and ambiguity.
      For Meta: Focus on practical implementation, speed, and production-readiness.
      For Amazon: Focus on Leadership Principles compatibility and customer obsession.
      
      Original Question: "${question}"
      
      Output only the rewritten question text, fully formatted.`,
    });
    return response.text || question;
  } catch (error) {
    console.error("Failed to rewrite question:", error);
    return question;
  }
};

export const selectBestQuestion = async (
  questions: string[],
  company: string,
  role: string,
  model: string
): Promise<string> => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: `You are a hiring manager at ${company} hiring for a ${role}. 
      From the following list of potential interview questions, select the ONE single question that is most relevant, challenging, and characteristic of your interview process.
      
      Questions:
      ${questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}
      
      Output ONLY the text of the selected question. Do not add markdown formatting or quotes.`,
    });
    return response.text?.trim() || questions[0];
  } catch (error) {
    console.error("Selection Error", error);
    return questions[0];
  }
};

export const generateDSAChallenge = async (
  topicOrQuestion: string,
  language: ProgrammingLanguage = ProgrammingLanguage.PYTHON,
  model: string
): Promise<DSAChallenge> => {
  const ai = getAI();
  
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      starterCode: { type: Type.STRING, description: `Starter code in ${language} with class Solution and docstring description.` },
      testCases: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            input: { type: Type.STRING },
            output: { type: Type.STRING }
          }
        }
      }
    },
    required: ["starterCode", "testCases"]
  };

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: `Create a LeetCode-style coding challenge for: "${topicOrQuestion}".
      
      1. Provide starter code in ${language} inside a 'class Solution'.
      2. Include the full problem description, constraints, and examples as a comment/docstring inside the code.
      3. Provide 3 distinct test cases (input and expected output).
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response");
    return JSON.parse(text) as DSAChallenge;
  } catch (error) {
    console.error("DSA Gen Error", error);
    return {
      starterCode: `// Error generating challenge.\n// Please try again.\n\nclass Solution {\n    // Write your code here\n}`,
      testCases: []
    };
  }
};

export const analyzeCode = async (
  code: string, 
  question: string,
  testCases: TestCase[],
  language: ProgrammingLanguage,
  model: string
): Promise<{ passed: boolean, results: TestResult[], feedback: string }> => {
  const ai = getAI();
  
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      passed: { type: Type.BOOLEAN },
      results: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            input: { type: Type.STRING },
            expected: { type: Type.STRING },
            actual: { type: Type.STRING },
            passed: { type: Type.BOOLEAN },
            logs: { type: Type.STRING }
          }
        }
      },
      feedback: { type: Type.STRING }
    }
  };

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: `Act as a ${language} code execution engine and judge. Analyze the following code against the provided test cases.
      
      Problem: ${question}
      
      User Code (${language}):
      ${code}
      
      Test Cases:
      ${JSON.stringify(testCases)}
      
      1. Mentally execute the code for each test case.
      2. Determine the actual output.
      3. Specify if it passed or failed.
      4. Provide brief feedback on time/space complexity and correctness.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response");
    return JSON.parse(text);
  } catch (error) {
    console.error("Code Analysis Error", error);
    return {
      passed: false,
      results: [],
      feedback: "Error communicating with AI validation service."
    };
  }
};

export const assessInterviewProgress = async (
  snapshot: {
    phase: string;
    timeSpent: number;
    chatHistory: { role: string, text: string }[];
    canvasImage?: string;
    codeContent?: string;
    completedPhases: string[];
    roundType: string;
    rubric: string; // Dynamic rubric
  },
  model: string
): Promise<AssessmentResult | null> => {
  const ai = getAI();
  
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      phase_completion: { type: Type.NUMBER },
      quality_scores: {
        type: Type.OBJECT,
        properties: {
          depth: { type: Type.NUMBER },
          clarity: { type: Type.NUMBER },
          technical: { type: Type.NUMBER },
          practical: { type: Type.NUMBER }
        }
      },
      red_flags: { type: Type.ARRAY, items: { type: Type.STRING } },
      green_flags: { type: Type.ARRAY, items: { type: Type.STRING } },
      immediate_feedback: { type: Type.STRING },
      next_phase_ready: { type: Type.BOOLEAN },
      next_phase_reason: { type: Type.STRING },
      overall_impression: { type: Type.STRING },
      completed_substeps: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ["phase_completion", "quality_scores", "immediate_feedback", "next_phase_ready"]
  };

  try {
    const contentParts: any[] = [];
    const isSystemDesign = snapshot.roundType === 'System Design';
    const isDSA = snapshot.roundType === 'Data Structures & Algorithms';

    // Add text prompt
    const promptText = `
    You are an expert Interview Assessor for a ${snapshot.roundType} interview.
    
    Current Phase: ${snapshot.phase}
    Time Spent: ${Math.floor(snapshot.timeSpent)} seconds
    
    Recent Transcript:
    ${snapshot.chatHistory.slice(-8).map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n')}
    
    Code Context: ${snapshot.codeContent ? snapshot.codeContent.slice(0, 500) : "No code"}
    
    GUIDELINES AND RUBRIC TO FOLLOW:
    ${snapshot.rubric}
    
    ADDITIONAL PHASE RULES:
    ${isSystemDesign ? `
    1. Problem Framing: If time < 300s (5m) and candidate tries to switch, FLAG "Slow down! You skipped Business Objective".
    2. Problem Framing: If candidate hasn't asked clarifying questions, PENALIZE quality score.
    3. Modeling: If candidate proposes model without discussing Training Data first, FLAG RED "Discuss Training Data before Modeling".
    4. Evaluation: Look for offline metrics (Precision/Recall) vs online (CTR). If present, FLAG GREEN "Good metric choice".
    ` : ''}

    ${isDSA ? `
    1. Problem Understanding: Must ask clarification questions.
    2. Implementation: Check for clean code.
    3. Verification: FORCE candidate to verify solution (dry run/edge cases) before finishing. If they say "I'm done" without verifying, FLAG RED "Verify your solution with edge cases".
    4. Complexity: Explicitly check for Time/Space analysis.
    ` : ''}
    
    Assess the candidate's performance in the CURRENT PHASE.
    1. Have they completed the required sub-steps for this phase?
    2. Are there red flags (skipping steps, bad assumptions)?
    3. Are there green flags (good questions, clear structure)?
    4. Should they move to the next phase?
    
    Provide actionable immediate feedback (1-2 sentences) to guide them.
    `;
    
    contentParts.push({ text: promptText });

    // Add image if available
    if (snapshot.canvasImage) {
      contentParts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: snapshot.canvasImage
        }
      });
    }

    const response = await ai.models.generateContent({
      model: model,
      contents: [{ role: 'user', parts: contentParts }],
      config: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    return JSON.parse(response.text!) as AssessmentResult;
  } catch (error) {
    console.error("Assessment Error", error);
    return null;
  }
}

export const generateDetailedFeedback = async (
  transcript: { role: string, text: string }[],
  config: { roundType: string, company: string, role: string, question: string },
  rubric: string,
  model: string
): Promise<FeedbackReport | null> => {
  const ai = getAI();
  const isSystemDesign = config.roundType === 'System Design';
  const defaultRubric = isSystemDesign ? ML_SYSTEM_DESIGN_RUBRIC : DSA_RUBRIC;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      overallScore: { type: Type.NUMBER },
      summary: { type: Type.STRING },
      strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
      weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
      stages: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            stage: { type: Type.STRING },
            feedback: { type: Type.STRING },
            score: { type: Type.NUMBER }
          }
        }
      },
      detailedAssessment: { type: Type.STRING }
    },
    required: ["overallScore", "summary", "strengths", "weaknesses", "stages", "detailedAssessment"]
  };

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: `You are a Senior Bar Raiser at ${config.company}. You just conducted a ${config.roundType} interview for a ${config.role} candidate.
      
      Question: ${config.question}
      
      Transcript:
      ${transcript.map(t => `${t.role.toUpperCase()}: ${t.text}`).join('\n')}
      
      REFERENCE MATERIAL (GUIDELINES):
      ${rubric}

      BASE SCORING RUBRIC:
      ${defaultRubric}
      
      Generate a detailed feedback report. Ensure you evaluate if the candidate followed the specific guidelines for ${config.company} if present in the reference material.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });
    
    return JSON.parse(response.text!) as FeedbackReport;
  } catch (error) {
    console.error("Feedback Gen Error", error);
    return null;
  }
};
