

import { InventoryDetail, CalculationParameterSet, MarketPriceSeries, CalculatedInventoryItem } from '../types';

/**
 * Calculates the daily compound interest rate.
 * Formula: r_d = (1 + r_a)^(1/365) - 1
 */
const calculateDailyInterestRate = (annualRate: number): number => {
  return Math.pow(1 + annualRate, 1 / 365) - 1;
};

/**
 * Determines the goods status based on dates relative to TODAY.
 */
const getGoodsStatus = (
  today: Date,
  shippingDate: string,
  etaDate: string,
  storageEntryDate: string | null
): '期货 (Future)' | '半期 (Semi)' | '现货 (Spot)' => {
  const ship = new Date(shippingDate);
  const eta = new Date(etaDate);
  
  if (storageEntryDate) {
    const entry = new Date(storageEntryDate);
    if (today >= entry) return '现货 (Spot)';
  }

  if (ship > today) return '期货 (Future)';
  if (today >= ship && today < eta) return '半期 (Semi)';
  
  // Fallback if dates are weird but no entry date yet
  return '半期 (Semi)';
};

/**
 * Main Calculation Engine
 */
export const calculateInventoryItem = (
  item: InventoryDetail,
  params: CalculationParameterSet,
  marketPrice: MarketPriceSeries,
  today: Date = new Date('2025-12-09') // Updated to 2025-12-09 as per request
): CalculatedInventoryItem => {
  
  // 1. Status & Time
  const status = getGoodsStatus(today, item.Shipping_Date, item.ETA_Date, item.Storage_Entry_Date);
  
  let storageDays = 0;
  if (item.Storage_Entry_Date) {
    const entry = new Date(item.Storage_Entry_Date);
    const diffTime = Math.abs(today.getTime() - entry.getTime());
    storageDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  }

  // 2. Cost Calculation (RMB/KG)
  // Cost = (P_USD / 1000 * FX * Tariff * VAT) + Misc
  // Note: Usually Future_Price_USD_Per_KG is already per KG. 
  // If the input is Per Ton (common in futures), divide by 1000. 
  // Assuming input is per KG based on user prompt "成交期货价/1000" but usually prices are ~4000-6000 USD/Ton.
  // Let's assume input Future_Price_USD_Per_KG is actually raw input (e.g. 5.8 USD)
  // User prompt: "成交期货价/1000 (换算到美元/kg)". This implies the raw input is USD/TON.
  
  const priceUsdPerKg = item.Future_Price_USD_Per_KG / 1000; 
  
  const estimatedCostRmbPerKg = 
    (priceUsdPerKg * item.Future_Ref_FX_USD_CNY * params.Tariff_Multiplier * params.VAT_Multiplier) 
    + params.Fixed_Misc_Cost_Per_KG;

  // 3. Daily Costs (RMB)
  // Storage
  const weightTons = item.Weight_KG / 1000;
  const dailyStorageCost = weightTons * params.Storage_Cost_Per_Ton_Day;

  // Interest
  // DailyIC = Cost * Weight * Gamma * r_d
  const dailyRate = calculateDailyInterestRate(params.Annual_Interest_Rate);
  const totalCostBasis = estimatedCostRmbPerKg * item.Weight_KG;
  const dailyInterestCost = totalCostBasis * params.Capital_Occupancy_Ratio * dailyRate;

  // 4. Financials (RMB)
  const estSellingPrice = marketPrice.Est_Selling_Price_RMB_Per_KG;
  
  // Estimated Receivable
  const estReceivable = estSellingPrice * item.Weight_KG;
  
  // Estimated Payable (Logic: Cost * Weight - Floor)
  // Note: The floor applies per container usually. If we calculate per SKU, we need to be careful not to deduct 150k multiple times for one container.
  // For this SKU-level calculation, we will compute the GROSS payable for the SKU. 
  // The aggregation logic in the View needs to handle the "-150,000" per container logic.
  // HOWEVER, to keep simple line-item logic: Let's assume the floor is handled at summary.
  // Here we just return Gross Payable.
  const grossPayable = totalCostBasis; 

  // Estimated Profit
  const estProfit = (estSellingPrice - estimatedCostRmbPerKg) * item.Weight_KG;

  return {
    ...item,
    Goods_Status: status,
    Storage_Days: storageDays,
    Estimated_Cost_RMB_Per_KG: estimatedCostRmbPerKg,
    Daily_Storage_Cost_RMB: dailyStorageCost,
    Daily_Interest_Cost_RMB: dailyInterestCost,
    Estimated_Receivable_RMB: estReceivable,
    Estimated_Payable_RMB: grossPayable, // We will adjust for floor in the UI aggregation
    Estimated_Net_Cash_RMB: estReceivable - grossPayable, // Pre-floor adjustment
    Estimated_Profit_RMB: estProfit
  };
};