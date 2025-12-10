


import React, { useState, useMemo } from 'react';
import { InventoryDetail, CalculationParameterSet, MarketPriceSeries, CalculatedInventoryItem } from '../types';
import { MOCK_INVENTORY_DETAILS, DEFAULT_PARAMETER_SETS, MOCK_MARKET_PRICES } from '../constants';
import { calculateInventoryItem } from '../services/inventoryLogic';
import { Settings, ChevronDown, ChevronRight, Calculator, DollarSign, Wallet, AlertCircle, Edit2, X, Check, Package, MapPin, Calendar, Warehouse, Tag, Clock, Hourglass } from 'lucide-react';

// --- Types Helper ---
type GroupedContainer = {
  containerId: string;
  contractId: string;
  funderId: string;
  country: string;
  factory: string;
  status: string;
  items: CalculatedInventoryItem[];
  // Aggregates
  totalWeight: number;
  totalEstimatedCost: number; // Sum of totals
  totalDailyBurn: number;
  totalReceivable: number;
  totalPayable: number;
  netCash: number;
  totalProfit: number;
  paramSetId: number;
  summaryItem?: CalculatedInventoryItem; // The whole container summary record if it exists
  floor?: number; // Configured Payment Floor
  countdown?: number | null; // Funding Countdown
};

interface InventoryViewProps {
  // We ignore passed props for now and use the internal new mock data for the demo
  positions?: any; 
}

// --- Parameter Editor Modal ---
const ParameterEditor: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  paramSets: CalculationParameterSet[];
  onUpdate: (updated: CalculationParameterSet) => void;
}> = ({ isOpen, onClose, paramSets, onUpdate }) => {
  const [selectedId, setSelectedId] = useState(paramSets[0].Parameter_Set_ID);
  const activeSet = paramSets.find(p => p.Parameter_Set_ID === selectedId) || paramSets[0];
  
  const [form, setForm] = useState<CalculationParameterSet>(activeSet);

  // Sync form when selection changes
  React.useEffect(() => {
    setForm(activeSet);
  }, [activeSet]);

  if (!isOpen) return null;

  const handleChange = (field: keyof CalculationParameterSet, value: number) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-terminal-panel border border-terminal-border w-[600px] p-6 rounded shadow-2xl">
        <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-2">
           <h2 className="text-terminal-accent font-mono font-bold flex items-center gap-2">
             <Settings size={20} /> 核心参数配置 (Parameter Set)
           </h2>
           <button onClick={onClose}><X size={20} className="text-gray-500 hover:text-white" /></button>
        </div>

        <div className="flex gap-2 mb-6">
           {paramSets.map(p => (
             <button 
               key={p.Parameter_Set_ID}
               onClick={() => setSelectedId(p.Parameter_Set_ID)}
               className={`px-3 py-1 text-xs font-mono border rounded ${selectedId === p.Parameter_Set_ID ? 'bg-terminal-accent text-black border-terminal-accent' : 'bg-gray-800 border-gray-700 text-gray-400'}`}
             >
               {p.Parameter_Set_Name}
             </button>
           ))}
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs font-mono text-gray-400">
           <div className="space-y-3">
              <label>
                 <span className="block mb-1">关税乘数 (Tariff Mul)</span>
                 <input type="number" step="0.01" value={form.Tariff_Multiplier} onChange={e => handleChange('Tariff_Multiplier', parseFloat(e.target.value))} className="w-full bg-black border border-gray-700 p-2 text-white" />
              </label>
              <label>
                 <span className="block mb-1">增值税乘数 (VAT Mul)</span>
                 <input type="number" step="0.01" value={form.VAT_Multiplier} onChange={e => handleChange('VAT_Multiplier', parseFloat(e.target.value))} className="w-full bg-black border border-gray-700 p-2 text-white" />
              </label>
              <label>
                 <span className="block mb-1">杂费 (Misc Cost ¥/kg)</span>
                 <input type="number" step="0.1" value={form.Fixed_Misc_Cost_Per_KG} onChange={e => handleChange('Fixed_Misc_Cost_Per_KG', parseFloat(e.target.value))} className="w-full bg-black border border-gray-700 p-2 text-white" />
              </label>
           </div>
           <div className="space-y-3">
              <label>
                 <span className="block mb-1">年化利率 (Annual Rate)</span>
                 <input type="number" step="0.001" value={form.Annual_Interest_Rate} onChange={e => handleChange('Annual_Interest_Rate', parseFloat(e.target.value))} className="w-full bg-black border border-gray-700 p-2 text-white" />
              </label>
              <label>
                 <span className="block mb-1">资金占用系数 (Occupancy)</span>
                 <input type="number" step="0.05" value={form.Capital_Occupancy_Ratio} onChange={e => handleChange('Capital_Occupancy_Ratio', parseFloat(e.target.value))} className="w-full bg-black border border-gray-700 p-2 text-white" />
              </label>
              <label>
                 <span className="block mb-1">日仓储费 (Storage ¥/Ton)</span>
                 <input type="number" step="0.1" value={form.Storage_Cost_Per_Ton_Day} onChange={e => handleChange('Storage_Cost_Per_Ton_Day', parseFloat(e.target.value))} className="w-full bg-black border border-gray-700 p-2 text-white" />
              </label>
           </div>
        </div>

        <div className="mt-6 flex justify-end">
           <button onClick={() => { onUpdate(form); onClose(); }} className="bg-up-green text-black font-bold px-4 py-2 rounded flex items-center gap-2 text-xs">
              <Check size={16} /> 保存并应用 (Save & Apply)
           </button>
        </div>
      </div>
    </div>
  );
};

