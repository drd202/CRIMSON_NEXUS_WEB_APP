
import React, { useState } from 'react';
import { UserRole, User } from '../types';
import { backendLogin, backendRegister, backendSendVerificationCode, backendVerifyCode } from '../services/mockBackend';
import { Lock, User as UserIcon, Loader2, Upload, AlertCircle, ShieldCheck, ArrowRight, CheckCircle2, Globe, Mail } from 'lucide-react';
import { analyzeMedicalLicense } from '../services/geminiService';

interface AuthProps {
  onLogin: (user: User) => void;
}

const COUNTRIES = [
  "United States", "United Kingdom", "Canada", "Australia", "Germany", "France", "Japan", "India", "Brazil", "China", "South Africa", "Other"
];

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  // Steps: FORM -> OTP -> VERIFY_DOC (Providers only)
  const [subStep, setSubStep] = useState<'FORM' | 'OTP' | 'VERIFY_DOC'>('FORM');
  
  // Login State
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginRole, setLoginRole] = useState<UserRole>(UserRole.PATIENT); 
  
  // Register State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regUserId, setRegUserId] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>(UserRole.PATIENT);
  const [regCountry, setRegCountry] = useState('United States');
  
  // Verification State
  const [otpCode, setOtpCode] = useState('');
  const [licenseImage, setLicenseImage] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<string>('');
  
  // UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await new Promise(r => setTimeout(r, 600)); 
      
      const cleanIdentifier = loginIdentifier.trim();
      const cleanPassword = loginPassword.trim();

      const user = await backendLogin(cleanIdentifier, cleanPassword, loginRole);
      
      if (user) {
        onLogin(user);
      } else {
        setError('Invalid User ID/Email or Password.');
      }
    } catch (err) {
      setError('An error occurred during login.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterNext = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
        const result = await backendSendVerificationCode(regEmail);
        if (result.success) {
            if (result.message) alert(result.message); // Fallback for CORS/Localhost
            setSubStep('OTP');
        } else {
            setError('Failed to send verification code.');
        }
    } catch (err) {
        setError('Error sending verification code.');
    } finally {
        setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError('');
      
      const isValid = await backendVerifyCode(regEmail, otpCode);
      
      if (isValid) {
          if (regRole === UserRole.PROVIDER) {
              setSubStep('VERIFY_DOC');
          } else {
              await finalizeRegistration(false);
          }
      } else {
          setError('Invalid verification code.');
      }
      setLoading(false);
  };

  const finalizeRegistration = async (isVerifiedProvider: boolean) => {
    setLoading(true);
    try {
      const user = await backendRegister(
        regEmail, 
        regPassword, 
        regRole, 
        regName, 
        regUserId || undefined,
        isVerifiedProvider,
        regCountry
      );
      onLogin(user);
    } catch (err) {
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLicenseImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const verifyLicense = async () => {
    if (!licenseImage) return;
    setLoading(true);
    setVerificationStatus('Initializing Gemini Vision API...');
    
    try {
      const result = await analyzeMedicalLicense(licenseImage);
      
      if (result.valid) {
        setVerificationStatus('Verification Successful! Securing credentials...');
        await new Promise(r => setTimeout(r, 1000));
        await finalizeRegistration(true);
      } else {
        setLoading(false);
        setError(`Verification Failed: ${result.reasoning}`);
        setVerificationStatus('');
      }
    } catch (err) {
      setLoading(false);
      setError('Verification process failed. Please try again.');
    }
  };

  const RoleSelector = ({ selectedRole, setRole }: { selectedRole: UserRole, setRole: (r: UserRole) => void }) => (
    <div>
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">I am a...</label>
      <div className="grid grid-cols-2 gap-3">
        <button 
          type="button"
          onClick={() => setRole(UserRole.PATIENT)}
          className={`p-3 rounded-xl border text-sm font-bold transition-all duration-300 flex flex-col items-center gap-2 ${selectedRole === UserRole.PATIENT ? 'bg-crimson-600 border-crimson-500 text-white shadow-lg shadow-crimson-900/30' : 'bg-dark-800/50 border-dark-600/50 text-gray-500 hover:bg-dark-700/50 hover:text-gray-300'}`}
        >
          <UserIcon className="w-5 h-5" />
          Patient
        </button>
        <button 
          type="button"
          onClick={() => setRole(UserRole.PROVIDER)}
          className={`p-3 rounded-xl border text-sm font-bold transition-all duration-300 flex flex-col items-center gap-2 ${selectedRole === UserRole.PROVIDER ? 'bg-crimson-600 border-crimson-500 text-white shadow-lg shadow-crimson-900/30' : 'bg-dark-800/50 border-dark-600/50 text-gray-500 hover:bg-dark-700/50 hover:text-gray-300'}`}
        >
          <ShieldCheck className="w-5 h-5" />
          Provider
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-crimson-500/30">
      {/* Dynamic Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-crimson-900/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-900/10 rounded-full blur-[120px]"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
      </div>

      <div className="w-full max-w-md bg-dark-900/80 backdrop-blur-2xl border border-dark-700/50 p-8 rounded-3xl shadow-2xl relative z-10 overflow-hidden ring-1 ring-white/5">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-crimson-500 to-transparent opacity-80"></div>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-crimson-600 to-crimson-800 rounded-2xl mb-4 transform rotate-12 hover:rotate-0 transition-transform duration-500 shadow-lg shadow-crimson-900/50 ring-1 ring-white/10">
            <div className="w-7 h-7 bg-white/90 transform -rotate-12"></div>
          </div>
          <h1 className="font-display text-4xl font-bold text-white tracking-wider drop-shadow-lg">
            CRIMSON <span className="text-crimson-500">NEXUS</span>
          </h1>
          <p className="text-gray-400 mt-2 text-sm font-light tracking-wide">Advanced Healthcare Ecosystem</p>
        </div>

        {subStep === 'FORM' && (
          <div className="flex bg-dark-800/80 p-1.5 rounded-xl mb-8 relative border border-white/5">
            <div className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-dark-700/90 rounded-lg shadow-sm border border-white/5 transition-all duration-300 ease-out ${mode === 'LOGIN' ? 'left-1.5' : 'left-[calc(50%+3px)]'}`}></div>
            <button 
              onClick={() => { setMode('LOGIN'); setError(''); }}
              className={`flex-1 relative z-10 py-2.5 text-xs font-bold uppercase tracking-wider text-center transition-colors duration-300 ${mode === 'LOGIN' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Access
            </button>
            <button 
              onClick={() => { setMode('REGISTER'); setError(''); }}
              className={`flex-1 relative z-10 py-2.5 text-xs font-bold uppercase tracking-wider text-center transition-colors duration-300 ${mode === 'REGISTER' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Join Nexus
            </button>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-950/30 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-200 text-sm animate-fade-in backdrop-blur-sm">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <span className="leading-tight">{error}</span>
          </div>
        )}

        {subStep === 'FORM' ? (
          <form onSubmit={mode === 'LOGIN' ? handleLoginSubmit : handleRegisterNext} className="animate-fade-in relative">
            
            {mode === 'LOGIN' && (
              <div className="space-y-5">
                <RoleSelector selectedRole={loginRole} setRole={setLoginRole} />

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">User ID or Email</label>
                  <div className="relative group">
                    <UserIcon className="absolute left-4 top-3.5 text-gray-500 w-5 h-5 group-focus-within:text-crimson-500 transition-colors duration-300" />
                    <input 
                      type="text" 
                      required
                      value={loginIdentifier}
                      onChange={e => setLoginIdentifier(e.target.value)}
                      className="w-full bg-dark-800/50 border border-dark-600/50 text-white p-3.5 pl-12 rounded-xl focus:outline-none focus:border-crimson-500 focus:bg-dark-800 transition-all placeholder-gray-600 shadow-inner"
                      placeholder="Enter ID or Email"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-3.5 text-gray-500 w-5 h-5 group-focus-within:text-crimson-500 transition-colors duration-300" />
                    <input 
                      type="password" 
                      required
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      className="w-full bg-dark-800/50 border border-dark-600/50 text-white p-3.5 pl-12 rounded-xl focus:outline-none focus:border-crimson-500 focus:bg-dark-800 transition-all placeholder-gray-600 shadow-inner"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                <button disabled={loading} className="w-full mt-2 bg-gradient-to-r from-crimson-700 to-crimson-600 hover:from-crimson-600 hover:to-crimson-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-crimson-900/40 transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 flex items-center justify-center gap-2 border border-crimson-500/20">
                  {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <>Sign In <ArrowRight className="w-4 h-4" /></>}
                </button>
              </div>
            )}

            {mode === 'REGISTER' && (
              <div className="space-y-4">
                 <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">Full Name</label>
                  <input 
                    type="text" 
                    required
                    value={regName}
                    onChange={e => setRegName(e.target.value)}
                    className="w-full bg-dark-800/50 border border-dark-600/50 text-white p-3 rounded-xl focus:outline-none focus:border-crimson-500 focus:bg-dark-800 transition-all"
                    placeholder="John Doe"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">Email</label>
                    <input 
                      type="email" 
                      required
                      value={regEmail}
                      onChange={e => setRegEmail(e.target.value)}
                      className="w-full bg-dark-800/50 border border-dark-600/50 text-white p-3 rounded-xl focus:outline-none focus:border-crimson-500 focus:bg-dark-800 transition-all"
                      placeholder="user@example"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">User ID</label>
                    <input 
                      type="text" 
                      value={regUserId}
                      onChange={e => setRegUserId(e.target.value)}
                      className="w-full bg-dark-800/50 border border-dark-600/50 text-white p-3 rounded-xl focus:outline-none focus:border-crimson-500 focus:bg-dark-800 transition-all"
                      placeholder="Optional"
                    />
                  </div>
                </div>

                <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">Country</label>
                   <div className="relative">
                      <Globe className="absolute left-3 top-3.5 text-gray-500 w-4 h-4" />
                      <select 
                         value={regCountry}
                         onChange={e => setRegCountry(e.target.value)}
                         className="w-full bg-dark-800/50 border border-dark-600/50 text-white p-3 pl-9 rounded-xl focus:outline-none focus:border-crimson-500 focus:bg-dark-800 transition-all appearance-none"
                      >
                         {COUNTRIES.map(c => <option key={c} value={c} className="bg-dark-800 text-white">{c}</option>)}
                      </select>
                   </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">Password</label>
                  <div className="relative">
                    <input 
                      type="password" 
                      required
                      value={regPassword}
                      onChange={e => setRegPassword(e.target.value)}
                      className="w-full bg-dark-800/50 border border-dark-600/50 text-white p-3 rounded-xl focus:outline-none focus:border-crimson-500 focus:bg-dark-800 transition-all"
                      placeholder="Strong password"
                    />
                  </div>
                </div>

                <RoleSelector selectedRole={regRole} setRole={setRegRole} />

                <button disabled={loading} className="w-full bg-white text-black font-bold py-3.5 rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 mt-4 shadow-lg shadow-white/5">
                  {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Send Verification Code'}
                </button>
              </div>
            )}
          </form>
        ) : subStep === 'OTP' ? (
            <form onSubmit={handleVerifyOtp} className="space-y-6 animate-fade-in text-center">
                <div className="flex items-center justify-center mb-2">
                    <div className="w-16 h-16 bg-dark-800 rounded-full flex items-center justify-center border border-dark-600 ring-4 ring-dark-800/50">
                        <Mail className="w-8 h-8 text-blue-500" />
                    </div>
                </div>
                <h3 className="text-white font-display font-bold text-xl">Email Verification</h3>
                <p className="text-sm text-gray-400 max-w-[90%] mx-auto leading-relaxed">
                    We've sent a 6-digit code to <span className="text-white font-bold">{regEmail}</span>.
                </p>
                
                <div>
                    <input 
                        type="text" 
                        maxLength={6}
                        value={otpCode}
                        onChange={e => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                        className="w-full text-center text-3xl tracking-[0.5em] font-mono bg-dark-800/50 border border-dark-600/50 text-white p-4 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-dark-800 transition-all placeholder-gray-700"
                        placeholder="000000"
                    />
                </div>

                <div className="flex gap-3">
                    <button 
                        type="button"
                        onClick={() => setSubStep('FORM')}
                        className="flex-1 py-3 rounded-xl border border-dark-600 text-gray-400 font-bold text-sm hover:text-white hover:bg-dark-800 hover:border-dark-500 transition-all"
                    >
                        Back
                    </button>
                    <button 
                        disabled={otpCode.length !== 6 || loading}
                        className={`flex-[2] font-bold py-3 rounded-xl transition-all shadow-lg ${otpCode.length !== 6 ? 'bg-dark-800 text-gray-600 cursor-not-allowed border border-dark-700' : 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-900/30'}`}
                    >
                        {loading ? <Loader2 className="animate-spin w-5 h-5 mx-auto" /> : 'Verify Code'}
                    </button>
                </div>
            </form>
        ) : (
          <div className="space-y-6 animate-fade-in text-center">
             <div className="flex items-center justify-center mb-2">
               <div className="w-16 h-16 bg-dark-800 rounded-full flex items-center justify-center border border-dark-600 ring-4 ring-dark-800/50">
                 <ShieldCheck className="w-8 h-8 text-emerald-500" />
               </div>
             </div>
            <h3 className="text-white font-display font-bold text-xl">Provider Verification</h3>
            <p className="text-sm text-gray-400 max-w-[90%] mx-auto leading-relaxed">
              Crimson Nexus utilizes Gemini Vision AI to instantly validate medical credentials. Upload your license below.
            </p>
            
            <div className="relative group cursor-pointer">
              <input type="file" onChange={handleFileUpload} accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
              <div className={`border-2 border-dashed rounded-2xl p-8 transition-all duration-300 ${licenseImage ? 'border-emerald-500 bg-emerald-900/10' : 'border-dark-600 bg-dark-800/50 hover:border-crimson-500 hover:bg-dark-800/80'}`}>
                 {licenseImage ? (
                   <div className="relative">
                     <img src={licenseImage} alt="Preview" className="max-h-40 mx-auto rounded-lg shadow-2xl" />
                     <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                       <span className="text-white text-xs font-bold bg-black/60 px-3 py-1.5 rounded-full border border-white/10">Replace Image</span>
                     </div>
                     <div className="absolute -top-2 -right-2 bg-emerald-500 text-white rounded-full p-1 shadow-lg">
                       <CheckCircle2 className="w-4 h-4" />
                     </div>
                   </div>
                 ) : (
                   <div className="flex flex-col items-center gap-4 text-gray-500 py-4 group-hover:text-gray-300 transition-colors">
                     <div className="w-16 h-16 rounded-full bg-dark-700/50 flex items-center justify-center group-hover:bg-crimson-900/20 group-hover:text-crimson-500 transition-all">
                        <Upload className="w-8 h-8" />
                     </div>
                     <span className="text-xs font-bold uppercase tracking-wider">Click or Drop License Here</span>
                   </div>
                 )}
              </div>
            </div>

            {verificationStatus && (
              <div className="flex items-center justify-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-900/20 py-2 rounded-lg border border-emerald-900/30">
                 {loading && <Loader2 className="w-3 h-3 animate-spin" />}
                 {verificationStatus}
              </div>
            )}

            <div className="flex gap-3">
              <button 
                onClick={() => setSubStep('FORM')}
                className="flex-1 py-3 rounded-xl border border-dark-600 text-gray-400 font-bold text-sm hover:text-white hover:bg-dark-800 hover:border-dark-500 transition-all"
              >
                Back
              </button>
              <button 
                onClick={verifyLicense}
                disabled={!licenseImage || loading}
                className={`flex-[2] font-bold py-3 rounded-xl transition-all shadow-lg ${!licenseImage ? 'bg-dark-800 text-gray-600 cursor-not-allowed border border-dark-700' : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-900/30'}`}
              >
                {loading ? 'Processing...' : 'Verify & Complete'}
              </button>
            </div>
          </div>
        )}

        <div className="mt-8 text-center">
          <p className="text-[10px] text-gray-600 uppercase tracking-[0.2em] font-medium flex items-center justify-center gap-2">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            Secured by Gemini AI & Blockchain
          </p>
        </div>
      </div>
    </div>
  );
};
