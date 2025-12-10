



import { MarketDataPoint, Position, CutType, BacktestResult, Factor, ScenarioEvent, Warehouse, MonitorMetric, ChartSeries, SimulationData, InventoryDetail, CalculationParameterSet, MarketPriceSeries } from './types';

// ... (Keep existing Chart/Market Data Constants) ...

// Real Data Source: China Import Mainstream Cuts Price Index
const RAW_INDEX_DATA = `
2026/10/29	49.075
2026/10/28	49.15
2026/10/27	49.15
2026/10/24	49.35
2026/10/23	49.275
2026/10/22	49.45
2026/10/21	49.375
2026/10/20	49.375
2026/10/17	49.3
2026/10/16	49.325
2026/10/15	49.35
2026/10/14	49.375
2026/10/13	49.375
2026/10/11	49.35
2026/10/10	49.35
2026/10/9	49.4
2026/9/30	49.45
2026/9/29	49.45
2026/9/28	49.35
2026/9/26	49.35
2026/9/25	49.35
2026/9/24	49.5
2026/9/23	49.4
2026/9/22	49.5
2026/9/19	49.5
2026/9/18	49.55
2026/9/17	49.65
2026/9/16	49.65
2026/9/15	49.65
2026/9/12	49.7
2026/9/11	49.7
2026/9/10	49.8
2026/9/9	49.75
2026/9/8	49.75
2026/9/5	49.7
2026/9/4	49.7
2026/9/3	49.85
2026/9/2	49.9
2026/9/1	49.9
2026/8/29	49.55
2026/8/28	49.1
2026/8/27	49.15
2026/8/26	49.3
2026/8/25	49.6
2026/8/22	49.75
2026/8/21	50
2026/8/20	50.2
2026/8/19	50.225
2026/8/18	50.2
2026/8/15	50.1
2026/8/14	50.25
2026/8/13	50.45
2026/8/12	50.5
2026/8/11	50.6
2026/8/8	50.75
2026/8/7	50.75
2026/8/6	50.75
2026/8/5	50.65
2026/8/4	50.6
2026/8/1	50.475
2026/7/31	50.5
2026/7/30	50.7
2026/7/29	50.75
2026/7/28	50.8
2026/7/25	50.85
2026/7/24	50.85
2026/7/23	50.55
2026/7/22	50.7
2026/7/21	51
2026/7/18	51.1
2026/7/17	50.925
`;

// Parse the raw data
const parseData = (): MarketDataPoint[] => {
  const lines = RAW_INDEX_DATA.trim().split('\n').reverse(); // Reverse to chronological order
  const data: MarketDataPoint[] = [];
  
  lines.forEach((line, index) => {
    const [dateStr, priceStr] = line.split('\t');
    const price = parseFloat(priceStr); // Index is roughly CNY/kg
    
    // Calculate simple MAs
    const ma5 = index >= 4 ? (data.slice(index - 4, index + 1).reduce((a, b) => a + b.price, 0) + price) / 5 : price;
    const ma20 = index >= 19 ? (data.slice(index - 19, index + 1).reduce((a, b) => a + b.price, 0) + price) / 20 : price;

    // Simulate Import Cost (CIF) - typically lower than wholesale index
    const importCost = price * 0.92 + (Math.sin(index) * 0.2);

    // Simulate Prediction (LSTM style bias)
    const predicted = price * 0.99 + (Math.cos(index / 3) * 0.3);

    data.push({
      date: dateStr,
      price,
      ma5,
      ma20,
      predicted,
      volume: Math.floor(Math.random() * 200) + 50, // Daily trading volume (tons)
      importCost,
    });
  });
  return data;
};

export const REAL_MARKET_DATA = parseData();

