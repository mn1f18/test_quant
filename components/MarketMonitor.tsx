
import React from 'react';
import { MONITOR_METRICS, CHART_PRICE_SPREAD, CHART_SLAUGHTER, CHART_IMPORT_VOL } from '../constants';
import { MonitorMetric, ChartSeries } from '../types';
import { TrendingUp, TrendingDown, Minus, Activity, ArrowRight, Anchor, DollarSign } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, YAxis, LineChart, Line, XAxis, Tooltip, CartesianGrid, ComposedChart, Bar } from 'recharts';

// --- SUB-COMPONENTS FOR CHARTS ---

// 1. Spread Chart (Domestic vs Import)
const SpreadChart: React.FC = () => (
    <div className="h-[180px] w-full bg-terminal-panel border border-terminal-border p-2 rounded-sm">
        <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] text-gray-500 font-mono uppercase">内外价差趋势 (Domestic vs Import)</span>
            <span className="text-[10px] text-blue-400 font-mono">Spread: ¥17.36</span>
        </div>
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={CHART_PRICE_SPREAD}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="date" hide />
                <YAxis domain={['auto', 'auto']} tick={{fill:'#6b7280', fontSize:9}} axisLine={false} tickLine={false} width={25} />
                <Tooltip contentStyle={{backgroundColor:'#111827', fontSize:'10px'}} />
                <Line type="monotone" dataKey="value" stroke="#ef4444" strokeWidth={1.5} dot={false} name="Domestic" />
                <Line type="monotone" dataKey="value2" stroke="#3b82f6" strokeWidth={1.5} dot={false} name="Import" />
            </LineChart>
        </ResponsiveContainer>
    </div>
);

// 2. Slaughter Chart
const SlaughterChart: React.FC = () => (
    <div className="h-[180px] w-full bg-terminal-panel border border-terminal-border p-2 rounded-sm">
         <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] text-gray-500 font-mono uppercase">巴西锁牛天数 (Escala de Abate)</span>
            <span className="text-[10px] text-green-400 font-mono">8.5 Days</span>
        </div>
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={CHART_SLAUGHTER}>
                 <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                 <YAxis hide />
                 <Tooltip contentStyle={{backgroundColor:'#111827', fontSize:'10px'}} />
                 <Area type="step" dataKey="value" stroke="#22c55e" fill="#22c55e" fillOpacity={0.2} />
            </AreaChart>
        </ResponsiveContainer>
    </div>
);

// 3. Volume Chart
const VolumeChart: React.FC = () => (
    <div className="h-[180px] w-full bg-terminal-panel border border-terminal-border p-2 rounded-sm">
         <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] text-gray-500 font-mono uppercase">月度进口量 (Import Volume)</span>
            <span className="text-[10px] text-gray-400 font-mono">24w Tons</span>
        </div>
        <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={CHART_IMPORT_VOL}>
                 <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                 <XAxis dataKey="date" tick={{fontSize:9, fill:'#6b7280'}} interval={2} />
                 <YAxis hide />
                 <Tooltip contentStyle={{backgroundColor:'#111827', fontSize:'10px'}} />
                 <Bar dataKey="value" fill="#3b82f6" barSize={10} name="2026" />
                 <Line type="monotone" dataKey="value2" stroke="#9ca3af" strokeDasharray="3 3" dot={false} name="2025" />
            </ComposedChart>
        </ResponsiveContainer>
    </div>
);


const MetricRow: React.FC<{ metrics: MonitorMetric[] }> = ({ metrics }) => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
        {metrics.map(m => (
            <div key={m.id} className="bg-terminal-panel border border-terminal-border p-2 rounded-sm flex items-center justify-between">
                <div>
                    <div className="text-[9px] text-gray-500 uppercase font-mono">{m.name.split(' ')[0]}</div>
                    <div className="text-sm font-bold font-mono text-white">{m.value}</div>
                </div>
                <div className={`text-[10px] font-mono ${m.trend === 'UP' ? 'text-up-green' : m.trend === 'DOWN' ? 'text-down-red' : 'text-gray-500'}`}>
                    {m.change > 0 ? '+' : ''}{m.change}%
                </div>
            </div>
        ))}
    </div>
);

