
import React, { useMemo } from 'react';
import { Appointment } from '../types';
import CloseIcon from './icons/CloseIcon';
import { getTodayString } from '../utils/formatting';

interface MyDayModalProps {
  onClose: () => void;
  appointments: Appointment[];
}

const MyDayModal: React.FC<MyDayModalProps> = ({ onClose, appointments }) => {
  const { todayAppointments, tomorrowAppointments } = useMemo(() => {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    
    const todayString = getTodayString();
    const tomorrowString = `${tomorrow.getFullYear()}-${(tomorrow.getMonth() + 1).toString().padStart(2, '0')}-${tomorrow.getDate().toString().padStart(2, '0')}`;
    
    const todayApps = appointments
      .filter(app => app.date === todayString && app.status === 'scheduled')
      .sort((a, b) => a.time.localeCompare(b.time));
      
    const tomorrowApps = appointments
      .filter(app => app.date === tomorrowString && app.status === 'scheduled')
      .sort((a, b) => a.time.localeCompare(b.time));
      
    return { todayAppointments: todayApps, tomorrowAppointments: tomorrowApps };
  }, [appointments]);

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-50 transition-opacity duration-300 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full mx-4 transform transition-transform duration-300 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 pb-4 border-b">
            <h3 className="text-xl font-bold text-slate-800">Meu Dia</h3>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800">
                <CloseIcon />
            </button>
        </div>
        
        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
            <section>
                <h4 className="font-semibold text-slate-700 mb-3">Consultas de Hoje</h4>
                {todayAppointments.length > 0 ? (
                    <div className="space-y-2">
                        {todayAppointments.map(app => (
                            <div key={app.id} className="bg-slate-50 p-3 rounded-md border border-slate-200 flex justify-between items-center">
                               <div>
                                 <p className="font-semibold text-slate-700">{app.patientName}</p>
                                 <p className="text-sm text-slate-500">Horário: {app.time}</p>
                               </div>
                               <span className="bg-violet-100 text-violet-800 text-xs font-semibold px-2 py-1 rounded-full">Agendada</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-slate-500 text-center py-4">Nenhuma consulta para hoje.</p>
                )}
            </section>
            <section>
                <h4 className="font-semibold text-slate-700 mb-3">Consultas de Amanhã</h4>
                {tomorrowAppointments.length > 0 ? (
                    <div className="space-y-2">
                        {tomorrowAppointments.map(app => (
                           <div key={app.id} className="bg-slate-50 p-3 rounded-md border border-slate-200 flex justify-between items-center">
                               <div>
                                 <p className="font-semibold text-slate-700">{app.patientName}</p>
                                 <p className="text-sm text-slate-500">Horário: {app.time}</p>
                               </div>
                               <span className="bg-slate-100 text-slate-600 text-xs font-semibold px-2 py-1 rounded-full">Próximo</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-slate-500 text-center py-4">Nenhuma consulta para amanhã.</p>
                )}
            </section>
        </div>
        <div className="flex justify-end mt-6 pt-4 border-t">
          <button onClick={onClose} className="px-4 py-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700">Fechar</button>
        </div>
      </div>
    </div>
  );
};

export default MyDayModal;