export const SCENARIO_EVENTS: ScenarioEvent[] = [
    {
        id: 'EVT-01',
        name: '保障措施落地 (Safeguard Implemented)',
        description: '11/26 政策确认，对进口牛肉加征关税。成本激增，现货价格短期脉冲式上涨。',
        probability: 0.85,
        impactOnPrice: 12.5, // +12.5% Price
        impactOnDemand: -5.0, // Demand destruction
        active: false,
        category: 'POLICY'
    },
    {
        id: 'EVT-02',
        name: '国产恐慌性抛售 (Domestic Panic)',
        description: '母牛存栏出清加速，国产牛肉价格崩盘，拖累进口冻品价格。',
        probability: 0.30,
        impactOnPrice: -15.0, // -15% Price
        impactOnDemand: 2.0,
        active: false,
        category: 'SUPPLY'
    },
    {
        id: 'EVT-03',
        name: '人民币汇率破7.3 (CNY Devaluation)',
        description: '美元走强，进口成本大幅上升，压缩贸易利润空间。',
        probability: 0.45,
        impactOnPrice: 3.5,
        impactOnDemand: -2.0,
        active: false,
        category: 'MACRO'
    },
    {
        id: 'EVT-04',
        name: '美国取消巴西关税 (US Demand)',
        description: '巴西货源分流至美国，中国到港量减少，支撑价格。',
        probability: 1.0, // Already happened
        impactOnPrice: 4.0,
        impactOnDemand: 0,
        active: true, // Default active
        category: 'SUPPLY'
    }
];

export const SIMULATION_DATA: SimulationData[] = Array.from({ length: 60 }, (_, i) => {
    const base = 49.3;
    return {
        day: i,
        bullCase: base * (1 + (i / 60) * 0.15) + (Math.random() - 0.5), // +15%
        baseCase: base * (1 + (i / 60) * 0.02) + (Math.random() - 0.5) * 0.5, // +2%
        bearCase: base * (1 - (i / 60) * 0.10) + (Math.random() - 0.5) // -10%
    };
});

// 1. Domestic Wholesale vs Import Index
export const CHART_PRICE_SPREAD: ChartSeries[] = Array.from({length: 30}, (_, i) => ({
    date: `2026-09-${i+1}`,
    value: 66.5 - (i * 0.1) + Math.random(), // Domestic falling
    value2: 49.0 + (i * 0.05) + Math.random(), // Import rising
    label: 'Spread'
}));

// 2. Brazil Slaughter Scale (Escala de Abate)
export const CHART_SLAUGHTER: ChartSeries[] = Array.from({length: 30}, (_, i) => ({
    date: `Week ${i+1}`,
    value: 6 + Math.sin(i/5) * 2 + Math.random(), // Days
}));

// 3. Import Volume (Tons)
export const CHART_IMPORT_VOL: ChartSeries[] = Array.from({length: 12}, (_, i) => ({
    date: `2026-${i+1}`,
    value: 240000 + Math.random() * 40000,
    value2: 230000 + Math.random() * 30000 // Last Year
}));

export const KEY_FACTORS: Factor[] = [
  // Policy / Macro
  { name: '进口保障措施 (Safeguard)', category: 'A类 (核心)', impact: 'Bullish (利多)', value: 'Decision 11/26', change: 'High Risk' },
  { name: '美巴关税 (US-Brazil Tariff)', category: 'A类 (核心)', impact: 'Bullish (利多)', value: '40% Cancelled', change: 'New' },
  { name: '人民币汇率 (CNY/USD)', category: 'A类 (核心)', impact: 'Neutral (中性)', value: '7.11', change: 'Flat' },
  { name: '5年期LPR利率', category: 'B类 (辅助)', impact: 'Neutral (中性)', value: '3.60%', change: 'Unchanged' },
  
  // Supply / Domestic / Fundamentals (Rich Data)
  { name: '批发-进口8件套 (8-Piece)', category: 'A类 (核心)', impact: 'Bearish (利空)', value: '¥52.0/kg', change: '-0.5%' },
  { name: '批发-巴西90VL (Trimming)', category: 'B类 (辅助)', impact: 'Neutral (中性)', value: '¥39.5/kg', change: '+0.2%' },
  { name: '内外价差 (Spread)', category: 'A类 (核心)', impact: 'Bearish (利空)', value: '¥17.36/kg', change: '收窄' },
  { name: '国产-育肥公牛 (Fat Bull)', category: 'A类 (核心)', impact: 'Bearish (利空)', value: '¥27.5/kg', change: 'Low' },
  { name: '国产-架子母牛 (Cow)', category: 'A类 (核心)', impact: 'Bearish (利空)', value: '¥22.4/kg', change: 'Weak' },
  { name: '港口冷库利用率 (Port Cap)', category: 'A类 (核心)', impact: 'Bearish (利空)', value: '92.5%', change: 'Critical' },
  { name: '进口总量 (Import Vol)', category: 'B类 (辅助)', impact: 'Bearish (利空)', value: '28万吨', change: '+18%' },
  { name: '港口查验率 (Inspection)', category: 'B类 (辅助)', impact: 'Bullish (利多)', value: 'Very High', change: '+15%' },
  { name: '屠宰利润-肉牛 (Margin)', category: 'C类 (参考)', impact: 'Bearish (利空)', value: '-¥450/头', change: 'Loss' },
  { name: '替代品-猪肉批发 (Pork)', category: 'C类 (参考)', impact: 'Neutral (中性)', value: '¥22.5/kg', change: 'Stable' },
  { name: '巴西-出口中国均价 (Export)', category: 'B类 (辅助)', impact: 'Bullish (利多)', value: '$4,650/t', change: '+1.5%' },
  { name: '巴西活牛 (Arroba)', category: 'B类 (辅助)', impact: 'Neutral (中性)', value: 'R$ 321.5', change: '-0.3%' },
];

