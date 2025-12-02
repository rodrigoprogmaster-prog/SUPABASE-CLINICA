
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Appointment, Patient, ConsultationType, BlockedDay } from '../types';
import CloseIcon from './icons/CloseIcon';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import ArrowRightIcon from './icons/ArrowRightIcon';
import LockIcon from './icons/LockIcon';
import { generateDailyTimeSlots } from '../utils/time';
import { getTodayString } from '../utils/formatting';
import { checkIsHoliday } from '../utils/holidays';

interface ScheduleAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: Patient[];
  appointments: Appointment[];
  consultationTypes: ConsultationType[];
  onSaveAppointment: (appointmentData: { patientId: string; date: string; time: string; consultationTypeId: string }) => void;
  formError: string;
  setFormError: React.Dispatch<React.SetStateAction<string>>;
  appointmentToReschedule?: Appointment | null;
  blockedDays?: BlockedDay[];
  onBlockDay?: (date: string) => Promise<void>;
  onUnblockDay?: (date: string) => Promise<void>;
}

const ChevronDownIcon = () => (
  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-500 group-hover:text-indigo-600 transition-colors">
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  </div>
);

// Elegant UI Styles
const selectClass = "appearance-none w-full p-3 pr-10 border border-slate-200 rounded-xl bg-slate-50 text-slate-700 font-medium transition-all focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none cursor-pointer hover:border-indigo-300 shadow-sm";
const inputClass = "w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-700 font-medium transition-all focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none hover:border-indigo-300 shadow-sm";

