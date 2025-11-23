import { GoogleGenAI } from "@google/genai";
import { MarketDataPoint, Position, Factor } from "../types";
import { KEY_FACTORS } from "../constants";

export const generateMarketCommentary = async (
  marketData: MarketDataPoint[],
  positions: Position[]
): Promise<string> => {
  if (!process.env.API_KEY) {
    return "AI分析不可用: 缺少API密钥";
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Contextual Data
  const latest = marketData[marketData.length - 1];
  const prev = marketData[marketData.length - 2];
  const priceChange = ((latest.price - prev.price) / prev.price * 100).toFixed(2);
  
  const factorsText = KEY_FACTORS.map(f => `- ${f.name}: ${f.value} (${f.impact})`).join('\n');

  const prompt = `
    角色设定：你是一家顶级大宗商品现货贸易公司(MooketQUANT)的首席策略官。
    
    【严禁事项】
    1. **禁止建议期货对冲/做空**：中国牛肉行业没有期货合约，无法对冲。只能做多（补库）或卖出（去库存）。
    2. **禁止高频交易建议**：牛肉贸易是低频、长周期的现货生意。
    
    核心逻辑：
    - **周期博弈**：利用Monte Carlo模拟预测未来可能的"政策市"。
    - **库存管理**：基于"内外价差"和"保障措施预期"，决定是囤货(Stock In)还是甩货(Destock)。
    - **资金流**：关注资金占用成本(LPR)和流动性风险。
    
    核心知识库 (必须严格引用):
    1. **政策大背景**：进口保障措施(15%关税加征预期)即将于11月26日落地，可能导致进口成本激增。
    2. **美国因素**：美国刚取消对巴西牛肉40%关税(11月21日)，巴西货源将分流至美国，中国到港量减少。
    3. **国产基本面**：国产母牛存栏出清尚未结束，屠宰压价明显。内外价差目前收窄至~17元/kg。
    4. **市场情绪**：海关查验极严，形成"半冻结式"流通。
    
    市场数据 (中国进口主流件套价格指数 CNY/kg):
    - 日期: 2026年10月27日
    - 最新指数: ${latest.price} (日涨跌: ${priceChange}%)
    - 进口成本 (CIF估算): ${latest.importCost.toFixed(2)}
    - 内外价差: 17.36元/kg
    
    关键因子:
    ${factorsText}
    
    持仓:
    ${positions.map(p => `- ${p.cutName}: ${p.quantityTons}吨, 浮动盈亏: ¥${p.unrealizedPL}`).join('\n')}
    
    任务：
    生成一份"MooketQUANT 现货经营策略日报" (中文)。
    
    要求：
    1. **宏观推演 (Scenario Analysis)**：基于Monte Carlo模拟的"Bull Case"（政策落地），预测未来90天价格重心是否上移。
    2. **现货策略**：针对当前持仓，给出具体的库存建议。例如：眼肉是否应该惜售？乌拉圭四分体是否应该止损出货（以回笼资金）？
    3. **国产机会**：分析在"内外价差"收窄背景下，抄底国产公牛的风险收益比。
    4. **风格**：极度专业，使用术语"库销比"、"流转率"、"资金成本"、"随机游走模拟"。
    5. 字数：250字以内。
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "分析暂时不可用。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "系统离线: 无法连接至 MooketQUANT 风控模型服务器。";
  }
};