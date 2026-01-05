import React, { useState } from 'react';
import { Plus, Package, Calendar, Ruler, Upload, ShoppingBag, CheckCircle } from 'lucide-react';
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
    batchNumber: '',
    supplier: '',
    linkedPoId: ''
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const imageUrl = URL.createObjectURL(file);
      setImagePreview(imageUrl);
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
        imageUrl: imagePreview || `https://picsum.photos/seed/${Date.now()}/300/300`,
        receivedDate: new Date().toISOString().split('T')[0],
        supplier: newFabric.supplier || 'Unknown',
        linkedPoId: newFabric.linkedPoId
      };
      
      onAddFabric(fabric);

      // CRITICAL: Automatically update linked PO status to 'Received'
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
      setNewFabric({ color: '', meters: 0, batchNumber: '', supplier: '', linkedPoId: '' });
      setImagePreview(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Fabric Inward Summary</h2>
          <p className="text-slate-500 text-sm">Manage arrivals and link materials to POs.</p>
        </div>
        <button
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
        >
          <Plus size={20} />
          <span>New Entry</span>
        </button>
      </div>

      {isFormOpen && (
        <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200 animate-in fade-in slide-in-from-top-4">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Package size={20} className="text-indigo-600" />
            Register New Fabric Batch
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Batch Number</label>
              <input
                type="text"
                required
                placeholder="e.g. FB-2024-001"
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
                value={newFabric.batchNumber}
                onChange={(e) => setNewFabric({ ...newFabric, batchNumber: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Color</label>
              <input
                type="text"
                required
                placeholder="e.g. Royal Blue"
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
                value={newFabric.color}
                onChange={(e) => setNewFabric({ ...newFabric, color: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Meters (Quantity)</label>
              <input
                type="number"
                required
                placeholder="0"
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
                value={newFabric.meters || ''}
                onChange={(e) => setNewFabric({ ...newFabric, meters: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Supplier</label>
              <input
                type="text"
                placeholder="e.g. Apex Textiles"
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
                value={newFabric.supplier}
                onChange={(e) => setNewFabric({ ...newFabric, supplier: e.target.value })}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700">Link to Purchase Order</label>
              <div className="relative mt-1">
                <ShoppingBag size={18} className="absolute left-3 top-2.5 text-slate-400" />
                <select
                  className="block w-full rounded-md border border-slate-300 pl-10 pr-3 py-2 bg-white focus:border-indigo-500 outline-none"
                  value={newFabric.linkedPoId}
                  onChange={(e) => setNewFabric({ ...newFabric, linkedPoId: e.target.value })}
                >
                  <option value="">-- No Linked PO / Direct Stock --</option>
                  {orders.filter(o => o.fabricStatus !== 'Received').map(order => (
                    <option key={order.id} value={order.id}>
                      {order.poNumber} - {order.clientName} (Awaiting {order.totalQuantity} units)
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-[10px] text-indigo-500 mt-1">* Saving this will automatically mark the PO fabric status as "Received".</p>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Upload Fabric Image</label>
              <div className="flex items-center gap-4">
                <label className="cursor-pointer flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition bg-white">
                  <Upload size={18} className="text-slate-500" />
                  <span className="text-sm text-slate-600">Choose File</span>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
                {imagePreview && (
                  <div className="relative w-16 h-16 rounded overflow-hidden border border-slate-200 shadow-sm">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>

            <div className="md:col-span-2 flex justify-end gap-2 mt-4 border-t pt-4">
              <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 text-slate-600 hover:text-slate-800 text-sm font-medium">Cancel</button>
              <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-semibold shadow-sm transition">Save Record</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {fabrics.map((fabric) => (
          <div key={fabric.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition group">
            <div className="h-40 overflow-hidden relative">
               <img src={fabric.imageUrl} alt={fabric.color} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
               <div className="absolute top-2 right-2 bg-white/90 px-2 py-1 rounded text-xs font-bold text-slate-800 shadow-sm">
                 {fabric.batchNumber}
               </div>
            </div>
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg text-slate-800">{fabric.color}</h3>
                <span className="text-xs text-slate-500 border border-slate-200 px-2 py-0.5 rounded-full">{fabric.supplier}</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <Ruler size={16} className="text-slate-400" />
                  <span>{fabric.meters} mtrs</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-slate-400" />
                  <span>{fabric.receivedDate}</span>
                </div>
              </div>
              {fabric.linkedPoId && (
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-indigo-600 font-bold">
                  <CheckCircle size={12} />
                  Linked to PO: {orders.find(o => o.id === fabric.linkedPoId)?.poNumber || 'Confirmed'}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FabricInward;