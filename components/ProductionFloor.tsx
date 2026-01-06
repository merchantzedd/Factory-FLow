import React, { useState } from 'react';
import { AttendanceEntry, Job, ProcessStage, CuttingReport, JobSizeBreakdown, JobClosureData } from '../types';
import { STAGES_ORDERED, calculateDaysDiff } from '../constants';
import { 
  ArrowRight, CheckCircle2, Clock, ShieldCheck, Users, Scissors, 
  Zap, Timer, MessageSquareText, ChevronRight, 
  Layers, Activity, Info, History, X, ImageIcon, Tag, Package, RotateCcw, Search
} from 'lucide-react';

interface ProductionFloorProps {
  jobs: Job[];
  attendance: AttendanceEntry[];
  onUpdateStage: (jobId: string, outputQty: number, sourceStage: ProcessStage, cuttingReport?: CuttingReport, notes?: string, targetStage?: ProcessStage, closureData?: JobClosureData) => void;
  onUndoStage: (jobId: string) => void;
  onToggleUrgent: (jobId: string) => void;
}

const ProductionFloor: React.FC<ProductionFloorProps> = ({ jobs, attendance, onUpdateStage, onUndoStage, onToggleUrgent }) => {
  const [activeLine, setActiveLine] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mobileSelectedStage, setMobileSelectedStage] = useState<ProcessStage>(STAGES_ORDERED[0]);
  const [historyJob, setHistoryJob] = useState<Job | null>(null);
  
  const [sessionOutputs, setSessionOutputs] = useState<Record<string, number>>({});
  const [cuttingReports, setCuttingReports] = useState<Record<string, Partial<CuttingReport>>>({});
  const [cuttingSizes, setCuttingSizes] = useState<Record<string, JobSizeBreakdown>>({});
  const [closureInputs, setClosureInputs] = useState<Record<string, { packed: number; defective: number }>>({});
  const [lineNotes, setLineNotes] = useState<Record<string, string>>({});

  const activeJobs = jobs.filter(j => !j.isCompleted);
  const completedJobs = jobs.filter(j => j.isCompleted);
  const today = new Date().toISOString().split('T')[0];

  const matchesSearch = (job: Job) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return job.jobId.toLowerCase().includes(query) || job.styleName.toLowerCase().includes(query);
  };

  const filteredActiveJobs = activeJobs.filter(matchesSearch);
  const filteredCompletedJobs = completedJobs.filter(matchesSearch);

  // Helper to get balance for a specific job at a specific stage
  const getStageBalance = (job: Job, stage: ProcessStage) => {
    const status = job.stageStatus[stage];
    if (!status) return 0;
    return status.inward - status.output;
  };

  const handleOutputChange = (jobId: string, stage: ProcessStage, val: string) => {
    setSessionOutputs(prev => ({ ...prev, [`${jobId}-${stage}`]: Number(val) }));
  };

  const handleClosureInput = (jobId: string, field: 'packed' | 'defective', val: string) => {
    setClosureInputs(prev => ({
      ...prev,
      [jobId]: { ...(prev[jobId] || { packed: 0, defective: 0 }), [field]: Number(val) }
    }));
  };

  const handleUpdate = (job: Job, stage: ProcessStage) => {
    const output = sessionOutputs[`${job.id}-${stage}`] || 0;
    const balance = getStageBalance(job, stage);
    
    if (output <= 0 && stage !== ProcessStage.CUTTING) {
      alert("Please enter a valid output quantity.");
      return;
    }
    
    if (output > balance && stage !== ProcessStage.CUTTING) {
      alert(`Output (${output}) cannot exceed inward balance (${balance}).`);
      return;
    }

    let report: CuttingReport | undefined;
    let closure: JobClosureData | undefined;
    let notes = lineNotes[`${job.id}-${stage}`];

    if (stage === ProcessStage.CUTTING) {
      const inputs = cuttingReports[job.id];
      const sizes = cuttingSizes[job.id];
      const totalCut = (Object.values(sizes || {}) as number[]).reduce((a, b) => a + b, 0);
      
      if (totalCut === 0) return alert("Total Cutting Output cannot be 0.");
      if (!inputs?.actualAverage || !inputs?.layerColor) return alert("Enter Avg and Color.");
      
      report = {
        actualAverage: inputs.actualAverage,
        fabricDefects: inputs.fabricDefects || 'None',
        layerColor: inputs.layerColor,
        cuttingDate: today,
        sizeOutput: sizes as JobSizeBreakdown
      };
      
      onUpdateStage(job.id, totalCut, stage, report, notes);
    } else if (stage === ProcessStage.DISPATCH) {
      const cIn = closureInputs[job.id] || { packed: 0, defective: 0 };
      if (cIn.packed === 0) return alert("Enter Packed Qty.");
      
      closure = {
        packedQuantity: cIn.packed,
        defectiveQuantity: cIn.defective,
        shortExcessQuantity: (cIn.packed + cIn.defective) - job.quantity,
        closedAt: new Date().toISOString()
      };
      
      onUpdateStage(job.id, cIn.packed, stage, undefined, notes, undefined, closure);
    } else {
      onUpdateStage(job.id, output, stage, undefined, notes);
    }

    const key = `${job.id}-${stage}`;
    setSessionOutputs(prev => { const n = {...prev}; delete n[key]; return n; });
    setLineNotes(prev => { const n = {...prev}; delete n[key]; return n; });
    if (stage === ProcessStage.CUTTING) {
      setCuttingReports(prev => { const n = {...prev}; delete n[job.id]; return n; });
      setCuttingSizes(prev => { const n = {...prev}; delete n[job.id]; return n; });
    }
  };

  const getStageIcon = (stage: ProcessStage) => {
    switch (stage) {
      case ProcessStage.CUTTING: return <Scissors size={18} />;
      case ProcessStage.FUSING: return <Zap size={18} />;
      case ProcessStage.SEWING: return <Layers size={18} />;
      case ProcessStage.BUTTON_HOLING: return <CheckCircle2 size={18} />;
      case ProcessStage.FINISHING: return <Activity size={18} />;
      case ProcessStage.IRONING: return <Zap size={18} />;
      case ProcessStage.PACKING: return <Package size={18} />;
      case ProcessStage.QC: return <ShieldCheck size={18} />;
      case ProcessStage.QC_REJECTED: return <History size={18} />;
      case ProcessStage.DISPATCH: return <ChevronRight size={18} />;
      default: return <ChevronRight size={18} />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 px-1">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Production Floor</h2>
          <p className="text-sm text-slate-500 font-medium">Real-time WIP Tracking per stage</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full xl:w-auto">
          {/* Search Bar */}
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Search Job ID or Style..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-100 outline-none transition shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex p-1 bg-white border rounded-xl shadow-sm overflow-x-auto">
            {['All', 'Line 1', 'Line 2', 'Line 3'].map((l) => (
              <button key={l} onClick={() => setActiveLine(l)}
                className={`px-4 py-2 text-sm font-bold rounded-lg transition ${activeLine === l ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Mobile Stage Tabs */}
      <div className="xl:hidden overflow-x-auto no-scrollbar py-2 -mx-4 px-4 sticky top-0 z-20 bg-slate-50 border-b">
         <div className="flex gap-2">
           {STAGES_ORDERED.map((s) => {
             const count = filteredActiveJobs.filter(j => getStageBalance(j, s) > 0).length;
             return (
               <button key={s} onClick={() => setMobileSelectedStage(s)}
                 className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition border flex items-center gap-2 ${mobileSelectedStage === s ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-600'}`}
               >
                 {getStageIcon(s)} {s} {count > 0 && <span className="bg-white/20 px-1.5 rounded">{count}</span>}
               </button>
             )
           })}
         </div>
      </div>

      <div className="flex xl:grid xl:grid-cols-10 gap-4 overflow-x-auto pb-10 min-h-[700px]">
        {STAGES_ORDERED.map((stage) => {
          const stageJobs = filteredActiveJobs.filter(j => {
            const matchesLine = activeLine === 'All' || j.productionLine === activeLine;
            return matchesLine && getStageBalance(j, stage) > 0;
          });
          
          return (
            <div key={stage} className={`${stage !== mobileSelectedStage ? 'hidden xl:flex' : 'flex'} w-full xl:w-[340px] flex-col rounded-2xl bg-slate-100/50 border p-3 min-h-[600px]`}>
              <div className="hidden xl:block text-center border-b pb-3 mb-4">
                 <div className="flex justify-center gap-2 mb-1">
                    <span className="text-[10px] font-black bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{stageJobs.length} WIP</span>
                    {getStageIcon(stage)}
                 </div>
                 <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-tighter">{stage}</h4>
              </div>
              
              <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-1">
                {stageJobs.map((job) => {
                   const balance = getStageBalance(job, stage);
                   const status = job.stageStatus[stage] || { inward: 0, output: 0 };
                   const inward = status.inward;
                   const progress = inward > 0 ? Math.round(((status.output) / inward) * 100) : 0;
                   const isDispatch = stage === ProcessStage.DISPATCH;
                   const canUndo = job.processHistory.length > 0 && job.processHistory[job.processHistory.length - 1].stage === stage;

                   return (
                    <div key={`${job.id}-${stage}`} className={`bg-white p-4 rounded-xl border transition group relative ${job.isUrgent ? 'border-orange-500 ring-2 ring-orange-50' : 'border-slate-200 shadow-sm hover:shadow-md'}`}>
                      {job.isUrgent && (
                        <div className="absolute -top-2 -left-2 bg-orange-500 text-white p-1 rounded-full shadow-lg z-10">
                          <Zap size={14} fill="currentColor" />
                        </div>
                      )}

                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                             <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">{job.jobId}</span>
                             <span className="text-[8px] px-1 bg-slate-100 text-slate-400 rounded font-bold uppercase">{job.productionLine}</span>
                          </div>
                          <h5 className="text-sm font-bold text-slate-800 leading-tight mt-0.5">{job.styleName}</h5>
                        </div>
                        <div className="flex items-center gap-1">
                          {canUndo && (
                            <button 
                              onClick={() => { if(confirm("Undo last transition for this stage?")) onUndoStage(job.id) }} 
                              className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-md transition"
                            >
                              <RotateCcw size={14} />
                            </button>
                          )}
                          <button onClick={() => setHistoryJob(job)} className="p-1.5 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition"><History size={14} /></button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-3">
                         <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                           <span className="text-[8px] font-bold text-slate-400 uppercase block leading-none mb-1">Inward</span>
                           <span className="text-sm font-black text-slate-700">{inward}</span>
                         </div>
                         <div className={`p-2 rounded-lg border ${balance > 0 ? 'bg-amber-50 border-amber-100' : 'bg-emerald-50 border-emerald-100'}`}>
                           <span className={`text-[8px] font-bold uppercase block leading-none mb-1 ${balance > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>Balance</span>
                           <span className={`text-sm font-black ${balance > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>{balance}</span>
                         </div>
                      </div>

                      <div className="mb-4 space-y-1">
                        <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest">
                          <span className="text-slate-400">Stage Progress</span>
                          <span className="text-indigo-600">{progress}% Done</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/50">
                          <div className={`h-full transition-all duration-700 ${progress >= 100 ? 'bg-emerald-500' : 'bg-indigo-600'}`} style={{ width: `${progress}%` }} />
                        </div>
                      </div>

                      {stage === ProcessStage.CUTTING && (
                        <div className="space-y-3 bg-indigo-50/50 p-3 rounded-lg border border-indigo-100 mb-4">
                          <div className="grid grid-cols-2 gap-2">
                            <input type="number" placeholder="Avg" className="w-full text-xs p-1.5 rounded border" onChange={(e) => setCuttingReports(prev => ({ ...prev, [job.id]: { ...prev[job.id], actualAverage: Number(e.target.value) } }))} />
                            <input type="text" placeholder="Layer" className="w-full text-xs p-1.5 rounded border" onChange={(e) => setCuttingReports(prev => ({ ...prev, [job.id]: { ...prev[job.id], layerColor: e.target.value } }))} />
                          </div>
                          <div className="grid grid-cols-5 gap-1">
                            {(['s','m','l','xl','xxl'] as const).map(s => (
                              <input key={s} type="number" placeholder={s.toUpperCase()} className="w-full text-center text-[10px] p-1 border rounded" onChange={(e) => setCuttingSizes(prev => ({ ...prev, [job.id]: { ...(prev[job.id] || {s:0,m:0,l:0,xl:0,xxl:0}), [s]: Number(e.target.value) } }))} />
                            ))}
                          </div>
                        </div>
                      )}

                      {isDispatch ? (
                         <div className="space-y-3 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 mb-4 text-[10px]">
                           <p className="font-black text-emerald-800 uppercase flex items-center gap-1 border-b border-emerald-100 pb-1.5"><CheckCircle2 size={12} /> Final Job Closure</p>
                           <div className="grid grid-cols-2 gap-2">
                             <div className="space-y-1">
                               <label className="font-bold text-slate-500 uppercase">Packed</label>
                               <input type="number" className="w-full border-emerald-200 border p-2 rounded bg-white text-right font-black" onChange={(e) => handleClosureInput(job.id, 'packed', e.target.value)} />
                             </div>
                             <div className="space-y-1">
                               <label className="font-bold text-slate-500 uppercase">Defect</label>
                               <input type="number" className="w-full border-red-200 border p-2 rounded bg-white text-right font-black" onChange={(e) => handleClosureInput(job.id, 'defective', e.target.value)} />
                             </div>
                           </div>
                         </div>
                      ) : (
                        <div className="mb-4 flex items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Output Today</label>
                          <input 
                            type="number" 
                            disabled={stage === ProcessStage.CUTTING}
                            className={`w-20 p-2 text-xs font-black text-right border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-100 outline-none ${stage === ProcessStage.CUTTING ? 'bg-slate-100 cursor-not-allowed' : 'bg-white'}`}
                            value={sessionOutputs[`${job.id}-${stage}`] || ''}
                            onChange={(e) => handleOutputChange(job.id, stage, e.target.value)}
                          />
                        </div>
                      )}

                      <button onClick={() => handleUpdate(job, stage)}
                        className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${isDispatch ? 'bg-emerald-600 text-white shadow-lg' : 'bg-indigo-600 text-white shadow-md hover:bg-indigo-700'}`}
                      >
                        {isDispatch ? 'Finalize Dispatch' : stage === ProcessStage.CUTTING ? 'Approve Cutting' : 'Push to Next'}
                        <ArrowRight size={14} />
                      </button>
                    </div>
                   );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* History Modal */}
      {historyJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border">
             <div className="p-6 border-b bg-slate-900 text-white flex justify-between items-center">
                <div className="flex items-center gap-4">
                   <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-white/20">
                      <img src={historyJob.jobImageUrl || 'https://picsum.photos/seed/style/200/200'} className="w-full h-full object-cover" alt="style" />
                   </div>
                   <div>
                      <h3 className="text-xl font-black flex items-center gap-2">Technical Specification Sheet</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{historyJob.jobId} • {historyJob.styleName}</p>
                   </div>
                </div>
                <button onClick={() => setHistoryJob(null)} className="p-2 hover:bg-white/20 rounded-full transition"><X size={24} /></button>
             </div>
             
             <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Visuals */}
                <div className="space-y-6">
                   <h4 className="text-[10px] font-black uppercase text-indigo-600 tracking-widest flex items-center gap-2 border-b pb-2"><ImageIcon size={14} /> Branding & Labels</h4>
                   <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1 text-center">
                         <span className="text-[9px] font-bold text-slate-400 uppercase">Main Label</span>
                         <div className="aspect-square rounded-xl bg-slate-100 border overflow-hidden">
                            {historyJob.mainLabelImageUrl ? <img src={historyJob.mainLabelImageUrl} className="w-full h-full object-cover" /> : <Tag className="m-auto mt-8 text-slate-300" />}
                         </div>
                      </div>
                      <div className="space-y-1 text-center">
                         <span className="text-[9px] font-bold text-slate-400 uppercase">Additional Labels</span>
                         <div className="aspect-square rounded-xl bg-slate-100 border overflow-hidden">
                            {historyJob.additionalLabelImageUrl ? <img src={historyJob.additionalLabelImageUrl} className="w-full h-full object-cover" /> : <Package className="m-auto mt-8 text-slate-300" />}
                         </div>
                      </div>
                   </div>
                </div>

                {/* Specs */}
                <div className="space-y-6">
                   <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 border-b pb-2"><MessageSquareText size={14} /> Production Core</h4>
                   <div className="bg-slate-50 p-4 rounded-xl space-y-4">
                      <div>
                         <span className="text-[9px] font-black text-indigo-600 uppercase block">PP Comments</span>
                         <p className="text-xs text-slate-700 italic">{historyJob.ppComments || 'Standard procedures apply.'}</p>
                      </div>
                      <div>
                         <span className="text-[9px] font-black text-indigo-600 uppercase block">Stitching Requirements</span>
                         <p className="text-xs text-slate-700">{historyJob.stitchingComments || 'Refer to master sample SPI.'}</p>
                      </div>
                   </div>
                </div>

                {/* Audit */}
                <div className="space-y-6">
                   <div className="grid grid-cols-2 gap-3">
                      <div className="p-4 bg-slate-900 rounded-2xl text-white text-center">
                         <span className="text-[8px] font-bold text-slate-400 uppercase block">Inward</span>
                         <span className="text-xl font-black">{historyJob.quantity}</span>
                      </div>
                      <div className="p-4 bg-emerald-600 rounded-2xl text-white text-center">
                         <span className="text-[8px] font-bold text-emerald-100 uppercase block">Shipped</span>
                         <span className="text-xl font-black">{historyJob.closure?.packedQuantity || 0}</span>
                      </div>
                   </div>
                   <div className="bg-white p-5 rounded-2xl border space-y-3">
                      <div className="flex justify-between text-xs border-b pb-2"><span className="text-slate-500">Issued Meters</span><span className="font-black">{historyJob.fabricMetersIssued}m</span></div>
                      <div className="flex justify-between text-xs border-b pb-2"><span className="text-slate-500">Actual Average</span><span className="font-black text-indigo-600">{historyJob.cuttingReport?.actualAverage || 'N/A'}m</span></div>
                      {historyJob.isCompleted && (
                        <div className="pt-2"><span className="text-[9px] font-bold text-red-500 uppercase block mb-1">Final Defects</span><span className="text-sm font-black">{historyJob.closure?.defectiveQuantity} Units</span></div>
                      )}
                   </div>
                </div>
             </div>
             
             <div className="p-6 bg-slate-50 border-t flex justify-end gap-3">
                <button onClick={() => setHistoryJob(null)} className="px-6 py-2.5 rounded-xl text-xs font-black uppercase text-slate-500">Close</button>
                <button onClick={() => window.print()} className="bg-indigo-600 text-white px-8 py-2.5 rounded-xl text-xs font-black uppercase shadow-lg shadow-indigo-100">Export Tech Pack</button>
             </div>
          </div>
        </div>
      )}

      {/* Completed Jobs Table */}
      {filteredCompletedJobs.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border p-6 mt-12">
           <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2"><History className="text-indigo-600" /> Completed Job Archives</h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{filteredCompletedJobs.length} ENTRIES</span>
           </div>
           <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                 <thead className="bg-slate-50 border-b text-[10px] font-bold uppercase text-slate-400 tracking-widest">
                    <tr>
                       <th className="p-4">Line</th>
                       <th className="p-4">Job ID</th>
                       <th className="p-4">Style</th>
                       <th className="p-4 text-center">Shipped</th>
                       <th className="p-4 text-center">Variance</th>
                       <th className="p-4 text-right">Audit</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {filteredCompletedJobs.map(job => (
                       <tr key={job.id} className="hover:bg-slate-50 transition group">
                          <td className="p-4 font-bold text-slate-400">{job.productionLine}</td>
                          <td className="p-4 font-black text-slate-800">{job.jobId}</td>
                          <td className="p-4 text-slate-600 font-medium">{job.styleName}</td>
                          <td className="p-4 font-black text-emerald-600 text-center text-lg">{job.closure?.packedQuantity}</td>
                          <td className="p-4 font-black text-center">
                            <span className={job.closure!.shortExcessQuantity >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                               {job.closure!.shortExcessQuantity > 0 ? '+' : ''}{job.closure?.shortExcessQuantity}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                             <button onClick={() => setHistoryJob(job)} className="text-indigo-600 font-black text-xs inline-flex items-center gap-1.5 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-all"><Info size={14} /> View Audit</button>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      )}
    </div>
  );
};

export default ProductionFloor;
