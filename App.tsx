
import React, { useState } from 'react';
import { LayoutDashboard, ShoppingBasket, ClipboardCheck, Factory, BarChart3, Settings, Users, ShoppingBag } from 'lucide-react';
import { AttendanceEntry, FabricBatch, Job, ProcessStage, CuttingReport, PurchaseOrder } from './types';
import { INITIAL_FABRICS, INITIAL_JOBS, STAGES_ORDERED } from './constants';
import FabricInward from './components/FabricInward';
import JobIssuance from './components/JobIssuance';
import ProductionFloor from './components/ProductionFloor';
import Analytics from './components/Analytics';
import AttendancePanel from './components/AttendancePanel';
import OrderManagement from './components/OrderManagement';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [fabrics, setFabrics] = useState<FabricBatch[]>(INITIAL_FABRICS);
  const [jobs, setJobs] = useState<Job[]>(INITIAL_JOBS);
  const [attendance, setAttendance] = useState<AttendanceEntry[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);

  const handleAddFabric = (newFabric: FabricBatch) => {
    setFabrics(prev => [newFabric, ...prev]);
  };

  const handleIssueJob = (newJob: Job) => {
    setJobs(prev => [newJob, ...prev]);
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

  const handleUpdateStage = (jobId: string, outputQty: number, cuttingReport?: CuttingReport, notes?: string) => {
    setJobs(currentJobs => currentJobs.map(job => {
      if (job.id !== jobId) return job;

      const currentStageIndex = STAGES_ORDERED.indexOf(job.currentStage);
      const now = new Date().toISOString();

      // Update the completion date and notes of the current stage in history
      const updatedHistory = job.processHistory.map(log => {
        if (log.stage === job.currentStage && !log.completionDate) {
          return { ...log, completionDate: now, processedQuantity: outputQty, notes: notes };
        }
        return log;
      });

      const updatedJob = { ...job };
      if (cuttingReport) {
        updatedJob.cuttingReport = cuttingReport;
      }

      // If it's the last stage, mark job as completed
      if (currentStageIndex === STAGES_ORDERED.length - 1) {
        return {
          ...updatedJob,
          isCompleted: true,
          processHistory: updatedHistory
        };
      }

      // Move to next stage
      const nextStage = STAGES_ORDERED[currentStageIndex + 1];
      return {
        ...updatedJob,
        currentStage: nextStage,
        processHistory: [
          ...updatedHistory,
          {
            stage: nextStage,
            entryDate: now,
            processedQuantity: outputQty
          }
        ]
      };
    }));
  };

  // Dashboard Summary Metrics
  const activeJobsCount = jobs.filter(j => !j.isCompleted).length;
  const completedJobsCount = jobs.filter(j => j.isCompleted).length;
  const totalFabricMeters = fabrics.reduce((sum, f) => sum + f.meters, 0);

  const today = new Date().toISOString().split('T')[0];
  const staffPresentToday = attendance
    .filter(a => a.date === today)
    .reduce((sum, a) => sum + a.operators + a.helpers + a.manpower, 0);

  const pendingPOs = orders.filter(o => o.fabricStatus === 'Pending').length;

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-indigo-600 text-white p-6 rounded-xl shadow-lg">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-indigo-100">Jobs in Production</h3>
                  <Factory className="text-indigo-200" />
                </div>
                <p className="text-4xl font-bold">{activeJobsCount}</p>
                <p className="text-sm text-indigo-200 mt-2">Active on floor</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
                 <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-slate-500">Fabric Stock</h3>
                  <ShoppingBasket className="text-slate-400" />
                </div>
                <p className="text-4xl font-bold text-slate-800">{totalFabricMeters.toLocaleString()}<span className="text-lg text-slate-400 font-normal">m</span></p>
                <p className="text-sm text-slate-500 mt-2">Across {fabrics.length} batches</p>
              </div>
              <div className="bg-emerald-600 text-white p-6 rounded-xl shadow-lg">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-emerald-100">Jobs Dispatched</h3>
                  <ClipboardCheck className="text-emerald-200" />
                </div>
                <p className="text-4xl font-bold">{completedJobsCount}</p>
                <p className="text-sm text-emerald-200 mt-2">Completed this month</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-slate-500">Active POs</h3>
                  <ShoppingBag className="text-slate-400" />
                </div>
                <p className="text-4xl font-bold text-slate-800">{orders.length}</p>
                <p className="text-sm text-slate-500 mt-2">{pendingPOs} pending fabric</p>
              </div>
            </div>
            
            <div className="mt-8">
              <Analytics jobs={jobs} />
            </div>
          </div>
        );
      case 'orders':
        return <OrderManagement orders={orders} jobs={jobs} onAddOrder={handleAddOrder} onUpdateOrder={handleUpdateOrder} />;
      case 'fabric':
        return <FabricInward fabrics={fabrics} orders={orders} onAddFabric={handleAddFabric} onUpdateOrder={handleUpdateOrder} />;
      case 'issue':
        return <JobIssuance fabrics={fabrics} orders={orders} onIssueJob={handleIssueJob} />;
      case 'production':
        return <ProductionFloor jobs={jobs} attendance={attendance} onUpdateStage={handleUpdateStage} onToggleUrgent={handleToggleUrgent} />;
      case 'attendance':
        return <AttendancePanel attendanceRecords={attendance} onUpdateAttendance={handleUpdateAttendance} />;
      case 'analytics':
        return <Analytics jobs={jobs} />;
      default:
        return <div>Select a module</div>;
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex-shrink-0 hidden md:flex flex-col">
        <div className="p-6 border-b border-slate-800">
           <div className="flex items-center gap-2 text-white font-bold text-xl">
             <div className="w-8 h-8 bg-indigo-500 rounded flex items-center justify-center">F</div>
             FactoryFlow
           </div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800'}`}>
            <LayoutDashboard size={20} />
            Dashboard
          </button>
          <button onClick={() => setActiveTab('orders')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeTab === 'orders' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800'}`}>
            <ShoppingBag size={20} />
            PO Management
          </button>
          <button onClick={() => setActiveTab('fabric')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeTab === 'fabric' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800'}`}>
            <ShoppingBasket size={20} />
            Fabric Inward
          </button>
          <button onClick={() => setActiveTab('issue')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeTab === 'issue' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800'}`}>
            <ClipboardCheck size={20} />
            Job Issuance
          </button>
          <button onClick={() => setActiveTab('production')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeTab === 'production' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800'}`}>
            <Factory size={20} />
            Production Floor
          </button>
          <button onClick={() => setActiveTab('attendance')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeTab === 'attendance' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800'}`}>
            <Users size={20} />
            Attendance
          </button>
          <button onClick={() => setActiveTab('analytics')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeTab === 'analytics' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800'}`}>
            <BarChart3 size={20} />
            Analytics
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center shadow-md">
           <div className="font-bold">FactoryFlow</div>
           <button onClick={() => {}}><Settings size={20} /></button>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
             {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
