import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, BedDouble, Users, Package, Bell, Activity,
  LogOut, Menu, X, Globe, ChevronRight, Settings, Moon, Sun, Beaker
} from 'lucide-react';
import { useSmartHealth } from '../context/SmartHealthContext';

const LANGUAGES = [
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'hi', label: 'हि', name: 'Hindi' },
  { code: 'mr', label: 'म', name: 'Marathi' }
];

export default function Sidebar({ activeTab, setActiveTab, isAdmin = false, unreadAlerts = 0 }) {
  const { user, logout, language, changeLanguage, theme, toggleTheme, t } = useSmartHealth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const phcNav = [
    { id: 'dashboard', icon: LayoutDashboard, label: t('dashboard') },
    { id: 'beds', icon: BedDouble, label: t('bedManagement') },
    { id: 'patients', icon: Users, label: t('patients') },
    { id: 'inventory', icon: Package, label: t('inventory') },
    { id: 'lab_tests', icon: Beaker, label: 'Lab Tests' },
    { id: 'alerts', icon: Bell, label: t('alerts'), badge: unreadAlerts },
    { id: 'attendance', icon: Activity, label: t('attendance') },
  ];

  const adminNav = [
    { id: 'dashboard', icon: LayoutDashboard, label: t('dashboard') },
    { id: 'hospitals', icon: Activity, label: t('hospitals') },
    { id: 'alerts', icon: Bell, label: t('alerts'), badge: unreadAlerts },
    { id: 'inventory', icon: Package, label: t('inventory') },
    { id: 'redistribution', icon: Globe, label: t('redistribution') },
  ];

  let navItems = isAdmin ? adminNav : phcNav;
  if (!isAdmin && user) {
    if (user.role === 'Receptionist') {
      navItems = phcNav.filter(i => ['dashboard', 'beds', 'patients'].includes(i.id));
    } else if (user.role === 'Inventory_Manager') {
      navItems = phcNav.filter(i => ['dashboard', 'inventory', 'lab_tests', 'alerts'].includes(i.id));
    }
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center gap-3 p-5 border-b border-white/10 ${collapsed && !mobileOpen ? 'justify-center' : ''}`}>
        <div className="w-9 h-9 rounded-xl bg-primary-500/20 border border-primary-500/40 flex items-center justify-center flex-shrink-0">
          <Activity className="w-4 h-4 text-primary-400" />
        </div>
        {(!collapsed || mobileOpen) && (
          <div>
            <div className="text-base font-bold font-display text-white leading-tight">Nexa Care</div>
            <div className="text-xs text-primary-400 font-medium">SmartHealth</div>
          </div>
        )}
      </div>

      {/* Role badge */}
      {(!collapsed || mobileOpen) && (
        <div className="px-4 py-3">
          <div className={`text-xs font-semibold px-3 py-1.5 rounded-lg text-center ${
            isAdmin ? 'bg-accent-500/20 text-accent-500 border border-accent-500/30' : 'bg-primary-500/15 text-primary-400 border border-primary-500/25'
          }`}>
            {isAdmin ? '🏛️ District Admin' : `🏥 ${user?.role?.replace('_', ' ') || 'PHC Manager'}`}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto scrollbar-hide">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setMobileOpen(false); }}
              className={`sidebar-item w-full text-left relative ${isActive ? 'active' : ''} ${collapsed && !mobileOpen ? 'justify-center px-2' : ''}`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {(!collapsed || mobileOpen) && (
                <>
                  <span className="flex-1">{item.label}</span>
                  {item.badge > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-60" />}
                </>
              )}
              {collapsed && !mobileOpen && item.badge > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Language switcher */}
      {(!collapsed || mobileOpen) && (
        <div className="px-3 pb-3">
          <div className="glass-card-sm p-2">
            <div className="flex items-center gap-1 mb-2 px-1">
              <Globe className="w-3.5 h-3.5 text-white/40" />
              <span className="text-xs text-white/40 font-medium">Language</span>
            </div>
            <div className="flex gap-1">
              {LANGUAGES.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  title={lang.name}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                    language === lang.code
                      ? 'bg-primary-500 text-white'
                      : 'text-white/40 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Theme toggle */}
      {(!collapsed || mobileOpen) && (
        <div className="px-3 pb-3">
           <button
             onClick={toggleTheme}
             className="w-full glass-card-sm p-2.5 flex items-center justify-between hover:bg-white/10 transition-colors"
           >
             <div className="flex items-center gap-2">
               {theme === 'dark' ? <Moon className="w-4 h-4 text-white/60" /> : <Sun className="w-4 h-4 text-white/60" />}
               <span className="text-xs text-white/60 font-medium">{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
             </div>
             <div className="w-8 h-4 rounded-full bg-white/10 relative">
               <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-primary-400 transition-all ${theme === 'dark' ? 'right-0.5' : 'left-0.5'}`} />
             </div>
           </button>
        </div>
      )}

      {/* User info & logout */}
      <div className={`p-3 border-t border-white/10 ${collapsed && !mobileOpen ? 'flex justify-center' : ''}`}>
        {(!collapsed || mobileOpen) ? (
          <div className="flex items-center gap-3 glass-card-sm p-3">
            <div className="w-8 h-8 rounded-full bg-primary-500/30 border border-primary-500/40 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-primary-400">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white truncate">{user?.name}</div>
              <div className="text-xs text-white/40 truncate">{user?.email}</div>
            </div>
            <div className="relative cursor-pointer hover:bg-white/5 p-1.5 rounded-lg transition-colors" title="Notifications">
              <Bell className="w-4 h-4 text-white/60 hover:text-white" />
              {useSmartHealth().notifications?.length > 0 && (
                <span className="absolute top-1 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse border border-[#081229]"></span>
              )}
            </div>
            <button
              onClick={logout}
              className="p-1.5 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              title={t('logout')}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button onClick={logout} className="p-2 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title={t('logout')}>
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 glass-card-sm p-2.5"
      >
        <Menu className="w-5 h-5 text-white" />
      </button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed left-0 top-0 bottom-0 w-72 z-50 glass-card rounded-none border-r border-white/10 lg:hidden"
            >
              <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 p-2 text-white/40 hover:text-white">
                <X className="w-5 h-5" />
              </button>
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="hidden lg:flex flex-col h-screen sticky top-0 glass-card rounded-none border-r border-white/10 flex-shrink-0 overflow-hidden"
      >
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute top-5 right-3 p-1 text-white/30 hover:text-white/70 transition-colors z-10"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <X className="w-4 h-4" />}
        </button>
        <SidebarContent />
      </motion.aside>
    </>
  );
}
