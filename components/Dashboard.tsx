
import React, { useMemo, useState, useEffect } from 'react';
import { View, Appointment, Transaction, Patient } from '../types';
import CalendarIcon from './icons/CalendarIcon';
import ChartBarIcon from './icons/ChartBarIcon';
import PlayIcon from './icons/PlayIcon';
import { getTodayString } from '../utils/formatting';
import WidgetSkeleton from './WidgetSkeleton';
import SummaryDetailsModal from './SummaryDetailsModal';

interface DashboardProps {
  onNavigate: (view: View) => void;
  onViewPEP: (patientId: string, isConsultation?: boolean, showStartButton?: boolean) => void;
  appointments: Appointment[];
  transactions: Transaction[];
  patients: Patient[];
  onNavigateToPatients: () => void;
  onModalStateChange?: (isOpen: boolean) => void;
}

type SummaryType = 'monthlyRevenue' | 'weeklyIncome' | 'monthlyAppointments' | 'activePatients' | null;

const Dashboard: React.FC<DashboardProps> = ({ 
  onNavigate, 
  appointments, 
  transactions, 
  patients, 
  onViewPEP, 
  onNavigateToPatients,
  onModalStateChange 
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSummary, setSelectedSummary] = useState<SummaryType>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  // Update sidebar visibility based on modal state
  useEffect(() => {
    if (onModalStateChange) {
      onModalStateChange(!!selectedSummary);
    }
    return () => {
        if (onModalStateChange) onModalStateChange(false);
    };
  }, [selectedSummary, onModalStateChange]);

  // Weekly Summary Logic (Next 7 Days including Today)
  const weeklySummary = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 6);

    return appointments
      .filter(app => {
        const appDate = new Date(`${app.date}T00:00:00`);
        return appDate >= today && appDate <= nextWeek && app.status === 'scheduled';
      })
      .sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`).getTime();
        const dateB = new Date(`${b.date}T${b.time}`).getTime();
        return dateA - dateB;
      });
  }, [appointments]);

  // Admin Summary KPIs
  const adminSummary = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // 1. Faturamento do Mês (Monthly Revenue)
    const monthlyRevenue = transactions
        .filter(t => {
            const [year, month] = t.date.split('-').map(Number);
            return t.type === 'income' && (month - 1) === currentMonth && year === currentYear;
        })
        .reduce((acc, t) => acc + t.amount, 0);

    // 2. Consultas no Mês (Appointments this month)
    const monthlyAppointments = appointments.filter(app => {
        const [year, month] = app.date.split('-').map(Number);
        return (month - 1) === currentMonth && year === currentYear && app.status !== 'canceled';
    }).length;

    // 3. Ocupação da Agenda (Occupancy %)
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    let weekdays = 0;
    for (let i = 1; i <= daysInMonth; i++) {
        const d = new Date(currentYear, currentMonth, i);
        const day = d.getDay();
        if (day !== 0 && day !== 6) weekdays++;
    }
    const totalSlots = weekdays * 8;
    const occupancyRate = totalSlots > 0 ? Math.round((monthlyAppointments / totalSlots) * 100) : 0;

    // 4. Pacientes Ativos
    const activePatientsCount = patients.filter(p => p.isActive).length;

    // 5. Resumo Financeiro da Semana (Income this week)
    const today = new Date();
    today.setHours(0,0,0,0);
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); 
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + (6 - today.getDay()));
    endOfWeek.setHours(23,59,59,999);

    const weeklyIncome = transactions
        .filter(t => {
            const tDate = new Date(`${t.date}T12:00:00`);
            return t.type === 'income' && tDate >= startOfWeek && tDate <= endOfWeek;
        })
        .reduce((acc, t) => acc + t.amount, 0);

    return {
        monthlyRevenue,
        monthlyAppointments,
        occupancyRate,
        activePatientsCount,
        weeklyIncome
    };
  }, [transactions, appointments, patients]);

  // Data retrieval for modal
  const getModalData = useMemo(() => {
      if (!selectedSummary) return { data: [], title: '' };

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      switch (selectedSummary) {
          case 'monthlyRevenue':
              const revenueData = transactions
                  .filter(t => {
                      const [year, month] = t.date.split('-').map(Number);
                      return t.type === 'income' && (month - 1) === currentMonth && year === currentYear;
                  })
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
              return { data: revenueData, title: 'Detalhamento: Faturamento do Mês' };

          case 'weeklyIncome':
              const today = new Date();
              today.setHours(0,0,0,0);
              const startOfWeek = new Date(today);
              startOfWeek.setDate(today.getDate() - today.getDay()); 
              const endOfWeek = new Date(today);
              endOfWeek.setDate(today.getDate() + (6 - today.getDay()));
              endOfWeek.setHours(23,59,59,999);

              const weeklyData = transactions
                  .filter(t => {
                      const tDate = new Date(`${t.date}T12:00:00`);
                      return t.type === 'income' && tDate >= startOfWeek && tDate <= endOfWeek;
                  })
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
              return { data: weeklyData, title: 'Detalhamento: Recebimentos da Semana' };

          case 'monthlyAppointments':
              const appData = appointments
                  .filter(app => {
                      const [year, month] = app.date.split('-').map(Number);
                      return (month - 1) === currentMonth && year === currentYear && app.status !== 'canceled';
                  })
                  .sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());
              return { data: appData, title: 'Detalhamento: Consultas do Mês' };

          case 'activePatients':
              const patientData = patients
                  .filter(p => p.isActive)
                  .sort((a, b) => a.name.localeCompare(b.name));
              return { data: patientData, title: 'Detalhamento: Pacientes Ativos' };
          
          default:
              return { data: [], title: '' };
      }
  }, [selectedSummary, transactions, appointments, patients]);

  const getDateLabel = (dateStr: string) => {
    const todayStr = getTodayString();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = `${tomorrow.getFullYear()}-${(tomorrow.getMonth() + 1).toString().padStart(2, '0')}-${tomorrow.getDate().toString().padStart(2, '0')}`;

    if (dateStr === todayStr) return 'Hoje';
    if (dateStr === tomorrowStr) return 'Amanhã';
    return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' });
  };

  return (
    <div className="animate-fade-in space-y-8">
      
      {/* Details Modal */}
      <SummaryDetailsModal 
        isOpen={!!selectedSummary}
        onClose={() => setSelectedSummary(null)}
        type={selectedSummary}
        data={getModalData.data}
        title={getModalData.title}
      />

      {/* Header Section */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Painel Principal</h2>
        <p className="text-slate-500 mt-1">Bem-vinda, Vanessa Gonçalves.</p>
      </div>

      {/* Summary Widgets Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {isLoading ? (
          <>
            <WidgetSkeleton />
            <WidgetSkeleton />
          </>
        ) : (
          <>
            {/* Weekly Appointments Widget */}
            <div className="bg-white rounded-lg shadow-md border border-slate-100 overflow-hidden flex flex-col h-[300px]">
              <div className="p-4 border-b border-slate-100 bg-indigo-50 flex justify-between items-center">
                <div className="flex items-center gap-2 text-indigo-800">
                  <CalendarIcon />
                  <h3 className="font-semibold">Agenda da Semana</h3>
                </div>
                <span className="bg-white text-indigo-600 text-xs font-bold px-2 py-1 rounded-full shadow-sm">
                  {weeklySummary.length}
                </span>
              </div>
              <div className="p-4 flex-grow flex flex-col">
                {weeklySummary.length > 0 ? (
                  <ul className="space-y-3 overflow-y-auto flex-grow pr-2 custom-scrollbar">
                    {weeklySummary.slice(0, 5).map(app => {
                      const isToday = getDateLabel(app.date) === 'Hoje';
                      return (
                        <li 
                          key={app.id} 
                          className={`flex items-center justify-between text-sm group transition-all duration-200 rounded-md p-2 hover:shadow-md hover:bg-white ${
                            isToday ? 'bg-indigo-100/70 border-l-4 border-indigo-400 font-semibold' : 'border-l-4 border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <span className={`font-medium w-14 text-xs uppercase border-r border-slate-200 pr-2 shrink-0 ${isToday ? 'text-indigo-600' : 'text-slate-500'}`}>
                              {getDateLabel(app.date)}
                            </span>
                            <span className="text-slate-700 font-semibold shrink-0">{app.time}</span>
                            <button 
                              onClick={() => onViewPEP(app.patientId, false)}
                              className="text-slate-800 hover:text-indigo-600 transition-colors truncate min-w-0 text-left"
                              title={app.patientName}
                            >
                              {app.patientName}
                            </button>
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                              {/* Only show start button if it's today */}
                              {isToday && (
                                  <button 
                                  onClick={() => onViewPEP(app.patientId, true)}
                                  className="flex items-center gap-1 bg-emerald-600 text-white px-3 py-1 rounded-full hover:bg-emerald-700 transition-colors text-xs font-medium shadow-sm"
                                  title="Iniciar Agora"
                                >
                                  <PlayIcon className="w-3 h-3" />
                                  Iniciar
                                </button>
                              )}
                          </div>
                        </li>
                      );
                    })}
                    {weeklySummary.length > 5 && (
                        <li className="text-center pt-2 text-xs text-indigo-500 font-medium">
                            + {weeklySummary.length - 5} outros agendamentos
                        </li>
                    )}
                  </ul>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <p className="text-sm">Agenda livre nos próximos 7 dias.</p>
                  </div>
                )}
              </div>
              <div className="bg-slate-50 p-3 mt-auto text-center border-t border-slate-100">
                <button onClick={() => onNavigate('schedule')} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                  Ver Calendário Completo &rarr;
                </button>
              </div>
            </div>

            {/* Administrative Summary Widget */}
            <div className="bg-white rounded-lg shadow-md border border-slate-100 overflow-hidden flex flex-col h-[300px]">
              <div className="p-4 border-b border-slate-100 bg-violet-50 flex justify-between items-center">
                <div className="flex items-center gap-2 text-violet-800">
                  <ChartBarIcon />
                  <h3 className="font-semibold">Resumo Administrativo</h3>
                </div>
                <span className="text-xs font-medium text-violet-700 bg-white px-2 py-1 rounded-full shadow-sm">Atualizado</span>
              </div>
              <div className="p-5 flex-grow grid grid-cols-2 gap-4 content-center">
                  {/* 1. Faturamento do Mês */}
                  <div 
                    onClick={() => setSelectedSummary('monthlyRevenue')}
                    className="col-span-1 bg-emerald-50 rounded-lg p-3 border border-emerald-100 cursor-pointer hover:shadow-md hover:bg-emerald-100 transition-all group"
                  >
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide mb-1 flex items-center justify-between">
                        Faturamento (Mês)
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity text-emerald-400 text-xs">ver</span>
                      </p>
                      <p className="text-lg font-bold text-slate-800 truncate">
                          {adminSummary.monthlyRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </p>
                  </div>
                  
                  {/* 2. Resumo Financeiro da Semana */}
                  <div 
                    onClick={() => setSelectedSummary('weeklyIncome')}
                    className="col-span-1 bg-blue-50 rounded-lg p-3 border border-blue-100 cursor-pointer hover:shadow-md hover:bg-blue-100 transition-all group"
                  >
                      <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wide mb-1 flex items-center justify-between">
                        Recebimentos (Semana)
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-400 text-xs">ver</span>
                      </p>
                      <p className="text-lg font-bold text-slate-800 truncate">
                          {adminSummary.weeklyIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </p>
                  </div>

                  {/* 3. Consultas no Mês & 4. Ocupação */}
                  <div 
                    onClick={() => setSelectedSummary('monthlyAppointments')}
                    className="col-span-1 bg-slate-50 rounded-lg p-3 border border-slate-200 cursor-pointer hover:shadow-md hover:bg-slate-100 transition-all group"
                  >
                       <div className="flex justify-between items-end mb-1">
                           <p className="text-[10px] font-bold text-slate-500 uppercase">Consultas (Mês)</p>
                           <span className="text-sm font-bold text-slate-800">{adminSummary.monthlyAppointments}</span>
                       </div>
                       <div className="w-full bg-slate-200 rounded-full h-1.5 mb-1">
                           <div className="bg-violet-500 h-1.5 rounded-full" style={{width: `${Math.min(adminSummary.occupancyRate, 100)}%`}}></div>
                       </div>
                       <p className="text-[10px] text-slate-400 text-right flex justify-end gap-1">
                         {adminSummary.occupancyRate}% Ocupação
                         <span className="opacity-0 group-hover:opacity-100 transition-opacity text-indigo-400 text-[10px]">ver</span>
                       </p>
                  </div>

                  {/* 5. Pacientes Ativos */}
                  <div 
                    onClick={() => setSelectedSummary('activePatients')}
                    className="col-span-1 bg-indigo-50 rounded-lg p-3 border border-indigo-100 flex flex-col justify-center cursor-pointer hover:shadow-md hover:bg-indigo-100 transition-all group"
                  >
                      <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wide mb-0.5 flex items-center justify-between">
                        Pacientes Ativos
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity text-indigo-400 text-xs">ver</span>
                      </p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-indigo-900">{adminSummary.activePatientsCount}</span>
                        <span className="text-[10px] text-indigo-400">cadastrados</span>
                      </div>
                  </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
