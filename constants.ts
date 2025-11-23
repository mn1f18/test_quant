
import { MarketDataPoint, Position, CutType, BacktestResult, Factor, SimulationData, Warehouse, MonitorMetric } from './types';

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

// Monte Carlo Simulation Engine (Geometric Brownian Motion)
export const runMonteCarlo = (startPrice: number): SimulationData[] => {
  const dt = 1 / 365;
  const volatility = 0.25; 
  const simulationDays = 60;
  
  const result: SimulationData[] = [];

  const driftBull = 0.45; 
  const driftBase = 0.05; 
  const driftBear = -0.35; 

  let priceBull = startPrice;
  let priceBase = startPrice;
  let priceBear = startPrice;

  for (let i = 0; i < simulationDays; i++) {
    const randomShock = (Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random()) - 3; 
    
    priceBull = priceBull * Math.exp((driftBull - 0.5 * volatility * volatility) * dt + volatility * Math.sqrt(dt) * randomShock);
    priceBase = priceBase * Math.exp((driftBase - 0.5 * volatility * volatility) * dt + volatility * Math.sqrt(dt) * randomShock);
    priceBear = priceBear * Math.exp((driftBear - 0.5 * volatility * volatility) * dt + volatility * Math.sqrt(dt) * randomShock);

    result.push({
      day: i + 1,
      bullCase: priceBull,
      baseCase: priceBase,
      bearCase: priceBear
    });
  }
  return result;
};

export const SIMULATION_DATA = runMonteCarlo(REAL_MARKET_DATA[REAL_MARKET_DATA.length - 1].price);


export const KEY_FACTORS: Factor[] = [
  // Policy / Macro
  { name: '进口保障措施 (Safeguard)', category: 'A类 (核心)', impact: 'Bullish (利多)', value: 'Decision 11/26', change: 'High Risk' },
  { name: '美巴关税 (US-Brazil Tariff)', category: 'A类 (核心)', impact: 'Bullish (利多)', value: '40% Cancelled', change: 'New' },
  { name: '人民币汇率 (CNY/USD)', category: 'A类 (核心)', impact: 'Neutral (中性)', value: '7.11', change: 'Flat' },
  { name: '5年期LPR利率', category: 'B类 (辅助)', impact: 'Neutral (中性)', value: '3.60%', change: 'Unchanged' },
  
  // Supply / Domestic
  { name: '能繁母牛存栏 (Inventory)', category: 'A类 (核心)', impact: 'Bearish (利空)', value: 'High (出清中)', change: '-1.2%' },
  { name: '内外价差 (Spread)', category: 'A类 (核心)', impact: 'Bearish (利空)', value: '¥17.36/kg', change: '收窄' },
  { name: '港口查验率 (Inspection)', category: 'B类 (辅助)', impact: 'Bullish (利多)', value: 'Very High', change: '+15%' },
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

// Enhanced Backtest Metrics for Low-Frequency Spot Trading
export const BACKTEST_RESULTS: BacktestResult = {
  sharpeRatio: 1.65,
  sortinoRatio: 2.1, // High Sortino indicates good protection against downside volatility
  calmarRatio: 1.8, // Good recovery from drawdowns
  maxDrawdown: -12.4, // Max peak-to-valley loss (%)
  annualizedReturn: 22.3, // %
  winRate: 62.5, // % of profitable trades
  profitFactor: 1.85, // Gross Profit / Gross Loss
  equityCurve: REAL_MARKET_DATA.map((d, i) => ({
    date: d.date,
    equity: 1000000 + (i * 1200) + (d.price - d.importCost) * 8000
  }))
};

// Kelly Criterion Constants
export const KELLY_WIN_PROB = 0.55;
export const KELLY_WIN_LOSS_RATIO = 1.5;

// === NEW: Detailed Industry Metrics ===
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
