
import { useState, useMemo, useEffect } from 'react';
import { Product, Sale, Member, CostCode, SpecialOffer, AppTheme } from '../types';

// --- Default Initial Data (used if no saved data is found) ---
const initialProducts: Product[] = [
  { id: 'p1', name: 'Peace Lily', category: 'Product', openingStock: 20, stockBought: 10, unitPrice: 8, sellingPrice: 15, lowStockThreshold: 5 },
  { id: 'p2', name: 'Snake Plant', category: 'Product', openingStock: 15, stockBought: 15, unitPrice: 10, sellingPrice: 20, lowStockThreshold: 3 },
  { id: 'p3', name: 'Monstera Deliciosa', category: 'Product', openingStock: 10, stockBought: 5, unitPrice: 15, sellingPrice: 28 },
  { id: 'p4', name: 'ZZ Plant', category: 'Product', openingStock: 12, stockBought: 8, unitPrice: 12, sellingPrice: 22 },
  { id: 'p5', name: 'Fiddle Leaf Fig', category: 'Product', openingStock: 5, stockBought: 5, unitPrice: 25, sellingPrice: 45 },
  { id: 'p6', name: 'Chocolate Bar', category: 'Confectionary', openingStock: 50, stockBought: 100, unitPrice: 0.5, sellingPrice: 1.2, lowStockThreshold: 20 },
  { id: 'p7', name: 'Plant Food', category: 'Sundries', openingStock: 30, stockBought: 20, unitPrice: 2, sellingPrice: 5 },
];

const initialSales: Sale[] = [
    { id: 's1', productId: 'p1', productName: 'Peace Lily', quantity: 2, saleDate: new Date('2023-10-01T10:00:00Z').toISOString(), totalRevenue: 30, totalCost: 16, profit: 14, soldBy: 'Alice' },
    { id: 's2', productId: 'p2', productName: 'Snake Plant', quantity: 1, saleDate: new Date('2023-10-01T11:30:00Z').toISOString(), totalRevenue: 20, totalCost: 10, profit: 10, soldBy: 'Bob' },
    { id: 's3', productId: 'p1', productName: 'Peace Lily', quantity: 3, saleDate: new Date('2023-10-02T14:00:00Z').toISOString(), totalRevenue: 45, totalCost: 24, profit: 21, soldBy: 'Alice' },
    { id: 's4', productId: 'p3', productName: 'Monstera Deliciosa', quantity: 1, saleDate: new Date('2023-10-03T09:00:00Z').toISOString(), totalRevenue: 28, totalCost: 15, profit: 13, soldBy: 'Charlie' },
    { id: 's5', productId: 'p6', productName: 'Chocolate Bar', quantity: 10, saleDate: new Date('2023-10-03T15:30:00Z').toISOString(), totalRevenue: 12, totalCost: 5, profit: 7, soldBy: 'Bob' },
    { id: 's6', productId: 'p7', productName: 'Plant Food', quantity: 2, saleDate: new Date('2023-10-04T12:00:00Z').toISOString(), totalRevenue: 10, totalCost: 4, profit: 6, soldBy: 'Alice' },
];

const initialMembers: Member[] = [
  { id: 'm1', name: 'Alice', email: 'alice@example.com', dateOfBirth: '1990-01-15', nationality: 'Irish', sex: 'Female', idType: 'Passport', idNumber: 'P12345', membershipFee: 20, joinDate: new Date('2023-09-05T10:00:00Z').toISOString() },
  { id: 'm2', name: 'Bob', email: 'bob@example.com', dateOfBirth: '1985-05-20', nationality: 'British', sex: 'Male', idType: 'National ID', idNumber: 'N67890', membershipFee: 20, joinDate: new Date('2023-10-10T11:30:00Z').toISOString() },
  { id: 'm3', name: 'Charlie', email: 'charlie@example.com', dateOfBirth: '1992-09-01', nationality: 'American', sex: 'Male', idType: 'Driving License', idNumber: 'D54321', membershipFee: 15, joinDate: new Date('2023-10-15T09:00:00Z').toISOString() },
];

const initialCostCodes: CostCode[] = [
    { code: 'TS', value: 18 },
    { code: 'MS', value: 12 },
    { code: 'BS', value: 6 },
];

