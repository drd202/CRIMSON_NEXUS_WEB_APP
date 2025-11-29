
import React, { useEffect, useState } from 'react';
import { User, RiskPrediction } from '../types';
import { backendGenerateRiskPrediction, backendGetRisks } from '../services/mockBackend';
import { Activity, TrendingUp, AlertCircle, ShieldCheck, Loader2 } from 'lucide-react';

export const RiskInsights: React.FC<{ user: User }> = ({ user }) => {
    const [risks, setRisks] = useState<RiskPrediction[]>([]);
    const [loading, setLoading] = useState(false);

    const loadRisks = async () => {
        const existing = await backendGetRisks(user.id);
        if (existing.length > 0) {
            setRisks(existing);
        } else {
            setLoading(true);
            // The backend function will pull the country from the user object in DB
            const newRisks = await backendGenerateRiskPrediction(user.id);
            setRisks(newRisks);
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRisks();
    }, [user.id]);

    if (loading) return <div className="p-6 bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 h-[200px] flex items-center justify-center"><Loader2 className="animate-spin text-crimson-500" /></div>;

    if (risks.length === 0) return null;

    return (
        <div className="bg-white dark:bg-dark-800 p-6 rounded-2xl border border-gray-100 dark:border-dark-700 shadow-xl dark:shadow-2xl transition-all duration-300">
            <h2 className="text-lg font-display font-bold flex items-center gap-2 text-gray-900 dark:text-white mb-4">
                <TrendingUp className="text-blue-500" /> AI Health Forecast
            </h2>
            <div className="space-y-4">
                {risks.map(risk => (
                    <div key={risk.id} className="bg-gray-50 dark:bg-dark-900 rounded-xl p-4 border border-gray-100 dark:border-dark-700 relative overflow-hidden">
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${risk.riskLevel === 'HIGH' ? 'bg-red-500' : risk.riskLevel === 'MEDIUM' ? 'bg-orange-500' : 'bg-green-500'}`}></div>
                        
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h4 className="font-bold text-gray-800 dark:text-gray-200 text-sm">{risk.category} RISK</h4>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${risk.riskLevel === 'HIGH' ? 'bg-red-100 text-red-700' : risk.riskLevel === 'MEDIUM' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                                    {risk.riskLevel} PROBABILITY ({risk.probability}%)
                                </span>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-white dark:bg-dark-800 flex items-center justify-center shadow-sm">
                                {risk.riskLevel === 'HIGH' ? <AlertCircle className="w-4 h-4 text-red-500" /> : <ShieldCheck className="w-4 h-4 text-green-500" />}
                            </div>
                        </div>
                        
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">{risk.prediction}</p>
                        
                        <div className="bg-white dark:bg-dark-800 p-2 rounded-lg text-[10px] text-gray-500 border border-gray-200 dark:border-dark-700">
                            <strong>Preventative:</strong> {risk.preventativeSteps[0]}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
