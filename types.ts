

// Enums
export enum CutType {
  CORE_SUPPLY = '核心供应 (Key)', // e.g., Brisket for key clients
  ELASTIC_SPEC = '弹性投机 (Spec)', // e.g., Shin/Shank
}

export enum SignalType {
  BUY = '做多 (BUY)',
  SELL = '做空 (SELL)',
  HOLD = '观望 (HOLD)',
}

export enum OrderStatus {
  PENDING_APPROVAL = '待审批',
  EXECUTED = '已成交',
  REJECTED = '已拒绝',
}

// Interfaces
export interface MarketDataPoint {
  date: string;
  price: number; // Index Price (CNY/kg)
  ma5: number;
  ma20: number;
  predicted: number; // Model Forecast
  volume: number;
  importCost: number; // CIF/Cost
}

export interface ChartSeries {
  date: string;
  value: number;
  value2?: number; // For comparison lines
  label?: string;
}

export interface Warehouse {
  id: string;
  name: string;
  location: string;
  capacityUsed: number; // Percentage
  dailyCostPerTon: number; // CNY
}

export interface Position {
  id: string;
  cutName: string; // Chinese Name
  englishName?: string;
  type: CutType;
  quantityTons: number;
  avgCost: number; // CNY/kg or CNY/Ton
  currentPrice: number;
  marketValue: number;
  unrealizedPL: number;
  plPercent: number;
  var95: number; // Value at Risk 95%
  stopLossPrice: number;
  // Inventory Specifics
  warehouseId: string;
  entryDate: string; // ISO Date
  daysHeld: number;
  storageCostAccrued: number;
}

export interface Factor {
  name: string;
  category: 'A类 (核心)' | 'B类 (辅助)' | 'C类 (参考)';
  impact: 'Bullish (利多)' | 'Bearish (利空)' | 'Neutral (中性)';
  value: string;
  change: string;
}

export interface BacktestResult {
  sharpeRatio: number;
  sortinoRatio: number; // Downside deviation focus
  calmarRatio: number; // Return / Max Drawdown
  maxDrawdown: number;
  annualizedReturn: number;
  winRate: number;
  profitFactor: number;
  equityCurve: { date: string; equity: number }[];
}

// Scenario Analysis Types
export interface ScenarioEvent {
  id: string;
  name: string;
  description: string;
  probability: number; // 0-1
  impactOnPrice: number; // Percentage change
  impactOnDemand: number; // Percentage change
  active: boolean;
  category: 'POLICY' | 'SUPPLY' | 'MACRO';
}

export interface SimulationResult {
  paths: { day: number; price: number }[][];
  percentiles: { day: number; p10: number; p50: number; p90: number }[];
}

export interface SimulationData {
  day: number;
  bullCase: number;
  baseCase: number;
  bearCase: number;
}

export interface Order {
  id: string;
  cutName: string;
  side: 'STOCK_IN' | 'STOCK_OUT'; // Changed from BUY/SELL to Spot terms
  price: number;
  quantity: number;
  timestamp: number;
  status: OrderStatus;
  riskCheck: boolean;
}

// New Types for Market Monitor
export interface MonitorMetric {
  id: string;
  name: string;
  category: 'UPSTREAM' | 'MIDSTREAM' | 'DOWNSTREAM';
  value: number | string;
  unit: string;
  change: number; // Percentage
  trend: 'UP' | 'DOWN' | 'FLAT';
  description: string;
  history: number[]; // Sparkline data
  severity?: 'LOW' | 'MEDIUM' | 'HIGH'; // Risk level
}

// ==========================================
// NEW INVENTORY SYSTEM TYPES (V3.0 Database)
// ==========================================

// Table 1: Calculation Parameter Set
export interface CalculationParameterSet {
  Parameter_Set_ID: number;
  Parameter_Set_Name: string;
  Annual_Interest_Rate: number; // 0.065
  Capital_Occupancy_Ratio: number; // 0.90
  Storage_Cost_Per_Ton_Day: number; // 2.2
  Tariff_Multiplier: number; // 1.12
  VAT_Multiplier: number; // 1.09
  Fixed_Misc_Cost_Per_KG: number; // 2.5
  // Default_Payment_Floor Removed as it is now in Inventory Details
}

// Table 2: Market Price Series (Simplified for Demo)
export interface MarketPriceSeries {
  SKU_Code: string;
  Product_Name: string;
  Est_Selling_Price_RMB_Per_KG: number; // Current Market Price
  Price_Date?: string; // Date of the price (YYYY-MM-DD)
}

// Table 3: Inventory Details (Core)
export interface InventoryDetail {
  Inventory_SKU_ID: string;
  Supplier_Contract_ID: string;
  Container_ID: string;
  SKU_Code: string;
  Product_Name: string;
  Weight_KG: number; // Pieces * UnitWeight usually, but raw KG here
  Pieces: number;
  
  Parameter_Set_ID: number; // FK
  Funder_ID: string; // 'Oriental', etc.
  
  // Future Mode
  Future_Price_USD_Per_KG: number;
  Future_Ref_FX_USD_CNY: number;
  
  // Spot Mode (New V4.02)
  Spot_Price_RMB_Per_KG?: number | null; 

  Shipping_Date: string; // YYYY-MM-DD (Can be empty for Spot)
  ETA_Date: string;      // YYYY-MM-DD (Can be empty for Spot)
  Storage_Entry_Date: string | null; // Actual Entry Date
  
  Country: string;
  Factory_Code: string;
  Port: string;
  Cold_Storage: string;

  // New Field V4.01
  Payment_Floor?: number; // 应付扣减额 (RMB)
  
  // New Field V4.02
  Capital_Countdown_Days?: number | null; // 资金方要求的倒计时
}

// Derived/Calculated Object (For UI Display)
export interface CalculatedInventoryItem extends InventoryDetail {
  // Status
  Goods_Status: '期货 (Future)' | '半期 (Semi)' | '现货 (Spot)' | '待入库 (Pending)';
  Storage_Days: number;
  
  // Costs
  Estimated_Cost_RMB_Per_KG: number;
  Daily_Storage_Cost_RMB: number;
  Daily_Interest_Cost_RMB: number;
  
  // Financials
  Estimated_Receivable_RMB: number;
  Estimated_Payable_RMB: number;
  Estimated_Net_Cash_RMB: number;
  Estimated_Profit_RMB: number;
}