export const MarketMonitor: React.FC = () => {
  const upstream = MONITOR_METRICS.filter(m => m.category === 'UPSTREAM');
  const midstream = MONITOR_METRICS.filter(m => m.category === 'MIDSTREAM');
  const downstream = MONITOR_METRICS.filter(m => m.category === 'DOWNSTREAM');

  return (
    <div className="h-full flex flex-col gap-4 overflow-y-auto pb-4">
      {/* SECTION 1: GLOBAL & MACRO */}
      <div className="border-b border-gray-800 pb-4">
         <h3 className="text-terminal-accent text-xs font-bold font-mono uppercase mb-3 flex items-center gap-2">
            <Anchor size={14} /> 01. 宏观与贸易概览 (Macro & Trade)
         </h3>
         <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 md:col-span-8">
                <MetricRow metrics={midstream} />
                <div className="grid grid-cols-2 gap-4">
                    <SpreadChart />
                    <VolumeChart />
                </div>
            </div>
            <div className="col-span-12 md:col-span-4 bg-gray-900/30 p-3 rounded border border-gray-800">
                <h4 className="text-[10px] text-gray-500 uppercase mb-2">Key Insights</h4>
                <ul className="text-[11px] text-gray-300 space-y-2 font-mono">
                    <li className="flex gap-2"><span className="text-red-500">•</span> 美元指数强劲 (100+), 压制大宗商品价格。</li>
                    <li className="flex gap-2"><span className="text-green-500">•</span> 海运费回落至 $4200/柜, CIF成本压力缓解。</li>
                    <li className="flex gap-2"><span className="text-blue-500">•</span> 进口量同比增加 +2.8%, 港口库存压力仍大。</li>
                </ul>
            </div>
         </div>
      </div>

      {/* SECTION 2: UPSTREAM (BRAZIL) */}
      <div className="border-b border-gray-800 pb-4">
         <h3 className="text-green-500 text-xs font-bold font-mono uppercase mb-3 flex items-center gap-2">
            <Activity size={14} /> 02. 巴西上游供应 (Brazil Origin)
         </h3>
         <div className="grid grid-cols-12 gap-4">
             <div className="col-span-12 md:col-span-4">
                 <SlaughterChart />
             </div>
             <div className="col-span-12 md:col-span-8">
                 <MetricRow metrics={upstream} />
                 <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-gray-500">
                     <div className="bg-terminal-panel p-2">
                        <span className="block mb-1">Boi Gordo (SP)</span>
                        <span className="text-lg text-white font-bold">R$ 321.50</span>
                        <span className="text-red-500 ml-2">-0.5% DoD</span>
                     </div>
                     <div className="bg-terminal-panel p-2">
                        <span className="block mb-1">Bezerro (MS)</span>
                        <span className="text-lg text-white font-bold">R$ 2,350</span>
                        <span className="text-green-500 ml-2">+1.2% WoW</span>
                     </div>
                 </div>
             </div>
         </div>
      </div>

      {/* SECTION 3: DOWNSTREAM (CHINA) */}
      <div>
         <h3 className="text-red-500 text-xs font-bold font-mono uppercase mb-3 flex items-center gap-2">
            <DollarSign size={14} /> 03. 中国消费终端 (China Demand)
         </h3>
         <MetricRow metrics={downstream} />
         <div className="bg-terminal-panel border border-terminal-border p-3 rounded-sm">
             <div className="flex justify-between text-[10px] text-gray-500 font-mono mb-2 border-b border-gray-800 pb-1">
                 <span>Wholesale Index (Shanghai)</span>
                 <span>Inventory Level (Tianjin)</span>
                 <span>Catering Demand</span>
             </div>
             <div className="flex justify-between text-xs font-bold font-mono text-white">
                 <span>52.1 ¥/kg <span className="text-red-500">▼</span></span>
                 <span>High (92%) <span className="text-yellow-500">●</span></span>
                 <span>Weak <span className="text-gray-500">●</span></span>
             </div>
         </div>
      </div>
    </div>
  );
};
