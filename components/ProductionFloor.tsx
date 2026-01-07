
import React, { useState, useMemo } from 'react';
import { AttendanceEntry, Job, ProcessStage, CuttingReport, JobClosureData } from '../types';
import { STAGES_ORDERED, calculateDaysDiff } from '../constants';
import { 
  CheckCircle2, Scissors, Zap, Timer, ChevronRight, 
  Layers, Activity, Info, History, X, Tag, Package, Search,
  ArrowRightCircle, AlertCircle, TrendingUp, Download, ArrowRight,
  Clock, AlertTriangle, FilterX, MessageSquareText, Save, Send,
  Ruler
} from 'lucide-react';

interface ProductionFloorProps {
  jobs: Job[];
  attendance: AttendanceEntry[];
  onUpdateStage: (jobId: string, outputQty: number, sourceStage: ProcessStage, cuttingReport?: CuttingReport, notes?: string, targetStage?: ProcessStage, closureData?: JobClosureData) => void;
  onUndoStage: (jobId: string) => void;
  onToggleUrgent: (jobId: string) => void;
}

const STAGE_THEMES: Record<ProcessStage, { bg: string; text: string; border: string; icon: any }> = {
  [ProcessStage.CUTTING]: { bg: 'bg-indigo-600', text: 'text-white', border: 'border-indigo-400', icon: Scissors },
  [ProcessStage.FUSING]: { bg: 'bg-purple-600', text: 'text-white', border: 'border-purple-400', icon: Zap },
  [ProcessStage.SEWING]: { bg: 'bg-amber-600', text: 'text-white', border: 'border-amber-400', icon: Layers },
  [ProcessStage.BUTTON_HOLING]: { bg: 'bg-orange-600', text: 'text-white', border: 'border-orange-400', icon: CheckCircle2 },
  [ProcessStage.FINISHING]: { bg: 'bg-blue-600', text: 'text-white', border: 'border-blue-400', icon: Activity },
  [ProcessStage.IRONING]: { bg: 'bg-cyan-600', text: 'text-white', border: 'border-cyan-400', icon: Zap },
  [ProcessStage.PACKING]: { bg: 'bg-slate-700', text: 'text-white', border: 'border-slate-500', icon: Package },
  [ProcessStage.QC]: { bg: 'bg-emerald-600', text: 'text-white', border: 'border-emerald-400', icon: CheckCircle2 },
  [ProcessStage.QC_REJECTED]: { bg: 'bg-red-600', text: 'text-white', border: 'border-red-400', icon: History },
  [ProcessStage.DISPATCH]: { bg: 'bg-slate-900', text: 'text-white', border: 'border-slate-800', icon: ArrowRightCircle },
};

