
import React, { useMemo, useState } from 'react';
import { Job, ProcessStage, StageAnalysis, AttendanceEntry } from '../types';
import { calculateDaysDiff, STAGES_ORDERED } from '../constants';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, ComposedChart, Area, ReferenceLine
} from 'recharts';
import { 
  BrainCircuit, Loader2, TrendingUp, DollarSign, Clock, Users, 
  ArrowUpRight, ArrowDownRight, LayoutDashboard, Activity, Target, Zap
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
const UNITS_PER_STAFF_CAPACITY = 15; // Estimated capacity: 1 staff can handle 15 units of WIP

const Analytics: React.FC<AnalyticsProps> = ({ jobs, attendance = [] }) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'efficiency' | 'tat' | 'finance'>('overview');
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
      const activeWipCount = activeLineJobs.length;
      
      const totalManpower = attendance
        .filter(a => a.line === line)
        .reduce((sum, a) => sum + a.operators + a.helpers + a.manpower, 0);

      const staffVal = totalManpower || 1;
      const capacity = staffVal * UNITS_PER_STAFF_CAPACITY;
      const utilization = parseFloat(((wipUnits / capacity) * 100).toFixed(1));

      return {
        name: line,
        output,
        wipCount: activeWipCount,
        wipUnits,
        staff: staffVal,
        capacity,
        utilization,
        efficiency: parseFloat(((output / staffVal) * 10).toFixed(1))
      };
    });
  }, [jobs, attendance]);

  const financialData = useMemo(() => {
    const totalDispatched = jobs.filter(j => j.isCompleted).reduce((sum, j) => {
      const lastLog = j.processHistory[j.processHistory.length - 1];
      return sum + (lastLog?.processedQuantity || j.quantity);
    }, 0);

    const totalFabricUsed = jobs.reduce((sum, j) => sum + j.fabricMetersIssued, 0);
    const totalManpowerDays = attendance.reduce((sum, a) => sum + a.operators + a.helpers + a.manpower, 0);

    const revenue = totalDispatched * AVG_SALE_PRICE_PER_UNIT;
    const materialCost = totalFabricUsed * AVG_FABRIC_COST_PER_METER;
    const laborCost = totalManpowerDays * AVG_WAGE_PER_STAFF_DAY;
    const profit = revenue - (materialCost + laborCost);

    return { revenue, materialCost, laborCost, profit, totalDispatched, totalFabricUsed };
  }, [jobs, attendance]);

  const tatData = useMemo(() => {
    const completed = jobs.filter(j => j.isCompleted);
    return completed.map(j => {
      const start = new Date(j.createdAt).getTime();
      const lastLog = j.processHistory.find(h => h.stage === ProcessStage.DISPATCH && h.completionDate);
      const end = lastLog ? new Date(lastLog.completionDate).getTime() : Date.now();
      return {
        id: j.jobId,
        days: Math.ceil((end - start) / (1000 * 60 * 60 * 24))
      };
    }).sort((a, b) => a.days - b.days);
  }, [jobs]);

  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444'];

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

  const avgTat = tatData.length > 0 ? (tatData.reduce((s, a) => s + a.days, 0) / tatData.length).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Factory Command Center</h2>
          <p className="text-slate-500 text-sm">Real-time performance and financial health audit.</p>
        </div>
        <button
          onClick={handleAiAnalysis}
          disabled={isAnalyzing}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-5 py-2.5 rounded-lg shadow-lg hover:shadow-xl transition disabled:opacity-70"
        >
          {isAnalyzing ? <Loader2 className="animate-spin" size={20} /> : <BrainCircuit size={20} />}
          <span>AI Business Audit</span>
        </button>
      </div>

      <div className="flex border-b border-slate-200 overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview', icon: LayoutDashboard },
          { id: 'efficiency', label: 'Line Performance', icon: Activity },
          { id: 'tat', label: 'Turnaround Time', icon: Clock },
          { id: 'finance', label: 'Financials', icon: DollarSign }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 transition font-medium text-sm whitespace-nowrap ${
              activeSubTab === tab.id 
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' 
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {aiAnalysis && (
        <div className="bg-slate-900 text-slate-100 p-6 rounded-xl shadow-xl border border-slate-700 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-3 mb-4 border-b border-slate-700 pb-3">
             <BrainCircuit className="text-purple-400" />
             <h3 className="text-lg font-semibold">Gemini Intelligence</h3>
          </div>
          <div className="prose prose-invert max-w-none text-sm leading-relaxed">
            <ReactMarkdown>{aiAnalysis}</ReactMarkdown>
          </div>
        </div>
      )}

      {activeSubTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
             <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Avg Lead Time</p>
                <div className="flex items-center gap-2">
                   <p className="text-2xl font-bold text-slate-800">{avgTat} Days</p>
                   <span className="text-emerald-500 flex items-center text-[10px] font-bold"><ArrowDownRight size={12}/> 2.1%</span>
                </div>
             </div>
             <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Total Throughput</p>
                <div className="flex items-center gap-2">
                   <p className="text-2xl font-bold text-slate-800">{financialData.totalDispatched}</p>
                   <span className="text-slate-500 text-[10px]">Units Shipped</span>
                </div>
             </div>
             <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Wastage Alert</p>
                <div className="flex items-center gap-2">
                   <p className="text-2xl font-bold text-amber-600">4.2%</p>
                   <span className="text-amber-500 text-[10px] font-bold">Warping</span>
                </div>
             </div>
             <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Capacity</p>
                <div className="flex items-center gap-2">
                   <p className="text-2xl font-bold text-indigo-600">88%</p>
                   <span className="text-indigo-500 text-[10px] font-bold">Optimal</span>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
               <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                 <Activity size={16} className="text-indigo-500" />
                 Stage Distribution (Avg Days)
               </h3>
               <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stageData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="stage" tick={{fontSize: 9}} angle={-10} textAnchor="end" height={50}/>
                      <YAxis tick={{fontSize: 10}} />
                      <Tooltip />
                      <Bar dataKey="avgDays" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
               </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
               <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                 <Users size={16} className="text-emerald-500" />
                 Workload vs Velocity
               </h3>
               <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={stageData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="stage" tick={{fontSize: 9}} angle={-10} textAnchor="end" height={50}/>
                      <YAxis yAxisId="left" tick={{fontSize: 10}} />
                      <YAxis yAxisId="right" orientation="right" tick={{fontSize: 10}} />
                      <Tooltip />
                      <Area yAxisId="left" type="monotone" dataKey="totalJobs" fill="#818cf8" stroke="#4f46e5" name="Jobs" />
                      <Line yAxisId="right" type="monotone" dataKey="avgDays" stroke="#ef4444" strokeWidth={2} name="Days" />
                    </ComposedChart>
                  </ResponsiveContainer>
               </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'efficiency' && (
        <div className="space-y-6 animate-in slide-in-from-right-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Target size={18} className="text-red-500" />
                Line Output & Efficiency Score
              </h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={lineEfficiencyData} margin={{left: -20}}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="output" barSize={40} fill="#4f46e5" name="Units Shipped" />
                    <Line type="monotone" dataKey="efficiency" stroke="#f59e0b" strokeWidth={3} name="Efficiency Score" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Zap size={18} className="text-amber-500" />
                Capacity Utilization (%)
              </h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={lineEfficiencyData} margin={{left: -20}}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(value: number) => [`${value}%`, 'Utilization']} />
                    <Bar dataKey="utilization" barSize={50} radius={[4, 4, 0, 0]}>
                      {lineEfficiencyData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.utilization > 90 ? '#ef4444' : entry.utilization > 70 ? '#f59e0b' : '#10b981'} 
                        />
                      ))}
                    </Bar>
                    <ReferenceLine y={80} label={{ position: 'top', value: 'Optimal Threshold (80%)', fontSize: 10, fill: '#64748b' }} stroke="#64748b" strokeDasharray="3 3" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {lineEfficiencyData.map(line => (
                <div key={line.name} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                   <div className="flex justify-between items-center mb-3">
                      <span className="font-bold text-slate-800">{line.name}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${line.utilization > 90 ? 'bg-red-100 text-red-700' : line.utilization > 70 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {line.utilization > 90 ? 'OVER CAPACITY' : line.utilization > 70 ? 'OPTIMAL' : 'UNDER CAPACITY'}
                      </span>
                   </div>
                   <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Active WIP Units:</span>
                        <span className="font-semibold">{line.wipUnits}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Est. Daily Capacity:</span>
                        <span className="font-semibold">{line.capacity} units</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Total Manpower:</span>
                        <span className="font-semibold">{line.staff} staff</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 ${line.utilization > 90 ? 'bg-red-500' : line.utilization > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                          style={{ width: `${Math.min(100, line.utilization)}%` }}
                        ></div>
                      </div>
                      <p className="text-[10px] text-right text-slate-400 font-bold">{line.utilization}% Utilized</p>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {activeSubTab === 'tat' && (
        <div className="space-y-6 animate-in slide-in-from-right-4">
           <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Clock size={18} className="text-indigo-500" />
                Cycle Time Variance (Order to Dispatch)
              </h3>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={tatData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="id" tick={{fontSize: 10}} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="days" fill="#6366f1" radius={[4, 4, 0, 0]}>
                         {tatData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.days > 10 ? '#ef4444' : entry.days > 5 ? '#f59e0b' : '#10b981'} />
                         ))}
                      </Bar>
                   </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 flex flex-wrap gap-4 justify-center text-[10px] font-bold uppercase tracking-wider text-slate-500">
                 <div className="flex items-center gap-2"><div className="w-3 h-3 bg-emerald-500 rounded"></div> Fast (&lt; 5 days)</div>
                 <div className="flex items-center gap-2"><div className="w-3 h-3 bg-amber-500 rounded"></div> Avg (5-10 days)</div>
                 <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-500 rounded"></div> Critical (&gt; 10 days)</div>
              </div>
           </div>
        </div>
      )}

      {activeSubTab === 'finance' && (
        <div className="space-y-6 animate-in slide-in-from-right-4">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-indigo-600 p-6 rounded-2xl text-white shadow-lg">
                 <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest mb-1">Gross Revenue</p>
                 <div className="flex justify-between items-end">
                    <p className="text-3xl font-bold">${financialData.revenue.toLocaleString()}</p>
                    <ArrowUpRight className="text-indigo-300" />
                 </div>
                 <p className="text-[10px] text-indigo-200 mt-2">Est. @ ${AVG_SALE_PRICE_PER_UNIT}/unit</p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                 <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Operating Overheads</p>
                 <div className="flex justify-between items-end">
                    <p className="text-3xl font-bold text-slate-800">${(financialData.materialCost + financialData.laborCost).toLocaleString()}</p>
                    <TrendingUp className="text-slate-400" />
                 </div>
                 <div className="flex gap-4 mt-2">
                    <div className="text-[10px] text-slate-400 font-bold">Materials: ${financialData.materialCost.toLocaleString()}</div>
                    <div className="text-[10px] text-slate-400 font-bold">Labor: ${financialData.laborCost.toLocaleString()}</div>
                 </div>
              </div>

              <div className="bg-emerald-600 p-6 rounded-2xl text-white shadow-lg">
                 <p className="text-emerald-100 text-xs font-bold uppercase tracking-widest mb-1">Projected Gross Profit</p>
                 <div className="flex justify-between items-end">
                    <p className="text-3xl font-bold">${financialData.profit.toLocaleString()}</p>
                    <DollarSign className="text-emerald-300" />
                 </div>
                 <p className="text-[10px] text-emerald-100 mt-2">Margin: {financialData.revenue > 0 ? ((financialData.profit / financialData.revenue) * 100).toFixed(1) : 0}%</p>
              </div>
           </div>

           <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center">
              <h3 className="font-bold text-slate-800 mb-8 self-start">Cost Distribution Analysis</h3>
              <div className="h-[300px] w-full max-w-md">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                       <Pie
                          data={[
                            { name: 'Labor', value: financialData.laborCost },
                            { name: 'Material', value: financialData.materialCost },
                            { name: 'Profit', value: Math.max(0, financialData.profit) }
                          ]}
                          innerRadius={70}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                       >
                          {COLORS.map((color, index) => <Cell key={`cell-${index}`} fill={color} />)}
                       </Pie>
                       <Tooltip />
                       <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                 </ResponsiveContainer>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
