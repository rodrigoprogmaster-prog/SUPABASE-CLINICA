import React, { useState, useCallback, useEffect } from 'react';
import { View, Patient, Appointment, SessionNote, InternalObservation, Transaction, ConsultationType, NotificationLog, AuditLogEntry, ToastNotification, BlockedDay } from './types';
import Dashboard from './components/Dashboard';
import PatientManagement from './components/PatientManagement';
import AppointmentScheduler from './components/AppointmentScheduler';
import ElectronicHealthRecord from './components/ElectronicHealthRecord';
import FinancialModule from './components/FinancialModule';
import AdminModule from './components/AdminModule';
import { ManagementDashboard } from './components/ManagementDashboard';
import HeaderClock from './components/HeaderClock';
// FIX: SettingsModule is a named export, not a default export.
import { SettingsModule } from './components/SettingsModule';
import PasswordModal from './components/PasswordModal';
import useLocalStorage from './hooks/useLocalStorage';
import Login from './components/Login';
import TodayAppointmentsModal from './components/TodayAppointmentsModal';
import MyDayModal from './components/MyDayModal';
import MyDayIcon from './components/icons/MyDayIcon';
import BellIcon from './components/icons/BellIcon';
import NotificationModal from './components/NotificationModal';
import { getTodayString, getTomorrowString } from './utils/formatting';
import RecordsHistory from './components/RecordsHistory';
import Sidebar from './components/Sidebar';
import MenuIcon from './components/icons/MenuIcon';
import ErrorBoundary from './components/ErrorBoundary';
import Toast from './components/Toast';
import WelcomeModal from './components/WelcomeModal';
import BirthdayModal from './components/BirthdayModal';
import ReminderCheckModal from './components/ReminderCheckModal';
import HelpModule from './components/HelpModule';
import { api } from './services/api';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordModalTarget, setPasswordModalTarget] = useState<'settings' | null>(null);
  const [isSettingsUnlocked, setIsSettingsUnlocked] = useState(false);
  
  // Auth mantido local por enquanto
  const [isAuthenticated, setIsAuthenticated] = useLocalStorage('isAuthenticated', false);
  
  const [showTodayModal, setShowTodayModal] = useState(false);
  const [isMyDayModalOpen, setIsMyDayModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [financialFilterPatient, setFinancialFilterPatient] = useState<Patient | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [isMasterAccessSession, setIsMasterAccessSession] = useState(false);
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false);
  const [isBirthdayModalOpen, setIsBirthdayModalOpen] = useState(false);
  const [birthdayPatients, setBirthdayPatients] = useState<Patient[]>([]);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [pendingReminders, setPendingReminders] = useState<Appointment[]>([]);
  const [childModalOpen, setChildModalOpen] = useState(false);
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);
  
  const [isConsultationMode, setIsConsultationMode] = useState(false);
  const [showStartConsultationButton, setShowStartConsultationButton] = useState(true);

  // SUPABASE STATE (Replacing useLocalStorage)
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [notes, setNotes] = useState<SessionNote[]>([]);
  const [observations, setObservations] = useState<InternalObservation[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [password, setPassword] = useState<string>('2577');
  const [consultationTypes, setConsultationTypes] = useState<ConsultationType[]>([]);
  const [notificationLogs, setNotificationLogs] = useState<NotificationLog[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [blockedDays, setBlockedDays] = useState<BlockedDay[]>([]);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [signatureImage, setSignatureImage] = useState<string | null>(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Carregar dados do Supabase ao iniciar
  useEffect(() => {
    if (isAuthenticated) {
        const loadData = async () => {
            try {
                const [p, a, n, o, t, c, nl, al, bd] = await Promise.all([
                    api.patients.list(),
                    api.appointments.list(),
                    api.notes.list(),
                    api.observations.list(),
                    api.transactions.list(),
                    api.consultationTypes.list(),
                    api.notificationLogs.list(),
                    api.auditLogs.list(),
                    api.blockedDays.list()
                ]);
                
                // Configurações e senha
                const savedPwd = await api.settings.get('password');
                const savedProfile = await api.settings.get('profileImage');
                const savedSignature = await api.settings.get('signatureImage');

                setPatients(p);
                setAppointments(a);
                setNotes(n);
                setObservations(o);
                setTransactions(t);
                setConsultationTypes(c);
                setNotificationLogs(nl);
                setAuditLogs(al);
                setBlockedDays(bd);
                
                if (savedPwd) setPassword(savedPwd);
                if (savedProfile) setProfileImage(savedProfile);
                if (savedSignature) setSignatureImage(savedSignature);

                setIsDataLoaded(true);
            } catch (err) {
                console.error("Erro ao carregar dados do Supabase:", err);
                addToast("Erro de conexão ao carregar dados.", "error");
            }
        };
        loadData();
    }
  }, [isAuthenticated, addToast]);

  // Force Full Screen Logic
  useEffect(() => {
    const enterFullScreen = () => {
      const doc = document.documentElement;
      if (!document.fullscreenElement) {
        doc.requestFullscreen().catch(err => {
          console.log("Fullscreen request intercepted:", err);
        });
      }
    };
    enterFullScreen();
    const handleInteraction = () => {
      enterFullScreen();
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
    };
    document.addEventListener('click', handleInteraction);
    document.addEventListener('keydown', handleInteraction);
    document.addEventListener('touchstart', handleInteraction);
    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
    };
  }, []);

  useEffect(() => {
    const anyAppModalOpen = isWelcomeModalOpen || isBirthdayModalOpen || isReminderModalOpen || isPasswordModalOpen || showTodayModal || isMyDayModalOpen || isNotificationModalOpen;
    setIsSidebarHidden(anyAppModalOpen || childModalOpen);
  }, [isWelcomeModalOpen, isBirthdayModalOpen, isReminderModalOpen, isPasswordModalOpen, showTodayModal, isMyDayModalOpen, isNotificationModalOpen, childModalOpen]);

  useEffect(() => { setChildModalOpen(false); }, [activeView]);

  const handleChildModalStateChange = useCallback((isOpen: boolean) => {
    setChildModalOpen(isOpen);
  }, []);

  const logAction = useCallback((action: string, details: string) => {
    const newLog: AuditLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      action,
      details,
      user: 'Vanessa Gonçalves'
    };
    setAuditLogs(prev => [newLog, ...prev]);
    // Async save
    api.auditLogs.save(newLog);
  }, []);

  const handleBlockDay = async (date: string) => {
      const newBlockedDay: BlockedDay = { id: `bd-${Date.now()}`, date };
      setBlockedDays(prev => [...prev, newBlockedDay]);
      await api.blockedDays.save(newBlockedDay);
      logAction('Dia Bloqueado', `Data bloqueada na agenda: ${date}`);
  };

  const handleUnblockDay = async (date: string) => {
      const day = blockedDays.find(d => d.date === date);
      if (day) {
          setBlockedDays(prev => prev.filter(d => d.id !== day.id));
          await api.blockedDays.delete(day.id);
          logAction('Dia Desbloqueado', `Data liberada na agenda: ${date}`);
      }
  };

  const navigateTo = useCallback((view: View) => {
    setActiveView(view);
    if (view !== 'pep') {
      setSelectedPatientId(null);
      setIsConsultationMode(false); 
      setShowStartConsultationButton(true); 
    }
    if (view !== 'settings') {
        setIsSettingsUnlocked(false);
    }
    if (view !== 'financial') {
        setFinancialFilterPatient(null);
    }
  }, []);

  const handleSettingsClick = () => {
    if (isSettingsUnlocked) {
        navigateTo('settings');
    } else {
        setPasswordModalTarget('settings');
        setIsPasswordModalOpen(true);
    }
  };

  const handlePasswordSuccess = () => {
    if (passwordModalTarget === 'settings') {
      setIsSettingsUnlocked(true);
      navigateTo('settings');
    }
    setIsPasswordModalOpen(false);
    setPasswordModalTarget(null);
  };
  
  const handlePasswordModalClose = () => {
    setIsPasswordModalOpen(false);
    setPasswordModalTarget(null);
  };

  const viewPatientPEP = useCallback((patientId: string, isConsultation: boolean = false, showStartButton: boolean = true) => {
    setSelectedPatientId(patientId);
    setIsConsultationMode(isConsultation);
    setShowStartConsultationButton(showStartButton);
    setActiveView('pep');
  }, []);

  const handleViewPatientFinancials = useCallback((patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    if (patient) {
      setFinancialFilterPatient(patient);
      navigateTo('financial');
    }
  }, [patients, navigateTo]);

  // --- SEQUENTIAL MODAL LOGIC ---
  const checkTodayAppointments = useCallback(() => {
      const todayString = getTodayString();
      const todayAppointments = appointments.filter(app => app.date === todayString && app.status === 'scheduled');
      if (todayAppointments.length > 0) {
        setShowTodayModal(true);
      }
  }, [appointments]);

  const checkReminders = useCallback(() => {
      const tomorrowString = getTomorrowString();
      const pending = appointments.filter(app => 
          app.date === tomorrowString && 
          app.status === 'scheduled' && 
          !app.reminderSent
      ).sort((a, b) => a.time.localeCompare(b.time));

      if (pending.length > 0) {
          setPendingReminders(pending);
          setIsReminderModalOpen(true);
      } else {
          checkTodayAppointments();
      }
  }, [appointments, checkTodayAppointments]);

  const runBirthdayCheck = useCallback(() => {
      const today = new Date();
      const currentDay = today.getDate();
      const currentMonth = today.getMonth() + 1; 
      
      const todaysBirthdays = patients.filter(p => {
          if (!p.isActive || !p.dateOfBirth) return false;
          const parts = p.dateOfBirth.split('-');
          if (parts.length !== 3) return false;
          
          const pMonth = parseInt(parts[1], 10);
          const pDay = parseInt(parts[2], 10);
          
          return pDay === currentDay && pMonth === currentMonth;
      });

      if (todaysBirthdays.length > 0) {
          setBirthdayPatients(todaysBirthdays);
          setIsBirthdayModalOpen(true);
      } else {
          checkReminders();
      }
  }, [patients, checkReminders]);

  useEffect(() => {
      if (isDataLoaded) {
          runBirthdayCheck();
      }
  }, [isDataLoaded]);

  const handleLoginSuccess = (isMasterAccess: boolean = false) => {
    setIsAuthenticated(true);
    navigateTo('dashboard');
    
    if (isMasterAccess) {
        setIsMasterAccessSession(true);
        addToast('Acesso Mestre Iniciado.', 'info');
        // NOTA: Em ambiente real, não carregaríamos mocks no DB de produção, 
        // mas o estado local pode ser preenchido se desejado. 
        // Vamos apenas permitir o acesso ao sistema.
    } else {
        addToast('Bem-vinda de volta!', 'success');
        const isDefaultPassword = password === '2577';
        const hasNoProfileImage = !profileImage;
        if (isDefaultPassword || hasNoProfileImage) {
            setIsWelcomeModalOpen(true);
        }
        // runBirthdayCheck será chamado pelo useEffect quando isDataLoaded for true
    }
  };

  const handleCloseWelcome = () => {
      setIsWelcomeModalOpen(false);
      runBirthdayCheck(); // Proceed with other checks
  };

  const handleCloseBirthday = () => {
      setIsBirthdayModalOpen(false);
      checkReminders();
  };

  const handleCloseReminder = () => {
      setIsReminderModalOpen(false);
      checkTodayAppointments();
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setIsMasterAccessSession(false);
    setIsDataLoaded(false); // Reset load state
    addToast('Sessão encerrada com segurança.', 'info');
  };

  const handleMarkReminderSent = async (appointmentId: string) => {
      const app = appointments.find(a => a.id === appointmentId);
      if (app) {
          const updatedApp = { ...app, reminderSent: true };
          // Atualiza local
          setAppointments(prev => prev.map(a => a.id === appointmentId ? updatedApp : a));
          // Atualiza DB
          await api.appointments.save(updatedApp);
          
          setPendingReminders(prev => prev.filter(a => a.id !== appointmentId));
          
          logAction('Lembrete Enviado', `Lembrete de consulta enviado para ${app.patientName} via Modal de Verificação.`);
          const logEntry: NotificationLog = {
              id: `log${Date.now()}`,
              date: new Date().toISOString(),
              patientName: app.patientName,
              type: 'sms',
              status: 'sent',
              details: `Enviado via Verificação Diária.`
          };
          setNotificationLogs(prev => [logEntry, ...prev]);
          await api.notificationLogs.save(logEntry);
      }
  };

  const renderContent = () => {
    if (!isDataLoaded) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                <p>Sincronizando dados com a nuvem...</p>
            </div>
        );
    }

    switch (activeView) {
      case 'patients':
        return <PatientManagement 
                  onNavigate={navigateTo} 
                  onViewPEP={viewPatientPEP} 
                  onViewFinancials={handleViewPatientFinancials} 
                  patients={patients} 
                  setPatients={setPatients} 
                  appointments={appointments}
                  onLogAction={logAction}
                  onShowToast={addToast}
                  onModalStateChange={handleChildModalStateChange}
                />;
      case 'schedule':
        return <AppointmentScheduler 
                  onNavigate={navigateTo} 
                  onViewPEP={viewPatientPEP}
                  patients={patients} 
                  appointments={appointments} 
                  setAppointments={setAppointments}
                  consultationTypes={consultationTypes}
                  setTransactions={setTransactions}
                  notificationLogs={notificationLogs}
                  setNotificationLogs={setNotificationLogs}
                  blockedDays={blockedDays}
                  onBlockDay={handleBlockDay}
                  onUnblockDay={handleUnblockDay}
                  onLogAction={logAction}
                  onShowToast={addToast}
                  onModalStateChange={handleChildModalStateChange}
                />;
      case 'pep':
        return <ElectronicHealthRecord 
                onNavigate={navigateTo} 
                patientId={selectedPatientId} 
                patients={patients}
                setPatients={setPatients}
                notes={notes}
                setNotes={setNotes}
                observations={observations}
                setObservations={setObservations}
                appointments={appointments}
                setAppointments={setAppointments}
                setTransactions={setTransactions}
                isConsultationMode={isConsultationMode}
                showStartButton={showStartConsultationButton}
                onLogAction={logAction}
                onShowToast={addToast}
                signatureImage={signatureImage}
                onModalStateChange={handleChildModalStateChange}
              />;
      case 'financial':
        return <FinancialModule 
                  onNavigate={navigateTo} 
                  transactions={transactions} 
                  setTransactions={setTransactions}
                  filteredPatient={financialFilterPatient}
                  onClearPatientFilter={() => setFinancialFilterPatient(null)}
                  onLogAction={logAction}
                  onShowToast={addToast}
                  patients={patients}
                  signatureImage={signatureImage}
                  onModalStateChange={handleChildModalStateChange}
                />;
      case 'admin':
        return <AdminModule onNavigate={navigateTo} patients={patients} appointments={appointments} transactions={transactions} />;
      case 'settings':
        return <SettingsModule 
                  onNavigate={navigateTo}
                  currentPassword={password}
                  onChangePassword={async (newPass) => {
                      setPassword(newPass);
                      await api.settings.set('password', newPass);
                  }}
                  consultationTypes={consultationTypes}
                  setConsultationTypes={setConsultationTypes}
                  patients={patients}
                  appointments={appointments}
                  notes={notes}
                  observations={observations}
                  transactions={transactions}
                  setPatients={setPatients}
                  setAppointments={setAppointments}
                  setNotes={setNotes}
                  setObservations={setObservations}
                  setTransactions={setTransactions}
                  auditLogs={auditLogs}
                  setAuditLogs={setAuditLogs}
                  profileImage={profileImage}
                  setProfileImage={async (img) => {
                      setProfileImage(img);
                      await api.settings.set('profileImage', img);
                  }}
                  signatureImage={signatureImage}
                  setSignatureImage={async (img) => {
                      setSignatureImage(img);
                      await api.settings.set('signatureImage', img);
                  }}
                  onShowToast={addToast}
                  isMasterAccess={isMasterAccessSession}
                  onModalStateChange={handleChildModalStateChange}
                />;
      case 'managementDashboard':
        return <ManagementDashboard onNavigate={navigateTo} patients={patients} appointments={appointments} transactions={transactions} />;
      case 'recordsHistory':
        return <RecordsHistory 
                  onNavigate={navigateTo} 
                  notes={notes} 
                  patients={patients} 
                  onViewPEP={viewPatientPEP} 
                  appointments={appointments}
                />;
      case 'help':
        return <HelpModule onNavigate={navigateTo} />;
      case 'dashboard':
      default:
        return <Dashboard 
                  onNavigate={navigateTo} 
                  onViewPEP={viewPatientPEP} 
                  appointments={appointments} 
                  transactions={transactions}
                  patients={patients}
                  onNavigateToPatients={() => navigateTo('patients')} 
                  onModalStateChange={handleChildModalStateChange}
                />;
    }
  };

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} currentPassword={password} profileImage={profileImage} />;
  }

  return (
    <ErrorBoundary>
      <div className="flex h-screen bg-gray-50 text-slate-800 overflow-hidden">
        {isWelcomeModalOpen && (
            <WelcomeModal 
                isOpen={isWelcomeModalOpen}
                onClose={handleCloseWelcome}
                pendingTasks={{
                    passwordChanged: password !== '2577',
                    profileImageSet: !!profileImage
                }}
            />
        )}
        {isBirthdayModalOpen && (
            <BirthdayModal 
                isOpen={isBirthdayModalOpen}
                onClose={handleCloseBirthday}
                patients={birthdayPatients}
            />
        )}
        {isReminderModalOpen && (
            <ReminderCheckModal 
                isOpen={isReminderModalOpen}
                onClose={handleCloseReminder}
                appointments={pendingReminders}
                patients={patients}
                onMarkAsSent={handleMarkReminderSent}
            />
        )}

        {isPasswordModalOpen && (
          <PasswordModal 
            onClose={handlePasswordModalClose}
            onSuccess={handlePasswordSuccess}
            correctPassword={password}
            target={passwordModalTarget as 'settings' | null} 
          />
        )}
        {showTodayModal && !isWelcomeModalOpen && !isBirthdayModalOpen && !isReminderModalOpen && (
          <TodayAppointmentsModal
            appointments={appointments}
            onClose={() => setShowTodayModal(false)}
          />
        )}
        {isMyDayModalOpen && (
          <MyDayModal
            appointments={appointments}
            onClose={() => setIsMyDayModalOpen(false)}
          />
        )}
        {isNotificationModalOpen && (
          <NotificationModal 
            onClose={() => setIsNotificationModalOpen(false)}
            logs={notificationLogs}
          />
        )}

        <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 items-end pointer-events-none">
          {toasts.map(toast => (
            <Toast
              key={toast.id}
              id={toast.id}
              message={toast.message}
              type={toast.type}
              onClose={removeToast}
            />
          ))}
        </div>
        
        <Sidebar 
          activeView={activeView} 
          onNavigate={(view) => navigateTo(view)} 
          onSettingsClick={handleSettingsClick}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onLogout={handleLogout}
          profileImage={profileImage}
          isHidden={isSidebarHidden}
        />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header className={`bg-white shadow-sm z-30 border-b border-slate-200 transition-all duration-300 ${isSidebarHidden ? 'hidden' : 'block'}`}>
              <div className="flex justify-between items-center px-4 sm:px-6 py-3">
                  <div className="flex items-center gap-3">
                      <button 
                          onClick={() => setIsSidebarOpen(true)}
                          className="p-2 -ml-2 rounded-md lg:hidden text-slate-600 hover:bg-slate-100"
                      >
                          <MenuIcon />
                      </button>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-4">
                      <div className="hidden sm:block text-slate-700">
                          <HeaderClock />
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2">
                          <button 
                          onClick={() => setIsNotificationModalOpen(true)}
                          className="p-2 rounded-full text-slate-600 hover:bg-slate-100 hover:text-indigo-600 transition-colors relative"
                          aria-label="Notificações"
                          >
                          <BellIcon />
                          </button>
                          <button 
                          onClick={() => setIsMyDayModalOpen(true)}
                          className="p-2 rounded-full text-slate-600 hover:bg-slate-100 hover:text-indigo-600 transition-colors"
                          aria-label="Meu Dia"
                          >
                          <MyDayIcon />
                          </button>
                      </div>
                  </div>
              </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
              <div className="max-w-7xl mx-auto">
                  {renderContent()}
              </div>
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default App;