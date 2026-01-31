
import { ClientConfig } from '../types';
import { supabase } from './supabaseClient';

const FEET_CARE_FALLBACK: ClientConfig = {
    code: 'FEETCARE',
    url: 'https://vida.facturaclic.pe',
    db: 'vida_master',
    username: 'soporte@facturaclic.pe',
    apiKey: '7a823daf061832dd8f01876a714da94f7e9c9355',
    companyFilter: 'FEET CARE',
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

const mapConfig = (data: any): ClientConfig => ({
    code: data.code,
    url: data.url.trim(),
    db: data.db.trim(),
    username: data.username.trim(),
    apiKey: data.apiKey.trim(),
    companyFilter: data.companyFilter || 'ALL',
    isActive: data.isActive ?? true,
    nombreComercial: data.nombreComercial,
    logoUrl: data.logoUrl,
    colorPrimario: data.colorPrimario || '#84cc16',
    colorSecundario: data.colorSecundario || '#1e293b',
    colorAcento: data.colorAcento || '#0ea5e9',
    showStore: data.showStore ?? true,
    whatsappNumbers: data.whatsappNumbers,
    footer_description: data.footer_description,
    hiddenProducts: data.hidden_products || [],
    hiddenCategories: data.hidden_categories || []
});

export const getClientByCode = async (code: string): Promise<ClientConfig | null> => {
    try {
        const { data, error } = await supabase
            .from('empresas')
            .select('*')
            .eq('code', code.toUpperCase())
            .single();

        if (error || !data) {
            return code.toUpperCase() === 'FEETCARE' ? FEET_CARE_FALLBACK : null;
        }
        return mapConfig(data);
    } catch (e) {
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
        return [FEET_CARE_FALLBACK];
    }
};

export const saveClient = async (config: ClientConfig) => {
    try {
        const payload = {
            code: config.code.toUpperCase().trim(),
            url: config.url.trim(),
            db: config.db.trim(),
            username: config.username.trim(),
            apiKey: config.apiKey.trim(),
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
