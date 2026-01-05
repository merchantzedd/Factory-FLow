
export enum ProcessStage {
  CUTTING = 'Cutting',
  SEWING = 'Sewing',
  BUTTON_HOLING = 'Button Holing & Attaching',
  FINISHING = 'Finishing',
  IRONING = 'Iron',
  PACKING = 'Packing',
  QC = 'QC Approval',
  DISPATCH = 'Dispatch'
}

export interface FabricBatch {
  id: string;
  batchNumber: string;
  color: string;
  meters: number;
  imageUrl: string;
  receivedDate: string;
  supplier: string;
  linkedPoId?: string;
}

export interface JobProcessLog {
  stage: ProcessStage;
  entryDate: string;
  completionDate?: string;
  processedQuantity?: number;
  notes?: string;
}

export interface JobChecklist {
  ppSample: boolean;
  fusing: boolean;
  tags: boolean;
  trims: boolean;
  fabric: boolean;
  otherTrims: boolean;
}

export interface JobSizeBreakdown {
  s: number;
  m: number;
  l: number;
  xl: number;
  xxl: number;
}

export interface CuttingReport {
  actualAverage: number;
  fabricDefects: string;
  layerColor: string;
  cuttingDate: string;
  sizeOutput: JobSizeBreakdown;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  clientName: string;
  styleName: string;
  totalQuantity: number;
  deadline: string;
  expectedDeliveryDate?: string;
  fabricStatus: 'Pending' | 'Ordered' | 'Received';
  fabricOrderDate?: string;
  fabricExpectedDate?: string;
  status: 'Planning' | 'Production' | 'Completed';
}

export interface Job {
  id: string;
  jobId: string;
  poId?: string;
  fabricBatchId: string;
  styleName: string;
  quantity: number;
  sizeBreakdown: JobSizeBreakdown;
  sleeveDetails: string;
  labelDetails: string;
  patternOption: string;
  fusingType: string;
  fabricMetersIssued: number;
  averageDeclared: number;
  productionLine: string;
  jobImageUrl?: string;
  ppComments?: string;
  ppSampleComments?: string;
  checklist: JobChecklist;
  cuttingReport?: CuttingReport;
  currentStage: ProcessStage;
  isCompleted: boolean;
  processHistory: JobProcessLog[];
  createdAt: string;
  isUrgent?: boolean;
}

export interface AttendanceEntry {
  id: string;
  date: string;
  line: string;
  stage: ProcessStage;
  operators: number;
  helpers: number;
  manpower: number;
}

export interface StageAnalysis {
  stage: ProcessStage;
  avgDays: number;
  minDays: number;
  maxDays: number;
  totalJobs: number;
}

export interface FinancialMetric {
  revenue: number;
  materialCost: number;
  laborCost: number;
  grossProfit: number;
}
