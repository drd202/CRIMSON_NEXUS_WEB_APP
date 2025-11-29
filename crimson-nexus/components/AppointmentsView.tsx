
import React, { useState, useEffect } from 'react';
import { User, Appointment, UserRole } from '../types';
import { backendGetAppointments, backendBookAppointment, backendGetContacts, backendConfirmAppointment } from '../services/mockBackend';
import { Calendar, Clock, Video, MapPin, User as UserIcon, Plus, Loader2, CheckCircle2, XCircle } from 'lucide-react';

interface AppointmentsViewProps {
  currentUser: User;
}

export const AppointmentsView: React.FC<AppointmentsViewProps> = ({ currentUser }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  
  // Booking State
  const [providers, setProviders] = useState<{id: string, name: string}[]>([]);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [type, setType] = useState<'VIDEO' | 'IN_PERSON'>('VIDEO');
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    loadAppointments();
    
    if (currentUser.role === UserRole.PATIENT) {
        backendGetContacts(currentUser).then(contacts => {
             setProviders(contacts.filter(c => c.role === UserRole.PROVIDER));
        });
    }
  }, [currentUser]);

  const loadAppointments = () => {
    backendGetAppointments(currentUser.id).then(res => {
      setAppointments(res);
      setLoading(false);
    });
  };

  const handleBook = async () => {
    if (!selectedProvider || !date || !time) return;
    setBooking(true);
    
    const provider = providers.find(p => p.id === selectedProvider);
    
    const newApt = await backendBookAppointment({
      patientId: currentUser.id,
      patientName: currentUser.name,
      providerId: selectedProvider,
      providerName: provider?.name || 'Doctor',
      date,
      time,
      type
    });

    setAppointments(prev => [...prev, newApt]);
    setBooking(false);
    setIsBookModalOpen(false);
    setDate(''); setTime(''); setSelectedProvider('');
  };

  const handleConfirmation = async (aptId: string, confirm: boolean) => {
      await backendConfirmAppointment(aptId, confirm);
      loadAppointments(); // Refresh list
  };

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">Appointments</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage your visits and consultations.</p>
        </div>
        {currentUser.role === UserRole.PATIENT && (
          <button 
            onClick={() => setIsBookModalOpen(true)}
            className="bg-crimson-600 hover:bg-crimson-500 text-white px-4 py-2 rounded-xl shadow-lg shadow-crimson-900/20 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" /> Book Appointment
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-crimson-500 w-8 h-8" /></div>
      ) : (
        <div className="space-y-4">
          {appointments.length === 0 ? (
             <div className="text-center py-20 bg-gray-50 dark:bg-dark-800 rounded-2xl border border-dashed border-gray-300 dark:border-dark-600">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-gray-500 dark:text-gray-400 font-medium">No appointments scheduled</h3>
             </div>
          ) : (
             appointments.map(apt => (
                <div key={apt.id} className="bg-white dark:bg-dark-800 p-6 rounded-2xl border border-gray-100 dark:border-dark-700 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-crimson-200 dark:hover:border-crimson-800">
                   <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-crimson-50 dark:bg-crimson-900/20 flex items-center justify-center text-crimson-600 dark:text-crimson-400 font-bold text-lg shrink-0">
                         {new Date(apt.date).getDate()}
                      </div>
                      <div>
                         <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                            {currentUser.role === UserRole.PATIENT ? apt.providerName : apt.patientName}
                         </h3>
                         <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {apt.time}</span>
                            <span className="flex items-center gap-1">
                               {apt.type === 'VIDEO' ? <Video className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
                               {apt.type === 'VIDEO' ? 'Virtual Consultation' : 'In-Person Visit'}
                            </span>
                         </div>
                      </div>
                   </div>
                   
                   <div className="flex items-center gap-3">
                      {apt.status === 'PENDING' ? (
                          currentUser.role === UserRole.PROVIDER ? (
                              <div className="flex gap-2">
                                  <button onClick={() => handleConfirmation(apt.id, false)} className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold flex items-center gap-1">
                                      <XCircle className="w-4 h-4" /> Decline
                                  </button>
                                  <button onClick={() => handleConfirmation(apt.id, true)} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 text-xs font-bold flex items-center gap-1 shadow-lg">
                                      <CheckCircle2 className="w-4 h-4" /> Confirm
                                  </button>
                              </div>
                          ) : (
                              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 flex items-center gap-1">
                                  <Clock className="w-3 h-3 animate-spin" /> Pending Approval
                              </span>
                          )
                      ) : (
                          <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit ${
                              apt.status === 'SCHEDULED' 
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                             <div className={`w-1.5 h-1.5 rounded-full ${apt.status === 'SCHEDULED' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
                             {apt.status}
                          </span>
                      )}
                   </div>
                </div>
             ))
          )}
        </div>
      )}

      {/* Booking Modal */}
      {isBookModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-dark-900 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-200 dark:border-dark-700">
            <div className="p-6 border-b border-gray-100 dark:border-dark-800">
              <h2 className="text-xl font-display font-bold text-gray-900 dark:text-white">Book Appointment</h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                 <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">Provider</label>
                 <select 
                   value={selectedProvider}
                   onChange={e => setSelectedProvider(e.target.value)}
                   className="w-full bg-gray-50 dark:bg-dark-800 border border-gray-200 dark:border-dark-600 rounded-xl p-3 focus:ring-2 focus:ring-crimson-500 outline-none text-gray-900 dark:text-white appearance-none"
                 >
                   <option value="">Select a Doctor</option>
                   {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                 </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">Date</label>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-gray-50 dark:bg-dark-800 border border-gray-200 dark:border-dark-600 rounded-xl p-3 focus:ring-2 focus:ring-crimson-500 outline-none text-gray-900 dark:text-white" />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">Time</label>
                    <input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full bg-gray-50 dark:bg-dark-800 border border-gray-200 dark:border-dark-600 rounded-xl p-3 focus:ring-2 focus:ring-crimson-500 outline-none text-gray-900 dark:text-white" />
                 </div>
              </div>

              <div>
                 <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">Consultation Type</label>
                 <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setType('VIDEO')} className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-sm font-bold transition-all ${type === 'VIDEO' ? 'bg-crimson-50 dark:bg-crimson-900/20 border-crimson-500 text-crimson-700 dark:text-crimson-400' : 'border-gray-200 dark:border-dark-600 text-gray-500'}`}>
                       <Video className="w-4 h-4" /> Video
                    </button>
                    <button onClick={() => setType('IN_PERSON')} className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-sm font-bold transition-all ${type === 'IN_PERSON' ? 'bg-crimson-50 dark:bg-crimson-900/20 border-crimson-500 text-crimson-700 dark:text-crimson-400' : 'border-gray-200 dark:border-dark-600 text-gray-500'}`}>
                       <MapPin className="w-4 h-4" /> In-Person
                    </button>
                 </div>
              </div>

              <div className="flex gap-3 pt-2">
                 <button onClick={() => setIsBookModalOpen(false)} className="flex-1 py-3 font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">Cancel</button>
                 <button onClick={handleBook} disabled={booking} className="flex-[2] bg-crimson-600 hover:bg-crimson-500 text-white font-bold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2">
                    {booking ? <Loader2 className="animate-spin w-4 h-4" /> : 'Confirm Booking'}
                 </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
