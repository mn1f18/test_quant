import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart, Area, AreaChart
} from 'recharts';
import { MarketDataPoint, SimulationData } from '../types';

interface PriceChartProps {
  data: MarketDataPoint[];
}

export const PriceChart: React.FC<PriceChartProps> = ({ data }) => {
  return (
    <div className="w-full h-[350px] bg-terminal-panel border border-terminal-border p-4 rounded-sm">
      <div className="flex justify-between mb-2">
        <h3 className="text-gray-400 text-xs font-mono uppercase tracking-wider">中国进口主流件套价格指数 (CNY/kg)</h3>
        <div className="flex gap-2 font-mono">
             <span className="text-xs text-blue-400">● 现货指数</span>
             <span className="text-xs text-purple-400">● 模型预测</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
          <XAxis 
            dataKey="date" 
            tick={{ fill: '#9ca3af', fontSize: 10, fontFamily: 'monospace' }} 
            axisLine={{ stroke: '#4b5563' }}
            tickLine={false}
            minTickGap={30}
          />
          <YAxis 
            domain={['auto', 'auto']} 
            tick={{ fill: '#9ca3af', fontSize: 10, fontFamily: 'monospace' }} 
            axisLine={false}
            tickLine={false}
            tickFormatter={(val) => `¥${val}`}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', fontSize: '12px' }}
            itemStyle={{ padding: 0 }}
            formatter={(value: number) => [`¥${value.toFixed(2)}`, '']}
          />
          <Area type="monotone" dataKey="price" stroke="#3b82f6" fill="url(#colorPrice)" fillOpacity={0.1} strokeWidth={2} name="现货指数" />
          <Line type="monotone" dataKey="predicted" stroke="#a855f7" strokeDasharray="5 5" dot={false} strokeWidth={1.5} name="AI预测" />
          <Line type="monotone" dataKey="importCost" stroke="#eab308" dot={false} strokeWidth={1} name="进口成本(CIF)" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

interface SimulationChartProps {
  data: SimulationData[];
}

export const SimulationChart: React.FC<SimulationChartProps> = ({ data }) => {
  return (
    <div className="w-full h-[250px] bg-terminal-panel border border-terminal-border p-4 rounded-sm">
      <div className="flex justify-between mb-2">
        <h3 className="text-gray-400 text-xs font-mono uppercase tracking-wider flex items-center gap-2">
           <span>随机游走模拟 (Monte Carlo)</span>
           <span className="px-1 py-0.5 bg-gray-800 text-[9px] rounded text-gray-400">Next 60 Days</span>
        </h3>
        <div className="flex gap-3 font-mono text-[10px]">
             <span className="text-green-400">▲ Bull (Policy)</span>
             <span className="text-gray-400">● Base (Neutral)</span>
             <span className="text-red-400">▼ Bear (Domestic)</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
          <XAxis 
            dataKey="day" 
            tick={{ fill: '#6b7280', fontSize: 10 }} 
            axisLine={false}
            tickLine={false}
            tickFormatter={(val) => `T+${val}`}
          />
          <YAxis 
            domain={['auto', 'auto']} 
            tick={{ fill: '#6b7280', fontSize: 10 }} 
            axisLine={false}
            tickLine={false}
            width={35}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', fontSize: '11px' }}
            labelFormatter={(label) => `Forecast: T+${label} Days`}
          />
          {/* StackId undefined to allow overlap */}
          <Area type="monotone" dataKey="bullCase" stroke="#22c55e" fill="#22c55e" fillOpacity={0.1} strokeWidth={2} stackId={undefined} name="Bull (Policy Shock)" />
          <Area type="monotone" dataKey="baseCase" stroke="#9ca3af" fill="#9ca3af" fillOpacity={0.1} strokeWidth={1} strokeDasharray="5 5" stackId={undefined} name="Base (Status Quo)" />
          <Area type="monotone" dataKey="bearCase" stroke="#ef4444" fill="#ef4444" fillOpacity={0.1} strokeWidth={2} stackId={undefined} name="Bear (Domestic Flood)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

interface EquityChartProps {
  data: { date: string; equity: number }[];
}

export const EquityChart: React.FC<EquityChartProps> = ({ data }) => {
  return (
    <div className="w-full h-[120px] bg-terminal-panel border border-terminal-border p-4 rounded-sm">
       <h3 className="text-gray-400 text-xs font-mono uppercase tracking-wider mb-2">资金曲线 (Equity Curve)</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis dataKey="date" hide />
          <YAxis domain={['auto', 'auto']} hide />
          <Tooltip 
            contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', fontSize: '10px' }} 
            formatter={(value: number) => [`¥${(value/10000).toFixed(2)}w`, '净值']}
          />
          <Line type="stepAfter" dataKey="equity" stroke="#22c55e" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};