// --- Inventory Editor Modal (For Specific Container) ---
const InventoryEditor: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  inventoryItem: InventoryDetail | null;
  onUpdate: (updated: Partial<InventoryDetail>) => void;
}> = ({ isOpen, onClose, inventoryItem, onUpdate }) => {
  const [floor, setFloor] = useState<number>(0);
  const [countdown, setCountdown] = useState<number | null>(null);

  React.useEffect(() => {
    if (inventoryItem) {
      setFloor(inventoryItem.Payment_Floor || 0);
      setCountdown(inventoryItem.Capital_Countdown_Days || null);
    }
  }, [inventoryItem]);

  if (!isOpen || !inventoryItem) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-terminal-panel border border-terminal-border w-[400px] p-6 rounded shadow-2xl">
        <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-2">
           <h2 className="text-terminal-accent font-mono font-bold flex items-center gap-2">
             <Edit2 size={16} /> 编辑货物属性 (Attributes)
           </h2>
           <button onClick={onClose}><X size={20} className="text-gray-500 hover:text-white" /></button>
        </div>
        
        <div className="text-[10px] text-gray-500 mb-4 font-mono">
            Container: {inventoryItem.Container_ID}
        </div>

        <div className="space-y-4 text-xs font-mono text-gray-400">
           <label className="block">
               <span className="block mb-1 text-white">应付扣减额 (Floor RMB)</span>
               <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    step="1000" 
                    value={floor} 
                    onChange={e => setFloor(parseFloat(e.target.value))} 
                    className="w-full bg-black border border-gray-700 p-2 text-white text-right font-bold" 
                  />
                  <span className="text-gray-500">¥</span>
               </div>
               <p className="mt-1 text-[9px] text-gray-600">该金额将直接从"预计应付货款"中扣除。</p>
           </label>

           <label className="block">
               <span className="block mb-1 text-white">资金期限倒计时 (Days)</span>
               <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    step="10" 
                    value={countdown || ''} 
                    onChange={e => setCountdown(e.target.value ? parseFloat(e.target.value) : null)} 
                    className="w-full bg-black border border-gray-700 p-2 text-white text-right font-bold" 
                    placeholder="None"
                  />
                  <span className="text-gray-500">d</span>
               </div>
           </label>
        </div>

        <div className="mt-6 flex justify-end">
           <button 
             onClick={() => { onUpdate({ Payment_Floor: floor, Capital_Countdown_Days: countdown }); onClose(); }} 
             className="bg-terminal-accent text-black font-bold px-4 py-2 rounded flex items-center gap-2 text-xs"
           >
              <Check size={16} /> 更新 (Update)
           </button>
        </div>
      </div>
    </div>
  );
};


