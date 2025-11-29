
import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, Bot, User as UserIcon, MoreVertical, Paperclip, Sparkles, Search, ChevronLeft, StopCircle, UserPlus, X, Loader2 } from 'lucide-react';
import { getGeminiChatResponse } from '../services/geminiService';
import { backendGetContacts, backendGetConversation, backendSendMessage, backendSearchDirectory, backendAddConnection } from '../services/mockBackend';
import { ChatMessage, User, Contact, UserRole } from '../types';

interface ChatInterfaceProps {
  currentUser: User;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ currentUser }) => {
  const [activeChatId, setActiveChatId] = useState<string>('ai'); // 'ai' or userId
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Mobile toggle
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add Contact State
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);

  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Load Contacts
  const refreshContacts = () => {
    backendGetContacts(currentUser).then(setContacts);
  };

  useEffect(() => {
    refreshContacts();
  }, [currentUser]);

  // Load Conversation
  useEffect(() => {
    const loadChat = async () => {
      if (activeChatId === 'ai') {
        if (messages.length === 0 || !messages.some(m => m.isAi)) {
           setMessages([{
            id: 'init-ai',
            senderId: 'ai',
            senderName: 'Nexus AI',
            content: `Hello ${currentUser.name}. I am the Crimson Nexus Assistant. How can I help you navigate your health records today?`,
            timestamp: new Date(),
            isAi: true
          }]);
        }
      } else {
        const msgs = await backendGetConversation(currentUser.id, activeChatId);
        setMessages(msgs);
      }
    };
    loadChat();
    
    const interval = setInterval(async () => {
        if (activeChatId !== 'ai') {
            const msgs = await backendGetConversation(currentUser.id, activeChatId);
            setMessages(msgs);
        }
    }, 3000); 
    return () => clearInterval(interval);
  }, [activeChatId, currentUser.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  // Handle Search Directory
  useEffect(() => {
    if (isAddContactOpen) {
      setSearching(true);
      const timer = setTimeout(() => {
        backendSearchDirectory(currentUser, searchQuery).then(res => {
          setSearchResults(res);
          setSearching(false);
        });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, isAddContactOpen, currentUser]);

  const handleAddPerson = async (targetId: string) => {
    await backendAddConnection(currentUser.id, targetId);
    refreshContacts();
    setIsAddContactOpen(false);
    setActiveChatId(targetId);
  };

  // Handle Text Send
  const handleSend = async () => {
    if (!input.trim()) return;
    const text = input;
    setInput('');
    await sendMessage(text);
  };

  const sendMessage = async (content: string, attachmentUrl?: string, attachmentType?: 'image' | 'audio') => {
    if (activeChatId === 'ai') {
        const userMsg: ChatMessage = {
          id: Date.now().toString(),
          senderId: currentUser.id,
          senderName: currentUser.name,
          content: content,
          timestamp: new Date(),
          isAi: false,
          attachmentUrl,
          attachmentType
        };
        setMessages(prev => [...prev, userMsg]);
        setIsThinking(true);

        const history = messages.filter(m => !m.attachmentUrl).map(m => ({
          role: m.isAi ? 'model' : 'user',
          parts: [{ text: m.content }]
        }));

        const aiResponseText = await getGeminiChatResponse(
            history, 
            content || (attachmentType === 'audio' ? "[Audio Message]" : "[Image]"),
            attachmentUrl,
            currentUser.country
        );
        
        const aiMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            senderId: 'ai',
            senderName: 'Nexus AI',
            content: aiResponseText,
            timestamp: new Date(),
            isAi: true
        };
        setMessages(prev => [...prev, aiMsg]);
        setIsThinking(false);
    } else {
        const optimisticMsg: ChatMessage = {
            id: Date.now().toString(),
            senderId: currentUser.id,
            recipientId: activeChatId,
            senderName: currentUser.name,
            content: content,
            timestamp: new Date(),
            isAi: false,
            attachmentUrl,
            attachmentType
        };
        setMessages(prev => [...prev, optimisticMsg]);
        await backendSendMessage(currentUser.id, activeChatId, content, attachmentUrl, attachmentType);
    }
  };

  // ... (Audio/File Handlers remain same, re-including for completeness of file)
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (event) => { if (event.data.size > 0) audioChunksRef.current.push(event.data); };
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' }); 
        const reader = new FileReader();
        reader.onloadend = () => { sendMessage("Voice Message", reader.result as string, 'audio'); };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) { alert("Could not access microphone."); }
  };
  const stopRecording = () => { if (mediaRecorderRef.current && isRecording) { mediaRecorderRef.current.stop(); setIsRecording(false); } };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const type = file.type.startsWith('audio') ? 'audio' : 'image';
        sendMessage(file.name, event.target?.result as string, type);
      };
      reader.readAsDataURL(file);
    }
  };

  const activeContact = activeChatId === 'ai' 
    ? { name: 'Nexus AI', role: 'Assistant', isOnline: true, avatarUrl: undefined } 
    : contacts.find(c => c.id === activeChatId);

  const peopleHeader = currentUser.role === UserRole.PATIENT ? "My Doctors" : "My Patients";

  return (
    <div className="flex h-full bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-2xl overflow-hidden shadow-2xl transition-colors duration-300 relative">
      
      {/* Sidebar - Contacts */}
      <div className={`${isSidebarOpen ? 'flex' : 'hidden'} md:flex flex-col w-full md:w-80 bg-gray-50 dark:bg-dark-900 border-r border-gray-200 dark:border-dark-700 z-10 absolute md:relative h-full`}>
        <div className="p-4 border-b border-gray-200 dark:border-dark-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-display font-bold text-gray-900 dark:text-white">Messages</h2>
            <button onClick={() => setIsAddContactOpen(true)} className="p-2 bg-crimson-600 hover:bg-crimson-500 text-white rounded-lg shadow-sm">
                <UserPlus className="w-4 h-4" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Filter chats..." 
              className="w-full bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-crimson-500 transition-all"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {/* AI Chat Item */}
          <button 
            onClick={() => { setActiveChatId('ai'); setIsSidebarOpen(false); }}
            className={`w-full p-4 flex items-center gap-3 transition-colors border-b border-gray-100 dark:border-dark-800/50 ${activeChatId === 'ai' ? 'bg-white dark:bg-dark-800 border-l-4 border-l-crimson-500 shadow-sm' : 'hover:bg-gray-100 dark:hover:bg-dark-800/50'}`}
          >
             <div className="relative shrink-0">
               <div className="w-10 h-10 rounded-full bg-gradient-to-br from-crimson-500 to-indigo-600 flex items-center justify-center shadow-md">
                 <Sparkles className="text-white w-5 h-5" />
               </div>
               <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-dark-900 rounded-full"></span>
             </div>
             <div className="text-left overflow-hidden">
                <h3 className="font-bold text-gray-900 dark:text-white text-sm">Nexus AI</h3>
                <p className="text-xs text-gray-500 truncate">Virtual Assistant</p>
             </div>
          </button>

          {/* Contact List */}
          <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">{peopleHeader}</div>
          {contacts.length === 0 ? (
             <div className="p-4 text-center text-gray-400 text-xs">
                 <p>No contacts yet.</p>
                 <button onClick={() => setIsAddContactOpen(true)} className="text-crimson-500 font-bold hover:underline mt-1">Add someone</button>
             </div>
          ) : (
            contacts.map(contact => (
                <button 
                key={contact.id}
                onClick={() => { setActiveChatId(contact.id); setIsSidebarOpen(false); }}
                className={`w-full p-4 flex items-center gap-3 transition-colors border-b border-gray-100 dark:border-dark-800/50 ${activeChatId === contact.id ? 'bg-white dark:bg-dark-800 border-l-4 border-l-crimson-500 shadow-sm' : 'hover:bg-gray-100 dark:hover:bg-dark-800/50'}`}
                >
                <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-dark-700 flex items-center justify-center text-gray-500 dark:text-gray-400 font-bold overflow-hidden">
                    {contact.avatarUrl ? <img src={contact.avatarUrl} className="w-full h-full object-cover"/> : contact.name.charAt(0)}
                    </div>
                    {contact.isOnline && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-dark-900 rounded-full"></span>}
                </div>
                <div className="text-left overflow-hidden">
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm truncate">{contact.name}</h3>
                    <p className="text-xs text-gray-500 truncate capitalize">{contact.role.toLowerCase()}</p>
                </div>
                </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col w-full ${isSidebarOpen ? 'hidden md:flex' : 'flex'}`}>
        <div className="bg-white/95 dark:bg-dark-900/95 backdrop-blur-md p-4 border-b border-gray-100 dark:border-dark-700 flex justify-between items-center z-10">
          <div className="flex items-center gap-3">
             <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-1 mr-1 text-gray-500">
                <ChevronLeft className="w-6 h-6" />
             </button>
             {activeChatId === 'ai' ? (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-crimson-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-crimson-500/20">
                  <Sparkles className="text-white w-5 h-5" />
                </div>
             ) : (
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-dark-700 flex items-center justify-center font-bold text-gray-600 dark:text-gray-300 overflow-hidden">
                   {activeContact?.avatarUrl ? <img src={activeContact.avatarUrl} className="w-full h-full object-cover"/> : activeContact?.name?.charAt(0)}
                </div>
             )}
            <div>
              <h3 className="font-display font-bold text-lg text-gray-900 dark:text-white leading-tight">
                {activeContact?.name || 'Unknown User'}
              </h3>
              <p className="text-xs text-crimson-600 dark:text-crimson-400 font-medium flex items-center gap-1.5">
                {activeChatId === 'ai' ? (
                   <><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>Secure & Encrypted</>
                ) : (
                   <><span className={`w-1.5 h-1.5 rounded-full ${activeContact?.isOnline ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>{activeContact?.isOnline ? 'Online' : 'Offline'}</>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-gray-50 dark:bg-dark-900/30 scroll-smooth">
          {messages.map((msg) => {
            const isMe = msg.senderId === currentUser.id;
            return (
              <div key={msg.id} className={`flex gap-3 ${isMe ? 'justify-end' : 'justify-start'}`}>
                {!isMe && (
                   <div className="w-8 h-8 rounded-full bg-dark-800 border border-dark-700 flex items-center justify-center shrink-0 self-end mb-1 overflow-hidden">
                     {msg.isAi ? <Bot className="w-4 h-4 text-crimson-500" /> : <span className="font-bold text-xs text-gray-400">{msg.senderName.charAt(0)}</span>}
                   </div>
                )}
                
                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%] md:max-w-[70%]`}>
                  <span className="text-[10px] text-gray-400 mb-1 px-1">
                    {msg.senderName} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <div className={`rounded-2xl p-3.5 shadow-sm relative text-sm leading-relaxed break-words overflow-hidden ${
                    !isMe 
                      ? 'bg-white dark:bg-dark-700 text-gray-800 dark:text-gray-100 rounded-bl-none border border-gray-100 dark:border-dark-600' 
                      : 'bg-gradient-to-br from-crimson-600 to-crimson-700 text-white rounded-br-none shadow-md shadow-crimson-900/20'
                  }`}>
                    {msg.attachmentType === 'image' && msg.attachmentUrl && (
                      <div className="mb-2 rounded-lg overflow-hidden">
                        <img src={msg.attachmentUrl} alt="Attachment" className="max-w-full max-h-[200px] object-cover" />
                      </div>
                    )}
                    {msg.attachmentType === 'audio' && msg.attachmentUrl && (
                      <div className="flex items-center gap-2 mb-1">
                         <audio controls src={msg.attachmentUrl} className="h-8 max-w-[200px]" />
                      </div>
                    )}
                    {msg.content}
                  </div>
                </div>

                {isMe && (
                   <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center shrink-0 self-end mb-1 overflow-hidden">
                     {currentUser.avatarUrl ? (
                       <img src={currentUser.avatarUrl} alt="Me" className="w-full h-full object-cover" />
                     ) : (
                       <UserIcon className="w-4 h-4 text-gray-500 dark:text-gray-300" />
                     )}
                   </div>
                )}
              </div>
            );
          })}
          {isThinking && <div className="text-gray-500 text-xs italic ml-12">Nexus AI is typing...</div>}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-white dark:bg-dark-900 border-t border-gray-200 dark:border-dark-700">
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*,audio/*" onChange={handleFileSelect} />
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-dark-800 border border-transparent focus-within:border-crimson-500 dark:focus-within:border-crimson-500 focus-within:ring-1 focus-within:ring-crimson-500 rounded-xl p-2 transition-all duration-300">
            <button onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-200 dark:hover:bg-dark-700 hidden sm:block">
              <Paperclip className="w-5 h-5" />
            </button>
            <input
              type="text"
              className="flex-1 bg-transparent border-none focus:outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm h-full"
              placeholder={`Message ${activeChatId === 'ai' ? 'Nexus AI' : activeContact?.name || 'User'}...`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              disabled={isRecording}
            />
            {isRecording ? (
               <button onClick={stopRecording} className="p-2 text-red-500 animate-pulse bg-red-500/10 rounded-lg hover:bg-red-500/20 transition-colors"><StopCircle className="w-5 h-5" /></button>
            ) : (
                <button onClick={startRecording} className="p-2 text-gray-400 hover:text-crimson-500 transition-colors rounded-lg hover:bg-gray-200 dark:hover:bg-dark-700"><Mic className="w-5 h-5" /></button>
            )}
            <button onClick={handleSend} disabled={!input.trim() && !isRecording} className={`p-2.5 rounded-lg transition-all shadow-md flex items-center justify-center ${input.trim() ? 'bg-crimson-600 hover:bg-crimson-500 text-white shadow-crimson-900/30' : 'bg-gray-300 dark:bg-dark-600 text-gray-500 cursor-not-allowed'}`}>
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Search Directory Modal */}
      {isAddContactOpen && (
        <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
             <div className="bg-white dark:bg-dark-900 w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 dark:border-dark-700 flex flex-col max-h-[80%] animate-fade-in-down">
                <div className="p-4 border-b border-gray-100 dark:border-dark-800 flex justify-between items-center">
                    <h3 className="font-bold text-gray-900 dark:text-white">Find a {currentUser.role === UserRole.PATIENT ? 'Doctor' : 'Patient'}</h3>
                    <button onClick={() => setIsAddContactOpen(false)} className="p-1 text-gray-400 hover:text-crimson-500"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-4">
                     <div className="relative mb-4">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                        <input 
                          autoFocus
                          type="text" 
                          placeholder="Search directory..." 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full bg-gray-50 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-crimson-500"
                        />
                     </div>
                     <div className="space-y-2 overflow-y-auto max-h-64">
                         {searching ? (
                             <div className="flex justify-center py-4"><Loader2 className="animate-spin w-6 h-6 text-crimson-500" /></div>
                         ) : searchResults.length > 0 ? (
                             searchResults.map(user => (
                                 <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors">
                                     <div className="flex items-center gap-3">
                                         <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-dark-700 flex items-center justify-center font-bold text-gray-500 overflow-hidden">
                                             {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover"/> : user.name.charAt(0)}
                                         </div>
                                         <div>
                                             <p className="text-sm font-bold text-gray-900 dark:text-white">{user.name}</p>
                                             <p className="text-xs text-gray-500 capitalize">{user.role.toLowerCase()}</p>
                                         </div>
                                     </div>
                                     <button onClick={() => handleAddPerson(user.id)} className="px-3 py-1.5 bg-crimson-600 hover:bg-crimson-500 text-white text-xs font-bold rounded-lg transition-colors">
                                         Connect
                                     </button>
                                 </div>
                             ))
                         ) : (
                             <p className="text-center text-gray-500 text-sm py-4">No users found.</p>
                         )}
                     </div>
                </div>
             </div>
        </div>
      )}
    </div>
  );
};
