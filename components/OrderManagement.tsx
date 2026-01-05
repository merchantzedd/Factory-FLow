import React, { useState } from 'react';
import { PurchaseOrder, Job } from '../types';
import { ShoppingBag, Calendar, Truck, CheckCircle2, AlertCircle, Plus, Clock } from 'lucide-react';

interface OrderManagementProps {
  orders: PurchaseOrder[];
  jobs: Job[];
  onAddOrder: (po: PurchaseOrder) => void;
  onUpdateOrder: (po: PurchaseOrder) => void;
}

const OrderManagement: React.FC<OrderManagementProps> = ({ orders, jobs, onAddOrder, onUpdateOrder }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newOrder, setNewOrder] = useState<Partial<PurchaseOrder>>({
    poNumber: '',
    clientName: '',
    styleName: '',
    totalQuantity: 0,
    deadline: '',
    expectedDeliveryDate: '',
    fabricStatus: 'Pending',
    fabricOrderDate: '',
    fabricExpectedDate: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newOrder.poNumber && newOrder.clientName && newOrder.totalQuantity) {
      const order: PurchaseOrder = {
        id: Date.now().toString(),
        poNumber: newOrder.poNumber,
        clientName: newOrder.clientName,
        styleName: newOrder.styleName || 'N/A',
        totalQuantity: Number(newOrder.totalQuantity),
        deadline: newOrder.deadline || '',
        expectedDeliveryDate: newOrder.expectedDeliveryDate || newOrder.deadline || '',
        fabricStatus: newOrder.fabricStatus as 'Pending' | 'Ordered' | 'Received',
        fabricOrderDate: newOrder.fabricOrderDate,
        fabricExpectedDate: newOrder.fabricExpectedDate,
        status: 'Planning'
      };
      onAddOrder(order);
      setIsFormOpen(false);
      setNewOrder({ 
        poNumber: '', 
        clientName: '', 
        totalQuantity: 0, 
        deadline: '', 
        expectedDeliveryDate: '', 
        fabricStatus: 'Pending',
        fabricOrderDate: '',
        fabricExpectedDate: ''
      });
    }
  };

  const getOrderStats = (poId: string) => {
    const poJobs = jobs.filter(j => j.poId === poId);
    const inProcess = poJobs.filter(j => !j.isCompleted).reduce((sum, j) => sum + j.quantity, 0);
    const shipped = poJobs.filter(j => j.isCompleted).reduce((sum, j) => {
      const lastPart = j.processHistory[j.processHistory.length - 1];
      return sum + (lastPart?.processedQuantity || j.quantity);
    }, 0);
    return { inProcess, shipped };
  };

  const toggleFabricStatus = (order: PurchaseOrder) => {
    const nextStatus = 
      order.fabricStatus === 'Pending' ? 'Ordered' :
      order.fabricStatus === 'Ordered' ? 'Received' : 'Pending';
    
    onUpdateOrder({ ...order, fabricStatus: nextStatus });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
           <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
             <ShoppingBag className="text-indigo-600" />
             Purchase Order Management
           </h2>
           <p className="text-slate-500 text-sm">Track POs from Fabric Ordering to Shipment.</p>
        </div>
        <button
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition shadow-sm"
        >
          <Plus size={20} />
          <span>New PO</span>
        </button>
      </div>

      {isFormOpen && (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 animate-in fade-in slide-in-from-top-4">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 text-slate-800">
             <Plus className="text-indigo-600" size={18} />
             Create New Purchase Order
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">PO Number</label>
              <input type="text" required placeholder="PO-2024-..." className="block w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:border-indigo-500 outline-none" value={newOrder.poNumber} onChange={e => setNewOrder({...newOrder, poNumber: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Client Name</label>
              <input type="text" required placeholder="Client Ltd." className="block w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:border-indigo-500 outline-none" value={newOrder.clientName} onChange={e => setNewOrder({...newOrder, clientName: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Style Reference</label>
              <input type="text" placeholder="e.g. Classic Blazer" className="block w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:border-indigo-500 outline-none" value={newOrder.styleName} onChange={e => setNewOrder({...newOrder, styleName: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Total Quantity</label>
              <input type="number" required placeholder="0" className="block w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:border-indigo-500 outline-none" value={newOrder.totalQuantity || ''} onChange={e => setNewOrder({...newOrder, totalQuantity: Number(e.target.value)})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1 text-red-500">Contractual Deadline</label>
              <input type="date" required className="block w-full rounded-lg border border-red-200 px-3 py-2.5 focus:border-red-500 outline-none" value={newOrder.deadline} onChange={e => setNewOrder({...newOrder, deadline: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1 text-indigo-600">Expected Delivery</label>
              <input type="date" className="block w-full rounded-lg border border-indigo-200 px-3 py-2.5 focus:border-indigo-500 outline-none" value={newOrder.expectedDeliveryDate} onChange={e => setNewOrder({...newOrder, expectedDeliveryDate: e.target.value})} />
            </div>

            <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
               <div className="md:col-span-3">
                 <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                   <Truck size={14} />
                   Procurement Tracking
                 </h4>
               </div>
               <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fabric Status</label>
                  <select className="block w-full rounded-lg border border-slate-300 px-3 py-2.5 bg-white focus:border-indigo-500 outline-none" value={newOrder.fabricStatus} onChange={e => setNewOrder({...newOrder, fabricStatus: e.target.value as any})}>
                    <option value="Pending">Pending</option>
                    <option value="Ordered">Ordered</option>
                    <option value="Received">Received</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fabric Order Date</label>
                  <input type="date" className="block w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:border-indigo-500 outline-none" value={newOrder.fabricOrderDate} onChange={e => setNewOrder({...newOrder, fabricOrderDate: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fabric Expected Date</label>
                  <input type="date" className="block w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:border-indigo-500 outline-none" value={newOrder.fabricExpectedDate} onChange={e => setNewOrder({...newOrder, fabricExpectedDate: e.target.value})} />
                </div>
            </div>
            
            <div className="md:col-span-3 flex justify-end gap-3 mt-4 pt-4 border-t">
               <button type="button" onClick={() => setIsFormOpen(false)} className="px-5 py-2.5 text-slate-600 font-medium hover:text-slate-800">Cancel</button>
               <button type="submit" className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold shadow-md shadow-indigo-100">Save Purchase Order</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5">
        {orders.map(order => {
          const { inProcess, shipped } = getOrderStats(order.id);
          const progress = order.totalQuantity > 0 ? Math.min(100, Math.round(((shipped) / order.totalQuantity) * 100)) : 0;
          const deadlineDate = new Date(order.deadline);
          const today = new Date();
          const daysLeft = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          return (
            <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row gap-8 hover:shadow-lg transition-all">
               {/* Left: Info Section */}
               <div className="flex-[1.5] space-y-4">
                 <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full border uppercase tracking-widest">Active PO</span>
                        <h3 className="font-extrabold text-xl text-slate-800">{order.poNumber}</h3>
                      </div>
                      <p className="text-sm font-semibold text-slate-500">{order.clientName} • <span className="text-indigo-600">{order.styleName}</span></p>
                    </div>
                    <div className="text-right">
                       <div className={`px-4 py-1.5 rounded-xl text-xs font-extrabold border shadow-sm ${
                         daysLeft < 5 ? 'bg-red-50 text-red-700 border-red-200 animate-pulse' : 'bg-green-50 text-green-700 border-green-200'
                       }`}>
                         {daysLeft < 0 ? 'OVERDUE' : `${daysLeft} DAYS LEFT`}
                       </div>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                       <span className="text-[10px] font-bold text-slate-400 uppercase">Contractual Deadline</span>
                       <div className="flex items-center gap-2 text-sm text-slate-700 font-semibold bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                          <Calendar size={14} className="text-slate-400" />
                          {order.deadline}
                       </div>
                    </div>
                    <div className="flex flex-col gap-1">
                       <span className="text-[10px] font-bold text-slate-400 uppercase">Exp. Delivery</span>
                       <div className="flex items-center gap-2 text-sm text-indigo-700 font-bold bg-indigo-50 px-3 py-2 rounded-lg border border-indigo-100">
                          <Clock size={14} className="text-indigo-400" />
                          {order.expectedDeliveryDate || order.deadline}
                       </div>
                    </div>
                 </div>

                 {/* Fabric Status Quick Toggle & Dates */}
                 <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
                   <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fabric Pipeline</span>
                    <button 
                      onClick={() => toggleFabricStatus(order)}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all ${
                        order.fabricStatus === 'Received' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-100' :
                        order.fabricStatus === 'Ordered' ? 'bg-amber-500 text-white shadow-md shadow-amber-100' : 
                        'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {order.fabricStatus === 'Received' ? <CheckCircle2 size={14} /> :
                        order.fabricStatus === 'Ordered' ? <Truck size={14} /> : 
                        <AlertCircle size={14} />}
                      {order.fabricStatus}
                    </button>
                   </div>
                   
                   {(order.fabricOrderDate || order.fabricExpectedDate) && (
                     <div className="flex gap-4 text-[10px] bg-slate-50 p-2 rounded-lg border border-slate-100">
                        {order.fabricOrderDate && (
                          <div className="flex items-center gap-1">
                            <span className="text-slate-400 font-bold">ORDERED:</span>
                            <span className="text-slate-700 font-semibold">{order.fabricOrderDate}</span>
                          </div>
                        )}
                        {order.fabricExpectedDate && (
                          <div className="flex items-center gap-1 border-l pl-4 border-slate-200">
                            <span className="text-amber-600 font-bold uppercase tracking-tight">Expected Arrival:</span>
                            <span className="text-amber-700 font-bold">{order.fabricExpectedDate}</span>
                          </div>
                        )}
                     </div>
                   )}
                 </div>
               </div>

               {/* Right: Progress Section */}
               <div className="flex-1 bg-slate-50 rounded-2xl p-6 border border-slate-100 flex flex-col justify-center">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-slate-500 uppercase">Shipment Readiness</span>
                    <span className="text-lg font-black text-indigo-600">{progress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3 mb-6 overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-500 to-indigo-700 h-full rounded-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-center">
                      <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Target</p>
                      <p className="font-black text-slate-800 text-lg leading-none">{order.totalQuantity}</p>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-center">
                      <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">In WIP</p>
                      <p className="font-black text-amber-600 text-lg leading-none">{inProcess}</p>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-center">
                      <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Shipped</p>
                      <p className="font-black text-emerald-600 text-lg leading-none">{shipped}</p>
                    </div>
                  </div>
               </div>
            </div>
          );
        })}
        {orders.length === 0 && (
          <div className="text-center py-20 text-slate-400 bg-white rounded-3xl border-2 border-slate-100 border-dashed">
            <ShoppingBag size={64} className="mx-auto mb-4 opacity-20" />
            <p className="font-medium text-lg">No active Purchase Orders currently.</p>
            <button onClick={() => setIsFormOpen(true)} className="mt-4 text-indigo-600 font-bold hover:underline">Create your first PO</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderManagement;