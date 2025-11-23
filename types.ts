
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

// New Interface for Monte Carlo Scenarios
export interface SimulationData {
  day: number;
  bullCase: number; // Scenario A: Policy Tightening
  baseCase: number; // Scenario B: Status Quo
  bearCase: number; // Scenario C: Domestic Crash
}

export interface SimulationResult {
  paths: { day: number; price: number }[][];
  percentiles: { day: number; p10: number; p50: number; p90: number }[];
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