const ScheduleAppointmentModal: React.FC<ScheduleAppointmentModalProps> = ({
  isOpen,
  onClose,
  patients,
  appointments,
  consultationTypes,
  onSaveAppointment,
  formError: _ignored,
  setFormError: _setIgnored,
  appointmentToReschedule,
  blockedDays = [],
  onBlockDay,
  onUnblockDay
}) => {
  const [newAppointment, setNewAppointment] = useState({ 
    patientId: '', 
    date: '', 
    time: '', 
    consultationTypeId: '' 
  });
  
  const [errors, setErrors] = useState({
      patientId: '',
      date: '',
      time: '',
      consultationTypeId: ''
  });

  // State for calendar navigation
  const [viewDate, setViewDate] = useState(new Date());

  // Reset form when modal opens or closes
  useEffect(() => {
    if (isOpen) {
      if (appointmentToReschedule) {
        // Reschedule Mode: Pre-fill data
        setNewAppointment({
          patientId: appointmentToReschedule.patientId,
          date: '', // User must pick a NEW date
          time: appointmentToReschedule.time, // Pre-fill existing time
          consultationTypeId: appointmentToReschedule.consultationTypeId
        });
        // Start calendar view on the current appointment month or today if passed
        const originalDate = new Date(appointmentToReschedule.date);
        const today = new Date();
        // If original date is in the past, show today. If future, show original month.
        setViewDate(originalDate > today ? originalDate : today);
      } else {
        // New Appointment Mode
        setNewAppointment({ patientId: '', date: '', time: '', consultationTypeId: '' });
        setViewDate(new Date());
      }
      setErrors({ patientId: '', date: '', time: '', consultationTypeId: '' });
    }
  }, [isOpen, appointmentToReschedule]);

  const activePatients = useMemo(() => patients.filter(p => p.isActive), [patients]);

  // Generate all possible slots for a day (used for capacity check, not strict selection anymore)
  const totalDailySlots = useMemo(() => generateDailyTimeSlots(30), []);

  // Calculate availability for a specific date string (YYYY-MM-DD)
  const getDayAvailability = useCallback((dateStr: string) => {
      const appsOnDay = appointments.filter(app => app.date === dateStr && app.status === 'scheduled');
      const takenCount = appsOnDay.length;
      const totalCount = totalDailySlots.length;
      // We relax "isFull" logic since users can now type any time, but we still use it for visual cues on the calendar
      const isFull = takenCount >= (totalCount * 1.5); // Allow some flexibility over standard slots
      const isPast = dateStr < getTodayString();
      const isBlocked = blockedDays.some(bd => bd.date === dateStr);
      return { isFull, isPast, isBlocked, availableCount: Math.max(0, totalCount - takenCount) };
  }, [appointments, totalDailySlots, blockedDays]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewAppointment(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof typeof errors]) {
        setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // All validation logic removed to allow saving incomplete forms
    onSaveAppointment(newAppointment);
  };

  // Calendar Logic
  const daysInMonth = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const date = new Date(year, month, 1);
    const days = [];
    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  }, [viewDate]);

  const firstDayIndex = daysInMonth.length > 0 ? daysInMonth[0].getDay() : 0;
  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  const handlePrevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  const handleNextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));

  const handleDateSelect = (dateStr: string) => {
      const holidayName = checkIsHoliday(dateStr);
      if (holidayName) return;

      const { isPast } = getDayAvailability(dateStr);
      
      // Still prevent selecting past dates for UX sanity, but validation on submit is gone
      if (!isPast) { 
          setNewAppointment(prev => ({ ...prev, date: dateStr })); 
          if(errors.date) setErrors(prev => ({...prev, date: ''}));
      }
  };

  const handleBlockDayClick = async () => {
      if (newAppointment.date && onBlockDay) {
          await onBlockDay(newAppointment.date);
          setNewAppointment(prev => ({ ...prev, date: '' })); // Deselect to refresh view
      }
  };

  const handleUnblockDayClick = async () => {
      if (newAppointment.date && onUnblockDay) {
          await onUnblockDay(newAppointment.date);
          setNewAppointment(prev => ({ ...prev, date: '' })); // Deselect to refresh view
      }
  };

  if (!isOpen) {
    return null;
  }

  const isRescheduleMode = !!appointmentToReschedule;
  const isSelectedDateBlocked = blockedDays.some(bd => bd.date === newAppointment.date);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-50 animate-fade-in"
    >
      <div
        className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full mx-4 transform transition-transform duration-300 animate-slide-up max-h-[95vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 pb-4 border-b">
          <h3 className="text-xl font-bold text-slate-800">
            {isRescheduleMode ? 'Reagendar Consulta' : 'Agendar Nova Consulta'}
          </h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800">
            <CloseIcon />
          </button>
        </div>

        {isRescheduleMode && (
            <div className="bg-blue-50 text-blue-800 p-3 rounded-md text-sm mb-4 border border-blue-100">
                Você está alterando a data da consulta de <strong>{appointmentToReschedule.patientName}</strong>. O tipo de consulta será mantido.
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient Selection */}
          <div>
            <label htmlFor="patientId" className="block text-sm font-medium text-slate-700 mb-1">Paciente</label>
            <div className="relative group">
                <select
                id="patientId"
                name="patientId"
                value={newAppointment.patientId}
                onChange={handleInputChange}
                disabled={isRescheduleMode}
                className={`${selectClass} ${errors.patientId ? 'border-red-500' : ''} ${isRescheduleMode ? 'bg-slate-100 cursor-not-allowed text-slate-500' : ''}`}
                >
                <option value="">Selecione um paciente</option>
                {activePatients.sort((a,b) => a.name.localeCompare(b.name)).map(patient => (
                    <option key={patient.id} value={patient.id}>{patient.name}</option>
                ))}
                </select>
                <ChevronDownIcon />
            </div>
            {errors.patientId && <p className="text-red-500 text-xs mt-1">{errors.patientId}</p>}
          </div>

          {/* Intelligent Date Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Selecione a Nova Data</label>
            <div className={`border rounded-xl p-4 bg-slate-50 ${errors.date ? 'border-red-500' : 'border-slate-200'}`}>
                <div className="flex justify-between items-center mb-4">
                    <button type="button" onClick={handlePrevMonth} className="p-1 hover:bg-slate-200 rounded-full text-slate-600 hover:text-indigo-600 transition-colors"><ArrowLeftIcon /></button>
                    <span className="font-bold text-slate-700 capitalize">{monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}</span>
                    <button type="button" onClick={handleNextMonth} className="p-1 hover:bg-slate-200 rounded-full text-slate-600 hover:text-indigo-600 transition-colors"><ArrowRightIcon /></button>
                </div>
                
                <div className="grid grid-cols-7 gap-1 mb-2 text-center">
                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
                        <span key={d} className="text-xs font-semibold text-slate-400 uppercase">{d}</span>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: firstDayIndex }).map((_, i) => <div key={`empty-${i}`}></div>)}
                    {daysInMonth.map(day => {
                        const dateStr = day.toISOString().split('T')[0];
                        const holidayName = checkIsHoliday(dateStr);
                        const { isFull, isPast, isBlocked, availableCount } = getDayAvailability(dateStr);
                        const isSelected = newAppointment.date === dateStr;
                        const isToday = dateStr === getTodayString();

                        let buttonClass = "h-10 w-full rounded-xl flex flex-col items-center justify-center text-sm transition-all relative border ";
                        let titleText = "";

                        if (isBlocked) {
                            buttonClass += isSelected 
                                ? "bg-slate-600 text-white border-slate-600 shadow-md scale-105 z-10" // Selected blocked state
                                : "bg-slate-200 text-slate-500 border-transparent cursor-pointer"; // Blocked but clickable to unblock
                            titleText = "Dia Bloqueado Manualmente";
                        } else if (holidayName) {
                            buttonClass += "bg-rose-50/50 text-rose-300 border-transparent cursor-not-allowed";
                            titleText = `Feriado: ${holidayName}`;
                        } else if (isSelected) {
                            buttonClass += "bg-indigo-600 text-white border-indigo-600 shadow-md scale-105 z-10";
                            titleText = "Data Selecionada";
                        } else if (isPast) {
                            buttonClass += "bg-slate-100 text-slate-300 cursor-not-allowed border-transparent";
                            titleText = "Data Passada";
                        } else if (isFull) {
                            buttonClass += "bg-rose-50 text-rose-300 cursor-not-allowed border-transparent";
                            titleText = "Dia Lotado";
                        } else {
                            buttonClass += "bg-white text-slate-700 hover:border-indigo-300 hover:shadow-sm cursor-pointer border-slate-200";
                            if(isToday) buttonClass += " font-bold text-indigo-600 border-indigo-200";
                            titleText = `${availableCount} sugestões de horário`;
                        }

                        return (
                            <button
                                key={dateStr}
                                type="button"
                                disabled={isPast || !!holidayName}
                                onClick={() => handleDateSelect(dateStr)}
                                className={buttonClass}
                                title={titleText}
                            >
                                {isBlocked && !isSelected ? (
                                    <LockIcon className="w-3 h-3" />
                                ) : (
                                    <span>{day.getDate()}</span>
                                )}
                                
                                {!isPast && !isSelected && !holidayName && !isBlocked && (
                                    <span className="absolute bottom-1 w-1 h-1 bg-emerald-400 rounded-full"></span>
                                )}
                                {!!holidayName && (
                                    <span className="absolute -top-1 -right-1 text-[8px] leading-none">★</span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
            {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
            
            {/* Block/Unblock Actions */}
            {newAppointment.date && (
                <div className="mt-2 flex justify-end">
                    {isSelectedDateBlocked ? (
                        <button
                            type="button"
                            onClick={handleUnblockDayClick}
                            // Only allow unblocking current or future days
                            disabled={newAppointment.date < getTodayString()}
                            className="text-xs font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-full hover:bg-slate-200 transition-colors flex items-center gap-1"
                        >
                            <LockIcon className="w-3 h-3" /> Desbloquear Dia {new Date(newAppointment.date + 'T00:00:00').getDate()}
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleBlockDayClick}
                            // Only allow blocking current or future days
                            disabled={newAppointment.date < getTodayString()}
                            className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-full hover:bg-rose-100 transition-colors flex items-center gap-1"
                        >
                            <LockIcon className="w-3 h-3" /> Bloquear Dia {new Date(newAppointment.date + 'T00:00:00').getDate()}
                        </button>
                    )}
                </div>
            )}
          </div>

          {/* Time and Type Selection - Only show if date is selected and NOT blocked */}
          {newAppointment.date && !isSelectedDateBlocked && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                <div>
                    <label htmlFor="time" className="block text-sm font-medium text-slate-700 mb-1">Novo Horário</label>
                    <div className="relative">
                        <input
                            type="time"
                            id="time"
                            name="time"
                            value={newAppointment.time}
                            onChange={handleInputChange}
                            className={`${inputClass} ${errors.time ? 'border-red-500' : ''}`}
                        />
                    </div>
                    {errors.time && <p className="text-red-500 text-xs mt-1">{errors.time}</p>}
                </div>

                <div>
                    <label htmlFor="consultationTypeId" className="block text-sm font-medium text-slate-700 mb-1">Tipo de Consulta</label>
                    <div className="relative group">
                        <select
                        id="consultationTypeId"
                        name="consultationTypeId"
                        value={newAppointment.consultationTypeId}
                        onChange={handleInputChange}
                        disabled={isRescheduleMode}
                        className={`${selectClass} ${errors.consultationTypeId ? 'border-red-500' : ''} ${isRescheduleMode ? 'bg-slate-100 cursor-not-allowed text-slate-500' : ''}`}
                        >
                        <option value="">Selecione o tipo</option>
                        {consultationTypes.map(type => (
                            <option key={type.id} value={type.id}>{type.name} - {type.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</option>
                        ))}
                        </select>
                        <ChevronDownIcon />
                    </div>
                    {errors.consultationTypeId && <p className="text-red-500 text-xs mt-1">{errors.consultationTypeId}</p>}
                </div>
            </div>
          )}
          
          {newAppointment.date && isSelectedDateBlocked && (
              <div className="bg-slate-100 border border-slate-200 text-slate-600 p-4 rounded-md text-center text-sm">
                  <p className="font-semibold flex items-center justify-center gap-2">
                      <LockIcon className="w-4 h-4"/> Agenda Fechada
                  </p>
                  <p className="mt-1">Este dia foi bloqueado manualmente para novos agendamentos.</p>
              </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full bg-slate-200 text-slate-800 hover:bg-slate-300 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSelectedDateBlocked}
              className={`px-4 py-2 rounded-full text-white transition-colors ${
                  isSelectedDateBlocked 
                    ? 'bg-slate-300 cursor-not-allowed' 
                    : isRescheduleMode 
                        ? 'bg-amber-600 hover:bg-amber-700' 
                        : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {isRescheduleMode ? 'Reagendar' : 'Confirmar Agendamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScheduleAppointmentModal;
