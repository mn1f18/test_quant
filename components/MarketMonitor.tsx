
import React from 'react';
import { MONITOR_METRICS } from '../constants';
import { MonitorMetric } from '../types';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, ArrowRight } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';

interface MetricCardProps {
  metric: MonitorMetric;
}

const Sparkline: React.FC<{ data: number[]; color: string }> = ({ data, color }) => {
  const chartData = data.map((val, i) => ({ i, val }));
  return (
    <div className="h-10 w-24">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <Area type="monotone" dataKey="val" stroke={color} fill={color} fillOpacity={0.2} strokeWidth={2} />
          <YAxis domain={['auto', 'auto']} hide />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

const MonitorCard: React.FC<MetricCardProps> = ({ metric }) => {
  const isUp = metric.trend === 'UP';
  const isDown = metric.trend === 'DOWN';
  const color = isUp ? '#22c55e' : isDown ? '#ef4444' : '#9ca3af';
  const severityColor = metric.severity === 'HIGH' ? 'bg-red-900/40 border-red-500' : metric.severity === 'MEDIUM' ? 'bg-yellow-900/40 border-yellow-500' : 'bg-gray-800 border-gray-700';

  return (
    <div className="bg-terminal-panel border border-terminal-border p-3 rounded-sm hover:border-terminal-accent transition-colors group">
      <div className="flex justify-between items-start mb-2">
        <h4 className="text-xs font-mono text-gray-400 uppercase tracking-wide group-hover:text-white transition-colors">{metric.name}</h4>
        {metric.severity === 'HIGH' && <AlertTriangle size={12} className="text-red-500 animate-pulse" />}
      </div>
      
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold font-mono text-white">{metric.value}</span>
            <span className="text-[10px] text-gray-500">{metric.unit}</span>
          </div>
          <div className={`text-[10px] font-mono flex items-center gap-1 ${isUp ? 'text-up-green' : isDown ? 'text-down-red' : 'text-gray-400'}`}>
            {isUp ? <TrendingUp size={10} /> : isDown ? <TrendingDown size={10} /> : <Minus size={10} />}
            <span>{metric.change > 0 ? '+' : ''}{metric.change}%</span>
          </div>
        </div>
        <Sparkline data={metric.history} color={color} />
      </div>

      <div className="mt-3 pt-2 border-t border-gray-800 text-[10px] text-gray-500 leading-tight">
        {metric.description}
      </div>
      
      <div className={`mt-2 text-[9px] px-1.5 py-0.5 inline-block rounded border ${severityColor} text-white opacity-80`}>
        Risk: {metric.severity}
      </div>
    </div>
  );
};

export const MarketMonitor: React.FC = () => {
  const upstream = MONITOR_METRICS.filter(m => m.category === 'UPSTREAM');
  const midstream = MONITOR_METRICS.filter(m => m.category === 'MIDSTREAM');
  const downstream = MONITOR_METRICS.filter(m => m.category === 'DOWNSTREAM');

  return (
    <div className="h-full flex flex-col gap-6">
      {/* UPSTREAM SECTION */}
      <div>
        <h3 className="text-terminal-accent font-mono text-sm font-bold uppercase mb-3 flex items-center gap-2 border-b border-terminal-border pb-1">
          <span>01. 上游供应端 (Upstream - Origin)</span>
          <ArrowRight size={14} className="text-gray-600" />
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {upstream.map(m => <MonitorCard key={m.id} metric={m} />)}
        </div>
      </div>

      {/* MIDSTREAM SECTION */}
      <div>
        <h3 className="text-blue-400 font-mono text-sm font-bold uppercase mb-3 flex items-center gap-2 border-b border-terminal-border pb-1">
          <span>02. 中游贸易链路 (Midstream - Logistics & Macro)</span>
          <ArrowRight size={14} className="text-gray-600" />
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {midstream.map(m => <MonitorCard key={m.id} metric={m} />)}
        </div>
      </div>

      {/* DOWNSTREAM SECTION */}
      <div>
        <h3 className="text-up-green font-mono text-sm font-bold uppercase mb-3 flex items-center gap-2 border-b border-terminal-border pb-1">
           <span>03. 下游消费端 (Downstream - China Domestic)</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {downstream.map(m => <MonitorCard key={m.id} metric={m} />)}
        </div>
      </div>
      
      {/* FOOTER NOTE */}
      <div className="mt-auto pt-4 text-center text-[10px] text-gray-600 font-mono">
        数据来源: GACC (海关), B3 (巴西交易所), Mysteel, Cepea. 延迟15分钟.
      </div>
    </div>
  );
};
