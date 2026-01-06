
import React, { useState } from 'react';
import { 
  Plus, Package, Calendar, Ruler, Upload, ShoppingBag, 
  CheckCircle, FileText, Activity, Droplets, Hash, 
  AlertTriangle, Info, Scissors, Layers, X
} from 'lucide-react';
import { FabricBatch, PurchaseOrder } from '../types';

interface FabricInwardProps {
  fabrics: FabricBatch[];
  orders: PurchaseOrder[];
  onAddFabric: (fabric: FabricBatch) => void;
  onUpdateOrder: (order: PurchaseOrder) => void;
}

const FabricInward: React.FC<FabricInwardProps> = ({ fabrics, orders, onAddFabric, onUpdateOrder }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newFabric, setNewFabric] = useState<Partial<FabricBatch>>({
    color: '',
    meters: 0,
    metersOrdered: 0,
    batchNumber: '',
    supplier: '',
    linkedPoId: '',
    invoiceNumber: '',
    shrinkage: '',
    fabricType: 'Woven',
    washType: 'Non-Wash',
    content: ''
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImagePreview(ev.target?.result as string);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFabric.color && newFabric.meters && newFabric.batchNumber) {
      const fabric: FabricBatch = {
        id: Date.now().toString(),
        batchNumber: newFabric.batchNumber,
        color: newFabric.color,
        meters: Number(newFabric.meters),
        metersOrdered: Number(newFabric.metersOrdered || newFabric.meters),
        invoiceNumber: newFabric.invoiceNumber || 'N/A',
        shrinkage: newFabric.shrinkage || 'None',
        fabricType: newFabric.fabricType as 'Knits' | 'Woven',
        washType: newFabric.washType as 'Wash' | 'Non-Wash',
        content: newFabric.content || 'Standard',
        imageUrl: imagePreview || `https://picsum.photos/seed/${Date.now()}/300/300`,
        receivedDate: new Date().toISOString().split('T')[0],
        supplier: newFabric.supplier || 'Unknown',
        linkedPoId: newFabric.linkedPoId
      };
      
      onAddFabric(fabric);

      if (newFabric.linkedPoId) {
        const linkedOrder = orders.find(o => o.id === newFabric.linkedPoId);
        if (linkedOrder && linkedOrder.fabricStatus !== 'Received') {
          onUpdateOrder({ 
            ...linkedOrder, 
            fabricStatus: 'Received',
            status: linkedOrder.status === 'Planning' ? 'Production' : linkedOrder.status 
          });
        }
      }

      setIsFormOpen(false);
      setNewFabric({ color: '', meters: 0, metersOrdered: 0, batchNumber: '', supplier: '', linkedPoId: '', invoiceNumber: '', shrinkage: '', fabricType: 'Woven', washType: 'Non-Wash', content: '' });
      setImagePreview(null);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Fabric Inward Audit</h2>
          <p className="text-slate-500 text-sm">Detailed technical specs and shortage verification.</p>
        </div>
        <button
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2.5 rounded-xl hover:bg-slate-800 transition shadow-lg shadow-slate-200"
        >
          {/* Add missing 'X' icon from lucide-react */}
          {isFormOpen ? <X size={20} /> : <Plus size={20} />}
          <span className="font-bold text-sm">{isFormOpen ? 'Close Form' : 'Register Inward'}</span>
        </button>
      </div>

      {isFormOpen && (
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200 animate-in fade-in slide-in-from-top-4">
          <h3 className="text-xl font-black mb-6 flex items-center gap-2 text-slate-800">
            <Package size={24} className="text-indigo-600" />
            Material Specification Entry
          </h3>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Logistics Section */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase text-indigo-600 tracking-widest flex items-center gap-2 border-b pb-2">
                   <FileText size={14} /> 1. Logistics Details
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Batch Number *</label>
                    <input type="text" required placeholder="FB-2024-..." className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-100 outline-none" value={newFabric.batchNumber} onChange={(e) => setNewFabric({ ...newFabric, batchNumber: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Invoice Number</label>
                    <input type="text" placeholder="INV-..." className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" value={newFabric.invoiceNumber} onChange={(e) => setNewFabric({ ...newFabric, invoiceNumber: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Supplier</label>
                    <input type="text" placeholder="Mill Name" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" value={newFabric.supplier} onChange={(e) => setNewFabric({ ...newFabric, supplier: e.target.value })} />
                  </div>
                </div>
              </div>

              {/* Specs Section */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase text-indigo-600 tracking-widest flex items-center gap-2 border-b pb-2">
                   <Activity size={14} /> 2. Technical Specs
                </h4>
                <div className="grid grid-cols-2 gap-4">
                   <div className="col-span-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Fabric Content</label>
                    <input type="text" placeholder="e.g. 95% Cotton, 5% Elasthane" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" value={newFabric.content} onChange={(e) => setNewFabric({ ...newFabric, content: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Type</label>
                    <select className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm bg-white" value={newFabric.fabricType} onChange={(e) => setNewFabric({ ...newFabric, fabricType: e.target.value as any })}>
                      <option value="Woven">Woven</option>
                      <option value="Knits">Knits</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Shrinkage %</label>
                    <input type="text" placeholder="e.g. 2% L, 3% W" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" value={newFabric.shrinkage} onChange={(e) => setNewFabric({ ...newFabric, shrinkage: e.target.value })} />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Wash Method</label>
                    <div className="flex gap-2">
                      {['Wash', 'Non-Wash'].map(v => (
                        <button key={v} type="button" onClick={() => setNewFabric({...newFabric, washType: v as any})} className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${newFabric.washType === v ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400'}`}>{v}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quantities Section */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase text-indigo-600 tracking-widest flex items-center gap-2 border-b pb-2">
                   <Hash size={14} /> 3. Quantity Audit
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Linked PO</label>
                    <select className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm bg-white" value={newFabric.linkedPoId} onChange={(e) => setNewFabric({ ...newFabric, linkedPoId: e.target.value })}>
                      <option value="">-- Direct Stock --</option>
                      {orders.filter(o => o.fabricStatus !== 'Received').map(o => (
                        <option key={o.id} value={o.id}>{o.poNumber} | {o.clientName}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Mtrs Ordered</label>
                      <input type="number" step="0.1" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-indigo-600" value={newFabric.metersOrdered || ''} onChange={(e) => setNewFabric({ ...newFabric, metersOrdered: Number(e.target.value) })} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Mtrs Received *</label>
                      <input type="number" step="0.1" required className="w-full rounded-xl border border-indigo-200 px-4 py-3 text-sm font-bold text-slate-900 bg-indigo-50/30" value={newFabric.meters || ''} onChange={(e) => setNewFabric({ ...newFabric, meters: Number(e.target.value) })} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Arrival Evidence</label>
                    <label className="w-full h-24 rounded-2xl border-2 border-dashed border-slate-200 hover:border-indigo-400 transition cursor-pointer flex flex-col items-center justify-center bg-slate-50 overflow-hidden relative group">
                      {imagePreview ? (
                        <img src={imagePreview} className="w-full h-full object-cover" />
                      ) : (
                        <>
                          <Upload size={24} className="text-slate-300 group-hover:text-indigo-400" />
                          <span className="text-[10px] font-bold text-slate-400">Click to upload fabric image</span>
                        </>
                      )}
                      <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
              <button type="button" onClick={() => setIsFormOpen(false)} className="px-6 py-2.5 text-slate-500 font-bold text-sm">Cancel</button>
              <button type="submit" className="px-10 py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 hover:scale-105 transition-transform">Validate & Store Inward</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {fabrics.map((fabric) => {
          const shortage = fabric.metersOrdered - fabric.meters;
          const isShort = shortage > 0;
          
          return (
            <div key={fabric.id} className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-2xl transition-all group flex flex-col">
              <div className="h-56 overflow-hidden relative">
                 <img src={fabric.imageUrl} alt={fabric.color} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                 <div className="absolute top-4 left-4 flex gap-2">
                    <span className="bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-xl text-[10px] font-black text-slate-800 shadow-xl border border-white/20">
                      {fabric.batchNumber}
                    </span>
                    {isShort && (
                      <span className="bg-red-500 px-3 py-1.5 rounded-xl text-[10px] font-black text-white shadow-xl flex items-center gap-1">
                        <AlertTriangle size={12} /> SHORTAGE: {shortage.toFixed(1)}m
                      </span>
                    )}
                 </div>
                 <div className="absolute bottom-4 right-4 bg-slate-900/80 backdrop-blur-sm px-4 py-2 rounded-2xl text-[10px] font-black text-white flex items-center gap-2">
                    <Droplets size={14} className="text-indigo-400" /> {fabric.washType}
                 </div>
              </div>
              
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-black text-xl text-slate-800 leading-tight">{fabric.color}</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{fabric.supplier}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-[9px] font-bold text-slate-400 uppercase mb-1">Invoice Ref</div>
                    <div className="text-xs font-black text-slate-700 bg-slate-100 px-2 py-1 rounded-lg">{fabric.invoiceNumber}</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
                    <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Mtrs Rcvd</span>
                    <span className="text-lg font-black text-slate-800">{fabric.meters}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
                    <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Shrinkage</span>
                    <span className="text-xs font-black text-indigo-600">{fabric.shrinkage}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
                    <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Type</span>
                    <span className="text-xs font-black text-slate-800">{fabric.fabricType}</span>
                  </div>
                </div>

                <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100 mb-6 flex-1">
                   <div className="flex items-center gap-2 mb-2">
                      <Info size={14} className="text-indigo-500" />
                      <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Material Composition</span>
                   </div>
                   <p className="text-xs font-bold text-slate-700 leading-relaxed italic">
                     "{fabric.content}"
                   </p>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-slate-400" />
                    <span className="text-xs font-bold text-slate-400">{fabric.receivedDate}</span>
                  </div>
                  {fabric.linkedPoId ? (
                    <div className="flex items-center gap-1 text-[10px] text-indigo-600 font-black uppercase bg-indigo-50 px-3 py-1 rounded-full">
                      <CheckCircle size={12} /> Linked PO
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-300 font-bold uppercase">Stock Batch</div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FabricInward;
