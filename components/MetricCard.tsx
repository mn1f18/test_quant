import React from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  subValue?: string;
  color?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({ label, value, trend, subValue, color }) => {
  let textColor = 'text-white';
  if (trend === 'up') textColor = 'text-up-green';
  if (trend === 'down') textColor = 'text-down-red';
  if (color) textColor = color;

  return (
    <div className="bg-terminal-panel border border-terminal-border p-3 rounded-sm flex flex-col justify-between">
      <span className="text-gray-500 text-[10px] uppercase font-mono tracking-widest">{label}</span>
      <div className="flex items-baseline gap-2 mt-1">
        <span className={`text-xl font-bold font-mono ${textColor}`}>{value}</span>
        {subValue && <span className="text-gray-500 text-xs">{subValue}</span>}
      </div>
    </div>
  );
};