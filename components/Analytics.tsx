import React, { useMemo, useState } from 'react';
import { Job, ProcessStage, StageAnalysis, AttendanceEntry, FabricBatch } from '../types';
import { calculateDaysDiff, STAGES_ORDERED } from '../constants';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, ComposedChart, Area, ReferenceLine, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { 
  BrainCircuit, Loader2, TrendingUp, IndianRupee, Clock, Users, 
  ArrowUpRight, ArrowDownRight, LayoutDashboard, Activity, Target, Zap, Scissors,
  Wallet, PieChart as PieChartIcon, TrendingDown, AlertCircle, BarChart3, Gauge,
  Package, Ruler, Layers
} from 'lucide-react';
import { analyzeProductionData } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';

interface AnalyticsProps {
  jobs: Job[];
  fabrics?: FabricBatch[];
  attendance?: AttendanceEntry[];
}

const AVG_FABRIC_COST_PER_METER = 350;
const AVG_WAGE_PER_STAFF_DAY = 750;
const STANDARD_LINE_CAPACITY = 30;

// Re-using Stage Themes for Chart Consistency
const STAGE_COLORS: Record<string, string> = {
  [ProcessStage.CUTTING]: '#6366f1',
  [ProcessStage.FUSING]: '#a855f7',
  [ProcessStage.SEWING]: '#f59e0b',
  [ProcessStage.BUTTON_HOLING]: '#ea580c',
  [ProcessStage.FINISHING]: '#3b82f6',
  [ProcessStage.IRONING]: '#06b6d4',
  [ProcessStage.PACKING]: '#475569',
  [ProcessStage.QC]: '#10b981',
  [ProcessStage.QC_REJECTED]: '#ef4444',
  [ProcessStage.DISPATCH]: '#1e293b',
};

