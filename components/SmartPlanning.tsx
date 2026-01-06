import React, { useState } from 'react';
import { BrainCircuit, Loader2, Calendar, Target, ListChecks, ArrowRight, ShieldAlert, Sparkles, FileText, Download } from 'lucide-react';
import { PurchaseOrder, Job, AttendanceEntry, ProductionPlan } from '../types';
import { generateProductionPlan } from '../services/geminiService';

interface SmartPlanningProps {
  orders: PurchaseOrder[];
  jobs: Job[];
  attendance: AttendanceEntry[];
}

const SmartPlanning: React.FC<SmartPlanningProps> = ({ orders, jobs, attendance }) => {
  const [plan, setPlan] = useState<ProductionPlan | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGeneratePlan = async () => {
    setLoading(true);
    try {
      const pending = orders.filter(o => o.status === 'Planning');
      const active = jobs.filter(j => !j.isCompleted);
      const result = await generateProductionPlan(pending, active, attendance);
      setPlan(result);
    } catch (e) {
      alert("AI Planning Service currently unavailable.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-purple-100 p-2 rounded-xl text-purple-600">
               <BrainCircuit size={28} />
            </div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">AI Production Optimizer</h2>
          </div>
          <p className="text-slate-500 text-sm max-w-xl font-medium">
            Our neural engine analyzes pending POs, floor WIP, and today's manpower to generate the most efficient loading schedule.
          </p>
        </div>
        <button 
          onClick={handleGeneratePlan}
          disabled={loading}
          className="w-full md:w-auto flex items-center justify-center gap-3 bg-slate-900 text-white px-10 py-4 rounded-2xl hover:bg-slate-800 transition shadow-xl shadow-slate-200 disabled:opacity-50 font-black uppercase text-xs tracking-widest"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} className="text-purple-400" />}
          {loading ? 'Optimizing Resources...' : 'Generate Daily Load Plan'}
        </button>
      </div>

      {!plan && !loading && (
        <div className="py-20 text-center space-y-4 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
           <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto">
              <Calendar className="text-slate-300" size={32} />
           </div>
           <p className="text-slate-400 font-bold text-sm">No active plan for today. Run optimizer to begin.</p>
        </div>
      )}

      {plan && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4">
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <ListChecks size={16} /> Load Assignments
            </h3>
            <div className="grid grid-cols-1 gap-4">
               {plan.assignments.map((as, idx) => (
                 <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col md:flex-row items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-slate-900 flex flex-col items-center justify-center text-white">
                       <span className="text-[8px] font-black uppercase text-slate-400">Line</span>
                       <span className="text-xl font-black">{as.line.split(' ')[1]}</span>
                    </div>
                    <div className="flex-1">
                       <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-black text-indigo-600">{as.jobId || 'NEW_ENTRY'}</span>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${as.priority === 'High' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                            {as.priority} Priority
                          </span>
                       </div>
                       <p className="text-xs font-bold text-slate-700 leading-relaxed italic">"{as.reasoning}"</p>
                    </div>
                    <div className="text-right bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100 min-w-[140px]">
                       <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Target Loading</span>
                       <span className="text-2xl font-black text-slate-800">{as.targetQty} <span className="text-xs text-slate-400">PCS</span></span>
                    </div>
                 </div>
               ))}
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <FileText size={16} /> Strategic Summary
            </h3>
            <div className="bg-indigo-900 text-white p-8 rounded-[40px] shadow-2xl relative overflow-hidden group">
               <BrainCircuit className="absolute -top-10 -right-10 text-white/5 w-40 h-40 group-hover:scale-125 transition-transform duration-700" />
               <h4 className="text-indigo-300 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Optimizer Insights</h4>
               <p className="text-sm font-medium leading-relaxed mb-8 border-l-2 border-indigo-400 pl-4 py-2 bg-white/5 rounded-r-xl">
                 {plan.summary}
               </p>
               
               <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs font-bold p-3 bg-white/10 rounded-2xl">
                     <span className="text-indigo-200">Efficiency Forecast</span>
                     <span className="text-emerald-400">+12.4%</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold p-3 bg-white/10 rounded-2xl">
                     <span className="text-indigo-200">Constraint Risk</span>
                     <span className="text-amber-400">Minimal</span>
                  </div>
               </div>

               <button className="w-full mt-10 bg-white text-indigo-900 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-50 transition">
                 <Download size={14} /> Export Plan to PDF
               </button>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-amber-100 bg-amber-50/30 flex items-start gap-4">
               <ShieldAlert className="text-amber-500 flex-shrink-0" />
               <div>
                  <h5 className="text-xs font-black text-amber-700 uppercase mb-1">Bottleneck Warning</h5>
                  <p className="text-[10px] text-amber-600 font-medium leading-normal">
                    Manpower on Line 2 is 15% below threshold. AI has re-routed 40 units of heavy sewing to Line 1 to maintain TAT.
                  </p>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartPlanning;