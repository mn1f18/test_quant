


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
): '期货 (Future)' | '半期 (Semi)' | '现货 (Spot)' | '待入库 (Pending)' => {
  
  // 1. Direct Spot Entry Logic (If no shipping info, assume Spot or Pending Spot based on entry date)
  if ((!shippingDate || shippingDate === '') && (!etaDate || etaDate === '')) {
      if (storageEntryDate) {
          const entry = new Date(storageEntryDate);
          // If entry is today or past, it's spot. If future, it's pending.
          if (today >= entry) return '现货 (Spot)';
          return '待入库 (Pending)';
      }
      return '现货 (Spot)'; // Fallback if no dates at all
  }

  // 2. Standard Logic
  const ship = new Date(shippingDate);
  const eta = new Date(etaDate);
  
  if (storageEntryDate) {
    const entry = new Date(storageEntryDate);
    if (today >= entry) return '现货 (Spot)';
  }

  if (ship > today) return '期货 (Future)';
  if (today >= ship && today < eta) return '半期 (Semi)';
  
  // Fallback
  return '半期 (Semi)';
};

/**
 * Main Calculation Engine
 */
export const calculateInventoryItem = (
  item: InventoryDetail,
  params: CalculationParameterSet,
  marketPrice: MarketPriceSeries,
  today: Date = new Date('2025-12-09') // Fixed Date for Demo
): CalculatedInventoryItem => {
  
  // 1. Status & Time
  const status = getGoodsStatus(today, item.Shipping_Date, item.ETA_Date, item.Storage_Entry_Date);
  
  let storageDays = 0;
  if (item.Storage_Entry_Date) {
    const entry = new Date(item.Storage_Entry_Date);
    // If we are simulating "Pending" (entry in future), storage days is 0.
    if (today >= entry) {
      const diffTime = Math.abs(today.getTime() - entry.getTime());
      storageDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    }
  }

  // 2. Cost Calculation (RMB/KG)
  let estimatedCostRmbPerKg = 0;
  let totalCostBasis = 0;

  // CHECK MODE: SPOT vs FUTURE
  if (item.Spot_Price_RMB_Per_KG && item.Spot_Price_RMB_Per_KG > 0) {
      // --- SPOT PURCHASE MODE ---
      // Cost = Spot Price + Misc
      // (No Tariff/VAT logic applied here as they are assumed included in Spot Purchase Price or handled upstream)
      const baseSpotPrice = item.Spot_Price_RMB_Per_KG;
      estimatedCostRmbPerKg = baseSpotPrice + params.Fixed_Misc_Cost_Per_KG;
      
      // Interest is calculated on the Capital used (Spot Price)
      totalCostBasis = baseSpotPrice * item.Weight_KG;
  } else {
      // --- FUTURE IMPORT MODE ---
      // Cost = (P_USD / 1000 * FX * Tariff * VAT) + Misc
      const priceUsdPerKg = item.Future_Price_USD_Per_KG / 1000; 
      estimatedCostRmbPerKg = 
        (priceUsdPerKg * item.Future_Ref_FX_USD_CNY * params.Tariff_Multiplier * params.VAT_Multiplier) 
        + params.Fixed_Misc_Cost_Per_KG;
      
      totalCostBasis = estimatedCostRmbPerKg * item.Weight_KG;
  }

  // 3. Daily Costs (RMB)
  // Storage
  const weightTons = item.Weight_KG / 1000;
  const dailyStorageCost = weightTons * params.Storage_Cost_Per_Ton_Day;

  // Interest
  // DailyIC = Cost * Weight * Gamma * r_d
  const dailyRate = calculateDailyInterestRate(params.Annual_Interest_Rate);
  const dailyInterestCost = totalCostBasis * params.Capital_Occupancy_Ratio * dailyRate;

  // 4. Financials (RMB)
  const estSellingPrice = marketPrice.Est_Selling_Price_RMB_Per_KG;
  
  // Estimated Receivable
  const estReceivable = estSellingPrice * item.Weight_KG;
  
  // Estimated Payable (Logic: Cost * Weight - Floor)
  // We return gross payable here, UI handles floor deduction.
  // Note: For Spot Purchase, "Payable" might imply "Original Cost Paid" effectively.
  const grossPayable = estimatedCostRmbPerKg * item.Weight_KG; 

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
    Estimated_Payable_RMB: grossPayable, 
    Estimated_Net_Cash_RMB: estReceivable - grossPayable,
    Estimated_Profit_RMB: estProfit
  };
};
