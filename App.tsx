import React, { useState, useEffect } from 'react';
import { MarketDataPoint, Position, Order, OrderStatus } from './types';
import { REAL_MARKET_DATA, MOCK_POSITIONS, BACKTEST_RESULTS, KEY_FACTORS, SIMULATION_DATA } from './constants';
import { PriceChart, EquityChart, SimulationChart } from './components/Charts';
import { MetricCard } from './components/MetricCard';
import { OrderEntry } from './components/OrderEntry';
import { InventoryView } from './components/InventoryView';
import { SimulationView } from './components/SimulationView';
import { MarketMonitor } from './components/MarketMonitor';
import { generateMarketCommentary } from './services/geminiService';
import { 
  LayoutDashboard, 
  AlertTriangle, 
  Activity, 
  ShieldCheck, 
  History,
  BrainCircuit,
  Menu,
  CloudLightning,
  Scale,
  Container,
  LineChart,
  Globe,
  Zap
} from 'lucide-react';

type ViewState = 'DASHBOARD' | 'MONITOR' | 'INVENTORY' | 'SIMULATION';

const App: React.FC = () => {
  // State
  const [currentView, setCurrentView] = useState<ViewState>('DASHBOARD');
  const [marketData] = useState<MarketDataPoint[]>(REAL_MARKET_DATA);
  const [positions] = useState<Position[]>(MOCK_POSITIONS);
  const [aiAnalysis, setAiAnalysis] = useState<string>("MooketQUANT 核心模型正在初始化...\n正在加载: 海关数据, 巴西B3交易所期货数据, 国产母牛存栏指数...");
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Initialize Data
  useEffect(() => {
    // Simulate live clock - Fixed to 2026 context for the demo
    const timer = setInterval(() => {
       const now = new Date();
       setCurrentTime(now); 
    }, 1000);

    // Initial AI call
    const fetchAI = async () => {
       const analysis = await generateMarketCommentary(marketData, MOCK_POSITIONS);
       setAiAnalysis(analysis);
    };
    fetchAI();

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Derived Metrics
  const currentPrice = marketData.length > 0 ? marketData[marketData.length - 1].price : 0;
  const prevPrice = marketData.length > 1 ? marketData[marketData.length - 2].price : 0;
  const priceDelta = ((currentPrice - prevPrice) / prevPrice * 100).toFixed(2);
  
  const totalEquity = positions.reduce((sum, p) => sum + p.marketValue, 0);
  const totalPL = positions.reduce((sum, p) => sum + p.unrealizedPL, 0);
  const totalVaR = positions.reduce((sum, p) => sum + p.var95, 0);

  // Filter Factors
  const macroFactors = KEY_FACTORS.filter(f => ['进口保障措施 (Safeguard)', '美巴关税 (US-Brazil Tariff)', '人民币汇率 (CNY/USD)', '5年期LPR利率'].includes(f.name));
  const fundamentalFactors = KEY_FACTORS.filter(f => !macroFactors.includes(f));

  const handlePlaceOrder = (newOrder: any) => {
    const order: Order = {
      id: `ORD-${Math.floor(Math.random() * 10000)}`,
      timestamp: Date.now(),
      status: OrderStatus.EXECUTED,
      riskCheck: true,
      ...newOrder
    };
    setOrders(prev => [order, ...prev]);
  };

  return (
    <div className="min-h-screen bg-terminal-bg text-gray-300 font-sans selection:bg-terminal-accent selection:text-black flex flex-col">
      {/* Header / Navigation Bar */}
      <header className="h-12 border-b border-terminal-border bg-terminal-bg flex items-center justify-between px-4 sticky top-0 z-50 shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-terminal-accent font-bold tracking-wider">
            <Activity size={20} />
            <span>Mooket<span className="text-white">QUANT</span> <span className="text-[10px] text-gray-500 ml-1 border border-gray-700 px-1 rounded bg-gray-900">TEST BUILD v0.9</span></span>
          </div>
          <nav className="hidden md:flex items-center gap-1">
            <button 
              onClick={() => setCurrentView('DASHBOARD')}
              className={`px-3 py-1 text-xs font-mono border rounded-sm transition-colors flex items-center gap-2 ${currentView === 'DASHBOARD' ? 'bg-terminal-panel border-terminal-border text-white' : 'border-transparent text-gray-500 hover:text-white'}`}
            >
              <LayoutDashboard size={14} /> 现货交易 (SPOT)
            </button>
            <button 
              onClick={() => setCurrentView('MONITOR')}
              className={`px-3 py-1 text-xs font-mono border rounded-sm transition-colors flex items-center gap-2 ${currentView === 'MONITOR' ? 'bg-terminal-panel border-terminal-border text-white' : 'border-transparent text-gray-500 hover:text-white'}`}
            >
              <Globe size={14} /> 市场监控 (MONITOR)
            </button>
            <button 
              onClick={() => setCurrentView('INVENTORY')}
              className={`px-3 py-1 text-xs font-mono border rounded-sm transition-colors flex items-center gap-2 ${currentView === 'INVENTORY' ? 'bg-terminal-panel border-terminal-border text-white' : 'border-transparent text-gray-500 hover:text-white'}`}
            >
              <Container size={14} /> 库存管理 (INVENTORY)
            </button>
            <button 
              onClick={() => setCurrentView('SIMULATION')}
              className={`px-3 py-1 text-xs font-mono border rounded-sm transition-colors flex items-center gap-2 ${currentView === 'SIMULATION' ? 'bg-terminal-panel border-terminal-border text-white' : 'border-transparent text-gray-500 hover:text-white'}`}
            >
              <Zap size={14} /> 情景推演 (SCENARIO)
            </button>
          </nav>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono">
           <div className="flex items-center gap-2 text-gray-500 bg-terminal-panel px-2 py-1 rounded-sm">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              MARKET OPEN
           </div>
           {/* Updated date to 2025-12-09 */}
           <div className="text-gray-400">2025-12-09 <span className="text-white">{currentTime.toLocaleTimeString()}</span></div>
           <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700 cursor-pointer hover:bg-gray-700">
             <Menu size={16} />
           </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="p-2 md:p-4 max-w-[1920px] mx-auto w-full flex-1 flex flex-col h-[calc(100vh-48px)] overflow-hidden">
        
        {currentView === 'DASHBOARD' && (
          <div className="grid grid-cols-12 gap-4 flex-1 overflow-y-auto pr-1">
            {/* LEFT COLUMN: Sidebar / Factors (2 Cols) */}
            <aside className="col-span-12 md:col-span-2 flex flex-col gap-4">
              {/* Strategy Stats (Advanced) */}
              <div className="bg-terminal-panel border border-terminal-border rounded-sm p-3">
                <h3 className="text-xs text-gray-500 font-mono mb-3 uppercase flex items-center gap-2">
                  <Activity size={14} /> 策略表现 (Quant Metrics)
                </h3>
                <div className="grid grid-cols-1 gap-2 text-[11px] font-mono">
                  <div className="flex justify-between">
                      <span className="text-gray-500">Sharpe (夏普)</span>
                      <span className="text-white">{BACKTEST_RESULTS.sharpeRatio}</span>
                  </div>
                  <div className="flex justify-between">
                      <span className="text-gray-500">Sortino (索提诺)</span>
                      <span className="text-green-400">{BACKTEST_RESULTS.sortinoRatio}</span>
                  </div>
                  <div className="flex justify-between">
                      <span className="text-gray-500">Calmar (卡玛)</span>
                      <span className="text-blue-400">{BACKTEST_RESULTS.calmarRatio}</span>
                  </div>
                  <div className="flex justify-between">
                      <span className="text-gray-500">Max Drawdown</span>
                      <span className="text-red-400">{BACKTEST_RESULTS.maxDrawdown}%</span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-gray-800">
                      <EquityChart data={BACKTEST_RESULTS.equityCurve} />
                  </div>
                </div>
              </div>

              {/* Macro Factors */}
              <div className="bg-terminal-panel border border-terminal-border rounded-sm p-3">
                <h3 className="text-xs text-gray-500 font-mono mb-3 uppercase flex items-center gap-2">
                  <Scale size={14} /> 宏观与政策 (Policy)
                </h3>
                <div className="space-y-3">
                    {macroFactors.map((f, i) => (
                      <div key={i} className="border-b border-gray-800 pb-2 last:border-0 last:pb-0">
                          <div className="flex justify-between items-center text-[10px] text-gray-400 mb-1">
                            <span>{f.category.split(' ')[0]}</span>
                            <span className={f.impact.includes('Bullish') ? 'text-up-green' : f.impact.includes('Bearish') ? 'text-down-red' : 'text-gray-500'}>
                              {f.impact.split(' ')[0]}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-xs font-bold">
                            <span className="text-white truncate max-w-[65%]" title={f.name}>{f.name.split(' ')[0]}</span>
                            <span className="font-mono text-[11px]">{f.value}</span>
                          </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Fundamental Factors - SCROLLABLE NOW */}
              <div className="bg-terminal-panel border border-terminal-border rounded-sm p-3 flex-1 min-h-[300px] flex flex-col">
                <h3 className="text-xs text-gray-500 font-mono mb-3 uppercase flex items-center gap-2 shrink-0">
                  <CloudLightning size={14} /> 产业基本面 (Supply)
                </h3>
                <div className="space-y-3 overflow-y-auto flex-1 pr-1 custom-scrollbar">
                    {fundamentalFactors.map((f, i) => (
                      <div key={i} className="border-b border-gray-800 pb-2 last:border-0 last:pb-0">
                          <div className="flex justify-between items-center text-[10px] text-gray-400 mb-1">
                            <span>{f.category.split(' ')[0]}</span>
                            <span className={f.impact.includes('Bullish') ? 'text-up-green' : f.impact.includes('Bearish') ? 'text-down-red' : 'text-gray-500'}>
                              {f.impact.split(' ')[0]}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-xs font-bold">
                            <span className="text-white truncate max-w-[65%]" title={f.name}>{f.name.split(' ')[0]}</span>
                            <span className="font-mono text-[11px]">{f.value}</span>
                          </div>
                      </div>
                    ))}
                </div>
              </div>
            </aside>

            {/* CENTER COLUMN: Charts & Analysis (7 Cols) */}
            <section className="col-span-12 md:col-span-7 flex flex-col gap-4">
              
              {/* Top Row Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard label="进口指数 (CNY/kg)" value={currentPrice.toFixed(2)} trend={Number(priceDelta) >= 0 ? 'up' : 'down'} subValue={`${Number(priceDelta) > 0 ? '+' : ''}${priceDelta}%`} />
                <MetricCard label="内外价差 (Spread)" value="¥17.36" color="text-blue-400" subValue="Domestic Premium" />
                <MetricCard label="库存货值 (Inventory)" value={`¥${(totalEquity/10000).toFixed(2)}w`} color="text-terminal-accent" subValue={`${positions.length} Positions`} />
                <MetricCard label="持仓盈亏 (Open P/L)" value={`¥${(totalPL/1000).toFixed(0)}k`} trend={totalPL > 0 ? 'up' : 'down'} />
              </div>

              {/* Main Chart */}
              <PriceChart data={marketData} />

              {/* AI Insight & Positions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 min-h-[300px]">
                
                {/* Simulation Panel (Small Preview) */}
                <div className="md:col-span-3">
                   <SimulationChart data={SIMULATION_DATA} />
                </div>

                {/* AI Panel */}
                <div className="md:col-span-3 bg-terminal-panel border border-terminal-border p-4 rounded-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 text-[100px] text-white/5 pointer-events-none">
                      <BrainCircuit />
                  </div>
                  <h3 className="text-terminal-accent text-xs font-bold font-mono uppercase mb-2 flex items-center gap-2 relative z-10">
                    <BrainCircuit size={16} /> MooketQUANT 现货策略分析 (AI Strategy)
                  </h3>
                  <div className="bg-black/40 p-3 border-l-2 border-terminal-accent text-sm font-mono leading-relaxed text-gray-300 whitespace-pre-wrap relative z-10 h-[150px] overflow-y-auto custom-scrollbar">
                    {aiAnalysis}
                  </div>
                </div>

                {/* Position Table */}
                <div className="md:col-span-3 bg-terminal-panel border border-terminal-border rounded-sm overflow-hidden">
                  <div className="p-3 border-b border-terminal-border flex justify-between items-center">
                    <h3 className="text-xs text-gray-500 font-mono uppercase flex items-center gap-2">
                      <ShieldCheck size={14} /> 实时库存持仓 (Live Inventory)
                    </h3>
                    <span className="text-[10px] text-gray-600">LONG ONLY</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-black text-gray-500">
                        <tr>
                          <th className="p-3">部位 (Cut)</th>
                          <th className="p-3">属性 (Type)</th>
                          <th className="p-3 text-right">库存 (t)</th>
                          <th className="p-3 text-right">成本 (¥/kg)</th>
                          <th className="p-3 text-right">货值 (¥)</th>
                          <th className="p-3 text-right">浮盈亏 (P/L)</th>
                          <th className="p-3 text-right">止损价 (Stop)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-terminal-border">
                        {positions.map(pos => (
                          <tr key={pos.id} className="hover:bg-gray-800/50 transition-colors">
                            <td className="p-3">
                                <div className="font-bold text-white">{pos.cutName}</div>
                                <div className="text-[10px] text-gray-600">{pos.englishName}</div>
                            </td>
                            <td className="p-3">
                              <span className={`px-1.5 py-0.5 rounded-sm text-[10px] ${pos.type.includes('Core') || pos.type.includes('核心') ? 'bg-blue-900 text-blue-200' : 'bg-purple-900 text-purple-200'}`}>
                                {pos.type.split(' ')[0]}
                              </span>
                            </td>
                            <td className="p-3 text-right">{pos.quantityTons}</td>
                            <td className="p-3 text-right text-gray-400">{pos.avgCost.toFixed(1)}</td>
                            <td className="p-3 text-right text-white">{pos.marketValue.toLocaleString()}</td>
                            <td className={`p-3 text-right font-bold ${pos.unrealizedPL >= 0 ? 'text-up-green' : 'text-down-red'}`}>
                              {pos.unrealizedPL.toLocaleString()}
                            </td>
                            <td className="p-3 text-right text-terminal-accent">{pos.stopLossPrice.toFixed(1)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </section>

            {/* RIGHT COLUMN: Execution & Alerts (3 Cols) */}
            <aside className="col-span-12 md:col-span-3 flex flex-col gap-4">
              <OrderEntry onPlaceOrder={handlePlaceOrder} currentPrice={currentPrice} />

              <div className="bg-terminal-panel border border-terminal-border p-4 rounded-sm flex-1">
                <h3 className="text-xs text-gray-500 font-mono mb-3 uppercase flex items-center gap-2">
                  <AlertTriangle size={14} /> 经营预警 (Alerts)
                </h3>
                <div className="space-y-3">
                  <div className="p-2 bg-blue-900/20 border-l-2 border-blue-500 text-xs">
                    <div className="font-bold text-blue-400 mb-1">政策补库机会 (BUY)</div>
                    <div className="text-gray-400">Monte Carlo模拟显示关税落地后价格重心上移(Bull Case). 建议在11/26前加大核心部位库存.</div>
                  </div>
                  <div className="p-2 bg-red-900/20 border-l-2 border-red-500 text-xs">
                    <div className="font-bold text-red-400 mb-1">库存周转预警 (SLOW)</div>
                    <div className="text-gray-400">前四分体 (乌拉圭) 接近成本线且流转率下降. 建议折价促销以回笼现金流.</div>
                  </div>
                </div>

                <h3 className="text-xs text-gray-500 font-mono mt-6 mb-3 uppercase flex items-center gap-2">
                  <History size={14} /> 最近交易 (Flow)
                </h3>
                <div className="space-y-2 overflow-y-auto max-h-[200px] custom-scrollbar">
                  {orders.map(order => (
                    <div key={order.id} className="flex justify-between items-center text-xs border-b border-gray-800 pb-2">
                      <div>
                        <div className={order.side === 'STOCK_IN' ? 'text-up-green font-bold' : 'text-terminal-accent font-bold'}>
                          {order.side === 'STOCK_IN' ? '补库 (IN)' : '出货 (OUT)'} {order.quantity}t
                        </div>
                        <div className="text-gray-500">{order.cutName}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-white">¥{order.price.toFixed(2)}</div>
                        <div className="text-[10px] text-gray-600">{new Date(order.timestamp).toLocaleTimeString()}</div>
                      </div>
                    </div>
                  ))}
                  {orders.length === 0 && <div className="text-xs text-gray-600 text-center italic py-4">今日暂无流转</div>}
                </div>
              </div>
            </aside>
          </div>
        )}

        {currentView === 'MONITOR' && (
          <MarketMonitor />
        )}

        {currentView === 'INVENTORY' && (
          <InventoryView positions={positions} />
        )}

        {currentView === 'SIMULATION' && (
          <SimulationView currentPrice={currentPrice} />
        )}

      </main>
    </div>
  );
};

export default App;