export const WAREHOUSES: Warehouse[] = [
  { id: 'WH-SH', name: '上海洋山保税库', location: 'Shanghai', capacityUsed: 85, dailyCostPerTon: 3.5 },
  { id: 'WH-TJ', name: '天津港冷链中心', location: 'Tianjin', capacityUsed: 60, dailyCostPerTon: 2.8 },
  { id: 'WH-GZ', name: '广州南沙冷库', location: 'Guangzhou', capacityUsed: 92, dailyCostPerTon: 3.8 },
];

export const MOCK_POSITIONS: Position[] = [
  {
    id: 'POS-001',
    cutName: '眼肉 (Ribeye) - 巴西',
    englishName: 'Ribeye S/G',
    type: CutType.CORE_SUPPLY,
    quantityTons: 25,
    avgCost: 68.5, // CNY/kg
    currentPrice: 72.0,
    marketValue: 1800000, 
    unrealizedPL: 87500,
    plPercent: 5.1,
    var95: 45000,
    stopLossPrice: 65.0, 
    warehouseId: 'WH-SH',
    entryDate: '2026-09-15',
    daysHeld: 42,
    storageCostAccrued: 3675, // approx
  },
  {
    id: 'POS-002',
    cutName: '前四分体 (FQ) - 乌拉圭',
    englishName: 'FQ 80VL',
    type: CutType.CORE_SUPPLY,
    quantityTons: 120,
    avgCost: 41.0,
    currentPrice: 39.5,
    marketValue: 4740000,
    unrealizedPL: -180000,
    plPercent: -3.65,
    var95: 120000,
    stopLossPrice: 38.9,
    warehouseId: 'WH-TJ',
    entryDate: '2026-08-20',
    daysHeld: 68,
    storageCostAccrued: 22848,
  },
  {
    id: 'POS-003',
    cutName: '国产-育肥公牛',
    englishName: 'Domestic Bull',
    type: CutType.ELASTIC_SPEC,
    quantityTons: 60,
    avgCost: 28.0, 
    currentPrice: 27.5,
    marketValue: 1650000,
    unrealizedPL: -30000,
    plPercent: -1.7,
    var95: 55000,
    stopLossPrice: 26.0,
    warehouseId: 'WH-GZ',
    entryDate: '2026-10-10',
    daysHeld: 17,
    storageCostAccrued: 3876,
  },
];

export const BACKTEST_RESULTS: BacktestResult = {
  sharpeRatio: 1.65,
  sortinoRatio: 2.1, 
  calmarRatio: 1.8, 
  maxDrawdown: -12.4, 
  annualizedReturn: 22.3, 
  winRate: 62.5, 
  profitFactor: 1.85, 
  equityCurve: REAL_MARKET_DATA.map((d, i) => ({
    date: d.date,
    equity: 1000000 + (i * 1200) + (d.price - d.importCost) * 8000
  }))
};

export const KELLY_WIN_PROB = 0.55;
export const KELLY_WIN_LOSS_RATIO = 1.5;

