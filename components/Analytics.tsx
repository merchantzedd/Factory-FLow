import React, { useMemo, useState } from 'react';
import { Job, ProcessStage, StageAnalysis } from '../types';
import { calculateDaysDiff, STAGES_ORDERED } from '../constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { BrainCircuit, Loader2 } from 'lucide-react';
import { analyzeProductionData } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';

interface AnalyticsProps {
  jobs: Job[];
}

const Analytics: React.FC<AnalyticsProps> = ({ jobs }) => {
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const stageData: StageAnalysis[] = useMemo(() => {
    return STAGES_ORDERED.map(stage => {
      let totalDays = 0;
      let count = 0;
      let min = 999;
      let max = 0;

      jobs.forEach(job => {
        const history = job.processHistory.find(h => h.stage === stage);
        if (history && history.completionDate) {
          const days = calculateDaysDiff(history.entryDate, history.completionDate);
          totalDays += days;
          count++;
          if (days < min) min = days;
          if (days > max) max = days;
        }
      });

      return {
        stage,
        avgDays: count > 0 ? parseFloat((totalDays / count).toFixed(1)) : 0,
        minDays: count > 0 ? min : 0,
        maxDays: max,
        totalJobs: count
      };
    });
  }, [jobs]);

  const handleAiAnalysis = async () => {
    setIsAnalyzing(true);
    const result = await analyzeProductionData(jobs, stageData);
    setAiAnalysis(result);
    setIsAnalyzing(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Process Efficiency Analysis</h2>
        <button
          onClick={handleAiAnalysis}
          disabled={isAnalyzing}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-5 py-2.5 rounded-lg shadow-lg hover:shadow-xl transition disabled:opacity-70"
        >
          {isAnalyzing ? <Loader2 className="animate-spin" size={20} /> : <BrainCircuit size={20} />}
          <span>Generate AI Insight</span>
        </button>
      </div>

      {aiAnalysis && (
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-slate-100 p-6 rounded-xl shadow-xl border border-slate-700 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-3 mb-4 border-b border-slate-600 pb-3">
             <BrainCircuit className="text-purple-400" />
             <h3 className="text-lg font-semibold">Gemini Production Insight</h3>
          </div>
          <div className="prose prose-invert max-w-none text-sm leading-relaxed">
            <ReactMarkdown>{aiAnalysis}</ReactMarkdown>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
          <h3 className="text-lg font-semibold mb-6 text-slate-700">Average Days per Stage</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stageData} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="stage" type="category" width={100} tick={{fontSize: 10}} />
                <Tooltip />
                <Bar dataKey="avgDays" fill="#4f46e5" radius={[0, 4, 4, 0]} name="Avg Days" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
           <h3 className="text-lg font-semibold mb-6 text-slate-700">Volume vs. Bottlenecks</h3>
           <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="stage" tick={{fontSize: 10}} interval={0} angle={-15} textAnchor="end" height={60} />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="avgDays" stroke="#ef4444" strokeWidth={2} name="Avg Latency (Days)" />
                <Line yAxisId="right" type="monotone" dataKey="totalJobs" stroke="#10b981" strokeWidth={2} name="Completed Jobs" />
              </LineChart>
            </ResponsiveContainer>
           </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
            <tr>
              <th className="p-4">Process Stage</th>
              <th className="p-4 text-center">Avg Days</th>
              <th className="p-4 text-center">Min Days</th>
              <th className="p-4 text-center">Max Days</th>
              <th className="p-4 text-center">Throughput (Jobs)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {stageData.map((d) => (
              <tr key={d.stage} className="hover:bg-slate-50">
                <td className="p-4 font-medium text-slate-800">{d.stage}</td>
                <td className="p-4 text-center font-bold text-indigo-600">{d.avgDays}</td>
                <td className="p-4 text-center text-slate-500">{d.minDays}</td>
                <td className="p-4 text-center text-slate-500">{d.maxDays}</td>
                <td className="p-4 text-center text-slate-700">{d.totalJobs}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Analytics;
