import React from 'react';
import { Cpu, ShieldCheck, Database, Zap, Activity, Lock, Globe, Server, Share2 } from 'lucide-react';

export const AboutView = () => {
  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto animate-fade-in">
      {/* Hero Section */}
      <div className="text-center mb-16 relative py-12">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-crimson-500/20 rounded-full blur-[100px] pointer-events-none"></div>
        <h1 className="text-4xl md:text-5xl font-display font-bold text-gray-900 dark:text-white mb-6 relative z-10">
          The <span className="text-crimson-500">Crimson Nexus</span> Architecture
        </h1>
        <p className="text-lg md:text-xl text-gray-500 dark:text-gray-400 max-w-3xl mx-auto relative z-10 leading-relaxed">
          A next-generation healthcare ecosystem fusing <span className="font-bold text-gray-800 dark:text-gray-200">Google Gemini AI</span> with 
          <span className="font-bold text-gray-800 dark:text-gray-200"> Bitcoin SV</span> blockchain technology to create the world's most secure and intelligent medical data layer.
        </p>
      </div>

      {/* Core Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
        {/* AI Pillar */}
        <div className="bg-white dark:bg-dark-800 p-8 rounded-3xl border border-gray-100 dark:border-dark-700 shadow-xl relative overflow-hidden group hover:-translate-y-2 transition-transform duration-300">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
            <Cpu className="w-32 h-32" />
          </div>
          <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6 shadow-lg shadow-blue-500/10">
            <Zap className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Multimodal AI</h3>
          <p className="text-gray-500 dark:text-gray-400 leading-relaxed text-sm">
            Powered by <strong>Gemini 2.5 Flash</strong>, Nexus processes more than just text. It analyzes medical imaging (X-rays, MRIs), listens to clinical voice notes, and structures unstructured medical data in real-time, providing doctors with instant second opinions.
          </p>
        </div>

        {/* Blockchain Pillar */}
        <div className="bg-white dark:bg-dark-800 p-8 rounded-3xl border border-gray-100 dark:border-dark-700 shadow-xl relative overflow-hidden group hover:-translate-y-2 transition-transform duration-300">
           <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
            <Database className="w-32 h-32" />
          </div>
          <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center text-amber-600 dark:text-amber-500 mb-6 shadow-lg shadow-amber-500/10">
            <Globe className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Bitcoin SV Ledger</h3>
          <p className="text-gray-500 dark:text-gray-400 leading-relaxed text-sm">
            Every clinical record, prescription, and appointment is hashed using <strong>Double SHA-256</strong> and anchored to the Bitcoin SV blockchain. This creates an immutable, tamper-proof audit trail that guarantees data integrity forever.
          </p>
        </div>

        {/* Smart Contract Pillar */}
        <div className="bg-white dark:bg-dark-800 p-8 rounded-3xl border border-gray-100 dark:border-dark-700 shadow-xl relative overflow-hidden group hover:-translate-y-2 transition-transform duration-300">
           <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
            <ShieldCheck className="w-32 h-32" />
          </div>
          <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-500 mb-6 shadow-lg shadow-emerald-500/10">
            <Lock className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">sCrypt Contracts</h3>
          <p className="text-gray-500 dark:text-gray-400 leading-relaxed text-sm">
            Access control isn't just a database flag; it's a cryptographic rule. We simulate <strong>sCrypt</strong> smart contracts that verify digital signatures before granting access to sensitive patient data, ensuring true ownership.
          </p>
        </div>
      </div>

      {/* Technical Workflow */}
      <div className="bg-dark-900 rounded-3xl p-8 lg:p-12 relative overflow-hidden border border-dark-700 shadow-2xl">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        <div className="relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12">
                <div>
                    <h2 className="text-3xl font-display font-bold text-white mb-2">How It Works</h2>
                    <p className="text-gray-400">The journey of a medical record through Nexus.</p>
                </div>
                <div className="flex items-center gap-2 text-crimson-500 font-mono text-xs mt-4 md:mt-0">
                    <Activity className="w-4 h-4 animate-pulse" /> SYSTEM ACTIVE
                </div>
            </div>
            
            <div className="flex flex-col lg:flex-row items-start justify-between gap-12 text-center lg:text-left relative">
                
                {/* Connecting Line */}
                <div className="hidden lg:block absolute top-12 left-0 w-full h-0.5 bg-gradient-to-r from-crimson-900 via-crimson-500 to-amber-500 -z-10"></div>

                {/* Step 1 */}
                <div className="flex-1 relative group">
                    <div className="w-24 h-24 mx-auto lg:mx-0 bg-dark-800 rounded-2xl border border-dark-600 flex items-center justify-center mb-6 shadow-xl group-hover:border-crimson-500 transition-colors z-20 relative">
                        <div className="text-crimson-500 font-display font-bold text-4xl">01</div>
                    </div>
                    <h4 className="text-white text-xl font-bold mb-2">Ingestion & AI Analysis</h4>
                    <p className="text-gray-400 text-sm leading-relaxed">Provider uploads a record or voice note. Gemini AI processes the content for structured extraction and medical context.</p>
                </div>

                {/* Step 2 */}
                <div className="flex-1 relative group">
                    <div className="w-24 h-24 mx-auto lg:mx-0 bg-dark-800 rounded-2xl border border-dark-600 flex items-center justify-center mb-6 shadow-xl group-hover:border-crimson-500 transition-colors z-20 relative">
                        <div className="text-crimson-400 font-display font-bold text-4xl">02</div>
                    </div>
                    <h4 className="text-white text-xl font-bold mb-2">Hashing & Signing</h4>
                    <p className="text-gray-400 text-sm leading-relaxed">The data is hashed (SHA-256). The user signs the hash with their private key, creating a unique digital signature.</p>
                </div>

                {/* Step 3 */}
                <div className="flex-1 relative group">
                     <div className="w-24 h-24 mx-auto lg:mx-0 bg-dark-800 rounded-2xl border border-dark-600 flex items-center justify-center mb-6 shadow-xl group-hover:border-amber-500 transition-colors z-20 relative">
                        <div className="text-amber-500 font-display font-bold text-4xl">03</div>
                    </div>
                    <h4 className="text-white text-xl font-bold mb-2">Chain Anchoring</h4>
                    <p className="text-gray-400 text-sm leading-relaxed">A transaction is broadcast to the BSV network containing the hash in an OP_RETURN output, securing it forever.</p>
                </div>
            </div>
        </div>
      </div>
      
      {/* Footer Info */}
      <div className="mt-16 text-center">
          <p className="text-sm text-gray-400 mb-4">Built with React, Vite, Tailwind CSS, Google GenAI SDK, and simulated Bitcoin SV protocols.</p>
          <div className="flex justify-center gap-4">
              <span className="px-3 py-1 bg-gray-200 dark:bg-dark-800 rounded-full text-xs font-bold text-gray-500">v1.1.0-Nexus</span>
              <span className="px-3 py-1 bg-gray-200 dark:bg-dark-800 rounded-full text-xs font-bold text-gray-500">Node: Active</span>
          </div>
      </div>
    </div>
  );
};