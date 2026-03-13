
import React, { useState, useMemo, useEffect } from 'react';
import Modal from './Modal';
import { PlusIcon, EditIcon, DeleteIcon, WarningIcon } from './icons';
import { Product, Sale, CostCode, SpecialOffer } from '../types';

interface SettingsProps {
  products: (Product & { currentStock: number })[];
  sales: Sale[];
  categories: string[];
  sellers: string[];
  costCodes: CostCode[];
  specialOffers: SpecialOffer[];
  updateCostCodes: (codes: CostCode[]) => void;
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (updatedProduct: Product) => void;
  deleteProduct: (productId: string) => void;
  bulkUpdateStock: (updates: { productId: string; stockToAdd: number; newUnitPrice?: number }[]) => void;
  addCategory: (name: string) => void;
  updateCategory: (oldName: string, newName: string) => void;
  deleteCategory: (name: string) => void;
  addSeller: (name: string) => void;
  updateSeller: (oldName: string, newName: string) => void;
  deleteSeller: (name: string) => void;
  addSpecialOffer: (offer: Omit<SpecialOffer, 'id'>) => void;
  updateSpecialOffer: (offer: SpecialOffer) => void;
  deleteSpecialOffer: (offerId: string) => void;
  lowStockThreshold: number;
  setLowStockThreshold: (value: number) => void;
  lowProfitMarginThreshold: number;
  setLowProfitMarginThreshold: (value: number) => void;
  defaultMembershipFee: number;
  setDefaultMembershipFee: (value: number) => void;
  logo?: string;
  updateLogo: (logo: string | undefined) => void;
  backgroundImage?: string;
  updateBackgroundImage: (image: string | undefined) => void;
  appName: string;
  updateAppName: (name: string) => void;
}

type ModalMode = 'add' | 'edit';
type DataType = 'category' | 'seller';

interface BulkUpdateInput {
    stockToAdd: string;
    newUnitPrice: string;
}

const ManagementList: React.FC<{
    title: string;
    items: string[];
    onAdd: () => void;
    onEdit: (item: string) => void;
    onDelete: (item: string) => void;
}> = ({ title, items, onAdd, onEdit, onDelete }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
            <button
                onClick={onAdd}
                className="flex items-center px-3 py-1.5 dynamic-btn text-sm font-semibold rounded-lg shadow-sm transition-colors"
            >
                <PlusIcon className="w-4 h-4 mr-2" />
                Add New
            </button>
        </div>
        <ul className="divide-y divide-gray-200">
            {items.map(item => (
                <li key={item} className="py-3 flex justify-between items-center">
                    <span className="text-gray-700">{item}</span>
                    <div className="space-x-3">
                        <button onClick={() => onEdit(item)} className="text-blue-600 hover:text-blue-800">
                            <EditIcon className="w-5 h-5" />
                        </button>
                        <button onClick={() => onDelete(item)} className="text-red-600 hover:text-red-800">
                            <DeleteIcon className="w-5 h-5" />
                        </button>
                    </div>
                </li>
            ))}
             {items.length === 0 && <li className="py-3 text-center text-gray-500">No items yet.</li>}
        </ul>
    </div>
);

