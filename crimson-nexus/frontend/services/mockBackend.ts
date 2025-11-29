
import { User, UserRole, MedicalRecord, ChatMessage, Contact, Appointment, WellnessEntry, DoctorTask, Notification, WearableData, EmergencyAlert, RiskPrediction, Dependent } from "../types";
import { DEVELOPER_EMAIL, DEVELOPER_ID, MOCK_HASH_PREFIX } from "../constants";
import { broadcastToBSV, compileSmartContract } from "./bsvService";
import { encryptData, decryptData } from "./cryptoService";
import { assessEmergencySituation, predictHealthRisks } from "./geminiService";
import { sendOTPEmail } from "./brevoService";

// --- HYBRID ARCHITECTURE CONFIG ---
const env = (import.meta as any).env;
const USE_API = env?.VITE_USE_API === 'true';
const API_URL = env?.VITE_API_URL || 'http://localhost:5000/api';

// Extended User type
interface MockUser extends User {
  password?: string;
  dependents?: string[];
}

// In-Memory OTP Store (for local mode)
const otpStore: Record<string, string> = {};

const DB_KEYS={USERS:'crimson_users',RECORDS:'crimson_records',APPOINTMENTS:'crimson_appointments',CONNECTIONS:'crimson_connections',MESSAGES:'crimson_messages',WELLNESS:'crimson_wellness',TASKS:'crimson_tasks',NOTIFICATIONS:'crimson_notifications',EMERGENCIES:'crimson_emergencies',RISKS:'crimson_risks',DEPENDENTS:'crimson_dependents'};const load=async<T>(k:string,d:T):Promise<T>=>{try{const s=localStorage.getItem(k);return s?await decryptData(s,d):d}catch(e){return d}};const save=async(k:string,d:any)=>{try{const e=await encryptData(d);localStorage.setItem(k,e)}catch(e){console.error("DB Save Error",e)}};
const defaultUsers:MockUser[]=[{id:DEVELOPER_ID,email:DEVELOPER_EMAIL,name:'Nexus Developer',role:UserRole.ADMIN,isVerified:true,password:'crimsonnexus119',walletAddress:'1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',healthScore:85,country:'India'},{id:'patient-001',email:'sarah@example.com',name:'Sarah Connor',role:UserRole.PATIENT,isVerified:true,password:'password123',walletAddress:'1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2',healthScore:72,country:'United Kingdom'},{id:'dr-strange',email:'strange@nexus.health',name:'Dr. Stephen Strange',role:UserRole.PROVIDER,isVerified:true,password:'password123',avatarUrl:'https://ui-avatars.com/api/?name=Stephen+Strange&background=0D8ABC&color=fff',walletAddress:'3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy',country:'United States'}];
let users:MockUser[]=[],connections:Record<string,string[]>={},records:MedicalRecord[]=[],appointments:Appointment[]=[],p2pMessages:ChatMessage[]=[],wellnessData:WellnessEntry[]=[],tasks:DoctorTask[]=[],notifications:Notification[]=[],emergencyAlerts:EmergencyAlert[]=[],riskPredictions:RiskPrediction[]=[],dependents:Dependent[]=[];
const initDB=async()=>{if(USE_API)return;users=await load(DB_KEYS.USERS,defaultUsers);connections=await load(DB_KEYS.CONNECTIONS,{});records=await load(DB_KEYS.RECORDS,[]);appointments=await load(DB_KEYS.APPOINTMENTS,[]);p2pMessages=await load(DB_KEYS.MESSAGES,[]);wellnessData=await load(DB_KEYS.WELLNESS,[]);tasks=await load(DB_KEYS.TASKS,[]);notifications=await load(DB_KEYS.NOTIFICATIONS,[]);emergencyAlerts=await load(DB_KEYS.EMERGENCIES,[]);riskPredictions=await load(DB_KEYS.RISKS,[]);dependents=await load(DB_KEYS.DEPENDENTS,[]);const devUserIndex=users.findIndex(u=>u.id===DEVELOPER_ID);if(devUserIndex===-1){users.push(defaultUsers[0]);await save(DB_KEYS.USERS,users)}else{if(users[devUserIndex].country==='United States'){users[devUserIndex].country='India';await save(DB_KEYS.USERS,users)}}};const ensureDB=async()=>{if(USE_API)return;if(users.length===0)await initDB()};
const apiCall=async(e:string,m:string='GET',b?:any)=>{const h:any={'Content-Type':'application/json'};const r=await fetch(`${API_URL}${e}`,{method:m,headers:h,body:b?JSON.stringify(b):undefined});if(!r.ok)throw new Error(`API Error: ${r.statusText}`);return await r.json()};

