
import React, { useMemo } from 'react';
import { Appointment } from '../types';
import CloseIcon from './icons/CloseIcon';
import { getTodayString } from '../utils/formatting';

interface TodayAppointmentsModalProps {
  onClose: () => void;
  appointments: Appointment[];
}

const TodayAppointmentsModal: React.FC<TodayAppointmentsModalProps> = ({ onClose, appointments }) => {
  const todayAppointments = useMemo(() => {
    const todayString = getTodayString();
    return appointments
      .filter(app => app.date === todayString && app.status === 'scheduled')
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [appointments]);

  if (todayAppointments.length === 0) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-50 transition-opacity duration-300 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4 transform transition-transform duration-300 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-slate-800">Consultas de Hoje</h3>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800">
                <CloseIcon />
            </button>
        </div>
        
        <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
            {todayAppointments.map(app => (
                <div key={app.id} className="bg-slate-50 p-3 rounded-md border border-slate-200 flex justify-between items-center">
                    <div>
                        <p className="font-semibold text-slate-700">{app.patientName}</p>
                        <p className="text-sm text-slate-500">Horário: {app.time}</p>
                    </div>
                    <span className="bg-violet-100 text-violet-800 text-xs font-semibold px-2 py-1 rounded-full">
                        Agendada
                    </span>
                </div>
            ))}
        </div>

        <div className="flex justify-end mt-6">
          <button 
            onClick={onClose} 
            className="px-4 py-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default TodayAppointmentsModal;
