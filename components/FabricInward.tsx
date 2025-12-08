import React, { useState } from 'react';
import { Plus, Package, Calendar, Ruler, Upload, Image as ImageIcon } from 'lucide-react';
import { FabricBatch } from '../types';

interface FabricInwardProps {
  fabrics: FabricBatch[];
  onAddFabric: (fabric: FabricBatch) => void;
}

const FabricInward: React.FC<FabricInwardProps> = ({ fabrics, onAddFabric }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newFabric, setNewFabric] = useState<Partial<FabricBatch>>({
    color: '',
    meters: 0,
    batchNumber: '',
    supplier: ''
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
      };
      onAddFabric(fabric);
      setIsFormOpen(false);
      setNewFabric({ color: '', meters: 0, batchNumber: '', supplier: '' });
      setImagePreview(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Fabric Inward Summary</h2>
        <button
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
        >
          <Plus size={20} />
          <span>New Entry</span>
        </button>
      </div>

      {isFormOpen && (
        <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
          <h3 className="text-lg font-semibold mb-4">Register New Fabric Batch</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Batch Number</label>
              <input
                type="text"
                required
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
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
                value={newFabric.meters}
                onChange={(e) => setNewFabric({ ...newFabric, meters: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Supplier</label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
                value={newFabric.supplier}
                onChange={(e) => setNewFabric({ ...newFabric, supplier: e.target.value })}
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Upload Fabric Image</label>
              <div className="flex items-center gap-4">
                <label className="cursor-pointer flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition">
                  <Upload size={18} className="text-slate-500" />
                  <span className="text-sm text-slate-600">Choose File</span>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
                {imagePreview && (
                  <div className="relative w-16 h-16 rounded overflow-hidden border border-slate-200">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
                {!imagePreview && <span className="text-xs text-slate-400">No image selected</span>}
              </div>
            </div>

            <div className="md:col-span-2 flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Save Record
              </button>
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
                  <Ruler size={16} />
                  <span>{fabric.meters} mtrs</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={16} />
                  <span>{fabric.receivedDate}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
        {fabrics.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-400">
            <Package size={48} className="mx-auto mb-4 opacity-50" />
            <p>No fabric batches recorded yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FabricInward;
