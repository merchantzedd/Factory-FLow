import { GoogleGenAI } from "@google/genai";
import { Job, StageAnalysis } from "../types";

export const analyzeProductionData = async (
  jobs: Job[], 
  analysis: StageAnalysis[]
): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return "API Key not found. Please ensure it is configured.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    const dataSummary = {
      totalJobs: jobs.length,
      activeJobs: jobs.filter(j => !j.isCompleted).length,
      stageMetrics: analysis.map(a => ({
        stage: a.stage,
        avgDays: a.avgDays,
        maxDays: a.maxDays
      }))
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{
        parts: [{
          text: `You are a Factory Production Manager Expert. Analyze the following factory performance data and provide a concise business audit.
          
          Data: ${JSON.stringify(dataSummary)}

          Please provide:
          1. Bottleneck Analysis: Identify specific stages slowing down production.
          2. Efficiency Wins: 3 actionable recommendations to improve unit output.
          3. Profitability Health: A brief assessment of operational health.
          
          Format the output in clean Markdown.`
        }]
      }]
    });

    return response.text || "No analysis could be generated.";
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return "An error occurred while generating the AI analysis.";
  }
};