import React, { useState, useMemo } from 'react';
import { Sale } from '../types';
import { DeleteIcon } from './icons';

interface SalesLogProps {
  sales: Sale[];
  deleteSale: (saleId: string) => void;
}

const SalesLog: React.FC<SalesLogProps> = ({ sales, deleteSale }) => {
  const [filters, setFilters] = useState({
    productName: '',
    soldBy: '',
  });

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const sortedSales = useMemo(() => 
    [...sales].sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime()),
    [sales]
  );
  
  const filteredSales = useMemo(() => {
    return sortedSales.filter(sale => {
      const productNameMatch = sale.productName.toLowerCase().includes(filters.productName.toLowerCase());
      const soldByMatch = sale.soldBy.toLowerCase().includes(filters.soldBy.toLowerCase());
      return productNameMatch && soldByMatch;
    });
  }, [sortedSales, filters]);

  const handleDelete = (saleId: string, productName: string) => {
    if (window.confirm(`Are you sure you want to delete the sale for "${productName}"? This action cannot be undone.`)) {
      deleteSale(saleId);
    }
  };


  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Sales Log</h2>

      <div className="bg-white shadow-sm rounded-lg overflow-x-auto">
        <table className="w-full whitespace-nowrap">
          <thead className="bg-gray-50">
            <tr>
              {['Date', 'Product', 'Sold By', 'Qty', 'Revenue', 'Cost', 'Cost Code', 'Profit', 'Offer Applied', 'Actions'].map(header => (
                <th key={header} className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${header === 'Actions' ? 'text-center' : 'text-left'}`}>{header}</th>
              ))}
            </tr>
            <tr className="bg-gray-100">
              <th className="px-6 py-2"></th>
              <th className="px-6 py-2">
                <input
                  type="text"
                  name="productName"
                  placeholder="Filter by product..."
                  value={filters.productName}
                  onChange={handleFilterChange}
                  className="w-full p-1 border border-gray-300 rounded-md text-sm font-normal"
                />
              </th>
              <th className="px-6 py-2">
                <input
                  type="text"
                  name="soldBy"
                  placeholder="Filter by seller..."
                  value={filters.soldBy}
                  onChange={handleFilterChange}
                  className="w-full p-1 border border-gray-300 rounded-md text-sm font-normal"
                />
              </th>
              <th className="px-6 py-2" colSpan={7}></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredSales.map(sale => (
              <tr key={sale.id}>
                <td className="px-6 py-4 text-sm text-gray-500">{new Date(sale.saleDate).toLocaleString()}</td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{sale.productName}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{sale.soldBy}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{sale.quantity}</td>
                <td className="px-6 py-4 text-sm text-gray-500">€{sale.totalRevenue.toFixed(2)}</td>
                <td className="px-6 py-4 text-sm text-gray-500">€{sale.totalCost.toFixed(2)}</td>
                <td className="px-6 py-4 text-sm text-gray-500 font-mono">{sale.costCode || 'Default'}</td>
                <td className="px-6 py-4 text-sm text-green-600 font-semibold">€{sale.profit.toFixed(2)}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{sale.appliedOfferName || 'None'}</td>
                <td className="px-6 py-4 text-sm text-center">
                  <button
                    onClick={() => handleDelete(sale.id, sale.productName)}
                    className="text-red-600 hover:text-red-800"
                    title="Delete Sale"
                  >
                    <DeleteIcon className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
             {filteredSales.length === 0 && (
                <tr>
                    <td colSpan={10} className="text-center py-10 text-gray-500">No sales found.</td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SalesLog;


