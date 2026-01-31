
import React from 'react';
import { UserRole } from '../types';
import { 
  LayoutDashboard, 
  Settings, 
  Database, 
  LogOut, 
  PieChart, 
  Users,
  Building2
} from 'lucide-react';

interface SidebarProps {
  role: UserRole;
  activeTab: string;
  setActiveTab: (tab: any) => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ role, activeTab, setActiveTab, onLogout }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ...(role === UserRole.SUPERADMIN ? [{ id: 'admin', label: 'Companies', icon: Building2 }] : []),
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-300">
      <div className="flex items-center justify-center h-20 px-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Database className="text-white w-6 h-6" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">OdooHub SaaS</span>
        </div>
      </div>
      
      <nav className="flex-1 mt-6 px-4 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              activeTab === item.id 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            <item.icon size={20} />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
      
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
        >
          <LogOut size={20} />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