const initialSpecialOffers: SpecialOffer[] = [
    { id: 'so1', productId: 'p1', name: 'Buy 2 Get 1 Free', type: 'BOGO', buyQuantity: 2, getQuantity: 1, startDate: '2023-01-01', endDate: '2025-12-31' },
    { id: 'so2', productId: 'p6', name: '5 for price of 4', type: 'BULK_DISCOUNT', buyQuantity: 5, payForQuantity: 4, startDate: '2023-01-01' },
];

interface AppData {
  products: Product[];
  sales: Sale[];
  categories: string[];
  sellers: string[];
  members: Member[];
  costCodes: CostCode[];
  specialOffers: SpecialOffer[];
  lowStockThreshold: number;
  lowProfitMarginThreshold: number;
  defaultMembershipFee: number;
  logo?: string;
  backgroundImage?: string;
  appName: string;
  theme: AppTheme;
}

const getInitialData = (): AppData => ({
  products: initialProducts,
  sales: initialSales,
  categories: ['Product', 'Confectionary', 'Sundries'],
  sellers: ['Alice', 'Bob', 'Charlie'],
  members: initialMembers,
  costCodes: initialCostCodes,
  specialOffers: initialSpecialOffers,
  lowStockThreshold: 5,
  lowProfitMarginThreshold: 20, // Default 20%
  defaultMembershipFee: 20,
  logo: undefined,
  backgroundImage: undefined,
  appName: 'Dream Green CSC',
  theme: { primaryColor: '#10B981', buttonStyle: 'solid' },
});

const APP_STORAGE_KEY = 'dreamGreenCscStockData';

