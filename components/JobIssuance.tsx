import React, { useState, useEffect } from 'react';
import { FabricBatch, Job, ProcessStage, JobSizeBreakdown, PurchaseOrder } from '../types';
import { 
  ClipboardList, Upload, Ruler, Scissors, ShoppingBag, 
  Tag, FileText, MessageSquare, Save, Trash2, 
  Layers, ImageIcon, Package, Info
} from 'lucide-react';

interface JobIssuanceProps {
  fabrics: FabricBatch[];
  orders: PurchaseOrder[];
  onIssueJob: (job: Job) => void;
}

const DRAFT_STORAGE_KEY = 'factoryflow_job_issuance_draft_v2';

const JobIssuance: React.FC<JobIssuanceProps> = ({ fabrics, orders, onIssueJob }) => {
  const [formData, setFormData] = useState({
    poId: '',
    fabricBatchId: '',
    styleName: '',
    sleeveDetails: 'Long Sleeve',
    labelDetails: '',
    patternOption: '',
    fusingType: '',
    productionLine: 'Line 1',
    ppComments: '',
    ppSampleComments: '',
    stitchingComments: '',
    accessories: '',
    fabricMetersIssued: 0,
    averageDeclared: 0,
  });

  const [sizes, setSizes] = useState<JobSizeBreakdown>({
    s: 0, m: 0, l: 0, xl: 0, xxl: 0
  });

  const [totalQuantity, setTotalQuantity] = useState(0);

  const [checklist, setChecklist] = useState({
    ppSample: false,
    fusing: false,
    tags: false,
    trims: false,
    fabric: false,
    otherTrims: false,
  });

  const [jobImage, setJobImage] = useState<string | null>(null);
  const [mainLabelImage, setMainLabelImage] = useState<string | null>(null);
  const [additionalLabelImage, setAdditionalLabelImage] = useState<string | null>(null);

  useEffect(() => {
    const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (savedDraft) {
      try {
        const { formData: dForm, sizes: dSizes, checklist: dCheck, images } = JSON.parse(savedDraft);
        if (dForm) setFormData(dForm);
        if (dSizes) setSizes(dSizes);
        if (dCheck) setChecklist(dCheck);
        if (images) {
          setJobImage(images.job);
          setMainLabelImage(images.mainLabel);
          setAdditionalLabelImage(images.additionalLabel);
        }
      } catch (e) {
        console.error("Failed to load draft:", e);
      }
    }
  }, []);

  useEffect(() => {
    const total = sizes.s + sizes.m + sizes.l + sizes.xl + sizes.xxl;
    setTotalQuantity(total);
  }, [sizes]);

  const handleSaveDraft = () => {
    const draft = { 
      formData, 
      sizes, 
      checklist,
      images: {
        job: jobImage,
        mainLabel: mainLabelImage,
        additionalLabel: additionalLabelImage
      }
    };
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    alert("Technical Specification Draft saved!");
  };

  const handleClearDraft = () => {
    if (confirm("Clear Technical Spec draft?")) {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setFormData({
        poId: '', fabricBatchId: '', styleName: '', sleeveDetails: 'Long Sleeve',
        labelDetails: '', patternOption: '', fusingType: '', productionLine: 'Line 1',
        ppComments: '', ppSampleComments: '', stitchingComments: '', accessories: '', fabricMetersIssued: 0, averageDeclared: 0,
      });
      setSizes({ s: 0, m: 0, l: 0, xl: 0, xxl: 0 });
      setChecklist({
        ppSample: false, fusing: false, tags: false, trims: false, fabric: false, otherTrims: false
      });
      setJobImage(null);
      setMainLabelImage(null);
      setAdditionalLabelImage(null);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string | null>>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setter(ev.target?.result as string);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSizeChange = (key: keyof JobSizeBreakdown, val: string) => {
    setSizes(prev => ({ ...prev, [key]: Number(val) }));
  };

  const handlePOChange = (poId: string) => {
    const po = orders.find(o => o.id === poId);
    setFormData(prev => ({
      ...prev, poId: poId, styleName: po ? po.styleName : prev.styleName
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fabricBatchId || !formData.styleName || totalQuantity === 0) {
      alert("Please complete required fields (Fabric, Style, and Quantities).");
      return;
    }

    const newJob: Job = {
      id: Date.now().toString(),
      jobId: `JOB-${Math.floor(Math.random() * 10000)}`,
      poId: formData.poId || undefined,
      fabricBatchId: formData.fabricBatchId,
      styleName: formData.styleName,
      quantity: totalQuantity,
      sizeBreakdown: sizes,
      sleeveDetails: formData.sleeveDetails,
      labelDetails: formData.labelDetails,
      patternOption: formData.patternOption,
      fusingType: formData.fusingType,
      productionLine: formData.productionLine,
      
      // Detailed Specs
      ppComments: formData.ppComments,
      ppSampleComments: formData.ppSampleComments,
      stitchingComments: formData.stitchingComments,
      accessories: formData.accessories,
      jobImageUrl: jobImage || undefined,
      mainLabelImageUrl: mainLabelImage || undefined,
      additionalLabelImageUrl: additionalLabelImage || undefined,
      
      fabricMetersIssued: Number(formData.fabricMetersIssued),
      averageDeclared: Number(formData.averageDeclared),
      checklist: checklist,
      currentStage: ProcessStage.CUTTING,
      isCompleted: false,
      createdAt: new Date().toISOString(),
      stageStatus: {
        [ProcessStage.CUTTING]: { inward: totalQuantity, output: 0 }
      },
      processHistory: []
    };

    onIssueJob(newJob);
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    alert(`Job ${newJob.jobId} issued successfully with detailed technical specs.`);
  };

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <ClipboardList className="text-indigo-400" />
            <div>
              <h2 className="text-xl font-black">Detailed Job Issuance</h2>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">Tech Pack & Production Order</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={handleSaveDraft} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition">Save Tech Draft</button>
            <button type="button" onClick={handleClearDraft} className="p-2 hover:bg-red-500/20 rounded-xl transition text-slate-400 hover:text-red-400"><Trash2 size={20} /></button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-10">
          
          {/* Section 1: Basic Info & Style */}
          <section className="space-y-6">
            <h3 className="text-sm font-black text-slate-800 border-b pb-3 flex items-center gap-2 uppercase tracking-widest">
              <Scissors size={18} className="text-indigo-600" /> 1. Style & Order Mapping
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block">Purchase Order Reference</label>
                  <select className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-indigo-100 outline-none" value={formData.poId} onChange={(e) => handlePOChange(e.target.value)}>
                    <option value="">-- Direct/Stock Job (No PO) --</option>
                    {orders.map(o => <option key={o.id} value={o.id}>{o.poNumber} | {o.clientName} ({o.styleName})</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block">Style Name / ID *</label>
                  <input type="text" required placeholder="e.g. Vintage Denim Jacket" className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-indigo-100 outline-none" value={formData.styleName} onChange={(e) => setFormData({ ...formData, styleName: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block">Production Line</label>
                    <select className="w-full rounded-xl border border-slate-200 p-3 text-sm" value={formData.productionLine} onChange={(e) => setFormData({...formData, productionLine: e.target.value})}>
                      <option value="Line 1">Line 1</option>
                      <option value="Line 2">Line 2</option>
                      <option value="Line 3">Line 3</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block">Pattern Reference</label>
                    <input type="text" placeholder="PAT-000" className="w-full rounded-xl border border-slate-200 p-3 text-sm" value={formData.patternOption} onChange={(e) => setFormData({...formData, patternOption: e.target.value})} />
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase block border-b pb-2 mb-2">Order Size Breakdown</label>
                <div className="grid grid-cols-5 gap-3">
                  {(['s', 'm', 'l', 'xl', 'xxl'] as const).map(size => (
                    <div key={size}>
                      <span className="text-[9px] font-black text-center block mb-1 uppercase text-slate-500">{size}</span>
                      <input type="number" placeholder="0" className="w-full text-center border border-slate-200 p-2.5 rounded-lg text-sm font-bold focus:border-indigo-500" value={sizes[size] || ''} onChange={(e) => handleSizeChange(size, e.target.value)} />
                    </div>
                  ))}
                </div>
                <div className="mt-6 p-4 bg-white rounded-xl border border-indigo-100 flex justify-between items-center">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Issuance Qty:</span>
                  <span className="text-2xl font-black text-indigo-700">{totalQuantity} <span className="text-xs">PCS</span></span>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Technical Specifications & Branding */}
          <section className="space-y-6">
            <h3 className="text-sm font-black text-slate-800 border-b pb-3 flex items-center gap-2 uppercase tracking-widest">
              <Layers size={18} className="text-indigo-600" /> 2. Technical & Branding Specs
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Image Uploads */}
              <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Technical Visuals</p>
                <div className="space-y-3">
                  {/* Job Main Image */}
                  <label className="relative block h-32 rounded-2xl border-2 border-dashed border-slate-200 hover:border-indigo-400 transition cursor-pointer bg-slate-50 group overflow-hidden">
                    {jobImage ? (
                      <img src={jobImage} className="w-full h-full object-cover" alt="style" />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-slate-400">
                        <ImageIcon size={24} className="mb-1 group-hover:scale-110 transition" />
                        <span className="text-[10px] font-bold">Style Image</span>
                      </div>
                    )}
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, setJobImage)} />
                  </label>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {/* Main Label Image */}
                    <label className="relative block h-24 rounded-2xl border border-dashed border-slate-300 hover:border-indigo-400 transition cursor-pointer bg-slate-50 overflow-hidden">
                      {mainLabelImage ? (
                        <img src={mainLabelImage} className="w-full h-full object-cover" alt="main label" />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                          <Tag size={18} className="mb-1" />
                          <span className="text-[9px] font-bold">Main Label</span>
                        </div>
                      )}
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, setMainLabelImage)} />
                    </label>
                    {/* Additional Label Image */}
                    <label className="relative block h-24 rounded-2xl border border-dashed border-slate-300 hover:border-indigo-400 transition cursor-pointer bg-slate-50 overflow-hidden">
                      {additionalLabelImage ? (
                        <img src={additionalLabelImage} className="w-full h-full object-cover" alt="extra label" />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                          <Package size={18} className="mb-1" />
                          <span className="text-[9px] font-bold">Extra Labels</span>
                        </div>
                      )}
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, setAdditionalLabelImage)} />
                    </label>
                  </div>
                </div>
              </div>

              {/* Comments and Tags */}
              <div className="md:col-span-2 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block">General Production Comments</label>
                    <textarea 
                      placeholder="Special instructions for the production line..." 
                      className="w-full rounded-xl border border-slate-200 p-3 text-xs h-28 resize-none focus:ring-2 focus:ring-indigo-100 outline-none"
                      value={formData.ppComments}
                      onChange={(e) => setFormData({...formData, ppComments: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block">Stitching Comments</label>
                    <textarea 
                      placeholder="Needle gauge, thread count, SPI details..." 
                      className="w-full rounded-xl border border-slate-200 p-3 text-xs h-28 resize-none focus:ring-2 focus:ring-indigo-100 outline-none"
                      value={formData.stitchingComments}
                      onChange={(e) => setFormData({...formData, stitchingComments: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block">Tags & Accessories Details</label>
                   <input 
                    type="text" 
                    placeholder="e.g. Price tags, spare buttons, metal pins, silica gel packets..." 
                    className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-indigo-100 outline-none" 
                    value={formData.accessories}
                    onChange={(e) => setFormData({...formData, accessories: e.target.value})}
                   />
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Fabric Issuance & BOM Checklist */}
          <section className="space-y-6">
            <h3 className="text-sm font-black text-slate-800 border-b pb-3 flex items-center gap-2 uppercase tracking-widest">
              <Package size={18} className="text-indigo-600" /> 3. Fabric BOM & Readiness
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block">Fabric Batch Link *</label>
                  <select required className="w-full rounded-xl border border-slate-200 p-3 text-sm" value={formData.fabricBatchId} onChange={(e) => setFormData({ ...formData, fabricBatchId: e.target.value })}>
                    <option value="">-- Select Fabric Batch --</option>
                    {fabrics.map(f => <option key={f.id} value={f.id}>{f.batchNumber} ({f.color} - {f.meters}m available)</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block">Declared Avg</label>
                    <input type="number" step="0.01" className="w-full border p-2.5 rounded-xl text-sm font-bold" value={formData.averageDeclared || ''} onChange={(e) => setFormData({ ...formData, averageDeclared: Number(e.target.value) })} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block">Mtrs Issued</label>
                    <input type="number" step="0.1" className="w-full border p-2.5 rounded-xl text-sm font-bold" value={formData.fabricMetersIssued || ''} onChange={(e) => setFormData({ ...formData, fabricMetersIssued: Number(e.target.value) })} />
                  </div>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block">Material Readiness Checklist</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { key: 'ppSample', label: 'PP Approved Sample' },
                    { key: 'fabric', label: 'Main Fabric In-Stock' },
                    { key: 'fusing', label: 'Interlining/Fusing Ready' },
                    { key: 'tags', label: 'Price/Wash Tags' },
                    { key: 'trims', label: 'Buttons/Zippers' },
                    { key: 'otherTrims', label: 'Poly Bags/Cartons' }
                  ].map(({key, label}) => (
                    <div key={key} className="flex flex-col gap-2">
                      <label className={`flex items-center gap-3 p-4 rounded-xl border transition cursor-pointer ${checklist[key as keyof typeof checklist] ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-100 hover:border-indigo-100'}`}>
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 text-indigo-600 rounded"
                          checked={checklist[key as keyof typeof checklist]} 
                          onChange={() => setChecklist({...checklist, [key as keyof typeof checklist]: !checklist[key as keyof typeof checklist]})} 
                        />
                        <span className="text-[11px] font-bold text-slate-700">{label}</span>
                      </label>
                      {key === 'ppSample' && checklist.ppSample && (
                        <input 
                          type="text" 
                          placeholder="Sample ID / Specific PP Comments..." 
                          className="w-full p-2 text-[10px] border border-indigo-100 rounded-lg focus:ring-2 focus:ring-indigo-50 outline-none animate-in fade-in slide-in-from-top-1"
                          value={formData.ppSampleComments}
                          onChange={(e) => setFormData({...formData, ppSampleComments: e.target.value})}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <div className="pt-8 border-t flex items-center justify-between">
            <div className="text-slate-400 text-xs italic flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
              Tech Pack verification recommended before floor issuance.
            </div>
            <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-12 py-4 rounded-2xl shadow-xl shadow-indigo-100 transition-all flex items-center gap-3 uppercase tracking-widest text-sm">
              <Save size={20} />
              Issue Job Sheet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JobIssuance;