export const MONITOR_METRICS: MonitorMetric[] = [
  // --- UPSTREAM (Brazil/Origin) ---
  {
    id: 'M-001',
    name: '巴西Boi Gordo (Arroba)',
    category: 'UPSTREAM',
    value: 321.50,
    unit: 'R$/@',
    change: -0.3,
    trend: 'DOWN',
    description: '巴西活牛现货价格。市场正在定价中国政策风险，价格承压。',
    history: [325, 324, 323, 322, 321.5, 321, 321.5],
    severity: 'MEDIUM'
  },
  {
    id: 'M-002',
    name: 'Escala de Abate (锁牛天数)',
    category: 'UPSTREAM',
    value: 8.5,
    unit: 'Days',
    change: 12.5,
    trend: 'UP',
    description: '屠宰场已锁定的活牛库存天数。>8天显示工厂端议价权增强。',
    history: [6, 6.5, 7, 7.5, 8, 8.2, 8.5],
    severity: 'HIGH'
  },
  {
    id: 'M-003',
    name: 'Bezerro/Boi (牛犊/肥牛比)',
    category: 'UPSTREAM',
    value: 2350,
    unit: 'R$/Head',
    change: 1.2,
    trend: 'UP',
    description: '补栏成本指标。牛犊价格上涨意味着未来育肥成本增加。',
    history: [2200, 2250, 2280, 2300, 2320, 2340, 2350],
    severity: 'LOW'
  },
  
  // --- MIDSTREAM (Trade/Macro) ---
  {
    id: 'M-004',
    name: '汇率 USD/BRL',
    category: 'MIDSTREAM',
    value: 5.78,
    unit: 'Price',
    change: 0.8,
    trend: 'UP',
    description: '雷亚尔贬值有利于巴西出口，但美元走强压制大宗商品。',
    history: [5.60, 5.65, 5.62, 5.70, 5.75, 5.76, 5.78],
    severity: 'MEDIUM'
  },
  {
    id: 'M-005',
    name: '汇率 USD/CNY',
    category: 'MIDSTREAM',
    value: 7.11,
    unit: 'Price',
    change: 0.0,
    trend: 'FLAT',
    description: '人民币保持定力，进口成本相对稳定。',
    history: [7.10, 7.11, 7.12, 7.11, 7.11, 7.10, 7.11],
    severity: 'LOW'
  },
  {
    id: 'M-006',
    name: '海运指数 (Santos-Shanghai)',
    category: 'MIDSTREAM',
    value: 4200,
    unit: '$/Container',
    change: -2.5,
    trend: 'DOWN',
    description: '冷柜海运费。价格回落降低了CIF成本压力。',
    history: [4500, 4450, 4400, 4350, 4300, 4250, 4200],
    severity: 'LOW'
  },

  // --- DOWNSTREAM (China Domestic) ---
  {
    id: 'M-007',
    name: '内外价差 (Spread)',
    category: 'DOWNSTREAM',
    value: 17.36,
    unit: 'CNY/kg',
    change: -1.5,
    trend: 'DOWN',
    description: '国产牛肉(66.6) - 进口指数(49.3)。价差收窄意味着国产替代效应减弱。',
    history: [20, 19.5, 18.8, 18.2, 17.8, 17.5, 17.36],
    severity: 'HIGH'
  },
  {
    id: 'M-008',
    name: '国产育肥公牛 (Fat Cattle)',
    category: 'DOWNSTREAM',
    value: 27.5,
    unit: 'CNY/kg',
    change: -0.5,
    trend: 'DOWN',
    description: '屠宰企业压价意愿明显，终端消费疲软导致去库缓慢。',
    history: [28.5, 28.2, 28.0, 27.8, 27.6, 27.5, 27.5],
    severity: 'HIGH'
  },
  {
    id: 'M-009',
    name: '港口查验滞留率',
    category: 'DOWNSTREAM',
    value: 22.5,
    unit: '%',
    change: 5.0,
    trend: 'UP',
    description: '受"四卡"严查影响，通关周期延长，现货流通趋紧。',
    history: [10, 12, 15, 18, 20, 21, 22.5],
    severity: 'HIGH'
  }
];

