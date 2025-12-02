
import React, { useState, useEffect, useMemo } from 'react';
import { View, Appointment, Patient, ConsultationType, Transaction, NotificationLog, BlockedDay } from '../types';
import ModuleContainer from './ModuleContainer';
import SendIcon from './icons/SendIcon';
import Skeleton from './Skeleton';
import PlayIcon from './icons/PlayIcon';
import CalendarModal from './CalendarModal'; 
import ScheduleAppointmentModal from './ScheduleAppointmentModal';
import CalendarEditIcon from './icons/CalendarEditIcon';
import CalendarViewIcon from './icons/CalendarViewIcon';
import AppointmentConfirmationModal from './AppointmentConfirmationModal';
import RefreshIcon from './icons/RefreshIcon';
import WhatsAppModal from './WhatsAppModal';
import FileTextIcon from './icons/FileTextIcon';
import { getTodayString, getTomorrowString } from '../utils/formatting';
import { api } from '../services/api';

const Tooltip: React.FC<{ text: string }> = ({ text }) => (
  <span className="absolute right-0 bottom-full mb-2 w-max max-w-xs p-2 text-xs text-white bg-slate-700 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50">
    {text}
    <svg className="absolute text-slate-700 h-2 w-full left-0 top-full" x="0px" y="0px" viewBox="0 0 255 255">
      <polygon className="fill-current" points="0,0 127.5,127.5 255,0"/>
    </svg>
  </span>
);

const ChevronDownIcon = () => (
  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-500 group-hover:text-indigo-600 transition-colors">
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  </div>
);

// Elegant UI Style
const selectClass = "appearance-none w-full p-3 pr-10 border border-slate-200 rounded-xl bg-slate-50 text-slate-700 font-medium transition-all focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none cursor-pointer hover:border-indigo-300 shadow-sm";

interface AppointmentSchedulerProps {
    onNavigate: (view: View) => void;
    onViewPEP: (patientId: string, isConsultation?: boolean, showStartButton?: boolean) => void;
    patients: Patient[];
    appointments: Appointment[];
    setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
    consultationTypes: ConsultationType[];
    setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
    notificationLogs: NotificationLog[];
    setNotificationLogs: React.Dispatch<React.SetStateAction<NotificationLog[]>>;
    blockedDays: BlockedDay[];
    onBlockDay: (date: string) => Promise<void>;
    onUnblockDay: (date: string) => Promise<void>;
    onLogAction: (action: string, details: string) => void;
    onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
    onModalStateChange?: (isOpen: boolean) => void;
}

