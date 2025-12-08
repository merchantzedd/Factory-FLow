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
}

export interface JobProcessLog {
  stage: ProcessStage;
  entryDate: string; // ISO String
  completionDate?: string; // ISO String
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
}

export interface Job {
  id: string;
  jobId: string;
  fabricBatchId: string;
  styleName: string;
  
  // Quantities
  quantity: number; // Total derived from sizes
  sizeBreakdown: JobSizeBreakdown;
  buttonQuantity: number;
  
  // Fabric & Consumption
  fusingType: string;
  fabricMetersIssued: number;
  averageDeclared: number;

  // New Fields
  productionLine: string; // Line 1, Line 2, etc.
  jobImageUrl?: string;
  ppComments?: string;
  checklist: JobChecklist;
  
  // Post Cutting Data
  cuttingReport?: CuttingReport;

  currentStage: ProcessStage;
  isCompleted: boolean;
  processHistory: JobProcessLog[];
  createdAt: string;
}

export interface AttendanceEntry {
  id: string;
  date: string; // YYYY-MM-DD
  line: string; // Line 1, Line 2...
  stage: ProcessStage;
  operators: number;
  helpers: number;
  manpower: number; // General labor
}

export interface StageAnalysis {
  stage: ProcessStage;
  avgDays: number;
  minDays: number;
  maxDays: number;
  totalJobs: number;
}
