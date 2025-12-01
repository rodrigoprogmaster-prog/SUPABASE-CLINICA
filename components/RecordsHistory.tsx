
import React, { useMemo, useState } from 'react';
import { View, SessionNote, Patient, Appointment } from '../types';
import ModuleContainer from './ModuleContainer';

interface RecordsHistoryProps {
  onNavigate: (view: View) => void;
  notes: SessionNote[]; // Kept for prop compatibility
  appointments: Appointment[];
  patients: Patient[];
  onViewPEP: (patientId: string, isConsultation: boolean, showStartButton?: boolean) => void;
}

const RecordsHistory: React.FC<RecordsHistoryProps> = ({ onNavigate, notes, appointments, patients, onViewPEP }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');

  const patientRecords = useMemo(() => {
    // 1. Filter ONLY completed appointments
    const completedAppointments = appointments.filter(app => app.status === 'completed');

    // 2. Create a map of patientId -> latest completed appointment date
    const latestCompletedAppointmentDateMap = new Map<string, string>();
    
    completedAppointments.forEach(app => {
        const existingDate = latestCompletedAppointmentDateMap.get(app.patientId);
        if (!existingDate || new Date(app.date) > new Date(existingDate)) {
            latestCompletedAppointmentDateMap.set(app.patientId, app.date);
        }
    });

    // 3. Map patients to records
    let records = patients
        .filter(patient => latestCompletedAppointmentDateMap.has(patient.id))
        .map(patient => ({
            patientId: patient.id,
            patientName: patient.name,
            lastCompletedAppointmentDate: latestCompletedAppointmentDateMap.get(patient.id)!
        }));

    // 4. Apply search term filter
    if (searchTerm) {
        records = records.filter(record =>
            record.patientName.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    // 5. Apply date filter
    if (filterDate) {
        const patientIdsOnDate = new Set(
            completedAppointments.filter(app => app.date === filterDate).map(app => app.patientId)
        );
        records = records.filter(record => patientIdsOnDate.has(record.patientId));
    }

    // 6. Sort by most recent
    return records.sort((a, b) => new Date(b.lastCompletedAppointmentDate).getTime() - new Date(a.lastCompletedAppointmentDate).getTime());
  }, [appointments, patients, searchTerm, filterDate]);

  return (
    <ModuleContainer title="Histórico de Consultas Finalizadas" onBack={() => onNavigate('dashboard')}>
      <p className="text-slate-500 mb-6">
        Pesquise no histórico de consultas finalizadas. Encontre um paciente por nome ou data da última consulta finalizada para acessar o prontuário completo.
      </p>
      
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Buscar por nome do paciente..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full p-2 border rounded-md bg-white border-slate-300 flex-grow"
          />
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
              className="w-full sm:w-auto p-2 border rounded-md bg-white border-slate-300"
            />
            <button
              onClick={() => { setSearchTerm(''); setFilterDate(''); }}
              className="px-4 py-2 rounded-md bg-slate-200 text-slate-800 hover:bg-slate-300"
            >
              Limpar
            </button>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-slate-600">Data da Última Consulta</th>
              <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-slate-600">Paciente</th>
              <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-slate-600">Ação</th>
            </tr>
          </thead>
          <tbody className="text-slate-700">
            {patientRecords.length > 0 ? patientRecords.map(record => (
              <tr key={record.patientId} className="border-b border-slate-200 hover:bg-slate-50">
                <td className="py-3 px-4 text-sm">
                  {new Date(record.lastCompletedAppointmentDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' })}
                </td>
                <td className="py-3 px-4 font-medium">{record.patientName}</td>
                <td className="py-3 px-4">
                  <button
                    onClick={() => onViewPEP(record.patientId, false, false)} // FORCE FALSE here
                    className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-semibold hover:bg-indigo-200"
                  >
                    Acessar PEP
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={3} className="text-center py-10 text-slate-500">
                  Nenhuma consulta finalizada encontrada para os filtros aplicados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </ModuleContainer>
  );
};

export default RecordsHistory;
