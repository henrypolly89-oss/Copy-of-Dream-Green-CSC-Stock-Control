
import React, { useState } from 'react';
import { View } from './types';
import { useStockData } from './hooks/useStockData';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import SalesLog from './components/SalesLog';
import Settings from './components/Settings';
import Members from './components/Members';
import { GlobalStyles } from './components/GlobalStyles';

interface AppProps {
  onNavigateToFrontOffice: () => void;
}

const App: React.FC<AppProps> = ({ onNavigateToFrontOffice }) => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const { 
    products, 
    sales, 
    categories,
    sellers,
    members,
    costCodes,
    specialOffers,
    updateCostCodes,
    lowStockThreshold,
    setLowStockThreshold,
    lowProfitMarginThreshold,
    setLowProfitMarginThreshold,
    defaultMembershipFee,
    setDefaultMembershipFee,
    logo,
    updateLogo,
    backgroundImage,
    updateBackgroundImage,
    appName,
    updateAppName,
    theme,
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
    addHistoricMember,
    updateMember,
    deleteMember,
    addSpecialOffer,
    updateSpecialOffer,
    deleteSpecialOffer,
    manualSave,
  } = useStockData();

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard products={products} sales={sales} members={members} />;
      case 'inventory':
        return <Inventory 
                  products={products} 
                  sales={sales}
                  categories={categories}
                  sellers={sellers}
                  costCodes={costCodes}
                  specialOffers={specialOffers}
                  addProduct={addProduct} 
                  updateProduct={updateProduct} 
                  recordSale={recordSale}
                  lowStockThreshold={lowStockThreshold}
                  lowProfitMarginThreshold={lowProfitMarginThreshold}
                />;
      case 'sales':
        return <SalesLog sales={sales} deleteSale={deleteSale} />;
      case 'members':
        return <Members 
                  members={members}
                  addHistoricMember={addHistoricMember}
                  updateMember={updateMember}
                  deleteMember={deleteMember}
                  defaultMembershipFee={defaultMembershipFee}
                />;
      case 'settings':
        return <Settings 
                  products={products}
                  sales={sales}
                  categories={categories}
                  sellers={sellers}
                  costCodes={costCodes}
                  specialOffers={specialOffers}
                  updateCostCodes={updateCostCodes}
                  addProduct={addProduct}
                  updateProduct={updateProduct}
                  deleteProduct={deleteProduct}
                  bulkUpdateStock={bulkUpdateStock}
                  addCategory={addCategory}
                  updateCategory={updateCategory}
                  deleteCategory={deleteCategory}
                  addSeller={addSeller}
                  updateSeller={updateSeller}
                  deleteSeller={deleteSeller}
                  addSpecialOffer={addSpecialOffer}
                  updateSpecialOffer={updateSpecialOffer}
                  deleteSpecialOffer={deleteSpecialOffer}
                  lowStockThreshold={lowStockThreshold}
                  setLowStockThreshold={setLowStockThreshold}
                  lowProfitMarginThreshold={lowProfitMarginThreshold}
                  setLowProfitMarginThreshold={setLowProfitMarginThreshold}
                  defaultMembershipFee={defaultMembershipFee}
                  setDefaultMembershipFee={setDefaultMembershipFee}
                  logo={logo}
                  updateLogo={updateLogo}
                  backgroundImage={backgroundImage}
                  updateBackgroundImage={updateBackgroundImage}
                  appName={appName}
                  updateAppName={updateAppName}
                />;
      default:
        return <Dashboard products={products} sales={sales} members={members} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <GlobalStyles theme={theme} />
      <Header currentView={currentView} setCurrentView={setCurrentView} manualSave={manualSave} onNavigateToFrontOffice={onNavigateToFrontOffice} logo={logo} appName={appName} />
      <main className="container mx-auto pb-20 md:pb-0">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
