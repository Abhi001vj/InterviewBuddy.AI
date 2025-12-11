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
    
    return JSON.parse(response.text!) as FeedbackReport;
  } catch (error) {
    console.error("Feedback Gen Error", error);
    return null;
  }
};