
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import FrontOfficeApp from './FrontOfficeApp';
import { GlobalStyles } from './components/GlobalStyles';
import { AppTheme } from './types';

const BackOfficeAuth: React.FC<{ children: React.ReactNode; onNavigateToFrontOffice: () => void }> = ({ children, onNavigateToFrontOffice }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [password, setPassword] = useState<string | null>(null);
  const [inputPassword, setInputPassword] = useState('');
  const [error, setError] = useState('');
  const [logo, setLogo] = useState<string | null>(null);
  const [appName, setAppName] = useState('Dream Green CSC');
  const [theme, setTheme] = useState<AppTheme>({ primaryColor: '#10B981', buttonStyle: 'solid' });

  useEffect(() => {
    const stored = localStorage.getItem('dreamGreenCscBackOfficePassword');
    if (stored) {
      setPassword(stored);
      setIsAuthenticated(false);
    } else {
      setIsAuthenticated(true);
    }

    try {
        const storedData = localStorage.getItem('dreamGreenCscStockData');
        if (storedData) {
            const parsed = JSON.parse(storedData);
            if (parsed.logo) {
                setLogo(parsed.logo);
            }
            if (parsed.appName) {
                setAppName(parsed.appName);
            }
            if (parsed.theme && parsed.theme.primaryColor) {
                setTheme(parsed.theme);
            }
        }
    } catch (e) {
        // Ignore error
    }

    setIsLoading(false);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputPassword === password) {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Incorrect password');
    }
  };

  const defaultAppName = 'Dream Green CSC';

  if (isLoading) return null;

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
      <GlobalStyles theme={theme} />
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="text-center mb-6">
            {logo ? (
                <img src={logo} alt="Logo" className="h-16 w-auto mx-auto mb-4 object-contain" />
            ) : null}
             <h1 className="text-2xl font-bold text-gray-800">
              {appName === defaultAppName ? (
                  <>Dream Green <span className="text-dynamic-primary">CSC</span></>
              ) : (
                  appName
              )}
            </h1>
            <h2 className="text-xl font-semibold text-gray-700 mt-2">Back Office Login</h2>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={inputPassword}
              onChange={(e) => setInputPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 border p-2"
              placeholder="Enter password"
              autoFocus
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full text-white py-2 px-4 rounded-md font-medium dynamic-btn"
          >
            Login
          </button>
        </form>
         <div className="mt-6 text-center">
            <button onClick={onNavigateToFrontOffice} className="text-sm text-gray-600 hover:text-dynamic-primary underline">
                Go to Front Office (POS)
            </button>
        </div>
      </div>
    </div>
  );
};

const AppRouter: React.FC = () => {
  const [isFrontOffice, setIsFrontOffice] = useState(false);

  const navigateToFrontOffice = () => setIsFrontOffice(true);
  const navigateToBackOffice = () => setIsFrontOffice(false);

  if (isFrontOffice) {
    return <FrontOfficeApp onNavigateBack={navigateToBackOffice} />;
  }
  return (
    <BackOfficeAuth onNavigateToFrontOffice={navigateToFrontOffice}>
      <App onNavigateToFrontOffice={navigateToFrontOffice} />
    </BackOfficeAuth>
  );
};


const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AppRouter />
  </React.StrictMode>
);
