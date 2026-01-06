import { GoogleGenAI, Type } from "@google/genai";
import { Job, StageAnalysis, PurchaseOrder, AttendanceEntry, ProductionPlan } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateProductionPlan = async (
  pendingOrders: PurchaseOrder[],
  activeJobs: Job[],
  attendance: AttendanceEntry[]
): Promise<ProductionPlan> => {
  const model = 'gemini-3-flash-preview';
  
  const context = {
    date: new Date().toISOString().split('T')[0],
    orders: pendingOrders.map(o => ({ no: o.poNumber, qty: o.totalQuantity, due: o.deadline, style: o.styleName })),
    wip: activeJobs.map(j => ({ id: j.jobId, stage: j.currentStage, qty: j.quantity, line: j.productionLine })),
    capacity: attendance.filter(a => a.date === new Date().toISOString().split('T')[0])
  };

  const prompt = `You are a Factory Production Optimizer. Based on the following data, generate a Daily Production Plan for today.
  Data: ${JSON.stringify(context)}
  
  Assign pending orders to lines based on current line load and manpower. 
  Focus on minimizing bottlenecks and meeting the closest deadlines.
  Provide a JSON response.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            assignments: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  line: { type: Type.STRING },
                  jobId: { type: Type.STRING },
                  targetQty: { type: Type.NUMBER },
                  priority: { type: Type.STRING },
                  reasoning: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    return {
      id: Date.now().toString(),
      date: context.date,
      ...result
    };
  } catch (error) {
    console.error("Planning Error:", error);
    throw error;
  }
};

export const analyzeProductionData = async (
  jobs: Job[], 
  analysis: StageAnalysis[]
): Promise<string> => {
  try {
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
      contents: `Perform a Business Intelligence Audit for this factory data: ${JSON.stringify(dataSummary)}. 
      Highlight risks, efficiency gaps, and ROI improvements. Use professional Markdown.`
    });

    return response.text || "No analysis could be generated.";
  } catch (error) {
    console.error("Analysis Error:", error);
    return "Error generating AI insights.";
  }
};