const ProductionFloor: React.FC<ProductionFloorProps> = ({ jobs, attendance, onUpdateStage, onUndoStage, onToggleUrgent }) => {
  const [activeLine, setActiveLine] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [historyJob, setHistoryJob] = useState<Job | null>(null);
  const [sessionOutputs, setSessionOutputs] = useState<Record<string, number>>({});
  const [closureInputs, setClosureInputs] = useState<Record<string, { packed: number; defective: number; shortage: number }>>({});
  
  // Note System State
  const [pendingUpdate, setPendingUpdate] = useState<{ job: Job, stage: ProcessStage, output: number } | null>(null);
  const [stageNote, setStageNote] = useState('');

  const now = new Date().toISOString();

  const stageAverages = useMemo(() => {
    const averages: Record<string, number> = {};
    STAGES_ORDERED.forEach(stage => {
      let totalDays = 0;
      let count = 0;
      jobs.forEach(job => {
        const log = job.processHistory.find(h => h.stage === stage);
        if (log && log.completionDate) {
          totalDays += calculateDaysDiff(log.entryDate, log.completionDate);
          count++;
        }
      });
      averages[stage] = count > 0 ? totalDays / count : 0;
    });
    return averages;
  }, [jobs]);

  const activeJobs = jobs.filter(j => !j.isCompleted);

  const filteredJobs = useMemo(() => {
    return activeJobs.filter(job => {
      const matchesLine = activeLine === 'All' || job.productionLine === activeLine;
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = !query || 
        job.jobId.toLowerCase().includes(query) || 
        job.styleName.toLowerCase().includes(query);
      return matchesLine && matchesSearch;
    });
  }, [activeJobs, activeLine, searchQuery]);

  const getStageBalance = (job: Job, stage: ProcessStage) => {
    const status = job.stageStatus[stage];
    if (!status) return 0;
    return status.inward - status.output;
  };

  const handleOutputChange = (jobId: string, stage: ProcessStage, val: string) => {
    setSessionOutputs(prev => ({ ...prev, [`${jobId}-${stage}`]: Number(val) }));
  };

  const handleClosureUpdate = (jobId: string, field: 'packed' | 'defective' | 'shortage', val: string) => {
    setClosureInputs(prev => ({
      ...prev,
      [jobId]: {
        ...(prev[jobId] || { packed: 0, defective: 0, shortage: 0 }),
        [field]: Number(val)
      }
    }));
  };

  const handleTriggerUpdate = (job: Job, stage: ProcessStage) => {
    const output = sessionOutputs[`${job.id}-${stage}`] || 0;
    const balance = getStageBalance(job, stage);
    
    if (output <= 0 && stage !== ProcessStage.CUTTING && stage !== ProcessStage.DISPATCH) return alert("Please enter a valid output quantity.");
    if (output > balance && stage !== ProcessStage.CUTTING && stage !== ProcessStage.DISPATCH) return alert(`Output exceeds balance (${balance}).`);

    // For Dispatch, we use a different flow (closure modal)
    if (stage === ProcessStage.DISPATCH) {
      const cIn = closureInputs[job.id] || { packed: 0, defective: 0, shortage: 0 };
      if (cIn.packed <= 0) return alert("Enter Packed Quantity.");
      setPendingUpdate({ job, stage, output: cIn.packed });
    } else {
      setPendingUpdate({ job, stage, output });
    }
  };

  const finalizeUpdate = () => {
    if (!pendingUpdate) return;
    const { job, stage, output } = pendingUpdate;

    if (stage === ProcessStage.DISPATCH) {
      const cIn = closureInputs[job.id] || { packed: 0, defective: 0, shortage: 0 };
      onUpdateStage(job.id, output, stage, undefined, stageNote, undefined, {
        packedQuantity: cIn.packed,
        defectiveQuantity: cIn.defective,
        shortExcessQuantity: cIn.shortage,
        closedAt: new Date().toISOString()
      });
    } else {
      onUpdateStage(job.id, output, stage, undefined, stageNote);
    }

    // Reset local session storage for this specific entry
    const key = `${job.id}-${stage}`;
    setSessionOutputs(prev => { const n = {...prev}; delete n[key]; return n; });
    setPendingUpdate(null);
    setStageNote('');
  };

  const getTATIndicator = (job: Job, stage: ProcessStage) => {
    const stageLog = job.processHistory.find(h => h.stage === stage);
    if (!stageLog) return null;

    const daysInStage = calculateDaysDiff(stageLog.entryDate, now);
    const avg = stageAverages[stage];

    let colorClass = "bg-emerald-100 text-emerald-700 border-emerald-200";
    let icon = <Clock size={12} />;

    if (avg > 0) {
      if (daysInStage > avg) {
        colorClass = "bg-rose-100 text-rose-700 border-rose-200 animate-pulse";
        icon = <AlertTriangle size={12} />;
      } else if (daysInStage > avg * 0.75) {
        colorClass = "bg-amber-100 text-amber-700 border-amber-200";
        icon = <Timer size={12} />;
      }
    }

    return (
      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-tight ${colorClass}`}>
        {icon}
        <span>{daysInStage} Days</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Visual Header & Advanced Search Controls */}
      <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-200 flex flex-col xl:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4 w-full xl:w-auto">
          <div className="relative flex-1 xl:w-[450px] group">
            <Search className="absolute left-5 top-4 text-slate-400 group-focus-within:text-indigo-600 transition" size={20} />
            <input 
              type="text"
              placeholder="Filter floor by Job ID or Style Name..."
              className="w-full pl-14 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-100/50 focus:border-indigo-500 focus:bg-white outline-none transition-all shadow-inner"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <div className="hidden sm:flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            {['All', 'Line 1', 'Line 2', 'Line 3'].map((l) => (
              <button 
                key={l} 
                onClick={() => setActiveLine(l)}
                className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeLine === l ? 'bg-white text-indigo-600 shadow-md shadow-slate-200 border border-slate-200' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-3">
          <div className="bg-indigo-50 px-6 py-3 rounded-2xl border border-indigo-100 flex items-center gap-4">
             <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
               <TrendingUp size={18} />
             </div>
             <div>
               <p className="text-[9px] font-black text-indigo-400 uppercase leading-none mb-1">Found Matches</p>
               <p className="text-xl font-black text-indigo-900 leading-none">{filteredJobs.length}</p>
             </div>
          </div>
        </div>
      </div>

      {filteredJobs.length === 0 && searchQuery && (
        <div className="py-24 bg-white rounded-[40px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95">
           <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-300 mb-4">
              <FilterX size={40} />
           </div>
           <h3 className="text-xl font-black text-slate-800">No Jobs Match "{searchQuery}"</h3>
           <p className="text-slate-400 font-medium text-sm mt-2">Try searching with a different Job ID or Style Name.</p>
           <button 
            onClick={() => setSearchQuery('')}
            className="mt-6 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition"
           >
             Reset Search
           </button>
        </div>
      )}

      {/* The Floor Map - Horizontal Pipeline */}
      <div className="flex xl:flex-row gap-8 overflow-x-auto pb-12 pt-4 px-1 min-h-[800px] custom-scrollbar">
        {STAGES_ORDERED.map((stage, sIdx) => {
          const Theme = STAGE_THEMES[stage];
          const stageJobs = filteredJobs.filter(j => getStageBalance(j, stage) > 0);
          const totalUnits = stageJobs.reduce((sum, j) => sum + getStageBalance(j, stage), 0);
          
          return (
            <div key={stage} className="flex-shrink-0 w-full md:w-[350px] xl:w-[380px] flex flex-col relative group/stage">
              <div className="absolute -left-4 top-10 bottom-10 w-px bg-slate-200 hidden xl:block"></div>
              
              {/* Stage Header Block */}
              <div className={`mb-6 rounded-[28px] overflow-hidden shadow-lg border-2 ${Theme.border}`}>
                <div className={`${Theme.bg} p-5 ${Theme.text}`}>
                  <div className="flex justify-between items-center mb-1">
                    <Theme.icon size={24} />
                    <span className="text-[10px] font-black opacity-80 uppercase tracking-widest">{stageJobs.length} Active</span>
                  </div>
                  <h4 className="text-sm font-black uppercase tracking-[0.2em]">{stage}</h4>
                </div>
                <div className="bg-white p-4 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                      <Layers size={14} className="text-slate-400" />
                    </div>
                    <span className="text-xl font-black text-slate-800 tracking-tighter">{totalUnits.toLocaleString()}</span>
                  </div>
                  <span className="text-[9px] font-black text-slate-400 uppercase">Load PCS</span>
                </div>
              </div>

              {/* Jobs Stream */}
              <div className="flex-1 space-y-5 overflow-y-auto custom-scrollbar px-1 max-h-[650px]">
                {stageJobs.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-center rounded-[32px] border-2 border-dashed border-slate-200 opacity-40">
                    <div className="w-12 h-12 rounded-full border border-slate-400 flex items-center justify-center mb-3">
                       <Clock size={20} />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Idle Stage</p>
                  </div>
                ) : (
                  stageJobs.map((job) => {
                    const balance = getStageBalance(job, stage);
                    const status = job.stageStatus[stage] || { inward: 0, output: 0 };
                    const progress = status.inward > 0 ? Math.round(((status.output) / status.inward) * 100) : 0;
                    const latestNote = job.processHistory[job.processHistory.length - 1]?.notes;

                    return (
                      <div 
                        key={`${job.id}-${stage}`} 
                        className={`bg-white p-6 rounded-[32px] border-2 shadow-sm transition-all hover:shadow-2xl hover:-translate-y-2 group/card ${job.isUrgent ? 'border-orange-500 bg-orange-50/20' : 'border-slate-100'}`}
                      >
                        <div className="flex justify-between items-start mb-4">
                           <div className="space-y-1">
                             <div className="flex items-center gap-2">
                               <span className="px-3 py-1 bg-indigo-600 text-white text-[9px] font-black rounded-full shadow-lg shadow-indigo-100">{job.jobId}</span>
                               <span className="text-[9px] font-bold text-slate-400 uppercase">{job.productionLine}</span>
                             </div>
                             <h5 className="text-lg font-black text-slate-800 tracking-tight leading-none group-hover/card:text-indigo-600 transition-colors">{job.styleName}</h5>
                             <div className="pt-2 flex flex-wrap gap-2">
                               {getTATIndicator(job, stage)}
                               {latestNote && (
                                 <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-indigo-100 bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase tracking-tight">
                                   <MessageSquareText size={12} />
                                   <span>Has Notes</span>
                                 </div>
                               )}
                             </div>
                           </div>
                           <button onClick={() => setHistoryJob(job)} className="p-3 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-2xl transition">
                             <Info size={20} />
                           </button>
                        </div>

                        {latestNote && (
                          <div className="mb-4 p-3 bg-slate-50 rounded-xl border border-slate-100 italic text-[10px] text-slate-500 line-clamp-1">
                            "{latestNote}"
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4 mb-6">
                           <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                             <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Ready</p>
                             <p className="text-2xl font-black text-slate-800 tracking-tight">{status.inward}</p>
                           </div>
                           <div className={`p-4 rounded-2xl border-2 ${balance > 0 ? 'bg-indigo-50 border-indigo-100' : 'bg-emerald-50 border-emerald-100'}`}>
                             <p className={`text-[9px] font-black uppercase mb-1 ${balance > 0 ? 'text-indigo-500' : 'text-emerald-500'}`}>Balance</p>
                             <p className={`text-2xl font-black tracking-tight ${balance > 0 ? 'text-indigo-700' : 'text-emerald-700'}`}>{balance}</p>
                           </div>
                        </div>

                        <div className="mb-6">
                           <div className="flex justify-between text-[10px] font-black uppercase mb-2">
                             <span className="text-slate-400">Stage Yield</span>
                             <span className="text-indigo-600">{progress}%</span>
                           </div>
                           <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200">
                              <div className="h-full bg-indigo-600 rounded-full transition-all duration-1000 shadow-sm" style={{ width: `${progress}%` }} />
                           </div>
                        </div>

                        <div className="flex items-center gap-2">
                           {stage === ProcessStage.DISPATCH ? (
                             <div className="w-full space-y-3">
                               <div className="grid grid-cols-3 gap-2">
                                 <div className="space-y-1">
                                    <label className="text-[8px] font-black text-slate-400 uppercase">Pckd</label>
                                    <input 
                                      type="number" 
                                      placeholder="0" 
                                      className="w-full p-2 rounded-xl border-2 border-slate-100 text-[11px] font-black text-center focus:border-indigo-500" 
                                      value={closureInputs[job.id]?.packed || ''}
                                      onChange={(e) => handleClosureUpdate(job.id, 'packed', e.target.value)} 
                                    />
                                 </div>
                                 <div className="space-y-1">
                                    <label className="text-[8px] font-black text-slate-400 uppercase">Defct</label>
                                    <input 
                                      type="number" 
                                      placeholder="0" 
                                      className="w-full p-2 rounded-xl border-2 border-slate-100 text-[11px] font-black text-center focus:border-red-500" 
                                      value={closureInputs[job.id]?.defective || ''}
                                      onChange={(e) => handleClosureUpdate(job.id, 'defective', e.target.value)} 
                                    />
                                 </div>
                                 <div className="space-y-1">
                                    <label className="text-[8px] font-black text-slate-400 uppercase">S/E</label>
                                    <input 
                                      type="number" 
                                      placeholder="0" 
                                      className="w-full p-2 rounded-xl border-2 border-slate-100 text-[11px] font-black text-center focus:border-amber-500" 
                                      value={closureInputs[job.id]?.shortage || ''}
                                      onChange={(e) => handleClosureUpdate(job.id, 'shortage', e.target.value)} 
                                    />
                                 </div>
                               </div>
                               <button 
                                 onClick={() => handleTriggerUpdate(job, stage)} 
                                 className="w-full py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase shadow-xl hover:bg-indigo-600 transition"
                               >
                                 Finalize & Ship Job
                               </button>
                             </div>
                           ) : (
                             <>
                               <div className="flex-1 relative">
                                  <input 
                                    type="number" 
                                    placeholder="PCS OUT" 
                                    className="w-full pl-4 pr-10 py-3.5 rounded-2xl border-2 border-slate-50 bg-slate-50 focus:bg-white focus:border-indigo-500 outline-none text-sm font-black transition-all"
                                    value={sessionOutputs[`${job.id}-${stage}`] || ''}
                                    onChange={(e) => handleOutputChange(job.id, stage, e.target.value)}
                                  />
                                  <span className="absolute right-4 top-4 text-[9px] font-black text-slate-300">QTY</span>
                               </div>
                               <button 
                                 onClick={() => handleTriggerUpdate(job, stage)}
                                 className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center hover:bg-indigo-700 transition shadow-lg shadow-indigo-100"
                               >
                                 <ChevronRight size={28} />
                               </button>
                             </>
                           )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {sIdx < STAGES_ORDERED.length - 1 && (
                <div className="hidden xl:flex absolute -right-6 top-1/2 -translate-y-1/2 z-10 text-slate-200 group-hover/stage:text-indigo-300 transition-colors">
                  <ArrowRight size={32} strokeWidth={3} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Note Prompt Modal */}
      {pendingUpdate && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white rounded-[40px] w-full max-w-md shadow-2xl overflow-hidden border border-slate-200">
              <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
                 <div className="flex items-center gap-3">
                    <MessageSquareText size={20} className="text-indigo-400" />
                    <h3 className="text-sm font-black uppercase tracking-widest">Stage Closure Notes</h3>
                 </div>
                 <button onClick={() => {setPendingUpdate(null); setStageNote('');}} className="p-2 hover:bg-white/10 rounded-lg transition"><X size={18} /></button>
              </div>
              <div className="p-8 space-y-6">
                 <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase mb-2">
                       <span>Job</span>
                       <span>Committing</span>
                    </div>
                    <div className="flex justify-between items-center">
                       <span className="text-lg font-black text-slate-800">{pendingUpdate.job.jobId}</span>
                       <span className="text-2xl font-black text-indigo-600">{pendingUpdate.output} PCS</span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-3">From: {pendingUpdate.stage}</p>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Add Stage Observations (Optional)</label>
                    <textarea 
                       placeholder="Mention machine delays, thread shortages, or quality observations..."
                       className="w-full h-32 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-medium focus:bg-white focus:border-indigo-500 transition outline-none resize-none"
                       value={stageNote}
                       onChange={(e) => setStageNote(e.target.value)}
                    ></textarea>
                 </div>

                 <div className="grid grid-cols-2 gap-3">
                    <button 
                       onClick={finalizeUpdate}
                       className="py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-slate-200 text-slate-400 hover:text-slate-800 transition"
                    >
                       Skip & Move
                    </button>
                    <button 
                       onClick={finalizeUpdate}
                       className="py-4 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition shadow-xl flex items-center justify-center gap-2"
                    >
                       <Save size={14} /> Commit Notes
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Audit Modal */}
      {historyJob && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
             <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
                <div className="flex items-center gap-6">
                   <div className="w-20 h-20 rounded-3xl overflow-hidden border-4 border-white/10 shadow-xl">
                      <img src={historyJob.jobImageUrl || `https://picsum.photos/seed/${historyJob.jobId}/200/200`} className="w-full h-full object-cover" />
                   </div>
                   <div>
                      <h3 className="text-3xl font-black tracking-tight">{historyJob.styleName}</h3>
                      <p className="text-indigo-400 font-bold uppercase tracking-widest text-[10px]">{historyJob.jobId} • LIVE PERFORMANCE AUDIT</p>
                   </div>
                </div>
                <button onClick={() => setHistoryJob(null)} className="p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition"><X size={24} /></button>
             </div>
             
             <div className="flex-1 overflow-y-auto p-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-1 space-y-6">
                   <div className="grid grid-cols-1 gap-4">
                      {[
                        { label: 'Input Meters', val: `${historyJob.fabricMetersIssued}m`, icon: Ruler },
                        { label: 'Avg Declared', val: historyJob.averageDeclared, icon: Info },
                        { label: 'Global Order', val: historyJob.quantity, icon: Package },
                      ].map((item, i) => (
                        <div key={i} className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 flex items-center gap-4">
                           <div className="p-3 bg-white rounded-2xl text-indigo-600 shadow-sm">
                              <item.icon size={20} />
                           </div>
                           <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">{item.label}</p>
                              <p className="text-2xl font-black text-slate-800">{item.val}</p>
                           </div>
                        </div>
                      ))}
                   </div>
                   <div className="bg-indigo-900 p-8 rounded-[40px] text-white space-y-4">
                      <h4 className="text-[10px] font-black uppercase text-indigo-300 tracking-widest">Current Status</h4>
                      <p className="text-2xl font-black tracking-tight">{historyJob.currentStage}</p>
                      <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                         <div className="h-full bg-indigo-400" style={{ width: `${(STAGES_ORDERED.indexOf(historyJob.currentStage) / STAGES_ORDERED.length) * 100}%` }} />
                      </div>
                   </div>
                </div>

                <div className="lg:col-span-2 space-y-6">
                   <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <History size={16} /> Technical Narrative History
                   </h3>
                   <div className="space-y-4">
                      {historyJob.processHistory.length === 0 ? (
                        <div className="py-20 text-center text-slate-300 font-black uppercase tracking-widest text-[10px]">No History Recorded</div>
                      ) : (
                        historyJob.processHistory.map((log, lIdx) => (
                          <div key={lIdx} className="relative pl-10 before:content-[''] before:absolute before:left-3 before:top-4 before:bottom-0 before:w-0.5 before:bg-slate-100 last:before:hidden">
                             <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-white border-4 border-indigo-600 shadow-sm z-10" />
                             <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                                <div className="flex justify-between items-center">
                                   <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">{log.stage}</h4>
                                   <span className="text-[10px] font-bold text-slate-400">{new Date(log.entryDate).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                   <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase">Output: {log.processedQuantity}</div>
                                   {log.completionDate && <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase">Completed</div>}
                                </div>
                                {log.notes && (
                                   <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3">
                                      <MessageSquareText size={16} className="text-slate-400 flex-shrink-0 mt-0.5" />
                                      <p className="text-xs font-medium text-slate-600 italic leading-relaxed">
                                         "{log.notes}"
                                      </p>
                                   </div>
                                )}
                             </div>
                          </div>
                        )).reverse()
                      )}
                   </div>
                </div>
             </div>

             <div className="p-8 border-t bg-slate-50 flex justify-end gap-3">
                <button onClick={() => setHistoryJob(null)} className="px-8 py-3 rounded-2xl font-black text-[10px] uppercase text-slate-500">Close Audit</button>
                <button className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase flex items-center gap-2"><Download size={16} /> Export Tech Sheet</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductionFloor;
