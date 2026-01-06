import React, { useState } from 'react';
import { FileText, Download, Printer, Loader2, Sparkles, ChevronRight, FileSpreadsheet, Send, TrendingUp } from 'lucide-react';
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
      activeWip: jobs.filter(j => !j.isCompleted).length,
      completedThisMonth: jobs.filter(j => j.isCompleted).length,
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
      <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-slate-800">Executive Report Center</h2>
            <p className="text-slate-500 text-sm font-medium">Generate professional audits for management and buyers.</p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-100 text-slate-700 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition">
              <FileSpreadsheet size={16} /> Export CSV
            </button>
            <button 
              onClick={handleGenerateReport}
              disabled={isGenerating}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition shadow-lg shadow-indigo-100"
            >
              {isGenerating ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
              Generate AI Summary
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Report Types Sidebar */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Standard Modules</h3>
          {[
            { title: 'Daily Floor Summary', desc: 'Output vs Targets per line', icon: TrendingUp, color: 'text-indigo-600' },
            { title: 'Fabric Yield Audit', desc: 'Consumption & Wastage analysis', icon: FileText, color: 'text-emerald-600' },
            { title: 'PO Aging Report', desc: 'Delayed shipments & bottlenecks', icon: Send, color: 'text-red-600' },
          ].map((type, idx) => (
            <button key={idx} className="w-full bg-white p-5 rounded-3xl border border-slate-200 text-left hover:border-indigo-600 hover:shadow-lg transition-all group flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <div className={`p-3 rounded-2xl bg-slate-50 ${type.color}`}>
                    <type.icon size={20} />
                 </div>
                 <div>
                    <h4 className="font-black text-slate-800 text-sm">{type.title}</h4>
                    <p className="text-[10px] font-medium text-slate-400">{type.desc}</p>
                 </div>
              </div>
              <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-600" />
            </button>
          ))}
        </div>

        {/* Report Viewer */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-[40px] border border-slate-200 min-h-[600px] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 <FileText size={14} /> Document Preview
               </span>
               <div className="flex gap-2">
                 <button className="p-2 text-slate-400 hover:text-indigo-600"><Printer size={20} /></button>
                 <button className="p-2 text-slate-400 hover:text-indigo-600"><Download size={20} /></button>
               </div>
            </div>
            
            <div className="p-10 flex-1 overflow-auto bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px]">
              {reportText ? (
                <div className="prose prose-slate max-w-none animate-in fade-in zoom-in-95 duration-500 bg-white p-12 rounded-xl shadow-sm border">
                   <ReactMarkdown>{reportText}</ReactMarkdown>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                   <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center text-slate-300">
                      <FileText size={40} />
                   </div>
                   <p className="text-slate-400 font-bold max-w-xs text-sm">
                     Select a module or use AI to generate a comprehensive document preview.
                   </p>
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