import React, { useState } from 'react';
import { AttendanceEntry, Job, ProcessStage, CuttingReport } from '../types';
import { STAGES_ORDERED } from '../constants';
import { ArrowRight, CheckCircle2, Clock, ShieldCheck, Filter, Users, Scissors, Ruler, AlertTriangle } from 'lucide-react';

interface ProductionFloorProps {
  jobs: Job[];
  attendance: AttendanceEntry[];
  onUpdateStage: (jobId: string, outputQty: number, cuttingReport?: CuttingReport) => void;
}

const ProductionFloor: React.FC<ProductionFloorProps> = ({ jobs, attendance, onUpdateStage }) => {
  const [activeLine, setActiveLine] = useState<string>('All');
  
  // Local state to track input quantities for each job card
  const [inputQuantities, setInputQuantities] = useState<Record<string, number>>({});
  
  // Local state for Cutting Report inputs
  const [cuttingReports, setCuttingReports] = useState<Record<string, Partial<CuttingReport>>>({});

  const activeJobs = jobs.filter(j => !j.isCompleted);
  const completedJobs = jobs.filter(j => j.isCompleted);
  const today = new Date().toISOString().split('T')[0];

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

  const getJobOutputQuantity = (job: Job) => {
    // Default to the quantity received at this stage if not typed yet
    if (inputQuantities[job.id] !== undefined) return inputQuantities[job.id];
    
    // Find what was received in this stage
    const currentLog = job.processHistory.find(log => log.stage === job.currentStage);
    return currentLog?.processedQuantity || job.quantity;
  };

  const getJobInputQuantity = (job: Job) => {
    // The quantity processed in the specific stage log entry is what arrived here
    const currentLog = job.processHistory.find(log => log.stage === job.currentStage);
    return currentLog?.processedQuantity || job.quantity;
  };

  // Helper to get staff count for a stage
  const getStaffCount = (stage: ProcessStage) => {
    if (activeLine === 'All') return null; // Cannot aggregate easily across all lines visually in header
    const entry = attendance.find(r => r.date === today && r.line === activeLine && r.stage === stage);
    if (!entry) return 0;
    return entry.operators + entry.helpers + entry.manpower;
  };

  const handleNextStage = (job: Job, outputQty: number) => {
    let report: CuttingReport | undefined;

    if (job.currentStage === ProcessStage.CUTTING) {
       const inputs = cuttingReports[job.id];
       // Simple validation for cutting
       if (!inputs?.actualAverage || !inputs?.layerColor) {
         alert("Please enter Actual Average and Layer Color for post-cutting approval.");
         return;
       }
       report = {
         actualAverage: inputs.actualAverage,
         fabricDefects: inputs.fabricDefects || 'None',
         layerColor: inputs.layerColor,
         cuttingDate: today
       };
    }
    onUpdateStage(job.id, outputQty, report);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Production Floor Tracking</h2>
          <p className="text-sm text-slate-500">Manage WIP flow and view daily line strength.</p>
        </div>
        
        {/* Line Filters */}
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
      
      <div className="grid grid-cols-1 xl:grid-cols-8 gap-4 overflow-x-auto pb-6" style={{ minWidth: '100%' }}>
        {STAGES_ORDERED.map((stage, index) => {
          const stageJobs = filteredActiveJobs.filter((job) => job.currentStage === stage);
          const isQC = stage === ProcessStage.QC;
          const isCutting = stage === ProcessStage.CUTTING;
          const staffCount = getStaffCount(stage);
          
          return (
            <div key={stage} className={`min-w-[300px] rounded-xl p-3 flex flex-col h-[750px] border ${isQC ? 'bg-amber-50 border-amber-200' : 'bg-slate-100 border-slate-200'}`}>
              <div className={`font-bold mb-2 text-center border-b pb-2 ${isQC ? 'text-amber-800 border-amber-200' : 'text-slate-700 border-slate-200'}`}>
                 <div className="flex items-center justify-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${isQC ? 'bg-amber-200 text-amber-900' : 'bg-indigo-100 text-indigo-700'}`}>
                      {stageJobs.length} Jobs
                    </span>
                    {isQC && <ShieldCheck size={16} />}
                    {isCutting && <Scissors size={16} />}
                 </div>
                 <span className="text-sm">{stage}</span>
                 
                 {/* Attendance Badge */}
                 {activeLine !== 'All' && (
                   <div className="mt-1 flex justify-center">
                     <div className="bg-white/60 px-2 py-0.5 rounded text-[10px] font-normal flex items-center gap-1 text-slate-600">
                       <Users size={10} />
                       {staffCount} Staff Present
                     </div>
                   </div>
                 )}
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                {stageJobs.map((job) => {
                   const inputQty = getJobInputQuantity(job);
                   const outputQty = getJobOutputQuantity(job);
                   
                   return (
                    <div key={job.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition relative group">
                      {/* Line Badge */}
                      <div className="absolute top-2 right-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border border-slate-100 px-1 rounded">
                          {job.productionLine}
                        </span>
                      </div>

                      <div className="mb-2 pr-6">
                        <span className="font-bold text-indigo-700 text-sm block">{job.jobId}</span>
                        <span className="text-xs text-slate-500">{new Date(job.createdAt).toLocaleDateString()}</span>
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
                        </div>
                      </div>

                      {/* Post Cutting Approval Inputs */}
                      {isCutting && (
                        <div className="bg-indigo-50 rounded p-2 mb-3 border border-indigo-100 text-xs space-y-2">
                          <p className="font-bold text-indigo-800 border-b border-indigo-200 pb-1 mb-1">Post Cutting Approval</p>
                          <div className="flex justify-between items-center gap-2">
                            <label className="text-slate-600">Actual Avg:</label>
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
                            <label className="text-slate-600">Lay Color:</label>
                            <input 
                              type="text" 
                              placeholder="e.g. Navy"
                              className="w-24 px-1 py-0.5 border border-indigo-200 rounded"
                              value={cuttingReports[job.id]?.layerColor || ''}
                              onChange={(e) => handleCuttingReportChange(job.id, 'layerColor', e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="text-slate-600 block mb-1">Fabric Defects:</label>
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

                      {/* WIP Logic */}
                      <div className="bg-slate-50 rounded p-2 mb-3 border border-slate-100">
                        <div className="flex justify-between text-xs mb-1 text-slate-500">
                          <span>Inward (WIP):</span>
                          <span className="font-semibold text-slate-700">{inputQty} pcs</span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <label className="text-xs font-bold text-indigo-600">Output:</label>
                          <input 
                            type="number" 
                            className="w-20 px-2 py-1 text-sm border border-indigo-200 rounded focus:border-indigo-500 outline-none text-right font-semibold bg-white"
                            value={outputQty}
                            onChange={(e) => handleQuantityChange(job.id, e.target.value)}
                          />
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleNextStage(job, Number(outputQty))}
                        className={`w-full py-2 text-xs font-semibold rounded flex items-center justify-center gap-1 transition ${
                          isQC 
                            ? 'bg-amber-100 hover:bg-amber-200 text-amber-800'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200'
                        }`}
                      >
                        {isQC ? (
                          <>
                            <ShieldCheck size={12} />
                            QC Approve & Dispatch
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
             <table className="w-full text-left">
               <thead className="bg-slate-50 text-slate-600 font-semibold text-sm border-b border-slate-200">
                 <tr>
                   <th className="p-4">Line</th>
                   <th className="p-4">Job ID</th>
                   <th className="p-4">Style</th>
                   <th className="p-4">Final Qty</th>
                   <th className="p-4">Cutting Report</th>
                   <th className="p-4">Lead Time</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {completedJobs.map(job => {
                    const start = new Date(job.createdAt).getTime();
                    const endLog = job.processHistory.find(h => h.stage === ProcessStage.DISPATCH && h.completionDate);
                    const end = endLog?.completionDate ? new Date(endLog.completionDate).getTime() : Date.now();
                    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
                    const finalQty = job.processHistory[job.processHistory.length - 1]?.processedQuantity || job.quantity;

                   return (
                     <tr key={job.id} className="text-sm hover:bg-slate-50">
                       <td className="p-4 text-slate-500 font-mono text-xs">{job.productionLine}</td>
                       <td className="p-4 font-medium text-slate-700">{job.jobId}</td>
                       <td className="p-4 text-slate-600">{job.styleName}</td>
                       <td className="p-4 text-slate-800 font-semibold">{finalQty}</td>
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
      )}
    </div>
  );
};

export default ProductionFloor;
