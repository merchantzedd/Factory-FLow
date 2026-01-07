
import React, { useState } from 'react';
import { 
  FileText, Download, Printer, Loader2, Sparkles, ChevronRight, 
  FileSpreadsheet, Send, TrendingUp, AlertCircle, ShoppingBag, 
  Scissors, LayoutDashboard, Share2
} from 'lucide-react';
import { Job, PurchaseOrder } from '../types';
import { generateExecutiveReport } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';

interface ReportCenterProps {
  jobs: Job[];
  orders: PurchaseOrder[];
}

const ReportCenter: React.FC<ReportCenterProps> = ({ jobs, orders }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportText, setReportText] = useState<string | null>(null);

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    const summaryData = {
      brand: "FIX STITCHES",
      activeWip: jobs.filter(j => !j.isCompleted).length,
      completedThisMonth: jobs.filter(j => j.isCompleted).length,
      currency: "Indian Rupee (₹)",
      fabricStatus: orders.map(o => ({ po: o.poNumber, status: o.fabricStatus })),
      yieldStats: jobs.map(j => ({ id: j.jobId, dec: j.averageDeclared, act: j.cuttingReport?.actualAverage || 0 }))
    };
    
    try {
      const result = await generateExecutiveReport(summaryData);
      setReportText(result);
    } catch (e) {
      alert("Failed to generate report.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-200">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Executive Report Center</h2>
            <p className="text-slate-500 font-medium max-w-lg">Generate localized production audits, fabric leakage reports, and shipment TAT analysis with AI intelligence.</p>
          </div>
          <div className="flex flex-wrap gap-4 w-full xl:w-auto">
            <button className="flex-1 md:flex-none flex items-center justify-center gap-3 bg-slate-50 text-slate-700 px-8 py-4 rounded-[20px] font-black text-[11px] uppercase tracking-widest border border-slate-200 hover:bg-slate-100 transition shadow-sm">
              <FileSpreadsheet size={18} /> Export Tally CSV
            </button>
            <button 
              onClick={handleGenerateReport}
              disabled={isGenerating}
              className="flex-1 md:flex-none flex items-center justify-center gap-3 bg-slate-900 text-white px-10 py-4 rounded-[20px] font-black text-[11px] uppercase tracking-widest hover:bg-slate-800 transition shadow-2xl shadow-indigo-900/20"
            >
              {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} className="text-indigo-400" />}
              {isGenerating ? 'Analyzing Factory Data...' : 'Generate AI Daily Summary'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Report Types Sidebar */}
        <div className="space-y-6">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Intelligence Modules</h3>
          {[
            { title: 'Floor Production Log', desc: 'Efficiency & Output Metrics', icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { title: 'Fabric Variance Audit', desc: 'CAD vs Actual Meterage Loss', icon: Scissors, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { title: 'Shipment Risk Tracker', desc: 'Critical TAT & Bottleneck Alerts', icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
            { title: 'Client WIP Visibility', desc: 'Shareable buyer-facing report', icon: Share2, color: 'text-amber-600', bg: 'bg-amber-50' },
          ].map((type, idx) => (
            <button key={idx} className="w-full bg-white p-6 rounded-[32px] border border-slate-200 text-left hover:border-slate-400 hover:shadow-xl transition-all group flex items-center justify-between">
              <div className="flex items-center gap-5">
                 <div className={`p-4 rounded-2xl ${type.bg} ${type.color}`}>
                    <type.icon size={22} />
                 </div>
                 <div>
                    <h4 className="font-black text-slate-900 text-sm leading-tight mb-1">{type.title}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{type.desc}</p>
                 </div>
              </div>
              <ChevronRight size={18} className="text-slate-300 group-hover:text-slate-900 transition-colors" />
            </button>
          ))}
        </div>

        {/* Report Viewer */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-[48px] border border-slate-200 min-h-[700px] flex flex-col overflow-hidden shadow-2xl shadow-slate-100">
            <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/80 backdrop-blur-sm">
               <div className="flex items-center gap-3">
                 <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white text-[10px] font-black">FS</div>
                 <span className="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em]">Live Document Stream</span>
               </div>
               <div className="flex gap-4">
                 <button className="p-3 bg-white text-slate-400 hover:text-slate-900 rounded-xl border border-slate-100 shadow-sm transition"><Printer size={20} /></button>
                 <button className="p-3 bg-white text-slate-400 hover:text-slate-900 rounded-xl border border-slate-100 shadow-sm transition"><Download size={20} /></button>
               </div>
            </div>
            
            <div className="p-12 flex-1 overflow-auto bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px]">
              {reportText ? (
                <div className="prose prose-slate max-w-none animate-in fade-in zoom-in-95 duration-700 bg-white p-16 rounded-3xl shadow-2xl border border-slate-100 ring-1 ring-slate-200">
                   <ReactMarkdown>{reportText}</ReactMarkdown>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                   <div className="w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center text-slate-200 border border-slate-100">
                      <FileText size={48} />
                   </div>
                   <div className="space-y-2">
                     <p className="text-slate-900 font-black text-lg">System Ready for Audit</p>
                     <p className="text-slate-400 font-bold max-w-xs text-sm mx-auto">
                       Pick a module from the sidebar or click 'Generate' to create a localized AI summary of today's production floor.
                     </p>
                   </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportCenter;
