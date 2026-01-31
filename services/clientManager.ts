
import { ClientConfig } from '../types';

const FEET_CARE_CONFIG: ClientConfig = {
    code: 'FEETCARE',
    url: 'https://vida.facturaclic.pe/',
    db: 'vida_master',
    username: 'soporte@facturaclic.pe',
    apiKey: '7a823daf061832dd8f01876a714da94f7e9c9355',
    companyFilter: 'FEET CARE de DRIGUEZ MATEO YOHANNA MIRELLA',
    isActive: true,
    nombreComercial: 'FEET CARE',
    colorPrimario: '#d9f99d', // Lemon green
    colorSecundario: '#1e293b',
    colorAcento: '#84cc16'
};

const ADMIN_PWD_KEY = 'LEMON_BI_ADMIN_PWD';
const DEFAULT_ADMIN_PWD = 'Luis2021.';

export const verifyAdminPassword = (password: string): boolean => {
    return password === DEFAULT_ADMIN_PWD;
};

export const getClientByCode = async (code: string): Promise<ClientConfig | null> => {
    if (code.toUpperCase() === 'FEETCARE') {
        return FEET_CARE_CONFIG;
    }
    return null;
};

export const getClients = async (): Promise<ClientConfig[]> => {
    return [FEET_CARE_CONFIG];
};

// No-op para mantener compatibilidad pero sin persistencia externa
export const saveClient = async () => ({ success: true });
export const deleteClient = async () => true;
