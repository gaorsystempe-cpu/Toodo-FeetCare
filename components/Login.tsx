
import React, { useState } from 'react';
import { ArrowRight, Loader2, AlertTriangle, Citrus, Building2, Lock, Rocket } from 'lucide-react';
import { OdooClient } from '../services/odoo';
import { OdooSession, ClientConfig } from '../types';
import { getClientByCode, verifyAdminPassword } from '../services/clientManager';

interface LoginProps {
  onLogin: (session: OdooSession | null, config: ClientConfig) => void;
  onAdminLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onAdminLogin }) => {
  // Cambiado de 'FEETCARE' a '' para que el campo inicie vacío
  const [accessCode, setAccessCode] = useState('');
  const [password, setPassword] = useState(''); 
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    const code = accessCode.trim().toUpperCase();
    
    if (!isAdminMode && !code) {
      setError("Por favor, ingrese el código de acceso.");
      return;
    }

    setIsLoading(true);

    if (isAdminMode) {
        if (verifyAdminPassword(password)) {
            setStatusMessage("Acceso Autorizado");
            setTimeout(() => { onAdminLogin(); }, 600);
        } else {
             setError("Contraseña incorrecta.");
             setIsLoading(false);
        }
        return;
    }

    try {
        const clientConfig = await getClientByCode(code);
        if (!clientConfig) {
            setError("Código de empresa no válido o inexistente.");
            setIsLoading(false);
            return;
        }

        setStatusMessage(`Conectando con Odoo...`);
        const client = new OdooClient(clientConfig.url, clientConfig.db); 
        const uid = await client.authenticate(clientConfig.username, clientConfig.apiKey);
        
        setStatusMessage("Sincronizando identidad...");
        const companies = await client.searchRead(uid, clientConfig.apiKey, 'res.company', [['name', 'ilike', clientConfig.companyFilter]], ['name']);
        
        const targetCompany = companies.length > 0 ? companies[0] : { id: false, name: clientConfig.companyFilter };

        setStatusMessage("¡Listo!");
        setTimeout(() => {
            onLogin({ 
                url: clientConfig.url, 
                db: clientConfig.db, 
                username: clientConfig.username, 
                apiKey: clientConfig.apiKey, 
                uid: uid, 
                useProxy: true, 
                companyId: targetCompany.id || undefined, 
                companyName: targetCompany.name 
            }, clientConfig);
        }, 500);
    } catch (err: any) {
        setError(err.message || "Error al conectar con la instancia de Odoo.");
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-800">
      <div className="w-full md:w-5/12 bg-white relative overflow-hidden flex flex-col justify-between p-12 border-r border-slate-200">
        <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] bg-gradient-to-br from-brand-50 via-white to-white opacity-60"></div>
        <div className="relative z-10">
            <div className="flex items-center gap-3 mb-12">
                <div className="w-12 h-12 bg-brand-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-brand-500/30">
                    <Citrus className="w-7 h-7 text-white" />
                </div>
                <h1 className="text-3xl font-black tracking-tighter text-slate-900 font-mono">LEMON_BI</h1>
            </div>
            <h2 className="text-5xl font-black leading-[0.9] mb-8 text-slate-900 uppercase tracking-tighter">
                Control Total<br/>
                <span className="text-brand-500">Odoo SaaS</span>
            </h2>
            <p className="text-slate-500 text-lg font-medium max-w-sm leading-relaxed">
                Plataforma privada de rentabilidad para empresas integradas con Odoo.
            </p>
        </div>
        
        <div className="relative z-10 flex flex-col gap-4">
            <a href="https://gaorsystem.vercel.app/" target="_blank" rel="noreferrer" className="flex items-center gap-3">
                <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center"><Rocket className="w-6 h-6 text-brand-400" /></div>
                <div className="text-2xl font-black tracking-tight"><span className="text-slate-900">GAOR</span><span className="text-brand-500">SYSTEM</span></div>
            </a>
        </div>
      </div>

      <div className={`w-full md:w-7/12 flex items-center justify-center p-12 transition-colors duration-500 ${isAdminMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
        <div className={`max-w-md w-full p-10 rounded-[3rem] shadow-2xl border transition-all duration-500 ${isAdminMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-white'}`}>
            <h3 className={`text-3xl font-black mb-8 tracking-tighter uppercase ${isAdminMode ? 'text-white' : 'text-slate-900'}`}>{isAdminMode ? 'Admin Access' : 'Acceso Privado'}</h3>
            
            <form onSubmit={handleLogin} className="space-y-6">
                {!isAdminMode ? (
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Código de Empresa</label>
                        <div className="relative">
                            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                            <input 
                                type="text" 
                                className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-slate-800 uppercase tracking-widest focus:border-brand-500 transition-all" 
                                placeholder="INGRESE SU CÓDIGO" 
                                value={accessCode} 
                                onChange={(e) => setAccessCode(e.target.value)} 
                                disabled={isLoading} 
                                autoFocus
                            />
                        </div>
                        <p className="text-[9px] text-slate-400 mt-3 ml-1 font-medium italic">* Solicite su código al administrador del sistema.</p>
                    </div>
                ) : (
                    <div>
                         <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                            <input type="password" className="w-full pl-12 pr-6 py-4 bg-slate-900 border border-slate-700 rounded-2xl outline-none font-black text-white tracking-widest focus:border-brand-500 transition-all" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} />
                        </div>
                    </div>
                )}
                {error && <div className="text-red-500 text-[10px] font-black uppercase flex items-center gap-2 px-1 animate-pulse"><AlertTriangle size={12}/> {error}</div>}
                <button type="submit" disabled={isLoading} className={`w-full py-5 rounded-2xl font-black text-xs shadow-2xl flex items-center justify-center gap-3 transition-all active:scale-95 ${isLoading ? 'bg-slate-100 text-slate-300' : isAdminMode ? 'bg-white text-slate-900' : 'bg-brand-500 text-white shadow-brand-500/30'}`}>
                    {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> {statusMessage.toUpperCase()}</> : <>CONTINUAR <ArrowRight size={18} /></>}
                </button>
                <div className="text-center pt-6">
                     <button type="button" onClick={() => { setIsAdminMode(!isAdminMode); setError(null); }} className="text-[10px] font-black text-slate-400 uppercase hover:text-brand-500 transition-colors">Cambiar modo de acceso</button>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