const loadData = (): AppData => {
  try {
    const savedData = localStorage.getItem(APP_STORAGE_KEY);
    if (savedData) {
      const parsed = JSON.parse(savedData);
      const defaults = getInitialData();
      
      const mergedData = { ...defaults, ...parsed };

      if (Array.isArray(mergedData.products)) {
        mergedData.products = mergedData.products
          .filter((p: any) => p && typeof p === 'object')
          .map((p: any) => ({
            id: p.id || `p-fallback-${Date.now()}`,
            name: p.name || 'Unnamed Product',
            category: p.category || 'Uncategorized',
            openingStock: typeof p.openingStock === 'number' ? p.openingStock : 0,
            stockBought: typeof p.stockBought === 'number' ? p.stockBought : 0,
            unitPrice: typeof p.unitPrice === 'number' ? p.unitPrice : 0,
            sellingPrice: typeof p.sellingPrice === 'number' ? p.sellingPrice : 0,
            lowStockThreshold: typeof p.lowStockThreshold === 'number' ? p.lowStockThreshold : undefined,
          }));
      } else {
        mergedData.products = defaults.products;
      }
      
      if (Array.isArray(mergedData.categories)) {
          mergedData.categories = mergedData.categories.filter((c: any) => typeof c === 'string' && c.trim() !== '');
      } else {
          mergedData.categories = defaults.categories;
      }

      if (Array.isArray(mergedData.sellers)) {
          mergedData.sellers = mergedData.sellers.filter((s: any) => typeof s === 'string' && s.trim() !== '');
      } else {
          mergedData.sellers = defaults.sellers;
      }

      if (Array.isArray(mergedData.sales)) {
        mergedData.sales = mergedData.sales
            .filter((s: any) => s && typeof s === 'object' && s.productId && typeof s.productName === 'string')
            .map((s: any) => ({
                id: s.id || `s-fallback-${Date.now()}`,
                productId: s.productId,
                productName: s.productName,
                quantity: typeof s.quantity === 'number' ? s.quantity : 0,
                saleDate: s.saleDate || new Date().toISOString(),
                soldBy: typeof s.soldBy === 'string' ? s.soldBy : 'Unknown',
                totalRevenue: typeof s.totalRevenue === 'number' ? s.totalRevenue : 0,
                totalCost: typeof s.totalCost === 'number' ? s.totalCost : 0,
                profit: typeof s.profit === 'number' ? s.profit : 0,
                costCode: typeof s.costCode === 'string' ? s.costCode : undefined,
                appliedOfferId: typeof s.appliedOfferId === 'string' ? s.appliedOfferId : undefined,
                appliedOfferName: typeof s.appliedOfferName === 'string' ? s.appliedOfferName : undefined,
            }));
      } else {
          mergedData.sales = defaults.sales;
      }

      if (Array.isArray(mergedData.members)) {
          mergedData.members = mergedData.members
            .filter((m: any) => m && typeof m === 'object' && typeof m.name === 'string')
            .map((m: any) => ({
                id: m.id || `m-fallback-${Date.now()}`,
                name: m.name,
                email: typeof m.email === 'string' ? m.email : '',
                dateOfBirth: m.dateOfBirth || '1970-01-01',
                nationality: m.nationality || 'Unknown',
                sex: m.sex || 'Prefer not to say',
                idType: m.idType || 'Other',
                idNumber: m.idNumber || '',
                membershipFee: typeof m.membershipFee === 'number' ? m.membershipFee : defaults.defaultMembershipFee,
                joinDate: m.joinDate || new Date('2023-01-01T00:00:00Z').toISOString(),
            }));
      } else {
          mergedData.members = defaults.members;
      }

       if (Array.isArray(mergedData.costCodes)) {
            mergedData.costCodes = mergedData.costCodes
                .filter((c: any) => c && typeof c === 'object' && typeof c.code === 'string')
                .map((c: any) => ({
                    code: c.code,
                    value: typeof c.value === 'number' ? c.value : 0,
                }));
        } else {
            mergedData.costCodes = defaults.costCodes;
        }

      if (Array.isArray(mergedData.specialOffers)) {
        mergedData.specialOffers = mergedData.specialOffers
          .filter((o: any) => o && typeof o === 'object' && o.productId && o.type)
          .map((o: any) => ({
            id: o.id || `so-fallback-${Date.now()}`,
            productId: o.productId,
            name: o.name || 'Unnamed Offer',
            type: o.type,
            buyQuantity: typeof o.buyQuantity === 'number' ? o.buyQuantity : 0,
            getQuantity: typeof o.getQuantity === 'number' ? o.getQuantity : undefined,
            payForQuantity: typeof o.payForQuantity === 'number' ? o.payForQuantity : undefined,
            startDate: typeof o.startDate === 'string' ? o.startDate : undefined,
            endDate: typeof o.endDate === 'string' ? o.endDate : undefined,
          }));
      } else {
        mergedData.specialOffers = defaults.specialOffers;
      }

      if (typeof mergedData.defaultMembershipFee !== 'number') {
        mergedData.defaultMembershipFee = defaults.defaultMembershipFee;
      }
      
      if (typeof mergedData.lowProfitMarginThreshold !== 'number') {
        mergedData.lowProfitMarginThreshold = defaults.lowProfitMarginThreshold;
      }

      mergedData.logo = typeof mergedData.logo === 'string' ? mergedData.logo : undefined;
      mergedData.backgroundImage = typeof mergedData.backgroundImage === 'string' ? mergedData.backgroundImage : undefined;
      mergedData.appName = typeof mergedData.appName === 'string' ? mergedData.appName : defaults.appName;
      mergedData.theme = (mergedData.theme && mergedData.theme.primaryColor) ? mergedData.theme : defaults.theme;

      return mergedData;
    }
  } catch (error) {
    console.error("Failed to load or parse data from localStorage, using defaults.", error);
    localStorage.removeItem(APP_STORAGE_KEY);
  }
  return getInitialData();
};

