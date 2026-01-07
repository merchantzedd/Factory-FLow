
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

  const prompt = `You are a Factory Production Optimizer for FIX STITCHES DRP. Generate a Daily Production Plan.
  Strategy: Balance line load based on current TAT (Turnaround Time) and manpower availability. Prioritize high-value export orders.
  Data: ${JSON.stringify(context)}
  Return JSON only.`;

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

export const generateExecutiveReport = async (data: any): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a professional Executive Factory Report for FIX STITCHES based on this data: ${JSON.stringify(data)}. 
      Crucial Requirements:
      1. Use Indian Rupee (₹) for all financial figures.
      2. Sections: Production Velocity (TAT Analysis), Fabric Asset Utilization (Meters & ₹ Leakage), Manpower Overhead (Helper Costs & Absenteeism Impact). 
      3. Use formal Markdown and professional corporate tone.`
    });
    return response.text || "Report generation failed.";
  } catch (error) {
    return "AI Service Error.";
  }
};

export const analyzeProductionData = async (
  jobs: Job[], 
  analysis: StageAnalysis[]
): Promise<string> => {
  try {
    const dataSummary = {
      factory: "FIX STITCHES",
      currency: "INR (₹)",
      totalJobs: jobs.length,
      activeJobs: jobs.filter(j => !j.isCompleted).length,
      stageMetrics: analysis.map(a => ({
        stage: a.stage,
        avgDays: a.avgDays,
        maxDays: a.maxDays
      })),
      kpis: ["Turnaround Time (TAT)", "Helper Cost Overhead", "Absenteeism Rate", "Fabric Variance Leakage"]
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Perform a deep Business Intelligence Audit for this factory data: ${JSON.stringify(dataSummary)}. 
      Focus on reducing TAT, managing helper-to-operator cost ratios in ₹, and identifying specific lines where absenteeism is killing ROI. Use professional Markdown.`
    });

    return response.text || "No analysis could be generated.";
  } catch (error) {
    console.error("Analysis Error:", error);
    return "Error generating AI insights.";
  }
};
