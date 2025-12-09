
import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { Play, RotateCcw, Zap, AlertTriangle, ArrowRight, TrendingUp } from 'lucide-react';
import { SCENARIO_EVENTS, MOCK_POSITIONS } from '../constants';
import { ScenarioEvent } from '../types';

interface SimulationViewProps {
  currentPrice: number;
}

export const SimulationView: React.FC<SimulationViewProps> = ({ currentPrice }) => {
  const [events, setEvents] = useState<ScenarioEvent[]>(SCENARIO_EVENTS);
  const [data, setData] = useState<any[]>([]);
  const [impactPnl, setImpactPnl] = useState(0);

  // Core Simulation Logic
  const runScenarioSimulation = () => {
    // 1. Calculate Aggregate Impact from Active Events
    const activeEvents = events.filter(e => e.active);
    const totalPriceImpact = activeEvents.reduce((sum, e) => sum + e.impactOnPrice, 0); // %
    const totalDemandImpact = activeEvents.reduce((sum, e) => sum + e.impactOnDemand, 0); // %

    // 2. Adjust Drift based on active events
    // Base volatility
    const volatility = 0.25; 
    const days = 90;
    const dt = 1 / 365;

    // Convert Event Impact to Annualized Drift adjustment
    // e.g., +12% shock over 3 months -> roughly +48% annualized drift addition (simplified)
    const shockDrift = (totalPriceImpact / 100) * 2; 

    const newData = [];
    let priceSim = currentPrice;

    for (let i = 0; i <= days; i++) {
        const t = i * dt;
        const sqrtT = Math.sqrt(t);
        
        // Baseline (Status Quo)
        const baseline = currentPrice * Math.exp((0.05 - 0.5 * 0.15 * 0.15) * t);

        // Scenario Path (With Shocks)
        // We apply a sigmoid-like shock ramp-up for events (events usually don't happen instantly fully, market prices in)
        const rampUp = Math.min(1, i / 15); // Market prices in the shock over 15 days
        const currentImpact = (totalPriceImpact / 100) * rampUp;
        
        const scenarioPrice = baseline * (1 + currentImpact);

        // Add some noise
        const noise = (Math.random() - 0.5) * volatility * sqrtT * currentPrice * 0.5;

        newData.push({
            day: i,
            baseline: baseline,
            scenario: scenarioPrice + noise,
            upper: scenarioPrice * 1.1,
            lower: scenarioPrice * 0.9
        });
    }
    setData(newData);

    // 3. Calculate Financial Stress Test (Impact on Current Inventory)
    // Assume we hold inventory. If price drops, we lose market value.
    const totalMarketValue = MOCK_POSITIONS.reduce((acc, p) => acc + p.marketValue, 0);
    const estimatedPnlChange = totalMarketValue * (totalPriceImpact / 100);
    setImpactPnl(estimatedPnlChange);
  };

  const toggleEvent = (id: string) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, active: !e.active } : e));
  };

  useEffect(() => {
    runScenarioSimulation();
  }, [events]);

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="bg-terminal-panel border border-terminal-border p-4 rounded-sm flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2 font-mono">
            <Zap className="text-terminal-accent" size={20} />
            情景推演实验室 (Scenario Laboratory)
          </h2>
          <p className="text-xs text-gray-500 font-mono mt-1">因果推断引擎 (Causal Inference Engine): 模拟重大事件对库存货值的冲击</p>
        </div>
        <div className="flex gap-2">
           <button onClick={() => setEvents(SCENARIO_EVENTS.map(e => ({...e, active: false})))} className="bg-gray-800 text-gray-400 px-4 py-2 rounded-sm font-bold text-xs flex items-center gap-2 hover:bg-gray-700">
             <RotateCcw size={14} /> 重置所有因子
           </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 flex-1">
        {/* LEFT: Event Cards */}
        <div className="col-span-4 flex flex-col gap-3 overflow-y-auto pr-2">
            <h3 className="text-xs font-mono text-gray-500 uppercase">1. 选择风险因子 (Select Events)</h3>
            {events.map(evt => (
                <div 
                    key={evt.id} 
                    onClick={() => toggleEvent(evt.id)}
                    className={`cursor-pointer border p-3 rounded-sm transition-all ${evt.active ? 'bg-blue-900/20 border-blue-500' : 'bg-terminal-panel border-terminal-border hover:border-gray-600'}`}
                >
                    <div className="flex justify-between items-start mb-2">
                        <span className={`text-xs font-bold font-mono ${evt.active ? 'text-blue-400' : 'text-gray-400'}`}>{evt.name}</span>
                        <div className={`w-3 h-3 rounded-full border ${evt.active ? 'bg-blue-500 border-blue-500' : 'border-gray-600'}`}></div>
                    </div>
                    <p className="text-[10px] text-gray-500 leading-tight mb-2">{evt.description}</p>
                    <div className="flex gap-2 text-[10px] font-mono">
                        <span className={`${evt.impactOnPrice > 0 ? 'text-up-green' : 'text-down-red'}`}>Price: {evt.impactOnPrice > 0 ? '+' : ''}{evt.impactOnPrice}%</span>
                        <span className="text-gray-600">|</span>
                        <span className="text-gray-400">Prob: {evt.probability * 100}%</span>
                    </div>
                </div>
            ))}
        </div>

        {/* CENTER: Scenario Chart */}
        <div className="col-span-8 flex flex-col gap-4">
             {/* Chart */}
             <div className="bg-terminal-panel border border-terminal-border p-4 rounded-sm flex-1 min-h-[300px] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                     <h3 className="text-xs font-mono text-gray-500 uppercase">2. 价格路径推演 (Price Path Projection)</h3>
                     <div className="flex gap-4 text-[10px] font-mono">
                        <span className="flex items-center gap-1 text-blue-400"><span className="w-2 h-2 bg-blue-500 rounded-full"></span> Scenario Path</span>
                        <span className="flex items-center gap-1 text-gray-500"><span className="w-2 h-2 bg-gray-500 rounded-full border border-dashed"></span> Baseline</span>
                     </div>
                </div>
                <div className="flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                            <XAxis dataKey="day" tick={{fill: '#6b7280', fontSize: 10}} tickFormatter={v => `T+${v}`} />
                            <YAxis domain={['auto', 'auto']} tick={{fill: '#6b7280', fontSize: 10}} tickFormatter={v => `¥${v.toFixed(0)}`} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', fontSize: '11px', fontFamily: 'monospace' }}
                                formatter={(val: number) => `¥${val.toFixed(2)}`}
                            />
                            {/* Confidence Interval */}
                            <Area type="monotone" dataKey="upper" stroke="none" fill="#3b82f6" fillOpacity={0.1} />
                            <Area type="monotone" dataKey="lower" stroke="none" fill="#3b82f6" fillOpacity={0.1} />
                            
                            <Area type="monotone" dataKey="scenario" stroke="#3b82f6" strokeWidth={2} fill="url(#colorScenario)" fillOpacity={0.05} />
                            <Area type="monotone" dataKey="baseline" stroke="#6b7280" strokeDasharray="5 5" strokeWidth={1} fill="transparent" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
             </div>

             {/* BOTTOM: Stress Test Result */}
             <div className="bg-terminal-panel border border-terminal-border p-4 rounded-sm">
                <h3 className="text-xs font-mono text-gray-500 uppercase mb-3 flex items-center gap-2">
                    <AlertTriangle size={14} /> 3. 压力测试结果 (Stress Test Impact)
                </h3>
                <div className="grid grid-cols-3 gap-8">
                    <div>
                        <div className="text-[10px] text-gray-500 mb-1">价格波动预期 (Price Shock)</div>
                        <div className={`text-xl font-bold font-mono ${impactPnl >= 0 ? 'text-up-green' : 'text-down-red'}`}>
                            {impactPnl >= 0 ? '+' : ''}{(impactPnl / (MOCK_POSITIONS.reduce((a,b)=>a+b.marketValue,0)) * 100).toFixed(1)}%
                        </div>
                    </div>
                    <div>
                        <div className="text-[10px] text-gray-500 mb-1">库存盈亏影响 (P&L Impact)</div>
                        <div className={`text-xl font-bold font-mono ${impactPnl >= 0 ? 'text-up-green' : 'text-down-red'}`}>
                            {impactPnl >= 0 ? '+' : '-'}¥{Math.abs(impactPnl / 10000).toFixed(2)}w
                        </div>
                    </div>
                    <div className="flex items-center">
                        {impactPnl < -200000 && (
                            <div className="flex items-center gap-2 text-red-500 bg-red-900/20 px-3 py-2 rounded border border-red-500/50">
                                <AlertTriangle size={16} />
                                <span className="text-xs font-bold">建议立即对冲或减仓!</span>
                            </div>
                        )}
                        {impactPnl > 200000 && (
                            <div className="flex items-center gap-2 text-green-500 bg-green-900/20 px-3 py-2 rounded border border-green-500/50">
                                <TrendingUp size={16} />
                                <span className="text-xs font-bold">建议增加核心库存!</span>
                            </div>
                        )}
                    </div>
                </div>
             </div>
        </div>
      </div>
    </div>
  );
};
