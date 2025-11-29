export enum UserRole {
  PATIENT = 'PATIENT',
  PROVIDER = 'PROVIDER',
  ADMIN = 'ADMIN'
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isVerified: boolean; // For providers
  avatarUrl?: string;
  walletAddress?: string; // BSV Wallet Address
  healthScore?: number; // AI Calculated 0-100
  parentId?: string; // If this user is a dependent
  country?: string; // Geolocation for AI Context
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  providerId: string;
  type: 'PRESCRIPTION' | 'LAB_REPORT' | 'CLINICAL_NOTE' | 'IMAGING';
  title: string;
  content: string; // Encrypted content or Description
  aiSummary?: string; // AI Generated summary
  fileUrl?: string; // Mock URL for uploaded file
  fileName?: string;
  date: string;
  
  // Sharing Permissions
  sharedWith?: string[]; // Array of User IDs (Providers) who have access

  // BSV Specifics
  bsvTxId: string; // Bitcoin SV Transaction ID
  scriptPubKey: string; // The locking script
  smartContractAddress?: string; // Virtual address of the contract
  blockHeight?: number;
  satoshis: number; // Cost in sats
  
  // Revision History
  previousVersionId?: string;
  version?: number;
}

export interface SmartContract {
  code: string;
  abi: string;
  compilerVersion: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  providerId: string;
  providerName: string;
  patientName: string;
  date: string;
  time: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'PENDING';
  type: 'VIDEO' | 'IN_PERSON';
  notes?: string;
  meetingSummary?: string; // AI Auto-notes
}

export interface ChatMessage {
  id: string;
  senderId: string; // 'system' or 'ai' or userId
  recipientId?: string; // 'ai' or userId
  senderName: string;
  content: string;
  timestamp: Date;
  isAi?: boolean;
  attachmentUrl?: string;
  attachmentType?: 'image' | 'audio' | 'file';
  smartSuggestions?: string[]; // Gmail-style smart replies
}

export interface Contact {
  id: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  lastMessage?: string;
  isOnline?: boolean;
}

export interface VerificationRequest {
  id: string;
  providerEmail: string;
  documentUrl: string; // Base64 or URL
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  aiAnalysis?: string;
}

// --- NEW FEATURES TYPES ---

export interface SymptomCheckResult {
  condition: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendation: string;
  redFlags: string[];
}

export interface WellnessEntry {
  id: string;
  userId: string;
  date: string;
  type: 'SLEEP' | 'MOOD' | 'HYDRATION' | 'EXERCISE';
  value: number; // e.g. hours, ml, scale 1-10
  notes?: string;
}

export interface WearableData {
  heartRate: number;
  steps: number;
  spO2: number;
  bloodPressureSys: number;
  bloodPressureDia: number;
  lastSync: Date;
}

export interface DoctorTask {
  id: string;
  providerId: string;
  patientId?: string;
  patientName?: string;
  description: string;
  status: 'PENDING' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'ALERT' | 'REMINDER' | 'INFO' | 'AI_INSIGHT';
  read: boolean;
  timestamp: Date;
}

export interface EmergencyAlert {
  id: string;
  patientId: string;
  patientName: string;
  timestamp: Date;
  severity: 'HIGH' | 'CRITICAL';
  symptoms: string;
  aiAssessment: string;
  location?: string;
  vitals?: WearableData;
  active: boolean;
  bsvTxId?: string; // Logged on blockchain
}

export interface RiskPrediction {
  id: string;
  userId: string;
  category: 'CARDIAC' | 'METABOLIC' | 'RESPIRATORY' | 'MENTAL';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  probability: number; // 0-100
  prediction: string;
  preventativeSteps: string[];
  timestamp: Date;
}

export interface Dependent {
  id: string;
  parentId: string;
  name: string;
  relation: 'CHILD' | 'SPOUSE' | 'PARENT' | 'OTHER';
  age: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  country?: string;
}