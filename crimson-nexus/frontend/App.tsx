import React, { useState, useEffect } from 'react';
import { User } from './types';
import { Layout } from './components/Layout';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { ChatInterface } from './components/ChatInterface';
import { RecordsView } from './components/RecordsView';
import { AppointmentsView } from './components/AppointmentsView';
import { AboutView } from './components/AboutView';
import { AITools } from './components/AITools';
import { DoctorWorkspace } from './components/DoctorWorkspace';
import { EmergencyMode } from './components/EmergencyMode';
import { exportDatabase, importDatabase, resetDatabase, backendUpdateUser } from './services/mockBackend';
import { initEmailJS } from './services/emailjsService'; // NEW: EmailJS initialization
import { Moon, Sun, Monitor, Shield, Key, Bell, Lock, Database, Download, Upload, Trash2, AlertCircle, Loader2, Globe } from 'lucide-react';
import JSZip from 'jszip';

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeProfile, setActiveProfile] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState('about');
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });
  const [exporting, setExporting] = useState(false);
  
  // Missing Info State
  const [showMissingInfoModal, setShowMissingInfoModal] = useState(false);
  const [missingCountry, setMissingCountry] = useState('United States');

  // NEW: Initialize EmailJS when app starts
  useEffect(() => {
    initEmailJS();
  }, []);

  useEffect(() => {
    if (isDarkMode) { document.documentElement.classList.add('dark'); localStorage.setItem('theme', 'dark'); } 
    else { document.documentElement.classList.remove('dark'); localStorage.setItem('theme', 'light'); }
  }, [isDarkMode]);

  // Set active profile when user logs in and check for missing country
  useEffect(() => {
      if (user) {
          if (!activeProfile) setActiveProfile(user);
          if (!user.country) setShowMissingInfoModal(true);
      }
  }, [user]);

  const handleUpdateMissingInfo = async () => {
      if (!user) return;
      const updated = await backendUpdateUser(user.id, { country: missingCountry });
      if (updated) {
          setUser(updated);
          setActiveProfile(updated);
          setShowMissingInfoModal(false);
      }
  };

  const handleExport = async () => {
      setExporting(true);
      try {
          const zip = new JSZip();
          const dbData = await JSON.parse(await exportDatabase());
          const imgFolder = zip.folder("shared_images");
          let count = 0;
          const getBase64FromUrl = async (url: string) => { try { const data = await fetch(url); return await data.blob(); } catch (e) { return null; } }

          if (dbData.p2pMessages) {
            for (const msg of dbData.p2pMessages) {
                if (msg.attachmentType === 'image' && msg.attachmentUrl) {
                    try {
                        let fileName = `chat_msg_${msg.id}.png`;
                        if (msg.attachmentUrl.startsWith('data:')) { imgFolder?.file(fileName, msg.attachmentUrl.split(',')[1], {base64: true}); count++; } 
                        else { const blobData = await getBase64FromUrl(msg.attachmentUrl); if (blobData) { imgFolder?.file(fileName, blobData); count++; } }
                    } catch (e) { console.error("Failed to zip image", e); }
                }
            }
          }
          if (dbData.records) {
            for (const rec of dbData.records) {
                 if (rec.fileUrl) {
                     try {
                        let fileName = rec.fileName || `rec_${rec.id}.png`;
                        if (rec.fileUrl.startsWith('data:')) { imgFolder?.file(fileName, rec.fileUrl.split(',')[1], {base64: true}); count++; } 
                        else { const blobData = await getBase64FromUrl(rec.fileUrl); if (blobData) { imgFolder?.file(fileName, blobData); count++; } }
                     } catch(e) { console.error("Failed to zip record file", e); }
                 }
            }
          }
          if (count === 0) { alert("No shared images or medical attachments found to download."); setExporting(false); return; }
          const content = await zip.generateAsync({type:"blob"});
          const url = URL.createObjectURL(content);
          const a = document.createElement('a'); a.href = url; a.download = `crimson-nexus-images-${new Date().toISOString().split('T')[0]}.zip`; document.body.appendChild(a); a.click(); document.body.removeChild(a);
      } catch (e) { alert("Failed to export images."); } finally { setExporting(false); }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = async (event) => { if (event.target?.result) { const success = await importDatabase(event.target.result as string); if (success) { alert("Database restored successfully! Reloading..."); window.location.reload(); } else { alert("Invalid backup file."); } } };
      reader.readAsText(file);
  };
  const handleReset = () => { if (window.confirm("Are you sure? This will delete ALL local data.")) { resetDatabase(); } };

  if (!user) return <Auth onLogin={setUser} />;
  if (!activeProfile) return <div className="min-h-screen bg-black flex items-center justify-center text-white"><Loader2 className="animate-spin" /></div>;

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard user={activeProfile} />; 
      case 'records': return <RecordsView currentUser={activeProfile} />;
      case 'appointments': return <AppointmentsView currentUser={activeProfile} />;
      case 'chat': return <div className="h-full p-4 md:p-6 max-w-[1600px] mx-auto flex flex-col"><ChatInterface currentUser={user} /></div>; 
      case 'aitools': return <AITools userCountry={activeProfile.country} />;
      case 'doctorworkspace': return <DoctorWorkspace currentUser={user} userCountry={activeProfile.country} />;
      case 'about': return <AboutView />;
      case 'settings':
        return (
          <div className="p-8 max-w-4xl mx-auto animate-fade-in">
            <h2 className="text-3xl font-display font-bold text-gray-900 dark:text-white mb-2">Settings & Privacy</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8">Manage your application preferences and security settings.</p>
            <div className="grid gap-6">
              <div className="bg-white dark:bg-dark-800 rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-dark-700">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg text-purple-600 dark:text-purple-400"><Monitor className="w-6 h-6" /></div>
                  <div><h3 className="text-lg font-bold text-gray-900 dark:text-white">Appearance</h3><p className="text-sm text-gray-500 dark:text-gray-400">Customize the look and feel of Nexus</p></div>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-900/50 rounded-xl border border-gray-100 dark:border-dark-700/50">
                  <div className="flex items-center gap-3">{isDarkMode ? <Moon className="text-crimson-500 w-5 h-5" /> : <Sun className="text-amber-500 w-5 h-5" />}<span className="font-medium text-gray-700 dark:text-gray-200">Dark Mode</span></div>
                  <button onClick={() => setIsDarkMode(!isDarkMode)} className={`relative w-14 h-8 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-crimson-500 ${isDarkMode ? 'bg-crimson-600' : 'bg-gray-300'}`}><span className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${isDarkMode ? 'translate-x-6' : 'translate-x-0'}`}>{isDarkMode && <Moon className="w-3 h-3 text-crimson-600 absolute top-1.5 left-1.5" />}{!isDarkMode && <Sun className="w-3 h-3 text-amber-500 absolute top-1.5 left-1.5" />}</span></button>
                </div>
              </div>
              
              <div className="bg-white dark:bg-dark-800 rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-dark-700">
                  <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg text-emerald-600 dark:text-emerald-400"><Globe className="w-6 h-6" /></div>
                      <div><h3 className="text-lg font-bold text-gray-900 dark:text-white">Region & AI Localization</h3><p className="text-sm text-gray-500 dark:text-gray-400">Your current location settings for AI advice.</p></div>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-dark-900/50 rounded-xl border border-gray-100 dark:border-dark-700/50 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                          <Globe className="text-gray-400 w-5 h-5" />
                          <div>
                              <p className="font-bold text-gray-700 dark:text-gray-200 text-sm">Active Region</p>
                              <p className="text-xs text-crimson-500 font-bold">{user.country || "Not Set"}</p>
                          </div>
                      </div>
                  </div>
              </div>

              <div className="bg-white dark:bg-dark-800 rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-dark-700">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400"><Database className="w-6 h-6" /></div>
                  <div><h3 className="text-lg font-bold text-gray-900 dark:text-white">Local Data Management</h3><p className="text-sm text-gray-500 dark:text-gray-400">Backup media and restore your local database. <br/><span className="text-xs text-emerald-500">AES-256 Encrypted</span></p></div>
                </div>
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-900/50 rounded-xl border border-gray-100 dark:border-dark-700/50">
                        <div className="flex items-center gap-3"><Download className="text-gray-500 w-5 h-5" /><div><p className="font-bold text-gray-700 dark:text-gray-200 text-sm">Download Shared Images</p><p className="text-xs text-gray-500">Export all PNGs/images from chats and records.</p></div></div>
                        <button onClick={handleExport} disabled={exporting} className="px-4 py-2 bg-gray-200 dark:bg-dark-700 hover:bg-gray-300 dark:hover:bg-dark-600 rounded-lg text-xs font-bold transition-colors flex items-center gap-2">{exporting && <Loader2 className="w-3 h-3 animate-spin" />}{exporting ? 'Zipping...' : 'Download Zip'}</button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-900/50 rounded-xl border border-gray-100 dark:border-dark-700/50">
                        <div className="flex items-center gap-3"><Upload className="text-gray-500 w-5 h-5" /><div><p className="font-bold text-gray-700 dark:text-gray-200 text-sm">Restore Data</p><p className="text-xs text-gray-500">Import a previously saved backup.</p></div></div>
                        <label className="px-4 py-2 bg-gray-200 dark:bg-dark-700 hover:bg-gray-300 dark:hover:bg-dark-600 rounded-lg text-xs font-bold transition-colors cursor-pointer">Import<input type="file" accept=".json" onChange={handleImport} className="hidden" /></label>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30">
                        <div className="flex items-center gap-3"><Trash2 className="text-red-500 w-5 h-5" /><div><p className="font-bold text-red-700 dark:text-red-400 text-sm">Reset Application</p><p className="text-xs text-red-400">Wipe all local data and start fresh.</p></div></div>
                        <button onClick={handleReset} className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition-colors shadow-lg shadow-red-900/20">Reset All</button>
                    </div>
                </div>
              </div>
            </div>
          </div>
        );
      default: return <Dashboard user={activeProfile} />;
    }
  };

  return (
    <>
        <Layout 
            currentUser={user} 
            activeProfile={activeProfile}
            onSwitchProfile={setActiveProfile}
            onLogout={() => { setUser(null); setActiveProfile(null); }}
            currentView={currentView}
            setCurrentView={setCurrentView}
            onTriggerEmergency={() => setIsEmergencyMode(true)}
        >
            {renderContent()}
        </Layout>
        
        {isEmergencyMode && activeProfile && (
            <EmergencyMode 
                currentUser={activeProfile} 
                onClose={() => setIsEmergencyMode(false)} 
            />
        )}

        {/* Missing Country Modal for Backward Compatibility */}
        {showMissingInfoModal && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                <div className="bg-white dark:bg-dark-900 rounded-2xl w-full max-w-md p-6 border border-gray-200 dark:border-dark-700 shadow-2xl animate-fade-in-down">
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-crimson-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-crimson-900/30">
                            <Globe className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Location Update Required</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                            To provide accurate AI medical advice, emergency numbers, and medication info, we need your region.
                        </p>
                    </div>
                    
                    <div className="mb-6">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Select Country</label>
                        <select 
                            value={missingCountry}
                            onChange={e => setMissingCountry(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-dark-800 border border-gray-200 dark:border-dark-600 rounded-xl p-3 focus:ring-2 focus:ring-crimson-500 outline-none text-gray-900 dark:text-white"
                        >
                            {["United States", "United Kingdom", "Canada", "Australia", "Germany", "France", "Japan", "India", "Brazil", "China", "South Africa", "Other"].map(c => 
                                <option key={c} value={c}>{c}</option>
                            )}
                        </select>
                    </div>
                    
                    <button 
                        onClick={handleUpdateMissingInfo}
                        className="w-full bg-crimson-600 hover:bg-crimson-500 text-white font-bold py-3 rounded-xl transition-all"
                    >
                        Update Profile
                    </button>
                </div>
            </div>
        )}
    </>
  );
};
export default App;