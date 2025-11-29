import React from 'react';
import { ShieldCheck, Hash, Database, ExternalLink, Box } from 'lucide-react';

export const BlockchainViewer = ({ hash, sats, block }: { hash: string, sats?: number, block?: number }) => {
  return (
    <div className="mt-2 p-3 bg-gray-100 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg group hover:border-crimson-300 dark:hover:border-crimson-600 transition-colors duration-300">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-amber-500/10 dark:bg-amber-500/20 rounded-md shadow-sm border border-amber-200 dark:border-transparent">
            {/* Bitcoin SV Logo Simulation */}
            <div className="w-4 h-4 text-amber-600 dark:text-amber-500 font-bold flex items-center justify-center text-[10px] border border-amber-600 dark:border-amber-500 rounded-full">
                ₿
            </div>
        </div>
        <div className="flex-1 overflow-hidden">
            <div className="flex items-center justify-between">
                 <div className="flex items-center gap-1 text-gray-500 mb-1">
                    <Hash className="w-3 h-3" />
                    <span className="uppercase tracking-wider text-[10px] font-bold">BSV TxID</span>
                 </div>
                 {block ? (
                     <span className="text-[10px] bg-gray-200 dark:bg-dark-700 px-1.5 rounded text-gray-600 dark:text-gray-400 flex items-center gap-1">
                        <Box className="w-3 h-3" /> #{block}
                     </span>
                 ) : (
                    <span className="text-[10px] bg-amber-100 dark:bg-amber-900/30 px-1.5 rounded text-amber-700 dark:text-amber-500 animate-pulse">
                        Mempool
                    </span>
                 )}
            </div>
            <div className="flex items-center gap-2">
                <div className="truncate text-crimson-600 dark:text-crimson-400 font-mono text-xs opacity-90 group-hover:opacity-100 flex-1">
                {hash}
                </div>
                <a href={`https://whatsonchain.com/tx/${hash}`} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-crimson-500">
                    <ExternalLink className="w-3 h-3" />
                </a>
            </div>
        </div>
      </div>
      {sats && (
          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-dark-700/50 flex justify-between items-center text-[10px]">
              <span className="text-gray-500">Network Fee</span>
              <span className="font-mono text-gray-700 dark:text-gray-300 font-bold">{sats} Sats</span>
          </div>
      )}
    </div>
  );
};