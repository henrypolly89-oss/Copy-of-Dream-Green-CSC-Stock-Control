
import React, { useState, useMemo } from 'react';
import { useStockData } from './hooks/useStockData';
import { Product, Member, CostCode, SpecialOffer } from './types';
import Modal from './components/Modal';
import { DeleteIcon, UserPlusIcon, ShoppingCartIcon, SettingsIcon } from './components/icons';
import { GlobalStyles } from './components/GlobalStyles';

interface CartItem extends Product {
  quantity: number;
  currentStock: number;
  costCode?: string;
  appliedOfferId?: string;
}

interface FrontOfficeAppProps {
  onNavigateBack?: () => void;
}

const FrontOfficeApp: React.FC<FrontOfficeAppProps> = ({ onNavigateBack }) => {
  const { products, categories, sellers, costCodes, specialOffers, recordSale, addMember, defaultMembershipFee, logo, appName, theme, backgroundImage } = useStockData();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentSeller, setCurrentSeller] = useState('');
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [saleTime, setSaleTime] = useState(new Date().toTimeString().split(' ')[0].substring(0, 5));
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const initialMemberFormState: Omit<Member, 'id' | 'joinDate'> = useMemo(() => ({
    name: '',
    email: '',
    dateOfBirth: '',
    nationality: '',
    sex: 'Prefer not to say',
    idType: 'National ID',
    idNumber: '',
    membershipFee: defaultMembershipFee,
  }), [defaultMembershipFee]);

  const [newMemberForm, setNewMemberForm] = useState(initialMemberFormState);

  const openMemberModal = () => {
    setNewMemberForm(initialMemberFormState);
    setIsMemberModalOpen(true);
  };

  const addToCart = (product: Product & { currentStock: number }) => {
    if (product.currentStock <= 0) {
        alert(`${product.name} is out of stock.`);
        return;
    }
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        if (existingItem.quantity < product.currentStock) {
           return prevCart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
        } else {
           alert(`Cannot add more ${product.name}. Stock limit reached.`);
           return prevCart;
        }
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const updateCartQuantity = (productId: string, newQuantity: number) => {
    setCart(prevCart => {
       const productInStock = products.find(p => p.id === productId);
       if (newQuantity <= 0) {
           return prevCart.filter(item => item.id !== productId);
       }
       if (productInStock && newQuantity > productInStock.currentStock) {
           alert(`Only ${productInStock.currentStock} units of ${productInStock.name} available.`);
           return prevCart.map(item => item.id === productId ? { ...item, quantity: productInStock.currentStock } : item);
       }
       return prevCart.map(item => item.id === productId ? { ...item, quantity: newQuantity } : item);
    });
  };

  const updateCartCostCode = (productId: string, costCode: string) => {
    setCart(prevCart => prevCart.map(item =>
        item.id === productId ? { ...item, costCode: costCode || undefined } : item
    ));
  };

  const updateCartAppliedOffer = (productId: string, offerId: string) => {
    setCart(prevCart => prevCart.map(item =>
        item.id === productId ? { ...item, appliedOfferId: offerId || undefined } : item
    ));
  };
  
  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.id !== productId));
  };
  
  const handleRecordSale = () => {
    if (cart.length === 0) {
        alert("The cart is empty.");
        return;
    }
    if (!currentSeller) {
        alert("Please select a seller.");
        return;
    }
    
    const dateTimeString = `${saleDate}T${saleTime}`;
    const finalSaleDate = new Date(dateTimeString);

    cart.forEach(item => {
        recordSale(item.id, item.quantity, finalSaleDate, currentSeller, item.costCode, item.appliedOfferId);
    });

    alert("Sale recorded successfully!");
    setCart([]);
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMemberForm.name.trim()) {
        addMember(newMemberForm);
        setCurrentSeller(newMemberForm.name.trim());
        setNewMemberForm(initialMemberFormState);
        setIsMemberModalOpen(false);
    }
  };

  const handleMemberFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'membershipFee') {
        setNewMemberForm(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
        setNewMemberForm(prev => ({ ...prev, [name]: value }));
    }
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

  const { cartTotal, cartTotalCost, cartTotalProfit } = useMemo(() => {
    let totalRevenue = 0;
    let totalCost = 0;

    cart.forEach(item => {
        let itemRevenue = item.sellingPrice * item.quantity;
        const offer = item.appliedOfferId ? specialOffers.find(o => o.id === item.appliedOfferId) : undefined;
        
        if (offer) {
            if (offer.type === 'BOGO' && offer.getQuantity) {
                const numberOfBundles = Math.floor(item.quantity / (offer.buyQuantity + offer.getQuantity));
                const freeItems = numberOfBundles * offer.getQuantity;
                itemRevenue -= freeItems * item.sellingPrice;
            } else if (offer.type === 'BULK_DISCOUNT' && offer.payForQuantity) {
                 if (item.quantity >= offer.buyQuantity) {
                    const numberOfBundles = Math.floor(item.quantity / offer.buyQuantity);
                    const remainder = item.quantity % offer.buyQuantity;
                    itemRevenue = (numberOfBundles * offer.payForQuantity * item.sellingPrice) + (remainder * item.sellingPrice);
                }
            }
        }
        totalRevenue += itemRevenue;

        const code = item.costCode ? costCodes.find(c => c.code === item.costCode) : undefined;
        const itemCost = code ? code.value : item.unitPrice;
        totalCost += itemCost * item.quantity;
    });

    const totalProfit = totalRevenue - totalCost;

    return { 
      cartTotal: totalRevenue, 
      cartTotalCost: totalCost, 
      cartTotalProfit: totalProfit 
    };
  }, [cart, costCodes, specialOffers]);
  
  const filteredProducts = useMemo(() => {
    if (!selectedCategory) {
        return [];
    }
    return products
        .filter(p => p.category === selectedCategory && p.name.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => a.name.localeCompare(b.name));
  }, [products, searchTerm, selectedCategory]);

  const defaultAppName = 'Dream Green CSC';

  return (
    <div className="flex flex-col h-screen font-sans">
      <GlobalStyles theme={theme} />
      <header className="bg-white shadow-md w-full p-4 flex justify-between items-center">
        <div className="flex items-center">
            {logo ? (
                 <img src={logo} alt="Logo" className="w-8 h-8 object-contain mr-2" />
            ) : (
                <svg className="w-8 h-8 text-dynamic-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7.014A8.003 8.003 0 0112 3c2.396 0 4.594.996 6.157 2.614C20.5 7.93 21 11 21 13c-2 1-2.5 3-2.5 3s-3-2-5.5-2.5" />
                </svg>
            )}
            <h1 className="text-2xl font-bold text-gray-800 ml-2">
              {appName === defaultAppName ? (
                  <>Dream Green <span className="text-dynamic-primary">POS</span></>
              ) : (
                  <span>{appName} <span className="text-gray-500 text-lg">POS</span></span>
              )}
            </h1>
        </div>
         <div className="flex-grow max-w-sm">
            <input 
                type="text" 
                placeholder="Search products..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-full focus:ring-primary focus:border-primary"
            />
        </div>
        <div className="flex items-center space-x-2">
             <button 
                onClick={onNavigateBack}
                className="opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity duration-200 px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg shadow-md hover:bg-gray-300"
            >
                Back Office
            </button>
            <button onClick={openMemberModal} className="flex items-center px-4 py-2 bg-secondary text-white font-semibold rounded-lg shadow-md hover:bg-gray-600 transition-colors">
                <UserPlusIcon className="w-5 h-5 mr-2" />
                Add Member
            </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Content: Category or Product Grid */}
        <main className="flex-1 overflow-hidden relative">
          {selectedCategory === null ? (
            <div className="h-full w-full overflow-y-auto p-4 relative flex flex-col justify-center items-center">
                 {/* Background Layer */}
                 {backgroundImage && (
                    <div 
                        className="absolute inset-0 z-0"
                        style={{
                            backgroundImage: `url(${backgroundImage})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                        }}
                    >
                         <div className="absolute inset-0 bg-black/40"></div>
                    </div>
                )}
                <div className="relative z-10 w-full max-w-5xl">
                    <h2 className={`text-2xl font-bold mb-6 text-center ${backgroundImage ? 'text-white drop-shadow-md' : 'text-gray-700'}`}>Select a Category</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                        {categories.sort().map(category => (
                        <div
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className="bg-white rounded-lg shadow-sm p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105"
                        >
                            <h3 className="font-semibold text-xl text-gray-800">{category}</h3>
                        </div>
                        ))}
                    </div>
                </div>
            </div>
          ) : (
            <div className="h-full w-full overflow-y-auto p-4">
              <div className="flex items-center mb-4">
                  <button 
                    onClick={() => setSelectedCategory(null)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg shadow-sm hover:bg-gray-300 transition-colors mr-4"
                  >
                    &larr; Back to Categories
                  </button>
                  <h2 className="text-2xl font-bold text-gray-700">{selectedCategory}</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredProducts.map(product => (
                  <div
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className={`bg-white rounded-lg shadow-sm p-4 flex flex-col items-center justify-between cursor-pointer transition-all duration-200 ${product.currentStock > 0 ? 'hover:shadow-lg hover:scale-105' : 'opacity-50 cursor-not-allowed'}`}
                  >
                    <div className="text-center">
                      <h3 className="font-semibold text-gray-800">{product.name}</h3>
                      <p className="text-dynamic-primary font-bold text-lg mt-1">€{product.sellingPrice.toFixed(2)}</p>
                    </div>
                    <div className={`text-xs font-medium px-2 py-1 rounded-full mt-2 ${product.currentStock > (product.lowStockThreshold ?? 5) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      Stock: {product.currentStock}
                    </div>
                  </div>
                ))}
                 {filteredProducts.length === 0 && (
                    <p className="text-gray-500 col-span-full">No products found for "{searchTerm}" in this category.</p>
                )}
              </div>
            </div>
          )}
        </main>

        {/* Cart */}
        <aside className="w-full md:w-1/3 lg:w-1/4 bg-white p-4 shadow-lg flex flex-col">
          <h2 className="text-xl font-bold text-gray-800 border-b pb-2 mb-4 flex items-center"><ShoppingCartIcon className="w-6 h-6 mr-2" /> Current Sale</h2>
          <div className="flex-1 overflow-y-auto">
            {cart.length === 0 ? (
                <p className="text-gray-500 text-center mt-8">Your cart is empty.</p>
            ) : (
                <div className="space-y-4">
                    {cart.map(item => {
                      const availableOffers = specialOffers.filter(so => so.productId === item.id && isOfferActive(so));
                      return (
                        <div key={item.id} className="flex flex-col p-2 bg-gray-50 rounded-md">
                           <div className="flex items-center justify-between">
                             <div>
                                <p className="font-semibold text-gray-800">{item.name}</p>
                                <p className="text-sm text-gray-500">€{item.sellingPrice.toFixed(2)}</p>
                            </div>
                            <div className="flex items-center">
                                <input 
                                    type="number" 
                                    step="0.5"
                                    value={item.quantity}
                                    min="0.5"
                                    max={item.currentStock}
                                    onChange={(e) => updateCartQuantity(item.id, parseFloat(e.target.value))}
                                    className="w-16 text-center border-gray-300 rounded-md"
                                />
                                <button onClick={() => removeFromCart(item.id)} className="ml-2 text-red-500 hover:text-red-700">
                                    <DeleteIcon className="w-5 h-5"/>
                                </button>
                            </div>
                           </div>
                           <div className="mt-2 grid grid-cols-2 gap-2">
                                <select 
                                    id={`costCode-${item.id}`}
                                    value={item.costCode || ''}
                                    onChange={(e) => updateCartCostCode(item.id, e.target.value)}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm text-xs py-1"
                                >
                                    <option value="">Default Cost</option>
                                    {costCodes.map(c => <option key={c.code} value={c.code}>{c.code} (€{c.value.toFixed(2)})</option>)}
                                </select>
                                <select
                                    id={`offer-${item.id}`}
                                    value={item.appliedOfferId || ''}
                                    onChange={(e) => updateCartAppliedOffer(item.id, e.target.value)}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm text-xs py-1"
                                    disabled={availableOffers.length === 0}
                                >
                                    <option value="">Apply Offer</option>
                                    {availableOffers.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                                </select>
                           </div>
                        </div>
                    )})}
                </div>
            )}
          </div>
          <div className="border-t pt-4 mt-4 space-y-3">
             <div className="flex justify-between items-center text-2xl font-bold">
              <span>Total:</span>
              <span>€{cartTotal.toFixed(2)}</span>
            </div>

            <div className="text-sm text-gray-500 border-t pt-3 space-y-1">
                 <div className="flex justify-between">
                    <span>Total Cost:</span>
                    <span className="font-medium text-gray-700">€{cartTotalCost.toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between">
                    <span>Est. Profit:</span>
                    <span className="font-medium text-green-700">€{cartTotalProfit.toFixed(2)}</span>
                 </div>
            </div>
            
            <div className="pt-2 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label htmlFor="saleDate" className="block text-sm font-medium text-gray-700">Date</label>
                      <input 
                          type="date" 
                          id="saleDate" 
                          name="saleDate"
                          value={saleDate} 
                          onChange={(e) => setSaleDate(e.target.value)} 
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      />
                  </div>
                  <div>
                      <label htmlFor="saleTime" className="block text-sm font-medium text-gray-700">Time</label>
                      <input 
                          type="time" 
                          id="saleTime" 
                          name="saleTime"
                          value={saleTime} 
                          onChange={(e) => setSaleTime(e.target.value)} 
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      />
                  </div>
              </div>

              <div>
                  <label htmlFor="currentSeller" className="block text-sm font-medium text-gray-700">Seller</label>
                  <select id="currentSeller" value={currentSeller} onChange={(e) => setCurrentSeller(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm">
                      <option value="" disabled>Select Seller</option>
                      {sellers.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
              </div>

              <button onClick={handleRecordSale} disabled={cart.length === 0 || !currentSeller} className="w-full py-3 dynamic-btn text-white font-bold rounded-lg shadow-md transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed">
                Record Sale
              </button>
            </div>
          </div>
        </aside>
      </div>
      
       <Modal isOpen={isMemberModalOpen} onClose={() => setIsMemberModalOpen(false)} title="Add New Member">
          <form onSubmit={handleAddMember}>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
                <input type="text" name="name" id="name" value={newMemberForm.name} onChange={handleMemberFormChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                <input type="email" name="email" id="email" value={newMemberForm.email} onChange={handleMemberFormChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
              </div>
              <div>
                <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">Date of Birth</label>
                <input type="date" name="dateOfBirth" id="dateOfBirth" value={newMemberForm.dateOfBirth} onChange={handleMemberFormChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
              </div>
              <div>
                <label htmlFor="nationality" className="block text-sm font-medium text-gray-700">Nationality</label>
                <input type="text" name="nationality" id="nationality" value={newMemberForm.nationality} onChange={handleMemberFormChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
              </div>
              <div>
                <label htmlFor="sex" className="block text-sm font-medium text-gray-700">Sex</label>
                <select name="sex" id="sex" value={newMemberForm.sex} onChange={handleMemberFormChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm">
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                  <option>Prefer not to say</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="idType" className="block text-sm font-medium text-gray-700">ID Type</label>
                  <select name="idType" id="idType" value={newMemberForm.idType} onChange={handleMemberFormChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm">
                    <option>National ID</option>
                    <option>Passport</option>
                    <option>Driving License</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="idNumber" className="block text-sm font-medium text-gray-700">ID Number</label>
                  <input type="text" name="idNumber" id="idNumber" value={newMemberForm.idNumber} onChange={handleMemberFormChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
                </div>
              </div>
              <div>
                <label htmlFor="membershipFee" className="block text-sm font-medium text-gray-700">Membership Fee (€)</label>
                <input type="number" step="0.01" name="membershipFee" id="membershipFee" value={newMemberForm.membershipFee} onChange={handleMemberFormChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
              </div>
            </div>
            <div className="mt-6 flex justify-end">
                <button type="button" onClick={() => setIsMemberModalOpen(false)} className="mr-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white dynamic-btn rounded-md shadow-sm">Add Member</button>
            </div>
          </form>
      </Modal>
    </div>
  );
};

export default FrontOfficeApp;
