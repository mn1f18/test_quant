import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Play, RotateCcw, Settings, AlertTriangle } from 'lucide-react';

interface SimulationViewProps {
  currentPrice: number;
}

export const SimulationView: React.FC<SimulationViewProps> = ({ currentPrice }) => {
  const [volatility, setVolatility] = useState(0.25);
  const [bullDrift, setBullDrift] = useState(0.45);
  const [bearDrift, setBearDrift] = useState(-0.35);
  const [days, setDays] = useState(90);
  const [data, setData] = useState<any[]>([]);

  const runSimulation = () => {
    const dt = 1 / 365;
    const newData = [];
    
    // Generate P90 (Bull), P50 (Base), P10 (Bear) probability cones
    // Instead of single paths, we calculate statistical expected values for cleanliness
    // S_t = S_0 * exp((mu - 0.5*sigma^2)t + sigma*sqrt(t)*Z)
    
    let pBull = currentPrice;
    let pBase = currentPrice;
    let pBear = currentPrice;

    for (let i = 0; i <= days; i++) {
        const t = i * dt;
        const sqrtT = Math.sqrt(t);
        
        // Z-scores for confidence intervals
        const z90 = 1.28; 
        const z50 = 0;
        const z10 = -1.28;

        // Bull Scenario: High drift, positive shock
        const bullVal = currentPrice * Math.exp((bullDrift - 0.5 * volatility * volatility) * t + volatility * sqrtT * z90);
        
        // Base Scenario: Small positive drift (inflation), neutral shock
        const baseVal = currentPrice * Math.exp((0.05 - 0.5 * volatility * volatility) * t + volatility * sqrtT * z50);

        // Bear Scenario: Negative drift, negative shock
        const bearVal = currentPrice * Math.exp((bearDrift - 0.5 * volatility * volatility) * t + volatility * sqrtT * z10);

        newData.push({
            day: i,
            bull: bullVal,
            base: baseVal,
            bear: bearVal,
        });
    }
    setData(newData);
  };

  useEffect(() => {
    runSimulation();
  }, [currentPrice]); // Run on mount

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="bg-terminal-panel border border-terminal-border p-4 rounded-sm flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2 font-mono">
            <Settings className="text-terminal-accent" size={20} />
            高级蒙特卡洛模拟 (Advanced Monte Carlo)
          </h2>
          <p className="text-xs text-gray-500 font-mono mt-1">基于几何布朗运动 (GBM) 的价格概率锥预测</p>
        </div>
        <div className="flex gap-2">
           <button onClick={runSimulation} className="bg-terminal-accent text-black px-4 py-2 rounded-sm font-bold text-xs flex items-center gap-2 hover:bg-yellow-400">
             <Play size={14} /> 重新计算
           </button>
           <button onClick={() => { setVolatility(0.25); setBullDrift(0.45); setBearDrift(-0.35); setDays(90); runSimulation(); }} className="bg-gray-800 text-gray-400 px-4 py-2 rounded-sm font-bold text-xs flex items-center gap-2 hover:bg-gray-700">
             <RotateCcw size={14} /> 重置参数
           </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 flex-1">
        {/* Controls */}
        <div className="col-span-3 bg-terminal-panel border border-terminal-border p-4 rounded-sm flex flex-col gap-6">
            <div className="space-y-3">
                <label className="text-xs font-mono text-gray-400 block">年化波动率 (Volatility σ)</label>
                <input 
                    type="range" min="0.1" max="0.8" step="0.01" 
                    value={volatility} onChange={(e) => setVolatility(parseFloat(e.target.value))}
                    className="w-full accent-terminal-accent"
                />
                <div className="flex justify-between text-xs font-mono text-white">
                    <span>10% (Stable)</span>
                    <span className="text-terminal-accent">{(volatility * 100).toFixed(0)}%</span>
                    <span>80% (Chaos)</span>
                </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-gray-800">
                <label className="text-xs font-mono text-up-green block">牛市漂移率 (Bull Drift μ)</label>
                <input 
                    type="range" min="0" max="1.0" step="0.05" 
                    value={bullDrift} onChange={(e) => setBullDrift(parseFloat(e.target.value))}
                    className="w-full accent-up-green"
                />
                <div className="text-right text-xs font-mono text-up-green">+{(bullDrift * 100).toFixed(0)}% Annual</div>
            </div>

            <div className="space-y-3 pt-4 border-t border-gray-800">
                <label className="text-xs font-mono text-down-red block">熊市漂移率 (Bear Drift μ)</label>
                <input 
                    type="range" min="-1.0" max="0" step="0.05" 
                    value={bearDrift} onChange={(e) => setBearDrift(parseFloat(e.target.value))}
                    className="w-full accent-down-red"
                />
                <div className="text-right text-xs font-mono text-down-red">{(bearDrift * 100).toFixed(0)}% Annual</div>
            </div>

            <div className="space-y-3 pt-4 border-t border-gray-800">
                <label className="text-xs font-mono text-gray-400 block">预测天数 (Days T)</label>
                <input 
                    type="range" min="30" max="365" step="30" 
                    value={days} onChange={(e) => setDays(parseInt(e.target.value))}
                    className="w-full accent-blue-500"
                />
                <div className="text-right text-xs font-mono text-white">{days} Days</div>
            </div>

            <div className="mt-auto p-3 bg-gray-900/50 border border-gray-800 rounded text-xs text-gray-500 font-mono">
                <div className="flex items-start gap-2">
                    <AlertTriangle size={14} className="text-terminal-accent shrink-0" />
                    <p>
                        注意：该模型假设价格服从对数正态分布。极端政策事件（如关税突变）可能导致价格突破P90/P10区间（肥尾效应）。
                    </p>
                </div>
            </div>
        </div>

        {/* Chart */}
        <div className="col-span-9 bg-terminal-panel border border-terminal-border p-4 rounded-sm flex flex-col">
           <div className="flex justify-end gap-4 mb-2 font-mono text-xs">
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500/20 border border-green-500 block"></span> P90 Bull Case</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-gray-500/20 border border-gray-500 block"></span> P50 Base Case</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-500/20 border border-red-500 block"></span> P10 Bear Case</span>
           </div>
           <div className="flex-1 min-h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis dataKey="day" tick={{fill: '#6b7280', fontSize: 10}} label={{ value: 'Days into Future', position: 'insideBottom', offset: -5, fill: '#4b5563', fontSize: 10 }} />
                    <YAxis domain={['auto', 'auto']} tick={{fill: '#6b7280', fontSize: 10}} tickFormatter={(val) => `¥${val.toFixed(0)}`} />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', fontFamily: 'monospace' }}
                        formatter={(val: number) => `¥${val.toFixed(2)}`}
                        labelFormatter={(label) => `T+${label}`}
                    />
                    <Area type="monotone" dataKey="bull" stroke="#22c55e" fill="#22c55e" fillOpacity={0.1} strokeWidth={2} name="Bull (P90)" />
                    <Area type="monotone" dataKey="base" stroke="#6b7280" fill="#6b7280" fillOpacity={0.05} strokeWidth={1} strokeDasharray="5 5" name="Base (P50)" />
                    <Area type="monotone" dataKey="bear" stroke="#ef4444" fill="#ef4444" fillOpacity={0.1} strokeWidth={2} name="Bear (P10)" />
                </AreaChart>
            </ResponsiveContainer>
           </div>
        </div>
      </div>
    </div>
  );
};