
import { ClientConfig } from '../types';
import { supabase } from './supabaseClient';

// Configuración por defecto por si falla la red (Fallback)
const FEET_CARE_FALLBACK: ClientConfig = {
    code: 'FEETCARE',
    url: 'https://vida.facturaclic.pe/',
    db: 'vida_master',
    username: 'soporte@facturaclic.pe',
    apiKey: '7a823daf061832dd8f01876a714da94f7e9c9355',
    companyFilter: 'FEET CARE de DRIGUEZ MATEO YOHANNA MIRELLA',
    isActive: true,
    nombreComercial: 'FEET CARE',
    colorPrimario: '#84cc16',
    colorSecundario: '#1e293b',
    colorAcento: '#0ea5e9'
};

const DEFAULT_ADMIN_PWD = 'Luis2021.';

export const verifyAdminPassword = (password: string): boolean => {
    return password === DEFAULT_ADMIN_PWD;
};

// Mapeo de DB Supabase a Interfaz de App
const mapConfig = (data: any): ClientConfig => ({
    code: data.code || data.codigo_acceso,
    url: data.url || data.odoo_url,
    db: data.db || data.odoo_db,
    username: data.username || data.odoo_username,
    apiKey: data.apiKey || data.odoo_api_key,
    companyFilter: data.companyFilter || data.empresa_filtro || 'ALL',
    isActive: data.isActive ?? data.estado ?? true,
    nombreComercial: data.nombreComercial || data.nombre_comercial,
    logoUrl: data.logoUrl || data.logo_url,
    colorPrimario: data.colorPrimario || data.color_primario,
    colorSecundario: data.colorSecundario || data.color_secundario,
    colorAcento: data.colorAcento || data.color_acento,
    showStore: data.showStore ?? data.tienda_activa ?? true,
    whatsappNumbers: data.whatsappNumbers || data.whatsapp_numeros,
    footer_description: data.footer_description,
    hiddenProducts: data.hidden_products || [],
    hiddenCategories: data.hidden_categories || []
});

export const getClientByCode = async (code: string): Promise<ClientConfig | null> => {
    try {
        const { data, error } = await supabase
            .from('empresas')
            .select('*')
            .or(`code.eq.${code.toUpperCase()},codigo_acceso.eq.${code.toUpperCase()}`)
            .single();

        if (error || !data) {
            // Si es FEETCARE y no está en DB, devolvemos el fallback para no romper la demo
            return code.toUpperCase() === 'FEETCARE' ? FEET_CARE_FALLBACK : null;
        }
        return mapConfig(data);
    } catch (e) {
        console.error("Error fetching client", e);
        return code.toUpperCase() === 'FEETCARE' ? FEET_CARE_FALLBACK : null;
    }
};

export const getClients = async (): Promise<ClientConfig[]> => {
    try {
        const { data, error } = await supabase
            .from('empresas')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data.map(mapConfig);
    } catch (e) {
        console.error("Error fetching all clients", e);
        return [FEET_CARE_FALLBACK];
    }
};

export const saveClient = async (config: ClientConfig) => {
    try {
        const payload = {
            code: config.code.toUpperCase(),
            url: config.url,
            db: config.db,
            username: config.username,
            apiKey: config.apiKey,
            companyFilter: config.companyFilter,
            isActive: config.isActive,
            nombreComercial: config.nombreComercial,
            logoUrl: config.logoUrl,
            colorPrimario: config.colorPrimario,
            colorSecundario: config.colorSecundario,
            colorAcento: config.colorAcento,
            showStore: config.showStore,
            whatsappNumbers: config.whatsappNumbers,
            footer_description: config.footer_description,
            hidden_products: config.hiddenProducts,
            hidden_categories: config.hiddenCategories
        };

        const { error } = await supabase
            .from('empresas')
            .upsert(payload, { onConflict: 'code' });

        if (error) throw error;
        return { success: true };
    } catch (e: any) {
        console.error("Error saving client", e);
        return { success: false, message: e.message };
    }
};

export const deleteClient = async (code: string): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('empresas')
            .delete()
            .eq('code', code);
        return !error;
    } catch (e) {
        return false;
    }
};