export const backendLogin = async (identifier: string, password: string, requestedRole?: UserRole): Promise<User | null> => {
  if (USE_API) { try { return await apiCall('/auth/login', 'POST', { identifier, password, role: requestedRole }); } catch (e) { return null; } }
  await ensureDB(); await new Promise(r => setTimeout(r, 800));
  if ((identifier === 'crimsonnexus119' || identifier === 'crimsonnexus119@gmail.com') && password === 'crimsonnexus119') {
     const devUser = users.find(u => u.id === 'crimsonnexus119');
     if (devUser) { const effectiveRole = requestedRole || UserRole.ADMIN; const { password: _, ...safeUser } = devUser; return { ...safeUser, role: effectiveRole, healthScore: 88 }; }
  }
  const user = users.find(u => u.email === identifier || u.id === identifier);
  if (!user) return null;
  if (user.password === password) { const { password: _, ...safeUser } = user; return safeUser; }
  return null;
};

// NEW: Send Verification Code
export const backendSendVerificationCode = async (email: string): Promise<{ success: boolean, message?: string }> => {
    if (USE_API) return await apiCall('/auth/send-otp', 'POST', { email });
    
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[email] = otp;
    
    console.log(`[DEV MODE] OTP for ${email}: ${otp}`); 
    
    // Attempt real email send via Brevo
    const sent = await sendOTPEmail(email, otp);
    
    if (sent) {
        return { success: true };
    } else {
        // Fallback message if API fails (likely due to CORS in strict browser envs)
        return { success: true, message: `Email API blocked by browser CORS. Use this code: ${otp}` };
    }
};

// NEW: Verify Code
export const backendVerifyCode = async (email: string, code: string): Promise<boolean> => {
    if (USE_API) return await apiCall('/auth/verify-otp', 'POST', { email, code });
    return otpStore[email] === code;
};

export const backendRegister = async (email: string, password: string, role: UserRole, name: string, userId?: string, isVerified: boolean = false, country?: string): Promise<User> => {
  if (USE_API) return await apiCall('/auth/register', 'POST', { email, password, role, name, id: userId, isVerified, country });
  await ensureDB(); await new Promise(r => setTimeout(r, 1000));
  const newId = userId || `u-${Date.now()}`;
  const newUser: MockUser = { id: newId, email, name, role, isVerified: isVerified || role === UserRole.PATIENT, password: password, walletAddress: `1${Math.random().toString(36).substring(2, 10)}...BSV`, healthScore: 70, country: country || 'United States' };
  users.push(newUser); await save(DB_KEYS.USERS, users);
  const { password: _, ...safeUser } = newUser;
  return safeUser;
};