export const useStockData = () => {
  const [data, setData] = useState<AppData>(loadData);

  useEffect(() => {
    try {
      localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error("Failed to save data to localStorage", error);
    }
  }, [data]);

  const productsWithCurrentStock = useMemo(() => {
    const salesByProduct = data.sales.reduce((acc, sale) => {
      acc[sale.productId] = (acc[sale.productId] || 0) + sale.quantity;
      return acc;
    }, {} as Record<string, number>);

    return data.products.map(product => ({
      ...product,
      currentStock: (product.openingStock + product.stockBought) - (salesByProduct[product.id] || 0)
    }));
  }, [data.products, data.sales]);

  const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  const addProduct = (product: Omit<Product, 'id'>) => {
    setData(prev => ({ ...prev, products: [...prev.products, { ...product, id: generateId('p') }] }));
  };

  const updateProduct = (updatedProduct: Product) => {
    setData(prev => {
        const oldProduct = prev.products.find(p => p.id === updatedProduct.id);
        const nameHasChanged = oldProduct && oldProduct.name !== updatedProduct.name;

        return {
            ...prev,
            products: prev.products.map(p => p.id === updatedProduct.id ? updatedProduct : p),
            sales: nameHasChanged 
                ? prev.sales.map(s => s.productId === updatedProduct.id ? { ...s, productName: updatedProduct.name } : s)
                : prev.sales,
        };
    });
  };
  
  const deleteProduct = (productId: string) => {
     setData(prev => ({
        ...prev,
        products: prev.products.filter(p => p.id !== productId),
        specialOffers: prev.specialOffers.filter(so => so.productId !== productId),
     }));
  };

  const recordSale = (productId: string, quantity: number, saleDate: Date, soldBy: string, costCode?: string, appliedOfferId?: string) => {
    const productWithStock = productsWithCurrentStock.find(p => p.id === productId);
    const productInfo = data.products.find(p => p.id === productId);
    
    if (productWithStock && productInfo) {
      const newStockLevel = productWithStock.currentStock - quantity;
      const threshold = productInfo.lowStockThreshold ?? data.lowStockThreshold;
      if (newStockLevel <= threshold) {
        alert(`Warning: Stock for "${productInfo.name}" is low (${newStockLevel} remaining).`);
      }
    }

    setData(prev => {
        const product = prev.products.find(p => p.id === productId);
        if (!product) return prev;
        
        let totalRevenue = product.sellingPrice * quantity;
        const offer = appliedOfferId ? prev.specialOffers.find(o => o.id === appliedOfferId) : undefined;
        
        if (offer) {
            if (offer.type === 'BOGO' && offer.getQuantity) {
                const numberOfBundles = Math.floor(quantity / (offer.buyQuantity + offer.getQuantity));
                const freeItems = numberOfBundles * offer.getQuantity;
                totalRevenue -= freeItems * product.sellingPrice;
            } else if (offer.type === 'BULK_DISCOUNT' && offer.payForQuantity) {
                if (quantity >= offer.buyQuantity) {
                    const numberOfBundles = Math.floor(quantity / offer.buyQuantity);
                    const remainder = quantity % offer.buyQuantity;
                    totalRevenue = (numberOfBundles * offer.payForQuantity * product.sellingPrice) + (remainder * product.sellingPrice);
                }
            }
        }
        
        let totalCost: number;
        const code = costCode ? prev.costCodes.find(c => c.code === costCode) : undefined;
        if (code) {
            totalCost = code.value * quantity;
        } else {
            totalCost = product.unitPrice * quantity;
        }

        const newSale: Sale = {
          id: generateId('s'),
          productId,
          productName: product.name,
          quantity,
          saleDate: saleDate.toISOString(),
          soldBy,
          totalRevenue,
          totalCost,
          profit: totalRevenue - totalCost,
          costCode: costCode || undefined,
          appliedOfferId: offer?.id,
          appliedOfferName: offer?.name,
        };
        
        return { ...prev, sales: [...prev.sales, newSale] };
    });
  };

  const deleteSale = (saleId: string) => {
    setData(prev => ({
      ...prev,
      sales: prev.sales.filter(s => s.id !== saleId),
    }));
  };

  const bulkUpdateStock = (updates: { productId: string; stockToAdd: number; newUnitPrice?: number }[]) => {
      setData(prev => {
          // Calculate current stock levels first to perform Weighted Average Cost (WAC)
          const salesByProduct = prev.sales.reduce((acc, sale) => {
            acc[sale.productId] = (acc[sale.productId] || 0) + sale.quantity;
            return acc;
          }, {} as Record<string, number>);

          return {
              ...prev,
              products: prev.products.map(p => {
                const update = updates.find(u => u.productId === p.id);
                if (!update) return p;
                
                let newPrice = p.unitPrice;
                const stockToAdd = update.stockToAdd;
                
                // Calculate WAC if we have stock to add and a valid new unit price
                if (update.newUnitPrice !== undefined && stockToAdd > 0) {
                    const currentStock = (p.openingStock + p.stockBought) - (salesByProduct[p.id] || 0);
                    // Treat negative stock as zero for valuation purposes to avoid skewing logic
                    const effectiveStock = Math.max(0, currentStock);
                    
                    const currentValuation = effectiveStock * p.unitPrice;
                    const newValuation = stockToAdd * update.newUnitPrice;
                    const totalStock = effectiveStock + stockToAdd;
                    
                    if (totalStock > 0) {
                        newPrice = (currentValuation + newValuation) / totalStock;
                    }
                } else if (update.newUnitPrice !== undefined) {
                     // If just updating price manually (stockToAdd is 0), accept the new price
                     newPrice = update.newUnitPrice;
                }

                return { 
                    ...p, 
                    stockBought: p.stockBought + stockToAdd,
                    unitPrice: parseFloat(newPrice.toFixed(4)) // Keep decent precision for unit cost
                };
              })
          };
      });
  };

  const addCategory = (name: string) => {
    setData(prev => {
      if (prev.categories.includes(name) || !name.trim()) return prev;
      return { ...prev, categories: [...prev.categories, name.trim()] };
    });
  };

  const updateCategory = (oldName: string, newName: string) => {
    setData(prev => {
      const trimmedNewName = newName.trim();
      if (!trimmedNewName || (trimmedNewName !== oldName && prev.categories.includes(trimmedNewName))) {
        if (prev.categories.includes(trimmedNewName)) {
            alert(`A category with the name "${trimmedNewName}" already exists.`);
        }
        return prev;
      }
      return {
        ...prev,
        categories: prev.categories.map(c => c === oldName ? trimmedNewName : c),
        products: prev.products.map(p => p.category === oldName ? { ...p, category: trimmedNewName } : p)
      };
    });
  };

  const deleteCategory = (name: string) => {
    setData(prev => {
        const isCategoryInUse = prev.products.some(p => p.category === name);
        if (isCategoryInUse) {
            alert(`Cannot delete category "${name}" because it is currently in use by one or more products. Please re-assign products to another category first.`);
            return prev;
        }
        return {
            ...prev,
            categories: prev.categories.filter(c => c !== name),
        };
    });
  };
  
  const addSeller = (name: string) => {
    setData(prev => {
      if (prev.sellers.includes(name) || !name.trim()) return prev;
      return { ...prev, sellers: [...prev.sellers, name.trim()] };
    });
  };

  const updateSeller = (oldName: string, newName: string) => {
    setData(prev => {
      const trimmedNewName = newName.trim();
      if (!trimmedNewName || (trimmedNewName !== oldName && prev.sellers.includes(trimmedNewName))) {
        if (prev.sellers.includes(trimmedNewName)) {
            alert(`A seller with the name "${trimmedNewName}" already exists.`);
        }
        return prev;
      }
      return {
        ...prev,
        sellers: prev.sellers.map(s => s === oldName ? trimmedNewName : s),
        sales: prev.sales.map(sale => sale.soldBy === oldName ? { ...sale, soldBy: trimmedNewName } : sale),
        members: prev.members.map(member => member.name === oldName ? { ...member, name: trimmedNewName } : member),
      };
    });
  };

  const deleteSeller = (name: string) => {
    setData(prev => ({
      ...prev,
      sellers: prev.sellers.filter(s => s !== name),
      // Also remove the corresponding member for data consistency.
      members: prev.members.filter(m => m.name !== name),
    }));
  };

  const addMember = (memberData: Omit<Member, 'id' | 'joinDate'>) => {
    setData(prev => {
        if (prev.members.some(m => m.name.toLowerCase() === memberData.name.toLowerCase().trim())) {
            alert(`A member with the name "${memberData.name}" already exists.`);
            return prev;
        }
        const newMember: Member = { 
            ...memberData, 
            name: memberData.name.trim(), 
            id: generateId('m'),
            joinDate: new Date().toISOString()
        };
        return {
            ...prev,
            members: [...prev.members, newMember],
            sellers: [...prev.sellers, newMember.name]
        };
    });
  };

  const addHistoricMember = (memberData: Omit<Member, 'id'>) => {
     setData(prev => {
        if (prev.members.some(m => m.name.toLowerCase() === memberData.name.toLowerCase().trim())) {
            alert(`A member with the name "${memberData.name}" already exists.`);
            return prev;
        }
        const newMember: Member = { 
            ...memberData, 
            name: memberData.name.trim(), 
            id: generateId('m'),
        };
        return {
            ...prev,
            members: [...prev.members, newMember],
            sellers: [...prev.sellers, newMember.name]
        };
    });
  }

  const updateMember = (updatedMember: Member) => {
    setData(prev => {
        const oldMember = prev.members.find(m => m.id === updatedMember.id);
        if (!oldMember) return prev;

        const nameHasChanged = oldMember.name !== updatedMember.name;

        return {
            ...prev,
            members: prev.members.map(m => m.id === updatedMember.id ? updatedMember : m),
            sellers: nameHasChanged 
                ? prev.sellers.map(s => s === oldMember.name ? updatedMember.name : s)
                : prev.sellers,
            sales: nameHasChanged
                ? prev.sales.map(sale => sale.soldBy === oldMember.name ? { ...sale, soldBy: updatedMember.name } : sale)
                : prev.sales,
        };
    });
  };

  const deleteMember = (memberId: string) => {
    setData(prev => {
        const memberToDelete = prev.members.find(m => m.id === memberId);
        if (!memberToDelete) return prev;
        
        return {
            ...prev,
            members: prev.members.filter(m => m.id !== memberId),
            sellers: prev.sellers.filter(s => s !== memberToDelete.name),
        };
    });
  };

  const addSpecialOffer = (offer: Omit<SpecialOffer, 'id'>) => {
    setData(prev => ({
      ...prev,
      specialOffers: [...prev.specialOffers, { ...offer, id: generateId('so') }],
    }));
  };

  const updateSpecialOffer = (updatedOffer: SpecialOffer) => {
    setData(prev => ({
      ...prev,
      specialOffers: prev.specialOffers.map(so => so.id === updatedOffer.id ? updatedOffer : so),
    }));
  };

  const deleteSpecialOffer = (offerId: string) => {
    setData(prev => ({
      ...prev,
      specialOffers: prev.specialOffers.filter(so => so.id !== offerId),
    }));
  };


  const setLowStockThreshold = (value: number) => {
      setData(prev => ({ ...prev, lowStockThreshold: value }));
  };

  const setLowProfitMarginThreshold = (value: number) => {
      setData(prev => ({ ...prev, lowProfitMarginThreshold: value }));
  };

  const setDefaultMembershipFee = (value: number) => {
    setData(prev => ({...prev, defaultMembershipFee: value}));
  }
  
  const updateCostCodes = (codes: CostCode[]) => {
    setData(prev => ({...prev, costCodes: codes}));
  };

  const updateLogo = (newLogo: string | undefined) => {
    setData(prev => ({ ...prev, logo: newLogo }));
  };

  const updateBackgroundImage = (newImage: string | undefined) => {
    setData(prev => ({ ...prev, backgroundImage: newImage }));
  };

  const updateAppName = (newName: string) => {
      setData(prev => ({ ...prev, appName: newName }));
  };

  const updateTheme = (newTheme: AppTheme) => {
      setData(prev => ({ ...prev, theme: newTheme }));
  };

  const manualSave = () => {
    try {
      localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(data));
      alert('All changes have been saved successfully!');
    } catch (error) {
      alert('Error: Could not save changes.');
      console.error("Manual save failed:", error);
    }
  };

  return {
    products: productsWithCurrentStock,
    sales: data.sales,
    categories: data.categories,
    sellers: data.sellers,
    members: data.members,
    costCodes: data.costCodes,
    specialOffers: data.specialOffers,
    updateCostCodes,
    lowStockThreshold: data.lowStockThreshold,
    setLowStockThreshold,
    lowProfitMarginThreshold: data.lowProfitMarginThreshold,
    setLowProfitMarginThreshold,
    defaultMembershipFee: data.defaultMembershipFee,
    setDefaultMembershipFee,
    logo: data.logo,
    updateLogo,
    backgroundImage: data.backgroundImage,
    updateBackgroundImage,
    appName: data.appName || 'Dream Green CSC',
    updateAppName,
    theme: data.theme,
    updateTheme,
    addProduct,
    updateProduct,
    deleteProduct,
    recordSale,
    deleteSale,
    bulkUpdateStock,
    addCategory,
    updateCategory,
    deleteCategory,
    addSeller,
    updateSeller,
    deleteSeller,
    addMember,
    addHistoricMember,
    updateMember,
    deleteMember,
    addSpecialOffer,
    updateSpecialOffer,
    deleteSpecialOffer,
    manualSave,
  };
};
