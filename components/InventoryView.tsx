import React from 'react';
import { Position, Warehouse } from '../types';
import { WAREHOUSES } from '../constants';
import { MapPin, Package, Clock, DollarSign, Container } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, CartesianGrid } from 'recharts';

interface InventoryViewProps {
  positions: Position[];
}

export const InventoryView: React.FC<InventoryViewProps> = ({ positions }) => {
  const totalTons = positions.reduce((acc, p) => acc + p.quantityTons, 0);
  const totalValue = positions.reduce((acc, p) => acc + p.marketValue, 0);
  const totalDailyCost = positions.reduce((acc, p) => {
    const wh = WAREHOUSES.find(w => w.id === p.warehouseId);
    return acc + (p.quantityTons * (wh?.dailyCostPerTon || 0));
  }, 0);

  // Group by Warehouse for Chart
  const whData = WAREHOUSES.map(wh => {
    const stock = positions.filter(p => p.warehouseId === wh.id);
    const value = stock.reduce((acc, p) => acc + p.marketValue, 0);
    return { name: wh.location, value: value, fullObj: wh };
  });

  const agingData = positions.map(p => ({
    name: p.cutName,
    days: p.daysHeld,
    cost: p.storageCostAccrued,
    color: p.daysHeld > 60 ? '#ef4444' : p.daysHeld > 30 ? '#eab308' : '#22c55e'
  }));

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899'];

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-terminal-panel border border-terminal-border p-4 rounded-sm flex items-center gap-4">
          <div className="p-3 bg-blue-900/30 rounded text-blue-400"><Container size={24} /></div>
          <div>
            <div className="text-xs text-gray-500 uppercase font-mono">总库存 (Total Tonnage)</div>
            <div className="text-xl font-bold font-mono text-white">{totalTons} <span className="text-xs text-gray-500">tons</span></div>
          </div>
        </div>
        <div className="bg-terminal-panel border border-terminal-border p-4 rounded-sm flex items-center gap-4">
          <div className="p-3 bg-green-900/30 rounded text-green-400"><DollarSign size={24} /></div>
          <div>
            <div className="text-xs text-gray-500 uppercase font-mono">库存货值 (Total Value)</div>
            <div className="text-xl font-bold font-mono text-white">¥{(totalValue / 10000).toFixed(1)} <span className="text-xs text-gray-500">万</span></div>
          </div>
        </div>
        <div className="bg-terminal-panel border border-terminal-border p-4 rounded-sm flex items-center gap-4">
          <div className="p-3 bg-red-900/30 rounded text-red-400"><DollarSign size={24} /></div>
          <div>
            <div className="text-xs text-gray-500 uppercase font-mono">每日仓储费 (Daily Burn)</div>
            <div className="text-xl font-bold font-mono text-white">¥{totalDailyCost.toFixed(0)}</div>
          </div>
        </div>
        <div className="bg-terminal-panel border border-terminal-border p-4 rounded-sm flex items-center gap-4">
          <div className="p-3 bg-yellow-900/30 rounded text-yellow-400"><Clock size={24} /></div>
          <div>
            <div className="text-xs text-gray-500 uppercase font-mono">平均库龄 (Avg Aging)</div>
            <div className="text-xl font-bold font-mono text-white">{(positions.reduce((a,b) => a+b.daysHeld,0) / positions.length).toFixed(0)} <span className="text-xs text-gray-500">days</span></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 flex-1">
        {/* Warehouse Distribution */}
        <div className="col-span-4 bg-terminal-panel border border-terminal-border p-4 rounded-sm flex flex-col">
            <h3 className="text-xs text-gray-500 font-mono mb-4 uppercase flex items-center gap-2">
               <MapPin size={14} /> 仓库分布 (Distribution)
            </h3>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={whData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {whData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                     contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', fontSize: '11px' }}
                     formatter={(value: number) => `¥${(value/10000).toFixed(0)}w`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-3">
               {WAREHOUSES.map((wh, idx) => {
                  const hasStock = positions.some(p => p.warehouseId === wh.id);
                  return (
                    <div key={wh.id} className={`flex justify-between items-center text-xs p-2 rounded border ${hasStock ? 'border-gray-700 bg-gray-900/50' : 'border-transparent opacity-50'}`}>
                        <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[idx % COLORS.length]}}></div>
                             <span className="text-white font-bold">{wh.name}</span>
                        </div>
                        <div className="text-right">
                             <div className="text-gray-400">{wh.capacityUsed}% Full</div>
                             <div className="text-[10px] text-gray-600">¥{wh.dailyCostPerTon}/t/day</div>
                        </div>
                    </div>
                  );
               })}
            </div>
        </div>

        {/* Aging Analysis */}
        <div className="col-span-8 bg-terminal-panel border border-terminal-border p-4 rounded-sm flex flex-col">
            <h3 className="text-xs text-gray-500 font-mono mb-4 uppercase flex items-center gap-2">
               <Package size={14} /> 库龄分析 (Inventory Aging)
            </h3>
            <div className="flex-1">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={agingData} margin={{ left: 40, right: 40 }}>
                     <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
                     <XAxis type="number" stroke="#4b5563" fontSize={10} tickFormatter={(val) => `${val}d`} />
                     <YAxis dataKey="name" type="category" width={100} stroke="#9ca3af" fontSize={11} />
                     <Tooltip 
                        cursor={{fill: 'transparent'}}
                        contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', fontSize: '11px' }}
                        formatter={(value: number) => [`${value} days`, 'Days Held']}
                     />
                     <Bar dataKey="days" barSize={20} radius={[0, 4, 4, 0]}>
                        {agingData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                     </Bar>
                  </BarChart>
               </ResponsiveContainer>
            </div>
            <div className="mt-4 border-t border-gray-800 pt-3">
                <table className="w-full text-xs font-mono text-left">
                    <thead className="text-gray-500">
                        <tr>
                            <th className="pb-2">SKU</th>
                            <th className="pb-2">入库日期</th>
                            <th className="pb-2 text-right">已产生仓储费</th>
                            <th className="pb-2 text-right">状态</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-300">
                        {positions.map(p => (
                            <tr key={p.id} className="border-b border-gray-800 last:border-0">
                                <td className="py-2">{p.cutName}</td>
                                <td className="py-2 text-gray-500">{p.entryDate}</td>
                                <td className="py-2 text-right text-red-300">¥{p.storageCostAccrued.toLocaleString()}</td>
                                <td className="py-2 text-right">
                                    {p.daysHeld > 60 ? 
                                        <span className="text-red-500 font-bold">滞销 (STAGNANT)</span> : 
                                        <span className="text-green-500">正常 (OK)</span>
                                    }
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
  );
};