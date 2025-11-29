
import React, { useState, useEffect } from 'react';
import { User, UserRole, Notification } from '../types';
import { backendGetNotifications } from '../services/mockBackend';
import { FamilyManager } from './FamilyManager';
import { 
  LayoutDashboard, MessageSquare, Settings, LogOut, Menu, X, FileText, Calendar, Wallet, Info, Activity, Stethoscope, Bell, AlertTriangle
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentUser: User; // The Main Account
  activeProfile: User; // Who we are viewing (Main or Dependent)
  onSwitchProfile: (profile: User) => void;
  onLogout: () => void;
  currentView: string;
  setCurrentView: (view: string) => void;
  onTriggerEmergency: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  currentUser, 
  activeProfile,
  onSwitchProfile,
  onLogout,
  currentView,
  setCurrentView,
  onTriggerEmergency
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    backendGetNotifications(currentUser.id).then(setNotifications);
    const interval = setInterval(() => {
        backendGetNotifications(currentUser.id).then(setNotifications);
    }, 10000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const toggleWallet = () => { setIsWalletConnected(!isWalletConnected); };

  const NavItem = ({ view, icon: Icon, label }: { view: string, icon: any, label: string }) => (
    <button
      onClick={() => { setCurrentView(view); setIsSidebarOpen(false); }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
        currentView === view ? 'bg-crimson-600 text-white shadow-lg shadow-crimson-900/40' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-800 hover:text-crimson-600 dark:hover:text-white'
      }`}
    >
      <Icon className={`w-5 h-5 ${currentView === view ? 'text-white' : 'text-gray-400 group-hover:text-crimson-500 dark:text-gray-500 dark:group-hover:text-crimson-400'}`} />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-white overflow-hidden font-sans transition-colors duration-300">
      {/* Mobile Overlay */}
      {isSidebarOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden transition-opacity duration-300" onClick={() => setIsSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-dark-900 border-r border-gray-200 dark:border-dark-800 flex flex-col transition-transform duration-300 ease-in-out shadow-2xl lg:shadow-none ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:inset-auto`}>
        <div className="relative p-6 border-b border-transparent">
          <button onClick={() => { setCurrentView('about'); setIsSidebarOpen(false); }} className="text-left group focus:outline-none block" title="About Crimson Nexus">
            <h1 className="font-display text-2xl font-bold tracking-wider text-gray-900 dark:text-white flex items-center gap-2">
              <div className="w-8 h-8 bg-crimson-600 rounded-lg flex items-center justify-center transform rotate-45 shadow-lg shadow-crimson-600/20 group-hover:rotate-0 transition-transform duration-300">
                <div className="w-4 h-4 bg-white transform -rotate-45 group-hover:rotate-0 transition-transform duration-300"></div>
              </div>
              <div className="flex flex-col">
                  <span className="leading-none flex gap-1"><span className="hidden sm:inline">CRIMSON</span><span className="text-crimson-500">NEXUS</span></span>
                  <span className="text-[9px] text-gray-400 font-sans tracking-widest font-normal mt-1 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">LEARN MORE</span>
              </div>
            </h1>
          </button>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden absolute top-6 right-4 p-2 text-gray-400 hover:text-crimson-500 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-dark-800"><X className="w-6 h-6" /></button>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto">
          <NavItem view="dashboard" icon={LayoutDashboard} label="Overview" />
          <NavItem view="appointments" icon={Calendar} label="Appointments" />
          <NavItem view="records" icon={FileText} label="Medical Records" />
          <NavItem view="chat" icon={MessageSquare} label="Messages" />
          {currentUser.role === UserRole.PATIENT && <NavItem view="aitools" icon={Activity} label="AI Symptom Check" />}
          {currentUser.role === UserRole.PROVIDER && <NavItem view="doctorworkspace" icon={Stethoscope} label="Provider Suite" />}
          <div className="pt-4 mt-4 border-t border-gray-100 dark:border-dark-800">
             <NavItem view="about" icon={Info} label="Architecture" />
             <NavItem view="settings" icon={Settings} label="Settings" />
          </div>
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-dark-800">
          <div className="bg-gray-50 dark:bg-dark-800 rounded-xl p-4 mb-4 flex items-center gap-3 border border-gray-100 dark:border-transparent">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-crimson-500 to-purple-600 text-white flex items-center justify-center text-lg font-bold shadow-md shrink-0">{currentUser.name.charAt(0)}</div>
            <div className="overflow-hidden">
              <p className="font-bold text-sm truncate text-gray-900 dark:text-white">{currentUser.name}</p>
              <p className="text-xs text-gray-500 truncate capitalize">{currentUser.role.toLowerCase()}</p>
            </div>
          </div>
          <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-crimson-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg transition-colors"><LogOut className="w-4 h-4" /> Sign Out</button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative flex flex-col bg-gray-50 dark:bg-black transition-colors duration-300">
        <header className="h-16 border-b border-gray-200 dark:border-dark-800 bg-white/80 dark:bg-dark-900/80 backdrop-blur-md flex items-center justify-between px-4 lg:px-8 z-10 sticky top-0 transition-colors duration-300">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 -ml-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors"><Menu className="w-6 h-6" /></button>
            <h2 className="font-display text-xl font-bold text-gray-800 dark:text-white capitalize truncate max-w-[150px] sm:max-w-none">{currentView.replace('-', ' ')}</h2>
          </div>
          <div className="flex items-center gap-3">
             {currentUser.role === UserRole.PATIENT && (
                 <>
                    <button onClick={onTriggerEmergency} className="hidden sm:flex items-center gap-2 px-4 py-1.5 bg-red-600 text-white rounded-full font-bold text-xs animate-pulse hover:bg-red-500 shadow-lg shadow-red-500/30 transition-all hover:scale-105">
                        <AlertTriangle className="w-4 h-4" /> SOS
                    </button>
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-dark-800 rounded-full border border-gray-200 dark:border-dark-700">
                        <Activity className="w-4 h-4 text-crimson-500" />
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Score: {activeProfile.healthScore || 75}</span>
                    </div>
                    {/* Family Switcher */}
                    <FamilyManager currentUser={currentUser} activeProfile={activeProfile} onSwitchProfile={onSwitchProfile} />
                 </>
             )}

            <button onClick={toggleWallet} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all text-xs font-bold ${isWalletConnected ? 'bg-amber-100 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-500' : 'bg-gray-100 dark:bg-dark-800 border-gray-200 dark:border-dark-700 text-gray-500 dark:text-gray-400 hover:border-crimson-500 hover:text-crimson-500'}`}>
                <Wallet className="w-4 h-4" /><span className="hidden sm:inline">{isWalletConnected ? '1P...XyZ' : 'Connect Wallet'}</span>{isWalletConnected && <span className="w-2 h-2 rounded-full bg-amber-500 ml-1"></span>}
            </button>

            <div className="relative">
                <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 relative text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg transition-colors">
                    <Bell className="w-5 h-5" />{notifications.some(n => !n.read) && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-crimson-500 rounded-full border border-white dark:border-dark-900"></span>}
                </button>
                {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-xl shadow-2xl z-50 animate-fade-in-down overflow-hidden">
                        <div className="p-3 border-b border-gray-100 dark:border-dark-800 flex justify-between items-center bg-gray-50 dark:bg-dark-800/50"><h3 className="font-bold text-sm text-gray-900 dark:text-white">Notifications</h3><button onClick={() => setShowNotifications(false)}><X className="w-4 h-4 text-gray-400" /></button></div>
                        <div className="max-h-64 overflow-y-auto">{notifications.length === 0 ? <div className="p-8 text-center text-gray-400 text-xs">No new notifications.</div> : notifications.map(n => (<div key={n.id} className="p-3 border-b border-gray-100 dark:border-dark-800 hover:bg-gray-50 dark:hover:bg-dark-800/50 transition-colors"><p className="text-xs font-bold text-gray-800 dark:text-gray-200 mb-0.5">{n.title}</p><p className="text-xs text-gray-500">{n.message}</p><span className="text-[10px] text-gray-400 mt-1 block">{new Date(n.timestamp).toLocaleTimeString()}</span></div>))}</div>
                    </div>
                )}
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto relative">{children}</div>
      </main>
    </div>
  );
};