export const backendUpdateUser = async (userId: string, updates: Partial<User>): Promise<User | null> => { await ensureDB(); const index = users.findIndex(u => u.id === userId); if (index === -1) return null; users[index] = { ...users[index], ...updates }; await save(DB_KEYS.USERS, users); const { password: _, ...safeUser } = users[index]; return safeUser; };
export const backendGetDependents = async (parentId: string): Promise<Dependent[]> => { await ensureDB(); return dependents.filter(d => d.parentId === parentId); };
export const backendAddDependent = async (parentId: string, name: string, relation: Dependent['relation'], age: number): Promise<Dependent> => { await ensureDB(); const parent = users.find(u => u.id === parentId); const depId = `dep-${Date.now()}`; const newDep: Dependent = { id: depId, parentId, name, relation, age, gender: 'OTHER', country: parent?.country }; dependents.push(newDep); const depUser: MockUser = { id: depId, name: name, email: `${name.toLowerCase().replace(' ', '')}@dependent.nexus`, role: UserRole.PATIENT, isVerified: true, healthScore: 80, parentId: parentId, country: parent?.country }; users.push(depUser); await save(DB_KEYS.DEPENDENTS, dependents); await save(DB_KEYS.USERS, users); return newDep; };
export const backendSwitchProfile = async (currentUserId: string, targetProfileId: string): Promise<User | null> => { await ensureDB(); const target = users.find(u => u.id === targetProfileId); if (!target) return null; const parent = users.find(u => u.id === currentUserId); if (target.id !== currentUserId && target.parentId !== currentUserId) { return null; } const { password: _, ...safeUser } = target; return safeUser; };
export const backendTriggerEmergency = async (userId: string, symptoms: string): Promise<EmergencyAlert> => { await ensureDB(); const user = users.find(u => u.id === userId); const vitals = await backendGetWearables(userId); const assessment = await assessEmergencySituation(symptoms, vitals, user?.country); const bsvLog = await broadcastToBSV({ type: 'EMERGENCY_ALERT', patientId: userId, symptoms, assessment, timestamp: Date.now() }); const alert: EmergencyAlert = { id: `sos-${Date.now()}`, patientId: userId, patientName: user?.name || 'Unknown', timestamp: new Date(), severity: assessment.severity, symptoms, aiAssessment: assessment.assessment, vitals, active: true, bsvTxId: bsvLog.txId }; emergencyAlerts.push(alert); await save(DB_KEYS.EMERGENCIES, emergencyAlerts); const providers = await backendGetContacts({ id: userId } as User); for (const p of providers) { if (p.role === UserRole.PROVIDER) { await backendAddNotification(p.id, "EMERGENCY ALERT", `Critical alert for ${user?.name}: ${assessment.assessment}`, 'ALERT'); } } return alert; };
export const backendGetEmergencyAlerts = async (providerId: string): Promise<EmergencyAlert[]> => { await ensureDB(); const myPatientIds = (await backendGetPatientsForProvider(providerId)).map(u => u.id); return emergencyAlerts.filter(a => a.active && myPatientIds.includes(a.patientId)); };
export const backendGenerateRiskPrediction = async (userId: string): Promise<RiskPrediction[]> => { await ensureDB(); const user = users.find(u => u.id === userId); const history = records.filter(r => r.patientId === userId).map(r => r.aiSummary || r.title).join(". "); const wellness = wellnessData.filter(w => w.userId === userId).map(w => `${w.type}: ${w.value}`).join(", "); const risks = await predictHealthRisks(`Medical History: ${history}. Wellness Data: ${wellness}`, user?.country); const newPredictions = risks.map(r => ({ id: `risk-${Date.now()}-${Math.random()}`, userId, category: r.category as any, riskLevel: r.level as any, probability: r.probability, prediction: r.prediction, preventativeSteps: r.steps, timestamp: new Date() })); riskPredictions = [...riskPredictions.filter(rp => rp.userId !== userId), ...newPredictions]; await save(DB_KEYS.RISKS, riskPredictions); return newPredictions; };
export const backendGetRisks = async (userId: string): Promise<RiskPrediction[]> => { await ensureDB(); return riskPredictions.filter(r => r.userId === userId); };
export const backendGetRecords = async (userId: string): Promise<MedicalRecord[]> => { if (USE_API) return await apiCall(`/records/${userId}`); await ensureDB(); await new Promise(r => setTimeout(r, 400)); const user = users.find(u => u.id === userId); if (user?.role === UserRole.ADMIN && userId !== DEVELOPER_ID) { return records; } if (user?.role === UserRole.PROVIDER) { return records.filter(r => r.providerId === userId || r.sharedWith?.includes(userId)); } return records.filter(r => r.patientId === userId); };
export const backendAddRecord = async (record: Partial<MedicalRecord>): Promise<MedicalRecord> => { if (USE_API) return await apiCall('/records', 'POST', { ...record, date: new Date().toISOString().split('T')[0] }); await ensureDB(); let txId = record.bsvTxId; let fee = record.satoshis || 300; if (!txId) { const bsvResult = await broadcastToBSV(record); txId = bsvResult.txId; fee = bsvResult.fee; } const newRecord: MedicalRecord = { id: `rec-${Date.now()}`, patientId: record.patientId!, providerId: record.providerId!, type: record.type as any, title: record.title!, content: record.content!, aiSummary: record.aiSummary, fileUrl: record.fileUrl, fileName: record.fileName, date: new Date().toISOString().split('T')[0], bsvTxId: txId!, scriptPubKey: record.scriptPubKey || 'OP_DUP OP_HASH160 ... OP_EQUALVERIFY OP_CHECKSIG', satoshis: fee, blockHeight: undefined, sharedWith: [] }; records.push(newRecord); await save(DB_KEYS.RECORDS, records); await backendAddNotification(newRecord.patientId, "New Medical Record", `A new record "${newRecord.title}" has been added.`, 'INFO'); return newRecord; };
export const backendShareRecord = async (recordId: string, targetUserId: string): Promise<boolean> => { await ensureDB(); await new Promise(r => setTimeout(r, 600)); const record = records.find(r => r.id === recordId); if (!record) return false; if (!record.sharedWith) record.sharedWith = []; if (!record.sharedWith.includes(targetUserId)) { record.sharedWith.push(targetUserId); await save(DB_KEYS.RECORDS, records); } return true; };
export const backendGetAppointments = async (userId: string): Promise<Appointment[]> => { if (USE_API) return await apiCall(`/appointments/${userId}`); await ensureDB(); await new Promise(r => setTimeout(r, 400)); const user = users.find(u => u.id === userId); if (!user) return []; if (user.role === UserRole.PROVIDER) { return appointments.filter(a => a.providerId === userId); } return appointments.filter(a => a.patientId === userId); };
export const backendBookAppointment = async (apt: Partial<Appointment>): Promise<Appointment> => { if (USE_API) return await apiCall('/appointments', 'POST', apt); await ensureDB(); await new Promise(r => setTimeout(r, 1000)); const newApt: Appointment = { id: `apt-${Date.now()}`, patientId: apt.patientId!, providerId: apt.providerId!, patientName: apt.patientName!, providerName: apt.providerName!, date: apt.date!, time: apt.time!, status: 'PENDING', type: apt.type as any || 'VIDEO', notes: apt.notes }; appointments.push(newApt); await save(DB_KEYS.APPOINTMENTS, appointments); await backendAddNotification(apt.providerId!, "New Appointment Request", `${apt.patientName} requested a ${apt.type} appointment.`, 'ALERT'); return newApt; };
export const backendConfirmAppointment = async (aptId: string, confirm: boolean): Promise<void> => { if (USE_API) { await apiCall(`/appointments/${aptId}/confirm`, 'POST', { confirm }); return; } await ensureDB(); await new Promise(r => setTimeout(r, 500)); const apt = appointments.find(a => a.id === aptId); if (apt) { apt.status = confirm ? 'SCHEDULED' : 'CANCELLED'; await save(DB_KEYS.APPOINTMENTS, appointments); await backendAddNotification(apt.patientId, "Appointment Update", `Your appointment with ${apt.providerName} was ${confirm ? 'confirmed' : 'declined'}.`, confirm ? 'REMINDER' : 'ALERT'); } };
export const backendSearchDirectory = async (currentUser: User, query: string): Promise<User[]> => { await ensureDB(); await new Promise(r => setTimeout(r, 500)); const targetRole = currentUser.role === UserRole.PATIENT ? UserRole.PROVIDER : UserRole.PATIENT; return users.filter(u => u.role === targetRole && u.id !== currentUser.id && u.id !== 'crimsonnexus119' && (query === '' || u.name.toLowerCase().includes(query.toLowerCase()))); };
export const backendAddConnection = async (currentUserId: string, targetUserId: string): Promise<void> => { await ensureDB(); await new Promise(r => setTimeout(r, 300)); if (!connections[currentUserId]) connections[currentUserId] = []; if (!connections[targetUserId]) connections[targetUserId] = []; if (!connections[currentUserId].includes(targetUserId)) { connections[currentUserId].push(targetUserId); } if (!connections[targetUserId].includes(currentUserId)) { connections[targetUserId].push(currentUserId); } await save(DB_KEYS.CONNECTIONS, connections); };
export const backendGetPatientsForProvider = async (providerId: string): Promise<User[]> => { await ensureDB(); await new Promise(r => setTimeout(r, 500)); const patientIds = connections[providerId] || []; const appointmentPatientIds = appointments.filter(a => a.providerId === providerId).map(a => a.patientId); const uniqueIds = Array.from(new Set([...patientIds, ...appointmentPatientIds])); return users.filter(u => uniqueIds.includes(u.id)); };
export const backendGetContacts = async (currentUser: User): Promise<Contact[]> => { await ensureDB(); await new Promise(r => setTimeout(r, 300)); const connectedIds = connections[currentUser.id] || []; const myContacts = users.filter(u => connectedIds.includes(u.id)); return myContacts.map(u => ({ id: u.id, name: u.name, role: u.role, avatarUrl: u.avatarUrl, isOnline: Math.random() > 0.5, lastMessage: 'Click to start chat' })); };
export const backendGetConversation = async (currentUserId: string, otherUserId: string): Promise<ChatMessage[]> => { await ensureDB(); await new Promise(r => setTimeout(r, 200)); return p2pMessages.filter(m => (m.senderId === currentUserId && m.recipientId === otherUserId) || (m.senderId === otherUserId && m.recipientId === currentUserId)).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()); };
export const backendSendMessage = async (senderId: string, recipientId: string, content: string, attachmentUrl?: string, attachmentType?: 'image' | 'audio'): Promise<ChatMessage> => { await ensureDB(); await new Promise(r => setTimeout(r, 100)); const sender = users.find(u => u.id === senderId); const msg: ChatMessage = { id: `msg-${Date.now()}`, senderId, recipientId, senderName: sender?.name || 'Unknown', content, timestamp: new Date(), isAi: false, attachmentUrl, attachmentType }; p2pMessages.push(msg); await save(DB_KEYS.MESSAGES, p2pMessages); return msg; };
export const backendGetWearables = async (userId: string): Promise<WearableData> => { return { heartRate: 72 + Math.floor(Math.random() * 10), steps: 4500 + Math.floor(Math.random() * 5000), spO2: 98, bloodPressureSys: 120, bloodPressureDia: 80, lastSync: new Date() }; };
export const backendAddWellnessEntry = async (entry: Partial<WellnessEntry>): Promise<void> => { await ensureDB(); wellnessData.push({ id: `well-${Date.now()}`, userId: entry.userId!, date: new Date().toISOString(), type: entry.type!, value: entry.value!, notes: entry.notes }); await save(DB_KEYS.WELLNESS, wellnessData); };
export const backendGetTasks = async (providerId: string): Promise<DoctorTask[]> => { await ensureDB(); return tasks.filter(t => t.providerId === providerId); };
export const backendAddTask = async (task: Partial<DoctorTask>): Promise<DoctorTask> => { await ensureDB(); const newTask: DoctorTask = { id: `task-${Date.now()}`, providerId: task.providerId!, description: task.description!, status: 'PENDING', priority: task.priority || 'MEDIUM', patientId: task.patientId, patientName: task.patientName }; tasks.push(newTask); await save(DB_KEYS.TASKS, tasks); return newTask; };
export const backendGetNotifications = async (userId: string): Promise<Notification[]> => { await ensureDB(); return notifications.filter(n => n.userId === userId).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()); };
export const backendAddNotification = async (userId: string, title: string, message: string, type: Notification['type']): Promise<void> => { await ensureDB(); notifications.push({ id: `notif-${Date.now()}`, userId, title, message, type, read: false, timestamp: new Date() }); await save(DB_KEYS.NOTIFICATIONS, notifications); };
export const exportDatabase = async (): Promise<string> => { if (USE_API) return JSON.stringify({ error: "Cannot export when using remote API" }); await ensureDB(); const data = { users, connections, records, appointments, p2pMessages, wellnessData, tasks, notifications, emergencyAlerts, riskPredictions, dependents, version: '1.3' }; return JSON.stringify(data, null, 2); };
export const importDatabase = async (jsonString: string): Promise<boolean> => { if (USE_API) return false; try { const data = JSON.parse(jsonString); if (!data.users || !data.records) return false; users = data.users; connections = data.connections || {}; records = data.records; appointments = data.appointments || []; p2pMessages = data.p2pMessages || []; wellnessData = data.wellnessData || []; tasks = data.tasks || []; notifications = data.notifications || []; emergencyAlerts = data.emergencyAlerts || []; riskPredictions = data.riskPredictions || []; dependents = data.dependents || []; await save(DB_KEYS.USERS, users); await save(DB_KEYS.CONNECTIONS, connections); await save(DB_KEYS.RECORDS, records); await save(DB_KEYS.APPOINTMENTS, appointments); await save(DB_KEYS.MESSAGES, p2pMessages); await save(DB_KEYS.WELLNESS, wellnessData); await save(DB_KEYS.TASKS, tasks); await save(DB_KEYS.NOTIFICATIONS, notifications); await save(DB_KEYS.EMERGENCIES, emergencyAlerts); await save(DB_KEYS.RISKS, riskPredictions); await save(DB_KEYS.DEPENDENTS, dependents); return true; } catch (e) { console.error("Import failed", e); return false; } };
export const resetDatabase = () => { localStorage.clear(); window.location.reload(); };
