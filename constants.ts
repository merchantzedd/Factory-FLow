import { ProcessStage, FabricBatch, Job } from './types';

export const STAGES_ORDERED = [
  ProcessStage.CUTTING,
  ProcessStage.FUSING,
  ProcessStage.SEWING,
  ProcessStage.BUTTON_HOLING,
  ProcessStage.FINISHING,
  ProcessStage.IRONING,
  ProcessStage.PACKING,
  ProcessStage.QC,
  ProcessStage.QC_REJECTED,
  ProcessStage.DISPATCH
];

export const calculateDaysDiff = (start: string, end: string): number => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = diffTime / (1000 * 60 * 60 * 24); 
  return parseFloat(diffDays.toFixed(1));
};

export const INITIAL_FABRICS: FabricBatch[] = [
  {
    id: 'f1',
    batchNumber: 'FAB-2023-001',
    color: 'Navy Blue',
    meters: 480,
    metersOrdered: 500,
    invoiceNumber: 'INV-A101',
    shrinkage: '3% Length, 2% Width',
    fabricType: 'Woven',
    washType: 'Non-Wash',
    content: '98% Cotton, 2% Elastane',
    imageUrl: 'https://picsum.photos/id/20/300/300',
    receivedDate: '2023-10-01',
    supplier: 'Textile Corp A'
  },
  {
    id: 'f2',
    batchNumber: 'FAB-2023-002',
    color: 'Charcoal Grey',
    meters: 350,
    metersOrdered: 350,
    invoiceNumber: 'INV-B202',
    shrinkage: '5% Length',
    fabricType: 'Knits',
    washType: 'Wash',
    content: '100% Cotton Jersey',
    imageUrl: 'https://picsum.photos/id/22/300/300',
    receivedDate: '2023-10-05',
    supplier: 'Global Fabrics'
  }
];

export const INITIAL_JOBS: Job[] = [
  {
    id: 'j1',
    jobId: 'JOB-1001',
    fabricBatchId: 'f1',
    styleName: 'Slim Fit Blazer',
    quantity: 100,
    sizeBreakdown: { s: 20, m: 40, l: 30, xl: 10, xxl: 0 },
    sleeveDetails: 'Long Sleeve',
    labelDetails: 'Main + Care Label',
    patternOption: 'PAT-A204',
    fusingType: 'Hard Woven',
    fabricMetersIssued: 120,
    averageDeclared: 1.2,
    productionLine: 'Line 1',
    ppComments: 'Ensure double stitching on lapel.',
    checklist: {
      ppSample: true,
      fusing: true,
      tags: true,
      trims: true,
      fabric: true,
      otherTrims: false
    },
    stageStatus: {
      [ProcessStage.CUTTING]: { inward: 100, output: 100 },
      [ProcessStage.FUSING]: { inward: 100, output: 40 },
      [ProcessStage.SEWING]: { inward: 40, output: 0 }
    },
    currentStage: ProcessStage.SEWING,
    isCompleted: false,
    createdAt: '2023-10-02',
    processHistory: [
      {
        stage: ProcessStage.CUTTING,
        entryDate: '2023-10-02T08:00:00.000Z',
        completionDate: '2023-10-03T14:00:00.000Z',
        processedQuantity: 100
      },
      {
        stage: ProcessStage.FUSING,
        entryDate: '2023-10-03T15:00:00.000Z',
        processedQuantity: 40
      },
      {
        stage: ProcessStage.SEWING,
        entryDate: '2023-10-04T09:00:00.000Z',
        processedQuantity: 0
      }
    ]
  }
];