import React, { useState, useEffect } from 'react';
import { FabricBatch, Job, ProcessStage, JobSizeBreakdown } from '../types';
import { ClipboardList, Upload, Ruler, Scissors } from 'lucide-react';

interface JobIssuanceProps {
  fabrics: FabricBatch[];
  onIssueJob: (job: Job) => void;
}

const JobIssuance: React.FC<JobIssuanceProps> = ({ fabrics, onIssueJob }) => {
  const [formData, setFormData] = useState({
    fabricBatchId: '',
    styleName: '',
    buttonQuantity: 0,
    fusingType: '',
    productionLine: 'Line 1',
    ppComments: '',
    fabricMetersIssued: 0,
    averageDeclared: 0,
  });

  const [sizes, setSizes] = useState<JobSizeBreakdown>({
    s: 0, m: 0, l: 0, xl: 0, xxl: 0
  });

  const [totalQuantity, setTotalQuantity] = useState(0);

  useEffect(() => {
    const total = sizes.s + sizes.m + sizes.l + sizes.xl + sizes.xxl;
    setTotalQuantity(total);
  }, [sizes]);

  const [checklist, setChecklist] = useState({
    ppSample: false,
    fusing: false,
    tags: false,
    trims: false,
    fabric: false,
    otherTrims: false,
  });

  const [jobImage, setJobImage] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setJobImage(URL.createObjectURL(file));
    }
  };

  const handleSizeChange = (key: keyof JobSizeBreakdown, val: string) => {
    setSizes(prev => ({ ...prev, [key]: Number(val) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fabricBatchId || !formData.styleName || totalQuantity === 0) {
      alert("Please fill in all required fields and ensure at least one size quantity is added.");
      return;
    }

    const newJob: Job = {
      id: Date.now().toString(),
      jobId: `JOB-${Math.floor(Math.random() * 10000)}`,
      fabricBatchId: formData.fabricBatchId,
      styleName: formData.styleName,
      quantity: totalQuantity,
      sizeBreakdown: sizes,
      buttonQuantity: Number(formData.buttonQuantity),
      fusingType: formData.fusingType,
      productionLine: formData.productionLine,
      ppComments: formData.ppComments,
      fabricMetersIssued: Number(formData.fabricMetersIssued),
      averageDeclared: Number(formData.averageDeclared),
      checklist: checklist,
      jobImageUrl: jobImage || undefined,
      currentStage: ProcessStage.CUTTING,
      isCompleted: false,
      createdAt: new Date().toISOString(),
      processHistory: [
        {
          stage: ProcessStage.CUTTING,
          entryDate: new Date().toISOString(),
          processedQuantity: totalQuantity // Initial input
        }
      ]
    };

    onIssueJob(newJob);
    // Reset Form
    setFormData({
      fabricBatchId: '',
      styleName: '',
      buttonQuantity: 0,
      fusingType: '',
      productionLine: 'Line 1',
      ppComments: '',
      fabricMetersIssued: 0,
      averageDeclared: 0,
    });
    setSizes({ s: 0, m: 0, l: 0, xl: 0, xxl: 0 });
    setChecklist({
      ppSample: false, fusing: false, tags: false, trims: false, fabric: false, otherTrims: false
    });
    setJobImage(null);
    alert(`Job issued successfully to ${newJob.productionLine}.`);
  };

  const toggleCheck = (key: keyof typeof checklist) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
        <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center gap-3">
          <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
             <ClipboardList size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">New Job Issuance</h2>
            <p className="text-slate-500 text-sm">Create a new production job with size breakdown and fabric details.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Left Column: Job Specs */}
          <div className="space-y-6">
            <h3 className="font-semibold text-slate-800 border-b pb-2 flex items-center gap-2">
              <Scissors size={18} />
              Style & Production Details
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Production Line</label>
                <select
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-indigo-500 focus:outline-none bg-white"
                  value={formData.productionLine}
                  onChange={(e) => setFormData({ ...formData, productionLine: e.target.value })}
                >
                  <option value="Line 1">Line 1</option>
                  <option value="Line 2">Line 2</option>
                  <option value="Line 3">Line 3</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Style Name / Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Summer Blazer 2024"
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-indigo-500 focus:outline-none"
                  value={formData.styleName}
                  onChange={(e) => setFormData({ ...formData, styleName: e.target.value })}
                />
              </div>
            </div>

            {/* Size Breakdown */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
               <label className="block text-sm font-bold text-slate-700 mb-3">Size Breakdown</label>
               <div className="grid grid-cols-5 gap-2 mb-2">
                 <div className="text-center text-xs text-slate-500">S</div>
                 <div className="text-center text-xs text-slate-500">M</div>
                 <div className="text-center text-xs text-slate-500">L</div>
                 <div className="text-center text-xs text-slate-500">XL</div>
                 <div className="text-center text-xs text-slate-500">XXL</div>
               </div>
               <div className="grid grid-cols-5 gap-2">
                 {(['s', 'm', 'l', 'xl', 'xxl'] as const).map(size => (
                   <input
                    key={size}
                    type="number"
                    min="0"
                    placeholder="0"
                    className="w-full text-center rounded-md border border-slate-300 py-2 focus:border-indigo-500 focus:outline-none"
                    value={sizes[size] || ''}
                    onChange={(e) => handleSizeChange(size, e.target.value)}
                   />
                 ))}
               </div>
               <div className="mt-4 flex justify-between items-center bg-white p-2 rounded border border-slate-200">
                 <span className="text-sm font-semibold text-slate-600">Total Quantity:</span>
                 <span className="text-lg font-bold text-indigo-700">{totalQuantity}</span>
               </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Buttons Qty</label>
              <input
                type="number"
                required
                min="0"
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-indigo-500 focus:outline-none"
                value={formData.buttonQuantity}
                onChange={(e) => setFormData({ ...formData, buttonQuantity: Number(e.target.value) })}
              />
            </div>
          </div>

          {/* Right Column: Fabric & Checklist */}
          <div className="space-y-6">
            <h3 className="font-semibold text-slate-800 border-b pb-2 flex items-center gap-2">
              <Ruler size={18} />
              Fabric Consumption & Resources
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Select Fabric Batch</label>
              <select
                required
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-indigo-500 focus:outline-none bg-white"
                value={formData.fabricBatchId}
                onChange={(e) => setFormData({ ...formData, fabricBatchId: e.target.value })}
              >
                <option value="">-- Choose Fabric --</option>
                {fabrics.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.batchNumber} - {f.color} ({f.meters}m available)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Avg. Declared</label>
                 <div className="relative">
                   <input
                    type="number"
                    step="0.01"
                    required
                    className="w-full rounded-lg border border-slate-300 pl-4 pr-8 py-2.5 focus:border-indigo-500 focus:outline-none"
                    value={formData.averageDeclared || ''}
                    onChange={(e) => setFormData({ ...formData, averageDeclared: Number(e.target.value) })}
                   />
                   <span className="absolute right-3 top-2.5 text-slate-400 text-sm">m</span>
                 </div>
              </div>
              <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Fabric Issued</label>
                 <div className="relative">
                   <input
                    type="number"
                    step="0.1"
                    required
                    className="w-full rounded-lg border border-slate-300 pl-4 pr-8 py-2.5 focus:border-indigo-500 focus:outline-none"
                    value={formData.fabricMetersIssued || ''}
                    onChange={(e) => setFormData({ ...formData, fabricMetersIssued: Number(e.target.value) })}
                   />
                   <span className="absolute right-3 top-2.5 text-slate-400 text-sm">m</span>
                 </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fusing Type</label>
              <input
                type="text"
                required
                placeholder="e.g., Soft Interlining"
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-indigo-500 focus:outline-none"
                value={formData.fusingType}
                onChange={(e) => setFormData({ ...formData, fusingType: e.target.value })}
              />
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
               <span className="block text-sm font-medium text-slate-700 mb-3">Resource Checklist</span>
               <div className="grid grid-cols-2 gap-3">
                 {[
                   { id: 'ppSample', label: 'PP Sample' },
                   { id: 'fabric', label: 'Fabric Check' },
                   { id: 'fusing', label: 'Fusing' },
                   { id: 'tags', label: 'Tags / Labels' },
                   { id: 'trims', label: 'Main Trims' },
                   { id: 'otherTrims', label: 'Other Trims' },
                 ].map((item) => (
                    <label key={item.id} className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={checklist[item.id as keyof typeof checklist]}
                        onChange={() => toggleCheck(item.id as keyof typeof checklist)}
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-slate-600">{item.label}</span>
                    </label>
                 ))}
               </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">PP Comments</label>
              <textarea
                rows={2}
                placeholder="Instructions..."
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-indigo-500 focus:outline-none"
                value={formData.ppComments}
                onChange={(e) => setFormData({ ...formData, ppComments: e.target.value })}
              />
            </div>

             <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Upload Sketch / Job Image</label>
              <div className="flex items-start gap-4">
                <label className="cursor-pointer flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition bg-white">
                  <Upload size={18} className="text-slate-500" />
                  <span className="text-sm text-slate-600">Upload</span>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
                {jobImage && (
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-slate-200 shadow-sm">
                    <img src={jobImage} alt="Job Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>

          </div>

          <div className="md:col-span-2 pt-6 border-t border-slate-100">
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white font-semibold py-4 rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 flex justify-center items-center gap-2"
            >
              <ClipboardList size={20} />
              Issue Job to Production
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JobIssuance;
