
import React, { useState, useMemo } from 'react';
import { Product, CostCode, SpecialOffer, Sale } from '../types';
import Modal from './Modal';
import { PlusIcon, WarningIcon } from './icons';

interface InventoryProps {
  products: (Product & { currentStock: number })[];
  sales: Sale[];
  categories: string[];
  sellers: string[];
  costCodes: CostCode[];
  specialOffers: SpecialOffer[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (updatedProduct: Product) => void;
  recordSale: (productId: string, quantity: number, saleDate: Date, soldBy: string, costCode?: string, appliedOfferId?: string) => void;
  lowStockThreshold: number;
  lowProfitMarginThreshold: number;
}

const Inventory: React.FC<InventoryProps> = ({ products, sales, categories, sellers, costCodes, specialOffers, addProduct, updateProduct, recordSale, lowStockThreshold, lowProfitMarginThreshold }) => {
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  
  const [selectedProduct, setSelectedProduct] = useState<(Product & { currentStock: number }) | null>(null);
  
  const [productForm, setProductForm] = useState<Omit<Product, 'id'>>({
    name: '',
    category: '',
    openingStock: 0,
    stockBought: 0,
    unitPrice: 0,
    sellingPrice: 0,
  });
  const [saleForm, setSaleForm] = useState({ 
    quantity: 1, 
    soldBy: '', 
    costCode: '',
    appliedOfferId: '',
    saleDate: new Date().toISOString().split('T')[0],
    saleTime: new Date().toTimeString().split(' ')[0].substring(0, 5) // HH:MM
  });
  
  const [filters, setFilters] = useState({
    name: '',
    category: 'All Categories',
    stock: ''
  });

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({...prev, [name]: value}));
  };

  const uniqueCategories = useMemo(() => {
    return ['All Categories', ...categories];
  }, [categories]);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const nameMatch = product.name.toLowerCase().includes(filters.name.toLowerCase());
      const categoryMatch = filters.category === 'All Categories' || product.category === filters.category;
      const stockMatch = filters.stock === '' || product.currentStock >= parseInt(filters.stock, 10);
      return nameMatch && categoryMatch && stockMatch;
    });
  }, [products, filters]);

  // Calculate Sales Velocity (Last 30 Days)
  const productVelocityMap = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const recentSales = sales.filter(s => new Date(s.saleDate) >= thirtyDaysAgo);
    
    const salesCountByProduct: Record<string, number> = {};
    recentSales.forEach(s => {
        salesCountByProduct[s.productId] = (salesCountByProduct[s.productId] || 0) + s.quantity;
    });

    const velocityMap: Record<string, string> = {};
    const totalHoursIn30Days = 30 * 24;

    products.forEach(p => {
        const qtySold = salesCountByProduct[p.id] || 0;
        if (qtySold === 0) {
            velocityMap[p.id] = "-";
        } else {
            const hoursPerUnit = totalHoursIn30Days / qtySold;
            if (hoursPerUnit < 24) {
                velocityMap[p.id] = `${hoursPerUnit.toFixed(1)} hrs`;
            } else {
                velocityMap[p.id] = `${(hoursPerUnit / 24).toFixed(1)} days`;
            }
        }
    });

    return velocityMap;
  }, [sales, products]);
  
  const openAddModal = () => {
    setSelectedProduct(null);
    setProductForm({
      name: '',
      category: '',
      openingStock: 0,
      stockBought: 0,
      unitPrice: 0,
      sellingPrice: 0,
    });
    setIsProductModalOpen(true);
  };

  const openEditModal = (product: Product & { currentStock: number }) => {
    setSelectedProduct(product);
    setProductForm(product);
    setIsProductModalOpen(true);
  };

  const openSaleModal = (product: Product & { currentStock: number }) => {
    setSelectedProduct(product);
    setSaleForm({ 
      quantity: 1, 
      soldBy: sellers[0] || '',
      costCode: '',
      appliedOfferId: '',
      saleDate: new Date().toISOString().split('T')[0],
      saleTime: new Date().toTimeString().split(' ')[0].substring(0, 5)
    });
    setIsSaleModalOpen(true);
  };
  
  const handleCloseModals = () => {
    setIsProductModalOpen(false);
    setIsSaleModalOpen(false);
    setSelectedProduct(null);
  };

  const handleProductFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProductForm(prev => {
        switch (name) {
            case 'name':
                return { ...prev, name: value };
            case 'category':
                return { ...prev, category: value };
            case 'openingStock':
                return { ...prev, openingStock: parseFloat(value) || 0 };
            case 'stockBought':
                return { ...prev, stockBought: parseFloat(value) || 0 };
            case 'unitPrice':
                return { ...prev, unitPrice: parseFloat(value) || 0 };
            case 'sellingPrice':
                return { ...prev, sellingPrice: parseFloat(value) || 0 };
            default:
                return prev;
        }
    });
  };
  
  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.category) {
      alert("Please select a category.");
      return;
    }
    if (selectedProduct) {
      updateProduct({ ...productForm, id: selectedProduct.id });
    } else {
      addProduct(productForm);
    }
    handleCloseModals();
  };

  const handleSaleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSaleForm(prev => {
        switch (name) {
            case 'quantity':
                return { ...prev, quantity: parseInt(value, 10) || 1 };
            case 'soldBy':
                return { ...prev, soldBy: value };
            case 'costCode':
                return { ...prev, costCode: value };
            case 'appliedOfferId':
                return { ...prev, appliedOfferId: value };
            case 'saleDate':
                return { ...prev, saleDate: value };
            case 'saleTime':
                return { ...prev, saleTime: value };
            default:
                return prev;
        }
    });
  };

  const handleSaleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saleForm.soldBy) {
        alert("Please select a seller.");
        return;
    }
    if (selectedProduct) {
      const dateTimeString = `${saleForm.saleDate}T${saleForm.saleTime}`;
      const saleDateTime = new Date(dateTimeString);
      recordSale(selectedProduct.id, saleForm.quantity, saleDateTime, saleForm.soldBy, saleForm.costCode, saleForm.appliedOfferId);
    }
    handleCloseModals();
  };

  const isOfferActive = (offer: SpecialOffer): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (offer.startDate) {
        const [y, m, d] = offer.startDate.split('-').map(Number);
        const startDate = new Date(y, m - 1, d);
        if (startDate > today) return false;
    }

    if (offer.endDate) {
        const [y, m, d] = offer.endDate.split('-').map(Number);
        const endDate = new Date(y, m - 1, d);
        endDate.setHours(23, 59, 59, 999);
        if (endDate < new Date()) return false;
    }

    return true;
  };

  const availableOffersForSelectedProduct = useMemo(() => {
    if (!selectedProduct) return [];
    return specialOffers.filter(so => so.productId === selectedProduct.id && isOfferActive(so));
  }, [selectedProduct, specialOffers]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Inventory Management</h2>
        <div className="flex items-center space-x-4">
            <button onClick={openAddModal} className="flex items-center px-4 py-2 dynamic-btn text-white font-semibold rounded-lg shadow-md transition-colors">
              <PlusIcon className="w-5 h-5 mr-2" />
              Add Product
            </button>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-x-auto">
        <table className="w-full whitespace-nowrap">
          <thead className="bg-gray-50">
            <tr>
              {['Product', 'Category', 'Unit Price', 'Selling Price', 'Margin %', 'Current Stock', 'Avg Sale Speed (30d)', 'Edit', 'Sale'].map(header => (
                <th key={header} className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${header === 'Edit' || header === 'Sale' ? 'text-center' : 'text-left'}`}>{header}</th>
              ))}
            </tr>
            <tr className="bg-gray-100">
              <th className="px-6 py-2">
                <input
                  type="text"
                  name="name"
                  placeholder="Filter by name..."
                  value={filters.name}
                  onChange={handleFilterChange}
                  className="w-full p-1 border border-gray-300 rounded-md text-sm"
                />
              </th>
              <th className="px-6 py-2">
                <select
                  name="category"
                  value={filters.category}
                  onChange={handleFilterChange}
                  className="w-full p-1 border border-gray-300 rounded-md text-sm"
                >
                  {uniqueCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </th>
              <th className="px-6 py-2"></th>
              <th className="px-6 py-2"></th>
              <th className="px-6 py-2"></th>
              <th className="px-6 py-2">
                 <input
                  type="number"
                  name="stock"
                  placeholder="Min stock..."
                  value={filters.stock}
                  onChange={handleFilterChange}
                  className="w-full p-1 border border-gray-300 rounded-md text-sm"
                />
              </th>
              <th className="px-6 py-2"></th>
              <th className="px-6 py-2"></th>
              <th className="px-6 py-2"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredProducts.map(product => {
              const threshold = product.lowStockThreshold ?? lowStockThreshold;
              const isLowStock = product.currentStock <= threshold;
              const margin = product.sellingPrice > 0 ? ((product.sellingPrice - product.unitPrice) / product.sellingPrice) * 100 : 0;
              const isLowMargin = margin < lowProfitMarginThreshold;
              
              return (
              <tr key={product.id}>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="text-sm font-medium text-gray-900">{product.name}</div>
                    {isLowStock && <WarningIcon className="w-5 h-5 ml-2 text-yellow-500" title="Low stock" />}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{product.category}</td>
                <td className="px-6 py-4 text-sm text-gray-500">€{product.unitPrice.toFixed(2)}</td>
                <td className="px-6 py-4 text-sm text-gray-500">€{product.sellingPrice.toFixed(2)}</td>
                <td className={`px-6 py-4 text-sm font-medium ${isLowMargin ? 'text-red-600' : 'text-gray-900'}`}>
                    <div className="flex items-center">
                        <span>{margin.toFixed(1)}%</span>
                        {isLowMargin && <WarningIcon className="w-4 h-4 ml-2 text-red-500" title="Low margin" />}
                    </div>
                </td>
                <td className={`px-6 py-4 text-sm font-semibold ${isLowStock ? 'text-red-600' : 'text-gray-900'}`}>{product.currentStock}</td>
                <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                    {productVelocityMap[product.id]} / unit
                </td>
                <td className="px-6 py-4 text-sm font-medium text-center">
                  <button onClick={() => openEditModal(product)} className="text-blue-600 hover:text-blue-900">Edit</button>
                </td>
                <td className="px-6 py-4 text-sm font-medium text-center">
                  <button onClick={() => openSaleModal(product)} className="text-green-600 hover:text-green-900">Sale</button>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Product Modal */}
      <Modal isOpen={isProductModalOpen} onClose={handleCloseModals} title={selectedProduct ? 'Edit Product' : 'Add New Product'}>
        <form onSubmit={handleProductSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Product Name</label>
              <input type="text" name="name" id="name" value={productForm.name} onChange={handleProductFormChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
              <select name="category" id="category" value={productForm.category} onChange={handleProductFormChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm">
                <option value="" disabled>Select a category</option>
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="openingStock" className="block text-sm font-medium text-gray-700">Opening Stock</label>
                <input type="number" name="openingStock" id="openingStock" value={productForm.openingStock} onChange={handleProductFormChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
              </div>
              <div>
                <label htmlFor="stockBought" className="block text-sm font-medium text-gray-700">Stock Bought</label>
                <input type="number" name="stockBought" id="stockBought" value={productForm.stockBought} onChange={handleProductFormChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="unitPrice" className="block text-sm font-medium text-gray-700">Unit Price (€)</label>
                <input type="number" step="0.01" name="unitPrice" id="unitPrice" value={productForm.unitPrice} onChange={handleProductFormChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
              </div>
              <div>
                <label htmlFor="sellingPrice" className="block text-sm font-medium text-gray-700">Selling Price (€)</label>
                <input type="number" step="0.01" name="sellingPrice" id="sellingPrice" value={productForm.sellingPrice} onChange={handleProductFormChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button type="button" onClick={handleCloseModals} className="mr-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white dynamic-btn rounded-md shadow-sm">{selectedProduct ? 'Update Product' : 'Add Product'}</button>
          </div>
        </form>
      </Modal>

      {/* Record Sale Modal */}
      {selectedProduct && (
        <Modal isOpen={isSaleModalOpen} onClose={handleCloseModals} title={`Record Sale for ${selectedProduct.name}`}>
          <form onSubmit={handleSaleSubmit}>
            <p className="text-sm text-gray-600 mb-4">Current stock: {selectedProduct.currentStock}</p>
            <div className="space-y-4">
               <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="saleDate" className="block text-sm font-medium text-gray-700">Date of Sale</label>
                  <input type="date" name="saleDate" id="saleDate" value={saleForm.saleDate} onChange={handleSaleFormChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
                </div>
                <div>
                  <label htmlFor="saleTime" className="block text-sm font-medium text-gray-700">Time of Sale</label>
                  <input type="time" name="saleTime" id="saleTime" value={saleForm.saleTime} onChange={handleSaleFormChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
                </div>
               </div>
               <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">Quantity</label>
                <input type="number" name="quantity" id="quantity" value={saleForm.quantity} min="1" max={selectedProduct.currentStock} onChange={handleSaleFormChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
              </div>
              <div>
                <label htmlFor="appliedOfferId" className="block text-sm font-medium text-gray-700">Apply Offer</label>
                <select name="appliedOfferId" id="appliedOfferId" value={saleForm.appliedOfferId} onChange={handleSaleFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" disabled={availableOffersForSelectedProduct.length === 0}>
                    <option value="">No Offer</option>
                    {availableOffersForSelectedProduct.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
               <div>
                <label htmlFor="costCode" className="block text-sm font-medium text-gray-700">Cost Type</label>
                <select name="costCode" id="costCode" value={saleForm.costCode} onChange={handleSaleFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm">
                    <option value="">Default Cost (€{selectedProduct.unitPrice.toFixed(2)})</option>
                    {costCodes.map(c => <option key={c.code} value={c.code}>{c.code} (€{c.value.toFixed(2)})</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="soldBy" className="block text-sm font-medium text-gray-700">Sold By</label>
                <select name="soldBy" id="soldBy" value={saleForm.soldBy} onChange={handleSaleFormChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm">
                    <option value="" disabled>Select a seller</option>
                    {sellers.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button type="button" onClick={handleCloseModals} className="mr-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm font-medium text-white dynamic-btn rounded-md shadow-sm">Record Sale</button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
};

export default Inventory;
