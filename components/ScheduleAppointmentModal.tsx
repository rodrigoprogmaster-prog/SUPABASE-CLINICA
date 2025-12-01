
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Appointment, Patient, ConsultationType } from '../types';
import CloseIcon from './icons/CloseIcon';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import ArrowRightIcon from './icons/ArrowRightIcon';
import { generateDailyTimeSlots } from '../utils/time';
import { getTodayString } from '../utils/formatting';
import { checkIsHoliday } from '../utils/holidays';
import ClockIcon from './icons/CalendarIcon'; // Reusing CalendarIcon as generic time icon or similar

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
}

const ScheduleAppointmentModal: React.FC<ScheduleAppointmentModalProps> = ({
  isOpen,
  onClose,
  patients,
  appointments,
  consultationTypes,
  onSaveAppointment,
  formError: _ignored,
  setFormError: _setIgnored,
  appointmentToReschedule
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
      return { isFull, isPast, availableCount: Math.max(0, totalCount - takenCount) };
  }, [appointments, totalDailySlots]);

  // Check if the specifically typed time is already taken
  const isTimeConflict = useMemo(() => {
      if (!newAppointment.date || !newAppointment.time) return false;
      
      return appointments.some(app => 
          app.date === newAppointment.date && 
          app.time === newAppointment.time && 
          app.status === 'scheduled' &&
          // If rescheduling, exclude the appointment being moved from conflict check
          (!appointmentToReschedule || app.id !== appointmentToReschedule.id)
      );
  }, [newAppointment.date, newAppointment.time, appointments, appointmentToReschedule]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewAppointment(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof typeof errors]) {
        setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors = {
        patientId: '',
        date: '',
        time: '',
        consultationTypeId: ''
    };
    let isValid = true;

    if (!newAppointment.patientId) { newErrors.patientId = 'Selecione um paciente.'; isValid = false; }
    if (!newAppointment.date) { newErrors.date = 'Selecione uma data.'; isValid = false; }
    
    const todayStr = getTodayString();
    // Validate Date is not in the past
    if (newAppointment.date && newAppointment.date < todayStr) {
        newErrors.date = 'A data não pode ser anterior a hoje.';
        isValid = false;
    }

    if (!newAppointment.time) { 
        newErrors.time = 'Informe um horário.'; 
        isValid = false; 
    } else if (newAppointment.date === todayStr) {
        // Validate Time if date is today
        const now = new Date();
        const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();
        
        const [inputHours, inputMinutes] = newAppointment.time.split(':').map(Number);
        const inputTotalMinutes = inputHours * 60 + inputMinutes;

        if (inputTotalMinutes < currentTotalMinutes) {
            newErrors.time = 'O horário não pode ser anterior ao atual.';
            isValid = false;
        }
    }

    if (isTimeConflict) { newErrors.time = 'Horário já ocupado.'; isValid = false; }
    if (!newAppointment.consultationTypeId) { newErrors.consultationTypeId = 'Selecione um tipo.'; isValid = false; }

    setErrors(newErrors);

    if (isValid) {
        onSaveAppointment(newAppointment);
    }
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
      if (!isPast) {
          setNewAppointment(prev => ({ ...prev, date: dateStr })); 
          if(errors.date) setErrors(prev => ({...prev, date: ''}));
      }
  };

  if (!isOpen) {
    return null;
  }

  const isRescheduleMode = !!appointmentToReschedule;

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
            <select
              id="patientId"
              name="patientId"
              value={newAppointment.patientId}
              onChange={handleInputChange}
              disabled={isRescheduleMode}
              className={`w-full p-2 border rounded-md bg-white focus:ring-2 focus:ring-indigo-500 ${errors.patientId ? 'border-red-500' : 'border-slate-300'} ${isRescheduleMode ? 'bg-slate-100 cursor-not-allowed text-slate-500' : ''}`}
            >
              <option value="">Selecione um paciente</option>
              {activePatients.sort((a,b) => a.name.localeCompare(b.name)).map(patient => (
                <option key={patient.id} value={patient.id}>{patient.name}</option>
              ))}
            </select>
            {errors.patientId && <p className="text-red-500 text-xs mt-1">{errors.patientId}</p>}
          </div>

          {/* Intelligent Date Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Selecione a Nova Data</label>
            <div className={`border rounded-md p-4 bg-slate-50 ${errors.date ? 'border-red-500' : ''}`}>
                <div className="flex justify-between items-center mb-4">
                    <button type="button" onClick={handlePrevMonth} className="p-1 hover:bg-slate-200 rounded-full"><ArrowLeftIcon /></button>
                    <span className="font-bold text-slate-700 capitalize">{monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}</span>
                    <button type="button" onClick={handleNextMonth} className="p-1 hover:bg-slate-200 rounded-full"><ArrowRightIcon /></button>
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
                        const { isFull, isPast, availableCount } = getDayAvailability(dateStr);
                        const isSelected = newAppointment.date === dateStr;
                        const isToday = dateStr === getTodayString();

                        let buttonClass = "h-10 w-full rounded-full flex flex-col items-center justify-center text-sm transition-all relative border ";
                        let titleText = "";

                        if (holidayName) {
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
                                <span>{day.getDate()}</span>
                                {!isPast && !isSelected && !holidayName && (
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
          </div>

          {/* Time and Type Selection */}
          {newAppointment.date && (
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
                            className={`w-full p-2 border rounded-md bg-white focus:ring-2 focus:ring-indigo-500 ${errors.time ? 'border-red-500' : 'border-slate-300'}`}
                            required
                        />
                    </div>
                    {isTimeConflict && <p className="text-amber-600 text-xs mt-1 font-medium">⚠ Este horário já está ocupado.</p>}
                    {errors.time && <p className="text-red-500 text-xs mt-1">{errors.time}</p>}
                </div>

                <div>
                    <label htmlFor="consultationTypeId" className="block text-sm font-medium text-slate-700 mb-1">Tipo de Consulta</label>
                    <select
                    id="consultationTypeId"
                    name="consultationTypeId"
                    value={newAppointment.consultationTypeId}
                    onChange={handleInputChange}
                    disabled={isRescheduleMode}
                    className={`w-full p-2 border rounded-md bg-white focus:ring-2 focus:ring-indigo-500 ${errors.consultationTypeId ? 'border-red-500' : 'border-slate-300'} ${isRescheduleMode ? 'bg-slate-100 cursor-not-allowed text-slate-500' : ''}`}
                    required
                    >
                    <option value="">Selecione o tipo</option>
                    {consultationTypes.map(type => (
                        <option key={type.id} value={type.id}>{type.name} - {type.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</option>
                    ))}
                    </select>
                    {errors.consultationTypeId && <p className="text-red-500 text-xs mt-1">{errors.consultationTypeId}</p>}
                </div>
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
              className={`px-4 py-2 rounded-full text-white transition-colors ${isRescheduleMode ? 'bg-amber-600 hover:bg-amber-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
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
