
import React, { useState } from 'react';
import { performSymptomCheck, checkMedicationInteractions } from '../services/geminiService';
import { SymptomCheckResult } from '../types';
import { Activity, AlertTriangle, Pill, Send, Loader2, Sparkles, CheckCircle } from 'lucide-react';

interface AIToolsProps {
    userCountry?: string;
}

export const AITools: React.FC<AIToolsProps> = ({ userCountry }) => {
    const [activeTab, setActiveTab] = useState<'TRIAGE' | 'MEDS'>('TRIAGE');
    
    // Triage State
    const [symptoms, setSymptoms] = useState('');
    const [triageResult, setTriageResult] = useState<SymptomCheckResult | null>(null);
    const [analyzingTriage, setAnalyzingTriage] = useState(false);

    // Meds State
    const [meds, setMeds] = useState('');
    const [medResult, setMedResult] = useState<string>('');
    const [analyzingMeds, setAnalyzingMeds] = useState(false);

    const handleTriage = async () => {
        if (!symptoms.trim()) return;
        setAnalyzingTriage(true);
        const result = await performSymptomCheck(symptoms, userCountry);
        setTriageResult(result);
        setAnalyzingTriage(false);
    };

    const handleMedsCheck = async () => {
        if (!meds.trim()) return;
        setAnalyzingMeds(true);
        const result = await checkMedicationInteractions(meds, userCountry);
        setMedResult(result);
        setAnalyzingMeds(false);
    };

    return (
        <div className="p-4 lg:p-8 max-w-5xl mx-auto animate-fade-in">
            <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Sparkles className="text-crimson-500" /> AI Health Assistant
            </h1>

            <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl border border-gray-100 dark:border-dark-700 overflow-hidden min-h-[500px] flex flex-col">
                <div className="flex border-b border-gray-100 dark:border-dark-700">
                    <button 
                        onClick={() => setActiveTab('TRIAGE')}
                        className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'TRIAGE' ? 'bg-crimson-50 dark:bg-crimson-900/20 text-crimson-600 dark:text-crimson-400 border-b-2 border-crimson-500' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                    >
                        <Activity className="w-4 h-4" /> Symptom Checker
                    </button>
                    <button 
                         onClick={() => setActiveTab('MEDS')}
                        className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'MEDS' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                    >
                        <Pill className="w-4 h-4" /> Drug Interactions
                    </button>
                </div>

                <div className="p-6 flex-1 flex flex-col">
                    {activeTab === 'TRIAGE' && (
                        <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full space-y-6">
                            <div className="text-center mb-4">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">How are you feeling?</h3>
                                <p className="text-sm text-gray-500">Describe your symptoms in detail. Nexus AI will analyze severity.</p>
                            </div>
                            
                            <div className="relative">
                                <textarea 
                                    value={symptoms}
                                    onChange={(e) => setSymptoms(e.target.value)}
                                    placeholder="e.g. I have a throbbing headache on the left side and sensitivity to light..."
                                    className="w-full h-32 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-600 rounded-xl p-4 focus:ring-2 focus:ring-crimson-500 outline-none resize-none text-gray-900 dark:text-white"
                                />
                                <button 
                                    onClick={handleTriage}
                                    disabled={analyzingTriage || !symptoms.trim()}
                                    className="absolute bottom-4 right-4 bg-crimson-600 hover:bg-crimson-500 text-white p-2 rounded-lg shadow-lg transition-all disabled:opacity-50"
                                >
                                    {analyzingTriage ? <Loader2 className="animate-spin w-5 h-5" /> : <Send className="w-5 h-5" />}
                                </button>
                            </div>

                            {triageResult && (
                                <div className="bg-gray-50 dark:bg-dark-900 rounded-xl border border-gray-200 dark:border-dark-600 p-6 animate-fade-in-down">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="font-bold text-lg text-gray-900 dark:text-white">Analysis Result</h4>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                            triageResult.severity === 'CRITICAL' ? 'bg-red-100 text-red-700 border-red-200' :
                                            triageResult.severity === 'HIGH' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                                            triageResult.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                                            'bg-green-100 text-green-700 border-green-200'
                                        }`}>
                                            SEVERITY: {triageResult.severity}
                                        </span>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-xs font-bold text-gray-500 uppercase">Potential Condition</p>
                                            <p className="text-gray-900 dark:text-white font-medium">{triageResult.condition}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-500 uppercase">Recommendation</p>
                                            <p className="text-gray-900 dark:text-white text-sm">{triageResult.recommendation}</p>
                                        </div>
                                        {triageResult.redFlags.length > 0 && (
                                            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-900/50">
                                                 <p className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1 mb-1">
                                                     <AlertTriangle className="w-3 h-3" /> Red Flags Detected
                                                 </p>
                                                 <ul className="list-disc list-inside text-xs text-red-700 dark:text-red-300">
                                                     {triageResult.redFlags.map((flag, i) => <li key={i}>{flag}</li>)}
                                                 </ul>
                                            </div>
                                        )}
                                        <p className="text-[10px] text-gray-400 italic mt-4">*This is an AI simulation. Not actual medical advice. Consult a doctor.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'MEDS' && (
                        <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full space-y-6">
                            <div className="text-center mb-4">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Interaction Checker</h3>
                                <p className="text-sm text-gray-500">List medications to check for potential conflicts.</p>
                            </div>
                            
                            <div className="relative">
                                <textarea 
                                    value={meds}
                                    onChange={(e) => setMeds(e.target.value)}
                                    placeholder="e.g. Aspirin, Warfarin, Ibuprofen..."
                                    className="w-full h-32 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-600 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 outline-none resize-none text-gray-900 dark:text-white"
                                />
                                <button 
                                    onClick={handleMedsCheck}
                                    disabled={analyzingMeds || !meds.trim()}
                                    className="absolute bottom-4 right-4 bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg shadow-lg transition-all disabled:opacity-50"
                                >
                                    {analyzingMeds ? <Loader2 className="animate-spin w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                                </button>
                            </div>

                            {medResult && (
                                <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30 p-6 animate-fade-in-down">
                                    <h4 className="font-bold text-blue-900 dark:text-blue-200 mb-2">Interaction Report</h4>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">{medResult}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
