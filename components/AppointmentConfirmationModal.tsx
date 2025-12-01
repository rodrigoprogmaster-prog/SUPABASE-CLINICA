
import React from 'react';
import { Appointment } from '../types';
import CloseIcon from './icons/CloseIcon';
import SendIcon from './icons/SendIcon';

interface AppointmentConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment;
  onSendReminder: (appointmentId: string) => void;
  isSendingReminder: boolean;
}

const AppointmentConfirmationModal: React.FC<AppointmentConfirmationModalProps> = ({
  isOpen,
  onClose,
  appointment,
  onSendReminder,
  isSendingReminder,
}) => {
  if (!isOpen) return null;

  const formattedDate = new Date(appointment.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'});

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-[55] animate-fade-in"
    >
      <div
        className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4 transform transition-transform duration-300 animate-slide-up text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-end items-center mb-2">
            <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800">
                <CloseIcon />
            </button>
        </div>
        <div className="mb-4 flex justify-center text-emerald-500">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">Consulta Agendada!</h3>
        <p className="text-slate-600 mb-6">
          A consulta de <span className="font-semibold">{appointment.patientName}</span> foi agendada para <span className="font-semibold">{formattedDate}</span> às <span className="font-semibold">{appointment.time}</span>.
        </p>
        <p className="text-slate-700 font-medium mb-6">Deseja enviar um lembrete agora?</p>

        <div className="flex justify-center gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full bg-slate-200 text-slate-800 hover:bg-slate-300 transition-colors"
            disabled={isSendingReminder}
          >
            Agora Não
          </button>
          <button
            onClick={() => onSendReminder(appointment.id)}
            className="px-4 py-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-colors flex items-center gap-2"
            disabled={isSendingReminder}
          >
            {isSendingReminder ? (
                <span className="block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
                <SendIcon />
            )}
            Enviar Lembrete
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppointmentConfirmationModal;