// ===========================================
// NEW INVENTORY SYSTEM MOCK DATA (V3.0)
// ===========================================

// Table 1: Parameters (Updated to match Python Script)
export const DEFAULT_PARAMETER_SETS: CalculationParameterSet[] = [
  {
    Parameter_Set_ID: 1,
    Parameter_Set_Name: '测试配置1-标准6.5% (Standard)',
    Annual_Interest_Rate: 0.065,
    Capital_Occupancy_Ratio: 0.90,
    Storage_Cost_Per_Ton_Day: 2.2,
    Tariff_Multiplier: 1.12,
    VAT_Multiplier: 1.09,
    Fixed_Misc_Cost_Per_KG: 2.5
  },
  {
    Parameter_Set_ID: 2,
    Parameter_Set_Name: '测试配置2-优惠5.5% (Discount)',
    Annual_Interest_Rate: 0.055,
    Capital_Occupancy_Ratio: 0.90,
    Storage_Cost_Per_Ton_Day: 2.2,
    Tariff_Multiplier: 1.12,
    VAT_Multiplier: 1.09,
    Fixed_Misc_Cost_Per_KG: 2.5
  }
];

// Table 2: Market Prices (Updated to match Python Script)
export const MOCK_MARKET_PRICES: MarketPriceSeries[] = [
  // Individual SKU prices set to 0 to signify "Empty/Ignored" as per user request
  { SKU_Code: 'N_001', Product_Name: '冷冻去骨牛保乐肩肉', Est_Selling_Price_RMB_Per_KG: 0, Price_Date: '2025-12-09' },
  { SKU_Code: 'N_002', Product_Name: '冷冻去骨牛上脑芯', Est_Selling_Price_RMB_Per_KG: 0, Price_Date: '2025-12-09' },
  { SKU_Code: 'N_003', Product_Name: '冷冻去骨牛胸部肋条', Est_Selling_Price_RMB_Per_KG: 0, Price_Date: '2025-12-09' },
  { SKU_Code: 'N_004', Product_Name: '冷冻去骨牛脖肉', Est_Selling_Price_RMB_Per_KG: 0, Price_Date: '2025-12-09' },
  { SKU_Code: 'N_005', Product_Name: '冷冻去骨牛嫩肩肉', Est_Selling_Price_RMB_Per_KG: 0, Price_Date: '2025-12-09' },
  { SKU_Code: 'N_006', Product_Name: '冷冻去骨牛前腱肉', Est_Selling_Price_RMB_Per_KG: 0, Price_Date: '2025-12-09' },
  { SKU_Code: 'N_007', Product_Name: '冷冻去骨牛板腱', Est_Selling_Price_RMB_Per_KG: 0, Price_Date: '2025-12-09' },
  // Whole Container Price
  { SKU_Code: 'AMCU9399445', Product_Name: 'AMCU9399445', Est_Selling_Price_RMB_Per_KG: 49.00, Price_Date: '2025-12-08' },
  // Spot Purchase Container Price
  { SKU_Code: 'CNTR-SPOT-888', Product_Name: 'CNTR-SPOT-888', Est_Selling_Price_RMB_Per_KG: 45.00, Price_Date: '2025-12-10' }
];

// Table 3: Inventory Detail (Updated to match Python Script)
// Contract: 58658643-3 | Container: AMCU9399445
const futurePriceUsd = 0; // Set to 0 for individual items
const futurePriceUsdWhole = 5300; // USD/TON for whole container
const futureRefFx = 7.25;

