
import React from 'react';
import { View } from '../types';
import { DashboardIcon, InventoryIcon, SalesIcon, SettingsIcon, SaveIcon, ShoppingCartIcon, UsersIcon } from './icons';

interface HeaderProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  manualSave: () => void;
  onNavigateToFrontOffice: () => void;
  logo?: string;
  appName: string;
}

const Header: React.FC<HeaderProps> = ({ currentView, setCurrentView, manualSave, onNavigateToFrontOffice, logo, appName }) => {
  // FIX: Corrected the icon type to be a more specific `React.ReactElement<{ className?: string }>`.
  // The previous type `React.ReactElement` was not specific enough for TypeScript
  // to infer the element's props, causing an error with `React.cloneElement`.
  const navItems: { view: View; label: string; icon: React.ReactElement<{ className?: string }> }[] = [
    { view: 'dashboard', label: 'Dashboard', icon: <DashboardIcon className="w-5 h-5 mr-2" /> },
    { view: 'inventory', label: 'Inventory', icon: <InventoryIcon className="w-5 h-5 mr-2" /> },
    { view: 'sales', label: 'Sales Log', icon: <SalesIcon className="w-5 h-5 mr-2" /> },
    { view: 'members', label: 'Members', icon: <UsersIcon className="w-5 h-5 mr-2" /> },
    { view: 'settings', label: 'Settings', icon: <SettingsIcon className="w-5 h-5 mr-2" /> },
  ];

  const defaultAppName = 'Dream Green CSC';

  return (
    <header className="bg-white shadow-md sticky top-0 z-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center" title="Go to Settings to edit logo and name">
            {logo ? (
                <img src={logo} alt="Logo" className="w-8 h-8 object-contain mr-2" />
            ) : (
                <svg className="w-8 h-8 text-dynamic-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7.014A8.003 8.003 0 0112 3c2.396 0 4.594.996 6.157 2.614C20.5 7.93 21 11 21 13c-2 1-2.5 3-2.5 3s-3-2-5.5-2.5" />
                </svg>
            )}
            <h1 className="text-2xl font-bold text-gray-800 ml-2">
              {appName === defaultAppName ? (
                  <>Dream Green <span className="text-dynamic-primary">CSC</span></>
              ) : (
                  appName
              )}
            </h1>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <nav className="flex items-center space-x-2">
              {navItems.map(({ view, label, icon }) => (
                <button
                  key={view}
                  onClick={() => setCurrentView(view)}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${
                    currentView === view
                      ? 'bg-dynamic-primary-light text-dynamic-primary'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {icon}
                  {label}
                </button>
              ))}
            </nav>
            <div className="border-l border-gray-200 h-8"></div>
            <button
              onClick={onNavigateToFrontOffice}
              className="flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 text-secondary hover:bg-gray-100"
              title="Go to Front Office Point of Sale"
            >
              <ShoppingCartIcon className="w-5 h-5 mr-2" />
              <span>Front Office</span>
            </button>
            <button
              onClick={manualSave}
              className="flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 text-secondary hover:bg-gray-100"
              title="Save all changes"
            >
              <SaveIcon className="w-5 h-5 mr-2" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </div>
       <nav className="md:hidden bg-white border-t border-gray-200 fixed bottom-0 left-0 right-0 z-20">
            <div className="flex justify-around">
                {navItems.map(({ view, label, icon }) => (
                    <button
                        key={view}
                        onClick={() => setCurrentView(view)}
                        className={`flex flex-col items-center justify-center w-full py-2 text-xs font-medium transition-colors duration-150 ${
                            currentView === view
                                ? 'text-dynamic-primary'
                                : 'text-gray-500'
                        }`}
                    >
                        {/* FIX: Removed the unnecessary 'as React.ReactElement' cast. The type of 'icon' is now correctly inferred from the 'navItems' array. */}
                        {React.cloneElement(icon, { className: 'w-6 h-6 mb-1' })}
                        {label}
                    </button>
                ))}
                 <button
                    onClick={onNavigateToFrontOffice}
                    className="flex flex-col items-center justify-center w-full py-2 text-xs font-medium text-gray-500 transition-colors duration-150"
                    title="Go to Front Office POS"
                >
                    <ShoppingCartIcon className="w-6 h-6 mb-1" />
                    POS
                </button>
                 <button
                    key="save"
                    onClick={manualSave}
                    className="flex flex-col items-center justify-center w-full py-2 text-xs font-medium text-gray-500 transition-colors duration-150"
                    title="Save all changes"
                >
                    <SaveIcon className="w-6 h-6 mb-1" />
                    Save
                </button>
            </div>
        </nav>
    </header>
  );
};

export default Header;
