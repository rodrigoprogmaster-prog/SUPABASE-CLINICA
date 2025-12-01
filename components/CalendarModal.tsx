
import React, { useState, useMemo, useCallback } from 'react';
import { Appointment } from '../types';
import CloseIcon from './icons/CloseIcon';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import ArrowRightIcon from './icons/ArrowRightIcon';
import { getTodayString } from '../utils/formatting';
import PlayIcon from './icons/PlayIcon';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointments: Appointment[];
  onViewPEP: (patientId: string, isConsultation?: boolean, showStartButton?: boolean) => void;
}

const CalendarModal: React.FC<CalendarModalProps> = ({ isOpen, onClose, appointments, onViewPEP }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayAppointments, setSelectedDayAppointments] = useState<Appointment[]>([]);
  const [isDayDetailsVisible, setIsDayDetailsVisible] = useState(false);

  const todayString = getTodayString();

  const getDaysInMonth = useCallback((year: number, month: number) => {
    const date = new Date(year, month, 1);
    const days = [];
    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  }, []);

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const weekdayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const daysInMonth = useMemo(() => getDaysInMonth(currentYear, currentMonth), [currentYear, currentMonth, getDaysInMonth]);

  const firstDayOfMonth = daysInMonth[0].getDay(); // 0 for Sunday, 1 for Monday, etc.

  const daysWithAppointments = useMemo(() => {
    const appDates = new Set<string>();
    appointments.forEach(app => {
      // Check valid appointments (not canceled) for the indicator
      if (app.status !== 'canceled' && new Date(app.date).getMonth() === currentMonth && new Date(app.date).getFullYear() === currentYear) {
        appDates.add(app.date);
      }
    });
    return appDates;
  }, [appointments, currentMonth, currentYear]);

  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    setIsDayDetailsVisible(false); // Hide details when switching months
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    setIsDayDetailsVisible(false);
  };

  const handleDayClick = (day: Date) => {
    const dayString = day.toISOString().split('T')[0];
    const apps = appointments
      .filter(app => app.date === dayString && app.status !== 'canceled')
      .sort((a, b) => a.time.localeCompare(b.time));
    setSelectedDayAppointments(apps);
    setIsDayDetailsVisible(true);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-50 animate-fade-in"
    >
      <div
        className="bg-white p-6 rounded-lg shadow-xl max-w-4xl w-full mx-4 transform transition-transform duration-300 animate-slide-up max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 pb-4 border-b">
          <h3 className="text-xl font-bold text-slate-800">Calendário de Consultas</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800">
            <CloseIcon />
          </button>
        </div>

        <div className="flex justify-between items-center mb-4">
          <button 
            onClick={handlePrevMonth} 
            className="p-2 rounded-full hover:bg-indigo-50 text-indigo-600 transition-colors"
            aria-label="Mês Anterior"
          >
            <ArrowLeftIcon />
          </button>
          <h4 className="text-lg font-bold text-slate-700 uppercase tracking-wide">
            {monthNames[currentMonth]} <span className="font-light text-slate-500">{currentYear}</span>
          </h4>
          <button 
            onClick={handleNextMonth} 
            className="p-2 rounded-full hover:bg-indigo-50 text-indigo-600 transition-colors"
            aria-label="Próximo Mês"
          >
            <ArrowRightIcon />
          </button>
        </div>

        {/* Calendar Grid */}
        {/* Using key to force re-render animation on month change */}
        <div key={`${currentMonth}-${currentYear}`} className="grid grid-cols-7 gap-2 text-center text-sm mb-4 animate-fade-in">
          {weekdayNames.map(name => (
            <div key={name} className="font-bold text-slate-400 py-2 text-xs uppercase tracking-wider">
              {name}
            </div>
          ))}
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} className="py-2"></div>
          ))}
          {daysInMonth.map(day => {
            const dayString = day.toISOString().split('T')[0];
            const hasAppointments = daysWithAppointments.has(dayString);
            const isToday = dayString === todayString;
            const isSelected = isDayDetailsVisible && selectedDayAppointments.length > 0 && selectedDayAppointments[0].date === dayString;

            return (
              <button
                key={dayString}
                className={`
                    relative py-3 rounded-full transition-all duration-200 flex flex-col items-center justify-center h-14 w-full
                    ${isToday 
                        ? 'bg-indigo-600 text-white shadow-md hover:bg-indigo-700' 
                        : isSelected 
                            ? 'ring-2 ring-indigo-600 bg-indigo-50 text-indigo-900' 
                            : 'text-slate-700 hover:bg-slate-100'
                    }
                `}
                onClick={() => handleDayClick(day)}
              >
                <span className={`text-sm ${isToday ? 'font-bold' : 'font-medium'}`}>{day.getDate()}</span>
                
                {/* Visual Indicator for Appointments */}
                {hasAppointments && (
                    <span className={`mt-1 h-1.5 w-1.5 rounded-full ${isToday ? 'bg-white' : 'bg-indigo-500'}`}></span>
                )}
              </button>
            );
          })}
        </div>

        {isDayDetailsVisible && (
          <div className="mt-6 border-t pt-4 animate-fade-in">
            <h5 className="text-lg font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <span className="w-1 h-6 bg-indigo-500 rounded-full block"></span>
              Consultas em {selectedDayAppointments.length > 0 ? new Date(selectedDayAppointments[0].date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' }) : '...'}
            </h5>
            <div className="max-h-60 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
              {selectedDayAppointments.length > 0 ? (
                selectedDayAppointments.map(app => (
                  <div key={app.id} className="bg-slate-50 p-4 rounded-md border border-slate-200 flex justify-between items-center hover:shadow-sm transition-shadow">
                    <div>
                      <p className="font-bold text-slate-700">{app.patientName}</p>
                      <p className="text-sm text-slate-500 flex items-center gap-1">
                        <span className="w-2 h-2 bg-emerald-400 rounded-full inline-block"></span>
                        {app.time}
                      </p>
                    </div>
                    <button 
                      onClick={() => onViewPEP(app.patientId, false, true)} 
                      className="text-xs font-semibold bg-white border border-indigo-200 text-indigo-700 px-4 py-2 rounded-full hover:bg-indigo-50 transition-colors flex items-center gap-1 shadow-sm"
                    >
                        <PlayIcon className="w-3 h-3" /> Ver PEP
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                    <p className="text-slate-500">Nenhuma consulta agendada para este dia.</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-end mt-6 pt-4 border-t border-slate-100">
          <button onClick={onClose} className="px-6 py-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm font-medium">
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default CalendarModal;
