
import React, { useState, useEffect, useMemo } from 'react';
import { Search, Package, Eye, EyeOff, Save, RefreshCw, CheckCircle2, Loader2, Layers, CheckCircle, XCircle, Info } from 'lucide-react';
import { Producto, OdooSession, ClientConfig } from '../types';
import { OdooClient } from '../services/odoo';
import { saveClient } from '../services/clientManager';

interface ProductManagerProps {
  session: OdooSession;
  config: ClientConfig;
  onUpdate: (newConfig: ClientConfig) => void;
}

const ProductManager: React.FC<ProductManagerProps> = ({ session, config, onUpdate }) => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'individual' | 'categories'>('individual');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todas');
  const [showSuccess, setShowSuccess] = useState(false);
  
  const [hiddenIds, setHiddenIds] = useState<number[]>(config.hiddenProducts || []);
  const [hiddenCats, setHiddenCats] = useState<string[]>(config.hiddenCategories || []);

  const fetchProducts = async () => {
    setLoading(true);
    // Fix line 28: constructor expects 2 arguments
    const client = new OdooClient(session.url, session.db);
    try {
      const configCategory = (config.tiendaCategoriaNombre || '').trim();
      const domain: any[] = [['sale_ok', '=', true]];
      
      if (configCategory && configCategory.toUpperCase() !== 'TODAS') {
        domain.push('|', ['categ_id', 'child_of', configCategory], ['categ_id', 'ilike', configCategory]);
      }

      if (session.companyId) {
        domain.push('|', ['company_id', '=', false], ['company_id', '=', session.companyId]);
      }

      let data = await client.searchRead(session.uid, session.apiKey, 'product.product', domain, 
        ['display_name', 'list_price', 'qty_available', 'categ_id', 'image_128'], 
        { limit: 2000, order: 'display_name asc' }
      );

      if (data.length === 0) {
        const fallbackDomain: any[] = [['sale_ok', '=', true]];
        if (session.companyId) fallbackDomain.push('|', ['company_id', '=', false], ['company_id', '=', session.companyId]);
        data = await client.searchRead(session.uid, session.apiKey, 'product.product', fallbackDomain, 
          ['display_name', 'list_price', 'qty_available', 'categ_id', 'image_128'], 
          { limit: 1000, order: 'display_name asc' }
        );
      }

      const mapped = data.map((p: any) => ({
        id: p.id,
        nombre: p.display_name,
        precio: p.list_price || 0,
        costo: 0,
        categoria: Array.isArray(p.categ_id) ? p.categ_id[1] : 'General',
        stock: p.qty_available || 0,
        imagen: p.image_128
      }));
      setProductos(mapped);
    } catch (e) {
      console.error("Error sincronizando:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [session, config.tiendaCategoriaNombre]);

  const categories = useMemo(() => {
    return Array.from(new Set(productos.map(p => p.categoria || 'General'))).sort();
  }, [productos]);

  const filteredProducts = useMemo(() => {
    return productos.filter(p => {
      const matchesSearch = p.nombre.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'Todas' || p.categoria === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [productos, searchTerm, categoryFilter]);

  const toggleProductVisibility = (id: number) => {
    setHiddenIds(prev => prev.includes(id) ? prev.filter(hid => hid !== id) : [...prev, id]);
  };

  const toggleCategoryVisibility = (cat: string) => {
    setHiddenCats(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  const handleBulkAction = (action: 'show' | 'hide') => {
    const currentIds = filteredProducts.map(p => p.id);
    if (action === 'show') {
      setHiddenIds(prev => prev.filter(id => !currentIds.includes(id)));
    } else {
      setHiddenIds(prev => Array.from(new Set([...prev, ...currentIds])));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const newConfig = { 
      ...config, 
      hiddenProducts: hiddenIds.map(Number), 
      hiddenCategories: hiddenCats 
    };
    // Fix: Pass newConfig to saveClient as it expects 1 argument
    const result = await saveClient(newConfig);
    if (result.success) {
      onUpdate(newConfig);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } else {
      alert("Error al guardar cambios");
    }
    setSaving(false);
  };

  const brandColor = config.colorPrimario || '#84cc16';

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in pb-32 text-slate-700">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
             <div className="p-2 bg-brand-50 rounded-xl"><Package className="w-6 h-6 text-brand-600" /></div>
             <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Visibilidad del Catálogo</h2>
          </div>
          <p className="text-slate-500 text-sm font-medium">Gestiona qué productos de Odoo son visibles en tu tienda online.</p>
        </div>
        <div className="flex flex-wrap gap-3 w-full lg:w-auto">
          <button onClick={fetchProducts} disabled={loading} className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-slate-600 rounded-2xl font-black text-xs border border-slate-200 hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> SINCRONIZAR ODOO
          </button>
          <button 
            onClick={handleSave} 
            disabled={saving || loading}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-8 py-3.5 text-white rounded-2xl font-black text-xs shadow-2xl hover:brightness-110 transition-all active:scale-95 disabled:opacity-50"
            style={{backgroundColor: brandColor}}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            GUARDAR CONFIGURACIÓN
          </button>
        </div>
      </div>

      <div className="flex bg-slate-100 p-1.5 rounded-[2rem] w-full max-w-sm mx-auto shadow-inner">
        <button onClick={() => setActiveTab('individual')} className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'individual' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
          <Package className="w-4 h-4"/> Productos
        </button>
        <button onClick={() => setActiveTab('categories')} className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'categories' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
          <Layers className="w-4 h-4"/> Categorías
        </button>
      </div>

      {activeTab === 'individual' ? (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden animate-in fade-in">
          <div className="p-8 border-b border-slate-50 flex flex-col xl:flex-row gap-6 items-center justify-between bg-slate-50/30">
            <div className="flex flex-col md:flex-row gap-4 w-full xl:w-auto">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input type="text" placeholder="Buscar producto..." className="w-full pl-12 pr-6 py-4 bg-white border border-slate-100 rounded-2xl outline-none font-bold text-sm shadow-sm focus:ring-2 transition-all" style={{'--tw-ring-color': brandColor} as any} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
              <select className="w-full md:w-64 p-4 bg-white border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm outline-none cursor-pointer" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
                <option value="Todas">Todas las Categorías</option>
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-3">
               <button onClick={() => handleBulkAction('show')} className="flex items-center gap-2 px-5 py-3 bg-emerald-50 text-emerald-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-100 border border-emerald-100 transition-all"><CheckCircle className="w-4 h-4"/> Publicar Todos</button>
               <button onClick={() => handleBulkAction('hide')} className="flex items-center gap-2 px-5 py-3 bg-rose-50 text-rose-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-100 border border-rose-100 transition-all"><XCircle className="w-4 h-4"/> Ocultar Todos</button>
            </div>
          </div>

          <div className="p-4 bg-blue-50/50 flex items-center gap-3 border-b border-blue-50">
             <Info className="w-4 h-4 text-blue-500" />
             <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Sincronizados {productos.length} productos de Odoo</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <tr>
                  <th className="px-10 py-6">Producto</th>
                  <th className="px-10 py-6">Categoría</th>
                  <th className="px-10 py-6 text-right">Precio</th>
                  <th className="px-10 py-6 text-center">Stock</th>
                  <th className="px-10 py-6 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredProducts.map(p => {
                  const isActuallyVisible = !hiddenIds.includes(p.id);
                  return (
                    <tr key={p.id} className={`group hover:bg-slate-50/80 transition-all ${!isActuallyVisible ? 'opacity-50 grayscale bg-slate-50/50' : ''}`}>
                      <td className="px-10 py-5">
                        <div className="flex items-center gap-5">
                          <div className="w-14 h-14 bg-slate-100 rounded-[1.25rem] overflow-hidden border border-slate-100 flex items-center justify-center">{p.imagen ? <img src={`data:image/png;base64,${p.imagen}`} className="w-full h-full object-cover" alt="" /> : <Package className="w-6 h-6 text-slate-200"/>}</div>
                          <div><p className="font-bold text-sm text-slate-900">{p.nombre}</p><p className="text-[10px] text-slate-300 font-mono">ID: {p.id}</p></div>
                        </div>
                      </td>
                      <td className="px-10 py-5"><span className="inline-flex px-3 py-1.5 rounded-xl text-[10px] font-black bg-slate-100 text-slate-500 uppercase">{p.categoria}</span></td>
                      <td className="px-10 py-5 text-right font-black text-slate-900">S/ {p.precio.toFixed(2)}</td>
                      <td className="px-10 py-5 text-center font-bold text-xs">{p.stock || 0} <span className="text-[10px] text-slate-400 font-normal ml-0.5">uds</span></td>
                      <td className="px-10 py-5 text-right">
                        <button onClick={() => toggleProductVisibility(p.id)} className={`px-5 py-3 rounded-2xl font-black text-[10px] uppercase transition-all ${isActuallyVisible ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-500 hover:text-white' : 'bg-rose-50 text-rose-500 border border-rose-100 hover:bg-rose-500 hover:text-white'}`}>
                          {isActuallyVisible ? 'PUBLICADO' : 'OCULTO'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in">
          {categories.map(cat => {
            const isHidden = hiddenCats.includes(cat);
            return (
              <div key={cat} onClick={() => toggleCategoryVisibility(cat)} className={`p-10 rounded-[3rem] border-2 cursor-pointer transition-all duration-500 flex flex-col justify-between h-52 group ${isHidden ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-white shadow-xl hover:-translate-y-2'}`}>
                <div className="flex justify-between items-start">
                   <div className={`p-4 rounded-2xl transition-all ${isHidden ? 'bg-slate-200 text-slate-400' : 'bg-brand-50 text-brand-600'}`}>{isHidden ? <EyeOff className="w-6 h-6"/> : <Eye className="w-6 h-6"/>}</div>
                   <span className={`text-[9px] font-black uppercase px-4 py-1.5 rounded-full border transition-all ${isHidden ? 'text-slate-400 border-slate-200' : 'text-emerald-600 border-emerald-100 bg-emerald-50'}`}>{isHidden ? 'OCULTA' : 'VISIBLE'}</span>
                </div>
                <h3 className={`text-lg font-black uppercase tracking-tight ${isHidden ? 'text-slate-400' : 'text-slate-900'}`}>{cat}</h3>
              </div>
            );
          })}
        </div>
      )}

      {showSuccess && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-10 py-5 rounded-full shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-12 duration-500 z-50">
          <CheckCircle2 className="w-5 h-5 text-brand-500" />
          <p className="font-black text-sm uppercase tracking-widest">Cambios Guardados con Éxito</p>
        </div>
      )}
    </div>
  );
};

export default ProductManager;
