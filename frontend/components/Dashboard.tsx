import React, { useState, useMemo } from 'react';
import { Product, Sale, Member } from '../types';
import { analyzeStockData } from '../services/geminiService';
import { SparklesIcon } from './icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

interface DashboardProps {
  products: (Product & { currentStock: number })[];
  sales: Sale[];
  members: Member[];
}

const StatCard: React.FC<{ title: string; value: string; }> = ({ title, value }) => (
  <div className="bg-white p-6 rounded-lg shadow-sm">
    <h3 className="text-sm font-medium text-gray-500">{title}</h3>
    <p className="mt-1 text-3xl font-semibold text-gray-900">{value}</p>
  </div>
);

const BAR_COLORS = ['#047857', '#059669', '#10B981', '#34D399', '#6EE7B7'];

type TopSellingCategory = 'Overall' | 'Product' | 'Confectionary' | 'Sundries';
type TimeRange = '24h' | '7d' | '30d' | 'all';
type TimeAnalysisView = 'hour' | 'day' | 'week' | 'year';

const calculateAge = (dobString: string): number => {
    const birthDate = new Date(dobString);
    const today = new Date();
    if (isNaN(birthDate.getTime())) return 0;
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};


const Dashboard: React.FC<DashboardProps> = ({ products, sales, members }) => {
  const [analysis, setAnalysis] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTopSellingCategory, setSelectedTopSellingCategory] = useState<TopSellingCategory>('Overall');
  const [selectedTopProfitableCategory, setSelectedTopProfitableCategory] = useState<TopSellingCategory>('Overall');
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [selectedTimeAnalysis, setSelectedTimeAnalysis] = useState<TimeAnalysisView>('hour');


  const handleAnalyze = async () => {
    setIsLoading(true);
    setAnalysis('');
    const result = await analyzeStockData(products, sales);
    setAnalysis(result);
    setIsLoading(false);
  };

  const { totalRevenue, productSalesRevenue, newMemberRevenue, totalProfit, totalInventoryValue, topSelling, topProfitable, fastestMoving, profitByHour, profitByDay, profitByWeek, profitByYear, totalMembers, distributionBySex, distributionByAgeGroup, topNationalities, newMembersByMonth } = useMemo(() => {
    const now = new Date();
    let startDate: Date = new Date(0);
    let periodHours: number = 24 * 365;

    switch(timeRange) {
        case '24h':
            startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            periodHours = 24;
            break;
        case '7d':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            periodHours = 7 * 24;
            break;
        case '30d':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            periodHours = 30 * 24;
            break;
        case 'all':
        default:
            startDate = new Date(0); // A very early date for 'all'
            periodHours = 24 * 365; // Just an approximation for 'all' for display purposes, usually not used for rate if infinite
            break;
    }
    
    const filteredSales = sales.filter(s => timeRange === 'all' || new Date(s.saleDate).getTime() >= startDate.getTime());
    const filteredMembers = members.filter(m => timeRange === 'all' || new Date(m.joinDate).getTime() >= startDate.getTime());

    const productSalesRevenue = filteredSales.reduce((sum, s) => sum + Number(s.totalRevenue), 0);
    const newMemberRevenue = filteredMembers.reduce((sum, m) => sum + Number(m.membershipFee), 0);
    const totalRevenue = productSalesRevenue + newMemberRevenue;

    const totalProfit = filteredSales.reduce((sum, s) => sum + Number(s.profit), 0);
    const totalInventoryValue = products.reduce((sum, p) => sum + Number(p.currentStock) * Number(p.unitPrice), 0);

    const productCategoryMap = new Map<string, string>();
    products.forEach(p => productCategoryMap.set(p.id, p.category));

    const salesForTopChart = selectedTopSellingCategory === 'Overall'
        ? filteredSales
        : filteredSales.filter(sale => productCategoryMap.get(sale.productId) === selectedTopSellingCategory);

    const salesByProduct = salesForTopChart.reduce((acc, sale) => {
      acc[sale.productName] = (acc[sale.productName] || 0) + Number(sale.quantity);
      return acc;
    }, {} as Record<string, number>);

    const topSelling = Object.entries(salesByProduct)
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => Number(b.quantity) - Number(a.quantity))
      .slice(0, 5);

    // Velocity Calculation
    const velocityData = Object.entries(salesByProduct).map(([name, quantity]) => {
        let avgTimeStr = "";
        const qty = Number(quantity);
        const avgTimeHours = periodHours / qty;
        
        if (qty === 0) {
            avgTimeStr = "-";
        } else if (avgTimeHours < 1) {
             avgTimeStr = `${(avgTimeHours * 60).toFixed(0)} mins`;
        } else if (avgTimeHours < 24) {
             avgTimeStr = `${avgTimeHours.toFixed(1)} hours`;
        } else {
             avgTimeStr = `${(avgTimeHours / 24).toFixed(1)} days`;
        }

        return {
            name,
            quantity: qty,
            avgTimeStr,
            rawSort: avgTimeHours
        };
    }).sort((a, b) => a.rawSort - b.rawSort).slice(0, 5);
    const fastestMoving = velocityData;


    const salesForTopProfitChart = selectedTopProfitableCategory === 'Overall'
        ? filteredSales
        : filteredSales.filter(sale => productCategoryMap.get(sale.productId) === selectedTopProfitableCategory);

    const profitByProduct = salesForTopProfitChart.reduce((acc, sale) => {
      acc[sale.productName] = (acc[sale.productName] || 0) + Number(sale.profit);
      return acc;
    }, {} as Record<string, number>);

    const topProfitable = Object.entries(profitByProduct)
      // FIX: Add explicit types for map parameters to resolve TypeScript inference error.
      .map(([name, profit]: [string, number]) => ({ name, profit: Number(profit.toFixed(2)) }))
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 5);

    const getWeekNumber = (d: Date): number => {
        d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        const t1: number = d.getTime();
        const t2: number = yearStart.getTime();
        const diff: number = t1 - t2;
        const weekNo = Math.ceil(((diff / 86400000) + 1) / 7);
        return weekNo;
    };
    
    // Explicitly typed array for profitByHourData using Array.from to avoid 'any' type inference issues
    const profitByHourData: { hour: string; profit: number }[] = Array.from({ length: 24 }, (_, i) => ({
        hour: `${i.toString().padStart(2, '0')}:00`,
        profit: 0
    }));

    filteredSales.forEach(sale => {
        const hour = new Date(sale.saleDate).getHours();
        if (profitByHourData[hour]) {
            profitByHourData[hour].profit += Number(sale.profit);
        }
    });
    const profitByHour = profitByHourData.map(d => ({...d, profit: Number(d.profit.toFixed(2))}));

    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const profitByDayData = daysOfWeek.map(day => ({ day, profit: 0 }));
    filteredSales.forEach(sale => {
        const dayIndex = new Date(sale.saleDate).getDay();
        if (profitByDayData[dayIndex]) {
            profitByDayData[dayIndex].profit += Number(sale.profit);
        }
    });
    const profitByDay = profitByDayData.map(d => ({...d, profit: Number(d.profit.toFixed(2))}));
    
    const profitByWeekData: Record<number, number> = {};
    filteredSales.forEach(sale => {
        const week = getWeekNumber(new Date(sale.saleDate));
        // Use default value to avoid undefined in arithmetic operations
        const currentProfit = profitByWeekData[week] || 0;
        profitByWeekData[week] = currentProfit + Number(sale.profit);
    });
    const profitByWeek = Object.entries(profitByWeekData)
        .sort(([weekA], [weekB]) => parseInt(weekA) - parseInt(weekB))
        .map(([week, profit]) => ({ week: `Week ${week}`, profit: Number(profit.toFixed(2)) }));

    const profitByYearData: Record<string, number> = {};
    filteredSales.forEach(sale => {
        const date = new Date(sale.saleDate);
        if (isNaN(date.getTime())) return;
        const year = date.getFullYear().toString();
        // Use default value to avoid undefined in arithmetic operations
        const currentProfit = profitByYearData[year] || 0;
        profitByYearData[year] = currentProfit + Number(sale.profit);
    });
    const profitByYear = Object.entries(profitByYearData)
        .sort(([yearA], [yearB]) => parseInt(yearA) - parseInt(yearB))
        .map(([year, profit]) => ({ year, profit: Number(profit.toFixed(2)) }));
        
    // --- Member Demographics ---
    const totalMembers = members.length;
    
    const sexCounts = members.reduce((acc, member) => {
        const currentCount = acc[member.sex] || 0;
        acc[member.sex] = currentCount + 1;
        return acc;
    }, {} as Record<string, number>);
    const distributionBySex = Object.entries(sexCounts).map(([name, value]) => ({ name, value }));

    const ageGroups: Record<string, number> = {
        'Under 18': 0, '18-25': 0, '26-35': 0, '36-45': 0, '46-55': 0, '56+': 0,
    };
    members.forEach(member => {
        const age = calculateAge(member.dateOfBirth);
        if (age < 18) ageGroups['Under 18']++;
        else if (age <= 25) ageGroups['18-25']++;
        else if (age <= 35) ageGroups['26-35']++;
        else if (age <= 45) ageGroups['36-45']++;
        else if (age <= 55) ageGroups['46-55']++;
        else ageGroups['56+']++;
    });
    const distributionByAgeGroup = Object.entries(ageGroups).map(([name, count]) => ({ name, count }));

    const nationalityCounts = members.reduce((acc, member) => {
        acc[member.nationality] = (acc[member.nationality] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    const topNationalities = Object.entries(nationalityCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    const memberSignupsByMonth = members.reduce((acc, member) => {
        if (!member.joinDate) return acc;
        const joinDate = new Date(member.joinDate);
        const monthKey = `${joinDate.getFullYear()}-${(joinDate.getMonth() + 1).toString().padStart(2, '0')}`;
        const monthLabel = joinDate.toLocaleString('default', { month: 'short', year: 'numeric' });
        
        if (!acc[monthKey]) {
            acc[monthKey] = { month: monthLabel, count: 0 };
        }
        acc[monthKey].count++;
        return acc;
    }, {} as Record<string, { month: string; count: number }>);

    // FIX: Use Object.entries and sort by key (YYYY-MM) which is lexicographically correct for dates,
    // avoiding Date object arithmetic issues in TypeScript.
    const newMembersByMonth = Object.entries(memberSignupsByMonth)
        .sort(([keyA], [keyB]) => new Date(keyA).getTime() - new Date(keyB).getTime())
        .map(([, value]) => value);


    return { totalRevenue, productSalesRevenue, newMemberRevenue, totalProfit, totalInventoryValue, topSelling, topProfitable, fastestMoving, profitByHour, profitByDay, profitByWeek, profitByYear, totalMembers, distributionBySex, distributionByAgeGroup, topNationalities, newMembersByMonth };
  }, [products, sales, members, selectedTopSellingCategory, selectedTopProfitableCategory, timeRange]);

  const topSellingCategories: TopSellingCategory[] = ['Overall', 'Product', 'Confectionary', 'Sundries'];
  const timeRanges: {key: TimeRange, label: string}[] = [
    { key: '24h', label: 'Last 24h' },
    { key: '7d', label: 'Last 7 Days' },
    { key: '30d', label: 'Last 30 Days' },
    { key: 'all', label: 'All Time' },
  ];
  const timeAnalysisViews: {key: TimeAnalysisView, label: string}[] = [
      { key: 'hour', label: 'Time of Day' },
      { key: 'day', label: 'Day of Week' },
      { key: 'week', label: 'Week of Year' },
      { key: 'year', label: 'Year' },
  ];
  
  const getTimeAnalysisChartData = () => {
      switch (selectedTimeAnalysis) {
          case 'hour':
              return { data: profitByHour, dataKeyX: 'hour' };
          case 'day':
              return { data: profitByDay, dataKeyX: 'day' };
          case 'week':
              return { data: profitByWeek, dataKeyX: 'week' };
          case 'year':
              return { data: profitByYear, dataKeyX: 'year' };
          default:
              return { data: [], dataKeyX: '' };
      }
  };
  const timeAnalysisChart = getTimeAnalysisChartData();


  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
       <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Dashboard Overview</h2>
        <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-lg">
          {timeRanges.map(range => (
            <button
              key={range.key}
              onClick={() => setTimeRange(range.key)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                timeRange === range.key
                  ? 'bg-white text-dynamic-primary shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard title="Total Revenue" value={`€${totalRevenue.toFixed(2)}`} />
        <StatCard title="Product Sales Revenue" value={`€${productSalesRevenue.toFixed(2)}`} />
        <StatCard title="New Member Revenue" value={`€${newMemberRevenue.toFixed(2)}`} />
        <StatCard title="Total Profit" value={`€${totalProfit.toFixed(2)}`} />
        <StatCard title="Inventory Value" value={`€${totalInventoryValue.toFixed(2)}`} />
        <StatCard title="Total Members" value={`${totalMembers}`} />
      </div>

      <hr/>
      <h3 className="text-xl font-bold text-gray-800 !mt-8">Sales Analysis</h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Top Selling Products (by Quantity)</h3>
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                {topSellingCategories.map(category => (
                    <button
                        key={category}
                        onClick={() => setSelectedTopSellingCategory(category)}
                        className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                            selectedTopSellingCategory === category
                                ? 'border-primary-500 text-dynamic-primary'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        {category}
                    </button>
                ))}
            </nav>
          </div>
          <div className="mt-4">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={topSelling} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="quantity">
                    {topSelling.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Top Profitable Products</h3>
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                {topSellingCategories.map(category => (
                    <button
                        key={category}
                        onClick={() => setSelectedTopProfitableCategory(category)}
                        className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                            selectedTopProfitableCategory === category
                                ? 'border-primary-500 text-dynamic-primary'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        {category}
                    </button>
                ))}
            </nav>
          </div>
          <div className="mt-4">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={topProfitable} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis unit="€" />
                  <Tooltip formatter={(value: number) => `€${value.toFixed(2)}`} />
                  <Legend />
                  <Bar dataKey="profit" name="Profit" unit="€">
                    {topProfitable.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* New Row for Sales Velocity and Profit by Time */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Sales Velocity: Avg Time to Sell 1 Unit</h3>
            <p className="text-xs text-gray-500 mb-4">Based on the currently selected time range ({timeRanges.find(tr => tr.key === timeRange)?.label}). Lower time is better.</p>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th scope="col" className="px-4 py-3">Product</th>
                            <th scope="col" className="px-4 py-3 text-center">Sold Qty</th>
                            <th scope="col" className="px-4 py-3 text-right">Avg Time / Unit</th>
                        </tr>
                    </thead>
                    <tbody>
                        {fastestMoving.map((item, index) => (
                            <tr key={index} className="bg-white border-b hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                                <td className="px-4 py-3 text-center">{item.quantity}</td>
                                <td className="px-4 py-3 text-right font-semibold text-dynamic-primary">{item.avgTimeStr}</td>
                            </tr>
                        ))}
                        {fastestMoving.length === 0 && (
                            <tr>
                                <td colSpan={3} className="px-4 py-3 text-center">No sales in this period.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Sales Performance by Time (Profit)</h3>
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                {timeAnalysisViews.map(view => (
                    <button
                        key={view.key}
                        onClick={() => setSelectedTimeAnalysis(view.key)}
                        className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                            selectedTimeAnalysis === view.key
                                ? 'border-primary-500 text-dynamic-primary'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        {view.label}
                    </button>
                ))}
            </nav>
          </div>
          <div className="mt-4">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={timeAnalysisChart.data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey={timeAnalysisChart.dataKeyX} />
                  <YAxis unit="€" />
                  <Tooltip formatter={(value: number) => `€${value.toFixed(2)}`} />
                  <Legend />
                  <Bar dataKey="profit" name="Profit" unit="€" fill="#059669" />
                </BarChart>
              </ResponsiveContainer>
          </div>
        </div>
      </div>

      <hr/>
      <h3 className="text-xl font-bold text-gray-800 !mt-8">Member Demographics</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Distribution by Sex</h3>
            <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                    <Pie data={distributionBySex} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                         {distributionBySex.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Members by Age Group</h3>
            <ResponsiveContainer width="100%" height={280}>
                <BarChart data={distributionByAgeGroup} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" name="Members">
                        {distributionByAgeGroup.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Top 5 Nationalities</h3>
            <ResponsiveContainer width="100%" height={280}>
                <BarChart data={topNationalities} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis type="category" dataKey="name" width={80} />
                    <Tooltip />
                    <Bar dataKey="count" name="Members" fill="#059669" />
                </BarChart>
            </ResponsiveContainer>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">New Member Signups by Month</h3>
            <ResponsiveContainer width="100%" height={280}>
                <BarChart data={newMembersByMonth} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" name="New Members" fill="#059669" />
                </BarChart>
            </ResponsiveContainer>
        </div>


      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">AI-Powered Business Insights</h3>
            <p className="text-sm text-gray-500 mt-1">Get an analysis of your current stock and sales data.</p>
          </div>
          <button
            onClick={handleAnalyze}
            disabled={isLoading}
            className="mt-4 sm:mt-0 flex items-center justify-center px-4 py-2 dynamic-btn text-white font-semibold rounded-lg shadow-md disabled:cursor-not-allowed transition-colors"
          >
            <SparklesIcon className="w-5 h-5 mr-2" />
            {isLoading ? 'Analyzing...' : 'Generate Insights'}
          </button>
        </div>
        {isLoading && <div className="mt-4 text-center">Loading analysis...</div>}
        {analysis && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <pre className="whitespace-pre-wrap font-sans text-gray-700">{analysis}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;