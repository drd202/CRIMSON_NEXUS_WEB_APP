
import React, { useEffect, useState } from 'react';
import { User, MedicalRecord, UserRole, WearableData } from '../types';
import { backendGetRecords, backendAddRecord, backendGetWearables } from '../services/mockBackend';
import { generateClinicalSummary } from '../services/geminiService';
import { BlockchainViewer } from './BlockchainViewer';
import { RiskInsights } from './RiskInsights';
import { Activity, FileText, Plus, ShieldAlert, Sparkles, UserPlus, Calendar, Clock, ArrowRight, BarChart2, Watch, Heart, Footprints, Droplets } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  user: User; // This is the ACTIVE profile (could be dependent)
}

const mockHealthData = [
  { name: 'Mon', bp: 120, hr: 72 },
  { name: 'Tue', bp: 118, hr: 75 },
  { name: 'Wed', bp: 122, hr: 70 },
  { name: 'Thu', bp: 121, hr: 74 },
  { name: 'Fri', bp: 119, hr: 73 },
  { name: 'Sat', bp: 117, hr: 71 },
  { name: 'Sun', bp: 120, hr: 72 },
];

export const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [showAddRecord, setShowAddRecord] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [wearables, setWearables] = useState<WearableData | null>(null);

  useEffect(() => {
    backendGetRecords(user.id).then(setRecords);
    if (user.role === UserRole.PATIENT) {
        backendGetWearables(user.id).then(setWearables);
    }
  }, [user.id]); // Reload when active profile changes

  const handleAddRecord = async () => {
    if (!newNote) return;
    setIsSummarizing(true);
    const summary = await generateClinicalSummary(newNote, user.country);
    const rec = await backendAddRecord({
      patientId: user.role === UserRole.PATIENT ? user.id : 'patient-001', 
      providerId: user.id, // In simulation, patient adds their own note effectively acting as provider
      title: 'Quick Clinical Note',
      content: newNote,
      aiSummary: summary,
      type: 'CLINICAL_NOTE'
    });
    setRecords([...records, rec]);
    setNewNote('');
    setShowAddRecord(false);
    setIsSummarizing(false);
  };

  const hasData = records.length > 0;

  return (
    <div className="p-4 lg:p-6 space-y-6 lg:space-y-8 animate-fade-in max-w-7xl mx-auto">
      {/* Header Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
        {user.role === UserRole.PATIENT ? (
          <div className="bg-white dark:bg-dark-800 p-6 rounded-2xl border border-gray-100 dark:border-dark-700 shadow-xl dark:shadow-2xl relative overflow-hidden group transition-all duration-300 hover:translate-y-[-2px]">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Activity className="w-16 h-16 text-crimson-500" /></div>
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Heart Rate Avg</h3>
            <p className="text-3xl font-display font-bold text-gray-900 dark:text-white mt-2">{hasData ? '72' : '--'} <span className="text-sm text-gray-400 font-sans font-normal">bpm</span></p>
            <div className="mt-4 h-1 w-full bg-gray-200 dark:bg-dark-700 rounded-full overflow-hidden"><div className={`h-full bg-crimson-500 transition-all duration-1000 ${hasData ? 'w-[75%]' : 'w-0'}`}></div></div>
          </div>
        ) : (
           <div className="bg-white dark:bg-dark-800 p-6 rounded-2xl border border-gray-100 dark:border-dark-700 shadow-xl dark:shadow-2xl relative overflow-hidden group transition-all duration-300 hover:translate-y-[-2px]">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><UserPlus className="w-16 h-16 text-blue-500" /></div>
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">New Requests</h3>
            <p className="text-3xl font-display font-bold text-gray-900 dark:text-white mt-2">2 <span className="text-sm text-gray-400 font-sans font-normal">pending</span></p>
            <p className="text-blue-500 text-xs mt-1 font-medium cursor-pointer hover:underline">Review Now</p>
          </div>
        )}

        <div className="bg-white dark:bg-dark-800 p-6 rounded-2xl border border-gray-100 dark:border-dark-700 shadow-xl dark:shadow-2xl transition-all duration-300">
           <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">{user.role === UserRole.PATIENT ? 'Next Appointment' : 'Pending Appointments'}</h3>
           <p className="text-xl font-display font-bold text-gray-900 dark:text-white mt-2">{user.role === UserRole.PATIENT ? 'None Scheduled' : '1 Action Required'}</p>
           <p className="text-crimson-500 dark:text-crimson-400 text-sm mt-1 font-medium cursor-pointer">{user.role === UserRole.PATIENT ? 'Book Now' : 'View Calendar'}</p>
        </div>
        
        <div className="bg-white dark:bg-dark-800 p-6 rounded-2xl border border-gray-100 dark:border-dark-700 shadow-xl dark:shadow-2xl transition-all duration-300">
           <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Records Secured</h3>
           <p className="text-3xl font-display font-bold text-gray-900 dark:text-white mt-2">{records.length}</p>
           <p className="text-emerald-600 dark:text-emerald-500 text-xs mt-1 flex items-center gap-1 font-medium"><ShieldAlert className="w-3 h-3" /> Blockchain Verified</p>
        </div>

        <div className="bg-gradient-to-br from-crimson-600 to-crimson-800 dark:from-crimson-700 dark:to-crimson-900 p-6 rounded-2xl border border-crimson-500 dark:border-crimson-600 shadow-xl text-white transition-all duration-300 sm:col-span-2 md:col-span-1 flex flex-col justify-between">
           <div><h3 className="text-crimson-100 text-sm font-medium">Active Profile:</h3><p className="text-lg font-bold truncate">{user.name}</p></div>
           <div className="mt-4 pt-4 border-t border-crimson-500/30">
             {user.role === UserRole.PROVIDER || records.length === 0 ? (
               <div onClick={() => setShowAddRecord(!showAddRecord)} className="flex items-center gap-2 text-xs font-bold bg-white/10 p-2 rounded-lg cursor-pointer hover:bg-white/20 transition-colors">
                 <Plus className="w-4 h-4" /><span>{user.role === UserRole.PROVIDER ? 'Create Clinical Note' : 'Upload First Record'}</span>
               </div>
             ) : (
               <div className="flex items-center gap-2 text-xs font-bold bg-white/10 p-2 rounded-lg"><ShieldAlert className="w-4 h-4" /><span>System Secure</span></div>
             )}
           </div>
        </div>
      </div>
      
      {/* Wearables */}
      {user.role === UserRole.PATIENT && wearables && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-dark-900 text-white rounded-2xl p-6 border border-dark-700 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none"><Watch className="w-32 h-32" /></div>
               <div className="col-span-2 md:col-span-4 flex justify-between items-center mb-2 z-10">
                   <h3 className="font-display font-bold flex items-center gap-2"><Watch className="w-4 h-4 text-emerald-400" /> Connected Wearables</h3>
                   <span className="text-[10px] text-gray-400">Synced: {wearables.lastSync.toLocaleTimeString()}</span>
               </div>
               <div className="bg-dark-800 p-3 rounded-xl border border-dark-700"><div className="flex items-center gap-2 text-xs text-gray-400 mb-1"><Heart className="w-3 h-3 text-red-500" /> BPM</div><span className="text-xl font-bold">{wearables.heartRate}</span></div>
               <div className="bg-dark-800 p-3 rounded-xl border border-dark-700"><div className="flex items-center gap-2 text-xs text-gray-400 mb-1"><Footprints className="w-3 h-3 text-blue-400" /> Steps</div><span className="text-xl font-bold">{wearables.steps}</span></div>
               <div className="bg-dark-800 p-3 rounded-xl border border-dark-700"><div className="flex items-center gap-2 text-xs text-gray-400 mb-1"><Droplets className="w-3 h-3 text-cyan-400" /> SpO2</div><span className="text-xl font-bold">{wearables.spO2}%</span></div>
               <div className="bg-dark-800 p-3 rounded-xl border border-dark-700"><div className="flex items-center gap-2 text-xs text-gray-400 mb-1"><Activity className="w-3 h-3 text-purple-400" /> BP</div><span className="text-xl font-bold">{wearables.bloodPressureSys}/{wearables.bloodPressureDia}</span></div>
          </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6 min-w-0">
             {/* Chart */}
             <div className="bg-white dark:bg-dark-800 p-6 rounded-2xl border border-gray-100 dark:border-dark-700 shadow-xl dark:shadow-2xl">
                <h2 className="text-xl font-display font-bold mb-6 flex items-center gap-2 text-gray-900 dark:text-white"><Activity className="text-crimson-500" /> {user.role === UserRole.PATIENT ? 'Vitals History' : 'Practice Activity'}</h2>
                <div className="h-[300px] w-full min-w-0 flex items-center justify-center">
                    {hasData ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={mockHealthData}><CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} /><XAxis dataKey="name" stroke="#888" fontSize={12} tickLine={false} axisLine={false} /><YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} /><Tooltip contentStyle={{ backgroundColor: 'rgba(20,20,20, 0.9)', border: 'none', borderRadius: '8px', color: '#fff' }} /><Line type="monotone" dataKey="hr" stroke="#dc143c" strokeWidth={3} dot={{r: 4, fill: '#dc143c', strokeWidth: 0}} activeDot={{ r: 8 }} /><Line type="monotone" dataKey="bp" stroke="#059669" strokeWidth={3} dot={{r: 4, fill: '#059669', strokeWidth: 0}} /></LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-gray-400 h-full w-full bg-gray-50 dark:bg-dark-900/50 rounded-xl border border-dashed border-gray-200 dark:border-dark-600"><BarChart2 className="w-12 h-12 mb-3 opacity-20" /><p className="font-medium text-sm">No health data available</p></div>
                    )}
                </div>
            </div>
            {/* Risk Insights */}
            {user.role === UserRole.PATIENT && <RiskInsights user={user} />}
        </div>

        {/* Right Column: Feed */}
        <div className="bg-white dark:bg-dark-800 p-6 rounded-2xl border border-gray-100 dark:border-dark-700 shadow-xl dark:shadow-2xl flex flex-col h-full min-h-[500px]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-display font-bold flex items-center gap-2 text-gray-900 dark:text-white"><FileText className="text-crimson-500" /> Recent Records</h2>
            <button onClick={() => setShowAddRecord(!showAddRecord)} className="p-2 bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600 rounded-lg transition-colors text-gray-600 dark:text-gray-300"><Plus className="w-5 h-5" /></button>
          </div>
          {showAddRecord && (
            <div className="mb-4 p-4 bg-gray-50 dark:bg-dark-900 rounded-xl border border-gray-200 dark:border-dark-600 animate-fade-in-down">
              <textarea className="w-full bg-white dark:bg-dark-800 border border-gray-300 dark:border-dark-600 rounded-lg p-3 text-sm text-gray-900 dark:text-white mb-3 focus:ring-2 focus:ring-crimson-500 outline-none placeholder-gray-400" placeholder="Enter clinical notes..." rows={3} value={newNote} onChange={(e) => setNewNote(e.target.value)} />
              <button onClick={handleAddRecord} disabled={isSummarizing} className="w-full bg-crimson-600 hover:bg-crimson-500 text-white py-2 rounded-lg text-sm font-medium shadow-lg flex items-center justify-center gap-2">{isSummarizing ? <><Sparkles className="w-4 h-4 animate-spin" /> AI Summarizing...</> : 'Sign & Hash Record'}</button>
            </div>
          )}
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {!hasData ? <div className="flex flex-col items-center justify-center h-full text-center text-gray-400"><FileText className="w-10 h-10 mb-2 opacity-50" /><p className="text-sm">No records found.</p></div> : records.map(rec => (
              <div key={rec.id} className="p-4 bg-gray-50 dark:bg-dark-900/50 border border-gray-200 dark:border-dark-700 rounded-xl hover:border-crimson-200 dark:hover:border-crimson-900 transition-all group">
                <div className="flex justify-between items-start mb-2"><span className="text-[10px] font-bold text-crimson-600 dark:text-crimson-400 px-2 py-0.5 bg-crimson-50 dark:bg-crimson-900/20 rounded-full border border-crimson-100 dark:border-crimson-900/50">{rec.type.replace('_', ' ')}</span><span className="text-xs text-gray-500">{rec.date}</span></div>
                <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-1">{rec.title}</h4>
                {rec.aiSummary ? <div className="mb-3 p-2 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg border-l-2 border-blue-400"><p className="text-xs text-blue-700 dark:text-blue-300 italic"><Sparkles className="w-3 h-3 inline mr-1" />{rec.aiSummary}</p></div> : <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">{rec.content}</p>}
                <BlockchainViewer hash={rec.bsvTxId} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
