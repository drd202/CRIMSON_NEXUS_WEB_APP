
import React, { useState, useEffect } from 'react';
import { User, DoctorTask, EmergencyAlert } from '../types';
import { backendGetTasks, backendAddTask, backendGetEmergencyAlerts } from '../services/mockBackend';
import { generateSOAPNote } from '../services/geminiService';
import { ClipboardList, CheckSquare, FileText, User as UserIcon, Plus, Loader2, Sparkles, Clock, AlertCircle, AlertTriangle, Phone, ShieldCheck } from 'lucide-react';

interface DoctorWorkspaceProps {
    currentUser: User;
    userCountry?: string;
}

export const DoctorWorkspace: React.FC<DoctorWorkspaceProps> = ({ currentUser, userCountry }) => {
    const [tasks, setTasks] = useState<DoctorTask[]>([]);
    const [emergencies, setEmergencies] = useState<EmergencyAlert[]>([]);
    const [activeTab, setActiveTab] = useState<'TASKS' | 'SOAP' | 'EMERGENCY'>('TASKS');
    
    // SOAP State
    const [rawNotes, setRawNotes] = useState('');
    const [soapResult, setSoapResult] = useState<{subjective: string, objective: string, assessment: string, plan: string} | null>(null);
    const [generatingSoap, setGeneratingSoap] = useState(false);

    // Tasks State
    const [newTaskDesc, setNewTaskDesc] = useState('');

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 5000); // Poll for emergencies
        return () => clearInterval(interval);
    }, [currentUser]);

    const loadData = () => {
        backendGetTasks(currentUser.id).then(setTasks);
        backendGetEmergencyAlerts(currentUser.id).then(setEmergencies);
    };

    const handleAddTask = async () => {
        if (!newTaskDesc.trim()) return;
        await backendAddTask({
            providerId: currentUser.id,
            description: newTaskDesc,
            priority: 'MEDIUM'
        });
        setNewTaskDesc('');
        loadData();
    };

    const handleGenerateSOAP = async () => {
        if (!rawNotes.trim()) return;
        setGeneratingSoap(true);
        const result = await generateSOAPNote(rawNotes, userCountry);
        setSoapResult(result);
        setGeneratingSoap(false);
    };

    return (
        <div className="p-4 lg:p-8 max-w-6xl mx-auto h-full flex flex-col animate-fade-in">
             <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <ClipboardList className="text-crimson-500" /> Provider Workspace
                </h1>
                {emergencies.length > 0 && (
                    <button onClick={() => setActiveTab('EMERGENCY')} className="animate-pulse bg-red-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-red-500/30">
                        <AlertTriangle className="w-5 h-5" /> {emergencies.length} Active SOS
                    </button>
                )}
            </div>

            <div className="flex gap-6 h-full min-h-[600px]">
                {/* Sidebar Navigation for Workspace */}
                <div className="w-64 flex flex-col gap-2">
                    <button 
                        onClick={() => setActiveTab('TASKS')}
                        className={`p-4 rounded-xl text-left font-bold flex items-center gap-3 transition-colors ${activeTab === 'TASKS' ? 'bg-crimson-600 text-white shadow-lg shadow-crimson-900/30' : 'bg-white dark:bg-dark-800 text-gray-500 hover:bg-gray-50 dark:hover:bg-dark-700'}`}
                    >
                        <CheckSquare className="w-5 h-5" /> Task Manager
                    </button>
                    <button 
                        onClick={() => setActiveTab('SOAP')}
                        className={`p-4 rounded-xl text-left font-bold flex items-center gap-3 transition-colors ${activeTab === 'SOAP' ? 'bg-crimson-600 text-white shadow-lg shadow-crimson-900/30' : 'bg-white dark:bg-dark-800 text-gray-500 hover:bg-gray-50 dark:hover:bg-dark-700'}`}
                    >
                        <Sparkles className="w-5 h-5" /> AI SOAP Notes
                    </button>
                    <button 
                        onClick={() => setActiveTab('EMERGENCY')}
                        className={`p-4 rounded-xl text-left font-bold flex items-center gap-3 transition-colors ${activeTab === 'EMERGENCY' ? 'bg-red-600 text-white shadow-lg shadow-red-900/30' : 'bg-white dark:bg-dark-800 text-gray-500 hover:bg-gray-50 dark:hover:bg-dark-700'}`}
                    >
                        <AlertTriangle className="w-5 h-5" /> Emergency Panel
                    </button>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 shadow-xl overflow-hidden flex flex-col">
                    {activeTab === 'TASKS' && (
                        <div className="p-6 flex flex-col h-full">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Pending Tasks</h2>
                            <div className="flex gap-2 mb-6">
                                <input 
                                    type="text" 
                                    value={newTaskDesc}
                                    onChange={(e) => setNewTaskDesc(e.target.value)}
                                    placeholder="Add a new task..."
                                    className="flex-1 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-600 rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-crimson-500 outline-none text-gray-900 dark:text-white"
                                />
                                <button onClick={handleAddTask} className="bg-crimson-600 hover:bg-crimson-500 text-white p-2 rounded-lg">
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="space-y-3 overflow-y-auto flex-1">
                                {tasks.length === 0 ? <p className="text-gray-400 text-center py-10">No pending tasks.</p> : tasks.map(task => (
                                    <div key={task.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-dark-900/50 rounded-lg border border-gray-100 dark:border-dark-700">
                                        <div className={`w-3 h-3 rounded-full ${task.priority === 'HIGH' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                                        <p className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-200">{task.description}</p>
                                        <span className="text-xs text-gray-400 uppercase">{task.status}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'SOAP' && (
                        <div className="p-6 flex flex-col h-full">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">AI Clinical Note Assistant</h2>
                            <p className="text-sm text-gray-500 mb-6">Paste rough dictation or notes to generate structured SOAP documentation.</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-0">
                                <div className="flex flex-col">
                                    <textarea 
                                        value={rawNotes}
                                        onChange={(e) => setRawNotes(e.target.value)}
                                        placeholder="e.g. Patient presents with 3-day history of cough..."
                                        className="flex-1 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-600 rounded-xl p-4 focus:ring-2 focus:ring-crimson-500 outline-none resize-none text-gray-900 dark:text-white mb-4"
                                    />
                                    <button onClick={handleGenerateSOAP} disabled={generatingSoap || !rawNotes.trim()} className="w-full bg-crimson-600 hover:bg-crimson-500 text-white py-3 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2">
                                        {generatingSoap ? <Loader2 className="animate-spin w-5 h-5" /> : 'Generate SOAP Note'}
                                    </button>
                                </div>
                                <div className="bg-gray-50 dark:bg-dark-900 rounded-xl border border-gray-200 dark:border-dark-600 p-4 overflow-y-auto">
                                    {soapResult ? (
                                        <div className="space-y-4 text-sm">
                                            {Object.entries(soapResult).map(([key, val]) => (
                                                <div key={key}>
                                                    <h4 className="font-bold text-crimson-600 dark:text-crimson-400 uppercase text-xs mb-1">{key}</h4>
                                                    <p className="text-gray-800 dark:text-gray-300">{val}</p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : <div className="h-full flex items-center justify-center text-gray-400 text-sm italic">Generated notes appear here.</div>}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'EMERGENCY' && (
                        <div className="p-6 flex flex-col h-full bg-red-50 dark:bg-red-900/10">
                            <h2 className="text-xl font-bold text-red-700 dark:text-red-400 mb-4 flex items-center gap-2">
                                <AlertTriangle className="w-6 h-6" /> Live Emergency Alerts
                            </h2>
                            {emergencies.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-red-300">
                                    <ShieldCheck className="w-16 h-16 mb-4 opacity-50" />
                                    <p>No active emergencies.</p>
                                </div>
                            ) : (
                                <div className="space-y-4 overflow-y-auto">
                                    {emergencies.map(alert => (
                                        <div key={alert.id} className="bg-white dark:bg-black border-2 border-red-500 rounded-xl p-6 shadow-xl animate-pulse">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{alert.patientName}</h3>
                                                    <p className="text-red-600 font-bold uppercase tracking-wider text-sm">{alert.severity} PRIORITY</p>
                                                </div>
                                                <span className="text-sm font-mono text-gray-500">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                                            </div>
                                            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg mb-4 border border-red-100 dark:border-red-900/50">
                                                <p className="font-bold text-gray-800 dark:text-gray-200 text-lg mb-2">AI Assessment: {alert.aiAssessment}</p>
                                                <p className="text-gray-600 dark:text-gray-400">Symptoms: {alert.symptoms}</p>
                                            </div>
                                            <div className="flex gap-4">
                                                <button className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2">
                                                    <Phone className="w-5 h-5" /> Contact Patient
                                                </button>
                                                <button className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 rounded-lg">
                                                    View Medical Profile
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
