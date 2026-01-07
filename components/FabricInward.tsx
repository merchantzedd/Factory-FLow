import React, { useState } from 'react';
import { 
  Plus, Package, Calendar, Ruler, Upload, ShoppingBag, 
  CheckCircle, FileText, Activity, Droplets, Hash, 
  AlertTriangle, Info, Scissors, Layers, X, ArrowRight,
  TrendingUp, Search
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

  const selectedPo = orders.find(o => o.id === newFabric.linkedPoId);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreview(ev.target?.result as string);
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFabric.color || !newFabric.meters || !newFabric.batchNumber) return alert("Fill required fields.");

    const fabric: FabricBatch = {
      id: Date.now().toString(),
      batchNumber: newFabric.batchNumber!,
      color: newFabric.color!,
      meters: Number(newFabric.meters),
      metersOrdered: Number(newFabric.metersOrdered || newFabric.meters),
      invoiceNumber: newFabric.invoiceNumber || 'N/A',
      shrinkage: newFabric.shrinkage || 'None',
      fabricType: (newFabric.fabricType as any) || 'Woven',
      washType: (newFabric.washType as any) || 'Non-Wash',
      content: newFabric.content || 'Standard',
      imageUrl: imagePreview || `https://picsum.photos/seed/${Date.now()}/300/300`,
      receivedDate: new Date().toISOString().split('T')[0],
      supplier: newFabric.supplier || 'Unknown',
      linkedPoId: newFabric.linkedPoId
    };
    
    onAddFabric(fabric);

    if (newFabric.linkedPoId) {
      const linkedOrder = orders.find(o => o.id === newFabric.linkedPoId);
      if (linkedOrder) {
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
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Visual KPI Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-[32px] shadow-sm border border-slate-200">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
             <div className="p-2 bg-indigo-600 rounded-xl text-white">
                <ShoppingBasketIcon size={24} />
             </div>
             Fabric Asset Registry
          </h2>
          <p className="text-slate-500 text-sm font-medium">Verify incoming meterage, color accuracy, and technical SHR.</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
           <div className="hidden lg:flex items-center gap-3 px-6 py-2 bg-slate-50 rounded-2xl border border-slate-100">
              <TrendingUp size={18} className="text-indigo-600" />
              <div>
                 <p className="text-[8px] font-black text-slate-400 uppercase">Total Inventory</p>
                 <p className="text-sm font-black text-slate-800">{fabrics.reduce((s,f) => s + f.meters, 0).toLocaleString()}m</p>
              </div>
           </div>
           <button
             onClick={() => setIsFormOpen(!isFormOpen)}
             className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-900 text-white px-8 py-3.5 rounded-2xl hover:bg-slate-800 transition shadow-xl font-black uppercase text-[10px] tracking-widest"
           >
             {isFormOpen ? <X size={18} /> : <Plus size={18} />}
             {isFormOpen ? 'Cancel Entry' : 'Register Incoming Fabric'}
           </button>
        </div>
      </div>

      {isFormOpen && (
        <div className="bg-white rounded-[40px] shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-top-4">
          <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
             <div className="flex items-center gap-4">
                <Package size={24} className="text-indigo-400" />
                <div>
                   <h3 className="text-lg font-black tracking-tight">Material Specification Audit</h3>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Verify and link to Purchase Order</p>
                </div>
             </div>
             {newFabric.meters && (
                <div className="text-right">
                   <span className="text-[8px] font-black text-slate-400 block mb-1 uppercase">Loading Asset</span>
                   <span className="text-2xl font-black text-indigo-400">{newFabric.meters}m</span>
                </div>
             )}
          </div>
          
          <form onSubmit={handleSubmit} className="p-10 space-y-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              {/* Logistics & Identity */}
              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest border-b-2 border-indigo-50 pb-3 flex items-center gap-2">
                   <Hash size={16} /> 1. Shipment Identity
                </h4>
                <div className="space-y-4">
                   <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase">Batch/Roll No *</label>
                      <input type="text" required placeholder="FB-XXXX" className="w-full rounded-2xl border border-slate-200 p-3.5 text-sm font-bold bg-slate-50 focus:bg-white transition" value={newFabric.batchNumber} onChange={(e) => setNewFabric({ ...newFabric, batchNumber: e.target.value })} />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase">Color *</label>
                        <input type="text" required placeholder="e.g. Navy" className="w-full rounded-2xl border border-slate-200 p-3.5 text-sm font-bold" value={newFabric.color} onChange={(e) => setNewFabric({ ...newFabric, color: e.target.value })} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase">Shrinkage %</label>
                        <input type="text" placeholder="2% L, 3% W" className="w-full rounded-2xl border border-slate-200 p-3.5 text-sm font-bold" value={newFabric.shrinkage} onChange={(e) => setNewFabric({ ...newFabric, shrinkage: e.target.value })} />
                      </div>
                   </div>
                   <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase">Composition</label>
                      <textarea placeholder="98% Cotton, 2% Elasthane" className="w-full rounded-2xl border border-slate-200 p-3.5 text-sm font-bold h-24 resize-none" value={newFabric.content} onChange={(e) => setNewFabric({ ...newFabric, content: e.target.value })} />
                   </div>
                </div>
              </div>

              {/* Linking Logic */}
              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest border-b-2 border-emerald-50 pb-3 flex items-center gap-2">
                   <ShoppingBag size={16} /> 2. Order Mapping
                </h4>
                <div className="space-y-6">
                   <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase">Linked Purchase Order</label>
                      <select className="w-full rounded-2xl border border-emerald-200 p-3.5 text-sm font-black bg-emerald-50/30 focus:bg-white" value={newFabric.linkedPoId} onChange={(e) => setNewFabric({ ...newFabric, linkedPoId: e.target.value })}>
                        <option value="">-- Direct Stock Batch --</option>
                        {orders.filter(o => o.fabricStatus !== 'Received').map(o => (
                          <option key={o.id} value={o.id}>{o.poNumber} | {o.buyerName} ({o.styleName})</option>
                        ))}
                      </select>
                   </div>
                   
                   {selectedPo ? (
                     <div className="bg-emerald-900 text-white p-6 rounded-3xl shadow-xl shadow-emerald-100 animate-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-center mb-4">
                           <span className="text-[8px] font-black uppercase text-emerald-300">Linked Order Verified</span>
                           <CheckCircle size={14} className="text-emerald-400" />
                        </div>
                        <h5 className="text-lg font-black tracking-tight mb-1">{selectedPo.styleName}</h5>
                        <div className="flex justify-between text-[10px] font-bold text-emerald-200">
                           <span>Buyer: {selectedPo.buyerName}</span>
                           <span>Qty: {selectedPo.totalQuantity} PCS</span>
                        </div>
                        <div className="mt-4 pt-4 border-t border-emerald-700 flex items-center gap-2 text-[10px] font-black uppercase">
                           <Calendar size={12} /> Deadline: {selectedPo.deadline}
                        </div>
                     </div>
                   ) : (
                     <div className="p-6 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center space-y-2 py-10 opacity-60">
                        <Info size={24} className="text-slate-300" />
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Link this batch to a PO to automate production kickoff</p>
                     </div>
                   )}

                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                         <label className="text-[9px] font-black text-slate-400 uppercase">Meters Ordered</label>
                         <input type="number" step="0.1" className="w-full rounded-2xl border border-slate-200 p-3.5 text-sm font-bold" value={newFabric.metersOrdered || ''} onChange={(e) => setNewFabric({ ...newFabric, metersOrdered: Number(e.target.value) })} />
                      </div>
                      <div className="space-y-1">
                         <label className="text-[9px] font-black text-indigo-600 uppercase">Meters Received *</label>
                         <input type="number" step="0.1" required className="w-full rounded-2xl border-2 border-indigo-200 p-3.5 text-sm font-black bg-indigo-50/50" value={newFabric.meters || ''} onChange={(e) => setNewFabric({ ...newFabric, meters: Number(e.target.value) })} />
                      </div>
                   </div>
                </div>
              </div>

              {/* Evidence & Verification */}
              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-purple-600 uppercase tracking-widest border-b-2 border-purple-50 pb-3 flex items-center gap-2">
                   <ImageIcon size={16} /> 3. Verification Evidence
                </h4>
                <div className="space-y-6">
                   <label className="relative h-48 w-full rounded-[32px] border-2 border-dashed border-slate-200 hover:border-indigo-500 transition cursor-pointer bg-slate-50 flex flex-col items-center justify-center overflow-hidden group">
                      {imagePreview ? (
                         <img src={imagePreview} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" alt="Preview" />
                      ) : (
                         <>
                            <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-2 group-hover:scale-110 transition">
                               <Upload size={20} className="text-slate-400" />
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Upload Arrival Photo</span>
                         </>
                      )}
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                   </label>

                   <div className="bg-slate-900 rounded-3xl p-6 text-white space-y-4">
                      <div className="flex justify-between items-center">
                         <span className="text-[8px] font-black text-slate-400 uppercase">Quality Grade</span>
                         <span className="bg-emerald-500 text-[8px] px-2 py-0.5 rounded-full font-black">A-GRADE</span>
                      </div>
                      <p className="text-[10px] font-medium text-slate-400 leading-normal">
                         By saving, you confirm the color match against approved swatches and SHR testing records.
                      </p>
                      <button type="submit" className="w-full py-4 bg-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition shadow-xl shadow-indigo-900/40">Validate & Finalize Batch</button>
                   </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Fabric List View */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {fabrics.map((fabric) => {
          const shortage = fabric.metersOrdered - fabric.meters;
          const isShort = shortage > 0;
          
          return (
            <div key={fabric.id} className={`bg-white rounded-[40px] shadow-sm border overflow-hidden hover:shadow-2xl transition-all group flex flex-col ${isShort ? 'border-red-200 ring-2 ring-red-50' : 'border-slate-200'}`}>
              <div className="h-64 overflow-hidden relative">
                 <img src={fabric.imageUrl} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt={fabric.color} />
                 <div className="absolute top-6 left-6 flex flex-col gap-2">
                    <span className="bg-white/95 backdrop-blur px-4 py-2 rounded-2xl text-[10px] font-black text-slate-800 shadow-xl border border-white/20">
                      {fabric.batchNumber}
                    </span>
                    {isShort && (
                      <span className="bg-red-500 px-4 py-2 rounded-2xl text-[10px] font-black text-white shadow-xl flex items-center gap-2 animate-pulse">
                        <AlertTriangle size={14} /> SHORT: {shortage.toFixed(1)}m
                      </span>
                    )}
                 </div>
                 <div className="absolute bottom-6 right-6 bg-slate-900/90 backdrop-blur px-5 py-3 rounded-2xl text-[10px] font-black text-white flex items-center gap-3">
                    <Droplets size={16} className="text-indigo-400" /> {fabric.washType}
                 </div>
              </div>
              
              <div className="p-8 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="font-black text-2xl text-slate-800 tracking-tight leading-tight">{fabric.color}</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{fabric.supplier}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-[9px] font-black text-slate-300 uppercase mb-1">Invoice</div>
                    <div className="text-xs font-black text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl">{fabric.invoiceNumber}</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 text-center">
                    <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Received</span>
                    <span className={`text-xl font-black tracking-tighter ${isShort ? 'text-red-600' : 'text-slate-800'}`}>{fabric.meters}m</span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 text-center">
                    <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Ordered</span>
                    <span className="text-xl font-black text-slate-400 tracking-tighter">{fabric.metersOrdered}m</span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 text-center">
                    <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">SHR</span>
                    <span className="text-xs font-black text-indigo-600">{fabric.shrinkage}</span>
                  </div>
                </div>

                {isShort && (
                  <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-[24px] flex items-center gap-4">
                    <div className="p-2 bg-red-100 rounded-xl text-red-600">
                      <AlertTriangle size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-red-700 uppercase leading-none mb-1">Supply Shortage Detected</p>
                      <p className="text-sm font-bold text-red-900 tracking-tight">Missing {shortage.toFixed(1)} meters from order.</p>
                    </div>
                  </div>
                )}

                <div className="bg-indigo-50/30 rounded-[32px] p-6 border border-indigo-100 mb-8 flex-1">
                   <div className="flex items-center gap-2 mb-3">
                      <Info size={14} className="text-indigo-500" />
                      <span className="text-[9px] font-black text-indigo-600 uppercase tracking-[0.2em]">Material Content</span>
                   </div>
                   <p className="text-xs font-bold text-slate-700 leading-relaxed italic opacity-80">
                     "{fabric.content}"
                   </p>
                </div>

                <div className="flex justify-between items-center pt-6 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-slate-400" />
                    <span className="text-xs font-bold text-slate-400">{fabric.receivedDate}</span>
                  </div>
                  {fabric.linkedPoId ? (
                    <div className="flex items-center gap-2 text-[10px] text-emerald-600 font-black uppercase bg-emerald-50 px-4 py-1.5 rounded-full">
                      <CheckCircle size={14} /> Linked PO
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-300 font-black uppercase tracking-widest">Floor Stock</div>
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

// Internal icons needed
function ShoppingBasketIcon({ size, className }: { size: number; className?: string }) {
  return <ShoppingBag size={size} className={className} />;
}

function ImageIcon({ size, className }: { size: number; className?: string }) {
  return <FileText size={size} className={className} />;
}

export default FabricInward;