export const MOCK_INVENTORY_DETAILS: InventoryDetail[] = [
  {
    Inventory_SKU_ID: 'INV-1001',
    Supplier_Contract_ID: '58658643-3',
    Container_ID: 'AMCU9399445',
    SKU_Code: 'N_001',
    Product_Name: '冷冻去骨牛保乐肩肉',
    Pieces: 130,
    Weight_KG: 3291.554,
    Parameter_Set_ID: 1,
    Funder_ID: '东方',
    Future_Price_USD_Per_KG: futurePriceUsd,
    Future_Ref_FX_USD_CNY: futureRefFx,
    Shipping_Date: '2024-12-22',
    ETA_Date: '2025-01-30',
    Storage_Entry_Date: '2025-02-05',
    Country: '巴西',
    Factory_Code: 'SIF504',
    Port: '上海',
    Cold_Storage: '东方'
  },
  {
    Inventory_SKU_ID: 'INV-1002',
    Supplier_Contract_ID: '58658643-3',
    Container_ID: 'AMCU9399445',
    SKU_Code: 'N_002',
    Product_Name: '冷冻去骨牛上脑芯',
    Pieces: 285,
    Weight_KG: 6371.134,
    Parameter_Set_ID: 1,
    Funder_ID: '东方',
    Future_Price_USD_Per_KG: futurePriceUsd,
    Future_Ref_FX_USD_CNY: futureRefFx,
    Shipping_Date: '2024-12-22',
    ETA_Date: '2025-01-30',
    Storage_Entry_Date: '2025-02-05',
    Country: '巴西',
    Factory_Code: 'SIF504',
    Port: '上海',
    Cold_Storage: '东方'
  },
  {
    Inventory_SKU_ID: 'INV-1003',
    Supplier_Contract_ID: '58658643-3',
    Container_ID: 'AMCU9399445',
    SKU_Code: 'N_003',
    Product_Name: '冷冻去骨牛胸部肋条',
    Pieces: 52,
    Weight_KG: 1305.973,
    Parameter_Set_ID: 1,
    Funder_ID: '东方',
    Future_Price_USD_Per_KG: futurePriceUsd,
    Future_Ref_FX_USD_CNY: futureRefFx,
    Shipping_Date: '2024-12-22',
    ETA_Date: '2025-01-30',
    Storage_Entry_Date: '2025-02-05',
    Country: '巴西',
    Factory_Code: 'SIF504',
    Port: '上海',
    Cold_Storage: '东方'
  },
  {
    Inventory_SKU_ID: 'INV-1004',
    Supplier_Contract_ID: '58658643-3',
    Container_ID: 'AMCU9399445',
    SKU_Code: 'N_004',
    Product_Name: '冷冻去骨牛脖肉',
    Pieces: 440,
    Weight_KG: 10088.108,
    Parameter_Set_ID: 1,
    Funder_ID: '东方',
    Future_Price_USD_Per_KG: futurePriceUsd,
    Future_Ref_FX_USD_CNY: futureRefFx,
    Shipping_Date: '2024-12-22',
    ETA_Date: '2025-01-30',
    Storage_Entry_Date: '2025-02-05',
    Country: '巴西',
    Factory_Code: 'SIF504',
    Port: '上海',
    Cold_Storage: '东方'
  },
  {
    Inventory_SKU_ID: 'INV-1005',
    Supplier_Contract_ID: '58658643-3',
    Container_ID: 'AMCU9399445',
    SKU_Code: 'N_005',
    Product_Name: '冷冻去骨牛嫩肩肉',
    Pieces: 41,
    Weight_KG: 1170.160,
    Parameter_Set_ID: 1,
    Funder_ID: '东方',
    Future_Price_USD_Per_KG: futurePriceUsd,
    Future_Ref_FX_USD_CNY: futureRefFx,
    Shipping_Date: '2024-12-22',
    ETA_Date: '2025-01-30',
    Storage_Entry_Date: '2025-02-05',
    Country: '巴西',
    Factory_Code: 'SIF504',
    Port: '上海',
    Cold_Storage: '东方'
  },
  {
    Inventory_SKU_ID: 'INV-1006',
    Supplier_Contract_ID: '58658643-3',
    Container_ID: 'AMCU9399445',
    SKU_Code: 'N_006',
    Product_Name: '冷冻去骨牛前腱肉',
    Pieces: 150,
    Weight_KG: 3775.799,
    Parameter_Set_ID: 1,
    Funder_ID: '东方',
    Future_Price_USD_Per_KG: futurePriceUsd,
    Future_Ref_FX_USD_CNY: futureRefFx,
    Shipping_Date: '2024-12-22',
    ETA_Date: '2025-01-30',
    Storage_Entry_Date: '2025-02-05',
    Country: '巴西',
    Factory_Code: 'SIF504',
    Port: '上海',
    Cold_Storage: '东方'
  },
  {
    Inventory_SKU_ID: 'INV-1007',
    Supplier_Contract_ID: '58658643-3',
    Container_ID: 'AMCU9399445',
    SKU_Code: 'N_007',
    Product_Name: '冷冻去骨牛板腱',
    Pieces: 68,
    Weight_KG: 2004.668,
    Parameter_Set_ID: 1,
    Funder_ID: '东方',
    Future_Price_USD_Per_KG: futurePriceUsd,
    Future_Ref_FX_USD_CNY: futureRefFx,
    Shipping_Date: '2024-12-22',
    ETA_Date: '2025-01-30',
    Storage_Entry_Date: '2025-02-05',
    Country: '巴西',
    Factory_Code: 'SIF504',
    Port: '上海',
    Cold_Storage: '东方'
  },
  // WHOLE CONTAINER SUMMARY RECORD
  {
    Inventory_SKU_ID: 'INV-1008-WHOLE',
    Supplier_Contract_ID: '58658643-3',
    Container_ID: 'AMCU9399445',
    SKU_Code: 'AMCU9399445', // SKU Code = Container ID
    Product_Name: 'AMCU9399445 (整柜汇总)',
    Pieces: 1166, // Sum of all pieces
    Weight_KG: 28007.20, // Sum of all weights
    Parameter_Set_ID: 1,
    Funder_ID: '东方',
    Future_Price_USD_Per_KG: futurePriceUsdWhole, // 5300
    Future_Ref_FX_USD_CNY: futureRefFx,
    Shipping_Date: '2024-12-22',
    ETA_Date: '2025-01-30',
    Storage_Entry_Date: '2025-02-05',
    Country: '巴西',
    Factory_Code: 'SIF504',
    Port: '上海',
    Cold_Storage: '东方',
    Payment_Floor: 150000, // Added as per requirement V4.01
    Capital_Countdown_Days: 120 // Added as per requirement V4.02
  },
  // ==============================
  // NEW SPOT PURCHASE EXAMPLE V4.02
  // ==============================
  {
    Inventory_SKU_ID: 'INV-2001-SPOT',
    Supplier_Contract_ID: 'SPOT-BUY-001',
    Container_ID: 'CNTR-SPOT-888',
    SKU_Code: 'SIF385_BRISKET',
    Product_Name: '冷冻牛腩 (SIF385)',
    Pieces: 1200,
    Weight_KG: 26000,
    Parameter_Set_ID: 1,
    Funder_ID: '东方',
    // Spot Mode Config:
    Spot_Price_RMB_Per_KG: 0, // Set to 0 to hide financial details in UI
    Future_Price_USD_Per_KG: 0, // Ignored
    Future_Ref_FX_USD_CNY: 0,   // Ignored
    
    Shipping_Date: '', // Empty
    ETA_Date: '',      // Empty
    Storage_Entry_Date: '2025-12-10', // Direct Entry
    
    Country: '巴西',
    Factory_Code: 'SIF385',
    Port: '上海',
    Cold_Storage: '东方',
    Payment_Floor: 0,
    Capital_Countdown_Days: 0 // Clear countdown for item
  },
  // We also need a Summary record for the spot container for consistency in the UI view aggregation logic
  {
    Inventory_SKU_ID: 'INV-2001-SPOT-WHOLE',
    Supplier_Contract_ID: 'SPOT-BUY-001',
    Container_ID: 'CNTR-SPOT-888',
    SKU_Code: 'CNTR-SPOT-888', // Summary
    Product_Name: 'CNTR-SPOT-888 (现货采购)',
    Pieces: 1200,
    Weight_KG: 26000,
    Parameter_Set_ID: 1,
    Funder_ID: '东方',
    Spot_Price_RMB_Per_KG: 42.00,
    Future_Price_USD_Per_KG: 0,
    Future_Ref_FX_USD_CNY: 0,
    Shipping_Date: '',
    ETA_Date: '',
    Storage_Entry_Date: '2025-12-10',
    Country: '巴西',
    Factory_Code: 'SIF385',
    Port: '上海',
    Cold_Storage: '东方',
    Payment_Floor: 0,
    Capital_Countdown_Days: 100
  }
];

