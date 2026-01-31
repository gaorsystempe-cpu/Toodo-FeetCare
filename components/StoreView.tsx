
import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShoppingCart, Package, Search, X, Image as ImageIcon, ArrowLeft, 
  Citrus, Plus, Minus, Info, MapPin, 
  MessageCircle, ShieldCheck, 
  Star, Rocket, Facebook, Instagram
} from 'lucide-react';
import { Producto, CartItem, OdooSession, ClientConfig } from '../types';
import { OdooClient } from '../services/odoo';

interface StoreViewProps {
  session: OdooSession;
  config: ClientConfig;
  onBack?: () => void;
}

const StoreView: React.FC<StoreViewProps> = ({ session, config, onBack }) => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<'catalog' | 'shipping' | 'payment' | 'success'>('catalog');
  
  const [customerData] = useState({ 
    nombre: '', 
    telefono: '', 
    direccion: '', 
    notas: '', 
    metodoEntrega: 'delivery' as 'delivery' | 'pickup', 
    sedeId: '' 
  });
  const [paymentMethod] = useState<'yape' | 'plin' | 'transferencia' | null>(null);
  const [comprobante] = useState<File | null>(null);
  const [isSubmitting] = useState(false);

  // Paleta de colores dinámica
  const colorP = config?.colorPrimario || '#84cc16'; 
  const colorS = config?.colorSecundario || '#0F172A';
  const colorA = config?.colorAcento || '#0ea5e9';
  
  const hiddenIds = useMemo(() => (config?.hiddenProducts || []).map(id => Number(id)), [config?.hiddenProducts]);
  const hiddenCats = useMemo(() => (config?.hiddenCategories || []).map(c => c.trim().toUpperCase()), [config?.hiddenCategories]);

  const fetchProducts = async () => {
    if (!session) return;
    setLoading(true);
    // Fix line 50: constructor expects 2 arguments
    const client = new OdooClient(session.url, session.db);
    const context = session.companyId ? { allowed_company_ids: [session.companyId], company_id: session.companyId } : {};

    const coreFields = ['display_name', 'list_price', 'categ_id', 'image_128', 'description_sale'];
    const extraFields = ['qty_available', 'x_registro_sanitario', 'x_laboratorio', 'x_principio_activo'];

    try {
      let data: any[] = [];
      const configCategory = (config.tiendaCategoriaNombre || '').trim();

      try {
        const domain: any[] = [['sale_ok', '=', true]];
        let finalDomain = [...domain];
        if (configCategory && !['TODAS', 'CATALOGO', ''].includes(configCategory.toUpperCase())) {
          // Attempting to filter by category if specified
          data = await client.searchRead(session.uid, session.apiKey, 'product.product', finalDomain, [...coreFields, ...extraFields], { limit: 500, context });
        } else {
          data = await client.searchRead(session.uid, session.apiKey, 'product.product', finalDomain, [...coreFields, ...extraFields], { limit: 500, context });
        }
      } catch (e: any) {
        data = await client.searchRead(session.uid, session.apiKey, 'product.product', [['sale_ok', '=', true]], coreFields, { limit: 500, context });
      }

      const mapped = data.map((p: any) => ({
        id: Number(p.id),
        nombre: p.display_name,
        precio: p.list_price || 0,
        costo: 0,
        categoria: Array.isArray(p.categ_id) ? p.categ_id[1] : 'General',
        stock: p.qty_available || 0,
        imagen: p.image_128,
        descripcion_venta: p.description_sale || '',
        registro_sanitario: p.x_registro_sanitario || '',
        laboratorio: p.x_laboratorio || (Array.isArray(p.categ_id) ? p.categ_id[1] : 'Laboratorio'),
        principio_activo: p.x_principio_activo || '',
        presentacion: p.display_name.split(',').pop()?.trim() || ''
      }));
      setProductos(mapped);
    } catch (e) {
      console.error("Error crítico:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [session, config.tiendaCategoriaNombre]);

  const filteredProducts = useMemo(() => {
    return productos.filter(p => {
      if (hiddenIds.includes(p.id)) return false;
      const catName = (p.categoria || 'General').trim().toUpperCase();
      if (hiddenCats.includes(catName)) return false;
      if (searchTerm && !p.nombre.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });
  }, [productos, searchTerm, hiddenIds, hiddenCats]);

  const addToCart = (p: Producto, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCart(prev => {
      const exists = prev.find(item => item.producto.id === p.id);
      if (exists) return prev.map(item => item.producto.id === p.id ? { ...item, cantidad: item.cantidad + 1 } : item);
      return [...prev, { producto: p, cantidad: 1 }];
    });
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart(prev => prev.map(item => 
      item.producto.id === productId ? { ...item, cantidad: Math.max(1, item.cantidad + delta) } : item
    ));
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.producto.id !== productId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.producto.precio * item.cantidad), 0);

  const handleSubmitOrder = async () => {
    if (!paymentMethod || !comprobante) {
      alert("Completa el pago.");
      return;
    }
    console.log("Submit order", customerData, isSubmitting);
  };

  if (!config || !session) return null;

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans text-slate-800 flex flex-col overflow-x-hidden relative">
      
      {/* WHATSAPP FLOAT */}
      <a 
        href={`https://wa.me/${config.whatsappNumbers?.split(',')[0] || '51975615244'}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-8 right-8 z-[60] group flex items-center gap-3"
      >
        <div className="bg-white px-4 py-2 rounded-2xl shadow-xl border border-slate-100 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 pointer-events-none">
          <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest whitespace-nowrap">¿Necesitas ayuda?</p>
        </div>
        <div className="w-16 h-16 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all" style={{backgroundColor: '#10B981'}}>
           <MessageCircle className="w-8 h-8 fill-white/20" />
           <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-20"></div>
        </div>
      </a>

      {/* TOP BANNER */}
      <div className="text-white py-2 text-center overflow-hidden" style={{backgroundColor: colorS}}>
        <div className="animate-pulse flex items-center justify-center gap-4">
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">🚚 Envíos seguros a domicilio</span>
          <div className="h-1 w-1 bg-white/30 rounded-full"></div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">🔒 Pagos Garantizados</span>
        </div>
      </div>

      {/* HEADER */}
      <header className="bg-white/95 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-40 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {onBack && (
              <button onClick={onBack} className="p-2.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-all">
                <ArrowLeft className="w-5 h-5"/>
              </button>
            )}
            <div className="flex items-center gap-3">
               {config.logoUrl ? (
                 <img src={config.logoUrl} className="h-9 md:h-11 rounded-lg object-contain" alt="Logo" />
               ) : (
                 <div className="p-2 rounded-xl text-white shadow-lg" style={{backgroundColor: colorP}}>
                   <Citrus className="w-5 h-5" />
                 </div>
               )}
               <div className="hidden sm:block">
                 <h1 className="font-black text-slate-900 uppercase text-xs md:text-sm tracking-tighter leading-none">
                    {config.nombreComercial || config.code}
                 </h1>
                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Tienda Oficial</p>
               </div>
            </div>
          </div>

          <div className="flex-1 max-w-xl hidden md:block relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <input 
              type="text" 
              placeholder="Encuentra lo que buscas..." 
              className="w-full pl-11 pr-4 py-3 bg-slate-100/50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:bg-white transition-all text-sm font-medium" 
              style={{'--tw-ring-color': colorP} as any}
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsCartOpen(true)} 
              className="relative p-3 bg-slate-100 rounded-2xl transition-all hover:bg-slate-900 hover:text-white group"
            >
              <ShoppingCart className="w-5 h-5 text-slate-600 group-hover:text-white" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center animate-bounce shadow-lg" style={{backgroundColor: colorA}}>
                  {cart.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 space-y-12">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {[1,2,3,4,5,6,7,8,9,10].map(i => <div key={i} className="bg-white rounded-[2rem] aspect-[3/4] animate-pulse border border-slate-100"></div>)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 animate-in fade-in duration-500">
            {filteredProducts.map(p => (
              <div key={p.id} onClick={() => setSelectedProduct(p)} className="group relative bg-white rounded-[2rem] p-4 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-500 cursor-pointer flex flex-col">
                <div className="aspect-square bg-slate-50 rounded-[1.5rem] mb-4 overflow-hidden relative flex items-center justify-center">
                  {p.imagen ? <img src={`data:image/png;base64,${p.imagen}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={p.nombre} /> : <Package className="w-10 h-10 text-slate-100"/>}
                  <button onClick={(e) => addToCart(p, e)} className="absolute bottom-3 right-3 p-3 bg-white rounded-xl shadow-lg text-slate-800 hover:text-white transition-all md:opacity-0 group-hover:opacity-100" style={{'--hover-bg': colorA} as any} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colorA)} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'white')}><Plus className="w-4 h-4"/></button>
                </div>
                <div className="flex-1 px-1">
                  <span className="text-[9px] font-black uppercase tracking-widest mb-1 block" style={{color: colorP}}>{p.categoria}</span>
                  <h3 className="text-xs font-bold text-slate-800 line-clamp-2 leading-tight h-8 mb-3">{p.nombre}</h3>
                  <div className="mt-auto flex items-center justify-between pt-2 border-t border-slate-50">
                    <span className="text-sm font-black text-slate-900">S/ {p.precio.toFixed(2)}</span>
                    <Info className="w-4 h-4 text-slate-200 group-hover:text-slate-400 transition-colors" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="text-white mt-12 py-8 border-t border-white/5" style={{backgroundColor: colorS}}>
        <div className="max-w-6xl mx-auto px-6">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
              <div className="flex items-center gap-3">
                 <div className="p-2 rounded-xl shadow-lg" style={{backgroundColor: colorP}}>
                   {config.logoUrl ? (
                     <img src={config.logoUrl} className="w-5 h-5 object-contain brightness-0 invert" alt="logo" />
                   ) : (
                     <Citrus className="w-5 h-5 text-white" />
                   )}
                 </div>
                 <div className="flex flex-col">
                    <span className="font-black text-lg tracking-tighter uppercase leading-none">{config.nombreComercial || config.code}</span>
                    <p className="text-[9px] text-slate-400 font-medium max-w-xs mt-1 leading-relaxed">
                      {config.footer_description}
                    </p>
                 </div>
              </div>

              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                 <div className="space-y-0.5">
                   <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Soporte al Cliente</h4>
                   <p className="text-xs text-slate-400 font-medium">{config.support_text}</p>
                 </div>
                 
                 <div className="flex flex-col items-start md:items-end gap-1.5">
                   <a 
                     href={`https://wa.me/${config.whatsappNumbers?.split(',')[0] || '51975615244'}`} 
                     className="inline-flex items-center justify-center gap-2 text-white px-5 py-3 rounded-xl font-black text-[10px] uppercase shadow-xl hover:brightness-110 transition-all active:scale-95"
                     style={{backgroundColor: '#10B981'}}
                   >
                      <MessageCircle className="w-4 h-4 fill-white/20"/> {config.whatsappNumbers?.split(',')[0] || 'Chatear Ahora'}
                   </a>
                   <div className="flex gap-4 pr-1">
                      {config.facebook_url && <a href={config.facebook_url} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-white transition-colors"><Facebook className="w-4 h-4"/></a>}
                      {config.instagram_url && <a href={config.instagram_url} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-white transition-colors"><Instagram className="w-4 h-4"/></a>}
                   </div>
                 </div>
              </div>
           </div>

           <div className="mt-8 pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.3em]">
                &copy; 2025 {config.nombreComercial || config.code}.
              </p>
              <div className="flex items-center gap-8">
                 <div className="flex items-center gap-1.5 text-slate-500">
                   <Star className="w-3 h-3" style={{fill: colorA, color: colorA}} />
                   <span className="text-[9px] font-black uppercase tracking-[0.2em]">Tienda Certificada</span>
                 </div>
                 <a href="https://gaorsystem.vercel.app/" target="_blank" rel="noreferrer" className="flex items-center gap-2 group">
                    <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest group-hover:text-slate-400 transition-colors">
                      Powered by <span className="text-white">GaorSystem</span>
                    </span>
                    <Rocket className="w-3 h-3 text-brand-500 group-hover:translate-x-0.5 transition-transform" />
                 </a>
              </div>
           </div>
        </div>
      </footer>

      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setSelectedProduct(null)}></div>
          <div className="relative bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col lg:flex-row animate-in zoom-in-95">
             <button onClick={() => setSelectedProduct(null)} className="absolute top-6 right-6 p-3 bg-white/50 backdrop-blur-md rounded-full z-10"><X className="w-5 h-5"/></button>
             <div className="lg:w-1/2 bg-slate-50 flex items-center justify-center p-12">
               <div className="w-full aspect-square bg-white rounded-3xl shadow-sm p-8 flex items-center justify-center">
                 {selectedProduct.imagen ? <img src={`data:image/png;base64,${selectedProduct.imagen}`} className="max-h-full max-w-full object-contain" alt=""/> : <ImageIcon className="w-20 h-20 text-slate-100"/>}
               </div>
             </div>
             <div className="lg:w-1/2 p-10 space-y-6">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded bg-slate-100 text-slate-500 mb-2 inline-block">{selectedProduct.categoria}</span>
                  <h2 className="text-3xl font-black text-slate-900 leading-tight">{selectedProduct.nombre}</h2>
                </div>
                <div className="p-6 rounded-2xl flex items-center justify-between" style={{backgroundColor: `${colorP}10`}}>
                  <p className="text-4xl font-black" style={{color: colorP}}>S/ {selectedProduct.precio.toFixed(2)}</p>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">En Stock</p>
                    <p className="text-xs font-bold text-slate-900">{selectedProduct.stock} unidades</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-xs text-slate-600 font-medium">
                    <ShieldCheck className="w-4 h-4 text-emerald-500"/> Registro: {selectedProduct.registro_sanitario || 'Vigente'}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-600 font-medium">
                    <MapPin className="w-4 h-4 text-blue-500"/> Sucursal: {config.nombreComercial}
                  </div>
                </div>
                <button 
                   onClick={() => { addToCart(selectedProduct); setSelectedProduct(null); }} 
                   className="w-full py-5 text-white rounded-2xl font-black shadow-xl active:scale-95 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-3" 
                   style={{backgroundColor: colorA}}
                 >
                   <ShoppingCart className="w-5 h-5" />
                   Añadir al Carrito
                 </button>
             </div>
          </div>
        </div>
      )}

      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsCartOpen(false)}></div>
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Mi Pedido</h2>
              <button onClick={() => setIsCartOpen(false)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl"><X /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
              {cart.map(item => (
                <div key={item.producto.id} className="flex gap-4 items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                  <div className="w-16 h-16 bg-slate-50 rounded-xl overflow-hidden flex items-center justify-center shrink-0">
                    {item.producto.imagen ? <img src={`data:image/png;base64,${item.producto.imagen}`} className="w-full h-full object-cover" alt=""/> : <Package className="w-6 h-6 text-slate-200"/>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[11px] font-bold text-slate-800 line-clamp-1">{item.producto.nombre}</h4>
                    <p className="text-sm font-black mt-0.5" style={{color: colorP}}>S/ {item.producto.precio.toFixed(2)}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center bg-slate-50 rounded-lg p-0.5 border">
                        <button onClick={() => updateQuantity(item.producto.id, -1)} className="p-1 bg-white rounded shadow-sm"><Minus className="w-2.5 h-2.5"/></button>
                        <span className="text-xs font-bold px-3">{item.cantidad}</span>
                        <button onClick={() => updateQuantity(item.producto.id, 1)} className="p-1 bg-white rounded shadow-sm"><Plus className="w-2.5 h-2.5"/></button>
                      </div>
                      <button onClick={() => removeFromCart(item.producto.id)} className="text-xs font-bold text-red-400 hover:text-red-600 transition-colors ml-auto">Quitar</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {cart.length > 0 && (
              <div className="p-8 border-t border-slate-100 space-y-5 bg-white">
                <div className="flex justify-between items-end">
                  <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Total del Pedido</span>
                  <span className="text-3xl font-black text-slate-900 leading-none">S/ {cartTotal.toFixed(2)}</span>
                </div>
                <button 
                  onClick={() => checkoutStep === 'catalog' ? setCheckoutStep('shipping') : handleSubmitOrder()} 
                  className="w-full py-5 text-white rounded-2xl font-black shadow-2xl transition-all active:scale-95 uppercase tracking-widest text-[11px]" 
                  style={{backgroundColor: colorA}}
                >
                  {checkoutStep === 'catalog' ? 'Continuar Compra' : 'Confirmar Pedido'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreView;
