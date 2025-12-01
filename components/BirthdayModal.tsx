
import React, { useState } from 'react';
import { Patient } from '../types';
import CloseIcon from './icons/CloseIcon';
import CakeIcon from './icons/CakeIcon';
import SendIcon from './icons/SendIcon';
import WhatsAppModal from './WhatsAppModal';

interface BirthdayModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: Patient[];
}

const BirthdayModal: React.FC<BirthdayModalProps> = ({ isOpen, onClose, patients }) => {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  
  if (!isOpen || patients.length === 0) return null;

  const getAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return 0;
    const today = new Date();
    
    // Parse YYYY-MM-DD string manually to avoid timezone issues
    const parts = dateOfBirth.split('-');
    const birthYear = parseInt(parts[0], 10);
    const birthMonth = parseInt(parts[1], 10);
    const birthDay = parseInt(parts[2], 10);

    let age = today.getFullYear() - birthYear;
    
    // Month in Date object is 0-indexed (0=Jan, 11=Dec), but our parsed month is 1-12
    const currentMonth = today.getMonth() + 1; 
    const currentDay = today.getDate();

    // If current month is before birth month, or same month but day is before birth day
    if (currentMonth < birthMonth || (currentMonth === birthMonth && currentDay < birthDay)) {
        age--;
    }
    
    return age;
  };

  const getMessage = (patient: Patient) => {
      return `${patient.name}, a Clínica Vanessa Gonçalves, deseja um feliz aniversário e muitos anos de vida, parabéns!!!`;
  };

  return (
    <>
      {selectedPatient && (
        <WhatsAppModal 
            isOpen={!!selectedPatient}
            onClose={() => setSelectedPatient(null)}
            patientName={selectedPatient.name}
            phone={selectedPatient.phone}
            message={getMessage(selectedPatient)}
        />
      )}

      <div 
        className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-[80] transition-opacity duration-300 animate-fade-in"
        onClick={onClose}
      >
        <div 
          className="bg-white p-0 rounded-lg shadow-2xl max-w-md w-full mx-4 transform transition-transform duration-300 animate-slide-up overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Festivo */}
          <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-6 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/confetti.png')]"></div>
              <div className="relative z-10 flex flex-col items-center text-white">
                  <div className="bg-white/20 p-3 rounded-full mb-3 backdrop-blur-sm border border-white/30">
                      <CakeIcon className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold">Aniversariantes do Dia!</h3>
                  <p className="text-pink-100 text-sm mt-1">Não deixe de enviar seus parabéns.</p>
              </div>
              <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors">
                  <CloseIcon />
              </button>
          </div>
          
          <div className="p-6 max-h-[60vh] overflow-y-auto">
              <div className="space-y-4">
                  {patients.map(patient => {
                      const age = getAge(patient.dateOfBirth);
                      return (
                          <div key={patient.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100 hover:shadow-md transition-shadow">
                              <div className="flex items-center gap-3">
                                  <div className="h-10 w-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-sm border border-rose-200">
                                      {age}
                                  </div>
                                  <div>
                                      <p className="font-bold text-slate-700">{patient.name}</p>
                                      <p className="text-xs text-slate-500">{new Date(patient.dateOfBirth).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</p>
                                  </div>
                              </div>
                              <button 
                                  onClick={() => setSelectedPatient(patient)}
                                  className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 p-2 rounded-full transition-colors"
                                  title="Enviar Parabéns no WhatsApp"
                              >
                                  <SendIcon />
                              </button>
                          </div>
                      );
                  })}
              </div>
          </div>

          <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-center">
            <button 
              onClick={onClose} 
              className="px-6 py-2 rounded-full bg-white border border-slate-300 text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-colors text-sm font-medium shadow-sm"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default BirthdayModal;
