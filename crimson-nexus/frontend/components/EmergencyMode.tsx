import React, { useState } from 'react';
import { User, EmergencyAlert } from '../types';
import { backendTriggerEmergency } from '../services/mockBackend';
import { AlertTriangle, Phone, Activity, ShieldAlert, Loader2, CheckCircle, X } from 'lucide-react';

interface EmergencyModeProps {
    currentUser: User;
    onClose: () => void;
}

export const EmergencyMode: React.FC<EmergencyModeProps> = ({ currentUser, onClose }) => {
    const [symptoms, setSymptoms] = useState('');
    const [status, setStatus] = useState<'IDLE' | 'ANALYZING' | 'ACTIVE'>('IDLE');
    const [alertData, setAlertData] = useState<EmergencyAlert | null>(null);

    const handleTrigger = async () => {
        setStatus('ANALYZING');
        // If empty input, default to "General Emergency"
        const input = symptoms.trim() || "Unspecified medical emergency";
        // The backendTriggerEmergency will look up the user's country from the DB
        const alert = await backendTriggerEmergency(currentUser.id, input);
        setAlertData(alert);
        setStatus('ACTIVE');
    };

    return (
        <div className="fixed inset-0 z-[100] bg-red-950/90 backdrop-blur-xl flex flex-col items-center justify-center p-6 animate-fade-in text-white">
            <div className="w-full max-w-2xl bg-black border-2 border-red-500 rounded-3xl p-8 shadow-[0_0_100px_rgba(220,20,60,0.5)] relative overflow-hidden">
                {/* Close Button */}
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 text-red-400 hover:text-white transition-colors z-50 p-2 hover:bg-red-900/50 rounded-full"
                    title="Close Emergency Mode"
                >
                    <X className="w-6 h-6" />
                </button>

                {/* Background Pulse */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-600/20 rounded-full blur-[100px] animate-pulse pointer-events-none"></div>

                <div className="relative z-10 text-center">
                    <div className="flex justify-center mb-6">
                        <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center animate-bounce shadow-xl shadow-red-900/50">
                            <AlertTriangle className="w-10 h-10 text-white" />
                        </div>
                    </div>

                    <h1 className="text-4xl font-display font-bold text-white mb-2 tracking-wider uppercase">Emergency Mode</h1>
                    <p className="text-red-200 text-lg mb-8">AI Rapid Assessment & Doctor Notification System</p>

                    {status === 'IDLE' && (
                        <div className="space-y-6">
                            <textarea 
                                value={symptoms}
                                onChange={e => setSymptoms(e.target.value)}
                                placeholder="Describe what's happening (e.g., chest pain, difficulty breathing)..."
                                className="w-full bg-red-900/20 border border-red-500/50 rounded-xl p-4 text-white placeholder-red-300/50 focus:outline-none focus:border-red-500 text-lg h-32 resize-none"
                            />
                            <div className="flex gap-4">
                                <button onClick={onClose} className="flex-1 py-4 rounded-xl border border-red-800 text-red-400 font-bold hover:bg-red-900/30 transition-colors">
                                    Cancel
                                </button>
                                <button onClick={handleTrigger} className="flex-[2] py-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-900/50 uppercase tracking-widest transition-all hover:scale-105">
                                    Trigger SOS Alert
                                </button>
                            </div>
                        </div>
                    )}

                    {status === 'ANALYZING' && (
                        <div className="py-12">
                            <Loader2 className="w-16 h-16 text-red-500 animate-spin mx-auto mb-4" />
                            <p className="text-xl font-mono text-red-400">Analyzing Vitals & Symptoms...</p>
                            <p className="text-sm text-red-500/70 mt-2">Connecting to Gemini AI...</p>
                        </div>
                    )}

                    {status === 'ACTIVE' && alertData && (
                        <div className="space-y-6 text-left animate-fade-in-down">
                            <div className="bg-red-900/30 border border-red-500/50 p-6 rounded-2xl">
                                <h3 className="text-2xl font-bold text-white mb-1">{alertData.aiAssessment}</h3>
                                <p className="text-red-300 font-mono text-sm uppercase mb-4">Severity: <span className="font-bold text-red-100">{alertData.severity}</span></p>
                                
                                <div className="space-y-3">
                                    <p className="font-bold text-red-200 uppercase text-xs tracking-wider">Immediate Actions:</p>
                                    <ul className="space-y-2">
                                        {alertData.aiAssessment.toLowerCase().includes("call") ? null : (
                                           <li className="flex items-center gap-3 text-lg font-bold">
                                               <span className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center text-xs">!</span>
                                               Check Emergency Services Number
                                           </li>
                                        )}
                                        {/* Gemini returns an "actions" array now, but we are using the generic structure. Let's try to map if present, or use hardcoded steps */}
                                        <li className="flex items-center gap-3 text-lg font-bold">
                                            <span className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center text-xs">1</span>
                                            Follow AI Assessment Guidelines
                                        </li>
                                        <li className="flex items-center gap-3 text-lg">
                                             <span className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center text-xs">2</span>
                                             Remain calm and sit down
                                        </li>
                                        <li className="flex items-center gap-3 text-lg">
                                             <span className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center text-xs">3</span>
                                             Notify nearby family
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button className="bg-green-600 hover:bg-green-500 p-4 rounded-xl flex items-center justify-center gap-2 font-bold shadow-lg">
                                    <Phone className="w-5 h-5" /> Call Emergency
                                </button>
                                <div className="bg-gray-800 p-4 rounded-xl flex items-center justify-center gap-2 border border-gray-700">
                                    <ShieldAlert className="w-5 h-5 text-blue-400" /> 
                                    <span className="text-xs">
                                        Doctors Notified<br/>
                                        <span className="text-gray-400 text-[10px]">BSV Log: {alertData.bsvTxId?.substring(0,8)}...</span>
                                    </span>
                                </div>
                            </div>
                            
                            <button onClick={onClose} className="w-full py-3 text-red-400 hover:text-white font-medium text-sm">
                                Minimize Overlay
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};