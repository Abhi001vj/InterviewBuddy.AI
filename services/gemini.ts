
import { GoogleGenAI, Schema, Type } from "@google/genai";
import { TestCase, TestResult, DSAChallenge, ProgrammingLanguage, FeedbackReport, AssessmentResult } from "../types";

const getAI = () => {
  if (!process.env.API_KEY) {
    throw new Error("API Key missing");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// Helper to interpolate variables into prompts
const interpolate = (template: string, variables: Record<string, any>) => {
  return template.replace(/{(\w+)}/g, (_, key) => variables[key] || `{${key}}`);
};

// Helper to sanitize JSON strings (remove markdown code blocks)
const cleanJson = (text: string): string => {
  if (!text) return "{}";
  // Remove ```json and ``` wrap
  const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (match) return match[1];
  return text;
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

export const generateSolutionTemplate = async (
  question: string,
  language: string,
  model: string
): Promise<string> => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: `Generate the starter code (boilerplate) for the following coding problem in ${language}.
      
      Problem: "${question}"
      
      Requirements:
      1. Include the class structure (e.g., class Solution).
      2. Include the correct method signature for this specific problem.
      3. DO NOT include the problem description or instructions in comments. Keep it clean.
      4. DO NOT implement the solution. Just write 'pass' or return a dummy value.
      
      Output ONLY the code.`,
    });
    return response.text?.replace(/```\w*\n/g, '').replace(/```/g, '') || '';
  } catch (error) {
    console.error("Template Gen Error", error);
    return `// Error generating template for ${language}`;
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
      starterCode: { type: Type.STRING, description: `Clean starter code in ${language}. Class and method signature only.` },
      testCases: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            input: { type: Type.STRING, description: "Raw input values (e.g., '[1,2,3], 5')" },
            output: { type: Type.STRING, description: "Expected output value (e.g., '[0, 2]')" }
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
      2. The starter code MUST ONLY contain the class and method definition. 
      3. DO NOT include the problem description, constraints, or examples in the comments. The user has a separate panel for that.
      4. DO NOT implement the logic. The body should be empty, 'pass', or return null.
      5. Provide 3 distinct test cases. 
      IMPORTANT: For test case inputs, provide ONLY the raw values as they would be passed to the function, do not include variable names like 'nums ='.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    const text = cleanJson(response.text || "{}");
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
): Promise<{ passed: boolean, results: TestResult[] }> => {
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
      }
    }
  };

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: `Act as a ${language} code execution engine. Execute the following code against the provided test cases.
      
      Problem: ${question}
      
      User Code (${language}):
      ${code}
      
      Test Cases:
      ${JSON.stringify(testCases)}
      
      1. Mentally execute the code for each test case.
      2. Return the strict output for each case. 
      3. DO NOT provide qualitative feedback here. Just the execution results.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    const text = cleanJson(response.text || "{}");
    return JSON.parse(text);
  } catch (error) {
    console.error("Code Analysis Error", error);
    return {
      passed: false,
      results: []
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
    promptTemplate?: string;
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
        nullable: true,
        properties: {
          // System Design Dimensions
          depth: { type: Type.NUMBER, nullable: true },
          clarity: { type: Type.NUMBER, nullable: true },
          technical: { type: Type.NUMBER, nullable: true },
          practical: { type: Type.NUMBER, nullable: true },
          // DSA Dimensions
          problem_solving: { type: Type.NUMBER, nullable: true },
          coding: { type: Type.NUMBER, nullable: true },
          verification: { type: Type.NUMBER, nullable: true },
          communication: { type: Type.NUMBER, nullable: true }
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
    required: ["phase_completion", "immediate_feedback", "next_phase_ready"]
  };

  try {
    const contentParts: any[] = [];
    
    // Construct Prompt
    let prompt = snapshot.promptTemplate || `You are an expert Interview Assessor for a ${snapshot.roundType} interview.`;
    
    // Interpolate basics if template provided, else use default logic
    if (snapshot.promptTemplate) {
        prompt = interpolate(snapshot.promptTemplate, {
            interview_type: snapshot.roundType,
            current_phase: snapshot.phase,
            time_spent: snapshot.timeSpent,
            completed_phases: snapshot.completedPhases.join(', '),
            chat_history: snapshot.chatHistory.slice(-5).map(m => `${m.role}: ${m.text}`).join('\n'),
            work_state: snapshot.codeContent || "Canvas Image provided",
            guidelines: snapshot.rubric,
            required_substeps: "See rubric",
            expected_duration: "See rubric"
        });
    } else {
        // Fallback prompt (similar to before)
        prompt += `
        Current Phase: ${snapshot.phase}
        Time Spent: ${Math.floor(snapshot.timeSpent)} seconds
        
        Recent Transcript:
        ${snapshot.chatHistory.slice(-8).map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n')}
        
        GUIDELINES AND RUBRIC TO FOLLOW:
        ${snapshot.rubric}
        
        Assess the candidate's performance in the CURRENT PHASE.
        1. Have they completed the required sub-steps for this phase?
        2. Are there red flags?
        3. Are there green flags?
        4. Should they move to the next phase?
        
        Provide actionable immediate feedback (1-2 sentences).
        `;
    }
    
    contentParts.push({ text: prompt });

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

    const text = cleanJson(response.text || "{}");
    return JSON.parse(text) as AssessmentResult;
  } catch (error) {
    console.error("Assessment Error", error);
    return null;
  }
}

export const generateDetailedFeedback = async (
  transcript: { role: string, text: string }[],
  config: { roundType: string, company: string, role: string, question: string },
  rubric: string,
  model: string,
  reportTemplate?: string
): Promise<FeedbackReport | null> => {
  const ai = getAI();

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
    let prompt = reportTemplate ? interpolate(reportTemplate, {
        target_level: "Candidate",
        role: config.role,
        interview_type: config.roundType,
        duration: "45",
        performance_summary: "See transcript",
        full_chat_history: transcript.map(t => `${t.role.toUpperCase()}: ${t.text}`).join('\n'),
        all_work_samples: "See context",
        all_scores: "See context",
        guidelines: rubric,
        rubric: rubric
    }) : `You are a Senior Bar Raiser at ${config.company}. You just conducted a ${config.roundType} interview.
      
      Question: ${config.question}
      
      Transcript:
      ${transcript.map(t => `${t.role.toUpperCase()}: ${t.text}`).join('\n')}
      
      REFERENCE MATERIAL:
      ${rubric}
      
      Generate a detailed feedback report.`;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });
    
    const text = cleanJson(response.text || "{}");
    return JSON.parse(text) as FeedbackReport;
  } catch (error) {
    console.error("Feedback Gen Error", error);
    return null;
  }
};
