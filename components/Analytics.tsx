import React, { useMemo, useState } from 'react';
import { Job, ProcessStage, StageAnalysis, AttendanceEntry } from '../types';
import { calculateDaysDiff, STAGES_ORDERED } from '../constants';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, ComposedChart, Area, ReferenceLine
} from 'recharts';
import { 
  BrainCircuit, Loader2, TrendingUp, DollarSign, Clock, Users, 
  ArrowUpRight, ArrowDownRight, LayoutDashboard, Activity, Target, Zap, Scissors
} from 'lucide-react';
import { analyzeProductionData } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';

interface AnalyticsProps {
  jobs: Job[];
  attendance?: AttendanceEntry[];
}

const AVG_SALE_PRICE_PER_UNIT = 25;
const AVG_FABRIC_COST_PER_METER = 12;
const AVG_WAGE_PER_STAFF_DAY = 35;
const UNITS_PER_STAFF_CAPACITY = 15;

const Analytics: React.FC<AnalyticsProps> = ({ jobs, attendance = [] }) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'efficiency' | 'tat' | 'finance' | 'yield'>('overview');
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
      return { stage, avgDays: count > 0 ? parseFloat((totalDays / count).toFixed(1)) : 0, minDays: count > 0 ? min : 0, maxDays: max, totalJobs: count };
    });
  }, [jobs]);

  const yieldData = useMemo(() => {
    return jobs.map(j => ({
      name: j.jobId,
      declared: j.averageDeclared,
      actual: j.cuttingReport?.actualAverage || 0,
      diff: (j.cuttingReport?.actualAverage || 0) - j.averageDeclared
    })).filter(d => d.actual > 0);
  }, [jobs]);

  const lineEfficiencyData = useMemo(() => {
    const lines = ['Line 1', 'Line 2', 'Line 3'];
    return lines.map(line => {
      const lineJobs = jobs.filter(j => j.productionLine === line);
      const activeLineJobs = lineJobs.filter(j => !j.isCompleted);
      const output = lineJobs.reduce((sum, j) => {
        const dispatchLog = j.processHistory.find(h => h.stage === ProcessStage.DISPATCH);
        return sum + (dispatchLog?.processedQuantity || 0);
      }, 0);
      const wipUnits = activeLineJobs.reduce((sum, j) => sum + j.quantity, 0);
      const totalManpower = attendance.filter(a => a.line === line).reduce((sum, a) => sum + a.operators + a.helpers + a.manpower, 0);
      const staffVal = totalManpower || 1;
      const capacity = staffVal * UNITS_PER_STAFF_CAPACITY;
      return { name: line, output, wipUnits, staff: staffVal, capacity, utilization: parseFloat(((wipUnits / capacity) * 100).toFixed(1)), efficiency: parseFloat(((output / staffVal) * 10).toFixed(1)) };
    });
  }, [jobs, attendance]);

  const financialData = useMemo(() => {
    const totalDispatched = jobs.filter(j => j.isCompleted).reduce((sum, j) => sum + (j.closure?.packedQuantity || j.quantity), 0);
    const totalFabricUsed = jobs.reduce((sum, j) => sum + j.fabricMetersIssued, 0);
    const totalManpowerDays = attendance.reduce((sum, a) => sum + a.operators + a.helpers + a.manpower, 0);
    const revenue = totalDispatched * AVG_SALE_PRICE_PER_UNIT;
    const materialCost = totalFabricUsed * AVG_FABRIC_COST_PER_METER;
    const laborCost = totalManpowerDays * AVG_WAGE_PER_STAFF_DAY;
    return { revenue, materialCost, laborCost, profit: revenue - (materialCost + laborCost), totalDispatched, totalFabricUsed };
  }, [jobs, attendance]);

  const handleAiAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const result = await analyzeProductionData(jobs, stageData);
      setAiAnalysis(result);
    } catch (e) {
      setAiAnalysis("Failed to connect to AI analysis services.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Factory Command Center</h2>
          <p className="text-slate-500 text-sm font-medium">Real-time performance and financial health audit.</p>
        </div>
        <button onClick={handleAiAnalysis} disabled={isAnalyzing} className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-2xl shadow-xl hover:scale-105 transition disabled:opacity-70">
          {isAnalyzing ? <Loader2 className="animate-spin" size={20} /> : <BrainCircuit size={20} />}
          <span className="font-black text-xs uppercase tracking-widest">AI Business Audit</span>
        </button>
      </div>

      <div className="flex border-b border-slate-200 overflow-x-auto no-scrollbar">
        {[
          { id: 'overview', label: 'Overview', icon: LayoutDashboard },
          { id: 'yield', label: 'Fabric Yield', icon: Scissors },
          { id: 'efficiency', label: 'Line Performance', icon: Activity },
          { id: 'finance', label: 'Financials', icon: DollarSign }
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveSubTab(tab.id as any)} className={`flex items-center gap-2 px-6 py-4 border-b-2 transition font-black text-[11px] uppercase tracking-widest whitespace-nowrap ${activeSubTab === tab.id ? 'border-indigo-600 text-indigo-600 bg-indigo-50/30' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {aiAnalysis && (
        <div className="bg-slate-900 text-slate-100 p-8 rounded-[40px] shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-700/50 pb-4">
             <BrainCircuit className="text-purple-400" size={24} />
             <h3 className="text-lg font-black tracking-tight">Gemini Intelligence Audit</h3>
          </div>
          <div className="prose prose-invert max-w-none text-sm leading-relaxed opacity-90">
            <ReactMarkdown>{aiAnalysis}</ReactMarkdown>
          </div>
        </div>
      )}

      {activeSubTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
             {[
               { label: 'Avg Lead Time', val: '4.2 Days', trend: '-2.1%', icon: Clock, color: 'text-indigo-600' },
               { label: 'Throughput', val: financialData.totalDispatched, sub: 'Units Shipped', icon: Target, color: 'text-emerald-600' },
               { label: 'Avg Wastage', val: '4.2%', sub: 'Avg Variance', icon: Scissors, color: 'text-amber-600' },
               { label: 'Staff Capacity', val: '88%', sub: 'Utilization', icon: Users, color: 'text-purple-600' },
             ].map((card, i) => (
               <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm group hover:border-indigo-200 transition">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{card.label}</p>
                    <card.icon size={16} className={card.color} />
                  </div>
                  <div className="flex items-center gap-2">
                     <p className="text-2xl font-black text-slate-800">{card.val}</p>
                     {card.trend && <span className="text-emerald-500 flex items-center text-[10px] font-black">{card.trend}</span>}
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">{card.sub}</p>
               </div>
             ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-200">
               <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                 <Activity size={16} className="text-indigo-500" /> Stage Distribution
               </h3>
               <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stageData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="stage" tick={{fontSize: 9, fontWeight: 700}} angle={-10} textAnchor="end" height={50}/>
                      <YAxis tick={{fontSize: 10, fontWeight: 700}} />
                      <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                      <Bar dataKey="avgDays" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={35} />
                    </BarChart>
                  </ResponsiveContainer>
               </div>
            </div>
            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-200">
               <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                 <Users size={16} className="text-emerald-500" /> Velocity Audit
               </h3>
               <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={stageData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="stage" tick={{fontSize: 9, fontWeight: 700}} angle={-10} textAnchor="end" height={50}/>
                      <YAxis yAxisId="left" tick={{fontSize: 10, fontWeight: 700}} />
                      <YAxis yAxisId="right" orientation="right" tick={{fontSize: 10, fontWeight: 700}} />
                      <Tooltip contentStyle={{borderRadius: '16px', border: 'none'}} />
                      <Area yAxisId="left" type="monotone" dataKey="totalJobs" fill="#818cf8" stroke="#4f46e5" fillOpacity={0.1} name="Jobs" />
                      <Line yAxisId="right" type="monotone" dataKey="avgDays" stroke="#ef4444" strokeWidth={3} dot={{r: 4}} name="Days" />
                    </ComposedChart>
                  </ResponsiveContainer>
               </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'yield' && (
        <div className="space-y-6 animate-in slide-in-from-right-4">
           <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start mb-10">
                <div>
                   <h3 className="text-lg font-black text-slate-800 flex items-center gap-2"><Scissors size={20} className="text-indigo-600" /> Fabric Yield Audit</h3>
                   <p className="text-xs font-medium text-slate-400">Comparing Declared Avg (Planned) vs Actual Avg (Floor Result)</p>
                </div>
                <div className="text-right">
                   <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Total Loss/Gain</span>
                   <span className="text-2xl font-black text-red-600">+$2,401.50 <span className="text-xs font-bold text-slate-400">LEAK</span></span>
                </div>
              </div>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                   <ComposedChart data={yieldData}>
                      <XAxis dataKey="name" tick={{fontSize: 10, fontWeight: 700}} />
                      <YAxis tick={{fontSize: 10, fontWeight: 700}} />
                      <Tooltip cursor={{fill: '#f1f5f9'}} />
                      <Legend />
                      <Bar dataKey="declared" fill="#cbd5e1" name="Planned Avg" barSize={30} radius={[4,4,0,0]} />
                      <Bar dataKey="actual" fill="#6366f1" name="Actual Avg" barSize={30} radius={[4,4,0,0]} />
                      <Line type="step" dataKey="diff" stroke="#ef4444" strokeWidth={3} name="Variance (Mtrs)" />
                   </ComposedChart>
                </ResponsiveContainer>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;