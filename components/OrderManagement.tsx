import React, { useState, useMemo } from 'react';
import { PurchaseOrder, Job, JobSizeBreakdown } from '../types';
import { 
  ShoppingBag, Calendar, Truck, CheckCircle2, AlertCircle, 
  Plus, Clock, User, Shield, Tag, Box, Scissors, 
  Layers, Package, ChevronRight, X, Info, Hash,
  ArrowRightCircle
} from 'lucide-react';

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
    buyerName: '',
    brandName: '',
    styleName: '',
    category: 'Formal',
    sleeveType: 'Full Sleeve',
    packingType: 'Board Pack',
    deadline: '',
    expectedDeliveryDate: '',
    fabricStatus: 'Pending',
    setSizes: { s: 0, m: 0, l: 0, xl: 0, xxl: 0 },
    unsetSizes: { s: 0, m: 0, l: 0, xl: 0, xxl: 0 }
  });

  const totals = useMemo(() => {
    const s = newOrder.setSizes || { s: 0, m: 0, l: 0, xl: 0, xxl: 0 };
    const u = newOrder.unsetSizes || { s: 0, m: 0, l: 0, xl: 0, xxl: 0 };
    
    const setTotal = s.s + s.m + s.l + s.xl + s.xxl;
    const unsetTotal = u.s + u.m + u.l + u.xl + u.xxl;
    
    return {
      set: setTotal,
      unset: unsetTotal,
      grand: setTotal + unsetTotal,
      combinedBreakdown: {
        s: s.s + u.s,
        m: s.m + u.m,
        l: s.l + u.l,
        xl: s.xl + u.xl,
        xxl: s.xxl + u.xxl
      }
    };
  }, [newOrder.setSizes, newOrder.unsetSizes]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newOrder.poNumber && newOrder.buyerName && totals.grand > 0) {
      const order: PurchaseOrder = {
        id: Date.now().toString(),
        poNumber: newOrder.poNumber!,
        buyerName: newOrder.buyerName!,
        brandName: newOrder.brandName || 'N/A',
        clientName: newOrder.buyerName!,
        styleName: newOrder.styleName || 'N/A',
        totalQuantity: totals.grand,
        sizeBreakdown: totals.combinedBreakdown,
        setSizes: newOrder.setSizes as JobSizeBreakdown,
        unsetSizes: newOrder.unsetSizes as JobSizeBreakdown,
        totalSetQty: totals.set,
        totalUnsetQty: totals.unset,
        category: newOrder.category as 'Formal' | 'Casual',
        sleeveType: newOrder.sleeveType as 'Full Sleeve' | 'Half Sleeve',
        packingType: newOrder.packingType as 'Board Pack' | 'Loose Pack',
        deadline: newOrder.deadline || '',
        expectedDeliveryDate: newOrder.expectedDeliveryDate || newOrder.deadline || '',
        fabricStatus: 'Pending',
        status: 'Planning'
      };
      onAddOrder(order);
      setIsFormOpen(false);
      setNewOrder({ 
        poNumber: '', buyerName: '', brandName: '', styleName: '', 
        deadline: '', category: 'Formal',
        sleeveType: 'Full Sleeve', packingType: 'Board Pack',
        setSizes: { s: 0, m: 0, l: 0, xl: 0, xxl: 0 },
        unsetSizes: { s: 0, m: 0, l: 0, xl: 0, xxl: 0 }
      });
    } else {
      alert("Please fill in PO Number, Buyer, and at least one quantity.");
    }
  };

  const handleSizeChange = (type: 'set' | 'unset', size: keyof JobSizeBreakdown, value: string) => {
    const field = type === 'set' ? 'setSizes' : 'unsetSizes';
    setNewOrder(prev => ({
      ...prev,
      [field]: {
        ...(prev[field] || { s: 0, m: 0, l: 0, xl: 0, xxl: 0 }),
        [size]: Number(value)
      }
    }));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
           <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
             <div className="bg-indigo-600 p-2 rounded-lg text-white">
               <ShoppingBag size={24} />
             </div>
             PO Management (Set & Unset Units)
           </h2>
           <p className="text-slate-500 text-sm font-medium">Manage dual-breakdown contracts for unified fabric batches.</p>
        </div>
        <button
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-100 font-bold"
        >
          {isFormOpen ? <X size={20} /> : <Plus size={20} />}
          <span>{isFormOpen ? 'Cancel Entry' : 'Create New PO Set'}</span>
        </button>
      </div>

      {isFormOpen && (
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-top-4">
          <div className="bg-slate-900 p-6 text-white flex items-center justify-between">
            <h3 className="text-lg font-black flex items-center gap-2 uppercase tracking-widest">
               <Layers className="text-indigo-400" size={20} />
               PO Registration: Combined Breakdown
            </h3>
            <div className="flex items-center gap-6">
               <div className="text-right">
                  <span className="block text-[8px] font-bold text-slate-400">GRAND TOTAL</span>
                  <span className="text-xl font-black text-indigo-400">{totals.grand} PCS</span>
               </div>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="p-8 space-y-10">
            {/* Row 1: Core Logistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block">PO # *</label>
                <input type="text" required placeholder="PO-..." className="w-full rounded-xl border border-slate-200 p-3 text-sm font-bold" value={newOrder.poNumber} onChange={e => setNewOrder({...newOrder, poNumber: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block">Buyer / Client *</label>
                <div className="relative">
                  <User className="absolute left-3 top-3.5 text-slate-300" size={14} />
                  <input type="text" required placeholder="Buyer Name" className="w-full pl-9 rounded-xl border border-slate-200 p-3 text-sm font-bold" value={newOrder.buyerName} onChange={e => setNewOrder({...newOrder, buyerName: e.target.value})} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block">Brand Identity</label>
                <input type="text" placeholder="Brand Name" className="w-full rounded-xl border border-slate-200 p-3 text-sm font-bold" value={newOrder.brandName} onChange={e => setNewOrder({...newOrder, brandName: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block">Style Reference</label>
                <input type="text" placeholder="Style Name" className="w-full rounded-xl border border-slate-200 p-3 text-sm font-bold" value={newOrder.styleName} onChange={e => setNewOrder({...newOrder, styleName: e.target.value})} />
              </div>
            </div>

            {/* Row 2: Dual Breakdown Area */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* SET QUANTITY SECTION */}
              <div className="space-y-4 bg-indigo-50/30 p-6 rounded-2xl border border-indigo-100">
                <div className="flex justify-between items-center border-b border-indigo-100 pb-3">
                   <h4 className="text-[11px] font-black text-indigo-700 uppercase tracking-widest flex items-center gap-2">
                     <Package size={14} /> 1. Set Quantity (Assortment)
                   </h4>
                   <span className="bg-indigo-600 text-white px-3 py-1 rounded-lg text-[10px] font-black">{totals.set} UNITS</span>
                </div>
                <div className="grid grid-cols-5 gap-2 pt-2">
                  {(['s', 'm', 'l', 'xl', 'xxl'] as const).map(size => (
                    <div key={size} className="space-y-1">
                      <label className="block text-center text-[9px] font-black text-slate-400 uppercase">{size}</label>
                      <input 
                        type="number" placeholder="0"
                        className="w-full text-center p-2 rounded-lg border border-indigo-200 text-xs font-bold bg-white" 
                        value={newOrder.setSizes?.[size] || ''} 
                        onChange={e => handleSizeChange('set', size, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* UNSET QUANTITY SECTION */}
              <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                   <h4 className="text-[11px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                     <Hash size={14} /> 2. Unset Quantity (Loose)
                   </h4>
                   <span className="bg-slate-700 text-white px-3 py-1 rounded-lg text-[10px] font-black">{totals.unset} UNITS</span>
                </div>
                <div className="grid grid-cols-5 gap-2 pt-2">
                  {(['s', 'm', 'l', 'xl', 'xxl'] as const).map(size => (
                    <div key={size} className="space-y-1">
                      <label className="block text-center text-[9px] font-black text-slate-400 uppercase">{size}</label>
                      <input 
                        type="number" placeholder="0"
                        className="w-full text-center p-2 rounded-lg border border-slate-200 text-xs font-bold bg-white" 
                        value={newOrder.unsetSizes?.[size] || ''} 
                        onChange={e => handleSizeChange('unset', size, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Row 3: Attributes & Dates */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
              <div className="space-y-4">
                 <div className="flex bg-slate-100 p-1 rounded-xl">
                    {['Formal', 'Casual'].map(v => (
                      <button key={v} type="button" onClick={() => setNewOrder({...newOrder, category: v as any})} className={`flex-1 py-2 text-[10px] font-black rounded-lg transition ${newOrder.category === v ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>{v}</button>
                    ))}
                 </div>
                 <div className="flex bg-slate-100 p-1 rounded-xl">
                    {['Full Sleeve', 'Half Sleeve'].map(v => (
                      <button key={v} type="button" onClick={() => setNewOrder({...newOrder, sleeveType: v as any})} className={`flex-1 py-2 text-[10px] font-black rounded-lg transition ${newOrder.sleeveType === v ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>{v}</button>
                    ))}
                 </div>
                 <div className="flex bg-slate-100 p-1 rounded-xl">
                    {['Board Pack', 'Loose Pack'].map(v => (
                      <button key={v} type="button" onClick={() => setNewOrder({...newOrder, packingType: v as any})} className={`flex-1 py-2 text-[10px] font-black rounded-lg transition ${newOrder.packingType === v ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>{v}</button>
                    ))}
                 </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-red-500 uppercase block">Ship Deadline</label>
                   <input type="date" className="p-3 rounded-xl border border-red-100 text-xs font-bold w-full" value={newOrder.deadline} onChange={e => setNewOrder({...newOrder, deadline: e.target.value})} />
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-indigo-500 uppercase block">Exp. Ready</label>
                   <input type="date" className="p-3 rounded-xl border border-indigo-100 text-xs font-bold w-full" value={newOrder.expectedDeliveryDate} onChange={e => setNewOrder({...newOrder, expectedDeliveryDate: e.target.value})} />
                </div>
              </div>

              <div className="flex justify-end">
                <button type="submit" className="w-full md:w-auto bg-indigo-600 text-white px-10 py-4 rounded-2xl shadow-xl shadow-indigo-100 hover:scale-[1.02] transition font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3">
                  <ArrowRightCircle size={18} />
                  Validate & Save PO
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Grid of Display Cards */}
      <div className="space-y-6">
        {orders.map(order => {
          const deadlineDate = new Date(order.deadline);
          const today = new Date();
          const daysLeft = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          return (
            <div key={order.id} className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl transition-all flex flex-col md:flex-row">
               {/* Identity Section */}
               <div className="md:w-64 bg-slate-50 p-6 border-r border-slate-100">
                  <div className="flex items-center gap-2 mb-2">
                     <span className={`w-2 h-2 rounded-full ${daysLeft < 5 ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{order.poNumber}</span>
                  </div>
                  <h3 className="text-xl font-black text-slate-800 mb-1">{order.buyerName}</h3>
                  <p className="text-sm font-bold text-indigo-600 mb-6">{order.brandName}</p>
                  
                  <div className="space-y-4">
                     <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Grand Total</span>
                        <span className="text-xl font-black text-slate-800">{order.totalQuantity} PCS</span>
                     </div>
                  </div>
               </div>

               {/* Technical Breakdown Section */}
               <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* SET DISPLAY */}
                  <div className="bg-indigo-50/20 p-4 rounded-2xl border border-indigo-50">
                     <div className="flex justify-between items-center mb-3">
                        <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Set Assortment</h4>
                        <span className="text-[11px] font-black text-indigo-800">{order.totalSetQty}</span>
                     </div>
                     <div className="grid grid-cols-5 gap-2">
                        {(['s','m','l','xl','xxl'] as const).map(sz => (
                           <div key={sz} className="text-center">
                              <span className="block text-[8px] font-black text-slate-400 uppercase mb-0.5">{sz}</span>
                              <span className="block text-xs font-black text-indigo-600">{order.setSizes[sz]}</span>
                           </div>
                        ))}
                     </div>
                  </div>

                  {/* UNSET DISPLAY */}
                  <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                     <div className="flex justify-between items-center mb-3">
                        <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Unset Loose</h4>
                        <span className="text-[11px] font-black text-slate-800">{order.totalUnsetQty}</span>
                     </div>
                     <div className="grid grid-cols-5 gap-2">
                        {(['s','m','l','xl','xxl'] as const).map(sz => (
                           <div key={sz} className="text-center">
                              <span className="block text-[8px] font-black text-slate-400 uppercase mb-0.5">{sz}</span>
                              <span className="block text-xs font-black text-slate-600">{order.unsetSizes[sz]}</span>
                           </div>
                        ))}
                     </div>
                  </div>

                  <div className="lg:col-span-2 pt-4 border-t border-slate-100 flex justify-between items-center">
                     <div className="flex gap-4">
                        <div className="px-3 py-1 rounded-full bg-slate-100 text-[9px] font-black text-slate-500 uppercase">{order.category}</div>
                        <div className="px-3 py-1 rounded-full bg-slate-100 text-[9px] font-black text-slate-500 uppercase">{order.sleeveType}</div>
                        <div className="px-3 py-1 rounded-full bg-slate-100 text-[9px] font-black text-slate-500 uppercase">{order.packingType}</div>
                     </div>
                     <div className="text-right">
                        <span className="text-[9px] font-black text-slate-400 uppercase block">Shipment Due</span>
                        <span className="text-xs font-black text-red-500">{order.deadline}</span>
                     </div>
                  </div>
               </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderManagement;