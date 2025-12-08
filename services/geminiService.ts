import { GoogleGenAI } from "@google/genai";
import { Job, StageAnalysis } from "../types";

const processEnvApiKey = process.env.API_KEY;

export const analyzeProductionData = async (
  jobs: Job[], 
  analysis: StageAnalysis[]
): Promise<string> => {
  if (!processEnvApiKey) {
    return "API Key not found. Cannot generate AI analysis.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey: processEnvApiKey });
    
    // Prepare a summarized text of the data
    const dataSummary = JSON.stringify({
      totalJobs: jobs.length,
      activeJobs: jobs.filter(j => !j.isCompleted).length,
      stageMetrics: analysis.map(a => ({
        stage: a.stage,
        avgDays: a.avgDays,
        maxDays: a.maxDays
      }))
    });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `
        You are a Factory Production Manager Expert. Analyze the following JSON data representing our production line performance.
        Data: ${dataSummary}

        Please provide:
        1. Identification of bottlenecks (stages with unusually high average days).
        2. Recommendations to improve efficiency.
        3. A brief summary of the overall health of the production line.
        
        Keep the response concise and formatted in Markdown.
      `,
    });

    return response.text || "No analysis could be generated.";
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return "Failed to generate analysis due to an error.";
  }
};
