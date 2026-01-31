
import React from 'react';
import { UserRole } from '../types';
import { Search, Bell, User } from 'lucide-react';

interface HeaderProps {
  userName: string;
  role: UserRole;
  activeTab: string;
}

const Header: React.FC<HeaderProps> = ({ userName, role, activeTab }) => {
  return (
    <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-10">
      <div className="flex flex-col">
        <h1 className="text-xl font-bold text-slate-800 capitalize">
          {activeTab === 'dashboard' ? 'Profitability Dashboard' : activeTab === 'admin' ? 'Company Management' : 'Settings'}
        </h1>
        <p className="text-sm text-slate-500 font-medium">Welcome back, {userName}</p>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="hidden lg:flex items-center bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
          <Search size={18} className="text-slate-400" />
          <input 
            type="text" 
            placeholder="Search reports..." 
            className="bg-transparent border-none outline-none px-2 text-sm w-64 text-slate-600"
          />
        </div>
        
        <div className="relative cursor-pointer text-slate-500 hover:text-slate-800 transition">
          <Bell size={22} />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white rounded-full text-[10px] text-white flex items-center justify-center">2</span>
        </div>
        
        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-800 leading-none">{userName}</p>
            <p className="text-xs text-slate-500 font-medium mt-1 uppercase tracking-wider">{role.replace('_', ' ')}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 border border-slate-300">
            <User size={24} />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
