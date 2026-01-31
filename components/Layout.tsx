
import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  PieChart, 
  LogOut, 
  TrendingUp, 
  ShoppingBag,
  Menu,
  Citrus,
  X,
  CreditCard,
  Store,
  ShoppingCart,
  Palette,
  PackageSearch
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
  currentView: string;
  onNavigate: (view: string) => void;
  showStoreLink?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, onLogout, currentView, onNavigate, showStoreLink }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const handleNavigate = (view: string) => {
    onNavigate(view);
    setIsMobileMenuOpen(false);
  };

  const NavItem = ({ view, icon: Icon, label, color = 'text-brand-600' }: { view: string, icon: any, label: string, color?: string }) => (
    <button 
      onClick={() => handleNavigate(view)}
      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative overflow-hidden mb-1.5 font-medium ${
        currentView === view 
          ? 'text-brand-700 bg-brand-50 shadow-sm border border-brand-200' 
          : 'text-slate-500 hover:text-slate-800 hover:bg-white hover:shadow-sm border border-transparent'
      }`}
    >
      <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 duration-300 ${currentView === view ? color : 'text-slate-400 group-hover:text-brand-500'}`} />
      <span className="font-sans text-sm tracking-wide">{label}</span>
      
      {currentView === view && (
        <div className="absolute right-3 w-1.5 h-1.5 bg-brand-500 rounded-full animate-pulse"></div>
      )}
    </button>
  );

  return (
    <div className="min-h-screen flex font-sans text-slate-800 selection:bg-brand-200 selection:text-brand-900">
      
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-30 md:hidden transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-40 w-72 flex-col bg-white/80 backdrop-blur-xl border-r border-slate-200/60 transition-transform duration-300 ease-out shadow-[4px_0_24px_-4px_rgba(0,0,0,0.03)]
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 md:static md:flex md:h-screen
      `}>
        <div className="p-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-brand-400 to-brand-500 p-2.5 rounded-2xl shadow-lg shadow-brand-500/30 transform rotate-3 hover:rotate-6 transition-transform">
              <Citrus className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-xl leading-none tracking-tight text-slate-800">LEMON BI</h2>
              <p className="text-[10px] text-brand-600 font-bold tracking-widest mt-1 uppercase">Analytics</p>
            </div>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 p-5 space-y-1 overflow-y-auto">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-4 mt-2">
            Análisis
          </div>
          
          <NavItem view="general" icon={LayoutDashboard} label="Dashboard General" />
          <NavItem view="rentabilidad" icon={TrendingUp} label="Rentabilidad" />

          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-4 mt-6">
            Operaciones
          </div>

          <NavItem view="comparativa" icon={Store} label="Sedes y Cajas" />
          <NavItem view="ventas" icon={ShoppingBag} label="Ventas y Pedidos" />
          <NavItem view="pagos" icon={CreditCard} label="Métodos de Pago" />
          <NavItem view="reportes" icon={PieChart} label="Reportes Gráficos" />

          {showStoreLink && (
            <>
              <div className="text-[11px] font-bold text-brand-500 uppercase tracking-widest mb-3 px-4 mt-6">
                Venta Online
              </div>
              <NavItem view="product-manager" icon={PackageSearch} label="Mis Productos" color="text-brand-500" />
              <NavItem view="store-config" icon={Palette} label="Configurar Tienda" color="text-brand-500" />
              <NavItem view="store" icon={ShoppingCart} label="Ver Mi Tienda" color="text-brand-500" />
            </>
          )}
        </nav>

        <div className="p-5 border-t border-slate-100 bg-slate-50/50">
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all group"
          >
            <LogOut className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
            <span className="font-sans text-sm font-medium">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 transition-all w-full h-screen overflow-y-auto relative z-10 scroll-smooth">
        <div className="md:hidden bg-white/90 backdrop-blur-md border-b border-slate-200 text-slate-800 p-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-2">
            <Citrus className="w-6 h-6 text-brand-500" />
            <span className="font-bold text-lg">LEMON BI</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(true)} className="text-slate-500 hover:text-slate-800">
            <Menu className="w-6 h-6" />
          </button>
        </div>
        {children}
      </main>
    </div>
  );
};

export default Layout;
