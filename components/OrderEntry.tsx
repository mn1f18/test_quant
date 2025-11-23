import React, { useState } from 'react';
import { Order } from '../types';
import { KELLY_WIN_PROB, KELLY_WIN_LOSS_RATIO } from '../constants';
import { Calculator, Truck, PackageCheck } from 'lucide-react';

interface OrderEntryProps {
  onPlaceOrder: (order: Omit<Order, 'id' | 'timestamp' | 'status' | 'riskCheck'>) => void;
  currentPrice: number;
}

export const OrderEntry: React.FC<OrderEntryProps> = ({ onPlaceOrder, currentPrice }) => {
  const [side, setSide] = useState<'STOCK_IN' | 'STOCK_OUT'>('STOCK_IN');
  const [cutName, setCutName] = useState('眼肉 (Ribeye)');
  const [qty, setQty] = useState(10);
  const [price, setPrice] = useState(currentPrice);

  // Simple Kelly Calculation
  const kellyFraction = (KELLY_WIN_PROB * KELLY_WIN_LOSS_RATIO - (1 - KELLY_WIN_PROB)) / KELLY_WIN_LOSS_RATIO;
  const suggestedCapital = Math.max(0, kellyFraction * 1000000); // Assuming 1M pool

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onPlaceOrder({
      cutName,
      side,
      price,
      quantity: qty,
    });
  };

  return (
    <div className="bg-terminal-panel border border-terminal-border p-4 rounded-sm h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-terminal-accent text-sm font-bold font-mono uppercase flex items-center gap-2">
           <Calculator size={16} /> 现货交易台 (Spot Desk)
        </h3>
        <span className="text-xs text-gray-500">策略: 凯利增强型</span>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          onClick={() => setSide('STOCK_IN')}
          className={`py-3 text-sm font-bold rounded-sm transition-colors flex items-center justify-center gap-2 ${
            side === 'STOCK_IN' ? 'bg-up-green text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          <Truck size={16} />
          <span>补库 (Restock)</span>
        </button>
        <button
          onClick={() => setSide('STOCK_OUT')}
          className={`py-3 text-sm font-bold rounded-sm transition-colors flex items-center justify-center gap-2 ${
            side === 'STOCK_OUT' ? 'bg-terminal-accent text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          <PackageCheck size={16} />
          <span>出货 (Destock)</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-500 text-xs font-mono mb-1">标的物 (Instrument)</label>
          <select 
            value={cutName} 
            onChange={(e) => setCutName(e.target.value)}
            className="w-full bg-black border border-gray-700 text-white text-sm p-2 font-mono focus:border-terminal-accent focus:outline-none"
          >
            <optgroup label="核心部位 (Key Cuts)">
              <option>眼肉 (Ribeye)</option>
              <option>西冷 (Striploin)</option>
              <option>前四分体 (Forequarter 80VL)</option>
              <option>牛腩 (Brisket/Flank)</option>
            </optgroup>
            <optgroup label="后三件套">
              <option>大米龙 (Silverside)</option>
              <option>牛霖 (Knuckle)</option>
              <option>臀肉 (Rump)</option>
            </optgroup>
            <optgroup label="投机/深加工">
              <option>牛腱 (Shin/Shank)</option>
              <option>脖肉 (Neck)</option>
              <option>板腱 (Oyster Blade)</option>
            </optgroup>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-500 text-xs font-mono mb-1">数量 (吨)</label>
            <input 
              type="number" 
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
              className="w-full bg-black border border-gray-700 text-white text-sm p-2 font-mono focus:border-terminal-accent focus:outline-none text-right" 
            />
          </div>
          <div>
             <label className="block text-gray-500 text-xs font-mono mb-1">价格 (CNY/kg)</label>
             <input 
                type="number" 
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                step="0.05"
                className="w-full bg-black border border-gray-700 text-white text-sm p-2 font-mono focus:border-terminal-accent focus:outline-none text-right" 
              />
          </div>
        </div>

        {/* Risk / Strategy Info */}
        <div className="bg-black/50 p-3 border border-gray-800 rounded-sm">
          <div className="flex justify-between items-center text-xs mb-1">
            <span className="text-gray-400">建议补库资金:</span>
            <span className="font-mono text-terminal-accent">{(kellyFraction * 100).toFixed(1)}%</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-400">资金上限:</span>
            <span className="font-mono text-white">¥{(suggestedCapital/10000).toFixed(1)}w</span>
          </div>
          <div className="flex justify-between items-center text-xs mt-2 pt-2 border-t border-gray-800">
            <span className="text-gray-400">止损出货线 (5%):</span>
            <span className="font-mono text-down-red">¥{(price * 0.95).toFixed(2)}</span>
          </div>
        </div>

        <button 
          type="submit" 
          className="w-full bg-terminal-border hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-sm border-t-2 border-terminal-accent mt-2 transition-all active:scale-95"
        >
          {side === 'STOCK_IN' ? '确认入库 (CONFIRM PURCHASE)' : '确认销售 (CONFIRM SALE)'}
        </button>
      </form>
    </div>
  );
};