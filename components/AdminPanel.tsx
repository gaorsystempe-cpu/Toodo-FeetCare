
import React, { useState } from 'react';
import { OdooCredential } from '../types';
import { 
  Plus, 
  Trash2, 
  RefreshCcw, 
  CheckCircle2, 
  XCircle, 
  MoreVertical,
  Edit2,
  Database,
  ExternalLink,
  ShieldCheck,
  UserCheck
} from 'lucide-react';

interface AdminPanelProps {
  credentials: OdooCredential[];
  setCredentials: React.Dispatch<React.SetStateAction<OdooCredential[]>>;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ credentials, setCredentials }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCred, setNewCred] = useState<Partial<OdooCredential>>({
    companyName: '',
    friendlyName: '',
    friendlyPassword: '',
    url: '',
    db: '',
    username: '',
    apiKey: '',
    isActive: true
  });

  const handleAdd = () => {
    if (newCred.companyName && newCred.url && newCred.friendlyName) {
      setCredentials([
        ...credentials,
        {
          ...(newCred as OdooCredential),
          id: Date.now().toString(),
          lastSync: 'Recién conectado'
        }
      ]);
      setShowAddModal(false);
      setNewCred({ companyName: '', friendlyName: '', friendlyPassword: '', url: '', db: '', username: '', apiKey: '', isActive: true });
    }
  };

  const removeCred = (id: string) => {
    if (window.confirm('¿Eliminar esta conexión de forma permanente?')) {
      setCredentials(prev => prev.filter(c => c.id !== id));
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Bases de Datos Conectadas</h2>
          <p className="text-slate-500 text-sm mt-1">Gestione las conexiones Odoo y los accesos simplificados para clientes.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition active:scale-95 shadow-lg shadow-blue-500/20"
        >
          <Plus size={20} />
          <span>Nueva Conexión</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr className="text-slate-500 text-xs uppercase tracking-wider font-bold">
              <th className="px-6 py-4">Empresa & Odoo</th>
              <th className="px-6 py-4">Acceso Cliente (Friendly)</th>
              <th className="px-6 py-4">Estado</th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {credentials.map(cred => (
              <tr key={cred.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                         <Database size={20} />
                      </div>
                      <div>
                         <p className="font-bold text-slate-800">{cred.companyName}</p>
                         <p className="text-xs text-slate-400">{cred.url}</p>
                      </div>
                   </div>
                </td>
                <td className="px-6 py-4">
                   <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-md">
                        <UserCheck size={14} />
                      </div>
                      <div>
                         <p className="text-sm font-bold text-slate-700">{cred.friendlyName}</p>
                         <p className="text-xs text-slate-400">Pass: {cred.friendlyPassword}</p>
                      </div>
                   </div>
                </td>
                <td className="px-6 py-4">
                   <span className={`px-3 py-1 rounded-full text-xs font-bold ${cred.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                     {cred.isActive ? 'Activo' : 'Inactivo'}
                   </span>
                </td>
                <td className="px-6 py-4 text-right">
                   <div className="flex items-center justify-end gap-2">
                      <button onClick={() => removeCred(cred.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                         <Trash2 size={18} />
                      </button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl animate-in zoom-in duration-300 my-8">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Configurar Nueva Empresa</h3>
                <p className="text-sm text-slate-500">Defina los parámetros técnicos y el acceso amigable para el cliente.</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Sección Técnica */}
              <div className="space-y-4">
                <h4 className="font-bold text-blue-600 text-sm uppercase tracking-widest border-b pb-2">Conexión Odoo (XML-RPC)</h4>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Nombre Real de Empresa</label>
                  <input type="text" className="w-full p-2.5 bg-slate-50 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ej: Inversiones Vida" value={newCred.companyName} onChange={e => setNewCred({...newCred, companyName: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">URL de Odoo</label>
                  <input type="text" className="w-full p-2.5 bg-slate-50 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="https://..." value={newCred.url} onChange={e => setNewCred({...newCred, url: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Base de Datos</label>
                  <input type="text" className="w-full p-2.5 bg-slate-50 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="db_master" value={newCred.db} onChange={e => setNewCred({...newCred, db: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">API Key / Token</label>
                  <input type="password" className="w-full p-2.5 bg-slate-50 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="6d50304b..." value={newCred.apiKey} onChange={e => setNewCred({...newCred, apiKey: e.target.value})} />
                </div>
              </div>

              {/* Sección Cliente */}
              <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-dashed border-slate-200">
                <h4 className="font-bold text-indigo-600 text-sm uppercase tracking-widest border-b pb-2">Acceso Amigable (Para Cliente)</h4>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Nombre de Negocio (Login ID)</label>
                  <input type="text" className="w-full p-2.5 bg-white border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 font-bold" placeholder="Ej: cafetal" value={newCred.friendlyName} onChange={e => setNewCred({...newCred, friendlyName: e.target.value})} />
                  <p className="text-[10px] text-slate-400 mt-1">Este es el nombre que el cliente usará para entrar.</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Clave de Acceso</label>
                  <input type="text" className="w-full p-2.5 bg-white border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Ej: cafetal2024" value={newCred.friendlyPassword} onChange={e => setNewCred({...newCred, friendlyPassword: e.target.value})} />
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 rounded-b-2xl border-t flex gap-3 justify-end">
              <button onClick={() => setShowAddModal(false)} className="px-5 py-2 text-slate-500 font-bold">Cancelar</button>
              <button onClick={handleAdd} className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-500/20">Habilitar Empresa</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
