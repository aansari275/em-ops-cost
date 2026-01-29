// Cost categories for each OPS
export interface OpsCost {
  id: string;
  opsNo: string;
  buyerName: string;
  buyerCode: string;
  poNo?: string;
  poValue?: number; // From orders - selling price
  totalSqm?: number;

  // Cost categories (all in INR)
  materialPurchase: number;
  dyeing: number;
  weaving: number;
  finishing: number;
  rework: number;
  packingLabels: number;
  shipping: number;

  // Computed
  totalCost: number;
  margin?: number; // poValue - totalCost
  marginPercent?: number; // (margin / poValue) * 100

  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  notes?: string;
}

// OPS from the orders app
export interface OpsNo {
  id: string;
  opsNo: string;
  buyerName: string;
  buyerCode: string;
  merchantCode?: string;
  managedBy?: string;
  poNo?: string;
  orderType?: 'custom' | 'broadloom' | 'area_rugs' | 'samples';
  companyCode?: 'EMPL' | 'EHI';
  orderConfirmationDate?: string;
  buyerPoShipDate?: string;
  exFactoryDate?: string;
  totalPcs?: number;
  totalSqm?: number;
  poValue?: number;
  source?: 'orders' | 'manual' | 'import';
  sourceId?: string;
  status?: 'active' | 'in_production' | 'shipped' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

// For creating new manual OPS entries
export interface ManualOpsInput {
  opsNo: string;
  buyerName: string;
  buyerCode: string;
  poNo?: string;
  poValue?: number;
  totalSqm?: number;
}

// Cost entry form data
export interface CostFormData {
  materialPurchase: string;
  dyeing: string;
  weaving: string;
  finishing: string;
  rework: string;
  packingLabels: string;
  shipping: string;
  notes: string;
}

// Dashboard stats
export interface DashboardStats {
  totalOrders: number;
  ordersWithCosts: number;
  totalRevenue: number; // Sum of all poValues
  totalCosts: number; // Sum of all costs
  averageMargin: number; // Average margin percentage
  topCostCategory: string;
}

// Cost breakdown by category
export interface CostBreakdown {
  category: string;
  amount: number;
  percentage: number;
}
