import React, { useState, useEffect } from 'react';
import { FabricBatch, Job, ProcessStage, JobSizeBreakdown, PurchaseOrder } from '../types';
import { 
  ClipboardList, Ruler, Scissors, ShoppingBag, 
  Tag, FileText, MessageSquare, Save, Trash2, 
  Layers, ImageIcon, Package, Info, Shirt, Box, Minimize2, Maximize2, Hash
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
    // New attributes inherited from PO
    category: 'Formal' as 'Formal' | 'Casual',
    sleeveType: 'Full Sleeve' as 'Full Sleeve' | 'Half Sleeve',
    packingType: 'Board Pack' as 'Board Pack' | 'Loose Pack'
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
        category: 'Formal', sleeveType: 'Full Sleeve', packingType: 'Board Pack'
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
    if (po) {
      setFormData(prev => ({
        ...prev, 
        poId: poId, 
        styleName: po.styleName,
        category: po.category,
        sleeveType: po.sleeveType,
        packingType: po.packingType
      }));
      // Auto-populate sizes from PO breakdown if it's the first time
      setSizes({
        s: po.sizeBreakdown.s,
        m: po.sizeBreakdown.m,
        l: po.sizeBreakdown.l,
        xl: po.sizeBreakdown.xl,
        xxl: po.sizeBreakdown.xxl
      });
    } else {
      setFormData(prev => ({ ...prev, poId: '' }));
    }
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
      sleeveDetails: formData.sleeveType,
      labelDetails: formData.labelDetails,
      patternOption: formData.patternOption,
      fusingType: formData.fusingType,
      productionLine: formData.productionLine,
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
    alert(`Job ${newJob.jobId} issued successfully.`);
  };

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="bg-white rounded-[40px] shadow-xl border border-slate-200 overflow-hidden">
        <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <ClipboardList className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight">Job Issuance & Tech Pack</h2>
              <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">Register technical specifications for floor loading</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={handleSaveDraft} className="px-5 py-2.5 bg-white/10 hover:bg-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest transition">Save Draft</button>
            <button type="button" onClick={handleClearDraft} className="p-3 hover:bg-red-500/20 rounded-2xl transition text-slate-400 hover:text-red-400"><Trash2 size={20} /></button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-12">
          
          <section className="space-y-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-3 uppercase tracking-widest">
                <Scissors size={20} className="text-indigo-600" /> 1. Style & Order Attributes
              </h3>
              {formData.poId && (
                <div className="flex gap-2">
                   <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-lg border border-indigo-100 uppercase">
                     <Shirt size={12} /> {formData.category}
                   </div>
                   <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-lg border border-emerald-100 uppercase">
                     <Minimize2 size={12} /> {formData.sleeveType}
                   </div>
                   <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-600 text-[10px] font-black rounded-lg border border-amber-100 uppercase">
                     <Box size={12} /> {formData.packingType}
                   </div>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-5">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Purchase Order Reference</label>
                  <select 
                    className="w-full rounded-2xl border border-slate-200 p-4 text-sm font-bold bg-slate-50 focus:bg-white focus:border-indigo-500 transition outline-none" 
                    value={formData.poId} 
                    onChange={(e) => handlePOChange(e.target.value)}
                  >
                    <option value="">-- Direct/Stock Job (No PO) --</option>
                    {orders.map(o => <option key={o.id} value={o.id}>{o.poNumber} | {o.buyerName} ({o.styleName})</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Style Name / ID *</label>
                  <input type="text" required placeholder="e.g. Classic Oxford Shirt" className="w-full rounded-2xl border border-slate-200 p-4 text-sm font-bold bg-slate-50 focus:bg-white focus:border-indigo-500 transition outline-none" value={formData.styleName} onChange={(e) => setFormData({ ...formData, styleName: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Production Line</label>
                    <select className="w-full rounded-2xl border border-slate-200 p-4 text-sm font-bold bg-slate-50" value={formData.productionLine} onChange={(e) => setFormData({...formData, productionLine: e.target.value})}>
                      <option value="Line 1">Line 1</option>
                      <option value="Line 2">Line 2</option>
                      <option value="Line 3">Line 3</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Pattern Option</label>
                    <input type="text" placeholder="PAT-V2" className="w-full rounded-2xl border border-slate-200 p-4 text-sm font-bold bg-slate-50" value={formData.patternOption} onChange={(e) => setFormData({...formData, patternOption: e.target.value})} />
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-50 p-8 rounded-[32px] border border-slate-200 space-y-6">
                <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                  <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Hash size={16} /> Load Breakdown
                  </h4>
                  <span className="text-2xl font-black text-indigo-600 tracking-tighter">{totalQuantity} PCS</span>
                </div>
                <div className="grid grid-cols-5 gap-3">
                  {(['s', 'm', 'l', 'xl', 'xxl'] as const).map(size => (
                    <div key={size} className="space-y-1.5">
                      <span className="text-[9px] font-black text-center block uppercase text-slate-400">{size}</span>
                      <input type="number" placeholder="0" className="w-full text-center border-2 border-white p-3 rounded-xl text-xs font-black bg-white focus:border-indigo-500 shadow-sm" value={sizes[size] || ''} onChange={(e) => handleSizeChange(size, e.target.value)} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-8">
            <h3 className="text-sm font-black text-slate-800 border-b border-slate-100 pb-4 flex items-center gap-3 uppercase tracking-widest">
              <Layers size={20} className="text-indigo-600" /> 2. Technical Specifications
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-4">
                  <label className="relative block h-40 rounded-[32px] border-2 border-dashed border-slate-200 hover:border-indigo-400 transition cursor-pointer bg-slate-50 group overflow-hidden">
                    {jobImage ? (
                      <img src={jobImage} className="w-full h-full object-cover" alt="style" />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-slate-400">
                        <ImageIcon size={32} className="mb-2 opacity-40 group-hover:scale-110 transition" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Reference Image</span>
                      </div>
                    )}
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, setJobImage)} />
                  </label>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <label className="relative block h-28 rounded-2xl border-2 border-dashed border-slate-200 hover:border-indigo-400 transition cursor-pointer bg-slate-50 overflow-hidden">
                      {mainLabelImage ? (
                        <img src={mainLabelImage} className="w-full h-full object-cover" alt="label" />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                          <Tag size={20} className="mb-1 opacity-40" />
                          <span className="text-[9px] font-black uppercase">Main Label</span>
                        </div>
                      )}
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, setMainLabelImage)} />
                    </label>
                    <label className="relative block h-28 rounded-2xl border-2 border-dashed border-slate-200 hover:border-indigo-400 transition cursor-pointer bg-slate-50 overflow-hidden">
                      {additionalLabelImage ? (
                        <img src={additionalLabelImage} className="w-full h-full object-cover" alt="care" />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                          <Info size={20} className="mb-1 opacity-40" />
                          <span className="text-[9px] font-black uppercase">Care Label</span>
                        </div>
                      )}
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, setAdditionalLabelImage)} />
                    </label>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase block tracking-widest">Assembly Comments</label>
                    <textarea 
                      placeholder="Line-specific sewing instructions..." 
                      className="w-full rounded-2xl border border-slate-200 p-4 text-xs font-bold h-32 resize-none bg-slate-50 focus:bg-white focus:border-indigo-500 transition outline-none"
                      value={formData.ppComments}
                      onChange={(e) => setFormData({...formData, ppComments: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase block tracking-widest">Stitching Audit Specs</label>
                    <textarea 
                      placeholder="Thread SPI, needle types, tension details..." 
                      className="w-full rounded-2xl border border-slate-200 p-4 text-xs font-bold h-32 resize-none bg-slate-50 focus:bg-white focus:border-indigo-500 transition outline-none"
                      value={formData.stitchingComments}
                      onChange={(e) => setFormData({...formData, stitchingComments: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-slate-400 uppercase block tracking-widest">Trims & Accessories</label>
                   <input 
                    type="text" 
                    placeholder="Buttons, zippers, pins, tissue paper specs..." 
                    className="w-full rounded-2xl border border-slate-200 p-4 text-sm font-bold bg-slate-50 focus:bg-white focus:border-indigo-500 transition outline-none" 
                    value={formData.accessories}
                    onChange={(e) => setFormData({...formData, accessories: e.target.value})}
                   />
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-8">
            <h3 className="text-sm font-black text-slate-800 border-b border-slate-100 pb-4 flex items-center gap-3 uppercase tracking-widest">
              <Package size={20} className="text-indigo-600" /> 3. Material Availability
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <div className="space-y-5">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Fabric Batch *</label>
                  <select required className="w-full rounded-2xl border border-slate-200 p-4 text-sm font-bold bg-slate-50" value={formData.fabricBatchId} onChange={(e) => setFormData({ ...formData, fabricBatchId: e.target.value })}>
                    <option value="">-- Select Fabric Roll --</option>
                    {fabrics.map(f => <option key={f.id} value={f.id}>{f.batchNumber} ({f.color} - {f.meters}m avail)</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">CAD Average</label>
                    <input type="number" step="0.01" className="w-full border border-slate-200 p-4 rounded-2xl text-sm font-bold bg-slate-50" value={formData.averageDeclared || ''} onChange={(e) => setFormData({ ...formData, averageDeclared: Number(e.target.value) })} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Issued Mtrs</label>
                    <input type="number" step="0.1" className="w-full border border-slate-200 p-4 rounded-2xl text-sm font-bold bg-slate-50" value={formData.fabricMetersIssued || ''} onChange={(e) => setFormData({ ...formData, fabricMetersIssued: Number(e.target.value) })} />
                  </div>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase mb-4 block tracking-widest">BOM & Compliance Checklist</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[
                    { key: 'ppSample', label: 'PP Approved' },
                    { key: 'fabric', label: 'Rolls Verified' },
                    { key: 'fusing', label: 'Interlining' },
                    { key: 'tags', label: 'Wash Tags' },
                    { key: 'trims', label: 'Buttons/Zips' },
                    { key: 'otherTrims', label: 'Packing Mat.' }
                  ].map(({key, label}) => (
                    <div key={key} className="group">
                      <label className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer ${checklist[key as keyof typeof checklist] ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-100 hover:border-indigo-100'}`}>
                        <input 
                          type="checkbox" 
                          className="w-5 h-5 text-indigo-600 rounded-lg border-2 border-slate-200 transition-all focus:ring-indigo-500"
                          checked={checklist[key as keyof typeof checklist]} 
                          onChange={() => setChecklist({...checklist, [key as keyof typeof checklist]: !checklist[key as keyof typeof checklist]})} 
                        />
                        <span className="text-[10px] font-black uppercase text-slate-700 tracking-tight">{label}</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <div className="pt-10 border-t flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-200 animate-pulse"></div>
              Issuance generates live barcodes for the cutting floor
            </div>
            <button type="submit" className="w-full md:w-auto bg-slate-900 hover:bg-indigo-600 text-white font-black px-12 py-5 rounded-[24px] shadow-2xl transition-all flex items-center justify-center gap-4 uppercase tracking-[0.2em] text-xs group">
              <Save size={20} className="group-hover:scale-110 transition" />
              Issue to Floor
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JobIssuance;