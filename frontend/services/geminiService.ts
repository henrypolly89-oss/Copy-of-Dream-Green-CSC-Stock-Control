import { GoogleGenAI } from "@google/genai";
import { Product, Sale } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeStockData = async (products: Product[], sales: Sale[]): Promise<string> => {
  // FIX: Removed redundant API key check, as per guidelines.
  const simplifiedProducts = products.map(p => ({
      name: p.name,
      category: p.category,
      currentStock: p.openingStock + p.stockBought - (sales.filter(s => s.productId === p.id).reduce((acc, s) => acc + s.quantity, 0)),
      cost: p.unitPrice,
      price: p.sellingPrice,
      profitPerUnit: p.sellingPrice - p.unitPrice
  }));

  const simplifiedSales = sales.map(s => ({
      product: s.productName,
      quantity: s.quantity,
      date: new Date(s.saleDate).toLocaleDateString(),
      profit: s.profit,
      soldBy: s.soldBy,
  }));
  
  const prompt = `
    You are a business analyst for a small business called 'Dream Green CSC'.
    Analyze the following inventory and sales data. Provide actionable insights in Markdown format.

    **Inventory Data:**
    \`\`\`json
    ${JSON.stringify(simplifiedProducts, null, 2)}
    \`\`\`

    **Sales Data (last 50 sales):**
    \`\`\`json
    ${JSON.stringify(simplifiedSales.slice(-50), null, 2)}
    \`\`\`

    Please provide a concise analysis covering:
    1.  **Top Selling Items:** Identify the most popular products by quantity and revenue.
    2.  **Most Profitable Items:** Which items generate the most profit?
    3.  **Category Performance:** Which product categories are most popular or profitable?
    4.  **Top Performing Sellers:** Identify sellers with the highest sales volume or profit.
    5.  **Inventory Health:** Pinpoint any slow-moving items that might need attention.
    6.  **Actionable Recommendations:** Suggest concrete actions, such as what to re-stock, products to promote, or pricing strategies to consider.

    Keep the analysis clear, direct, and easy for a small business owner to understand.
  `;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error analyzing stock data with Gemini:", error);
    if (error instanceof Error) {
      return `An error occurred while analyzing data: ${error.message}`;
    }
    return "An unknown error occurred while analyzing data.";
  }
};