const ProductList: React.FC<{
    title: string;
    products: (Product & { currentStock: number })[];
    onAdd: () => void;
    onEdit: (product: Product) => void;
    onDelete: (product: Product) => void;
    selectedProductIds: Set<string>;
    onSelectProduct: (productId: string) => void;
    lowStockThreshold: number;
}> = ({ title, products, onAdd, onEdit, onDelete, selectedProductIds, onSelectProduct, lowStockThreshold }) => (
    <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
            <button
                onClick={onAdd}
                className="flex items-center px-3 py-1.5 dynamic-btn text-sm font-semibold rounded-lg shadow-sm transition-colors"
            >
                <PlusIcon className="w-4 h-4 mr-2" />
                Add New
            </button>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 w-12"></th>
                        {['Name', 'Unit Price', 'Selling Price', 'Stock', 'Actions'].map(header => (
                            <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{header}</th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {products.map(product => {
                        const threshold = product.lowStockThreshold ?? lowStockThreshold;
                        const isLowStock = product.currentStock <= threshold;
                        return (
                        <tr key={product.id} className={selectedProductIds.has(product.id) ? 'bg-dynamic-primary-light' : ''}>
                             <td className="px-6 py-4">
                                <input 
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300 text-dynamic-primary focus:ring-opacity-50"
                                checked={selectedProductIds.has(product.id)}
                                onChange={() => onSelectProduct(product.id)}
                                />
                            </td>
                            <td className="px-6 py-4 font-medium text-gray-900">{product.name}</td>
                            <td className="px-6 py-4 text-gray-500">€{product.unitPrice.toFixed(2)}</td>
                            <td className="px-6 py-4 text-gray-500">€{product.sellingPrice.toFixed(2)}</td>
                            <td className={`px-6 py-4 font-semibold ${isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
                                <div className="flex items-center">
                                    <span>{product.currentStock}</span>
                                    {isLowStock && (
                                        <WarningIcon className="w-5 h-5 ml-2 text-yellow-500" title="Low stock" />
                                    )}
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="space-x-3">
                                    <button onClick={() => onEdit(product)} className="text-blue-600 hover:text-blue-800">
                                        <EditIcon className="w-5 h-5" />
                                    </button>
                                    <button onClick={() => onDelete(product)} className="text-red-600 hover:text-red-800">
                                        <DeleteIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    )})}
                    {products.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-4 text-center text-gray-500">No products in this category yet.</td>
                      </tr>
                    )}
                </tbody>
            </table>
        </div>
    </div>
);


const Settings: React.FC<SettingsProps> = (props) => {
    const { products, categories, sellers, costCodes, specialOffers, updateCostCodes, addCategory, updateCategory, deleteCategory, addSeller, updateSeller, deleteSeller, addProduct, updateProduct, deleteProduct, bulkUpdateStock, addSpecialOffer, updateSpecialOffer, deleteSpecialOffer, lowStockThreshold, setLowStockThreshold, lowProfitMarginThreshold, setLowProfitMarginThreshold, defaultMembershipFee, setDefaultMembershipFee, logo, updateLogo, backgroundImage, updateBackgroundImage, appName, updateAppName } = props;
    
    // State for Category/Seller Modal
    const [isMgmtModalOpen, setIsMgmtModalOpen] = useState(false);
    const [mgmtModalMode, setMgmtModalMode] = useState<ModalMode>('add');
    const [dataType, setDataType] = useState<DataType>('category');
    const [currentItem, setCurrentItem] = useState('');
    const [formValue, setFormValue] = useState('');
    
    // State for Product Modal
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [productForm, setProductForm] = useState<Omit<Product, 'id'>>({
        name: '', category: '', openingStock: 0, stockBought: 0, unitPrice: 0, sellingPrice: 0, lowStockThreshold: undefined,
    });
    
    // State for Bulk Update Modal
    const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
    const [isBulkUpdateModalOpen, setIsBulkUpdateModalOpen] = useState(false);
    const [bulkUpdates, setBulkUpdates] = useState<Record<string, BulkUpdateInput>>({});

    // State for Special Offer Modal
    const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
    const [offerFormState, setOfferFormState] = useState<Omit<SpecialOffer, 'id'> & { startDate: string, endDate: string }>({
        productId: '', name: '', type: 'BOGO', buyQuantity: 0, getQuantity: 0, startDate: '', endDate: ''
    });
    const [selectedOffer, setSelectedOffer] = useState<SpecialOffer | null>(null);

    // State for Cost Codes
    const [localCostCodes, setLocalCostCodes] = useState(costCodes);
    useEffect(() => {
        setLocalCostCodes(costCodes);
    }, [costCodes]);
    
    // Security State
    const [securityValues, setSecurityValues] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [hasPassword, setHasPassword] = useState(false);

    useEffect(() => {
        setHasPassword(!!localStorage.getItem('dreamGreenCscBackOfficePassword'));
    }, []);


    const selectedProductsForUpdate = useMemo(() => {
        return products.filter(p => selectedProductIds.has(p.id));
    }, [products, selectedProductIds]);

    const productMap = useMemo(() => {
        return new Map(products.map(p => [p.id, p.name]));
    }, [products]);

    // Handlers for Category/Seller Modal
    const openMgmtModal = (mode: ModalMode, type: DataType, item: string = '') => {
        setMgmtModalMode(mode);
        setDataType(type);
        setCurrentItem(item);
        setFormValue(item);
        setIsMgmtModalOpen(true);
    };
    const closeMgmtModal = () => setIsMgmtModalOpen(false);
    const handleMgmtSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formValue.trim()) return;

        if (dataType === 'category') {
            if (mgmtModalMode === 'add') addCategory(formValue); else updateCategory(currentItem, formValue);
        } else {
            if (mgmtModalMode === 'add') addSeller(formValue); else updateSeller(currentItem, formValue);
        }
        closeMgmtModal();
    };
    const handleMgmtDelete = (type: DataType, item: string) => {
        if (window.confirm(`Are you sure you want to delete "${item}"?`)) {
            if (type === 'category') deleteCategory(item); else deleteSeller(item);
        }
    }

    // Handlers for Product Modal
    const openProductModal = (mode: ModalMode, category: string, product?: Product) => {
        setSelectedProduct(product || null);
        setProductForm(product || {
            name: '', category, openingStock: 0, stockBought: 0, unitPrice: 0, sellingPrice: 0, lowStockThreshold: undefined,
        });
        setIsProductModalOpen(true);
    };
    const closeProductModal = () => setIsProductModalOpen(false);
    const handleProductFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setProductForm(prev => {
            switch (name) {
                case 'name':
                    return { ...prev, name: value };
                case 'openingStock':
                    return { ...prev, openingStock: parseFloat(value) || 0 };
                case 'stockBought':
                    return { ...prev, stockBought: parseFloat(value) || 0 };
                case 'unitPrice':
                    return { ...prev, unitPrice: parseFloat(value) || 0 };
                case 'sellingPrice':
                    return { ...prev, sellingPrice: parseFloat(value) || 0 };
                case 'lowStockThreshold':
                    const num = parseInt(value, 10);
                    return { ...prev, lowStockThreshold: isNaN(num) ? undefined : num };
                default:
                    return prev;
            }
        });
    };
    const handleProductSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedProduct) {
            updateProduct({ ...productForm, id: selectedProduct.id });
        } else {
            addProduct(productForm);
        }
        closeProductModal();
    };
    const handleProductDelete = (product: Product) => {
        if (window.confirm(`Are you sure you want to delete "${product.name}"? This will also delete any special offers linked to it.`)) {
            deleteProduct(product.id);
        }
    };
    
    // Handlers for Bulk Update
    const handleSelectProduct = (productId: string) => {
        setSelectedProductIds((prev: Set<string>) => {
            const newSet = new Set(prev);
            if (newSet.has(productId)) {
                newSet.delete(productId);
            } else {
                newSet.add(productId);
            }
            return newSet;
        });
    };
    const openBulkUpdateModal = () => {
        const initialValues: Record<string, BulkUpdateInput> = {};
        Array.from(selectedProductIds).forEach(id => {
            const product = products.find(p => p.id === id);
            initialValues[id as string] = { 
                stockToAdd: '', 
                newUnitPrice: product ? product.unitPrice.toString() : '' 
            };
        });
        setBulkUpdates(initialValues);
        setIsBulkUpdateModalOpen(true);
    };
    const closeBulkUpdateModal = () => setIsBulkUpdateModalOpen(false);
    
    const handleBulkUpdateChange = (productId: string, field: keyof BulkUpdateInput, value: string) => {
        setBulkUpdates(prev => ({
            ...prev,
            [productId]: {
                ...prev[productId],
                [field]: value
            }
        }));
    };

    const handleBulkUpdateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const updates = Object.entries(bulkUpdates)
        .map(([productId, input]: [string, BulkUpdateInput]) => ({
            productId,
            stockToAdd: parseInt(input.stockToAdd, 10) || 0,
            newUnitPrice: input.newUnitPrice ? parseFloat(input.newUnitPrice) : undefined
        }));

        if (updates.length > 0) {
            bulkUpdateStock(updates);
        }
        
        setSelectedProductIds(new Set<string>());
        closeBulkUpdateModal();
    };

    // Handlers for Special Offer Modal
    const openOfferModal = (offer?: SpecialOffer) => {
        setSelectedOffer(offer || null);
        if (offer) {
            setOfferFormState({
                ...offer,
                startDate: offer.startDate ? new Date(offer.startDate).toISOString().split('T')[0] : '',
                endDate: offer.endDate ? new Date(offer.endDate).toISOString().split('T')[0] : '',
            });
        } else {
            setOfferFormState({
                productId: products[0]?.id || '', name: '', type: 'BOGO', buyQuantity: 2, getQuantity: 1, startDate: '', endDate: ''
            });
        }
        setIsOfferModalOpen(true);
    };
    const closeOfferModal = () => setIsOfferModalOpen(false);
    const handleOfferFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setOfferFormState(prev => {
            const newState = { ...prev, [name]: value };
            if (name === 'type') {
                if (value === 'BOGO') {
                    newState.buyQuantity = 2;
                    newState.getQuantity = 1;
                    delete (newState as Partial<typeof newState>).payForQuantity;
                } else if (value === 'BULK_DISCOUNT') {
                    newState.buyQuantity = 3.5;
                    newState.payForQuantity = 3;
                    delete (newState as Partial<typeof newState>).getQuantity;
                }
            }
            if (['buyQuantity', 'getQuantity', 'payForQuantity'].includes(name)) {
                return { ...prev, [name]: parseFloat(value) || 0 };
            }
            return newState;
        });
    };
    const handleOfferSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalOfferState: Omit<SpecialOffer, 'id'> = { 
            ...offerFormState,
            startDate: offerFormState.startDate || undefined,
            endDate: offerFormState.endDate || undefined
        };

        if(finalOfferState.type === 'BOGO') {
          delete finalOfferState.payForQuantity;
        } else if (finalOfferState.type === 'BULK_DISCOUNT') {
          delete finalOfferState.getQuantity;
        }

        if (selectedOffer) {
            updateSpecialOffer({ ...finalOfferState, id: selectedOffer.id });
        } else {
            addSpecialOffer(finalOfferState);
        }
        closeOfferModal();
    };
    const handleOfferDelete = (offerId: string) => {
        if (window.confirm('Are you sure you want to delete this special offer?')) {
            deleteSpecialOffer(offerId);
        }
    };


    // Handlers for Cost Codes
    const handleCostCodeChange = (index: number, value: string) => {
        const newCodes = [...localCostCodes];
        newCodes[index] = { ...newCodes[index], value: parseFloat(value) || 0 };
        setLocalCostCodes(newCodes);
    };

    const handleSaveCostCodes = () => {
        updateCostCodes(localCostCodes);
        alert('Cost codes updated successfully!');
    };

    // Handlers for Security
    const handleSecuritySave = (e: React.FormEvent) => {
        e.preventDefault();
        const stored = localStorage.getItem('dreamGreenCscBackOfficePassword');

        if (hasPassword) {
            if (stored !== securityValues.currentPassword) {
                alert("Current password is incorrect.");
                return;
            }
        }

        if (securityValues.newPassword !== securityValues.confirmPassword) {
            alert("New passwords do not match.");
            return;
        }
        
        if (!securityValues.newPassword) {
             alert("Password cannot be empty.");
             return;
        }

        localStorage.setItem('dreamGreenCscBackOfficePassword', securityValues.newPassword);
        setHasPassword(true);
        setSecurityValues({ currentPassword: '', newPassword: '', confirmPassword: '' });
        alert("Password updated successfully.");
    };

    const handleRemovePassword = () => {
         const stored = localStorage.getItem('dreamGreenCscBackOfficePassword');
         if (stored !== securityValues.currentPassword) {
                alert("Current password is incorrect.");
                return;
        }
        if (window.confirm("Are you sure you want to remove password protection?")) {
            localStorage.removeItem('dreamGreenCscBackOfficePassword');
            setHasPassword(false);
            setSecurityValues({ currentPassword: '', newPassword: '', confirmPassword: '' });
            alert("Password removed.");
        }
    }

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // 2MB limit check
                alert("File size is too large. Please choose an image under 2MB.");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                    updateLogo(reader.result);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 3 * 1024 * 1024) { // 3MB limit check for background
                alert("File size is too large. Please choose an image under 3MB.");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                    updateBackgroundImage(reader.result);
                }
            };
            reader.readAsDataURL(file);
        }
    };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <h2 className="text-2xl font-bold text-gray-800">Product & Data Management</h2>
            {selectedProductIds.size > 0 && (
            <button onClick={openBulkUpdateModal} className="flex items-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors">
                Bulk Update Stock ({selectedProductIds.size})
            </button>
            )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Branding</h3>
            <div className="space-y-6">
                    <div>
                    <label htmlFor="appName" className="block text-sm font-medium text-gray-700 mb-1">Application Name</label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            id="appName"
                            value={appName}
                            onChange={(e) => updateAppName(e.target.value)}
                            className="block w-full max-w-md rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border"
                        />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">This name will be displayed in the header and on the login screen.</p>
                </div>

                <div>
                    <span className="block text-sm font-medium text-gray-700 mb-2">Application Logo</span>
                    <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 border border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden">
                            {logo ? (
                                <img src={logo} alt="App Logo" className="w-full h-full object-contain" />
                            ) : (
                                <span className="text-gray-400 text-xs">No Logo</span>
                            )}
                        </div>
                        <div className="flex flex-col space-y-1">
                            <label className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-800">
                                <span>Upload New Logo</span>
                                <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                            </label>
                            {logo && (
                                <button onClick={() => updateLogo(undefined)} className="text-red-600 hover:text-red-800 text-sm font-medium text-left">
                                    Remove Logo
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                    <div>
                    <span className="block text-sm font-medium text-gray-700 mb-2">POS Background Image</span>
                        <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 border border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden">
                            {backgroundImage ? (
                                <img src={backgroundImage} alt="Background Preview" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-gray-400 text-xs text-center p-1">No Image</span>
                            )}
                        </div>
                            <div className="flex flex-col space-y-1">
                            <label className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-800">
                                <span>Upload Background</span>
                                <input type="file" accept="image/*" className="hidden" onChange={handleBackgroundUpload} />
                            </label>
                            {backgroundImage && (
                                <button onClick={() => updateBackgroundImage(undefined)} className="text-red-600 hover:text-red-800 text-sm font-medium text-left">
                                    Remove Background
                                </button>
                            )}
                        </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Displayed behind category buttons in the Front Office.</p>
                </div>
            </div>
        </div>

         <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Application Settings</h3>
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                    <div>
                        <label htmlFor="lowStockThreshold" className="text-gray-700 font-medium">Global Low Stock Threshold</label>
                        <p className="text-xs text-gray-500 mt-1">Products with stock at or below this level will be highlighted.</p>
                    </div>
                    <input
                        type="number"
                        id="lowStockThreshold"
                        name="lowStockThreshold"
                        value={lowStockThreshold}
                        onChange={(e) => setLowStockThreshold(parseInt(e.target.value, 10) || 0)}
                        className="w-24 p-2 border border-gray-300 rounded-md text-sm"
                        min="0"
                    />
                </div>
                 <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                    <div>
                        <label htmlFor="lowProfitMarginThreshold" className="text-gray-700 font-medium">Low Profit Margin Warning (%)</label>
                         <p className="text-xs text-gray-500 mt-1">Highlight products with a profit margin below this percentage.</p>
                    </div>
                    <input
                        type="number"
                        id="lowProfitMarginThreshold"
                        name="lowProfitMarginThreshold"
                        value={lowProfitMarginThreshold}
                        onChange={(e) => setLowProfitMarginThreshold(parseInt(e.target.value, 10) || 0)}
                        className="w-24 p-2 border border-gray-300 rounded-md text-sm"
                        min="0"
                        max="100"
                    />
                </div>
                <div className="flex items-center justify-between">
                    <div>
                        <label htmlFor="defaultMembershipFee" className="text-gray-700 font-medium">Default Membership Fee (€)</label>
                        <p className="text-xs text-gray-500 mt-1">Default fee for new members in Front Office.</p>
                    </div>
                    <input
                        type="number"
                        id="defaultMembershipFee"
                        name="defaultMembershipFee"
                        value={defaultMembershipFee}
                        onChange={(e) => setDefaultMembershipFee(parseFloat(e.target.value) || 0)}
                        className="w-24 p-2 border border-gray-300 rounded-md text-sm"
                        min="0"
                        step="0.01"
                    />
                </div>
            </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Back Office Security</h3>
            <p className="text-sm text-gray-600 mb-4">
                {hasPassword 
                    ? "Password protection is currently enabled. Enter your current password to change or remove it." 
                    : "Protect the Back Office area with a password."}
            </p>
            <form onSubmit={handleSecuritySave} className="space-y-4 max-w-md">
                {hasPassword && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Current Password</label>
                        <input 
                            type="password" 
                            value={securityValues.currentPassword}
                            onChange={(e) => setSecurityValues({...securityValues, currentPassword: e.target.value})}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border"
                        />
                    </div>
                )}
                <div>
                    <label className="block text-sm font-medium text-gray-700">{hasPassword ? 'New Password' : 'Set Password'}</label>
                    <input 
                        type="password" 
                        value={securityValues.newPassword}
                        onChange={(e) => setSecurityValues({...securityValues, newPassword: e.target.value})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Confirm {hasPassword ? 'New ' : ''}Password</label>
                    <input 
                        type="password" 
                        value={securityValues.confirmPassword}
                        onChange={(e) => setSecurityValues({...securityValues, confirmPassword: e.target.value})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border"
                    />
                </div>
                <div className="flex gap-4 pt-2">
                    <button type="submit" className="px-4 py-2 dynamic-btn text-white rounded-md text-sm font-medium">
                        {hasPassword ? 'Update Password' : 'Set Password'}
                    </button>
                    {hasPassword && (
                        <button type="button" onClick={handleRemovePassword} className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 text-sm font-medium">
                            Remove Password
                        </button>
                    )}
                </div>
            </form>
        </div>
        
        <div className="space-y-6">
            <ProductList
                title="Products"
                products={products.filter(p => p.category === 'Product')}
                onAdd={() => openProductModal('add', 'Product')}
                onEdit={(p) => openProductModal('edit', 'Product', p)}
                onDelete={handleProductDelete}
                selectedProductIds={selectedProductIds}
                onSelectProduct={handleSelectProduct}
                lowStockThreshold={lowStockThreshold}
            />
            <ProductList
                title="Sundries"
                products={products.filter(p => p.category === 'Sundries')}
                onAdd={() => openProductModal('add', 'Sundries')}
                onEdit={(p) => openProductModal('edit', 'Sundries', p)}
                onDelete={handleProductDelete}
                selectedProductIds={selectedProductIds}
                onSelectProduct={handleSelectProduct}
                lowStockThreshold={lowStockThreshold}
            />
            <ProductList
                title="Confectionary"
                products={products.filter(p => p.category === 'Confectionary')}
                onAdd={() => openProductModal('add', 'Confectionary')}
                onEdit={(p) => openProductModal('edit', 'Confectionary', p)}
                onDelete={handleProductDelete}
                selectedProductIds={selectedProductIds}
                onSelectProduct={handleSelectProduct}
                lowStockThreshold={lowStockThreshold}
            />
        </div>

        <hr />

        <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Manage Special Offers</h3>
                <button
                    onClick={() => openOfferModal()}
                    className="flex items-center px-3 py-1.5 dynamic-btn text-sm font-semibold rounded-lg shadow-sm transition-colors"
                >
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Add Offer
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full whitespace-nowrap">
                    <thead className="bg-gray-50">
                        <tr>
                            {['Offer Name', 'Product', 'Type', 'Details', 'Active Dates', 'Actions'].map(header => (
                                <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{header}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {specialOffers.map(offer => (
                            <tr key={offer.id}>
                                <td className="px-6 py-4 font-medium text-gray-900">{offer.name}</td>
                                <td className="px-6 py-4 text-gray-500">{productMap.get(offer.productId) || 'Unknown Product'}</td>
                                <td className="px-6 py-4 text-gray-500">{offer.type}</td>
                                <td className="px-6 py-4 text-gray-500 text-sm">
                                    {offer.type === 'BOGO' ? `Buy ${offer.buyQuantity}, Get ${offer.getQuantity} Free` : `Buy ${offer.buyQuantity} for price of ${offer.payForQuantity}`}
                                </td>
                                <td className="px-6 py-4 text-gray-500 text-sm">
                                    {offer.startDate ? `From: ${new Date(offer.startDate).toLocaleDateString()}` : 'Always'}
                                    <br/>
                                    {offer.endDate ? `Until: ${new Date(offer.endDate).toLocaleDateString()}` : ''}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="space-x-3">
                                        <button onClick={() => openOfferModal(offer)} className="text-blue-600 hover:text-blue-800"><EditIcon className="w-5 h-5" /></button>
                                        <button onClick={() => handleOfferDelete(offer.id)} className="text-red-600 hover:text-red-800"><DeleteIcon className="w-5 h-5" /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {specialOffers.length === 0 && (
                            <tr><td colSpan={6} className="py-4 text-center text-gray-500">No special offers created yet.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ManagementList
                title="Manage Categories"
                items={categories}
                onAdd={() => openMgmtModal('add', 'category')}
                onEdit={(item) => openMgmtModal('edit', 'category', item)}
                onDelete={(item) => handleMgmtDelete('category', item)}
            />
            <ManagementList
                title="Manage Sellers"
                items={sellers}
                onAdd={() => openMgmtModal('add', 'seller')}
                onEdit={(item) => openMgmtModal('edit', 'seller', item)}
                onDelete={(item) => handleMgmtDelete('seller', item)}
            />
        </div>
        
         <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Manage Cost Codes</h3>
             <div className="space-y-4">
                {localCostCodes.map((code, index) => (
                    <div key={code.code} className="flex items-center justify-between">
                        <label htmlFor={`costcode-${code.code}`} className="text-gray-700 font-medium">{code.code} Cost (€)</label>
                        <input
                            type="number"
                            id={`costcode-${code.code}`}
                            value={code.value}
                            onChange={(e) => handleCostCodeChange(index, e.target.value)}
                            className="w-32 p-2 border border-gray-300 rounded-md text-sm"
                            min="0"
                            step="0.01"
                        />
                    </div>
                ))}
            </div>
            <div className="mt-6 flex justify-end">
                <button
                    onClick={handleSaveCostCodes}
                    className="px-4 py-2 text-sm font-medium text-white dynamic-btn rounded-md shadow-sm"
                >
                    Save Cost Code Changes
                </button>
            </div>
        </div>
        
        {/* Category/Seller Modal */}
        <Modal isOpen={isMgmtModalOpen} onClose={closeMgmtModal} title={`${mgmtModalMode === 'add' ? 'Add' : 'Edit'} ${dataType}`}>
            <form onSubmit={handleMgmtSubmit}>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                <input type="text" id="name" value={formValue} onChange={(e) => setFormValue(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
                <div className="mt-6 flex justify-end">
                    <button type="button" onClick={closeMgmtModal} className="mr-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">Cancel</button>
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white dynamic-btn rounded-md shadow-sm">Save</button>
                </div>
            </form>
        </Modal>

        {/* Product Modal */}
        <Modal isOpen={isProductModalOpen} onClose={closeProductModal} title={selectedProduct ? 'Edit Product' : 'Add New Product'}>
            <form onSubmit={handleProductSubmit}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Category</label>
                        <p className="mt-1 text-sm text-gray-900 font-semibold p-2 bg-gray-100 rounded-md">{productForm.category}</p>
                    </div>
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Product Name</label>
                        <input type="text" name="name" id="name" value={productForm.name} onChange={handleProductFormChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
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
                    <div>
                        <label htmlFor="lowStockThreshold" className="block text-sm font-medium text-gray-700">Low Stock Threshold</label>
                        <input
                            type="number"
                            name="lowStockThreshold"
                            id="lowStockThreshold"
                            value={productForm.lowStockThreshold ?? ''}
                            onChange={handleProductFormChange}
                            placeholder={`Global default (${lowStockThreshold})`}
                            min="0"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        />
                        <p className="text-xs text-gray-500 mt-1">Leave blank to use the global setting.</p>
                    </div>
                </div>
                <div className="mt-6 flex justify-end">
                    <button type="button" onClick={closeProductModal} className="mr-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">Cancel</button>
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white dynamic-btn rounded-md shadow-sm">{selectedProduct ? 'Update Product' : 'Add Product'}</button>
                </div>
            </form>
        </Modal>

        {/* Bulk Stock Update Modal */}
        <Modal isOpen={isBulkUpdateModalOpen} onClose={closeBulkUpdateModal} title={`Update Stock for ${selectedProductIds.size} Products`}>
            <form onSubmit={handleBulkUpdateSubmit}>
            <p className="text-sm text-gray-600 mb-4">
                Enter the quantity of new stock to add. You can also update the unit price; if stock is added, the new unit price will be calculated as a weighted average.
            </p>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    <div className="col-span-5">Product</div>
                    <div className="col-span-3">Stock to Add</div>
                    <div className="col-span-4">Unit Cost (€)</div>
                </div>
                {selectedProductsForUpdate.map(product => {
                    const updateVal = bulkUpdates[product.id] || { stockToAdd: '', newUnitPrice: '' };
                    return (
                    <div key={product.id} className="grid grid-cols-12 items-center gap-4 border-b border-gray-100 pb-2">
                        <label htmlFor={`bulkStock-${product.id}`} className="col-span-5 text-sm font-medium text-gray-700 truncate" title={product.name}>
                        {product.name}
                        </label>
                        <div className="col-span-3">
                             <input
                                type="number"
                                id={`bulkStock-${product.id}`}
                                value={updateVal.stockToAdd}
                                min="0"
                                onChange={(e) => handleBulkUpdateChange(product.id, 'stockToAdd', e.target.value)}
                                placeholder="Qty"
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                            />
                        </div>
                        <div className="col-span-4">
                             <input
                                type="number"
                                step="0.01"
                                value={updateVal.newUnitPrice}
                                min="0"
                                onChange={(e) => handleBulkUpdateChange(product.id, 'newUnitPrice', e.target.value)}
                                placeholder="Price"
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                            />
                        </div>
                    </div>
                )})}
            </div>
            <div className="mt-6 flex justify-end">
                <button type="button" onClick={closeBulkUpdateModal} className="mr-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700">Update Stock & Prices</button>
            </div>
            </form>
        </Modal>

        {/* Special Offer Modal */}
        <Modal isOpen={isOfferModalOpen} onClose={closeOfferModal} title={selectedOffer ? 'Edit Special Offer' : 'Add Special Offer'}>
            <form onSubmit={handleOfferSubmit}>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="offer-productId" className="block text-sm font-medium text-gray-700">Product</label>
                        <select id="offer-productId" name="productId" value={offerFormState.productId} onChange={handleOfferFormChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm">
                            <option value="" disabled>Select a product</option>
                            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="offer-name" className="block text-sm font-medium text-gray-700">Offer Name</label>
                        <input type="text" id="offer-name" name="name" value={offerFormState.name} onChange={handleOfferFormChange} required placeholder="e.g., 3 for 2 Deal" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
                    </div>
                    <div>
                        <label htmlFor="offer-type" className="block text-sm font-medium text-gray-700">Offer Type</label>
                        <select id="offer-type" name="type" value={offerFormState.type} onChange={handleOfferFormChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm">
                            <option value="BOGO">Buy X Get Y Free</option>
                            <option value="BULK_DISCOUNT">Bulk Discount</option>
                        </select>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="offer-startDate" className="block text-sm font-medium text-gray-700">Start Date (Optional)</label>
                            <input type="date" id="offer-startDate" name="startDate" value={offerFormState.startDate} onChange={handleOfferFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm" />
                        </div>
                        <div>
                            <label htmlFor="offer-endDate" className="block text-sm font-medium text-gray-700">End Date (Optional)</label>
                            <input type="date" id="offer-endDate" name="endDate" value={offerFormState.endDate} onChange={handleOfferFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm" />
                        </div>
                    </div>
                    {offerFormState.type === 'BOGO' && (
                        <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-md">
                            <div>
                                <label htmlFor="offer-buyQuantity" className="block text-sm font-medium text-gray-700">Buy Quantity (X)</label>
                                <input type="number" step="1" min="1" id="offer-buyQuantity" name="buyQuantity" value={offerFormState.buyQuantity} onChange={handleOfferFormChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm" />
                            </div>
                            <div>
                                <label htmlFor="offer-getQuantity" className="block text-sm font-medium text-gray-700">Get Quantity (Y)</label>
                                <input type="number" step="1" min="1" id="offer-getQuantity" name="getQuantity" value={offerFormState.getQuantity} onChange={handleOfferFormChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm" />
                            </div>
                        </div>
                    )}
                    {offerFormState.type === 'BULK_DISCOUNT' && (
                         <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-md">
                            <div>
                                <label htmlFor="offer-bulk-buyQuantity" className="block text-sm font-medium text-gray-700">Buy Quantity</label>
                                <input type="number" step="0.5" min="0.5" id="offer-bulk-buyQuantity" name="buyQuantity" value={offerFormState.buyQuantity} onChange={handleOfferFormChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm" />
                            </div>
                            <div>
                                <label htmlFor="offer-payForQuantity" className="block text-sm font-medium text-gray-700">Pay For Quantity</label>
                                <input type="number" step="0.5" min="0" id="offer-payForQuantity" name="payForQuantity" value={offerFormState.payForQuantity} onChange={handleOfferFormChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm" />
                            </div>
                        </div>
                    )}
                </div>
                <div className="mt-6 flex justify-end">
                    <button type="button" onClick={closeOfferModal} className="mr-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">Cancel</button>
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white dynamic-btn rounded-md shadow-sm">{selectedOffer ? 'Update Offer' : 'Add Offer'}</button>
                </div>
            </form>
        </Modal>
    </div>
  );
};

export default Settings;
