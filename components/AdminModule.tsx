
import React, { useMemo } from 'react';
import { View, Patient, Appointment, Transaction } from '../types';
import ModuleContainer from './ModuleContainer';
import { getTodayString } from '../utils/formatting';

interface AdminModuleProps {
  onNavigate: (view: View) => void;
  patients: Patient[];
  appointments: Appointment[];
  transactions: Transaction[];
}

const AdminModule: React.FC<AdminModuleProps> = ({ onNavigate, patients, appointments, transactions }) => {

  // Today's Appointments Report
  const todaysAppointments = useMemo(() => {
    const todayString = getTodayString();
    return appointments
      .filter(app => app.date === todayString)
      .sort((a,b) => a.time.localeCompare(b.time));
  }, [appointments]);

  const scheduledToday = useMemo(() => todaysAppointments.filter(app => app.status === 'scheduled'), [todaysAppointments]);
  const completedToday = useMemo(() => todaysAppointments.filter(app => app.status === 'completed'), [todaysAppointments]);
  const canceledToday = useMemo(() => todaysAppointments.filter(app => app.status === 'canceled'), [todaysAppointments]);

  const statusClasses = { scheduled: 'bg-violet-100 text-violet-800', completed: 'bg-emerald-100 text-emerald-800', canceled: 'bg-rose-100 text-rose-800' };
  const statusLabels = { scheduled: 'Agendada', completed: 'Realizada', canceled: 'Cancelada' }


  return (
    <ModuleContainer title="Módulo Administrativo" onBack={() => onNavigate('dashboard')}>
      <div className="space-y-8">
        {/* New Section: Serviços do Dia */}
        <section>
          <h2 className="text-2xl font-bold text-slate-800 mb-4 border-b pb-2">Serviços do Dia</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border text-center">
              <h4 className="text-sm font-semibold text-violet-800">Agendadas</h4>
              <p className="text-2xl font-bold text-violet-900">{scheduledToday.length}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border text-center">
              <h4 className="text-sm font-semibold text-emerald-800">Realizadas</h4>
              <p className="text-2xl font-bold text-emerald-900">{completedToday.length}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border text-center">
              <h4 className="text-sm font-semibold text-rose-800">Canceladas</h4>
              <p className="text-2xl font-bold text-rose-900">{canceledToday.length}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-slate-700 mb-4">Detalhes das Consultas de Hoje</h3>
            <div className="max-h-60 overflow-y-auto pr-2 space-y-3">
              {todaysAppointments.length > 0 ? (
                todaysAppointments.map(app => (
                  <div key={app.id} className="bg-slate-50 p-3 rounded-md border border-slate-200 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-700">{app.patientName}</p>
                      <p className="text-sm text-slate-500">Horário: {app.time}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusClasses[app.status]}`}>
                      {statusLabels[app.status]}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 text-center py-4">Nenhuma consulta agendada para hoje.</p>
              )}
            </div>
          </div>
        </section> {/* End Serviços do Dia Section */}

      </div>
    </ModuleContainer>
  );
};

export default AdminModule;