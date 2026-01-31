
import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import Layout from './components/Layout';
import AdminDashboard from './components/AdminDashboard';
import StoreView from './components/StoreView';
import StoreSettings from './components/StoreSettings';
import ProductManager from './components/ProductManager';
import { OdooSession, ClientConfig } from './types';
import { getClientByCode } from './services/clientManager';
import { OdooClient } from './services/odoo';
// Import Loader2 icon from lucide-react
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [odooSession, setOdooSession] = useState<OdooSession | null>(null);
  const [clientConfig, setClientConfig] = useState<ClientConfig | null>(null);
  const [currentView, setCurrentView] = useState('general');
  const [isStoreMode, setIsStoreMode] = useState(false);
  const [isStoreLoading, setIsStoreLoading] = useState(false);

  // Verificar modo tienda por URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shopCode = params.get('shop');
    if (shopCode) {
      initStoreMode(shopCode.toUpperCase());
    }
  }, []);

  const initStoreMode = async (code: string) => {
    setIsStoreLoading(true);
    const config = await getClientByCode(code);
    if (config && config.isActive) {
      setClientConfig(config);
      try {
        // Fix line 40: constructor expects 2 arguments
        const client = new OdooClient(config.url, config.db);
        const uid = await client.authenticate(config.username, config.apiKey);
        if (uid) {
          const companiesData: any[] = await client.searchRead(uid, config.apiKey, 'res.company', [], ['name']);
          const found = config.companyFilter === 'ALL' ? companiesData[0] : companiesData.find(c => c.name.toUpperCase().includes(config.companyFilter.toUpperCase()));
          
          setOdooSession({
            url: config.url,
            db: config.db,
            username: config.username,
            apiKey: config.apiKey,
            uid: uid,
            useProxy: true,
            companyId: found ? found.id : companiesData[0].id,
            companyName: found ? found.name : companiesData[0].name
          });
          setIsStoreMode(true);
        }
      } catch (e) {
        console.error("Store Auth Error", e);
        alert("Error al conectar con la tienda. Intente más tarde.");
      }
    }
    setIsStoreLoading(false);
  };

  const handleLogin = (session: OdooSession | null, config: ClientConfig) => {
    setOdooSession(session);
    setClientConfig(config);
    setIsAdmin(false);
    setIsAuthenticated(true);
  };

  const handleAdminLogin = () => {
    setOdooSession(null);
    setIsAdmin(true);
    setIsAuthenticated(true);
  }

  const handleLogout = () => {
    setOdooSession(null);
    setClientConfig(null);
    setIsAdmin(false);
    setIsAuthenticated(false);
    setIsStoreMode(false);
    setCurrentView('general');
    
    // Safety wrap for pushState which can fail in sandboxed or blob-origin environments
    try {
      window.history.pushState({}, '', window.location.pathname);
    } catch (e) {
      console.warn("Could not update history state: restricted environment.");
    }
  };

  if (isStoreLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-brand-500 mb-4" />
        <p className="font-bold text-slate-600 animate-pulse uppercase tracking-widest text-xs">Cargando Catálogo...</p>
      </div>
    );
  }

  if (isStoreMode && clientConfig && odooSession) {
    return <StoreView session={odooSession} config={clientConfig} />;
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} onAdminLogin={handleAdminLogin} />;
  }

  if (isAdmin) {
      return <AdminDashboard onLogout={handleLogout} />;
  }

  return (
    <div className="antialiased text-slate-800 bg-slate-50 min-h-screen">
      <Layout onLogout={handleLogout} currentView={currentView} onNavigate={setCurrentView} showStoreLink={clientConfig?.showStore}>
        {currentView === 'store' && odooSession && clientConfig ? (
           <StoreView session={odooSession} config={clientConfig} onBack={() => setCurrentView('general')} />
        ) : currentView === 'product-manager' && odooSession && clientConfig ? (
           <ProductManager session={odooSession} config={clientConfig} onUpdate={setClientConfig} />
        ) : currentView === 'store-config' && clientConfig ? (
           <StoreSettings config={clientConfig} onUpdate={setClientConfig} />
        ) : (
          <Dashboard session={odooSession} view={currentView} />
        )}
      </Layout>
    </div>
  );
};

export default App;
