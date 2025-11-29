import React, { useState, useEffect } from 'react';
import { User, MedicalRecord, UserRole, Contact } from '../types';
import { backendGetRecords, backendAddRecord, backendShareRecord, backendGetContacts, backendGetPatientsForProvider } from '../services/mockBackend';
import { compileSmartContract, broadcastToBSV } from '../services/bsvService';
import { FileText, Upload, Plus, ShieldCheck, FileCheck, Loader2, Database, Hash, X, Download, Code, Cpu, Network, Share2, UserCheck, ChevronRight } from 'lucide-react';
import { BlockchainViewer } from './BlockchainViewer';

interface RecordsViewProps {
  currentUser: User;
}

export const RecordsView: React.FC<RecordsViewProps> = ({ currentUser }) => {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  
  // Provider Specific State
  const [providerPatients, setProviderPatients] = useState<User[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  // Upload State
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<MedicalRecord['type']>('CLINICAL_NOTE');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  
  // Smart Contract & Web3 Steps
  const [web3Step, setWeb3Step] = useState(0); 
  const [contractCode, setContractCode] = useState('');

  // Sharing State
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    if (currentUser.role === UserRole.PROVIDER) {
        backendGetPatientsForProvider(currentUser.id).then(pts => {
            setProviderPatients(pts);
            setLoading(false);
        });
    } else {
        // Patient View: Load own records immediately
        loadRecords(currentUser.id);
    }
  }, [currentUser]);

  const loadRecords = (userId: string) => {
      setLoading(true);
      backendGetRecords(userId).then(res => {
          setRecords(res);
          setLoading(false);
      });
  };

  const handlePatientSelect = (patientId: string) => {
      setSelectedPatientId(patientId);
      loadRecords(patientId);
  };

  const handleUpload = async () => {
    if (!title || !description) return;
    
    setUploading(true);
    
    // Convert file to Base64 for persistence
    let fileUrl: string | undefined = undefined;
    if (file) {
        fileUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.readAsDataURL(file);
        });
    }

    // Step 1: Compile sCrypt Contract
    setWeb3Step(1);
    const { code, script } = await compileSmartContract(type, currentUser.id);
    setContractCode(code);
    
    // Step 2: Sign Transaction
    setWeb3Step(2);
    await new Promise(r => setTimeout(r, 1000));
    
    // Step 3: Broadcast to BSV
    setWeb3Step(3);
    const { txId, fee } = await broadcastToBSV({ title, description, script });

    const newRecord = await backendAddRecord({
      patientId: selectedPatientId || currentUser.id, // If provider, add to selected patient
      providerId: currentUser.id, 
      type,
      title,
      content: description,
      fileName: file ? file.name : undefined,
      fileUrl: fileUrl,
      bsvTxId: txId,
      scriptPubKey: script,
      satoshis: fee
    });

    setRecords(prev => [...prev, newRecord]);
    setUploading(false);
    setWeb3Step(0);
    setIsUploadModalOpen(false);
    setFile(null);
    setTitle('');
    setDescription('');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };

  const openShareModal = async () => {
    const myContacts = await backendGetContacts(currentUser);
    setContacts(myContacts.filter(c => c.role === UserRole.PROVIDER));
    setIsShareModalOpen(true);
  };

  const handleShare = async (providerId: string) => {
    if (!selectedRecord) return;
    setSharing(true);
    await backendShareRecord(selectedRecord.id, providerId);
    setSharing(false);
    setIsShareModalOpen(false);
    loadRecords(currentUser.id);
  };

  // Render Provider Patient List View
  if (currentUser.role === UserRole.PROVIDER && !selectedPatientId) {
      return (
          <div className="p-4 lg:p-8 max-w-7xl mx-auto">
              <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white mb-6">Patient Records</h1>
              {loading ? <Loader2 className="animate-spin text-crimson-500" /> : (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {providerPatients.length === 0 ? (
                         <div className="col-span-full text-center text-gray-500 py-10">No patients found.</div>
                     ) : (
                         providerPatients.map(p => (
                             <div 
                                key={p.id}
                                onClick={() => handlePatientSelect(p.id)}
                                className="bg-white dark:bg-dark-800 p-6 rounded-2xl border border-gray-100 dark:border-dark-700 hover:border-crimson-500 cursor-pointer transition-all shadow-lg group"
                             >
                                 <div className="flex items-center gap-4">
                                     <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-dark-700 flex items-center justify-center font-bold text-gray-500">
                                         {p.name.charAt(0)}
                                     </div>
                                     <div>
                                         <h3 className="font-bold text-gray-900 dark:text-white">{p.name}</h3>
                                         <p className="text-xs text-gray-500">{p.email}</p>
                                     </div>
                                     <ChevronRight className="ml-auto text-gray-400 group-hover:text-crimson-500 transition-colors" />
                                 </div>
                             </div>
                         ))
                     )}
                 </div>
              )}
          </div>
      );
  }

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
           {currentUser.role === UserRole.PROVIDER && (
               <button onClick={() => setSelectedPatientId(null)} className="text-xs text-crimson-500 font-bold mb-1 hover:underline">
                   ← Back to Patient List
               </button>
           )}
          <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">Medical Records</h1>
          <p className="text-gray-500 dark:text-gray-400">Secured on Bitcoin SV with Smart Contracts.</p>
        </div>
        <button 
          onClick={() => setIsUploadModalOpen(true)}
          className="bg-crimson-600 hover:bg-crimson-500 text-white px-4 py-2 rounded-xl shadow-lg shadow-crimson-900/20 flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" /> New Record
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-crimson-500 w-8 h-8" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {records.length === 0 ? (
            <div className="col-span-full text-center py-20 bg-gray-50 dark:bg-dark-800 rounded-2xl border border-dashed border-gray-300 dark:border-dark-600">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-gray-500 dark:text-gray-400 font-medium">No records found</h3>
                <p className="text-sm text-gray-400">Deploy a smart contract to secure a record.</p>
            </div>
          ) : (
            records.map((rec) => (
              <div 
                key={rec.id} 
                onClick={() => setSelectedRecord(rec)}
                className="bg-white dark:bg-dark-800 rounded-2xl p-6 border border-gray-100 dark:border-dark-700 shadow-xl flex flex-col hover:border-crimson-500/30 hover:scale-[1.02] cursor-pointer transition-all group relative overflow-hidden"
              >
                {rec.sharedWith && rec.sharedWith.length > 0 && currentUser.role === UserRole.PATIENT && (
                    <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">
                        SHARED
                    </div>
                )}
                
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-gray-50 dark:bg-dark-900 rounded-xl text-crimson-500">
                    <FileText className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-mono text-gray-400">{rec.date}</span>
                </div>
                
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 truncate pr-4">{rec.title}</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider text-crimson-600 dark:text-crimson-400 mb-3">{rec.type.replace('_', ' ')}</span>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3 flex-1">{rec.content}</p>
                
                <div className="pt-4 border-t border-gray-100 dark:border-dark-700">
                  <BlockchainViewer hash={rec.bsvTxId} sats={rec.satoshis} block={rec.blockHeight} />
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-dark-900 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-dark-700 animate-fade-in-down max-h-[90vh] flex flex-col relative">
                <div className="p-6 border-b border-gray-100 dark:border-dark-800 flex justify-between items-center bg-gray-50 dark:bg-black/20">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-crimson-100 dark:bg-crimson-900/20 rounded-lg text-crimson-600 dark:text-crimson-400">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-display font-bold text-gray-900 dark:text-white">{selectedRecord.title}</h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">BSV ID: {selectedRecord.bsvTxId.substring(0, 16)}...</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {currentUser.role === UserRole.PATIENT && (
                            <button 
                                onClick={openShareModal}
                                className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors shadow-lg"
                            >
                                <Share2 className="w-4 h-4" /> Share Access
                            </button>
                        )}
                        <button onClick={() => setSelectedRecord(null)} className="text-gray-400 hover:text-crimson-500 p-2 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>
                
                <div className="p-6 overflow-y-auto space-y-6">
                    {/* Image Display */}
                    {selectedRecord.fileUrl && (
                        <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-dark-700 bg-gray-100 dark:bg-black shadow-inner">
                             <img 
                                src={selectedRecord.fileUrl} 
                                alt="Medical Attachment" 
                                className="w-full max-h-[400px] object-contain mx-auto"
                                onError={(e) => { e.currentTarget.style.display = 'none'; }} 
                             />
                             {selectedRecord.fileName && (
                                <div className="p-3 bg-white dark:bg-dark-800 text-center text-xs font-mono text-gray-500 border-t border-gray-200 dark:border-dark-700">
                                    {selectedRecord.fileName}
                                </div>
                             )}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="p-3 bg-gray-50 dark:bg-dark-800 rounded-xl">
                            <p className="text-gray-500 text-xs uppercase font-bold mb-1">Date Created</p>
                            <p className="text-gray-900 dark:text-white font-medium">{selectedRecord.date}</p>
                        </div>
                        <div className="p-3 bg-gray-50 dark:bg-dark-800 rounded-xl">
                            <p className="text-gray-500 text-xs uppercase font-bold mb-1">Type</p>
                            <p className="text-gray-900 dark:text-white font-medium">{selectedRecord.type.replace('_', ' ')}</p>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-2">Clinical Content</h3>
                        <div className="bg-gray-50 dark:bg-dark-800 p-4 rounded-xl text-gray-700 dark:text-gray-300 text-sm leading-relaxed border border-gray-100 dark:border-dark-700">
                            {selectedRecord.content}
                        </div>
                    </div>

                    <div className="border border-gray-200 dark:border-dark-700 rounded-xl overflow-hidden">
                        <div className="bg-gray-100 dark:bg-dark-800 px-4 py-2 border-b border-gray-200 dark:border-dark-700 flex items-center justify-between">
                             <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                                <Code className="w-4 h-4" /> Locking Script (sCrypt)
                             </div>
                             <span className="text-[10px] font-mono text-crimson-500 bg-crimson-50 dark:bg-crimson-900/20 px-2 py-0.5 rounded">OP_CHECKSIG</span>
                        </div>
                        <div className="bg-gray-50 dark:bg-black p-4 font-mono text-xs text-gray-600 dark:text-gray-400 overflow-x-auto whitespace-nowrap">
                            {selectedRecord.scriptPubKey}
                        </div>
                    </div>

                    <div className="border-t border-gray-100 dark:border-dark-700 pt-6">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-3">Bitcoin SV Verification</h3>
                        <BlockchainViewer hash={selectedRecord.bsvTxId} sats={selectedRecord.satoshis} block={selectedRecord.blockHeight} />
                    </div>
                </div>

                {isShareModalOpen && (
                     <div className="absolute inset-0 bg-white/95 dark:bg-dark-900/95 z-50 p-6 flex flex-col animate-fade-in">
                         <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Share Record Access</h3>
                            <button onClick={() => setIsShareModalOpen(false)} className="text-gray-400 hover:text-red-500"><X className="w-6 h-6" /></button>
                         </div>
                         <p className="text-sm text-gray-500 mb-4">Select a provider to grant viewing access to this record on the blockchain.</p>
                         <div className="flex-1 overflow-y-auto space-y-2">
                             {contacts.length === 0 ? (
                                 <div className="text-center py-10 text-gray-400">
                                     <UserCheck className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                     <p>No providers connected.</p>
                                     <p className="text-xs">Add doctors in Messages first.</p>
                                 </div>
                             ) : (
                                 contacts.map(contact => {
                                     const isShared = selectedRecord.sharedWith?.includes(contact.id);
                                     return (
                                        <button 
                                            key={contact.id}
                                            onClick={() => !isShared && handleShare(contact.id)}
                                            disabled={isShared || sharing}
                                            className={`w-full p-4 rounded-xl flex items-center justify-between border transition-all ${
                                                isShared 
                                                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' 
                                                : 'bg-white dark:bg-dark-800 border-gray-200 dark:border-dark-700 hover:border-crimson-500'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-dark-700 flex items-center justify-center font-bold text-gray-500 overflow-hidden">
                                                    {contact.avatarUrl ? <img src={contact.avatarUrl} className="w-full h-full object-cover"/> : contact.name.charAt(0)}
                                                </div>
                                                <div className="text-left">
                                                    <p className="font-bold text-gray-900 dark:text-white">{contact.name}</p>
                                                    <p className="text-xs text-gray-500">{contact.role}</p>
                                                </div>
                                            </div>
                                            {isShared ? (
                                                <span className="text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1">
                                                    <UserCheck className="w-4 h-4" /> Shared
                                                </span>
                                            ) : (
                                                <span className="text-crimson-600 dark:text-crimson-400 text-xs font-bold">
                                                    {sharing ? 'Sharing...' : 'Grant Access'}
                                                </span>
                                            )}
                                        </button>
                                     );
                                 })
                             )}
                         </div>
                     </div>
                )}
            </div>
        </div>
      )}

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-900 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-gray-200 dark:border-dark-700 animate-fade-in-down">
            <div className="p-6 border-b border-gray-100 dark:border-dark-800 flex justify-between items-center">
              <h2 className="text-xl font-display font-bold text-gray-900 dark:text-white">New Smart Contract Record</h2>
              <button onClick={() => !uploading && setIsUploadModalOpen(false)} className="text-gray-400 hover:text-crimson-500"><X className="w-6 h-6" /></button>
            </div>
            
            <div className="p-6 space-y-4">
              {uploading ? (
                <div className="py-6 text-center space-y-6">
                  <div className="relative w-full max-w-xs mx-auto h-2 bg-gray-200 dark:bg-dark-700 rounded-full overflow-hidden">
                       <div className={`absolute top-0 left-0 h-full bg-crimson-500 transition-all duration-500 ${web3Step === 1 ? 'w-1/3' : web3Step === 2 ? 'w-2/3' : 'w-full'}`}></div>
                  </div>
                  <div className="bg-black rounded-xl p-4 text-left font-mono text-[10px] text-green-400 h-32 overflow-hidden border border-gray-800 shadow-inner opacity-90 relative">
                        <p>{'>'} Initializing sCrypt compiler...</p>
                        {web3Step >= 1 && <><p>{'>'} Contract: MedicalRecordVerifier</p><p className="text-gray-500">{contractCode.substring(0, 50)}...</p></>}
                        {web3Step >= 2 && <p>{'>'} Wallet: Requesting Signature...</p>}
                        {web3Step >= 3 && <p>{'>'} Network: Broadcasting to Bitcoin SV...</p>}
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">Record Title</label>
                    <input 
                      value={title} onChange={e => setTitle(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-dark-800 border border-gray-200 dark:border-dark-600 rounded-xl p-3 focus:ring-2 focus:ring-crimson-500 outline-none text-gray-900 dark:text-white"
                      placeholder="e.g. Annual Blood Work"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">Type</label>
                      <select 
                        value={type} onChange={e => setType(e.target.value as any)}
                        className="w-full bg-gray-50 dark:bg-dark-800 border border-gray-200 dark:border-dark-600 rounded-xl p-3 focus:ring-2 focus:ring-crimson-500 outline-none text-gray-900 dark:text-white appearance-none"
                      >
                        <option value="CLINICAL_NOTE">Clinical Note</option>
                        <option value="PRESCRIPTION">Prescription</option>
                        <option value="LAB_REPORT">Lab Report</option>
                        <option value="IMAGING">Imaging (X-Ray/MRI)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">File (Optional)</label>
                      <input type="file" onChange={handleFileSelect} className="w-full text-xs text-gray-500 file:mr-2 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-crimson-50 file:text-crimson-700 hover:file:bg-crimson-100" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">Description / Notes</label>
                    <textarea 
                      value={description} onChange={e => setDescription(e.target.value)}
                      rows={3}
                      className="w-full bg-gray-50 dark:bg-dark-800 border border-gray-200 dark:border-dark-600 rounded-xl p-3 focus:ring-2 focus:ring-crimson-500 outline-none text-gray-900 dark:text-white"
                      placeholder="Enter details..."
                    />
                  </div>
                  <button onClick={handleUpload} className="w-full bg-crimson-600 hover:bg-crimson-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-crimson-900/20 transition-all">
                    Deploy Smart Contract & Mint
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};