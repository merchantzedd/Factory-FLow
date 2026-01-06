import React, { useState } from 'react';
import { LayoutDashboard, ShoppingBasket, ClipboardCheck, Factory, BarChart3, Settings, Users, ShoppingBag, BrainCircuit, Menu, X, FileText } from 'lucide-react';
import { AttendanceEntry, FabricBatch, Job, ProcessStage, CuttingReport, PurchaseOrder, JobClosureData } from './types';
import { INITIAL_FABRICS, INITIAL_JOBS, STAGES_ORDERED } from './constants';
import FabricInward from './components/FabricInward';
import JobIssuance from './components/JobIssuance';
import ProductionFloor from './components/ProductionFloor';
import Analytics from './components/Analytics';
import AttendancePanel from './components/AttendancePanel';
import OrderManagement from './components/OrderManagement';
import SmartPlanning from './components/SmartPlanning';
import ReportCenter from './components/ReportCenter';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [fabrics, setFabrics] = useState<FabricBatch[]>(INITIAL_FABRICS);
  const [jobs, setJobs] = useState<Job[]>(INITIAL_JOBS);
  const [attendance, setAttendance] = useState<AttendanceEntry[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'orders', label: 'PO Mgmt', icon: ShoppingBag },
    { id: 'planning', label: 'AI Plan', icon: BrainCircuit, color: 'text-purple-400', isAi: true },
    { id: 'fabric', label: 'Fabric', icon: ShoppingBasket },
    { id: 'issue', label: 'Issue', icon: ClipboardCheck },
    { id: 'production', label: 'Floor', icon: Factory },
    { id: 'attendance', label: 'Staff', icon: Users },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'analytics', label: 'BI', icon: BarChart3 },
  ];

  const handleAddFabric = (newFabric: FabricBatch) => {
    setFabrics(prev => [newFabric, ...prev]);
  };

  const handleIssueJob = (newJob: Job) => {
    setJobs(prev => [newJob, ...prev]);
    if (newJob.poId) {
      setOrders(prev => prev.map(o => o.id === newJob.poId ? { ...o, status: 'Production' } : o));
    }
  };

  const handleAddOrder = (newOrder: PurchaseOrder) => {
    setOrders(prev => [newOrder, ...prev]);
  };

  const handleUpdateOrder = (updatedOrder: PurchaseOrder) => {
    setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
  };

  const handleUpdateAttendance = (updatedEntry: AttendanceEntry) => {
    setAttendance(prev => {
      const filtered = prev.filter(a => 
        !(a.date === updatedEntry.date && a.line === updatedEntry.line && a.stage === updatedEntry.stage)
      );
      return [...filtered, updatedEntry];
    });
  };

  const handleToggleUrgent = (jobId: string) => {
    setJobs(currentJobs => currentJobs.map(job => 
      job.id === jobId ? { ...job, isUrgent: !job.isUrgent } : job
    ));
  };

  const handleUpdateStage = (
    jobId: string, 
    newOutputQty: number,
    sourceStage: ProcessStage,
    cuttingReport?: CuttingReport, 
    notes?: string, 
    targetStage?: ProcessStage,
    closureData?: JobClosureData
  ) => {
    setJobs(currentJobs => currentJobs.map(job => {
      if (job.id !== jobId) return job;
      const now = new Date().toISOString();
      const currentStageStatus = job.stageStatus[sourceStage] || { inward: 0, output: 0 };
      const updatedSourceOutput = currentStageStatus.output + newOutputQty;
      const nextStageIndex = STAGES_ORDERED.indexOf(sourceStage) + 1;
      let nextStageName = STAGES_ORDERED[nextStageIndex];
      if (targetStage) nextStageName = targetStage;

      const nextStageStatus = job.stageStatus[nextStageName] || { inward: 0, output: 0 };
      const newStageStatus = {
        ...job.stageStatus,
        [sourceStage]: { ...currentStageStatus, output: updatedSourceOutput }
      };

      if (nextStageName && !closureData) {
        newStageStatus[nextStageName] = {
          ...nextStageStatus,
          inward: nextStageStatus.inward + newOutputQty
        };
      }

      let updatedJob: Job = { 
        ...job, 
        stageStatus: newStageStatus,
        processHistory: [...job.processHistory, { stage: sourceStage, entryDate: now, completionDate: updatedSourceOutput >= currentStageStatus.inward ? now : undefined, processedQuantity: newOutputQty, notes }],
        currentStage: nextStageName || job.currentStage
      };

      if (cuttingReport) updatedJob.cuttingReport = cuttingReport;
      if (closureData) {
        updatedJob.closure = closureData;
        updatedJob.isCompleted = true;
      }
      return updatedJob;
    }));
  };

  const handleUndoStage = (jobId: string) => {
    setJobs(currentJobs => currentJobs.map(job => {
      if (job.id !== jobId || job.processHistory.length === 0) return job;
      const lastLog = job.processHistory[job.processHistory.length - 1];
      const sourceStage = lastLog.stage;
      const qtyToRevert = lastLog.processedQuantity;
      const nextStageIndex = STAGES_ORDERED.indexOf(sourceStage) + 1;
      const nextStageName = STAGES_ORDERED[nextStageIndex];
      const newStageStatus = { ...job.stageStatus };
      if (newStageStatus[sourceStage]) newStageStatus[sourceStage]!.output = Math.max(0, newStageStatus[sourceStage]!.output - qtyToRevert);
      if (nextStageName && newStageStatus[nextStageName]) newStageStatus[nextStageName]!.inward = Math.max(0, newStageStatus[nextStageName]!.inward - qtyToRevert);
      return { ...job, isCompleted: sourceStage === ProcessStage.DISPATCH ? false : job.isCompleted, closure: sourceStage === ProcessStage.DISPATCH ? undefined : job.closure, stageStatus: newStageStatus, processHistory: job.processHistory.slice(0, -1) };
    }));
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6 pb-24 lg:pb-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-indigo-600 text-white p-6 rounded-3xl shadow-lg">
                <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-indigo-100 uppercase text-[10px] tracking-widest">Active Production</h3><Factory className="text-indigo-200" /></div>
                <p className="text-4xl font-black">{jobs.filter(j => !j.isCompleted).length}</p>
                <p className="text-xs text-indigo-200 mt-2 font-medium">Live on floor</p>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                 <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-slate-400 uppercase text-[10px] tracking-widest">Fabric Assets</h3><ShoppingBasket className="text-slate-300" /></div>
                <p className="text-4xl font-black text-slate-800">{fabrics.reduce((sum, f) => sum + f.meters, 0).toLocaleString()}<span className="text-sm text-slate-400 ml-1">mtrs</span></p>
                <p className="text-xs text-slate-400 mt-2 font-medium">Available Inventory</p>
              </div>
              <div className="bg-emerald-600 text-white p-6 rounded-3xl shadow-lg">
                <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-emerald-100 uppercase text-[10px] tracking-widest">Shipped Volume</h3><ClipboardCheck className="text-emerald-200" /></div>
                <p className="text-4xl font-black">{jobs.filter(j => j.isCompleted).length}</p>
                <p className="text-xs text-emerald-200 mt-2 font-medium">Orders Completed</p>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-slate-400 uppercase text-[10px] tracking-widest">Pipeline POs</h3><ShoppingBag className="text-slate-300" /></div>
                <p className="text-4xl font-black text-slate-800">{orders.length}</p>
                <p className="text-xs text-slate-400 mt-2 font-medium">Contracted Units</p>
              </div>
            </div>
            <div className="mt-8"><Analytics jobs={jobs} /></div>
          </div>
        );
      case 'orders': return <OrderManagement orders={orders} jobs={jobs} onAddOrder={handleAddOrder} onUpdateOrder={handleUpdateOrder} />;
      case 'planning': return <SmartPlanning orders={orders} jobs={jobs} attendance={attendance} />;
      case 'fabric': return <FabricInward fabrics={fabrics} orders={orders} onAddFabric={handleAddFabric} onUpdateOrder={handleUpdateOrder} />;
      case 'issue': return <JobIssuance fabrics={fabrics} orders={orders} onIssueJob={handleIssueJob} />;
      case 'production': return <ProductionFloor jobs={jobs} attendance={attendance} onUpdateStage={handleUpdateStage} onUndoStage={handleUndoStage} onToggleUrgent={handleToggleUrgent} />;
      case 'attendance': return <AttendancePanel attendanceRecords={attendance} onUpdateAttendance={handleUpdateAttendance} />;
      case 'reports': return <ReportCenter jobs={jobs} orders={orders} />;
      case 'analytics': return <Analytics jobs={jobs} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 overflow-hidden">
      {/* Sidebar - Visible on Desktop */}
      <aside className="w-72 bg-slate-900 text-slate-400 flex-shrink-0 hidden lg:flex flex-col">
        <div className="p-8 border-b border-slate-800">
           <div className="flex items-center gap-3 text-white font-black text-2xl tracking-tighter">
             <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-900/50">F</div>
             FactoryFlow
           </div>
        </div>
        <nav className="flex-1 p-6 space-y-2 overflow-y-auto custom-scrollbar">
          {navigationItems.map(item => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id)} 
              className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all font-bold text-sm ${activeTab === item.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-900/20' : 'hover:bg-slate-800 hover:text-slate-200'}`}
            >
              <item.icon size={20} className={activeTab === item.id ? 'text-white' : item.color || 'text-slate-500'} /> 
              {item.label}
              {item.isAi && <span className="ml-auto bg-purple-500 text-[8px] px-1.5 py-0.5 rounded-full text-white uppercase animate-pulse">AI</span>}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Container */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Mobile Header */}
        <header className="lg:hidden bg-slate-900 text-white p-4 flex justify-between items-center shadow-md z-30">
           <div className="font-black text-xl tracking-tighter flex items-center gap-2">
             <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">F</div> 
             FactoryFlow
           </div>
           <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 bg-slate-800 rounded-xl text-indigo-400"
           >
             {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
           </button>
        </header>

        {/* Mobile Navigation Bar (Bottom) - Essential for quick access */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 py-2 flex justify-around items-center z-40 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
           {navigationItems.slice(0, 5).map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${activeTab === item.id ? 'text-indigo-600' : 'text-slate-400'}`}
              >
                <item.icon size={20} className={activeTab === item.id ? 'text-indigo-600' : ''} />
                <span className="text-[10px] font-bold">{item.label}</span>
              </button>
           ))}
           <button
             onClick={() => setIsMobileMenuOpen(true)}
             className={`flex flex-col items-center gap-1 p-2 rounded-xl text-slate-400`}
           >
             <Menu size={20} />
             <span className="text-[10px] font-bold">More</span>
           </button>
        </nav>

        {/* Mobile Sidebar Overlay */}
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
            <div className="relative w-72 bg-slate-900 h-full p-6 flex flex-col animate-in slide-in-from-left duration-300">
               <div className="flex justify-between items-center mb-8 pb-6 border-b border-slate-800">
                  <div className="font-black text-white text-xl flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">F</div>
                    Menu
                  </div>
                  <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400"><X size={24} /></button>
               </div>
               <div className="flex-1 space-y-2 overflow-y-auto">
                 {navigationItems.map(item => (
                   <button 
                     key={item.id}
                     onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }} 
                     className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl transition-all font-bold text-sm ${activeTab === item.id ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-800'}`}
                   >
                     <item.icon size={20} /> 
                     {item.label}
                   </button>
                 ))}
               </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-4 lg:p-10 custom-scrollbar">
          <div className="max-w-7xl mx-auto pb-20 lg:pb-0">
             {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;