const Analytics: React.FC<AnalyticsProps> = ({ jobs, fabrics = [], attendance = [] }) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'lines' | 'tat' | 'finance' | 'fabric'>('overview');
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const stageData = useMemo(() => {
    return STAGES_ORDERED.map(stage => {
      let totalDays = 0, count = 0, min = 999, max = 0;
      jobs.forEach(job => {
        const history = job.processHistory.find(h => h.stage === stage);
        if (history && history.completionDate) {
          const days = calculateDaysDiff(history.entryDate, history.completionDate);
          totalDays += days; count++;
          if (days < min) min = days;
          if (days > max) max = days;
        }
      });
      return { stage, avgDays: count > 0 ? parseFloat((totalDays / count).toFixed(1)) : 0, minDays: count > 0 ? min : 0, maxDays: max, totalJobs: count };
    });
  }, [jobs]);

  const lineMetrics = useMemo(() => {
    const lines = ['Line 1', 'Line 2', 'Line 3'];
    return lines.map(lineName => {
      const lineJobs = jobs.filter(j => j.productionLine === lineName);
      const lineAttendance = attendance.filter(a => a.line === lineName);
      const totalUnits = lineJobs.reduce((sum, j) => sum + j.quantity, 0);
      const outputUnits = lineJobs.filter(j => j.isCompleted).reduce((sum, j) => sum + (j.closure?.packedQuantity || 0), 0);
      const totalHelpers = lineAttendance.reduce((sum, a) => sum + a.helpers, 0);
      const helperCost = totalHelpers * AVG_WAGE_PER_STAFF_DAY;
      const totalStaff = lineAttendance.reduce((sum, a) => sum + a.operators + a.helpers + a.manpower, 0);
      const absenteeism = Math.max(0, ((STANDARD_LINE_CAPACITY - (totalStaff / (lineAttendance.length || 1))) / STANDARD_LINE_CAPACITY) * 100);
      return { name: lineName, efficiency: outputUnits > 0 ? Math.round((outputUnits / totalUnits) * 100) : 0, helperCost, absenteeism: Math.round(absenteeism) };
    });
  }, [jobs, attendance]);

  // CALCULATE WIP HEATMAP DATA
  const wipMapData = useMemo(() => {
    const activeJobs = jobs.filter(j => !j.isCompleted);
    return STAGES_ORDERED.map(stage => {
      const wip = activeJobs.reduce((sum, job) => {
        const status = job.stageStatus[stage];
        if (!status) return sum;
        return sum + (status.inward - status.output);
      }, 0);
      return { name: stage, value: wip };
    }).filter(d => d.value > 0);
  }, [jobs]);

  const fabricAuditData = useMemo(() => {
    return jobs.map(j => {
      const variance = j.fabricMetersIssued - (j.quantity * j.averageDeclared);
      return { jobId: j.jobId, style: j.styleName, variance: parseFloat(variance.toFixed(1)), costImpact: Math.round(variance * AVG_FABRIC_COST_PER_METER) };
    }).filter(d => d.jobId);
  }, [jobs]);

  const totalInventoryValue = useMemo(() => {
    return fabrics.reduce((sum, f) => sum + f.meters, 0) * AVG_FABRIC_COST_PER_METER;
  }, [fabrics]);

  const handleAiAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const result = await analyzeProductionData(jobs, stageData);
      setAiAnalysis(result);
    } catch (e) {
      setAiAnalysis("AI Brain currently offline. Please check network.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl lg:text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <LayoutDashboard className="text-indigo-600 dark:text-indigo-400" size={24} />
            Command Center
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-[11px] lg:text-sm font-medium">Live Floor KPI & Resource Analytics</p>
        </div>
        <button onClick={handleAiAnalysis} disabled={isAnalyzing} className="w-full md:w-auto flex items-center justify-center gap-2 bg-slate-900 dark:bg-indigo-600 text-white px-6 py-3 rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition disabled:opacity-70 group">
          {isAnalyzing ? <Loader2 className="animate-spin" size={18} /> : <BrainCircuit size={18} className="text-indigo-400 dark:text-indigo-100 group-hover:rotate-12 transition" />}
          <span className="font-black text-[10px] uppercase tracking-widest">Execute AI Audit</span>
        </button>
      </div>

      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar bg-white/50 dark:bg-slate-900/50 rounded-t-[32px] px-2">
        {[
          { id: 'overview', label: 'Summary', icon: LayoutDashboard },
          { id: 'lines', label: 'Lines', icon: Gauge },
          { id: 'tat', label: 'TAT', icon: Clock },
          { id: 'fabric', label: 'Audit', icon: Scissors },
          { id: 'finance', label: 'Value', icon: IndianRupee },
        ].map(tab => (
          <button 
            key={tab.id} 
            onClick={() => setActiveSubTab(tab.id as any)} 
            className={`flex items-center gap-2 px-6 py-5 border-b-4 transition-all font-black text-[10px] lg:text-[11px] uppercase tracking-widest whitespace-nowrap ${activeSubTab === tab.id ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-600 dark:text-slate-500'}`}
          >
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {aiAnalysis && (
        <div className="bg-slate-900 dark:bg-black text-slate-100 p-6 lg:p-8 rounded-[32px] lg:rounded-[40px] shadow-2xl border border-slate-700 dark:border-slate-800 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-3 mb-4 border-b border-slate-700/50 pb-4">
             <BrainCircuit className="text-indigo-400" size={20} />
             <h3 className="text-sm lg:text-lg font-black tracking-tight">Executive Insight Report</h3>
          </div>
          <div className="prose prose-invert prose-sm max-w-none opacity-90 leading-relaxed">
            <ReactMarkdown>{aiAnalysis}</ReactMarkdown>
          </div>
        </div>
      )}

      {activeSubTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
             {[
               { label: 'Absenteeism', val: `${Math.round(lineMetrics.reduce((s,l)=>s+l.absenteeism,0)/3)}%`, icon: Users, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30' },
               { label: 'Helper Cost', val: formatCurrency(lineMetrics.reduce((s,l)=>s+l.helperCost,0)), icon: Wallet, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-950/30' },
               { label: 'Mtr Leakage', val: formatCurrency(fabricAuditData.reduce((s,d)=>s+d.costImpact,0)), icon: Scissors, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950/30' },
               { label: 'Live WIP', val: wipMapData.reduce((s,d)=>s+d.value,0), icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
             ].map((card, i) => (
               <div key={i} className="bg-white dark:bg-slate-900 p-5 rounded-[28px] border border-slate-200 dark:border-slate-800 shadow-sm transition-all">
                  <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-2xl ${card.bg} ${card.color} flex items-center justify-center mb-3 lg:mb-4`}>
                     <card.icon size={18} />
                  </div>
                  <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{card.label}</p>
                  <p className="text-xl lg:text-2xl font-black text-slate-800 dark:text-slate-100">{card.val}</p>
               </div>
             ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* REAL-TIME WIP DISTRIBUTION PIE MAP */}
            <div className="bg-white dark:bg-slate-900 p-6 lg:p-8 rounded-[32px] lg:rounded-[40px] shadow-sm border border-slate-200 dark:border-slate-800">
               <div className="flex justify-between items-center mb-6">
                 <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                   <Layers size={16} className="text-indigo-500" /> Real-Time Floor WIP Distribution
                 </h3>
                 <div className="bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Heat Map</div>
               </div>
               <div className="h-[280px] lg:h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={wipMapData}
                        cx="50%" cy="50%"
                        innerRadius={50} outerRadius={80}
                        paddingAngle={4} dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                        fontSize={9}
                        fontWeight={900}
                      >
                        {wipMapData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={STAGE_COLORS[entry.name] || '#6366f1'} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{borderRadius: '16px', backgroundColor: '#0f172a', border: 'none', color: '#fff'}}
                        itemStyle={{fontSize: '10px', fontWeight: 900}}
                        cursor={{fill: 'transparent'}}
                      />
                    </PieChart>
                  </ResponsiveContainer>
               </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 lg:p-8 rounded-[32px] lg:rounded-[40px] shadow-sm border border-slate-200 dark:border-slate-800">
               <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-10 flex items-center gap-2">
                 <TrendingUp size={16} className="text-emerald-500" /> Production Efficiency per Line
               </h3>
               <div className="h-[280px] lg:h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={lineMetrics}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                      <XAxis dataKey="name" tick={{fontSize: 9, fontWeight: 900, fill: '#64748b'}} />
                      <YAxis tick={{fontSize: 9, fontWeight: 700, fill: '#64748b'}} />
                      <Tooltip 
                        contentStyle={{borderRadius: '16px', backgroundColor: '#1e293b', border: 'none', color: '#fff'}}
                        cursor={{fill: 'rgba(99, 102, 241, 0.1)'}}
                      />
                      <Bar dataKey="efficiency" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={35} name="Efficiency %" />
                    </BarChart>
                  </ResponsiveContainer>
               </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'finance' && (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-indigo-600 dark:bg-indigo-900 p-8 lg:p-10 rounded-[32px] lg:rounded-[40px] shadow-2xl text-white">
                 <h4 className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-2">Total Inventory Valuation</h4>
                 <p className="text-4xl lg:text-5xl font-black tracking-tighter">{formatCurrency(totalInventoryValue)}</p>
                 <div className="mt-8 flex items-center gap-4">
                    <div className="p-2 bg-white/20 rounded-xl"><Package size={20} /></div>
                    <span className="text-xs lg:text-sm font-bold opacity-80">Valued at Market ₹350/mtr</span>
                 </div>
              </div>
              <div className="bg-white dark:bg-slate-900 p-8 lg:p-10 rounded-[32px] lg:rounded-[40px] border border-slate-200 dark:border-slate-800 flex flex-col justify-center">
                 <div className="flex items-center gap-4 mb-6 lg:mb-8">
                    <div className="p-4 bg-rose-50 dark:bg-rose-950/30 text-rose-600 rounded-2xl"><Users size={28} /></div>
                    <div>
                       <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1">Total Labor Burn</h4>
                       <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{formatCurrency(lineMetrics.reduce((s,l)=>s+l.helperCost,0))}</p>
                    </div>
                 </div>
                 <p className="text-[11px] font-medium text-slate-400 italic">"Labor burn tracking helper-to-operator overhead ratios in real-time."</p>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;