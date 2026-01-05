
import React, { useState, useMemo } from 'react';
import { AttendanceEntry, Job, ProcessStage, CuttingReport, JobSizeBreakdown } from '../types';
import { STAGES_ORDERED, calculateDaysDiff } from '../constants';
import { ArrowRight, CheckCircle2, Clock, ShieldCheck, Filter, Users, Scissors, Ruler, AlertTriangle, ChevronRight, StickyNote, Info, Truck, Zap } from 'lucide-react';

interface ProductionFloorProps {
  jobs: Job[];
  attendance: AttendanceEntry[];
  onUpdateStage: (jobId: string, outputQty: number, cuttingReport?: CuttingReport, notes?: string) => void;
  onToggleUrgent: (jobId: string) => void;
}

const ProductionFloor: React.FC<ProductionFloorProps> = ({ jobs, attendance, onUpdateStage, onToggleUrgent }) => {
  const [activeLine, setActiveLine] = useState<string>('All');
  const [mobileSelectedStage, setMobileSelectedStage] = useState<ProcessStage>(STAGES_ORDERED[0]);
  
  // Local state to track input quantities for each job card
  const [inputQuantities, setInputQuantities] = useState<Record<string, number>>({});
  
  // Local state for Cutting Report inputs (Avg, Color, Defects)
  const [cuttingReports, setCuttingReports] = useState<Record<string, Partial<CuttingReport>>>({});
  
  // Local state for Cutting Size Output (S, M, L, XL, XXL)
  const [cuttingSizes, setCuttingSizes] = useState<Record<string, JobSizeBreakdown>>({});

  // Local state for stage-specific notes
  const [stageNotes, setStageNotes] = useState<Record<string, string>>({});

  const activeJobs = jobs.filter(j => !j.isCompleted);
  const completedJobs = jobs.filter(j => j.isCompleted);
  const today = new Date().toISOString().split('T')[0];

  // Logic to calculate performance benchmarks for delay flagging
  const stageBenchmarks = useMemo(() => {
    const benchmarks: Record<string, { avgDuration: number; avgEntryDelay: number }> = {};
    
    STAGES_ORDERED.forEach(stage => {
      let totalDuration = 0;
      let totalEntryDelay = 0;
      let durationCount = 0;
      let entryCount = 0;

      jobs.forEach(job => {
        const log = job.processHistory.find(h => h.stage === stage);
        if (log) {
          // Entry Delay (from creation)
          const entryDelay = calculateDaysDiff(job.createdAt, log.entryDate);
          totalEntryDelay += entryDelay;
          entryCount++;

          // Duration (if completed)
          if (log.completionDate) {
            const duration = calculateDaysDiff(log.entryDate, log.completionDate);
            totalDuration += duration;
            durationCount++;
          }
        }
      });

      benchmarks[stage] = {
        avgDuration: durationCount > 0 ? totalDuration / durationCount : 1.5, // Default 1.5 days if no data
        avgEntryDelay: entryCount > 0 ? totalEntryDelay / entryCount : 2.0  // Default 2 days if no data
      };
    });

    return benchmarks;
  }, [jobs]);

  // Filter by Production Line
  const filteredActiveJobs = activeLine === 'All' 
    ? activeJobs 
    : activeJobs.filter(j => j.productionLine === activeLine);

  const handleQuantityChange = (jobId: string, val: string) => {
    setInputQuantities(prev => ({ ...prev, [jobId]: Number(val) }));
  };

  const handleCuttingReportChange = (jobId: string, field: keyof CuttingReport, val: string) => {
    setCuttingReports(prev => ({
      ...prev,
      [jobId]: {
        ...prev[jobId],
        [field]: field === 'actualAverage' ? Number(val) : val
      }
    }));
  };
  
  const handleCuttingSizeChange = (jobId: string, size: keyof JobSizeBreakdown, val: string) => {
    setCuttingSizes(prev => {
        const currentSizes = prev[jobId] || { s:0, m:0, l:0, xl:0, xxl:0 };
        return {
            ...prev,
            [jobId]: { ...currentSizes, [size]: Number(val) }
        };
    });
  };

  const getCuttingTotal = (jobId: string) => {
      const s = cuttingSizes[jobId];
      if (!s) return 0;
      return s.s + s.m + s.l + s.xl + s.xxl;
  };

  const getJobOutputQuantity = (job: Job) => {
    if (job.currentStage === ProcessStage.CUTTING) {
        return getCuttingTotal(job.id);
    }
    if (inputQuantities[job.id] !== undefined) return inputQuantities[job.id];
    const currentLog = job.processHistory.find(log => log.stage === job.currentStage);
    return currentLog?.processedQuantity || job.quantity;
  };

  const getJobInputQuantity = (job: Job) => {
    const currentLog = job.processHistory.find(log => log.stage === job.currentStage);
    return currentLog?.processedQuantity || job.quantity;
  };

  const getStaffCount = (stage: ProcessStage) => {
    if (activeLine === 'All') return null;
    const entry = attendance.find(r => r.date === today && r.line === activeLine && r.stage === stage);
    if (!entry) return 0;
    return entry.operators + entry.helpers + entry.manpower;
  };

  const handleNextStage = (job: Job, outputQty: number) => {
    let report: CuttingReport | undefined;
    let notes = stageNotes[job.id];

    // Explicitly mark as QC Approved if at QC stage
    if (job.currentStage === ProcessStage.QC) {
      notes = notes ? `QC Approved - ${notes}` : 'QC Approved';
    }

    if (job.currentStage === ProcessStage.CUTTING) {
       const inputs = cuttingReports[job.id];
       const sizes = cuttingSizes[job.id];
       
       if (outputQty === 0) {
           alert("Total Cutting Output cannot be 0.");
           return;
       }
       if (!inputs?.actualAverage || !inputs?.layerColor) {
         alert("Please enter Actual Average and Layer Color for post-cutting approval.");
         return;
       }
       report = {
         actualAverage: inputs.actualAverage,
         fabricDefects: inputs.fabricDefects || 'None',
         layerColor: inputs.layerColor,
         cuttingDate: today,
         sizeOutput: sizes || { s:0, m:0, l:0, xl:0, xxl:0 }
       };
    }
    
    onUpdateStage(job.id, outputQty, report, notes);
    
    setStageNotes(prev => {
      const next = { ...prev };
      delete next[job.id];
      return next;
    });
    setCuttingReports(prev => {
      const next = { ...prev };
      delete next[job.id];
      return next;
    });
    setCuttingSizes(prev => {
      const next = { ...prev };
      delete next[job.id];
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Production Floor Tracking</h2>
          <p className="text-sm text-slate-500">Manage WIP flow and view daily line strength.</p>
        </div>
        
        <div className="flex p-1 bg-white border border-slate-200 rounded-lg shadow-sm">
          {['All', 'Line 1', 'Line 2', 'Line 3'].map((line) => (
            <button
              key={line}
              onClick={() => setActiveLine(line)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition ${
                activeLine === line 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {line}
            </button>
          ))}
        </div>
      </div>
      
      <div className="xl:hidden -mx-4 px-4 overflow-x-auto pb-4 hide-scrollbar">
         <div className="flex gap-2">
           {STAGES_ORDERED.map((stage) => {
             const count = filteredActiveJobs.filter(j => j.currentStage === stage).length;
             return (
               <button
                 key={stage}
                 onClick={() => setMobileSelectedStage(stage)}
                 className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition flex items-center gap-2 border ${
                    mobileSelectedStage === stage 
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                      : 'bg-white text-slate-600 border-slate-200'
                 }`}
               >
                 {stage}
                 {count > 0 && <span className={`text-xs px-1.5 rounded-full ${mobileSelectedStage === stage ? 'bg-indigo-500 text-indigo-50' : 'bg-slate-100 text-slate-600'}`}>{count}</span>}
               </button>
             )
           })}
         </div>
      </div>

      <div className="flex xl:grid xl:grid-cols-8 gap-4 overflow-x-auto pb-6 xl:pb-0" style={{ minWidth: '100%' }}>
        {STAGES_ORDERED.map((stage, index) => {
          const stageJobs = filteredActiveJobs.filter((job) => job.currentStage === stage);
          const isQC = stage === ProcessStage.QC;
          const isDispatch = stage === ProcessStage.DISPATCH;
          const isCutting = stage === ProcessStage.CUTTING;
          const staffCount = getStaffCount(stage);
          const isHiddenOnMobile = stage !== mobileSelectedStage;
          
          return (
            <div 
              key={stage} 
              className={`
                 ${isHiddenOnMobile ? 'hidden xl:flex' : 'flex'} 
                 w-full xl:w-auto xl:min-w-[340px] 
                 rounded-xl p-3 flex-col xl:h-[800px] border 
                 ${isQC ? 'bg-amber-50 border-amber-200' : isDispatch ? 'bg-green-50 border-green-200' : 'bg-slate-100 border-slate-200'}
              `}
            >
              <div className={`font-bold mb-2 text-center border-b pb-2 ${isQC ? 'text-amber-800 border-amber-200' : isDispatch ? 'text-green-800 border-green-200' : 'text-slate-700 border-slate-200'}`}>
                 <div className="flex items-center justify-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${isQC ? 'bg-amber-200 text-amber-900' : isDispatch ? 'bg-green-200 text-green-900' : 'bg-indigo-100 text-indigo-700'}`}>
                      {stageJobs.length} Jobs
                    </span>
                    {isQC && <ShieldCheck size={16} />}
                    {isDispatch && <Truck size={16} />}
                    {isCutting && <Scissors size={16} />}
                 </div>
                 <span className="text-sm">{stage}</span>
                 {activeLine !== 'All' && (
                   <div className="mt-1 flex justify-center">
                     <div className="bg-white/60 px-2 py-0.5 rounded text-[10px] font-normal flex items-center gap-1 text-slate-600">
                       <Users size={10} />
                       {staffCount} Staff Present
                     </div>
                   </div>
                 )}
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar min-h-[300px]">
                {stageJobs.map((job) => {
                   const inputQty = getJobInputQuantity(job);
                   const outputQty = getJobOutputQuantity(job);
                   const currentLog = job.processHistory.find(h => h.stage === job.currentStage);
                   
                   // Check for Delay
                   const daysInStage = currentLog ? calculateDaysDiff(currentLog.entryDate, new Date().toISOString()) : 0;
                   const entryDelay = currentLog ? calculateDaysDiff(job.createdAt, currentLog.entryDate) : 0;
                   const benchmark = stageBenchmarks[stage];
                   
                   const isStageDelayed = daysInStage > (benchmark.avgDuration * 1.5);
                   const isEntryDelayed = entryDelay > (benchmark.avgEntryDelay * 1.3);
                   const isDelayed = isStageDelayed || isEntryDelayed;
                   
                   const lastStageLog = job.processHistory.length > 1 ? job.processHistory[job.processHistory.length - 2] : null;

                   return (
                    <div key={job.id} className={`bg-white p-4 rounded-lg shadow-sm border transition relative group ${job.isUrgent ? 'border-orange-500 ring-2 ring-orange-100 bg-orange-50/30' : isDelayed ? 'border-red-400 ring-1 ring-red-100 shadow-red-50' : 'border-slate-200 hover:shadow-md'}`}>
                      {/* Urgent & Delay Indicator */}
                      <div className="absolute -top-2 -left-2 flex gap-1 z-10">
                        {job.isUrgent && (
                          <div className="bg-orange-500 text-white p-1 rounded-full shadow-lg animate-bounce">
                            <Zap size={14} fill="white" />
                          </div>
                        )}
                        {isDelayed && (
                          <div className="bg-red-500 text-white p-1 rounded-full shadow-lg animate-pulse">
                            <AlertTriangle size={14} />
                          </div>
                        )}
                      </div>

                      {/* Line Badge & Toggle Urgent */}
                      <div className="absolute top-2 right-2 flex items-center gap-2">
                        <button 
                          onClick={() => onToggleUrgent(job.id)}
                          title={job.isUrgent ? "Mark as Normal" : "Mark as Urgent"}
                          className={`p-1 rounded-md transition ${job.isUrgent ? 'text-orange-600 bg-orange-100' : 'text-slate-300 hover:text-orange-400 hover:bg-orange-50'}`}
                        >
                          <Zap size={14} />
                        </button>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border border-slate-100 px-1 rounded">
                          {job.productionLine}
                        </span>
                      </div>

                      <div className="mb-2 pr-10">
                        <span className={`font-bold text-sm block ${job.isUrgent ? 'text-orange-700' : isDelayed ? 'text-red-700' : 'text-indigo-700'}`}>{job.jobId}</span>
                        <div className="flex items-center gap-2">
                           <span className="text-xs text-slate-500">{new Date(job.createdAt).toLocaleDateString()}</span>
                           {isDelayed && (
                             <span className="text-[9px] font-bold text-red-500 flex items-center gap-0.5">
                                <Clock size={10} />
                                {isStageDelayed ? 'Slow Progress' : 'Late Entry'}
                             </span>
                           )}
                           {job.isUrgent && (
                             <span className="text-[9px] font-black text-orange-600 uppercase tracking-tighter">URGENT</span>
                           )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2 mb-3">
                        {job.jobImageUrl && (
                          <div className="w-10 h-10 rounded bg-slate-100 overflow-hidden flex-shrink-0">
                            <img src={job.jobImageUrl} alt="job" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-slate-800 leading-tight">{job.styleName}</p>
                          <div className="flex flex-wrap items-center gap-1 mt-1">
                             <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">Total: {job.quantity}</span>
                             {isCutting && <span className="text-[10px] bg-indigo-50 px-1.5 py-0.5 rounded text-indigo-600">Issued: {job.fabricMetersIssued}m</span>}
                          </div>
                          <div className="mt-1 flex flex-wrap gap-1">
                             {job.sleeveDetails && <span className="text-[9px] border px-1 rounded text-slate-500">{job.sleeveDetails}</span>}
                             {job.patternOption && <span className="text-[9px] border px-1 rounded text-slate-500">{job.patternOption}</span>}
                          </div>
                        </div>
                      </div>

                      {lastStageLog?.notes && (
                        <div className="bg-amber-50 border border-amber-100 rounded p-2 mb-3 text-[10px] text-amber-800">
                          <div className="flex items-center gap-1 font-bold mb-1">
                             <StickyNote size={10} />
                             Note from {lastStageLog.stage}:
                          </div>
                          <p className="italic">"{lastStageLog.notes}"</p>
                        </div>
                      )}

                      {isCutting && (
                        <div className="bg-indigo-50 rounded p-2 mb-3 border border-indigo-100 text-xs space-y-2">
                          <p className="font-bold text-indigo-800 border-b border-indigo-200 pb-1 mb-1">Post Cutting Approval</p>
                          <div className="flex justify-between items-center gap-2">
                            <label className="text-slate-600">Actual Average:</label>
                            <input 
                              type="number" 
                              step="0.01"
                              placeholder="0.00"
                              className="w-16 px-1 py-0.5 border border-indigo-200 rounded text-right"
                              value={cuttingReports[job.id]?.actualAverage || ''}
                              onChange={(e) => handleCuttingReportChange(job.id, 'actualAverage', e.target.value)}
                            />
                          </div>
                          <div className="flex justify-between items-center gap-2">
                            <label className="text-slate-600">Layer Color:</label>
                            <input 
                              type="text" 
                              placeholder="e.g. Navy"
                              className="w-24 px-1 py-0.5 border border-indigo-200 rounded"
                              value={cuttingReports[job.id]?.layerColor || ''}
                              onChange={(e) => handleCuttingReportChange(job.id, 'layerColor', e.target.value)}
                            />
                          </div>
                          
                          <div className="pt-2 border-t border-indigo-200">
                             <p className="mb-1 text-slate-600 font-semibold">Actual Output Sizes:</p>
                             <div className="grid grid-cols-5 gap-1">
                                {(['s', 'm', 'l', 'xl', 'xxl'] as const).map(size => (
                                    <div key={size} className="flex flex-col items-center">
                                        <span className="text-[9px] text-slate-500 uppercase">{size}</span>
                                        <input 
                                          type="number"
                                          className="w-full text-center border border-indigo-200 rounded py-0.5 text-[10px] focus:border-indigo-500 outline-none"
                                          placeholder="0"
                                          value={cuttingSizes[job.id]?.[size] || ''}
                                          onChange={(e) => handleCuttingSizeChange(job.id, size, e.target.value)}
                                        />
                                    </div>
                                ))}
                             </div>
                          </div>
                          
                          <div>
                            <label className="text-slate-600 block mb-1 mt-2">Fabric Defects:</label>
                            <input 
                              type="text" 
                              placeholder="Describe defects..."
                              className="w-full px-1 py-0.5 border border-indigo-200 rounded"
                              value={cuttingReports[job.id]?.fabricDefects || ''}
                              onChange={(e) => handleCuttingReportChange(job.id, 'fabricDefects', e.target.value)}
                            />
                          </div>
                        </div>
                      )}

                      <div className="bg-slate-50 rounded p-2 mb-3 border border-slate-100">
                        <div className="flex justify-between text-xs mb-1 text-slate-500">
                          <span>Inward (WIP):</span>
                          <span className="font-semibold text-slate-700">{inputQty} pcs</span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <label className="text-xs font-bold text-indigo-600">Output:</label>
                          <input 
                            type="number" 
                            disabled={isCutting}
                            className={`w-20 px-2 py-1 text-sm border border-indigo-200 rounded focus:border-indigo-500 outline-none text-right font-semibold ${isCutting ? 'bg-slate-100 text-slate-500' : 'bg-white'}`}
                            value={outputQty}
                            onChange={(e) => handleQuantityChange(job.id, e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="mb-3">
                         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Process Notes</label>
                         <textarea
                           className="w-full text-xs p-2 border border-slate-200 rounded focus:border-indigo-500 outline-none h-14 resize-none"
                           placeholder="Add observations..."
                           value={stageNotes[job.id] || ''}
                           onChange={(e) => setStageNotes(prev => ({ ...prev, [job.id]: e.target.value }))}
                         />
                      </div>
                      
                      <button
                        onClick={() => handleNextStage(job, Number(outputQty))}
                        className={`w-full py-2 text-xs font-semibold rounded flex items-center justify-center gap-1 transition ${
                          isQC 
                            ? 'bg-amber-100 hover:bg-amber-200 text-amber-800'
                            : isDispatch
                            ? 'bg-green-600 hover:bg-green-700 text-white shadow-sm shadow-green-200'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200'
                        }`}
                      >
                        {isQC ? (
                          <>
                            <ShieldCheck size={12} />
                            QC Approve & Dispatch
                          </>
                        ) : isDispatch ? (
                          <>
                            <Truck size={12} />
                            Confirm Dispatch & Complete
                          </>
                        ) : isCutting ? (
                          <>
                            Approve Cutting & Next
                            <ArrowRight size={12} />
                          </>
                        ) : (
                          <>
                            Push to Next Stage
                            <ArrowRight size={12} />
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
                {stageJobs.length === 0 && (
                  <div className="text-center py-12 opacity-40 text-sm italic flex flex-col items-center">
                    <span className="mb-2">—</span>
                    No WIP
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {completedJobs.length > 0 && (
        <div className="mt-12">
           <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
             <CheckCircle2 className="text-green-600" />
             Dispatched / Completed Jobs
           </h3>
           <div className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden">
             <div className="overflow-x-auto">
               <table className="w-full text-left min-w-[800px]">
                 <thead className="bg-slate-50 text-slate-600 font-semibold text-sm border-b border-slate-200">
                   <tr>
                     <th className="p-4">Line</th>
                     <th className="p-4">Job ID</th>
                     <th className="p-4">Style</th>
                     <th className="p-4">Final Qty</th>
                     <th className="p-4">Specs</th>
                     <th className="p-4">Cutting Report</th>
                     <th className="p-4">Lead Time</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100 bg-white">
                   {completedJobs.map(job => {
                      const start = new Date(job.createdAt).getTime();
                      const endLog = job.processHistory.find(h => h.stage === ProcessStage.DISPATCH && h.completionDate);
                      const end = endLog?.completionDate ? new Date(endLog.completionDate).getTime() : Date.now();
                      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
                      const finalQty = job.processHistory[job.processHistory.length - 1]?.processedQuantity || job.quantity;

                     return (
                       <tr key={job.id} className="text-sm hover:bg-slate-50">
                         <td className="p-4 text-slate-500 font-mono text-xs">{job.productionLine}</td>
                         <td className="p-4 font-medium text-slate-700">
                           <div className="flex items-center gap-2">
                             {job.isUrgent && <Zap size={12} className="text-orange-500" fill="currentColor" />}
                             {job.jobId}
                           </div>
                         </td>
                         <td className="p-4 text-slate-600">{job.styleName}</td>
                         <td className="p-4 text-slate-800 font-semibold">{finalQty}</td>
                         <td className="p-4 text-xs text-slate-500">
                            <div>Sleeve: {job.sleeveDetails}</div>
                            <div>Label: {job.labelDetails}</div>
                         </td>
                         <td className="p-4">
                           {job.cuttingReport ? (
                              <div className="text-xs text-slate-500">
                                <p>Avg: {job.cuttingReport.actualAverage}m</p>
                                <p>Color: {job.cuttingReport.layerColor}</p>
                              </div>
                           ) : <span className="text-slate-300">-</span>}
                         </td>
                         <td className="p-4">
                           <span className="flex items-center gap-1 text-indigo-600 font-medium">
                             <Clock size={14} />
                             {days} days
                           </span>
                         </td>
                       </tr>
                     );
                   })}
                 </tbody>
               </table>
             </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ProductionFloor;
