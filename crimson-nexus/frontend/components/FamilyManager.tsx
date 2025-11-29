import React, { useState, useEffect } from 'react';
import { User, Dependent } from '../types';
import { backendGetDependents, backendAddDependent, backendSwitchProfile } from '../services/mockBackend';
import { Users, Plus, UserCircle, ChevronRight, Check } from 'lucide-react';

interface FamilyManagerProps {
    currentUser: User;
    activeProfile: User;
    onSwitchProfile: (profile: User) => void;
}

export const FamilyManager: React.FC<FamilyManagerProps> = ({ currentUser, activeProfile, onSwitchProfile }) => {
    const [dependents, setDependents] = useState<Dependent[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    
    // Form
    const [name, setName] = useState('');
    const [age, setAge] = useState('');
    const [relation, setRelation] = useState<Dependent['relation']>('CHILD');

    useEffect(() => {
        backendGetDependents(currentUser.id).then(setDependents);
    }, [currentUser]);

    const handleAdd = async () => {
        if (!name || !age) return;
        await backendAddDependent(currentUser.id, name, relation, parseInt(age));
        setIsAdding(false);
        backendGetDependents(currentUser.id).then(setDependents);
        setName(''); setAge('');
    };

    const handleSwitch = async (profileId: string) => {
        const profile = await backendSwitchProfile(currentUser.id, profileId);
        if (profile) onSwitchProfile(profile);
    };

    return (
        <div className="relative group">
            <button className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 rounded-full transition-colors border border-gray-200 dark:border-dark-700">
                <div className="w-5 h-5 bg-crimson-600 rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                    {activeProfile.name.charAt(0)}
                </div>
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300 max-w-[80px] truncate">{activeProfile.name}</span>
                <ChevronRight className="w-3 h-3 text-gray-400 group-hover:rotate-90 transition-transform" />
            </button>

            <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-xl shadow-2xl p-2 hidden group-hover:block z-50 animate-fade-in-down">
                <p className="text-[10px] font-bold text-gray-400 uppercase px-2 py-1">Switch Profile</p>
                
                {/* Main User */}
                <button 
                    onClick={() => handleSwitch(currentUser.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between hover:bg-gray-50 dark:hover:bg-dark-800 ${activeProfile.id === currentUser.id ? 'bg-crimson-50 dark:bg-crimson-900/10 text-crimson-600' : 'text-gray-700 dark:text-gray-300'}`}
                >
                    <span className="text-sm font-bold flex items-center gap-2"><UserCircle className="w-4 h-4" /> {currentUser.name} (You)</span>
                    {activeProfile.id === currentUser.id && <Check className="w-3 h-3" />}
                </button>

                {/* Dependents */}
                {dependents.map(dep => (
                    <button 
                        key={dep.id}
                        onClick={() => handleSwitch(dep.id)} // Dependent ID is also their User ID
                        className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between hover:bg-gray-50 dark:hover:bg-dark-800 ${activeProfile.id === dep.id ? 'bg-crimson-50 dark:bg-crimson-900/10 text-crimson-600' : 'text-gray-700 dark:text-gray-300'}`}
                    >
                        <span className="text-sm font-medium flex items-center gap-2 ml-2">
                             <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span> {dep.name}
                        </span>
                        {activeProfile.id === dep.id && <Check className="w-3 h-3" />}
                    </button>
                ))}

                <div className="border-t border-gray-100 dark:border-dark-700 my-1 pt-1"></div>

                {!isAdding ? (
                    <button onClick={() => setIsAdding(true)} className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-gray-500 hover:text-crimson-500 hover:bg-gray-50 dark:hover:bg-dark-800 flex items-center gap-2">
                        <Plus className="w-3 h-3" /> Add Dependent
                    </button>
                ) : (
                    <div className="p-2 bg-gray-50 dark:bg-dark-800 rounded-lg">
                        <input value={name} onChange={e => setName(e.target.value)} placeholder="Name" className="w-full mb-2 bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-600 rounded p-1 text-xs" />
                        <div className="flex gap-2 mb-2">
                            <input value={age} onChange={e => setAge(e.target.value)} placeholder="Age" className="w-12 bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-600 rounded p-1 text-xs" />
                            <select value={relation} onChange={e => setRelation(e.target.value as any)} className="flex-1 bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-600 rounded p-1 text-xs">
                                <option value="CHILD">Child</option>
                                <option value="PARENT">Parent</option>
                                <option value="SPOUSE">Spouse</option>
                            </select>
                        </div>
                        <button onClick={handleAdd} className="w-full bg-crimson-600 text-white text-xs font-bold py-1 rounded">Save</button>
                    </div>
                )}
            </div>
        </div>
    );
};