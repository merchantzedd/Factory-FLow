import React, { useState, useEffect } from 'react';
import { LayoutDashboard, ShoppingBasket, ClipboardCheck, Factory, BarChart3, Settings, Users, ShoppingBag, BrainCircuit, Menu, X, FileText, Moon, Sun } from 'lucide-react';
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
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('fs_dark_mode');
    return saved ? JSON.parse(saved) : false;
  });
  const [fabrics, setFabrics] = useState<FabricBatch[]>(INITIAL_FABRICS);
  const [jobs, setJobs] = useState<Job[]>(INITIAL_JOBS);
  const [attendance, setAttendance] = useState<AttendanceEntry[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('fs_dark_mode', JSON.stringify(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const navigationItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
    { id: 'planning', label: 'AI Plan', icon: BrainCircuit, color: 'text-purple-400', isAi: true },
    { id: 'fabric', label: 'Fabric', icon: ShoppingBasket },
    { id: 'issue', label: 'Issue', icon: ClipboardCheck },
    { id: 'production', label: 'Floor', icon: Factory },
    { id: 'attendance', label: 'Staff', icon: Users },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'analytics', label: 'BI', icon: BarChart3 },
  ];

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
      
      if (newStageStatus[sourceStage]) {
        newStageStatus[sourceStage] = {
          ...newStageStatus[sourceStage]!,
          output: Math.max(0, newStageStatus[sourceStage]!.output - qtyToRevert)
        };
      }
      
      if (nextStageName && newStageStatus[nextStageName]) {
        newStageStatus[nextStageName] = {
          ...newStageStatus[nextStageName]!,
          inward: Math.max(0, newStageStatus[nextStageName]!.inward - qtyToRevert)
        };
      }

      return { 
        ...job, 
        isCompleted: sourceStage === ProcessStage.DISPATCH ? false : job.isCompleted, 
        closure: sourceStage === ProcessStage.DISPATCH ? undefined : job.closure, 
        stageStatus: newStageStatus, 
        processHistory: job.processHistory.slice(0, -1) 
      };
    }));
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
              <div className="bg-indigo-600 dark:bg-indigo-700 text-white p-5 lg:p-6 rounded-[24px] lg:rounded-[32px] shadow-lg border border-indigo-500/20">
                <div className="flex justify-between items-center mb-3"><h3 className="font-bold text-indigo-100 uppercase text-[9px] tracking-widest">WIP Jobs</h3><Factory size={18} className="text-indigo-200" /></div>
                <p className="text-3xl lg:text-4xl font-black">{jobs.filter(j => !j.isCompleted).length}</p>
                <p className="text-[10px] text-indigo-200 mt-2 font-medium">Active Batches</p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-5 lg:p-6 rounded-[24px] lg:rounded-[32px] shadow-sm border border-slate-200 dark:border-slate-800 transition-all">
                 <div className="flex justify-between items-center mb-3"><h3 className="font-bold text-slate-400 dark:text-slate-500 uppercase text-[9px] tracking-widest">Inventory</h3><ShoppingBasket size={18} className="text-slate-300 dark:text-slate-600" /></div>
                <p className="text-3xl lg:text-4xl font-black text-slate-800 dark:text-slate-100">{fabrics.reduce((sum, f) => sum + f.meters, 0).toLocaleString()}<span className="text-xs text-slate-400 ml-1">m</span></p>
                <p className="text-[10px] text-slate-400 mt-2 font-medium">Ready Material</p>
              </div>
              <div className="bg-emerald-600 dark:bg-emerald-700 text-white p-5 lg:p-6 rounded-[24px] lg:rounded-[32px] shadow-lg border border-emerald-500/20">
                <div className="flex justify-between items-center mb-3"><h3 className="font-bold text-emerald-100 uppercase text-[9px] tracking-widest">Shipped</h3><ClipboardCheck size={18} className="text-emerald-200" /></div>
                <p className="text-3xl lg:text-4xl font-black">{jobs.filter(j => j.isCompleted).length}</p>
                <p className="text-[10px] text-emerald-200 mt-2 font-medium">Completed Jobs</p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-5 lg:p-6 rounded-[24px] lg:rounded-[32px] shadow-sm border border-slate-200 dark:border-slate-800 transition-all">
                <div className="flex justify-between items-center mb-3"><h3 className="font-bold text-slate-400 dark:text-slate-500 uppercase text-[9px] tracking-widest">Contracts</h3><ShoppingBag size={18} className="text-slate-300 dark:text-slate-600" /></div>
                <p className="text-3xl lg:text-4xl font-black text-slate-800 dark:text-slate-100">{orders.length}</p>
                <p className="text-[10px] text-slate-400 mt-2 font-medium">Pending Orders</p>
              </div>
            </div>
            <div className="mt-8"><Analytics jobs={jobs} fabrics={fabrics} attendance={attendance} /></div>
          </div>
        );
      case 'orders': return <OrderManagement orders={orders} jobs={jobs} onAddOrder={(o) => setOrders(p => [...p, o])} onUpdateOrder={(o) => setOrders(p => p.map(oi => oi.id === o.id ? o : oi))} />;
      case 'planning': return <SmartPlanning orders={orders} jobs={jobs} attendance={attendance} />;
      case 'fabric': return <FabricInward fabrics={fabrics} orders={orders} onAddFabric={(f) => setFabrics(p => [f, ...p])} onUpdateOrder={(o) => setOrders(p => p.map(oi => oi.id === o.id ? o : oi))} />;
      case 'issue': return <JobIssuance fabrics={fabrics} orders={orders} onIssueJob={(j) => setJobs(p => [j, ...p])} />;
      case 'production': return <ProductionFloor jobs={jobs} attendance={attendance} onUpdateStage={handleUpdateStage} onUndoStage={handleUndoStage} onToggleUrgent={(id) => setJobs(p => p.map(j => j.id === id ? {...j, isUrgent: !j.isUrgent} : j))} />;
      case 'attendance': return <AttendancePanel attendanceRecords={attendance} onUpdateAttendance={(e) => setAttendance(p => [...p.filter(a => !(a.date === e.date && a.line === e.line && a.stage === e.stage)), e])} />;
      case 'reports': return <ReportCenter jobs={jobs} orders={orders} />;
      case 'analytics': return <Analytics jobs={jobs} fabrics={fabrics} attendance={attendance} />;
      default: return null;
    }
  };

  return (
    <div className={`min-h-screen flex transition-colors duration-500 overflow-hidden ${isDarkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Sidebar - Desktop */}
      <aside className="w-72 bg-slate-900 dark:bg-black text-slate-400 flex-shrink-0 hidden lg:flex flex-col border-r border-slate-800 dark:border-slate-900">
        <div className="p-8 border-b border-slate-800 dark:border-slate-900">
           <div className="flex items-center gap-3 text-white font-black text-2xl tracking-tighter">
             <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-900/50">S</div>
             FIX STITCHES
           </div>
        </div>
        <nav className="flex-1 p-6 space-y-2 overflow-y-auto custom-scrollbar">
          {navigationItems.map(item => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id)} 
              className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all font-bold text-sm ${activeTab === item.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-900/20' : 'hover:bg-slate-800 dark:hover:bg-slate-900 hover:text-slate-200'}`}
            >
              <item.icon size={20} className={activeTab === item.id ? 'text-white' : item.color || 'text-slate-500'} /> 
              {item.label}
              {item.isAi && <span className="ml-auto bg-purple-500 text-[8px] px-1.5 py-0.5 rounded-full text-white uppercase animate-pulse">AI</span>}
            </button>
          ))}
        </nav>
        <div className="p-6 mt-auto border-t border-slate-800 dark:border-slate-900">
           <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="w-full flex items-center justify-between p-4 bg-slate-800 dark:bg-slate-900 rounded-2xl text-slate-400 hover:text-white transition group"
           >
              <div className="flex items-center gap-3 text-xs font-black uppercase tracking-widest">
                {isDarkMode ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
                <span>{isDarkMode ? 'Light' : 'Dark'}</span>
              </div>
              <div className={`w-10 h-6 rounded-full p-1 transition-colors ${isDarkMode ? 'bg-indigo-600' : 'bg-slate-600'}`}>
                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${isDarkMode ? 'translate-x-4' : ''}`}></div>
              </div>
           </button>
        </div>
      </aside>

      {/* Main Container */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Mobile Top Header */}
        <header className="lg:hidden bg-slate-900 dark:bg-black text-white p-4 flex justify-between items-center shadow-md z-30">
           <div className="font-black text-xl tracking-tighter flex items-center gap-2">
             <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">S</div> 
             FIX STITCHES
           </div>
           <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)} 
                className="p-2.5 bg-slate-800 rounded-xl text-indigo-400 hover:scale-110 active:scale-95 transition"
              >
                 {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
                className="p-2.5 bg-slate-800 rounded-xl text-indigo-400 hover:scale-110 active:scale-95 transition"
              >
                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
           </div>
        </header>

        {/* Mobile Bottom Navigation Bar */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-4 py-3 flex justify-between items-center z-40 shadow-[0_-8px_30px_rgba(0,0,0,0.1)]">
           {[
             { id: 'dashboard', icon: LayoutDashboard, label: 'Home' },
             { id: 'orders', icon: ShoppingBag, label: 'Orders' },
             { id: 'fabric', icon: ShoppingBasket, label: 'Fabric' },
             { id: 'issue', icon: ClipboardCheck, label: 'Issue' },
             { id: 'production', icon: Factory, label: 'Floor' },
           ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center gap-1 transition-all ${activeTab === item.id ? 'text-indigo-600 scale-110' : 'text-slate-400 dark:text-slate-500'}`}
              >
                <item.icon size={20} strokeWidth={activeTab === item.id ? 2.5 : 2} />
                <span className="text-[9px] font-black uppercase tracking-tight">{item.label}</span>
              </button>
           ))}
        </nav>

        {/* Mobile Fullscreen Sidebar Overlay */}
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex animate-in fade-in duration-300">
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
            <div className="relative w-72 bg-slate-900 h-full p-6 flex flex-col shadow-2xl animate-in slide-in-from-left duration-500">
               <div className="flex justify-between items-center mb-8 pb-6 border-b border-slate-800">
                  <div className="font-black text-white text-xl flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">S</div>
                    Command Center
                  </div>
                  <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400 p-2 hover:bg-slate-800 rounded-xl"><X size={20} /></button>
               </div>
               <div className="flex-1 space-y-2 overflow-y-auto no-scrollbar">
                 {navigationItems.map(item => (
                   <button 
                     key={item.id}
                     onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }} 
                     className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold text-sm ${activeTab === item.id ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-800'}`}
                   >
                     <item.icon size={22} className={activeTab === item.id ? 'text-white' : item.color || 'text-slate-500'} /> 
                     {item.label}
                   </button>
                 ))}
               </div>
               <div className="mt-auto pt-6 border-t border-slate-800 text-[10px] font-black text-slate-500 text-center uppercase tracking-widest">
                 v2.4 Factory Native
               </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-4 lg:p-10 custom-scrollbar dark:bg-slate-950 transition-colors duration-500">
          <div className="max-w-7xl mx-auto pb-24 lg:pb-0">
             {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;