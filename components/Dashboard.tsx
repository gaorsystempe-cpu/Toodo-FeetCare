
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, BarChart, Bar
} from 'recharts';
import { 
  TrendingUp, RefreshCw, AlertCircle, FileSpreadsheet, 
  Zap, Calculator, CreditCard, LayoutGrid, ClipboardList,
  Store, MapPin, ArrowUpRight, Package, History, Info, Plus
} from 'lucide-react';
import { Venta, OdooSession } from '../types';
import { OdooClient } from '../services/odoo';
import * as XLSX from 'xlsx';

const COLORS = ['#84cc16', '#0ea5e9', '#f59e0b', '#ec4899', '#8b5cf6', '#10b981', '#f43f5e', '#6366f1'];

interface DashboardProps {
    session: OdooSession | null;
    view?: string;
}

type FilterMode = 'hoy' | 'mes' | 'anio' | 'custom';
type ReportTab = 'consolidado' | 'recepcion' | 'surco';

const Dashboard: React.FC<DashboardProps> = ({ session }) => {
  const [ventasData, setVentasData] = useState<Venta[]>([]); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<FilterMode>('hoy');
  const [activeTab, setActiveTab] = useState<ReportTab>('consolidado');
  const [dateRange, setDateRange] = useState({
      start: new Date().toLocaleDateString('en-CA'),
      end: new Date().toLocaleDateString('en-CA')
  });

  const updateRangeByMode = (mode: FilterMode) => {
    setFilterMode(mode);
    const today = new Date();
    let start = '';
    let end = today.toLocaleDateString('en-CA');

    if (mode === 'hoy') {
        start = end;
    } else if (mode === 'mes') {
        start = new Date(today.getFullYear(), today.getMonth(), 1).toLocaleDateString('en-CA');
    } else if (mode === 'anio') {
        start = new Date(today.getFullYear(), 0, 1).toLocaleDateString('en-CA');
    }
    
    if (mode !== 'custom') {
        setDateRange({ start, end });
    }
  };

  const fetchData = useCallback(async () => {
      if (!session) return;
      setLoading(true);
      setError(null);

      try {
          const client = new OdooClient(session.url, session.db);
          const domain: any[] = [
            ['state', '!=', 'cancel'], 
            ['date_order', '>=', `${dateRange.start} 00:00:00`],
            ['date_order', '<=', `${dateRange.end} 23:59:59`]
          ];
          if (session.companyId) domain.push(['company_id', '=', session.companyId]);

          const orders = await client.searchRead(session.uid, session.apiKey, 'pos.order', domain, 
            ['date_order', 'config_id', 'lines', 'company_id', 'amount_total', 'user_id', 'payment_ids'], 
            { order: 'date_order desc' }
          );

          if (!orders || orders.length === 0) {
              setVentasData([]);
              return;
          }

          const allLineIds = orders.flatMap((o: any) => o.lines || []);
          const allPaymentIds = orders.flatMap((o: any) => o.payment_ids || []);

          const [linesData, paymentsData] = await Promise.all([
            client.searchRead(session.uid, session.apiKey, 'pos.order.line', [['id', 'in', allLineIds]], 
                ['product_id', 'qty', 'price_subtotal_incl', 'price_unit', 'order_id']),
            client.searchRead(session.uid, session.apiKey, 'pos.payment', [['id', 'in', allPaymentIds]], 
                ['payment_method_id', 'amount', 'pos_order_id'])
          ]);

          const productIds = Array.from(new Set(linesData.map((l: any) => l.product_id[0])));
          const products = await client.searchRead(session.uid, session.apiKey, 'product.product', [['id', 'in', productIds]], ['standard_price', 'categ_id']);
          
          const productMap = new Map<number, { cost: number; cat: string }>(products.map((p: any) => [p.id, { cost: p.standard_price || 0, cat: p.categ_id[1] }]));
          
          const paymentsByOrder = new Map();
          paymentsData.forEach((p: any) => {
              const oId = p.pos_order_id[0];
              if (!paymentsByOrder.has(oId)) paymentsByOrder.set(oId, []);
              paymentsByOrder.get(oId).push(p.payment_method_id[1]);
          });

          const linesByOrder = new Map();
          linesData.forEach((l: any) => {
              const oId = l.order_id[0];
              if (!linesByOrder.has(oId)) linesByOrder.set(oId, []);
              linesByOrder.get(oId).push(l);
          });

          const mapped: Venta[] = orders.flatMap((o: any) => {
              const orderLines = linesByOrder.get(o.id) || [];
              const orderDate = new Date(o.date_order.replace(' ', 'T') + 'Z');
              const sede = o.config_id[1] || 'Caja Central';
              const metodos = paymentsByOrder.get(o.id) || ['Efectivo'];
              const metodoPrincipal = metodos[0];

              return orderLines.map((l: any) => {
                  const pId = l.product_id[0];
                  const pInfo = productMap.get(pId) || { cost: 0, cat: 'Varios' };
                  const total = l.price_subtotal_incl || 0;
                  const costo = pInfo.cost * l.qty;
                  const margen = total - costo;

                  return {
                      fecha: orderDate,
                      sede,
                      compania: session.companyName || '',
                      vendedor: o.user_id[1] || 'Vendedor',
                      producto: l.product_id[1],
                      categoria: pInfo.cat,
                      total,
                      costo,
                      margen,
                      cantidad: l.qty,
                      sesion: '', 
                      metodoPago: metodoPrincipal,
                      margenPorcentaje: total > 0 ? ((margen/total)*100).toFixed(1) : '100.0'
                  };
              });
          });

          setVentasData(mapped);
      } catch (err: any) {
          setError(err.message);
      } finally {
          setLoading(false);
      }
  }, [session, dateRange]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // FILTRADO ESTRICTO DE SEDES
  const dataFeetCare = useMemo(() => ventasData.filter(v => v.sede.toUpperCase().includes('FEETCARE') || (v.sede.toUpperCase().includes('RECEPCION') && !v.sede.toUpperCase().includes('SURCO'))), [ventasData]);
  const dataFeetSurco = useMemo(() => ventasData.filter(v => v.sede.toUpperCase().includes('SURCO')), [ventasData]);

  const filteredData = useMemo(() => {
    if (activeTab === 'consolidado') return ventasData;
    if (activeTab === 'recepcion') return dataFeetCare;
    if (activeTab === 'surco') return dataFeetSurco;
    return ventasData;
  }, [ventasData, dataFeetCare, dataFeetSurco, activeTab]);

  const kpis = useMemo(() => {
      const v = filteredData.reduce((s, x) => s + x.total, 0);
      const c = filteredData.reduce((s, x) => s + x.costo, 0);
      const m = filteredData.reduce((s, x) => s + x.margen, 0);
      return {
          totalVenta: v,
          totalCosto: c,
          totalMargen: m,
          rentabilidad: v > 0 ? ((m / v) * 100).toFixed(1) : '0'
      };
  }, [filteredData]);

  const resumenSedes = useMemo(() => {
    const calc = (data: Venta[]) => ({
        venta: data.reduce((s, x) => s + x.total, 0),
        costo: data.reduce((s, x) => s + x.costo, 0),
        ganancia: data.reduce((s, x) => s + x.margen, 0)
    });
    const rc = calc(dataFeetCare);
    const sc = calc(dataFeetSurco);
    return {
        recepcion: rc,
        surco: sc,
        total: {
            venta: rc.venta + sc.venta,
            costo: rc.costo + sc.costo,
            ganancia: rc.ganancia + sc.ganancia
        }
    };
  }, [dataFeetCare, dataFeetSurco]);

  const metodosPagoData = useMemo(() => {
    const agg: Record<string, number> = {};
    filteredData.forEach(v => {
        agg[v.metodoPago] = (agg[v.metodoPago] || 0) + v.total;
    });
    return Object.entries(agg).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
  }, [filteredData]);

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();

    // 1. Hoja Consolidado
    const summaryData = [
      ["REPORTE CONSOLIDADO DE RENTABILIDAD"],
      ["Rango de Fechas:", `${dateRange.start} al ${dateRange.end}`],
      [],
      ["Sede", "Venta Total", "Costo de Servicio", "Ganancia Neta", "Rentabilidad %"]
    ];

    const rc = resumenSedes.recepcion;
    const sc = resumenSedes.surco;
    const gt = resumenSedes.total;

    summaryData.push(
      ["FeetCare (Recepción)", rc.venta, rc.costo, rc.ganancia, `${(rc.venta > 0 ? (rc.ganancia / rc.venta * 100) : 0).toFixed(2)}%`],
      ["Feet Surco", sc.venta, sc.costo, sc.ganancia, `${(sc.venta > 0 ? (sc.ganancia / sc.venta * 100) : 0).toFixed(2)}%`],
      [],
      ["TOTAL GENERAL NEGOCIO", gt.venta, gt.costo, gt.ganancia, `${(gt.venta > 0 ? (gt.ganancia / gt.venta * 100) : 0).toFixed(2)}%`]
    );

    const wsSum = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSum, "Resumen Consolidado");

    // Función para crear hoja de detalle por sede
    const createSedeSheet = (data: Venta[], sheetName: string) => {
      const rows = data.map(v => ({
        Fecha: v.fecha.toLocaleString('es-PE'),
        Sede: v.sede,
        Producto: v.producto,
        MetodoPago: v.metodoPago,
        Venta: v.total,
        Costo: v.costo,
        Ganancia: v.margen,
        'Rent %': v.margenPorcentaje
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      
      // Añadir totales al final
      const totalV = data.reduce((s, x) => s + x.total, 0);
      const totalC = data.reduce((s, x) => s + x.costo, 0);
      const totalG = data.reduce((s, x) => s + x.margen, 0);
      const avgR = totalV > 0 ? ((totalG / totalV) * 100).toFixed(2) : "0";
      
      XLSX.utils.sheet_add_aoa(ws, [
        [],
        ["TOTALES SEDE", "", "", "", totalV, totalC, totalG, `${avgR}%`]
      ], { origin: -1 });

      return ws;
    };

    if (dataFeetCare.length > 0) {
      XLSX.utils.book_append_sheet(wb, createSedeSheet(dataFeetCare, "FeetCare"), "Detalle FeetCare");
    }
    if (dataFeetSurco.length > 0) {
      XLSX.utils.book_append_sheet(wb, createSedeSheet(dataFeetSurco, "Surco"), "Detalle FeetSurco");
    }

    XLSX.writeFile(wb, `Reporte_Rentabilidad_Sedes_${dateRange.start}.xlsx`);
  };

  return (
    <div className="p-4 md:p-10 font-sans max-w-7xl mx-auto space-y-8 animate-in fade-in pb-24">
      
      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-200 pb-8">
        <div>
           <div className="flex items-center gap-3">
             <div className="p-3 bg-brand-500 rounded-2xl shadow-lg shadow-brand-500/20"><TrendingUp className="text-white w-6 h-6" /></div>
             <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Control de Rentabilidad</h1>
           </div>
           <p className="text-slate-500 text-sm mt-2 font-medium">Análisis de Sedes: FeetCare & Feet Surco</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
           <button onClick={fetchData} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white px-6 py-3.5 rounded-2xl border border-slate-200 font-bold text-[10px] hover:bg-slate-50 transition-all uppercase tracking-widest"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Sincronizar</button>
           <button onClick={exportExcel} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-3.5 rounded-2xl font-bold text-[10px] shadow-xl hover:bg-slate-800 transition-all uppercase tracking-widest"><FileSpreadsheet className="w-4 h-4" /> Exportar Excel</button>
        </div>
      </div>

      {/* NAVEGACIÓN DE 3 PESTAÑAS (TABS) */}
      <div className="bg-slate-100 p-2 rounded-[2.8rem] border border-slate-200 flex flex-wrap gap-2 w-full lg:w-fit">
         <button 
            onClick={() => setActiveTab('consolidado')} 
            className={`flex-1 lg:flex-none flex items-center justify-center gap-3 px-10 py-4 rounded-[2rem] font-black text-[11px] uppercase tracking-widest transition-all ${activeTab === 'consolidado' ? 'bg-slate-900 text-white shadow-xl scale-[1.02]' : 'text-slate-400 hover:bg-slate-200'}`}
         >
            <LayoutGrid className="w-4 h-4" /> Consolidado Global
         </button>
         <button 
            onClick={() => setActiveTab('recepcion')} 
            className={`flex-1 lg:flex-none flex items-center justify-center gap-3 px-10 py-4 rounded-[2rem] font-black text-[11px] uppercase tracking-widest transition-all ${activeTab === 'recepcion' ? 'bg-brand-500 text-white shadow-xl scale-[1.02]' : 'text-slate-400 hover:bg-slate-200'}`}
         >
            <Store className="w-4 h-4" /> Sede FeetCare
         </button>
         <button 
            onClick={() => setActiveTab('surco')} 
            className={`flex-1 lg:flex-none flex items-center justify-center gap-3 px-10 py-4 rounded-[2rem] font-black text-[11px] uppercase tracking-widest transition-all ${activeTab === 'surco' ? 'bg-blue-500 text-white shadow-xl scale-[1.02]' : 'text-slate-400 hover:bg-slate-200'}`}
         >
            <MapPin className="w-4 h-4" /> Sede Feet Surco
         </button>
      </div>

      {/* Filtros de Fecha */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-wrap gap-8 items-center">
         <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
            {(['hoy', 'mes', 'anio', 'custom'] as FilterMode[]).map(m => (
              <button key={m} onClick={() => updateRangeByMode(m)} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${filterMode === m ? 'bg-white text-brand-600 shadow-sm border border-brand-100' : 'text-slate-400 hover:text-slate-600'}`}>
                 {m === 'anio' ? 'Año' : m}
              </button>
            ))}
         </div>
         {filterMode === 'custom' && (
           <div className="flex gap-4 items-center animate-in slide-in-from-left-4">
              <input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold" />
              <span className="text-slate-300 font-bold">→</span>
              <input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold" />
           </div>
         )}
      </div>

      {/* PESTAÑA 1: CONSOLIDADO TOTALES COMPARATIVOS */}
      {activeTab === 'consolidado' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-6">
           {/* CUADRO COMPARATIVO DE SEDES */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Sede FeetCare */}
              <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-brand-50 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-brand-100"></div>
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2"><Store className="w-4 h-4 text-brand-500" /> Sede FeetCare</h4>
                 <div className="space-y-4">
                    <div>
                       <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Venta Total</p>
                       <p className="text-2xl font-black text-slate-900">S/ {resumenSedes.recepcion.venta.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div>
                       <p className="text-[10px] font-bold text-brand-600 uppercase mb-1">Ganancia Real</p>
                       <p className="text-2xl font-black text-brand-600">S/ {resumenSedes.recepcion.ganancia.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</p>
                    </div>
                 </div>
              </div>

              {/* Sede Surco */}
              <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-blue-100"></div>
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2"><MapPin className="w-4 h-4 text-blue-500" /> Sede Feet Surco</h4>
                 <div className="space-y-4">
                    <div>
                       <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Venta Total</p>
                       <p className="text-2xl font-black text-slate-900">S/ {resumenSedes.surco.venta.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div>
                       <p className="text-[10px] font-bold text-blue-600 uppercase mb-1">Ganancia Real</p>
                       <p className="text-2xl font-black text-blue-600">S/ {resumenSedes.surco.ganancia.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</p>
                    </div>
                 </div>
              </div>

              {/* SUMATORIA TOTAL NEGOCIO */}
              <div className="bg-slate-900 p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden group hover:scale-[1.02] transition-all">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2"><Plus className="w-4 h-4 text-brand-400" /> Sumatoria Total</h4>
                 <div className="space-y-4">
                    <div>
                       <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Venta Global</p>
                       <p className="text-3xl font-black text-white">S/ {resumenSedes.total.venta.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div>
                       <p className="text-[10px] font-bold text-brand-400 uppercase mb-1">Ganancia Neta Global</p>
                       <p className="text-3xl font-black text-brand-400">S/ {resumenSedes.total.ganancia.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</p>
                    </div>
                 </div>
              </div>
           </div>

           {/* Gráfico de Métodos de Pago Consolidado */}
           <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm">
              <h4 className="text-lg font-black text-slate-900 uppercase tracking-tighter mb-10 flex items-center gap-3"><CreditCard className="text-brand-500 w-6 h-6"/> Distribución de Ingresos Global</h4>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
                 <div className="lg:col-span-1 h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                       <PieChart>
                          <Pie data={metodosPagoData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={8} dataKey="value">
                             {metodosPagoData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                          </Pie>
                          <Tooltip />
                       </PieChart>
                    </ResponsiveContainer>
                 </div>
                 <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {metodosPagoData.map((m, i) => (
                       <div key={i} className="flex justify-between items-center p-6 bg-slate-50 rounded-[2rem] border border-slate-100 hover:border-slate-300 transition-all">
                          <div className="flex items-center gap-4">
                             <div className="w-4 h-4 rounded-full shadow-sm" style={{backgroundColor: COLORS[i % COLORS.length]}}></div>
                             <span className="text-[12px] font-black uppercase text-slate-700 tracking-tighter">{m.name}</span>
                          </div>
                          <span className="text-lg font-black text-slate-900 tracking-tighter">S/ {m.value.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* CONTENIDO PESTAÑAS 2 Y 3: DETALLE POR SEDE */}
      {(activeTab === 'recepcion' || activeTab === 'surco') && (
        <div className="space-y-8 animate-in slide-in-from-right-10">
           
           {/* KPIs Específicos de la Sede */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                 <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Venta Sede</p>
                 <h3 className="text-3xl font-black text-slate-900 tracking-tighter">S/ {kpis.totalVenta.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</h3>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                 <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Costo Sede</p>
                 <h3 className="text-3xl font-black text-slate-400 tracking-tighter">S/ {kpis.totalCosto.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</h3>
              </div>
              <div className={`p-8 rounded-[2.5rem] text-white shadow-xl ${activeTab === 'recepcion' ? 'bg-brand-500' : 'bg-blue-500'}`}>
                 <p className="text-white/70 text-[10px] font-black uppercase tracking-widest mb-1">Ganancia Sede</p>
                 <h3 className="text-3xl font-black tracking-tighter">S/ {kpis.totalMargen.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</h3>
              </div>
           </div>

           {/* TABLA DETALLADA: VENTA - COSTO - GANANCIA */}
           <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-xl overflow-hidden">
              <div className="p-10 border-b border-slate-50 flex items-center justify-between bg-slate-50/40">
                 <div>
                    <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3">
                       <ClipboardList className="text-brand-500 w-6 h-6"/> Listado de Operaciones Rentables
                    </h4>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-2 italic">Reporte exclusivo para: {activeTab === 'recepcion' ? 'FeetCare (Recepción)' : 'Surco'}</p>
                 </div>
              </div>
              
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-slate-50/80">
                       <tr>
                          <th className="px-10 py-7">Fecha / Atención</th>
                          <th className="px-10 py-7">Servicio / Producto</th>
                          <th className="px-10 py-7">Método de Pago</th>
                          <th className="px-10 py-7 text-right">Monto Venta</th>
                          <th className="px-10 py-7 text-right">Costo</th>
                          <th className="px-10 py-7 text-right">Ganancia</th>
                          <th className="px-10 py-7 text-center">Rent. %</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {filteredData.map((v, i) => (
                         <tr key={i} className="hover:bg-slate-50 transition-all group">
                            <td className="px-10 py-6">
                               <p className="font-bold text-slate-900 text-sm tracking-tight">{v.fecha.toLocaleDateString('es-PE')}</p>
                               <p className="text-[10px] text-slate-400 font-mono tracking-tighter">{v.fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </td>
                            <td className="px-10 py-6">
                               <p className="font-black text-slate-800 text-xs uppercase leading-tight">{v.producto}</p>
                               <div className="flex items-center gap-2 mt-1">
                                  <Package className="w-3 h-3 text-slate-300" />
                                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{v.categoria}</span>
                               </div>
                            </td>
                            <td className="px-10 py-6">
                               <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase border border-blue-100">
                                  {v.metodoPago}
                               </span>
                            </td>
                            <td className="px-10 py-6 text-right font-black text-slate-900 text-sm">S/ {v.total.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</td>
                            <td className="px-10 py-6 text-right font-bold text-slate-300 text-sm italic">S/ {v.costo.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</td>
                            <td className="px-10 py-6 text-right font-black text-brand-600 text-sm">S/ {v.margen.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</td>
                            <td className="px-10 py-6 text-center">
                               <div className={`px-4 py-1.5 rounded-xl text-[11px] font-black inline-block ${Number(v.margenPorcentaje) >= 80 ? 'bg-emerald-100 text-emerald-700' : Number(v.margenPorcentaje) >= 50 ? 'bg-brand-100 text-brand-700' : 'bg-orange-100 text-orange-700'}`}>
                                 {v.margenPorcentaje}%
                               </div>
                            </td>
                         </tr>
                       ))}
                       {filteredData.length === 0 && (
                           <tr><td colSpan={7} className="px-10 py-32 text-center text-slate-300 font-black text-sm uppercase italic">Sin operaciones registradas</td></tr>
                       )}
                    </tbody>
                    {filteredData.length > 0 && (
                       <tfoot className="bg-slate-900 text-white">
                           <tr className="font-black">
                               <td colSpan={3} className="px-10 py-7 text-right text-[11px] uppercase tracking-[0.2em] text-slate-400">Total Acumulado Sede:</td>
                               <td className="px-10 py-7 text-right text-lg tracking-tighter">S/ {kpis.totalVenta.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</td>
                               <td className="px-10 py-7 text-right text-slate-500 text-sm italic">S/ {kpis.totalCosto.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</td>
                               <td className="px-10 py-7 text-right text-brand-400 text-lg tracking-tighter">S/ {kpis.totalMargen.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</td>
                               <td className="px-10 py-7 text-center bg-brand-600 text-sm italic">{kpis.rentabilidad}%</td>
                           </tr>
                       </tfoot>
                    )}
                 </table>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
