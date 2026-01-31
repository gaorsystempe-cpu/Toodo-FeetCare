
import React, { useState, useEffect } from 'react';
import { X, Server, Database, User, Key, Save, AlertCircle, HelpCircle, RotateCcw } from 'lucide-react';

export interface ConnectionConfig {
  url: string;
  db: string;
  username: string;
  apiKey: string;
}

interface OdooConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialConfig: ConnectionConfig;
  onSave: (config: ConnectionConfig) => void;
}

const OdooConfigModal: React.FC<OdooConfigModalProps> = ({ isOpen, onClose, initialConfig, onSave }) => {
  const [config, setConfig] = useState<ConnectionConfig>(initialConfig);

  // Reset config when modal opens with new initialConfig
  useEffect(() => {
    if (isOpen) {
      setConfig(initialConfig);
    }
  }, [isOpen, initialConfig]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(config);
    onClose();
  };

  const handleReset = () => {
    if(confirm('¿Restaurar configuración por defecto?')) {
        setConfig({
            url: 'https://igp.facturaclic.pe/',
            db: 'igp_master',
            username: 'soporte@facturaclic.pe',
            apiKey: '6d50304b768a9e09de0978cf46155769f9410809'
        });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 transition-all">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-200">
        
        {/* Header */}
        <div className="bg-slate-50 px-6 py-4 flex justify-between items-center border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Server className="w-5 h-5 text-brand-500" />
              Configurar Servidor
            </h2>
            <p className="text-slate-500 text-xs mt-1 font-medium">Conexión Odoo XML-RPC</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors bg-white p-1 rounded-full hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 mb-6 flex gap-3">
            <AlertCircle className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
            <div className="text-sm text-brand-800">
              <p className="font-bold mb-1">Datos de Conexión</p>
              <p className="font-light leading-relaxed text-brand-900/80">
                Estos datos se guardan localmente para establecer la conexión con su servidor Odoo. 
                Asegúrese de que el servidor permite conexiones externas via XML-RPC.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">URL del Servidor</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none group-focus-within:text-brand-500 transition-colors">
                  <Server className="h-4 w-4" />
                </div>
                <input 
                  type="url" 
                  value={config.url}
                  onChange={(e) => setConfig({...config, url: e.target.value})}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-medium text-sm"
                  placeholder="https://odoo-server.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Base de Datos</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none group-focus-within:text-brand-500 transition-colors">
                  <Database className="h-4 w-4" />
                </div>
                <input 
                  type="text" 
                  value={config.db}
                  onChange={(e) => setConfig({...config, db: e.target.value})}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-medium text-sm"
                  placeholder="my_database"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Usuario</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none group-focus-within:text-brand-500 transition-colors">
                    <User className="h-4 w-4" />
                  </div>
                  <input 
                    type="text" 
                    value={config.username}
                    onChange={(e) => setConfig({...config, username: e.target.value})}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-medium text-sm"
                    placeholder="admin"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">API Key / Token</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none group-focus-within:text-brand-500 transition-colors">
                    <Key className="h-4 w-4" />
                  </div>
                  <input 
                    type="password" 
                    value={config.apiKey}
                    onChange={(e) => setConfig({...config, apiKey: e.target.value})}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-mono text-sm"
                    placeholder="••••••••••••"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between gap-4">
            <button 
              type="button"
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all text-xs font-bold uppercase tracking-wider"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
            
            <div className="flex gap-3">
              <button 
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 text-slate-500 hover:text-slate-800 font-bold text-sm transition-colors"
              >
                Cerrar
              </button>
              <button 
                type="submit"
                className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-8 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-brand-600/20 transition-all active:scale-95"
              >
                <Save className="w-4 h-4" />
                Guardar Cambios
              </button>
            </div>
          </div>
        </form>

        {/* Help Link */}
        <div className="bg-slate-50 px-6 py-4 flex items-center justify-center gap-2 border-t border-slate-100">
          <HelpCircle className="w-4 h-4 text-slate-400" />
          <p className="text-[11px] text-slate-400 font-medium tracking-wide uppercase">
            ¿Necesitas ayuda con las credenciales? <a href="#" className="text-brand-600 hover:underline">Guía de Conexión</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default OdooConfigModal;
