import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { 
  Package, 
  Truck, 
  ShieldCheck, 
  User as UserIcon, 
  Bell, 
  FileText, 
  LayoutDashboard,
  Sparkles,
  RefreshCw,
  Search
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenQuickQuote: () => void;
  onOpenBookOrder: () => void;
  onOpenLoginModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  onOpenQuickQuote,
  onOpenBookOrder,
  onOpenLoginModal,
}) => {
  const { user, switchRole, logout, isLoading } = useAuth();
  const { notifications, unreadCount, setIsDrawerOpen } = useToast();

  const handleRoleChange = async (targetRole: 'ADMIN' | 'CUSTOMER' | 'B2B' | 'AGENT') => {
    await switchRole(targetRole);
    if (targetRole === 'ADMIN') {
      setCurrentTab('admin');
    } else if (targetRole === 'AGENT') {
      setCurrentTab('agent');
    } else {
      setCurrentTab('customer');
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-[#0b0f19]/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentTab('home')}>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-brand-600 via-brand-400 to-cyan-400 flex items-center justify-center shadow-lg shadow-brand-500/25">
              <Truck className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-brand-300 bg-clip-text text-transparent">
                  LogiTrack
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-brand-500/10 border border-brand-500/30 text-brand-400">
                  v1.0 Pro
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Last-Mile Operations & Intelligent Routing
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => setCurrentTab('home')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'home'
                  ? 'bg-brand-500/15 text-brand-300 border border-brand-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Overview
            </button>

            <button
              onClick={() => setCurrentTab('customer')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                currentTab === 'customer'
                  ? 'bg-brand-500/15 text-brand-300 border border-brand-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Package className="w-4 h-4" />
              Customer Portal
            </button>

            <button
              onClick={() => setCurrentTab('agent')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                currentTab === 'agent'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Truck className="w-4 h-4" />
              Agent Hub
            </button>

            <button
              onClick={() => setCurrentTab('admin')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                currentTab === 'admin'
                  ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Admin Operations
            </button>
          </nav>

          {/* Quick Actions & Role Switcher */}
          <div className="flex items-center gap-2.5">
            
            {/* Quick Calculator Trigger */}
            <button
              onClick={onOpenQuickQuote}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition"
              title="Estimate Shipping Rate"
            >
              <Sparkles className="w-3.5 h-3.5 text-brand-400" />
              Calculator
            </button>

            {/* Instant Demo Role Switcher Dropdown */}
            <div className="relative flex items-center gap-1 bg-slate-900 border border-slate-700/80 rounded-xl p-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 px-2 hidden sm:inline">
                Role:
              </span>
              <select
                className="bg-transparent text-xs font-semibold text-slate-200 focus:outline-none cursor-pointer pr-1 py-1"
                value={
                  user?.role === 'ADMIN'
                    ? 'ADMIN'
                    : user?.companyName?.includes('Apex')
                    ? 'B2B'
                    : user?.role === 'AGENT'
                    ? 'AGENT'
                    : 'CUSTOMER'
                }
                onChange={(e) => handleRoleChange(e.target.value as any)}
                disabled={isLoading}
              >
                <option value="ADMIN" className="bg-slate-900 text-indigo-300">👑 Admin (Siddharth)</option>
                <option value="CUSTOMER" className="bg-slate-900 text-sky-300">👤 Customer (John - B2C)</option>
                <option value="B2B" className="bg-slate-900 text-amber-300">🏢 B2B Client (Apex Global)</option>
                <option value="AGENT" className="bg-slate-900 text-emerald-300">🛵 Agent (Rajesh Kumar)</option>
              </select>
            </div>

            {/* Login / Auth Modal Trigger */}
            <button
              onClick={onOpenLoginModal}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 transition"
              title="Login or Switch User"
            >
              <UserIcon className="w-3.5 h-3.5 text-brand-400" />
              <span className="hidden sm:inline">Sign In</span>
            </button>

            {/* Notification Drawer Bell */}
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="relative p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition"
              title="Notifications & Simulated Email/SMS Logs"
            >
              <Bell className="w-4 h-4" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                  {notifications.length}
                </span>
              )}
            </button>

            {/* Primary Order Book Action */}
            <button
              onClick={onOpenBookOrder}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-brand-500 to-cyan-500 hover:from-brand-600 hover:to-cyan-600 text-white text-xs font-bold shadow-lg shadow-brand-500/20 transition transform active:scale-95"
            >
              <Package className="w-3.5 h-3.5" />
              Book Delivery
            </button>

          </div>
        </div>
      </div>
    </header>
  );
};