const AppointmentScheduler: React.FC<AppointmentSchedulerProps> = ({ 
    onNavigate, 
    onViewPEP,
    patients, 
    appointments, 
    setAppointments, 
    consultationTypes, 
    setTransactions, 
    notificationLogs,
    setNotificationLogs,
    blockedDays,
    onBlockDay,
    onUnblockDay,
    onLogAction,
    onShowToast,
    onModalStateChange
}) => {
  const [modalState, setModalState] = useState<{ appointment: Appointment; action: 'completed' | 'canceled' } | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isCalendarViewModalOpen, setIsCalendarViewModalOpen] = useState(false);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [newlyScheduledAppointment, setNewlyScheduledAppointment] = useState<Appointment | null>(null);
  const [formError, setFormError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSendingReminderFromConfirmation, setIsSendingReminderFromConfirmation] = useState(false);
  
  const [patientFilter, setPatientFilter] = useState<string>('');

  const [reschedulingAppointment, setReschedulingAppointment] = useState<Appointment | null>(null);
  const [pendingRescheduleData, setPendingRescheduleData] = useState<{ date: string; time: string } | null>(null);

  const [whatsappModalData, setWhatsappModalData] = useState<{ isOpen: boolean, patientName: string, phone: string, message: string, appointmentId: string } | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 200);
    return () => clearTimeout(timer);
  }, []);

  const hasOpenModal = !!modalState || isScheduleModalOpen || isCalendarViewModalOpen || isConfirmationModalOpen || !!pendingRescheduleData || (whatsappModalData && whatsappModalData.isOpen);
  useEffect(() => {
    if (onModalStateChange) {
      onModalStateChange(Boolean(hasOpenModal));
    }
    return () => {
      if (onModalStateChange) onModalStateChange(false);
    };
  }, [hasOpenModal, onModalStateChange]);

  const handleSaveAppointment = async (appointmentData: { patientId: string; date: string; time: string; consultationTypeId: string }) => {
    if (reschedulingAppointment) {
        setPendingRescheduleData({ date: appointmentData.date, time: appointmentData.time });
        setIsScheduleModalOpen(false);
    } else {
        const patient = patients.find(p => p.id === appointmentData.patientId);
        const consultationType = consultationTypes.find(ct => ct.id === appointmentData.consultationTypeId);
        
        // Provide safe defaults if fields are missing due to removed validation
        const patientName = patient ? patient.name : 'Paciente Não Identificado';
        const price = consultationType ? consultationType.price : 0;

        const appointment: Appointment = {
          id: `app${Date.now()}`,
          patientId: appointmentData.patientId,
          patientName: patientName,
          date: appointmentData.date || getTodayString(),
          time: appointmentData.time || '00:00',
          status: 'scheduled',
          consultationTypeId: appointmentData.consultationTypeId,
          price: price,
          reminderSent: false,
        };
        
        setAppointments(prev => [...prev, appointment]);
        await api.appointments.save(appointment);

        setFormError('');
        setIsScheduleModalOpen(false);

        onLogAction('Agendamento Criado', `Paciente: ${appointment.patientName}, Data: ${appointment.date}, Hora: ${appointment.time}`);
        onShowToast('Consulta agendada com sucesso!', 'success');

        setNewlyScheduledAppointment(appointment);
        setIsConfirmationModalOpen(true);
    }
  };

  const handleConfirmReschedule = async () => {
      if (reschedulingAppointment && pendingRescheduleData) {
          const oldDate = reschedulingAppointment.date;
          const oldTime = reschedulingAppointment.time;

          const updatedAppointment: Appointment = {
              ...reschedulingAppointment,
              date: pendingRescheduleData.date,
              time: pendingRescheduleData.time,
              reminderSent: false
          };

          setAppointments(prev => prev.map(app => 
              app.id === reschedulingAppointment.id ? updatedAppointment : app
          ));
          await api.appointments.save(updatedAppointment);

          onLogAction('Consulta Reagendada', `Paciente: ${reschedulingAppointment.patientName}. De: ${oldDate} ${oldTime} Para: ${pendingRescheduleData.date} ${pendingRescheduleData.time}`);
          onShowToast('Consulta reagendada com sucesso!', 'success');

          setReschedulingAppointment(null);
          setPendingRescheduleData(null);
      }
  };

  const handleCancelReschedule = () => {
      setReschedulingAppointment(null);
      setPendingRescheduleData(null);
      setIsScheduleModalOpen(false);
  };

  const initiateReschedule = (appointment: Appointment) => {
      setReschedulingAppointment(appointment);
      setIsScheduleModalOpen(true);
  };


  const handleUpdateStatus = async (id: string, status: 'completed' | 'canceled') => {
    const app = appointments.find(a => a.id === id);
    if (app) {
        const updatedApp = { ...app, status };
        setAppointments(prevAppointments =>
          prevAppointments.map(a => a.id === id ? updatedApp : a)
        );
        await api.appointments.save(updatedApp);

        const actionText = status === 'completed' ? 'Consulta Finalizada' : 'Consulta Cancelada';
        onLogAction(actionText, `Paciente: ${app.patientName}, Data: ${app.date}, Hora: ${app.time}`);
        onShowToast(actionText, 'success');
    }
  };

  const prepareWhatsAppReminder = (appointmentId: string) => {
    const appointment = appointments.find(a => a.id === appointmentId);
    if (!appointment) return;
    const patient = patients.find(p => p.id === appointment.patientId);
    if (!patient) return;

    const phoneClean = patient.phone.replace(/\D/g, '');
    const hasPhone = phoneClean.length >= 10;

    if (!hasPhone) {
        onShowToast(`Erro: Paciente ${patient.name} não possui um número de WhatsApp válido.`, 'error');
        return;
    }

    const [year, month, day] = appointment.date.split('-');
    const formattedDate = `${day}/${month}/${year}`;
    
    const todayStr = getTodayString();
    const tomorrowStr = getTomorrowString();
    
    let timeContext = '';
    if (appointment.date === todayStr) {
        timeContext = 'hoje, ';
    } else if (appointment.date === tomorrowStr) {
        timeContext = 'amanhã, ';
    }

    const message = `Olá ${patient.name}, lembrete da sua consulta agendada para ${timeContext}dia ${formattedDate} às ${appointment.time}. Clínica Vanessa Gonçalves.`;

    setWhatsappModalData({
        isOpen: true,
        patientName: patient.name,
        phone: patient.phone,
        message: message,
        appointmentId: appointmentId
    });
  };

  const handleWhatsAppClose = async () => {
      if (whatsappModalData) {
          const { appointmentId, patientName, message } = whatsappModalData;
          
          const app = appointments.find(a => a.id === appointmentId);
          if(app) {
              const updatedApp = { ...app, reminderSent: true };
              setAppointments(prev => prev.map(a => a.id === appointmentId ? updatedApp : a));
              await api.appointments.save(updatedApp);
          }

          const logEntry: NotificationLog = {
              id: `log${Date.now()}`,
              date: new Date().toISOString(),
              patientName: patientName,
              type: 'sms',
              status: 'sent',
              details: `Enviado via WhatsApp. Msg: "${message}"`
          };
          setNotificationLogs(prev => [logEntry, ...prev]);
          await api.notificationLogs.save(logEntry);
          
          setWhatsappModalData(null);
          
          if (isSendingReminderFromConfirmation) {
              setIsConfirmationModalOpen(false);
              setNewlyScheduledAppointment(null);
              setIsSendingReminderFromConfirmation(false);
          }
      }
  };

  const handleSendReminderAndCloseConfirmation = (appointmentId: string) => {
    setIsSendingReminderFromConfirmation(true);
    prepareWhatsAppReminder(appointmentId);
  };

  const handleCloseConfirmationModal = () => {
    setIsConfirmationModalOpen(false);
    setNewlyScheduledAppointment(null);
    setIsSendingReminderFromConfirmation(false);
  };


  const handleConfirmAction = async () => {
    if (modalState) {
        if (modalState.action === 'completed') {
          const newTransaction: Transaction = {
              id: `t${Date.now()}`,
              description: `Consulta - ${modalState.appointment.patientName}`,
              amount: modalState.appointment.price,
              type: 'income',
              date: modalState.appointment.date,
              patientId: modalState.appointment.patientId,
          };
          setTransactions(prev => [...prev, newTransaction]);
          await api.transactions.save(newTransaction);
          onLogAction('Transação Automática', `Gerada ao finalizar consulta de ${modalState.appointment.patientName}: R$ ${modalState.appointment.price}`);
      }
      handleUpdateStatus(modalState.appointment.id, modalState.action);
      setModalState(null);
    }
  };

  const handleCancelAction = () => { setModalState(null); };

  const statusClasses = { scheduled: 'bg-violet-100 text-violet-800', completed: 'bg-emerald-100 text-emerald-800', canceled: 'bg-rose-100 text-rose-800' };
  const statusLabels = { scheduled: 'Agendada', completed: 'Realizada', canceled: 'Cancelada' }

  const filteredAppointments = useMemo(() => {
    if (!patientFilter) return appointments;
    return appointments.filter(app => app.patientId === patientFilter);
  }, [appointments, patientFilter]);

  const scheduledAppointments = filteredAppointments.filter(a => a.status === 'scheduled').sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${a.time}`).getTime());
  const pastAppointments = filteredAppointments.filter(a => a.status === 'completed' || a.status === 'canceled').sort((a, b) => new Date(`${b.date}T${b.time}`).getTime() - new Date(`${a.date}T${a.time}`).getTime());
  
  const moduleActions = (
    <div className="flex items-center gap-3">
      <button 
        onClick={() => setIsCalendarViewModalOpen(true)} 
        className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-full hover:bg-slate-50 transition-colors text-sm font-medium shadow-sm"
      >
        <CalendarViewIcon />
        Calendário
      </button>
      <button 
        onClick={() => {
            setReschedulingAppointment(null); 
            setIsScheduleModalOpen(true);
        }} 
        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-full hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm"
      >
        <CalendarEditIcon />
        Nova Consulta
      </button>
    </div>
  );

  return (
    <ModuleContainer title="Agendamento de Consultas" onBack={() => onNavigate('dashboard')} actions={moduleActions}>
      
      {whatsappModalData && (
          <WhatsAppModal 
            isOpen={whatsappModalData.isOpen}
            onClose={handleWhatsAppClose}
            patientName={whatsappModalData.patientName}
            phone={whatsappModalData.phone}
            message={whatsappModalData.message}
          />
      )}

      <CalendarModal 
        isOpen={isCalendarViewModalOpen}
        onClose={() => setIsCalendarViewModalOpen(false)}
        appointments={appointments}
        onViewPEP={onViewPEP}
      />

      <ScheduleAppointmentModal
        isOpen={isScheduleModalOpen}
        onClose={() => {
            setIsScheduleModalOpen(false);
            setReschedulingAppointment(null);
        }}
        patients={patients}
        appointments={appointments}
        consultationTypes={consultationTypes}
        onSaveAppointment={handleSaveAppointment}
        formError={formError}
        setFormError={setFormError}
        appointmentToReschedule={reschedulingAppointment}
        blockedDays={blockedDays}
        onBlockDay={onBlockDay}
        onUnblockDay={onUnblockDay}
      />

      {pendingRescheduleData && reschedulingAppointment && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-[60] animate-fade-in">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-slate-800 mb-4">Confirmar Reagendamento</h3>
                
                <div className="bg-slate-50 p-4 rounded-md border border-slate-200 mb-6 text-sm">
                    <p className="text-slate-500 mb-1">Paciente: <span className="font-semibold text-slate-800">{reschedulingAppointment.patientName}</span></p>
                    
                    <div className="flex items-center justify-between mt-4">
                        <div className="text-center">
                            <p className="text-xs font-semibold text-rose-500 uppercase mb-1">De</p>
                            <p className="font-medium text-slate-700">{new Date(reschedulingAppointment.date).toLocaleDateString('pt-BR', {timeZone:'UTC'})}</p>
                            <p className="text-slate-600">{reschedulingAppointment.time}</p>
                        </div>
                        <div className="text-slate-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                        </div>
                        <div className="text-center">
                            <p className="text-xs font-semibold text-emerald-500 uppercase mb-1">Para</p>
                            <p className="font-medium text-slate-700">{new Date(pendingRescheduleData.date).toLocaleDateString('pt-BR', {timeZone:'UTC'})}</p>
                            <p className="text-slate-600">{pendingRescheduleData.time}</p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <button onClick={handleCancelReschedule} className="px-4 py-2 rounded-full bg-slate-200 text-slate-800 hover:bg-slate-300 transition-colors">Cancelar</button>
                    <button onClick={handleConfirmReschedule} className="px-4 py-2 rounded-full bg-amber-600 text-white hover:bg-amber-700 transition-colors shadow-sm">Sim, Confirmar</button>
                </div>
            </div>
          </div>
      )}

      {isConfirmationModalOpen && newlyScheduledAppointment && (
        <AppointmentConfirmationModal
          isOpen={isConfirmationModalOpen}
          onClose={handleCloseConfirmationModal}
          appointment={newlyScheduledAppointment}
          onSendReminder={handleSendReminderAndCloseConfirmation}
          isSendingReminder={isSendingReminderFromConfirmation}
        />
      )}

      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 mb-4 flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-grow w-full sm:w-auto">
              <label htmlFor="patientFilter" className="block text-sm font-medium text-slate-700 mb-1">
                  Filtrar por Paciente
              </label>
              <div className="relative group">
                  <select
                      id="patientFilter"
                      value={patientFilter}
                      onChange={(e) => setPatientFilter(e.target.value)}
                      className={selectClass}
                  >
                      <option value="">Mostrar Todos</option>
                      {patients
                          .sort((a, b) => a.name.localeCompare(b.name))
                          .map(patient => (
                              <option key={patient.id} value={patient.id}>
                                  {patient.name}
                              </option>
                          ))
                      }
                  </select>
                  <ChevronDownIcon />
              </div>
          </div>
          {patientFilter && (
              <button
                  onClick={() => setPatientFilter('')}
                  className="mt-6 sm:mt-0 text-sm text-indigo-600 hover:text-indigo-800 font-medium underline whitespace-nowrap"
              >
                  Limpar Filtro
              </button>
          )}
      </div>

       <div className="bg-blue-50 border-l-4 border-blue-400 text-blue-800 p-4 mb-6 rounded-md text-sm flex items-start gap-2">
            <div className="font-bold">Nota:</div>
            <div>O sistema utiliza o WhatsApp Web para envio de lembretes.</div>
      </div>

      {modalState && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-50 animate-fade-in">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-800">Confirmar Ação</h3>
            <p className="my-4 text-slate-600">
              Você tem certeza que deseja marcar a consulta de <span className="font-semibold">{modalState.appointment.patientName}</span> como
              <span className={`font-semibold ${modalState.action === 'completed' ? 'text-emerald-600' : 'text-rose-600'}`}>
                {modalState.action === 'completed' ? ' Realizada' : ' Cancelada'}
              </span>?
              {modalState.action === 'completed' && <span className="block text-sm mt-2">Isso irá gerar uma receita de <span className="font-bold">{modalState.appointment.price.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</span>.</span>}
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={handleCancelAction} className="px-4 py-2 rounded-full bg-slate-200 text-slate-800 hover:bg-slate-300 transition-colors">Voltar</button>
              <button onClick={handleConfirmAction} className={`px-4 py-2 rounded-full text-white transition-colors ${modalState.action === 'completed' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}>Sim, confirmar</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold mb-4 text-slate-700">
              {patientFilter ? `Próximas Consultas (${scheduledAppointments.length})` : 'Próximas Consultas'}
            </h3>
            <div className="space-y-4 pr-2">
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="bg-slate-50 p-4 rounded-md border border-slate-200 flex justify-between items-center">
                      <Skeleton className="h-8 w-full" />
                    </div>
                  ))
                ) : scheduledAppointments.length > 0 ? scheduledAppointments.map(app => (
                <div key={app.id} className="bg-slate-50 p-4 rounded-md border border-slate-200 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                    <div className="mb-3 sm:mb-0">
                    <p className="font-bold text-slate-800">{app.patientName}</p>
                    <p className="text-sm text-slate-500">{new Date(app.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})} às {app.time}</p>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <div className="group relative">
                        <button 
                          onClick={() => initiateReschedule(app)}
                          className="text-xs font-semibold bg-amber-100 text-amber-800 px-3 py-1.5 rounded-full hover:bg-amber-200 transition-colors flex items-center gap-1"
                          aria-label="Reagendar Consulta"
                        >
                          <RefreshIcon className="w-3.5 h-3.5" /> Reagendar
                        </button>
                        <Tooltip text="Alterar data/hora" />
                      </div>
                      
                      <button
                        onClick={() => prepareWhatsAppReminder(app.id)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors flex items-center gap-1 ${
                            app.reminderSent 
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' 
                            : 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200'
                        }`}
                        aria-label="Enviar Lembrete WhatsApp"
                      >
                          <SendIcon /> 
                          {app.reminderSent ? 'Enviado' : 'Lembrete'}
                      </button>

                      <button onClick={() => setModalState({ appointment: app, action: 'canceled' })} className="text-xs font-semibold bg-rose-100 text-rose-800 px-3 py-1.5 rounded-full hover:bg-rose-200 transition-colors">Cancelar</button>
                    </div>
                </div>
                )) : <p className="text-slate-500 text-center py-4">Nenhuma consulta agendada{patientFilter ? ' para este paciente' : ''}.</p>}
            </div>
        </div>

        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold mb-4 text-slate-700">
              {patientFilter ? 'Histórico de Consultas do Paciente' : 'Histórico de Consultas'}
            </h3>
            <div className="space-y-4 pr-2">
            {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => <div key={i}><Skeleton className="h-8 w-full" /></div>)
            ) : pastAppointments.length > 0 ? pastAppointments.map(app => (
                <div key={app.id} className="bg-slate-50 p-4 rounded-md border border-slate-200 flex flex-wrap justify-between items-center opacity-90 gap-3">
                <div>
                    <p className="font-bold text-slate-600">{app.patientName}</p>
                    <p className="text-sm text-slate-500">{new Date(app.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})} às {app.time}</p>
                </div>
                
                <div className="flex items-center gap-3">
                    {app.status !== 'canceled' && (
                      <button
                          onClick={() => onViewPEP(app.patientId, false)}
                          className="flex items-center gap-1 px-3 py-1 text-xs font-medium bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 rounded-full transition-colors shadow-sm"
                      >
                          <FileTextIcon className="w-3 h-3" />
                          Ver Prontuário
                      </button>
                    )}

                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusClasses[app.status]}`}>
                        {statusLabels[app.status]}
                    </span>
                </div>
                </div>
            )) : <p className="text-slate-500 text-center py-4">Nenhum histórico de consultas encontrado{patientFilter ? ' para este paciente' : ''}.</p>}
            </div>
        </div>
      </div>
    </ModuleContainer>
  );
};

export default AppointmentScheduler;
