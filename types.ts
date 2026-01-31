
export interface Producto {
  id: number;
  nombre: string;
  costo: number;
  precio: number;
  categoria?: string;
  stock?: number;
  imagen?: string; 
  descripcion_venta?: string;
  registro_sanitario?: string;
  laboratorio?: string;
  principio_activo?: string;
  principio_activo_id?: number;
  presentacion?: string;
}

export interface SedeStore {
  id: string;
  nombre: string;
  direccion: string;
}

export interface ClientConfig {
  code: string;
  url: string;
  db: string;
  username: string;
  apiKey: string;
  companyFilter: string;
  whatsappNumbers?: string;
  isActive: boolean;
  nombreComercial?: string;
  logoUrl?: string;
  colorPrimario?: string;
  colorSecundario?: string;
  colorAcento?: string;
  showStore?: boolean;
  storeCategories?: string;
  tiendaCategoriaNombre?: string;
  hiddenProducts?: number[];
  hiddenCategories?: string[];
  yapeNumber?: string;
  yapeName?: string;
  yapeQR?: string; 
  plinNumber?: string;
  plinName?: string;
  plinQR?: string;
  sedes_recojo?: SedeStore[];
  campos_medicos_visibles?: string[];
  footer_description?: string;
  facebook_url?: string;
  instagram_url?: string;
  tiktok_url?: string;
  quality_text?: string;
  support_text?: string;
}

export interface OdooSession {
  url: string;
  db: string;
  username: string;
  apiKey: string;
  uid: number;
  useProxy: boolean;
  companyId?: number;
  companyName?: string;
}

export interface OdooCredential {
  id: string;
  companyName: string;
  friendlyName: string;
  friendlyPassword?: string;
  url: string;
  db: string;
  username: string;
  apiKey: string;
  isActive: boolean;
  lastSync?: string;
}

export interface CartItem {
  producto: Producto;
  cantidad: number;
}

export interface Venta {
  fecha: Date;
  sede: string;
  compania: string;
  vendedor: string;
  sesion: string;
  producto: string;
  categoria: string;
  metodoPago: string;
  cantidad: number;
  total: number;
  costo: number;
  margen: number;
  margenPorcentaje: string;
  cliente?: string;
}

export interface Filtros {
  sedeSeleccionada: string;
  companiaSeleccionada: string;
  periodoSeleccionado: string;
  fechaInicio: string;
  fechaFin: string;
}

export interface AgrupadoPorDia {
  fecha: string;
  ventas: number;
  margen: number;
}

export interface SalesSummary {
  ventas_totales: number;
  costos_totales: number;
  utilidad_bruta: number;
  margen_global: number;
  ordenes_totales: number;
  ticket_promedio: number;
  items_vendidos: number;
}

export enum UserRole {
  SUPERADMIN = 'SUPERADMIN',
  ADMIN = 'ADMIN',
  USER = 'USER'
}