// --- Main View ---
export const InventoryView: React.FC<InventoryViewProps> = () => {
  // Use state for Inventory Items so they can be edited
  const [inventoryItems, setInventoryItems] = useState<InventoryDetail[]>(MOCK_INVENTORY_DETAILS);
  const [expandedContainers, setExpandedContainers] = useState<Set<string>>(new Set(['AMCU9399445']));
  const [paramSets, setParamSets] = useState(DEFAULT_PARAMETER_SETS);
  
  const [showParamEditor, setShowParamEditor] = useState(false);
  const [showInventoryEditor, setShowInventoryEditor] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryDetail | null>(null);

  const [hoveredContainer, setHoveredContainer] = useState<{ id: string, x: number, y: number } | null>(null);
  const [hoveredPrice, setHoveredPrice] = useState<{ date: string, price: number, name: string, x: number, y: number } | null>(null);

  // State for assignments (which container uses which param set)
  const [containerParams, setContainerParams] = useState<Record<string, number>>({});

  // 1. Calculation Pipeline
  const calculatedData: CalculatedInventoryItem[] = useMemo(() => {
    return inventoryItems.map(detail => {
       // Determine which param set to use
       const pSetId = containerParams[detail.Container_ID] || detail.Parameter_Set_ID;
       const params = paramSets.find(p => p.Parameter_Set_ID === pSetId) || paramSets[0];
       
       const marketPrice = MOCK_MARKET_PRICES.find(m => m.SKU_Code === detail.SKU_Code) || {
           SKU_Code: detail.SKU_Code, 
           Product_Name: detail.Product_Name, 
           Est_Selling_Price_RMB_Per_KG: 0,
           Price_Date: '' // Fallback
       };

       return calculateInventoryItem(detail, params, marketPrice);
    });
  }, [inventoryItems, paramSets, containerParams]);

  // 2. Aggregation by Container
  const groupedData: GroupedContainer[] = useMemo(() => {
    const map = new Map<string, GroupedContainer>();

    calculatedData.forEach(item => {
        if (!map.has(item.Container_ID)) {
             map.set(item.Container_ID, {
                 containerId: item.Container_ID,
                 contractId: item.Supplier_Contract_ID,
                 funderId: item.Funder_ID,
                 country: item.Country,
                 factory: item.Factory_Code,
                 status: item.Goods_Status,
                 items: [],
                 totalWeight: 0,
                 totalEstimatedCost: 0,
                 totalDailyBurn: 0,
                 totalReceivable: 0,
                 totalPayable: 0, 
                 netCash: 0,
                 totalProfit: 0,
                 paramSetId: containerParams[item.Container_ID] || item.Parameter_Set_ID,
                 summaryItem: undefined,
                 floor: 0,
                 countdown: null
             });
        }
        const group = map.get(item.Container_ID)!;
        group.items.push(item);

        // CHECK IF THIS IS A WHOLE CONTAINER SUMMARY RECORD
        if (item.SKU_Code === item.Container_ID) {
            group.summaryItem = item;
            group.floor = item.Payment_Floor || 0;
            group.countdown = item.Capital_Countdown_Days;
            // We don't continue to aggregate it normally if we are going to use it as source of truth later
            return;
        }

        // Standard Aggregation for Individual Items (Used if no summary item exists)
        group.totalWeight += item.Weight_KG;
        group.totalEstimatedCost += (item.Estimated_Cost_RMB_Per_KG * item.Weight_KG);
        group.totalDailyBurn += (item.Daily_Storage_Cost_RMB + item.Daily_Interest_Cost_RMB);
        group.totalReceivable += item.Estimated_Receivable_RMB;
        group.totalProfit += item.Estimated_Profit_RMB;
    });

    // Final Pass for Container-Level Logic
    return Array.from(map.values()).map(group => {
        
        // IF SUMMARY ITEM EXISTS, USE ITS VALUES AS SOURCE OF TRUTH
        if (group.summaryItem) {
             const s = group.summaryItem;
             const grossPayable = s.Estimated_Cost_RMB_Per_KG * s.Weight_KG;
             const floor = s.Payment_Floor || 0;
             const realPayable = Math.max(0, grossPayable - floor);

             return {
                 ...group,
                 totalWeight: s.Weight_KG, // Use Summary Weight
                 totalEstimatedCost: grossPayable,
                 totalDailyBurn: (s.Daily_Storage_Cost_RMB + s.Daily_Interest_Cost_RMB),
                 totalReceivable: s.Estimated_Receivable_RMB,
                 totalPayable: realPayable,
                 netCash: s.Estimated_Receivable_RMB - realPayable,
                 totalProfit: s.Estimated_Profit_RMB
             };
        }

        // Fallback to aggregated values if no summary provided
        const grossPayable = group.totalEstimatedCost; 
        const realPayable = Math.max(0, grossPayable); // No floor default here
        
        return {
            ...group,
            totalPayable: realPayable,
            netCash: group.totalReceivable - realPayable
        };
    });
  }, [calculatedData, paramSets, containerParams]);

  // 3. Global Totals
  const globalTotals = {
      profit: groupedData.reduce((a,b) => a + b.totalProfit, 0),
      netCash: groupedData.reduce((a,b) => a + b.netCash, 0),
      burn: groupedData.reduce((a,b) => a + b.totalDailyBurn, 0)
  };

  const toggleExpand = (id: string) => {
    const newSet = new Set(expandedContainers);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedContainers(newSet);
  };

  const updateParamSetForContainer = (containerId: string, setId: number) => {
      setContainerParams(prev => ({ ...prev, [containerId]: setId }));
  };

  const handleEditInventory = (containerId: string) => {
      // Find the summary item to edit
      const group = groupedData.find(g => g.containerId === containerId);
      if (group && group.summaryItem) {
          setEditingItem(group.summaryItem);
          setShowInventoryEditor(true);
      } else {
          // If no summary item, maybe create one or show error. 
          console.warn("No summary item found for editing");
      }
  };

  const handleUpdateInventoryItem = (updatedFields: Partial<InventoryDetail>) => {
      if (!editingItem) return;
      setInventoryItems(prev => prev.map(item => 
          item.Inventory_SKU_ID === editingItem.Inventory_SKU_ID ? { ...item, ...updatedFields } : item
      ));
  };

  // 4. Logistics Info Helper
  const getLogisticsInfo = (containerId: string) => {
      const group = groupedData.find(g => g.containerId === containerId);
      if (!group) return null;
      const refItem = group.summaryItem || group.items[0];
      
      const isSpot = !!refItem.Spot_Price_RMB_Per_KG;

      return {
          ship: refItem.Shipping_Date || '-',
          eta: refItem.ETA_Date || '-',
          entry: refItem.Storage_Entry_Date || '-',
          storage: refItem.Cold_Storage,
          factory: refItem.Factory_Code,
          priceUsd: refItem.Future_Price_USD_Per_KG, // Future Price
          fx: refItem.Future_Ref_FX_USD_CNY,
          isSpot,
          spotPrice: refItem.Spot_Price_RMB_Per_KG,
          countdown: group.countdown
      };
  };

  const logisticsData = hoveredContainer ? getLogisticsInfo(hoveredContainer.id) : null;

  return (
    <div className="h-full flex flex-col gap-4">
      {/* HEADER BI */}
      <div className="grid grid-cols-4 gap-4 shrink-0">
          <div className="bg-terminal-panel border border-terminal-border p-4 rounded-sm flex items-center gap-4">
               <div className="p-3 bg-green-900/30 text-green-400 rounded"><Wallet size={24} /></div>
               <div>
                  <div className="text-[10px] text-gray-500 uppercase font-mono">预估总盈利 (Total Profit)</div>
                  <div className={`text-xl font-bold font-mono ${globalTotals.profit >= 0 ? 'text-up-green' : 'text-down-red'}`}>
                     ¥{globalTotals.profit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
               </div>
          </div>
          <div className="bg-terminal-panel border border-terminal-border p-4 rounded-sm flex items-center gap-4">
               <div className="p-3 bg-blue-900/30 text-blue-400 rounded"><DollarSign size={24} /></div>
               <div>
                  <div className="text-[10px] text-gray-500 uppercase font-mono">预估可回现金 (Cash Rec)</div>
                  <div className="text-xl font-bold font-mono text-white">
                     ¥{(globalTotals.netCash / 10000).toFixed(1)}w
                  </div>
               </div>
          </div>
          <div className="bg-terminal-panel border border-terminal-border p-4 rounded-sm flex items-center gap-4">
               <div className="p-3 bg-red-900/30 text-red-400 rounded"><AlertCircle size={24} /></div>
               <div>
                  <div className="text-[10px] text-gray-500 uppercase font-mono">每日资金燃烧 (Daily Burn)</div>
                  <div className="text-xl font-bold font-mono text-white">
                     -¥{globalTotals.burn.toFixed(0)}
                  </div>
               </div>
          </div>
          <div className="bg-terminal-panel border border-terminal-border p-4 rounded-sm flex items-center justify-between cursor-pointer hover:bg-gray-800 transition-colors" onClick={() => setShowParamEditor(true)}>
               <div className="flex items-center gap-4">
                  <div className="p-3 bg-yellow-900/30 text-yellow-400 rounded"><Calculator size={24} /></div>
                  <div>
                      <div className="text-[10px] text-gray-500 uppercase font-mono">参数配置 (Config)</div>
                      <div className="text-xs font-mono text-gray-300 mt-1">点击修改税率/利息</div>
                  </div>
               </div>
               <Settings size={16} className="text-gray-500" />
          </div>
      </div>

      {/* DATA GRID */}
      <div className="flex-1 bg-terminal-panel border border-terminal-border rounded-sm overflow-hidden flex flex-col relative">
         <div className="p-3 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
            <h3 className="text-xs text-gray-400 font-mono uppercase font-bold">库存明细表 (Inventory Details)</h3>
            <div className="text-[10px] text-gray-600 font-mono">3-Table Linked Database Active</div>
         </div>
         
         <div className="flex-1 overflow-auto custom-scrollbar">
            <table className="w-full text-left font-mono text-xs">
               <thead className="bg-black text-gray-500 sticky top-0 z-10">
                  <tr>
                     <th className="p-3 w-8"></th>
                     <th className="p-3">柜号/合同 (Container)</th>
                     <th className="p-3">资方/状态</th>
                     <th className="p-3 text-right">总重 (kg)</th>
                     <th className="p-3 text-right">成本 (¥/kg)</th>
                     <th className="p-3 text-right">卖价 (¥/kg)</th>
                     <th className="p-3 text-right">应付 (Payable)</th>
                     <th className="p-3 text-right">应收 (Receivable)</th>
                     <th className="p-3 text-right">盈利 (Profit)</th>
                     <th className="p-3 text-center">操作</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-800">
                  {groupedData.map(group => {
                      const isExpanded = expandedContainers.has(group.containerId);
                      const avgCost = group.totalEstimatedCost / group.totalWeight;
                      const avgSell = group.totalReceivable / group.totalWeight;
                      
                      // Price Date Lookup for Summary Item
                      const summaryPrice = MOCK_MARKET_PRICES.find(m => m.SKU_Code === group.summaryItem?.SKU_Code);

                      return (
                        <React.Fragment key={group.containerId}>
                           {/* CONTAINER ROW */}
                           <tr className="bg-gray-900/20 hover:bg-gray-800 transition-colors cursor-pointer" onClick={() => toggleExpand(group.containerId)}>
                              <td className="p-3 text-center">
                                 {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                              </td>
                              <td className="p-3">
                                 <div className="font-bold text-white text-sm">{group.containerId}</div>
                                 <div className="text-[10px] text-gray-500">{group.contractId} | {group.country}</div>
                              </td>
                              <td className="p-3">
                                 <div className="text-terminal-accent flex items-center gap-2">
                                     {group.funderId}
                                     {/* Funding Countdown Badge */}
                                     {group.countdown != null && (
                                         <span className={`flex items-center gap-0.5 text-[9px] px-1 rounded border ${group.countdown < 30 ? 'border-red-500 text-red-500' : 'border-gray-600 text-gray-400'}`}>
                                             <Hourglass size={8} /> {group.countdown}d
                                         </span>
                                     )}
                                 </div>
                                 <span 
                                     onMouseEnter={(e) => {
                                         const rect = e.currentTarget.getBoundingClientRect();
                                         setHoveredContainer({ id: group.containerId, x: rect.left, y: rect.top });
                                     }}
                                     onMouseLeave={() => setHoveredContainer(null)}
                                     className={`cursor-help px-1.5 py-0.5 rounded text-[10px] ${group.status.includes('现货') ? 'bg-green-900 text-green-200' : group.status.includes('Pending') ? 'bg-gray-800 text-gray-300' : 'bg-blue-900 text-blue-200'}`}
                                 >
                                    {group.status}
                                 </span>
                              </td>
                              <td className="p-3 text-right text-gray-300">{group.totalWeight.toLocaleString(undefined, {maximumFractionDigits:0})}</td>
                              <td className="p-3 text-right text-gray-400">avg {avgCost.toFixed(2)}</td>
                              
                              {/* MARKET PRICE WITH CUSTOM HOVER TOOLTIP */}
                              <td className="p-3 text-right text-gray-400 group relative">
                                  <span 
                                    className="cursor-help border-b border-dotted border-gray-600 hover:text-white hover:border-terminal-accent transition-colors"
                                    onMouseEnter={(e) => {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        setHoveredPrice({
                                            date: summaryPrice?.Price_Date || 'N/A',
                                            price: avgSell,
                                            name: group.summaryItem?.Product_Name || 'Market Price',
                                            x: rect.left,
                                            y: rect.top
                                        });
                                    }}
                                    onMouseLeave={() => setHoveredPrice(null)}
                                  >
                                     avg {avgSell.toFixed(2)}
                                  </span>
                              </td>

                              <td className="p-3 text-right">
                                 <div className="text-red-300">¥{group.totalPayable.toLocaleString()}</div>
                                 {group.floor && group.floor > 0 && (
                                     <div className="text-[9px] text-gray-500 flex items-center justify-end gap-1">
                                        <span className="bg-gray-800 px-1 rounded">Floor: -{(group.floor/1000).toFixed(0)}k</span>
                                     </div>
                                 )}
                              </td>
                              <td className="p-3 text-right text-blue-300">¥{group.totalReceivable.toLocaleString()}</td>
                              <td className={`p-3 text-right font-bold ${group.totalProfit >= 0 ? 'text-up-green' : 'text-down-red'}`}>
                                 ¥{group.totalProfit.toLocaleString()}
                              </td>
                              <td className="p-3 text-center flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                                 <select 
                                   className="bg-black border border-gray-700 text-[10px] rounded px-1 py-1 text-gray-300 focus:border-terminal-accent w-24"
                                   value={group.paramSetId}
                                   onChange={(e) => updateParamSetForContainer(group.containerId, parseInt(e.target.value))}
                                 >
                                    {paramSets.map(p => (
                                        <option key={p.Parameter_Set_ID} value={p.Parameter_Set_ID}>{p.Parameter_Set_Name.substring(0, 10)}...</option>
                                    ))}
                                 </select>
                                 <button 
                                    onClick={() => handleEditInventory(group.containerId)}
                                    className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors"
                                    title="Edit Goods Parameters"
                                 >
                                     <Edit2 size={12} />
                                 </button>
                              </td>
                           </tr>
                           
                           {/* SKU EXPANSION */}
                           {isExpanded && (
                               <tr className="bg-black/40">
                                   <td colSpan={10} className="p-0">
                                       <table className="w-full text-xs text-gray-400">
                                           <thead className="bg-black/60 text-[10px] uppercase">
                                               <tr>
                                                   <th className="pl-12 py-2 text-left">SKU Code</th>
                                                   <th className="py-2 text-left">品名 (Product)</th>
                                                   <th className="py-2 text-right">Days</th>
                                                   <th className="py-2 text-right">Weight</th>
                                                   <th className="py-2 text-right">Daily Cost</th>
                                                   <th className="py-2 text-right">Cost/kg</th>
                                                   <th className="py-2 text-right">Sell/kg</th>
                                                   <th className="py-2 text-right">Net Cash</th>
                                                   <th className="py-2 text-right pr-4">Profit</th>
                                               </tr>
                                           </thead>
                                           <tbody className="divide-y divide-gray-800/50">
                                               {group.items.map(item => {
                                                   const isWhole = item.SKU_Code === item.Container_ID;
                                                   const isSpotItem = !!item.Spot_Price_RMB_Per_KG;
                                                   // Use user requested "Empty" logic for individual items if data is 0 OR it is a spot item (redundant)
                                                   const isEmptyData = !isWhole && (item.Estimated_Cost_RMB_Per_KG < 10 || item.Estimated_Profit_RMB === 0 || isSpotItem);

                                                   // For Net Cash Display:
                                                   const floor = group.summaryItem?.Payment_Floor || 0;
                                                   const displayNetCash = isWhole ? item.Estimated_Net_Cash_RMB + floor : item.Estimated_Net_Cash_RMB;

                                                   return (
                                                       <tr key={item.Inventory_SKU_ID} className={`${isWhole ? 'bg-terminal-accent/10 hover:bg-terminal-accent/20' : 'hover:bg-gray-800/30'}`}>
                                                           <td className="pl-12 py-2 flex items-center gap-2">
                                                              {isWhole && <Package size={12} className="text-terminal-accent" />}
                                                              <span className={isWhole ? 'text-terminal-accent font-bold' : ''}>{item.SKU_Code}</span>
                                                           </td>
                                                           <td className={`py-2 ${isWhole ? 'text-terminal-accent' : 'text-white'}`}>{isWhole ? '📦 Whole Container (整柜汇总)' : item.Product_Name}</td>
                                                           <td className="py-2 text-right text-gray-400">{item.Storage_Days}</td>
                                                           <td className="py-2 text-right">{item.Weight_KG.toFixed(1)}</td>
                                                           
                                                           <td className="py-2 text-right text-red-400/80">
                                                              {isEmptyData ? '-' : `¥${(item.Daily_Storage_Cost_RMB + item.Daily_Interest_Cost_RMB).toFixed(1)}`}
                                                           </td>
                                                           <td className="py-2 text-right">
                                                              {isEmptyData ? '-' : `¥${item.Estimated_Cost_RMB_Per_KG.toFixed(2)}`}
                                                           </td>
                                                           <td className="py-2 text-right">
                                                              {isEmptyData ? '-' : `¥${MOCK_MARKET_PRICES.find(m=>m.SKU_Code===item.SKU_Code)?.Est_Selling_Price_RMB_Per_KG.toFixed(2) || '-'}`}
                                                           </td>
                                                           <td className={`py-2 text-right font-mono ${displayNetCash >= 0 ? 'text-blue-300' : 'text-orange-400'}`}>
                                                              {isEmptyData ? '-' : `¥${displayNetCash.toLocaleString(undefined, {maximumFractionDigits: 0})}`}
                                                           </td>
                                                           <td className={`py-2 text-right pr-4 font-bold ${item.Estimated_Profit_RMB >= 0 ? 'text-up-green' : 'text-down-red'}`}>
                                                               {isEmptyData ? '-' : item.Estimated_Profit_RMB.toLocaleString()}
                                                           </td>
                                                       </tr>
                                                   );
                                               })}
                                           </tbody>
                                       </table>
                                       <div className="h-2 border-b border-terminal-border"></div>
                                   </td>
                               </tr>
                           )}
                        </React.Fragment>
                      );
                  })}
               </tbody>
            </table>
         </div>

         {/* FIXED LOGISTICS TOOLTIP OVERLAY */}
         {hoveredContainer && logisticsData && (
             <div 
                style={{ top: hoveredContainer.y - 120, left: hoveredContainer.x - 20 }} 
                className="fixed z-[100] w-64 bg-terminal-panel border border-terminal-accent shadow-[0_0_20px_rgba(0,0,0,0.5)] rounded-sm p-3 pointer-events-none animate-in fade-in zoom-in duration-200"
             >
                 <div className="flex items-center gap-2 mb-3 border-b border-gray-700 pb-2">
                     <MapPin size={14} className="text-terminal-accent" />
                     <h3 className="text-xs font-bold font-mono text-white">物流详情 (Logistics)</h3>
                 </div>
                 <div className="space-y-2 text-[11px] font-mono">
                     <div className="flex justify-between">
                         <span className="text-gray-500 flex items-center gap-1"><Calendar size={10} /> 启运日 (Ship)</span>
                         <span className="text-gray-300">{logisticsData.ship}</span>
                     </div>
                     <div className="flex justify-between">
                         <span className="text-gray-500 flex items-center gap-1"><Calendar size={10} /> 到港日 (ETA)</span>
                         <span className="text-gray-300">{logisticsData.eta}</span>
                     </div>
                     <div className="flex justify-between">
                         <span className="text-gray-500 flex items-center gap-1"><Calendar size={10} /> 入库日 (Entry)</span>
                         <span className="text-terminal-accent">{logisticsData.entry}</span>
                     </div>
                     <div className="border-t border-gray-800 my-1 pt-1"></div>
                     <div className="flex justify-between">
                         <span className="text-gray-500 flex items-center gap-1"><Warehouse size={10} /> 冷库 (Storage)</span>
                         <span className="text-white">{logisticsData.storage}</span>
                     </div>
                     <div className="flex justify-between">
                         <span className="text-gray-500 flex items-center gap-1"><Package size={10} /> 厂号 (Factory)</span>
                         <span className="text-white">{logisticsData.factory}</span>
                     </div>
                     <div className="border-t border-gray-800 my-1 pt-1"></div>
                     
                     {/* Conditional Display for Spot vs Future */}
                     {logisticsData.isSpot ? (
                         <>
                             <div className="flex justify-between">
                                 <span className="text-gray-500 flex items-center gap-1"><DollarSign size={10} /> 现货成本 (Spot Cost)</span>
                                 <span className="text-terminal-accent">¥{logisticsData.spotPrice?.toFixed(2)}/kg</span>
                             </div>
                             <div className="flex justify-between text-gray-500 italic">
                                 <span>(Direct Purchase - No FX)</span>
                             </div>
                         </>
                     ) : (
                         <>
                             <div className="flex justify-between">
                                 <span className="text-gray-500 flex items-center gap-1"><DollarSign size={10} /> 期货价 (Price)</span>
                                 <span className="text-terminal-accent">${logisticsData.priceUsd.toLocaleString()} /ton</span>
                             </div>
                             <div className="flex justify-between">
                                 <span className="text-gray-500 flex items-center gap-1"><Calculator size={10} /> 汇率 (FX)</span>
                                 <span className="text-white">{logisticsData.fx.toFixed(4)}</span>
                             </div>
                         </>
                     )}
                     
                     {logisticsData.countdown != null && (
                         <div className="flex justify-between mt-2 pt-1 border-t border-gray-800">
                             <span className="text-gray-500 flex items-center gap-1"><Hourglass size={10} /> 资金限期 (Deadline)</span>
                             <span className={`${logisticsData.countdown < 30 ? 'text-red-500 font-bold' : 'text-white'}`}>{logisticsData.countdown} days left</span>
                         </div>
                     )}
                 </div>
             </div>
         )}

         {/* FIXED PRICE TOOLTIP OVERLAY */}
         {hoveredPrice && (
             <div 
                style={{ top: hoveredPrice.y - 80, left: hoveredPrice.x - 20 }} 
                className="fixed z-[100] w-56 bg-terminal-panel border border-terminal-accent shadow-[0_0_20px_rgba(0,0,0,0.5)] rounded-sm p-3 pointer-events-none animate-in fade-in zoom-in duration-200"
             >
                 <div className="flex items-center gap-2 mb-3 border-b border-gray-700 pb-2">
                     <Tag size={14} className="text-terminal-accent" />
                     <h3 className="text-xs font-bold font-mono text-white">市场价格详情 (Market)</h3>
                 </div>
                 <div className="space-y-2 text-[11px] font-mono">
                     <div className="flex justify-between items-center">
                         <span className="text-gray-500 flex items-center gap-1"><Clock size={10} /> 更新日期 (Date)</span>
                         <span className="text-white font-bold">{hoveredPrice.date}</span>
                     </div>
                     <div className="flex justify-between items-center">
                         <span className="text-gray-500 flex items-center gap-1"><DollarSign size={10} /> 当前卖价 (Price)</span>
                         <span className="text-terminal-accent font-bold">¥{hoveredPrice.price.toFixed(2)}/kg</span>
                     </div>
                     <div className="mt-2 text-[9px] text-gray-500 italic border-t border-gray-800 pt-1">
                        Source: {hoveredPrice.name}
                     </div>
                 </div>
             </div>
         )}
      </div>
      
      <ParameterEditor 
        isOpen={showParamEditor} 
        onClose={() => setShowParamEditor(false)} 
        paramSets={paramSets}
        onUpdate={(updated) => setParamSets(prev => prev.map(p => p.Parameter_Set_ID === updated.Parameter_Set_ID ? updated : p))}
      />

      <InventoryEditor 
        isOpen={showInventoryEditor} 
        onClose={() => setShowInventoryEditor(false)} 
        inventoryItem={editingItem}
        onUpdate={handleUpdateInventoryItem}
      />
    </div>
  );
};
