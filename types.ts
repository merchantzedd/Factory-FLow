
export enum ProcessStage {
  CUTTING = 'Cutting',
  FUSING = 'Fusing',
  SEWING = 'Sewing',
  BUTTON_HOLING = 'Button Holing & Attaching',
  FINISHING = 'Finishing',
  IRONING = 'Iron',
  PACKING = 'Packing',
  QC = 'QC Approval',
  QC_REJECTED = 'QC Rejected',
  DISPATCH = 'Dispatch'
}

export interface FabricBatch {
  id: string;
  batchNumber: string;
  color: string;
  meters: number;
  metersOrdered: number;
  invoiceNumber: string;
  shrinkage: string;
  fabricType: 'Knits' | 'Woven';
  washType: 'Wash' | 'Non-Wash';
  content: string;
  imageUrl: string;
  receivedDate: string;
  supplier: string;
  linkedPoId?: string;
}

export interface JobProcessLog {
  stage: ProcessStage;
  entryDate: string;
  completionDate?: string;
  processedQuantity: number;
  notes?: string;
}

export interface StageProgress {
  inward: number;
  output: number;
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

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  buyerName: string;
  brandName: string;
  clientName: string;
  styleName: string;
  totalQuantity: number;
  sizeBreakdown: JobSizeBreakdown;
  setSizes: JobSizeBreakdown;
  unsetSizes: JobSizeBreakdown;
  totalSetQty: number;
  totalUnsetQty: number;
  category: 'Formal' | 'Casual';
  sleeveType: 'Full Sleeve' | 'Half Sleeve';
  packingType: 'Board Pack' | 'Loose Pack';
  deadline: string;
  expectedDeliveryDate?: string;
  fabricStatus: 'Pending' | 'Ordered' | 'Received';
  status: 'Planning' | 'Production' | 'Completed';
}

/**
 * Interface for the detailed report generated during the fabric cutting stage.
 */
export interface CuttingReport {
  actualAverage: number;
  fabricDefects: string;
  layerColor: string;
  cuttingDate: string;
  sizeOutput: JobSizeBreakdown;
}

/**
 * Interface representing the data collected when a job is finalized and closed.
 */
export interface JobClosureData {
  packedQuantity: number;
  defectiveQuantity: number;
  shortExcessQuantity: number;
  closedAt: string;
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
  /**
   * Optional field to store technical comments related to the PP (Pre-Production) sample.
   */
  ppSampleComments?: string;
  stitchingComments?: string;
  mainLabelImageUrl?: string;
  additionalLabelImageUrl?: string;
  accessories?: string;
  checklist: JobChecklist;
  stageStatus: Partial<Record<ProcessStage, StageProgress>>;
  currentStage: ProcessStage; 
  isCompleted: boolean;
  processHistory: JobProcessLog[];
  createdAt: string;
  isUrgent?: boolean;
  /**
   * Optional link to the cutting report generated for this job.
   */
  cuttingReport?: CuttingReport;
  /**
   * Final closure data containing shipment and defect totals.
   */
  closure?: JobClosureData;
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

export interface ProductionPlan {
  id: string;
  date: string;
  assignments: {
    line: string;
    jobId: string;
    targetQty: number;
    priority: 'High' | 'Medium' | 'Low';
    reasoning: string;
  }[];
  summary: string;
}
