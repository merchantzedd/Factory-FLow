
import React, { useState, useMemo } from 'react';
import { PurchaseOrder, Job, JobSizeBreakdown } from '../types';
import { 
  ShoppingBag, Calendar, Truck, CheckCircle2, AlertCircle, 
  Plus, Clock, User, Shield, Tag, Box, Scissors, 
  Layers, Package, ChevronRight, X, Info, Hash,
  ArrowRightCircle, Shirt, Minimize2, Maximize2
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
      <div className="flex justify-between items-center bg-white p-8 rounded-[32px] shadow-sm border border-slate-200">
        <div>
           <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
             <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-lg shadow-indigo-100">
               <ShoppingBag size={24} />
             </div>
             PO Master Control
           </h2>
           <p className="text-slate-500 text-sm font-medium">Register dual-breakdown contracts with precise technical attributes.</p>
        </div>
        <button
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-2xl hover:bg-slate-800 transition shadow-xl font-black uppercase text-[10px] tracking-widest"
        >
          {isFormOpen ? <X size={20} /> : <Plus size={20} />}
          <span>{isFormOpen ? 'Discard' : 'New Contract'}</span>
        </button>
      </div>

      {isFormOpen && (
        <div className="bg-white rounded-[40px] shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-top-4">
          <div className="bg-slate-900 p-8 text-white flex items-center justify-between">
            <h3 className="text-lg font-black flex items-center gap-2 uppercase tracking-widest">
               <Layers className="text-indigo-400" size={20} />
               PO Technical Registration
            </h3>
            <div className="flex items-center gap-8">
               <div className="text-right">
                  <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Contract Volume</span>
                  <span className="text-3xl font-black text-indigo-400">{totals.grand} <span className="text-xs">PCS</span></span>
               </div>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="p-10 space-y-12">
            {/* Identity Group */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">PO # *</label>
                <input type="text" required placeholder="PO-XXXX" className="w-full rounded-2xl border border-slate-200 p-4 text-sm font-black bg-slate-50 focus:bg-white focus:border-indigo-500 transition outline-none" value={newOrder.poNumber} onChange={e => setNewOrder({...newOrder, poNumber: e.target.value})} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Buyer *</label>
                <div className="relative">
                  <User className="absolute left-4 top-4.5 text-slate-300" size={16} />
                  <input type="text" required placeholder="Buyer Name" className="w-full pl-11 rounded-2xl border border-slate-200 p-4 text-sm font-black bg-slate-50 focus:bg-white focus:border-indigo-500 transition outline-none" value={newOrder.buyerName} onChange={e => setNewOrder({...newOrder, buyerName: e.target.value})} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Brand</label>
                <input type="text" placeholder="Brand Name" className="w-full rounded-2xl border border-slate-200 p-4 text-sm font-black bg-slate-50 focus:bg-white focus:border-indigo-500 transition outline-none" value={newOrder.brandName} onChange={e => setNewOrder({...newOrder, brandName: e.target.value})} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Style ID</label>
                <input type="text" placeholder="Style Code" className="w-full rounded-2xl border border-slate-200 p-4 text-sm font-black bg-slate-50 focus:bg-white focus:border-indigo-500 transition outline-none" value={newOrder.styleName} onChange={e => setNewOrder({...newOrder, styleName: e.target.value})} />
              </div>
            </div>

            {/* Breakdown Split */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="space-y-6 bg-indigo-50/30 p-8 rounded-[32px] border border-indigo-100">
                <div className="flex justify-between items-center border-b border-indigo-100 pb-4">
                   <h4 className="text-[11px] font-black text-indigo-700 uppercase tracking-widest flex items-center gap-2">
                     <Package size={16} /> Set Assortment
                   </h4>
                   <span className="bg-indigo-600 text-white px-4 py-1.5 rounded-xl text-[11px] font-black">{totals.set} PCS</span>
                </div>
                <div className="grid grid-cols-5 gap-3">
                  {(['s', 'm', 'l', 'xl', 'xxl'] as const).map(size => (
                    <div key={size} className="space-y-2">
                      <label className="block text-center text-[10px] font-black text-slate-400 uppercase">{size}</label>
                      <input 
                        type="number" placeholder="0"
                        className="w-full text-center p-3 rounded-xl border border-indigo-200 text-sm font-black bg-white focus:border-indigo-500 outline-none" 
                        value={newOrder.setSizes?.[size] || ''} 
                        onChange={e => handleSizeChange('set', size, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6 bg-slate-50 p-8 rounded-[32px] border border-slate-200">
                <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                   <h4 className="text-[11px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                     <Hash size={16} /> Unset (Loose) Units
                   </h4>
                   <span className="bg-slate-700 text-white px-4 py-1.5 rounded-xl text-[11px] font-black">{totals.unset} PCS</span>
                </div>
                <div className="grid grid-cols-5 gap-3">
                  {(['s', 'm', 'l', 'xl', 'xxl'] as const).map(size => (
                    <div key={size} className="space-y-2">
                      <label className="block text-center text-[10px] font-black text-slate-400 uppercase">{size}</label>
                      <input 
                        type="number" placeholder="0"
                        className="w-full text-center p-3 rounded-xl border border-slate-200 text-sm font-black bg-white focus:border-indigo-500 outline-none" 
                        value={newOrder.unsetSizes?.[size] || ''} 
                        onChange={e => handleSizeChange('unset', size, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Technical Attributes Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Garment Category</label>
                <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-2">
                   {[
                     { id: 'Formal', icon: Shirt },
                     { id: 'Casual', icon: Shirt }
                   ].map(v => (
                     <button key={v.id} type="button" onClick={() => setNewOrder({...newOrder, category: v.id as any})} className={`flex-1 py-3.5 flex flex-col items-center gap-2 rounded-xl transition ${newOrder.category === v.id ? 'bg-white shadow-xl text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
                        <v.icon size={18} />
                        <span className="text-[10px] font-black uppercase tracking-widest">{v.id}</span>
                     </button>
                   ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Sleeve Type</label>
                <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-2">
                   {[
                     { id: 'Full Sleeve', icon: Maximize2 },
                     { id: 'Half Sleeve', icon: Minimize2 }
                   ].map(v => (
                     <button key={v.id} type="button" onClick={() => setNewOrder({...newOrder, sleeveType: v.id as any})} className={`flex-1 py-3.5 flex flex-col items-center gap-2 rounded-xl transition ${newOrder.sleeveType === v.id ? 'bg-white shadow-xl text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
                        <v.icon size={18} />
                        <span className="text-[10px] font-black uppercase tracking-widest">{v.id}</span>
                     </button>
                   ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Packing Rigor</label>
                <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-2">
                   {[
                     { id: 'Board Pack', icon: Box },
                     { id: 'Loose Pack', icon: Package }
                   ].map(v => (
                     <button key={v.id} type="button" onClick={() => setNewOrder({...newOrder, packingType: v.id as any})} className={`flex-1 py-3.5 flex flex-col items-center gap-2 rounded-xl transition ${newOrder.packingType === v.id ? 'bg-white shadow-xl text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
                        <v.icon size={18} />
                        <span className="text-[10px] font-black uppercase tracking-widest">{v.id}</span>
                     </button>
                   ))}
                </div>
              </div>
            </div>

            {/* Final Submission Block */}
            <div className="pt-10 border-t flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex gap-6">
                 <div className="space-y-1">
                    <label className="text-[9px] font-black text-rose-500 uppercase">Ship Deadline</label>
                    <input type="date" className="p-4 rounded-2xl border border-rose-100 text-xs font-black" value={newOrder.deadline} onChange={e => setNewOrder({...newOrder, deadline: e.target.value})} />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[9px] font-black text-indigo-500 uppercase">Expected Ready</label>
                    <input type="date" className="p-4 rounded-2xl border border-indigo-100 text-xs font-black" value={newOrder.expectedDeliveryDate} onChange={e => setNewOrder({...newOrder, expectedDeliveryDate: e.target.value})} />
                 </div>
              </div>

              <button type="submit" className="w-full md:w-auto bg-slate-900 text-white px-12 py-5 rounded-3xl shadow-2xl hover:scale-105 active:scale-95 transition-all font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-4 group">
                <ArrowRightCircle size={20} className="group-hover:translate-x-1 transition-transform" />
                Register Contract
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid of Display Cards */}
      <div className="grid grid-cols-1 gap-8">
        {orders.map(order => {
          const deadlineDate = new Date(order.deadline);
          const today = new Date();
          const daysLeft = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          return (
            <div key={order.id} className="bg-white rounded-[40px] shadow-sm border border-slate-200 overflow-hidden hover:shadow-2xl transition-all flex flex-col xl:flex-row group">
               {/* Identity Section */}
               <div className="xl:w-80 bg-slate-50 p-8 border-r border-slate-100">
                  <div className="flex items-center gap-3 mb-3">
                     <span className={`w-3 h-3 rounded-full shadow-sm ${daysLeft < 5 ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                     <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{order.poNumber}</span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 mb-1 leading-tight">{order.buyerName}</h3>
                  <p className="text-sm font-bold text-indigo-600 mb-8">{order.brandName}</p>
                  
                  <div className="space-y-4">
                     <div className="bg-white p-5 rounded-[24px] border border-slate-200 shadow-sm">
                        <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">Total Volume</span>
                        <span className="text-2xl font-black text-slate-800 tracking-tighter">{order.totalQuantity.toLocaleString()} <span className="text-xs">PCS</span></span>
                     </div>
                  </div>
               </div>

               {/* Detailed Technical Specs & Breakdown */}
               <div className="flex-1 p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                     {/* SET ASSORTMENT BOX */}
                     <div className="bg-indigo-50/20 p-6 rounded-[32px] border border-indigo-50">
                        <div className="flex justify-between items-center mb-6">
                           <h4 className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.2em] flex items-center gap-2">
                             <Package size={14} /> Assortment
                           </h4>
                           <span className="text-[11px] font-black text-indigo-800 bg-indigo-100 px-3 py-1 rounded-full">{order.totalSetQty}</span>
                        </div>
                        <div className="grid grid-cols-5 gap-3">
                           {(['s','m','l','xl','xxl'] as const).map(sz => (
                              <div key={sz} className="text-center bg-white/60 p-2 rounded-xl">
                                 <span className="block text-[8px] font-black text-slate-400 uppercase mb-0.5">{sz}</span>
                                 <span className="block text-xs font-black text-indigo-600">{order.setSizes[sz]}</span>
                              </div>
                           ))}
                        </div>
                     </div>

                     {/* UNSET LOOSE BOX */}
                     <div className="bg-slate-50/50 p-6 rounded-[32px] border border-slate-100">
                        <div className="flex justify-between items-center mb-6">
                           <h4 className="text-[11px] font-black text-slate-600 uppercase tracking-[0.2em] flex items-center gap-2">
                             <Hash size={14} /> Loose Units
                           </h4>
                           <span className="text-[11px] font-black text-slate-800 bg-slate-200 px-3 py-1 rounded-full">{order.totalUnsetQty}</span>
                        </div>
                        <div className="grid grid-cols-5 gap-3">
                           {(['s','m','l','xl','xxl'] as const).map(sz => (
                              <div key={sz} className="text-center bg-white/60 p-2 rounded-xl">
                                 <span className="block text-[8px] font-black text-slate-400 uppercase mb-0.5">{sz}</span>
                                 <span className="block text-xs font-black text-slate-600">{order.unsetSizes[sz]}</span>
                              </div>
                           ))}
                        </div>
                     </div>
                  </div>

                  {/* Attribute Badges Footer */}
                  <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
                     <div className="flex flex-wrap gap-3">
                        <div className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-100 text-[10px] font-black text-slate-600 uppercase tracking-widest border border-slate-200">
                           <Shirt size={14} className="text-indigo-500" /> {order.category}
                        </div>
                        <div className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-100 text-[10px] font-black text-slate-600 uppercase tracking-widest border border-slate-200">
                           <Scissors size={14} className="text-emerald-500" /> {order.sleeveType}
                        </div>
                        <div className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-100 text-[10px] font-black text-slate-600 uppercase tracking-widest border border-slate-200">
                           <Box size={14} className="text-amber-500" /> {order.packingType}
                        </div>
                     </div>
                     <div className="flex items-center gap-8">
                        <div className="text-right">
                           <span className="text-[9px] font-black text-slate-300 uppercase block tracking-widest">Ship Deadline</span>
                           <span className={`text-sm font-black ${daysLeft < 3 ? 'text-rose-600' : 'text-slate-700'}`}>{order.deadline}</span>
                        </div>
                        <div className="bg-slate-900 p-3 rounded-2xl text-white hover:scale-110 transition cursor-pointer">
                           <ChevronRight size={20} />
                        </div>
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
