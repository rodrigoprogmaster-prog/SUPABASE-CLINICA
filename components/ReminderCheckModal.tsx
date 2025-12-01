
import React, { useState } from 'react';
import { Appointment, Patient } from '../types';
import CloseIcon from './icons/CloseIcon';
import SendIcon from './icons/SendIcon';
import WhatsAppModal from './WhatsAppModal';
import { getTodayString, getTomorrowString } from '../utils/formatting';

interface ReminderCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointments: Appointment[];
  patients: Patient[];
  onMarkAsSent: (appointmentId: string) => void;
}

const ReminderCheckModal: React.FC<ReminderCheckModalProps> = ({ isOpen, onClose, appointments, patients, onMarkAsSent }) => {
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  if (!isOpen) return null;

  const handleOpenWhatsApp = (app: Appointment) => {
      setSelectedAppointment(app);
  };

  const handleWhatsAppConfirm = () => {
      if (selectedAppointment) {
          onMarkAsSent(selectedAppointment.id);
          // O modal do WhatsApp fecha automaticamente, limpamos o selecionado aqui
          setSelectedAppointment(null);
      }
  };

  const getMessage = (app: Appointment) => {
      const patient = patients.find(p => p.id === app.patientId);
      const name = patient ? patient.name : app.patientName;
      // Formata a data para DD/MM/AAAA
      const [year, month, day] = app.date.split('-');
      const formattedDate = `${day}/${month}/${year}`;
      
      const todayStr = getTodayString();
      const tomorrowStr = getTomorrowString();

      let timeContext = '';
      if (app.date === todayStr) {
          timeContext = 'hoje, ';
      } else if (app.date === tomorrowStr) {
          timeContext = 'amanhã, ';
      }
      
      return `Olá ${name}, lembrete da sua consulta agendada para ${timeContext}dia ${formattedDate} às ${app.time}. Clínica Vanessa Gonçalves.`;
  };

  const getPatientPhone = (app: Appointment) => {
      const patient = patients.find(p => p.id === app.patientId);
      return patient ? patient.phone : '';
  };

  const getPatientName = (app: Appointment) => {
       const patient = patients.find(p => p.id === app.patientId);
       return patient ? patient.name : app.patientName;
  };

  return (
    <>
        {selectedAppointment && (
            <WhatsAppModal
                isOpen={!!selectedAppointment}
                onClose={() => setSelectedAppointment(null)}
                onConfirm={handleWhatsAppConfirm}
                patientName={getPatientName(selectedAppointment)}
                phone={getPatientPhone(selectedAppointment)}
                message={getMessage(selectedAppointment)}
            />
        )}

        <div 
            className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-50 transition-opacity duration-300 animate-fade-in"
            onClick={onClose}
        >
            <div 
                className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4 transform transition-transform duration-300 animate-slide-up"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">Lembretes Pendentes</h3>
                        <p className="text-xs text-slate-500">Consultas de amanhã sem confirmação enviada.</p>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800">
                        <CloseIcon />
                    </button>
                </div>

                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                    {appointments.length > 0 ? (
                        appointments.map(app => (
                            <div key={app.id} className="bg-slate-50 p-3 rounded-md border border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3">
                                <div className="text-left w-full sm:w-auto">
                                    <p className="font-bold text-slate-700">{app.patientName}</p>
                                    <p className="text-sm text-slate-500">Amanhã às <span className="font-semibold text-indigo-600">{app.time}</span></p>
                                </div>
                                <button 
                                    onClick={() => handleOpenWhatsApp(app)}
                                    className="w-full sm:w-auto px-4 py-2 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 transition-colors text-xs font-bold flex items-center justify-center gap-2 shadow-sm whitespace-nowrap"
                                >
                                    <SendIcon /> Enviar WhatsApp
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-emerald-600 font-medium">Tudo certo!</p>
                            <p className="text-slate-500 text-sm">Todos os lembretes para amanhã já foram enviados.</p>
                        </div>
                    )}
                </div>

                <div className="flex justify-end mt-6 pt-2 border-t border-slate-100">
                    <button 
                        onClick={onClose} 
                        className="px-6 py-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-colors font-medium shadow-sm"
                    >
                        {appointments.length === 0 ? 'Fechar' : 'Lembrar Mais Tarde'}
                    </button>
                </div>
            </div>
        </div>
    </>
  );
};

export default ReminderCheckModal;
