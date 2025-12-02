
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { View, SessionNote, Anamnesis, InternalObservation, Patient, Appointment, Transaction } from '../types';
import ModuleContainer from './ModuleContainer';
import { getTodayString } from '../utils/formatting';
import PrintIcon from './icons/PrintIcon';
import CloseIcon from './icons/CloseIcon';
import PlayIcon from './icons/PlayIcon';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import EditIcon from './icons/EditIcon';
import FileTextIcon from './icons/FileTextIcon';
import { api } from '../services/api';

// Tooltip component for general use, not for chart
const Tooltip: React.FC<{ text: string }> = ({ text }) => (
  <span className="absolute right-0 bottom-full mb-2 w-max max-w-xs p-2 text-xs text-white bg-slate-700 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50">
    {text}
    <svg className="absolute text-slate-700 h-2 w-full left-0 top-full" x="0px" y="0px" viewBox="0 0 255 255">
      <polygon className="fill-current" points="0,0 127.5,127.5 255,0"/>
    </svg>
  </span>
);

interface ElectronicHealthRecordProps {
  onNavigate: (view: View) => void;
  patientId: string | null;
  patients: Patient[];
  setPatients: React.Dispatch<React.SetStateAction<Patient[]>>;
  notes: SessionNote[];
  setNotes: React.Dispatch<React.SetStateAction<SessionNote[]>>;
  observations: InternalObservation[];
  setObservations: React.Dispatch<React.SetStateAction<InternalObservation[]>>;
  appointments: Appointment[];
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  isConsultationMode: boolean;
  showStartButton?: boolean;
  onLogAction: (action: string, details: string) => void;
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
  signatureImage?: string | null;
  onModalStateChange?: (isOpen: boolean) => void;
}

const initialAnamnesisForm: Anamnesis = {
  civilStatus: '', hasChildren: '', numberOfChildren: '', hadAbortion: '', occupation: '', educationLevel: '',
  mothersName: '', mothersRelationship: '', fathersName: '', fathersRelationship: '', hasSiblings: '',
  numberOfSiblings: '', siblingsRelationship: '', childhoodDescription: '',
  continuousMedication: '', medicationsDetails: '', relevantMedicalDiagnosis: '',
  substanceUse_marijuana: false, substanceUse_cocaine: false, substanceUse_alcohol: false,
  substanceUse_cigarette: false, substanceUse_none: false, sleepQuality: '',
  mainSymptoms_sadness: false, mainSymptoms_depression: false, mainSymptoms_anxiety: false,
  mainSymptoms_nervousness: false, mainSymptoms_phobias: false, mainSymptoms_otherFear: '',
  anxietyLevel: '', irritabilityLevel: '', sadnessLevel: '', carriesGuilt: '', carriesInjustice: '',
  suicidalThoughts: '', suicidalThoughtsComment: '',
  hasCloseFriends: '', socialConsideration: 'expansivo(a)', physicalActivity: '', financialStatus: '', dailyRoutine: '',
  howFoundAnalysis: '', howFoundAnalysisOther: '', previousTherapy: '', previousTherapyDuration: '',
  mainReason: '', situationStart: '', triggeringEvent: '', expectationsAnalysis: '',
  generalObservations: '',
};

const ChevronDownIcon = () => (
  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-500 group-hover:text-indigo-600 transition-colors">
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  </div>
);

// Elegant UI Styles - Standardized
const selectClass = "appearance-none w-full p-3 pr-10 border border-slate-200 rounded-xl bg-slate-50 text-slate-700 font-medium transition-all focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none cursor-pointer hover:border-indigo-300 shadow-sm";
const inputClass = "w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-700 font-medium transition-all focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none placeholder-slate-400 hover:border-indigo-300 shadow-sm";
const textareaClass = "w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-700 font-medium transition-all focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none placeholder-slate-400 hover:border-indigo-300 shadow-sm resize-y";

const ElectronicHealthRecord: React.FC<ElectronicHealthRecordProps> = ({
  onNavigate,
  patientId,
  patients,
  setPatients,
  notes,
  setNotes,
  observations,
  setObservations,
  appointments,
  setAppointments,
  setTransactions,
  isConsultationMode,
  showStartButton = true,
  onLogAction,
  onShowToast,
  signatureImage,
  onModalStateChange
}) => {
  const patient = useMemo(() => patients.find(p => p.id === patientId), [patientId, patients]);
  const patientNotes = useMemo(() => notes.filter(n => n.patientId === patientId).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [notes, patientId]);
  
  const todayAppointment = useMemo(() => {
    const todayString = getTodayString();
    return appointments.find(app => app.patientId === patientId && app.date === todayString && app.status === 'scheduled');
  }, [appointments, patientId]);

  const [activeTab, setActiveTab] = useState<'anamnese' | 'prontuario' | 'evolucao'>('anamnese');
  const [newNote, setNewNote] = useState('');
  const [isAnamnesisFormVisible, setIsAnamnesisFormVisible] = useState(false);
  const [anamnesisForm, setAnamnesisForm] = useState<Anamnesis>(patient?.anamnesis || initialAnamnesisForm);
  
  const [isEvaluationModalOpen, setIsEvaluationModalOpen] = useState(false);
  const [selectedEvaluation, setSelectedEvaluation] = useState<'pessimo' | 'ruim' | 'bom' | 'otimo' | null>(null);

  const [editingNote, setEditingNote] = useState<SessionNote | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editEvaluation, setEditEvaluation] = useState<'pessimo' | 'ruim' | 'bom' | 'otimo' | null>(null);

  useEffect(() => {
    if (patient) {
      setAnamnesisForm(patient.anamnesis || initialAnamnesisForm);
      setIsAnamnesisFormVisible(false);
    }
  }, [patient]);


  const [timer, setTimer] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);

  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [isEndConsultationModalOpen, setIsEndConsultationModalOpen] = useState(false);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Pix');

  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<{name: string, amount: number, method: string, date: string} | null>(null);

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // State for chart tooltip
  const [hoveredChartPoint, setHoveredChartPoint] = useState<typeof evolutionData[0] | null>(null);
  const [tooltipCoords, setTooltipCoords] = useState<{ x: number, y: number }>({ x: 0, y: 0 });

  const hasOpenModal = isStartModalOpen || isEndConsultationModalOpen || isPaymentModalOpen || isReceiptModalOpen || isExportModalOpen || isEvaluationModalOpen || !!editingNote || !!hoveredChartPoint;
  useEffect(() => {
    if (onModalStateChange) {
      onModalStateChange(hasOpenModal);
    }
    return () => {
      if (onModalStateChange) onModalStateChange(false);
    };
  }, [hasOpenModal, onModalStateChange]);

  useEffect(() => {
    if (isConsultationMode) {
        setIsTimerActive(true);
    } else {
        setIsTimerActive(false);
        setTimer(0);
    }
  }, [isConsultationMode]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isTimerActive) {
        interval = setInterval(() => {
            setTimer((prev) => prev + 1);
        }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerActive]);

  const formatTimer = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleStartConsultation = () => {
      setIsTimerActive(true);
      setIsStartModalOpen(true);
      setTimeout(() => {
          setIsStartModalOpen(false);
      }, 2000);
  };

  const handleEndConsultation = () => {
      setIsEndConsultationModalOpen(true);
  };

  const confirmEndConsultation = () => {
      setIsTimerActive(false);
      setIsEndConsultationModalOpen(false);
      if (todayAppointment && todayAppointment.status !== 'completed') {
          setIsPaymentModalOpen(true);
      }
  };

  const isAnamnesisComplete = useMemo(() => {
    return !!patient?.anamnesis && Object.values(patient.anamnesis).some(val => val !== '' && val !== false && val !== 0);
  }, [patient?.anamnesis]);


  const hasTodayNoteSaved = useMemo(() => {
    if (!todayAppointment) return false;
    return patientNotes.some(note => note.appointmentId === todayAppointment.id);
  }, [patientNotes, todayAppointment]);

  const canFinalize = isAnamnesisComplete && hasTodayNoteSaved;

  const handleInitiateSaveNote = () => {
      if (patientId) {
          setIsEvaluationModalOpen(true);
          setSelectedEvaluation(null);
      }
  };

  const handleConfirmSaveNote = async () => {
    if (patientId) {
        const note: SessionNote = {
            id: `n${Date.now()}`,
            patientId,
            date: new Date().toISOString(),
            content: newNote,
            appointmentId: todayAppointment?.id,
            evaluation: selectedEvaluation || undefined
        };
        setNotes(prev => [note, ...prev]);
        await api.notes.save(note);

        onLogAction('Anotação de Sessão Criada', `Paciente: ${patient?.name} - Avaliação: ${selectedEvaluation || 'Sem avaliação'}`);
        onShowToast('Anotação e avaliação salvas com sucesso!', 'success');
        setNewNote('');
        setIsEvaluationModalOpen(false);
        setSelectedEvaluation(null);
    }
  };

  // Edit Note Functions
  const handleOpenEditNote = (note: SessionNote) => {
      setEditingNote(note);
      setEditContent(note.content);
      setEditEvaluation(note.evaluation || null);
  };

  const handleCloseEditNote = () => {
      setEditingNote(null);
      setEditContent('');
      setEditEvaluation(null);
  };

  const handleSaveEditedNote = async () => {
      if (editingNote) {
          const updatedNote = { ...editingNote, content: editContent, evaluation: editEvaluation || undefined };
          const updatedNotes = notes.map(n => n.id === editingNote.id ? updatedNote : n);
          
          setNotes(updatedNotes);
          await api.notes.save(updatedNote);

          onLogAction('Anotação Editada', `Paciente: ${patient?.name}, Nota ID: ${editingNote.id}`);
          onShowToast('Anotação atualizada com sucesso!', 'success');
          handleCloseEditNote();
      }
  };

  const handleAnamnesisFormChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    // Type narrowing for checkbox
    const checked = (e.target as HTMLInputElement).checked;

    setAnamnesisForm(prev => {
        let newState = { ...prev };

        if (type === 'checkbox') {
            const isSubstanceUse = name.startsWith('substanceUse_');
            
            if (isSubstanceUse) {
                if (name === 'substanceUse_none') {
                    if (checked) {
                         newState = {
                            ...newState,
                            substanceUse_marijuana: false,
                            substanceUse_cocaine: false,
                            substanceUse_alcohol: false,
                            substanceUse_cigarette: false,
                            substanceUse_none: true,
                        };
                    } else {
                         newState = { ...newState, substanceUse_none: false };
                    }
                } else {
                     newState = {
                        ...newState,
                        [name]: checked,
                        substanceUse_none: false,
                    };
                }
            } else {
                newState = { ...newState, [name]: checked };
            }
        } else if (type === 'number') {
            newState = { ...newState, [name]: value === '' ? '' : Number(value) };
        } else {
            newState = { ...newState, [name]: value };
        }
        return newState;
    });
  }, []);

  const handleSaveAnamnesis = async () => {
    if(patient) {
      const updatedPatient = {...patient, anamnesis: anamnesisForm };
      setPatients(prev => prev.map(p => p.id === patient.id ? updatedPatient : p));
      await api.patients.save(updatedPatient);

      onLogAction('Anamnese Atualizada', `Paciente: ${patient.name}`);
      onShowToast('Ficha de anamnese atualizada.', 'success');
    }
    setIsAnamnesisFormVisible(false);

    if (todayAppointment && todayAppointment.status !== 'completed' && !isTimerActive && canFinalize) {
        setIsPaymentModalOpen(true);
    }
  };

  const handleConfirmPaymentAndFinalize = async () => {
    if (todayAppointment) {
      setReceiptData({
          name: todayAppointment.patientName,
          amount: todayAppointment.price,
          method: paymentMethod,
          date: todayAppointment.date
      });

      setIsTimerActive(false);
      
      const updatedApp = { ...todayAppointment, status: 'completed' as const };
      setAppointments(prev => prev.map(app => app.id === todayAppointment.id ? updatedApp : app));
      await api.appointments.save(updatedApp);

      const newTransaction: Transaction = {
        id: `t${Date.now()}`,
        description: `Consulta - ${todayAppointment.patientName} (${paymentMethod})`,
        amount: todayAppointment.price,
        type: 'income',
        date: todayAppointment.date,
        patientId: todayAppointment.patientId,
      };
      setTransactions(prev => [...prev, newTransaction]);
      await api.transactions.save(newTransaction);

      onLogAction('Consulta Finalizada e Paga', `Paciente: ${todayAppointment.patientName}. Valor: ${todayAppointment.price}. Método: ${paymentMethod}`);
      onShowToast('Consulta finalizada com sucesso.', 'success');

      setIsPaymentModalOpen(false);
      setIsReceiptModalOpen(true);
    }
  };

  const handleGenerateReceipt = async () => {
      if (!receiptData) return;

      // Fix Fullscreen conflict
      if (document.fullscreenElement) {
        try {
            await document.exitFullscreen();
        } catch (e) {
            console.error("Error exiting fullscreen", e);
        }
      }

      setIsReceiptModalOpen(false);

      setTimeout(() => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            const todayString = new Date().toISOString().slice(0, 10);
            printWindow.document.title = `Recibo - ${receiptData.name} - ${todayString}`;
            
            const signatureContent = signatureImage 
              ? `<img src="${signatureImage}" class="sig-img" alt="Assinatura" />` 
              : `<div class="line"></div>`;

            const styles = `
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
              body { font-family: 'Inter', sans-serif; margin: 0; padding: 0; color: #444; min-height: 100vh; display: flex; justify-content: center; align-items: center; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .receipt-container { width: 80%; max-width: 700px; border: 2px solid #3730a3; padding: 40px; background-color: rgba(255, 255, 255, 0.95); }
              .header { text-align: center; border-bottom: 1px solid #ddd; padding-bottom: 20px; margin-bottom: 30px; }
              .header h1 { color: #3730a3; margin: 0; font-size: 28px; letter-spacing: 2px; }
              .content { font-size: 16px; line-height: 2; }
              .signature { margin-top: 60px; text-align: center; }
              .line { border-top: 1px solid #333; width: 60%; margin: 0 auto 10px auto; }
              .sig-img { max-height: 80px; display: block; margin: 0 auto 5px auto; max-width: 200px; }
            `;
            const reportHTML = `
              <html><head><title>Recibo</title><style>${styles}</style></head>
                  <body>
                      <div class="receipt-container">
                          <div class="header"><h1>RECIBO</h1></div>
                          <div class="content">
                              <p>Recebi de <strong>${receiptData.name}</strong></p>
                              <p>A importância de <strong>${receiptData.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></p>
                              <p>Referente a <strong>Atendimento Psicológico / Psicanálise</strong>.</p>
                              <p>Data do atendimento: ${new Date(receiptData.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</p>
                              <p>Forma de pagamento: ${receiptData.method}</p>
                          </div>
                          <div class="signature">${signatureContent}<p><strong>Vanessa Gonçalves</strong></p><p>Psicanalista Clínica</p></div>
                      </div>
                  </body>
              </html>
            `;
            printWindow.document.write(reportHTML);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
        }
      }, 100);
  };

  const handleExportPDF = async (type: 'full' | 'blank') => {
    if (!patient) return;
    
    // Fix Fullscreen conflict
    if (document.fullscreenElement) {
        try {
            await document.exitFullscreen();
        } catch (e) {
            console.error("Error exiting fullscreen", e);
        }
    }

    setIsExportModalOpen(false);
    onLogAction('Exportação de Prontuário', `Tipo: ${type === 'full' ? 'Completo' : 'Em Branco'}. Paciente: ${patient.name}`);
    onShowToast('Gerando documento...', 'info');

    setTimeout(() => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        printWindow.document.title = `Prontuário - ${patient.name} - ${type === 'full' ? 'Completo' : 'Em Branco'}`;

        const styles = `
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
            body { font-family: 'Inter', sans-serif; margin: 0; padding: 40px; color: #1f2937; -webkit-print-color-adjust: exact; print-color-adjust: exact; font-size: 14px; line-height: 1.6;}
            .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #4f46e5; padding-bottom: 20px; }
            .header h1 { margin: 0; color: #312e81; font-size: 28px; text-transform: uppercase; }
            .header p { margin: 5px 0 0; color: #6b7280; font-size: 14px; }
            .section { margin-bottom: 30px; padding-bottom: 15px; border-bottom: 1px dashed #e2e8f0; }
            .section h2 { font-size: 20px; color: #312e81; margin-bottom: 15px; border-left: 4px solid #4f46e5; padding-left: 10px; }
            .field { margin-bottom: 10px; }
            .field-label { font-weight: 600; color: #4a5568; display: block; margin-bottom: 3px; font-size: 12px; text-transform: uppercase; }
            .field-value { color: #2d3748; }
            .note { border: 1px solid #e2e8f0; border-left: 4px solid #4f46e5; padding: 15px; margin-bottom: 15px; border-radius: 4px; }
            .note-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; font-size: 13px; }
            .note-date { color: #6b7280; }
            .note-evaluation { font-weight: 600; padding: 3px 8px; border-radius: 12px; font-size: 10px; }
            .evaluation-pessimo { background-color: #ffe4e6; color: #ef4444; }
            .evaluation-ruim { background-color: #fffbeb; color: #f59e0b; }
            .evaluation-bom { background-color: #ecfdf5; color: #10b981; }
            .evaluation-otimo { background-color: #eff6ff; color: #3b82f6; }
            .signature { margin-top: 60px; text-align: center; }
            .sig-img { max-height: 80px; display: block; margin: 0 auto 5px auto; max-width: 200px; }
            .line { border-top: 1px solid #333; width: 60%; margin: 0 auto 10px auto; }
            .footer-info { text-align: center; margin-top: 40px; font-size: 10px; color: #9ca3af; }
            .no-print { display: none; }
        `;

        let patientDetailsHTML = '';
        if (type === 'full') {
            const currentAnamnesis = patient.anamnesis || initialAnamnesisForm;
            const substanceUseList = Object.entries(currentAnamnesis)
                .filter(([key, value]) => key.startsWith('substanceUse_') && value === true && key !== 'substanceUse_none')
                .map(([key]) => key.replace('substanceUse_', '')).join(', ');

            patientDetailsHTML = `
                <div class="section">
                    <h2>Dados Pessoais</h2>
                    <div class="field"><span class="field-label">Nome Completo:</span> <span class="field-value">${patient.name}</span></div>
                    <div class="field"><span class="field-label">E-mail:</span> <span class="field-value">${patient.email}</span></div>
                    <div class="field"><span class="field-label">Telefone:</span> <span class="field-value">${patient.phone}</span></div>
                    <div class="field"><span class="field-label">Nascimento:</span> <span class="field-value">${new Date(patient.dateOfBirth).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</span></div>
                    <div class="field"><span class="field-label">Endereço:</span> <span class="field-value">${patient.address}</span></div>
                    <div class="field"><span class="field-label">Profissão:</span> <span class="field-value">${patient.occupation}</span></div>
                    ${patient.emergencyContact?.name ? `<div class="field"><span class="field-label">Contato de Emergência:</span> <span class="field-value">${patient.emergencyContact.name} (${patient.emergencyContact.phone})</span></div>` : ''}
                    <div class="field"><span class="field-label">Notas Internas:</span> <span class="field-value">${patient.internalNotes || 'N/A'}</span></div>
                </div>
                <div class="section">
                    <h2>Anamnese</h2>
                    <div class="field"><span class="field-label">Estado Civil:</span> <span class="field-value">${displayFmt(currentAnamnesis.civilStatus)}</span></div>
                    <div class="field"><span class="field-label">Filhos:</span> <span class="field-value">${displayFmt(currentAnamnesis.hasChildren)} ${currentAnamnesis.hasChildren === 'sim' ? `(${currentAnamnesis.numberOfChildren})` : ''}</span></div>
                    <div class="field"><span class="field-label">Aborto:</span> <span class="field-value">${displayFmt(currentAnamnesis.hadAbortion)}</span></div>
                    <div class="field"><span class="field-label">Educação:</span> <span class="field-value">${displayFmt(currentAnamnesis.educationLevel)}</span></div>
                    
                    <h3>Histórico Familiar</h3>
                    <div class="field"><span class="field-label">Mãe:</span> <span class="field-value">${currentAnamnesis.mothersName} (Relacionamento: ${displayFmt(currentAnamnesis.mothersRelationship)})</span></div>
                    <div class="field"><span class="field-label">Pai:</span> <span class="field-value">${currentAnamnesis.fathersName} (Relacionamento: ${displayFmt(currentAnamnesis.fathersRelationship)})</span></div>
                    <div class="field"><span class="field-label">Irmãos:</span> <span class="field-value">${displayFmt(currentAnamnesis.hasSiblings)} ${currentAnamnesis.hasSiblings === 'sim' ? `(${currentAnamnesis.numberOfSiblings})` : ''} (Relacionamento: ${displayFmt(currentAnamnesis.siblingsRelationship)})</span></div>
                    <div class="field"><span class="field-label">Infância:</span> <span class="field-value">${displayFmt(currentAnamnesis.childhoodDescription)}</span></div>

                    <h3>Saúde Geral</h3>
                    <div class="field"><span class="field-label">Medicação Contínua:</span> <span class="field-value">${displayFmt(currentAnamnesis.continuousMedication)} ${currentAnamnesis.continuousMedication === 'sim' ? `(${currentAnamnesis.medicationsDetails})` : ''}</span></div>
                    <div class="field"><span class="field-label">Diagnósticos Médicos:</span> <span class="field-value">${currentAnamnesis.relevantMedicalDiagnosis || 'N/A'}</span></div>
                    <div class="field"><span class="field-label">Uso de Substâncias:</span> <span class="field-value">${substanceUseList || 'Nenhum'}</span></div>
                    <div class="field"><span class="field-label">Qualidade do Sono:</span> <span class="field-value">${displayFmt(currentAnamnesis.sleepQuality)}</span></div>

                    <h3>Aspectos Psicológicos e Emocionais</h3>
                    <div class="field"><span class="field-label">Sintomas Principais:</span> <span class="field-value">
                        ${[
                            currentAnamnesis.mainSymptoms_sadness && 'Tristeza',
                            currentAnamnesis.mainSymptoms_depression && 'Depressão',
                            currentAnamnesis.mainSymptoms_anxiety && 'Ansiedade',
                            currentAnamnesis.mainSymptoms_nervousness && 'Nervosismo',
                            currentAnamnesis.mainSymptoms_phobias && `Fobias (${currentAnamnesis.mainSymptoms_otherFear})`
                        ].filter(Boolean).join(', ') || 'Nenhum'}
                    </span></div>
                    <div class="field"><span class="field-label">Nível de Ansiedade:</span> <span class="field-value">${displayFmt(currentAnamnesis.anxietyLevel)}</span></div>
                    <div class="field"><span class="field-label">Nível de Irritabilidade:</span> <span class="field-value">${displayFmt(currentAnamnesis.irritabilityLevel)}</span></div>
                    <div class="field"><span class="field-label">Nível de Tristeza:</span> <span class="field-value">${displayFmt(currentAnamnesis.sadnessLevel)}</span></div>
                    <div class="field"><span class="field-label">Culpa:</span> <span class="field-value">${displayFmt(currentAnamnesis.carriesGuilt)}</span></div>
                    <div class="field"><span class="field-label">Injustiça:</span> <span class="field-value">${displayFmt(currentAnamnesis.carriesInjustice)}</span></div>
                    <div class="field"><span class="field-label">Pensamentos Suicidas:</span> <span class="field-value">${displayFmt(currentAnamnesis.suicidalThoughts)} ${currentAnamnesis.suicidalThoughts === 'sim' ? `(${currentAnamnesis.suicidalThoughtsComment})` : ''}</span></div>

                    <h3>Vida Social e Rotina</h3>
                    <div class="field"><span class="field-label">Amigos Próximos:</span> <span class="field-value">${displayFmt(currentAnamnesis.hasCloseFriends)}</span></div>
                    <div class="field"><span class="field-label">Consideração Social:</span> <span class="field-value">${displayFmt(currentAnamnesis.socialConsideration)}</span></div>
                    <div class="field"><span class="field-label">Atividade Física:</span> <span class="field-value">${displayFmt(currentAnamnesis.physicalActivity)}</span></div>
                    <div class="field"><span class="field-label">Status Financeiro:</span> <span class="field-value">${displayFmt(currentAnamnesis.financialStatus)}</span></div>
                    <div class="field"><span class="field-label">Rotina Diária:</span> <span class="field-value">${currentAnamnesis.dailyRoutine || 'N/A'}</span></div>

                    <h3>Buscando Ajuda</h3>
                    <div class="field"><span class="field-label">Como Encontrou:</span> <span class="field-value">${displayFmt(currentAnamnesis.howFoundAnalysis)} ${currentAnamnesis.howFoundAnalysis === 'outro' ? `(${currentAnamnesis.howFoundAnalysisOther})` : ''}</span></div>
                    <div class="field"><span class="field-label">Terapia Anterior:</span> <span class="field-value">${displayFmt(currentAnamnesis.previousTherapy)} ${currentAnamnesis.previousTherapy === 'sim' ? `(${currentAnamnesis.previousTherapyDuration})` : ''}</span></div>
                    <div class="field"><span class="field-label">Motivo Principal:</span> <span class="field-value">${currentAnamnesis.mainReason || 'N/A'}</span></div>
                    <div class="field"><span class="field-label">Início da Situação:</span> <span class="field-value">${currentAnamnesis.situationStart || 'N/A'}</span></div>
                    <div class="field"><span class="field-label">Evento Gatilho:</span> <span class="field-value">${currentAnamnesis.triggeringEvent || 'N/A'}</span></div>
                    <div class="field"><span class="field-label">Expectativas:</span> <span class="field-value">${currentAnamnesis.expectationsAnalysis || 'N/A'}</span></div>
                    <div class="field"><span class="field-label">Observações Gerais (Anamnese):</span> <span class="field-value">${currentAnamnesis.generalObservations || 'N/A'}</span></div>
                </div>

                <div class="section">
                    <h2>Notas de Sessão (Prontuário)</h2>
                    ${patientNotes.length > 0 ? patientNotes.map(note => `
                        <div class="note">
                            <div class="note-header">
                                <span class="note-date">${new Date(note.date).toLocaleDateString('pt-BR')} ${new Date(note.date).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</span>
                                ${note.evaluation ? `<span class="note-evaluation evaluation-${note.evaluation}">${getEvaluationLabel(note.evaluation).label}</span>` : ''}
                            </div>
                            <p>${note.content}</p>
                        </div>
                    `).join('') : '<p>Nenhuma anotação de sessão.</p>'}
                </div>
            `;
        } else { // Blank record
             patientDetailsHTML = `
                <div class="section">
                    <h2>Dados de Identificação</h2>
                    <div class="field"><span class="field-label">Nome Completo:</span> <span class="field-value">${patient.name}</span></div>
                    <div class="field"><span class="field-label">Data de Nascimento:</span> <span class="field-value">${new Date(patient.dateOfBirth).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</span></div>
                    <div class="field"><span class="field-label">Profissão:</span> <span class="field-value">${patient.occupation}</span></div>
                    <div class="field"><span class="field-label">Telefone:</span> <span class="field-value">${patient.phone}</span></div>
                </div>
                <div class="section">
                    <h2>Histórico Clínico (Espaço para Preenchimento)</h2>
                    <div style="min-height: 200px; border: 1px dashed #ccc; margin-top: 10px; padding: 10px;"></div>
                </div>
                <div class="section">
                    <h2>Anotações de Sessão (Espaço para Preenchimento)</h2>
                    <div style="min-height: 300px; border: 1px dashed #ccc; margin-top: 10px; padding: 10px;"></div>
                </div>
             `;
        }

        const signatureContent = signatureImage 
            ? `<img src="${signatureImage}" class="sig-img" alt="Assinatura" />` 
            : `<div class="line"></div>`;

        const reportHTML = `
            <html>
                <head>
                    <title>${printWindow.document.title}</title>
                    <style>${styles}</style>
                </head>
                <body>
                    <div class="header">
                        <h1>Prontuário Clínico</h1>
                        <p>Paciente: ${patient.name} • Gerado em ${new Date().toLocaleDateString('pt-BR')}</p>
                    </div>
                    ${patientDetailsHTML}
                    <div class="signature">
                        ${signatureContent}
                        <p><strong>Vanessa Gonçalves</strong></p>
                        <p>Psicanalista Clínica</p>
                    </div>
                    <div class="footer-info">Documento gerado pelo Sistema de Gestão Clínica.</div>
                </body>
            </html>
        `;

        printWindow.document.write(reportHTML);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
    }, 100);
  };

  const getEvaluationLabel = (evaluation: 'pessimo' | 'ruim' | 'bom' | 'otimo') => {
      switch(evaluation) {
          case 'pessimo': return { label: 'Péssimo', color: 'bg-rose-100 text-rose-800 border-rose-200', value: 1, chartColor: '#e11d48' };
          case 'ruim': return { label: 'Ruim', color: 'bg-amber-100 text-amber-800 border-amber-200', value: 2, chartColor: '#f59e0b' };
          case 'bom': return { label: 'Bom', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', value: 3, chartColor: '#10b981' };
          case 'otimo': return { label: 'Ótimo', color: 'bg-blue-100 text-blue-800 border-blue-200', value: 4, chartColor: '#3b82f6' };
          default: return { label: '', color: '', value: 0, chartColor: '#cbd5e1' };
      }
  };

  const evolutionData = useMemo(() => {
      const sortedNotes = [...patientNotes].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      const points = sortedNotes
        .filter(n => n.evaluation)
        .map(n => {
            const evalData = getEvaluationLabel(n.evaluation!);
            return {
                id: n.id,
                date: n.date,
                dateLabel: new Date(n.date).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'}),
                value: evalData.value,
                label: evalData.label,
                color: evalData.chartColor,
                content: n.content
            };
        });
      return points;
  }, [patientNotes]);

  const moduleActions = (
    <div className="flex items-center gap-4">
        {isTimerActive ? (
            <div className="flex items-center gap-3 bg-slate-900 border-l-4 border-emerald-500 shadow-lg px-5 py-3 rounded animate-fade-in mr-4">
                <div className="flex relative">
                    <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </div>
                <div className="flex flex-col items-start">
                    <span className="text-[10px] font-bold uppercase text-emerald-400 leading-none tracking-wider mb-1">Em Atendimento</span>
                    <span className="font-mono text-xl font-bold text-white leading-none tracking-widest">{formatTimer(timer)}</span>
                </div>
                {todayAppointment && todayAppointment.status !== 'completed' && (
                    <button
                        onClick={handleEndConsultation}
                        className="ml-4 px-3 py-1 bg-rose-600 text-white rounded-full text-xs font-medium hover:bg-rose-700 transition-colors"
                    >
                        Encerrar
                    </button>
                )}
            </div>
        ) : (
            showStartButton && todayAppointment && todayAppointment.status !== 'completed' && !isPaymentModalOpen && !isStartModalOpen && (
              <button
                  onClick={handleStartConsultation}
                  className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-full hover:bg-emerald-700 transition-colors font-semibold shadow-sm mr-2"
                  aria-label="Iniciar Consulta"
              >
                  <PlayIcon className="w-4 h-4" />
                  Iniciar Consulta
              </button>
            )
        )}
        
        <button
            onClick={() => setIsExportModalOpen(true)} // Re-using existing modal for simplicity in this diff
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-full hover:bg-slate-50 transition-colors text-sm font-medium shadow-sm"
        >
            <PrintIcon />
            Imprimir
        </button>
    </div>
  );

  const displayFmt = (val: string | number | undefined | null | boolean) => {
      if (val === undefined || val === null || val === '') return '-';
      if (typeof val === 'boolean') return val ? 'Sim' : 'Não';
      return String(val).charAt(0).toUpperCase() + String(val).slice(1).replace(/_/g, ' '); // Replace underscores for display
  };

  if (!patient) {
    return (
      <ModuleContainer title="Prontuário Eletrônico" onBack={() => onNavigate('patients')}>
        <div className="text-center p-8">
          <p className="text-slate-500">Paciente não encontrado ou não selecionado.</p>
          <button onClick={() => onNavigate('patients')} className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-full hover:bg-indigo-700">
            Voltar para Pacientes
          </button>
        </div>
      </ModuleContainer>
    );
  }
  
  // Max value for the evolution chart to scale
  const maxEvaluationValue = 4; // 'otimo' corresponds to 4
  const chartHeight = 150; // pixels (increased for better visual)
  const xInterval = 80; // pixels per data point on X axis

  const chartWidth = evolutionData.length * xInterval; // Dynamic width for SVG viewBox

  return (
    <ModuleContainer title={`PEP de ${patient.name}`} onBack={() => onNavigate('patients')} actions={moduleActions}>
      {/* ... Modals (Start, End, Evaluation, Edit, Receipt, Payment, Export) ... */}
      {/* Start Consultation Modal - already mostly there */}
      {isStartModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-[90] animate-fade-in">
            <div className="bg-white p-8 rounded-lg shadow-xl text-center animate-slide-up transform max-w-sm mx-4">
                <div className="mb-4 flex justify-center text-emerald-500">
                     <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-slate-800">Consulta Iniciada</h2>
                <p className="text-slate-600 mt-2">O cronômetro foi iniciado.</p>
            </div>
          </div>
      )}

      {/* Evaluation Modal - already mostly there */}
      {isEvaluationModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-[100] animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4 text-center animate-slide-up" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Avaliação da Sessão</h3>
                <p className="text-slate-600 mb-6">Como você avalia a evolução do paciente nesta sessão?</p>
                <div className="grid grid-cols-2 gap-3 mb-8">
                    {['pessimo', 'ruim', 'bom', 'otimo'].map((evalKey) => (
                        <button 
                            key={evalKey}
                            onClick={() => setSelectedEvaluation(evalKey as any)}
                            className={`p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${selectedEvaluation === evalKey ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'}`}
                            aria-label={`Avaliar como ${evalKey}`}
                        >
                            <span className="font-semibold text-sm text-slate-700 capitalize">{evalKey}</span>
                        </button>
                    ))}
                </div>
                <div className="flex justify-center gap-3">
                    <button onClick={() => setIsEvaluationModalOpen(false)} className="px-6 py-2 rounded-full bg-slate-200 text-slate-800 hover:bg-slate-300 transition-colors">Cancelar</button>
                    <button onClick={handleConfirmSaveNote} className="px-6 py-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-colors">OK</button>
                </div>
            </div>
        </div>
      )}

      {/* Edit Note Modal - restoring full content */}
      {editingNote && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-[100] animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full mx-4 animate-slide-up" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-slate-800">Editar Anotação</h3>
                    <button onClick={handleCloseEditNote} className="p-1 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800" aria-label="Fechar"><CloseIcon /></button>
                </div>
                <div className="space-y-4">
                    <textarea 
                        value={editContent} 
                        onChange={(e) => setEditContent(e.target.value)} 
                        className={textareaClass}
                        placeholder="Edite sua anotação aqui..."
                    ></textarea>
                     <div>
                        <label htmlFor="editEvaluation" className="block text-sm font-medium text-slate-700 mb-1">Avaliação da Sessão</label>
                        <div className="relative group">
                            <select
                                id="editEvaluation"
                                name="editEvaluation"
                                value={editEvaluation || ''}
                                onChange={(e) => setEditEvaluation(e.target.value as any)}
                                className={selectClass}
                            >
                                <option value="">Sem avaliação</option>
                                <option value="pessimo">Péssimo</option>
                                <option value="ruim">Ruim</option>
                                <option value="bom">Bom</option>
                                <option value="otimo">Ótimo</option>
                            </select>
                            <ChevronDownIcon />
                        </div>
                    </div>
                </div>
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                    <button onClick={handleCloseEditNote} className="px-4 py-2 rounded-full bg-slate-200 text-slate-800 hover:bg-slate-300 transition-colors">Cancelar</button>
                    <button onClick={handleSaveEditedNote} className="px-6 py-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-colors">Salvar Alterações</button>
                </div>
            </div>
        </div>
      )}

      {/* End Consultation Modal - restoring full content */}
      {isEndConsultationModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-[90] animate-fade-in">
             <div className="bg-white p-8 rounded-lg shadow-xl text-center animate-slide-up transform max-w-sm mx-4">
                <div className="mb-4 flex justify-center text-rose-500">
                   <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                   </svg>
                </div>
                <h2 className="text-2xl font-bold text-slate-800">Atendimento Encerrado?</h2>
                <p className="text-slate-600 mt-2 mb-6">Confirme para encerrar o cronômetro. Se houver pendências de pagamento, o sistema irá direcionar.</p>
                <div className="flex justify-center gap-3">
                    <button onClick={() => setIsEndConsultationModalOpen(false)} className="px-6 py-3 rounded-full bg-slate-200 text-slate-800 hover:bg-slate-300 transition-colors">Cancelar</button>
                    <button onClick={confirmEndConsultation} className="px-6 py-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors">Confirmar Encerrar</button>
                </div>
             </div>
          </div>
      )}

      {/* Payment Modal - restoring full content */}
      {isPaymentModalOpen && todayAppointment && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-[70] animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
               <h3 className="text-xl font-bold text-slate-800 mb-4">Registrar Pagamento</h3>
               <p className="text-slate-600 mb-4">
                   Valor da consulta: <span className="font-bold text-emerald-600">
                       {todayAppointment.price.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}
                   </span>
               </p>
               <div className="space-y-4">
                   <div>
                       <label htmlFor="paymentMethod" className="block text-sm font-medium text-slate-700 mb-1">Forma de Pagamento</label>
                       <div className="relative group">
                           <select
                               id="paymentMethod"
                               value={paymentMethod}
                               onChange={(e) => setPaymentMethod(e.target.value)}
                               className={selectClass}
                           >
                               <option value="Pix">Pix</option>
                               <option value="Dinheiro">Dinheiro</option>
                               <option value="Débito">Débito</option>
                               <option value="Crédito">Crédito</option>
                               <option value="Transferência">Transferência Bancária</option>
                           </select>
                           <ChevronDownIcon />
                       </div>
                   </div>
               </div>
               <div className="flex justify-end gap-3 pt-4 border-t mt-6 border-slate-100">
                   <button onClick={() => setIsPaymentModalOpen(false)} className="px-4 py-2 rounded-full bg-slate-200 text-slate-800 hover:bg-slate-300 transition-colors">Cancelar</button>
                   <button onClick={handleConfirmPaymentAndFinalize} className="px-4 py-2 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">Confirmar Pagamento</button>
               </div>
            </div>
          </div>
      )}

      {/* Receipt Modal - restoring full content */}
      {isReceiptModalOpen && receiptData && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-[80] animate-fade-in">
             <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full mx-4 text-center animate-slide-up">
                <div className="mb-4 flex justify-center text-blue-500">
                    <PrintIcon />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Pagamento Registrado!</h3>
                <p className="text-slate-600 mb-6">Gostaria de emitir um recibo agora?</p>
                <div className="flex justify-center gap-3">
                    <button onClick={() => setIsReceiptModalOpen(false)} className="px-4 py-2 rounded-full bg-slate-200 text-slate-800 hover:bg-slate-300 transition-colors">Agora Não</button>
                    <button onClick={handleGenerateReceipt} className="px-4 py-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-colors flex items-center gap-2"><PrintIcon /> Emitir Recibo</button>
                </div>
             </div>
          </div>
      )}

      {/* Export/Print Modal - restoring full content */}
      {isExportModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-[65] animate-fade-in">
              <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
                  <h3 className="text-xl font-bold text-slate-800 mb-4">Opções de Impressão</h3>
                  <p className="text-slate-600 mb-6">Selecione o formato do prontuário para impressão ou exportação em PDF.</p>
                  <div className="space-y-4">
                      <button 
                          onClick={() => handleExportPDF('full')} 
                          className="w-full flex items-center gap-3 p-4 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors"
                      >
                          <FileTextIcon className="w-5 h-5 text-indigo-600" />
                          <div>
                              <p className="font-semibold text-slate-800">Prontuário Completo</p>
                              <p className="text-sm text-slate-500">Inclui todos os dados do paciente e anotações.</p>
                          </div>
                      </button>
                      <button 
                          onClick={() => handleExportPDF('blank')} 
                          className="w-full flex items-center gap-3 p-4 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors"
                      >
                          <FileTextIcon className="w-5 h-5 text-slate-500" />
                          <div>
                              <p className="font-semibold text-slate-800">Prontuário Em Branco</p>
                              <p className="text-sm text-slate-500">Apenas dados de identificação, com campos para preencher.</p>
                          </div>
                      </button>
                  </div>
                  <div className="flex justify-end mt-6 pt-4 border-t border-slate-100">
                      <button onClick={() => setIsExportModalOpen(false)} className="px-4 py-2 rounded-full bg-slate-200 text-slate-800 hover:bg-slate-300 transition-colors">Cancelar</button>
                  </div>
              </div>
          </div>
      )}

      {/* Chart Tooltip */}
      {hoveredChartPoint && (
        <div
          className="fixed bg-white p-3 rounded-lg shadow-xl border border-slate-200 text-sm z-50 pointer-events-none transition-opacity duration-150"
          style={{ left: tooltipCoords.x, top: tooltipCoords.y, transform: 'translate(-50%, -110%)' }} // Position above and center
        >
          <p className="font-bold text-slate-800 mb-1">{hoveredChartPoint.dateLabel} - {hoveredChartPoint.label}</p>
          <p className="text-slate-600 text-xs italic max-w-xs">{hoveredChartPoint.content}</p>
          <div className="absolute left-1/2 -bottom-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-200 transform -translate-x-1/2"></div>
          <div className="absolute left-1/2 -bottom-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white transform -translate-x-1/2 -translate-y-px"></div>
        </div>
      )}

      {/* Tabs and Content */}
      <div className="bg-slate-50 p-4 rounded-lg mb-6 border grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2 text-sm text-slate-700">
          <p><span className="font-semibold">E-mail:</span> {patient.email}</p>
          <p><span className="font-semibold">Telefone:</span> {patient.phone || 'N/A'}</p>
          <p><span className="font-semibold">Nascimento:</span> {new Date(patient.dateOfBirth).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</p>
          <p><span className="font-semibold">Profissão:</span> {patient.occupation}</p>
          <p className="sm:col-span-2 lg:col-span-3"><span className="font-semibold">Endereço:</span> {patient.address}</p>
      </div>

      <div className="flex border-b border-slate-200 mb-6 overflow-x-auto">
        {['anamnese', 'prontuario', 'evolucao'].map(tab => (
            <button
              key={tab}
              className={`py-2 px-4 font-medium text-sm transition-colors border-b-2 whitespace-nowrap capitalize ${activeTab === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              onClick={() => setActiveTab(tab as any)}
            >
              {tab === 'prontuario' ? 'Prontuário' : tab === 'evolucao' ? 'Evolução' : 'Anamnese'}
            </button>
        ))}
      </div>

      <div className="space-y-6">
        {activeTab === 'anamnese' && (
          <div className="bg-white p-6 rounded-lg shadow-sm border animate-fade-in">
            {isAnamnesisFormVisible ? (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-indigo-800 mb-4">Editar Anamnese</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                    {/* 1. Dados Pessoais */}
                    <div className="sm:col-span-2">
                        <h4 className="text-base font-semibold text-slate-700 mb-2">1. Dados Pessoais</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                            <div>
                                <label htmlFor="civilStatus" className="block text-sm font-medium text-slate-700 mb-1">Estado Civil</label>
                                <div className="relative group">
                                    <select id="civilStatus" name="civilStatus" value={anamnesisForm.civilStatus} onChange={handleAnamnesisFormChange} className={selectClass}>
                                        <option value="">Selecione</option>
                                        <option value="solteiro(a)">Solteiro(a)</option>
                                        <option value="namorando">Namorando</option>
                                        <option value="casado(a)">Casado(a)</option>
                                        <option value="divorciado(a)">Divorciado(a)</option>
                                        <option value="viuvo(a)">Viúvo(a)</option>
                                    </select>
                                    <ChevronDownIcon />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="hasChildren" className="block text-sm font-medium text-slate-700 mb-1">Possui Filhos?</label>
                                <div className="relative group">
                                    <select id="hasChildren" name="hasChildren" value={anamnesisForm.hasChildren} onChange={handleAnamnesisFormChange} className={selectClass}>
                                        <option value="">Selecione</option>
                                        <option value="sim">Sim</option>
                                        <option value="nao">Não</option>
                                    </select>
                                    <ChevronDownIcon />
                                </div>
                            </div>
                            {anamnesisForm.hasChildren === 'sim' && (
                                <div>
                                    <label htmlFor="numberOfChildren" className="block text-sm font-medium text-slate-700 mb-1">Número de Filhos</label>
                                    <input type="number" id="numberOfChildren" name="numberOfChildren" value={anamnesisForm.numberOfChildren} onChange={handleAnamnesisFormChange} className={inputClass} />
                                </div>
                            )}
                            <div>
                                <label htmlFor="hadAbortion" className="block text-sm font-medium text-slate-700 mb-1">Já teve aborto?</label>
                                <div className="relative group">
                                    <select id="hadAbortion" name="hadAbortion" value={anamnesisForm.hadAbortion} onChange={handleAnamnesisFormChange} className={selectClass}>
                                        <option value="">Selecione</option>
                                        <option value="sim">Sim</option>
                                        <option value="nao">Não</option>
                                    </select>
                                    <ChevronDownIcon />
                                </div>
                            </div>
                            <div className="sm:col-span-2">
                                <label htmlFor="occupation" className="block text-sm font-medium text-slate-700 mb-1">Profissão</label>
                                <input type="text" id="occupation" name="occupation" value={anamnesisForm.occupation} onChange={handleAnamnesisFormChange} className={inputClass} />
                            </div>
                            <div className="sm:col-span-2">
                                <label htmlFor="educationLevel" className="block text-sm font-medium text-slate-700 mb-1">Grau de Escolaridade</label>
                                <div className="relative group">
                                    <select id="educationLevel" name="educationLevel" value={anamnesisForm.educationLevel} onChange={handleAnamnesisFormChange} className={selectClass}>
                                        <option value="">Selecione</option>
                                        <option value="fundamental">Ensino Fundamental</option>
                                        <option value="medio">Ensino Médio</option>
                                        <option value="graduacao_incompleta">Graduação Incompleta</option>
                                        <option value="graduacao">Graduação Completa</option>
                                        <option value="pos_graduacao">Pós-Graduação</option>
                                    </select>
                                    <ChevronDownIcon />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. Histórico Familiar */}
                    <div className="sm:col-span-2 border-t pt-5 mt-5 border-slate-100">
                        <h4 className="text-base font-semibold text-slate-700 mb-2">2. Histórico Familiar</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                            <div>
                                <label htmlFor="mothersName" className="block text-sm font-medium text-slate-700 mb-1">Nome da Mãe</label>
                                <input type="text" id="mothersName" name="mothersName" value={anamnesisForm.mothersName} onChange={handleAnamnesisFormChange} className={inputClass} />
                            </div>
                            <div>
                                <label htmlFor="mothersRelationship" className="block text-sm font-medium text-slate-700 mb-1">Relação com a Mãe</label>
                                <div className="relative group">
                                    <select id="mothersRelationship" name="mothersRelationship" value={anamnesisForm.mothersRelationship} onChange={handleAnamnesisFormChange} className={selectClass}>
                                        <option value="">Selecione</option>
                                        <option value="pessima">Péssima</option>
                                        <option value="ruim">Ruim</option>
                                        <option value="boa">Boa</option>
                                        <option value="otima">Ótima</option>
                                    </select>
                                    <ChevronDownIcon />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="fathersName" className="block text-sm font-medium text-slate-700 mb-1">Nome do Pai</label>
                                <input type="text" id="fathersName" name="fathersName" value={anamnesisForm.fathersName} onChange={handleAnamnesisFormChange} className={inputClass} />
                            </div>
                            <div>
                                <label htmlFor="fathersRelationship" className="block text-sm font-medium text-slate-700 mb-1">Relação com o Pai</label>
                                <div className="relative group">
                                    <select id="fathersRelationship" name="fathersRelationship" value={anamnesisForm.fathersRelationship} onChange={handleAnamnesisFormChange} className={selectClass}>
                                        <option value="">Selecione</option>
                                        <option value="pessima">Péssima</option>
                                        <option value="ruim">Ruim</option>
                                        <option value="boa">Boa</option>
                                        <option value="otima">Ótima</option>
                                    </select>
                                    <ChevronDownIcon />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="hasSiblings" className="block text-sm font-medium text-slate-700 mb-1">Possui Irmãos?</label>
                                <div className="relative group">
                                    <select id="hasSiblings" name="hasSiblings" value={anamnesisForm.hasSiblings} onChange={handleAnamnesisFormChange} className={selectClass}>
                                        <option value="">Selecione</option>
                                        <option value="sim">Sim</option>
                                        <option value="nao">Não</option>
                                    </select>
                                    <ChevronDownIcon />
                                </div>
                            </div>
                            {anamnesisForm.hasSiblings === 'sim' && (
                                <div>
                                    <label htmlFor="numberOfSiblings" className="block text-sm font-medium text-slate-700 mb-1">Número de Irmãos</label>
                                    <input type="number" id="numberOfSiblings" name="numberOfSiblings" value={anamnesisForm.numberOfSiblings} onChange={handleAnamnesisFormChange} className={inputClass} />
                                </div>
                            )}
                             {anamnesisForm.hasSiblings === 'sim' && (
                                <div className="sm:col-span-2">
                                    <label htmlFor="siblingsRelationship" className="block text-sm font-medium text-slate-700 mb-1">Relação com Irmãos</label>
                                    <div className="relative group">
                                        <select id="siblingsRelationship" name="siblingsRelationship" value={anamnesisForm.siblingsRelationship} onChange={handleAnamnesisFormChange} className={selectClass}>
                                            <option value="">Selecione</option>
                                            <option value="pessima">Péssima</option>
                                            <option value="ruim">Ruim</option>
                                            <option value="boa">Boa</option>
                                            <option value="otima">Ótima</option>
                                        </select>
                                        <ChevronDownIcon />
                                    </div>
                                </div>
                            )}
                            <div className="sm:col-span-2">
                                <label htmlFor="childhoodDescription" className="block text-sm font-medium text-slate-700 mb-1">Como avalia a infância?</label>
                                <div className="relative group">
                                    <select id="childhoodDescription" name="childhoodDescription" value={anamnesisForm.childhoodDescription} onChange={handleAnamnesisFormChange} className={selectClass}>
                                        <option value="">Selecione</option>
                                        <option value="pessima">Péssima</option>
                                        <option value="ruim">Ruim</option>
                                        <option value="boa">Boa</option>
                                        <option value="otima">Ótima</option>
                                    </select>
                                    <ChevronDownIcon />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 3. Saúde Geral */}
                    <div className="sm:col-span-2 border-t pt-5 mt-5 border-slate-100">
                        <h4 className="text-base font-semibold text-slate-700 mb-2">3. Saúde Geral</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                            <div>
                                <label htmlFor="continuousMedication" className="block text-sm font-medium text-slate-700 mb-1">Usa medicação contínua?</label>
                                <div className="relative group">
                                    <select id="continuousMedication" name="continuousMedication" value={anamnesisForm.continuousMedication} onChange={handleAnamnesisFormChange} className={selectClass}>
                                        <option value="">Selecione</option>
                                        <option value="sim">Sim</option>
                                        <option value="nao">Não</option>
                                    </select>
                                    <ChevronDownIcon />
                                </div>
                            </div>
                            {anamnesisForm.continuousMedication === 'sim' && (
                                <div>
                                    <label htmlFor="medicationsDetails" className="block text-sm font-medium text-slate-700 mb-1">Quais?</label>
                                    <input type="text" id="medicationsDetails" name="medicationsDetails" value={anamnesisForm.medicationsDetails} onChange={handleAnamnesisFormChange} className={inputClass} />
                                </div>
                            )}
                            <div className="sm:col-span-2">
                                <label htmlFor="relevantMedicalDiagnosis" className="block text-sm font-medium text-slate-700 mb-1">Diagnósticos médicos relevantes</label>
                                <textarea id="relevantMedicalDiagnosis" name="relevantMedicalDiagnosis" value={anamnesisForm.relevantMedicalDiagnosis} onChange={handleAnamnesisFormChange} className={textareaClass}></textarea>
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Uso de Substâncias</label>
                                <div className="flex flex-wrap gap-x-4 gap-y-2">
                                    <label className="flex items-center text-sm text-slate-700">
                                        <input type="checkbox" name="substanceUse_marijuana" checked={anamnesisForm.substanceUse_marijuana} onChange={handleAnamnesisFormChange} className="mr-2" /> Maconha
                                    </label>
                                    <label className="flex items-center text-sm text-slate-700">
                                        <input type="checkbox" name="substanceUse_cocaine" checked={anamnesisForm.substanceUse_cocaine} onChange={handleAnamnesisFormChange} className="mr-2" /> Cocaína
                                    </label>
                                    <label className="flex items-center text-sm text-slate-700">
                                        <input type="checkbox" name="substanceUse_alcohol" checked={anamnesisForm.substanceUse_alcohol} onChange={handleAnamnesisFormChange} className="mr-2" /> Álcool
                                    </label>
                                    <label className="flex items-center text-sm text-slate-700">
                                        <input type="checkbox" name="substanceUse_cigarette" checked={anamnesisForm.substanceUse_cigarette} onChange={handleAnamnesisFormChange} className="mr-2" /> Cigarro
                                    </label>
                                    <label className="flex items-center text-sm text-slate-700">
                                        <input type="checkbox" name="substanceUse_none" checked={anamnesisForm.substanceUse_none} onChange={handleAnamnesisFormChange} className="mr-2" /> Nenhum
                                    </label>
                                </div>
                            </div>
                            <div className="sm:col-span-2">
                                <label htmlFor="sleepQuality" className="block text-sm font-medium text-slate-700 mb-1">Qualidade do Sono</label>
                                <div className="relative group">
                                    <select id="sleepQuality" name="sleepQuality" value={anamnesisForm.sleepQuality} onChange={handleAnamnesisFormChange} className={selectClass}>
                                        <option value="">Selecione</option>
                                        <option value="pessima">Péssima</option>
                                        <option value="ruim">Ruim</option>
                                        <option value="boa">Boa</option>
                                        <option value="otima">Ótima</option>
                                    </select>
                                    <ChevronDownIcon />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 4. Aspectos Psicológicos e Emocionais */}
                    <div className="sm:col-span-2 border-t pt-5 mt-5 border-slate-100">
                        <h4 className="text-base font-semibold text-slate-700 mb-2">4. Aspectos Psicológicos e Emocionais</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Sintomas Principais</label>
                                <div className="flex flex-wrap gap-x-4 gap-y-2">
                                    <label className="flex items-center text-sm text-slate-700">
                                        <input type="checkbox" name="mainSymptoms_sadness" checked={anamnesisForm.mainSymptoms_sadness} onChange={handleAnamnesisFormChange} className="mr-2" /> Tristeza
                                    </label>
                                    <label className="flex items-center text-sm text-slate-700">
                                        <input type="checkbox" name="mainSymptoms_depression" checked={anamnesisForm.mainSymptoms_depression} onChange={handleAnamnesisFormChange} className="mr-2" /> Depressão
                                    </label>
                                    <label className="flex items-center text-sm text-slate-700">
                                        <input type="checkbox" name="mainSymptoms_anxiety" checked={anamnesisForm.mainSymptoms_anxiety} onChange={handleAnamnesisFormChange} className="mr-2" /> Ansiedade
                                    </label>
                                    <label className="flex items-center text-sm text-slate-700">
                                        <input type="checkbox" name="mainSymptoms_nervousness" checked={anamnesisForm.mainSymptoms_nervousness} onChange={handleAnamnesisFormChange} className="mr-2" /> Nervosismo
                                    </label>
                                    <label className="flex items-center text-sm text-slate-700">
                                        <input type="checkbox" name="mainSymptoms_phobias" checked={anamnesisForm.mainSymptoms_phobias} onChange={handleAnamnesisFormChange} className="mr-2" /> Fobias
                                    </label>
                                </div>
                            </div>
                            {anamnesisForm.mainSymptoms_phobias && (
                                <div className="sm:col-span-2">
                                    <label htmlFor="mainSymptoms_otherFear" className="block text-sm font-medium text-slate-700 mb-1">Especifique as fobias/medos</label>
                                    <input type="text" id="mainSymptoms_otherFear" name="mainSymptoms_otherFear" value={anamnesisForm.mainSymptoms_otherFear} onChange={handleAnamnesisFormChange} className={inputClass} />
                                </div>
                            )}
                            <div>
                                <label htmlFor="anxietyLevel" className="block text-sm font-medium text-slate-700 mb-1">Nível de Ansiedade</label>
                                <div className="relative group">
                                    <select id="anxietyLevel" name="anxietyLevel" value={anamnesisForm.anxietyLevel} onChange={handleAnamnesisFormChange} className={selectClass}>
                                        <option value="">Selecione</option>
                                        <option value="baixo">Baixo</option>
                                        <option value="normal">Normal</option>
                                        <option value="alto">Alto</option>
                                    </select>
                                    <ChevronDownIcon />
                                </div>
                            </div>
                             <div>
                                <label htmlFor="irritabilityLevel" className="block text-sm font-medium text-slate-700 mb-1">Nível de Irritabilidade</label>
                                <div className="relative group">
                                    <select id="irritabilityLevel" name="irritabilityLevel" value={anamnesisForm.irritabilityLevel} onChange={handleAnamnesisFormChange} className={selectClass}>
                                        <option value="">Selecione</option>
                                        <option value="baixo">Baixo</option>
                                        <option value="normal">Normal</option>
                                        <option value="alto">Alto</option>
                                    </select>
                                    <ChevronDownIcon />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="sadnessLevel" className="block text-sm font-medium text-slate-700 mb-1">Nível de Tristeza</label>
                                <div className="relative group">
                                    <select id="sadnessLevel" name="sadnessLevel" value={anamnesisForm.sadnessLevel} onChange={handleAnamnesisFormChange} className={selectClass}>
                                        <option value="">Selecione</option>
                                        <option value="baixo">Baixo</option>
                                        <option value="normal">Normal</option>
                                        <option value="alto">Alto</option>
                                    </select>
                                    <ChevronDownIcon />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="carriesGuilt" className="block text-sm font-medium text-slate-700 mb-1">Carrega culpa?</label>
                                <div className="relative group">
                                    <select id="carriesGuilt" name="carriesGuilt" value={anamnesisForm.carriesGuilt} onChange={handleAnamnesisFormChange} className={selectClass}>
                                        <option value="">Selecione</option>
                                        <option value="sim">Sim</option>
                                        <option value="nao">Não</option>
                                    </select>
                                    <ChevronDownIcon />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="carriesInjustice" className="block text-sm font-medium text-slate-700 mb-1">Sente injustiça?</label>
                                <div className="relative group">
                                    <select id="carriesInjustice" name="carriesInjustice" value={anamnesisForm.carriesInjustice} onChange={handleAnamnesisFormChange} className={selectClass}>
                                        <option value="">Selecione</option>
                                        <option value="sim">Sim</option>
                                        <option value="nao">Não</option>
                                    </select>
                                    <ChevronDownIcon />
                                </div>
                            </div>
                             <div>
                                <label htmlFor="suicidalThoughts" className="block text-sm font-medium text-slate-700 mb-1">Tem pensamentos suicidas?</label>
                                <div className="relative group">
                                    <select id="suicidalThoughts" name="suicidalThoughts" value={anamnesisForm.suicidalThoughts} onChange={handleAnamnesisFormChange} className={selectClass}>
                                        <option value="">Selecione</option>
                                        <option value="sim">Sim</option>
                                        <option value="nao">Não</option>
                                    </select>
                                    <ChevronDownIcon />
                                </div>
                            </div>
                            {anamnesisForm.suicidalThoughts === 'sim' && (
                                <div className="sm:col-span-2">
                                    <label htmlFor="suicidalThoughtsComment" className="block text-sm font-medium text-slate-700 mb-1">Comente sobre os pensamentos suicidas</label>
                                    <textarea id="suicidalThoughtsComment" name="suicidalThoughtsComment" value={anamnesisForm.suicidalThoughtsComment} onChange={handleAnamnesisFormChange} className={textareaClass}></textarea>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 5. Vida Social e Rotina */}
                    <div className="sm:col-span-2 border-t pt-5 mt-5 border-slate-100">
                        <h4 className="text-base font-semibold text-slate-700 mb-2">5. Vida Social e Rotina</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                            <div>
                                <label htmlFor="hasCloseFriends" className="block text-sm font-medium text-slate-700 mb-1">Possui amigos próximos?</label>
                                <div className="relative group">
                                    <select id="hasCloseFriends" name="hasCloseFriends" value={anamnesisForm.hasCloseFriends} onChange={handleAnamnesisFormChange} className={selectClass}>
                                        <option value="">Selecione</option>
                                        <option value="sim">Sim</option>
                                        <option value="nao">Não</option>
                                    </select>
                                    <ChevronDownIcon />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="socialConsideration" className="block text-sm font-medium text-slate-700 mb-1">Considera-se</label>
                                <div className="relative group">
                                    <select id="socialConsideration" name="socialConsideration" value={anamnesisForm.socialConsideration} onChange={handleAnamnesisFormChange} className={selectClass}>
                                        <option value="">Selecione</option>
                                        <option value="expansivo(a)">Expansivo(a)</option>
                                        <option value="reservado(a)">Reservado(a)</option>
                                    </select>
                                    <ChevronDownIcon />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="physicalActivity" className="block text-sm font-medium text-slate-700 mb-1">Faz atividade física?</label>
                                <div className="relative group">
                                    <select id="physicalActivity" name="physicalActivity" value={anamnesisForm.physicalActivity} onChange={handleAnamnesisFormChange} className={selectClass}>
                                        <option value="">Selecione</option>
                                        <option value="sim">Sim</option>
                                        <option value="nao">Não</option>
                                    </select>
                                    <ChevronDownIcon />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="financialStatus" className="block text-sm font-medium text-slate-700 mb-1">Status Financeiro</label>
                                <div className="relative group">
                                    <select id="financialStatus" name="financialStatus" value={anamnesisForm.financialStatus} onChange={handleAnamnesisFormChange} className={selectClass}>
                                        <option value="">Selecione</option>
                                        <option value="ruim">Ruim</option>
                                        <option value="estavel">Estável</option>
                                        <option value="boa">Boa</option>
                                        <option value="otima">Ótima</option>
                                    </select>
                                    <ChevronDownIcon />
                                </div>
                            </div>
                            <div className="sm:col-span-2">
                                <label htmlFor="dailyRoutine" className="block text-sm font-medium text-slate-700 mb-1">Rotina Diária</label>
                                <textarea id="dailyRoutine" name="dailyRoutine" value={anamnesisForm.dailyRoutine} onChange={handleAnamnesisFormChange} className={textareaClass}></textarea>
                            </div>
                        </div>
                    </div>

                    {/* 6. Buscando Ajuda */}
                    <div className="sm:col-span-2 border-t pt-5 mt-5 border-slate-100">
                        <h4 className="text-base font-semibold text-slate-700 mb-2">6. Buscando Ajuda</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                            <div>
                                <label htmlFor="howFoundAnalysis" className="block text-sm font-medium text-slate-700 mb-1">Como encontrou a análise?</label>
                                <div className="relative group">
                                    <select id="howFoundAnalysis" name="howFoundAnalysis" value={anamnesisForm.howFoundAnalysis} onChange={handleAnamnesisFormChange} className={selectClass}>
                                        <option value="">Selecione</option>
                                        <option value="indicacao">Indicação</option>
                                        <option value="internet">Internet</option>
                                        <option value="outro">Outro</option>
                                    </select>
                                    <ChevronDownIcon />
                                </div>
                            </div>
                            {anamnesisForm.howFoundAnalysis === 'outro' && (
                                <div>
                                    <label htmlFor="howFoundAnalysisOther" className="block text-sm font-medium text-slate-700 mb-1">Especifique</label>
                                    <input type="text" id="howFoundAnalysisOther" name="howFoundAnalysisOther" value={anamnesisForm.howFoundAnalysisOther} onChange={handleAnamnesisFormChange} className={inputClass} />
                                </div>
                            )}
                            <div>
                                <label htmlFor="previousTherapy" className="block text-sm font-medium text-slate-700 mb-1">Já fez terapia antes?</label>
                                <div className="relative group">
                                    <select id="previousTherapy" name="previousTherapy" value={anamnesisForm.previousTherapy} onChange={handleAnamnesisFormChange} className={selectClass}>
                                        <option value="">Selecione</option>
                                        <option value="sim">Sim</option>
                                        <option value="nao">Não</option>
                                    </select>
                                    <ChevronDownIcon />
                                </div>
                            </div>
                            {anamnesisForm.previousTherapy === 'sim' && (
                                <div>
                                    <label htmlFor="previousTherapyDuration" className="block text-sm font-medium text-slate-700 mb-1">Duração</label>
                                    <input type="text" id="previousTherapyDuration" name="previousTherapyDuration" value={anamnesisForm.previousTherapyDuration} onChange={handleAnamnesisFormChange} className={inputClass} />
                                </div>
                            )}
                            <div className="sm:col-span-2">
                                <label htmlFor="mainReason" className="block text-sm font-medium text-slate-700 mb-1">Motivo principal para buscar ajuda</label>
                                <textarea id="mainReason" name="mainReason" value={anamnesisForm.mainReason} onChange={handleAnamnesisFormChange} className={textareaClass}></textarea>
                            </div>
                            <div className="sm:col-span-2">
                                <label htmlFor="situationStart" className="block text-sm font-medium text-slate-700 mb-1">Quando a situação começou?</label>
                                <textarea id="situationStart" name="situationStart" value={anamnesisForm.situationStart} onChange={handleAnamnesisFormChange} className={textareaClass}></textarea>
                            </div>
                            <div className="sm:col-span-2">
                                <label htmlFor="triggeringEvent" className="block text-sm font-medium text-slate-700 mb-1">Evento(s) gatilho(s)</label>
                                <textarea id="triggeringEvent" name="triggeringEvent" value={anamnesisForm.triggeringEvent} onChange={handleAnamnesisFormChange} className={textareaClass}></textarea>
                            </div>
                            <div className="sm:col-span-2">
                                <label htmlFor="expectationsAnalysis" className="block text-sm font-medium text-slate-700 mb-1">O que espera da análise?</label>
                                <textarea id="expectationsAnalysis" name="expectationsAnalysis" value={anamnesisForm.expectationsAnalysis} onChange={handleAnamnesisFormChange} className={textareaClass}></textarea>
                            </div>
                        </div>
                    </div>

                    {/* 7. Observações Gerais */}
                    <div className="sm:col-span-2 border-t pt-5 mt-5 border-slate-100">
                        <h4 className="text-base font-semibold text-slate-700 mb-2">7. Observações Gerais da Anamnese</h4>
                        <textarea id="generalObservations" name="generalObservations" value={anamnesisForm.generalObservations} onChange={handleAnamnesisFormChange} className={textareaClass}></textarea>
                    </div>

                </div>
                
                <div className="text-right mt-8 flex justify-end gap-3">
                   <button type="button" onClick={() => setIsAnamnesisFormVisible(false)} className="px-4 py-2 rounded-full bg-slate-200 text-slate-800 hover:bg-slate-300 transition-colors">Cancelar</button>
                   <button type="button" onClick={handleSaveAnamnesis} className="bg-emerald-600 text-white px-4 py-2 rounded-full hover:bg-emerald-700 transition-colors">Salvar Anamnese</button>
                </div>
              </div>
            ) : (
               <div className="space-y-6">
                  <div className="flex justify-between items-center border-b pb-4 mb-4">
                      <h3 className="text-lg font-semibold text-slate-700">Ficha de Anamnese</h3>
                      <button onClick={() => setIsAnamnesisFormVisible(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-full text-sm hover:bg-indigo-700 transition-colors">
                        <EditIcon className="inline w-4 h-4 mr-2 -mt-0.5"/> Editar
                      </button>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6">
                      <p><span className="font-semibold text-slate-700">Estado Civil:</span> {displayFmt(anamnesisForm.civilStatus)}</p>
                      <p><span className="font-semibold text-slate-700">Filhos:</span> {displayFmt(anamnesisForm.hasChildren)} {anamnesisForm.hasChildren === 'sim' ? `(${anamnesisForm.numberOfChildren})` : ''}</p>
                      <p><span className="font-semibold text-slate-700">Profissão:</span> {displayFmt(anamnesisForm.occupation)}</p>
                      <p><span className="font-semibold text-slate-700">Escolaridade:</span> {displayFmt(anamnesisForm.educationLevel)}</p>
                      <p className="sm:col-span-2"><span className="font-semibold text-slate-700">Mãe:</span> {displayFmt(anamnesisForm.mothersName)} (Relação: {displayFmt(anamnesisForm.mothersRelationship)})</p>
                      <p className="sm:col-span-2"><span className="font-semibold text-slate-700">Pai:</span> {displayFmt(anamnesisForm.fathersName)} (Relação: {displayFmt(anamnesisForm.fathersRelationship)})</p>
                      <p><span className="font-semibold text-slate-700">Irmãos:</span> {displayFmt(anamnesisForm.hasSiblings)} {anamnesisForm.hasSiblings === 'sim' ? `(${anamnesisForm.numberOfSiblings})` : ''}</p>
                      {anamnesisForm.hasSiblings === 'sim' && <p><span className="font-semibold text-slate-700">Relação Irmãos:</span> {displayFmt(anamnesisForm.siblingsRelationship)}</p>}
                      <p className="sm:col-span-2"><span className="font-semibold text-slate-700">Infância:</span> {displayFmt(anamnesisForm.childhoodDescription)}</p>
                      <p><span className="font-semibold text-slate-700">Medicação Contínua:</span> {displayFmt(anamnesisForm.continuousMedication)} {anamnesisForm.continuousMedication === 'sim' ? `(${anamnesisForm.medicationsDetails})` : ''}</p>
                      <p className="sm:col-span-2"><span className="font-semibold text-slate-700">Diagnósticos Médicos:</span> {displayFmt(anamnesisForm.relevantMedicalDiagnosis)}</p>
                      <p className="sm:col-span-2"><span className="font-semibold text-slate-700">Uso de Substâncias:</span> 
                        {Object.entries(anamnesisForm)
                            .filter(([key, value]) => key.startsWith('substanceUse_') && value === true && key !== 'substanceUse_none')
                            .map(([key]) => displayFmt(key.replace('substanceUse_', ''))).join(', ') || 'Nenhum'}
                      </p>
                      <p><span className="font-semibold text-slate-700">Qualidade do Sono:</span> {displayFmt(anamnesisForm.sleepQuality)}</p>
                      <p className="sm:col-span-2"><span className="font-semibold text-slate-700">Sintomas Principais:</span> 
                          {[
                              anamnesisForm.mainSymptoms_sadness && 'Tristeza',
                              anamnesisForm.mainSymptoms_depression && 'Depressão',
                              anamnesisForm.mainSymptoms_anxiety && 'Ansiedade',
                              anamnesisForm.mainSymptoms_nervousness && 'Nervosismo',
                              anamnesisForm.mainSymptoms_phobias && `Fobias (${anamnesisForm.mainSymptoms_otherFear})`
                          ].filter(Boolean).map(s => displayFmt(s)).join(', ') || 'Nenhum'}
                      </p>
                      <p><span className="font-semibold text-slate-700">Nível de Ansiedade:</span> {displayFmt(anamnesisForm.anxietyLevel)}</p>
                      <p><span className="font-semibold text-slate-700">Nível de Irritabilidade:</span> {displayFmt(anamnesisForm.irritabilityLevel)}</p>
                      <p><span className="font-semibold text-slate-700">Nível de Tristeza:</span> {displayFmt(anamnesisForm.sadnessLevel)}</p>
                      <p><span className="font-semibold text-slate-700">Culpa:</span> {displayFmt(anamnesisForm.carriesGuilt)}</p>
                      <p><span className="font-semibold text-slate-700">Injustiça:</span> {displayFmt(anamnesisForm.carriesInjustice)}</p>
                      <p><span className="font-semibold text-slate-700">Pensamentos Suicidas:</span> {displayFmt(anamnesisForm.suicidalThoughts)} {anamnesisForm.suicidalThoughts === 'sim' ? `(${anamnesisForm.suicidalThoughtsComment})` : ''}</p>
                      <p><span className="font-semibold text-slate-700">Amigos Próximos:</span> {displayFmt(anamnesisForm.hasCloseFriends)}</p>
                      <p><span className="font-semibold text-slate-700">Consideração Social:</span> {displayFmt(anamnesisForm.socialConsideration)}</p>
                      <p><span className="font-semibold text-slate-700">Atividade Física:</span> {displayFmt(anamnesisForm.physicalActivity)}</p>
                      <p><span className="font-semibold text-slate-700">Status Financeiro:</span> {displayFmt(anamnesisForm.financialStatus)}</p>
                      <p className="sm:col-span-2"><span className="font-semibold text-slate-700">Rotina Diária:</span> {displayFmt(anamnesisForm.dailyRoutine)}</p>
                      <p><span className="font-semibold text-slate-700">Como Encontrou Análise:</span> {displayFmt(anamnesisForm.howFoundAnalysis)} {anamnesisForm.howFoundAnalysis === 'outro' ? `(${anamnesisForm.howFoundAnalysisOther})` : ''}</p>
                      <p><span className="font-semibold text-slate-700">Terapia Anterior:</span> {displayFmt(anamnesisForm.previousTherapy)} {anamnesisForm.previousTherapy === 'sim' ? `(${anamnesisForm.previousTherapyDuration})` : ''}</p>
                      <p className="sm:col-span-2"><span className="font-semibold text-slate-700">Motivo Principal:</span> {displayFmt(anamnesisForm.mainReason)}</p>
                      <p className="sm:col-span-2"><span className="font-semibold text-slate-700">Início da Situação:</span> {displayFmt(anamnesisForm.situationStart)}</p>
                      <p className="sm:col-span-2"><span className="font-semibold text-slate-700">Evento Gatilho:</span> {displayFmt(anamnesisForm.triggeringEvent)}</p>
                      <p className="sm:col-span-2"><span className="font-semibold text-slate-700">Expectativas:</span> {displayFmt(anamnesisForm.expectationsAnalysis)}</p>
                      <p className="sm:col-span-2"><span className="font-semibold text-slate-700">Obs. Gerais (Anamnese):</span> {displayFmt(anamnesisForm.generalObservations)}</p>
                  </div>
               </div>
            )}
          </div>
        )}

        {activeTab === 'prontuario' && (
          <div className="animate-fade-in space-y-6">
             {todayAppointment && todayAppointment.status === 'scheduled' && (
                <div className={`bg-blue-50 border-l-4 border-blue-400 p-4 rounded-md shadow-sm flex justify-between items-center ${isTimerActive ? 'bg-emerald-50 border-emerald-400' : ''}`}>
                    <div>
                        <p className="font-bold text-slate-800">Consulta {isTimerActive ? 'em andamento' : 'agendada'} para hoje às {todayAppointment.time}.</p>
                        {!hasTodayNoteSaved && !isTimerActive && (
                            <p className="text-sm text-slate-600 mt-1">Lembre-se de iniciar e registrar uma anotação após o atendimento.</p>
                        )}
                        {hasTodayNoteSaved && (
                            <p className="text-sm text-slate-600 mt-1">Anotação da sessão de hoje já salva.</p>
                        )}
                    </div>
                     {!isTimerActive && !hasTodayNoteSaved && (
                        <button
                            onClick={handleStartConsultation}
                            className="bg-emerald-600 text-white px-4 py-2 rounded-full hover:bg-emerald-700 transition-colors text-sm font-semibold shadow-sm ml-4 flex items-center gap-2"
                        >
                            <PlayIcon className="w-4 h-4" /> Iniciar
                        </button>
                    )}
                </div>
            )}
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-700 mb-2">Nova Anotação de Sessão</h3>
              <textarea 
                  value={newNote} 
                  onChange={(e) => setNewNote(e.target.value)} 
                  className={textareaClass}
                  placeholder="Descreva o andamento da sessão, observações clínicas e pontos importantes..."
              ></textarea>
              <div className="flex justify-end mt-4">
                  <button 
                    onClick={handleInitiateSaveNote}
                    disabled={!newNote.trim()}
                    className={`px-6 py-2 rounded-full font-medium transition-colors shadow-sm ${!newNote.trim() ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                  >
                    Salvar Anotação
                  </button>
              </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-700 pl-1">Histórico de Sessões</h3>
                {patientNotes.length > 0 ? (
                    patientNotes.map(note => {
                        const evalData = note.evaluation ? getEvaluationLabel(note.evaluation) : null;
                        return (
                            <div key={note.id} className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition-shadow group">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <p className="font-bold text-slate-800 text-sm">
                                            {new Date(note.date).toLocaleDateString('pt-BR', {weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'})}
                                            <span className="font-normal text-slate-500 mx-2">•</span>
                                            {new Date(note.date).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {evalData && (
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold border ${evalData.color}`}>
                                                {evalData.label}
                                            </span>
                                        )}
                                        <button onClick={() => handleOpenEditNote(note)} className="p-1 text-slate-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <EditIcon />
                                        </button>
                                    </div>
                                </div>
                                <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{note.content}</p>
                            </div>
                        );
                    })
                ) : (
                    <div className="text-center py-10 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                        <p className="text-slate-500">Nenhuma anotação registrada até o momento.</p>
                    </div>
                )}
            </div>
          </div>
        )}

        {activeTab === 'evolucao' && (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 animate-fade-in">
                <h3 className="text-lg font-semibold text-slate-800 mb-6">Gráfico de Evolução Clínica</h3>
                {evolutionData.length > 1 ? (
                    <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
                        <div style={{ width: Math.max(600, chartWidth), height: chartHeight + 60 }} className="relative mx-auto">
                            {/* Y Axis Labels */}
                            <div className="absolute left-0 top-0 h-[150px] flex flex-col justify-between text-xs text-slate-400 font-medium pr-2 border-r border-slate-100">
                                <span>Ótimo</span>
                                <span>Bom</span>
                                <span>Ruim</span>
                                <span>Péssimo</span>
                            </div>

                            {/* Chart Area */}
                            <div className="absolute left-16 right-0 top-2 h-[150px] border-l border-b border-slate-200">
                                {/* Horizontal Grid Lines */}
                                <div className="absolute w-full top-[0%] border-t border-slate-100 border-dashed"></div>
                                <div className="absolute w-full top-[33%] border-t border-slate-100 border-dashed"></div>
                                <div className="absolute w-full top-[66%] border-t border-slate-100 border-dashed"></div>

                                <svg width="100%" height="100%" className="overflow-visible">
                                    <defs>
                                        <linearGradient id="gradientLine" x1="0" y1="0" x2="1" y2="0">
                                            <stop offset="0%" stopColor="#6366f1" />
                                            <stop offset="100%" stopColor="#ec4899" />
                                        </linearGradient>
                                    </defs>
                                    
                                    {/* Connecting Lines */}
                                    <path
                                        d={evolutionData.map((pt, i) => {
                                            const x = (i / (evolutionData.length - 1)) * 100;
                                            const y = 100 - ((pt.value - 1) / (maxEvaluationValue - 1)) * 100;
                                            return `${i === 0 ? 'M' : 'L'} ${x}% ${y}%`;
                                        }).join(' ')}
                                        fill="none"
                                        stroke="url(#gradientLine)"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />

                                    {/* Data Points */}
                                    {evolutionData.map((pt, i) => {
                                        const x = (i / (evolutionData.length - 1)) * 100;
                                        const y = 100 - ((pt.value - 1) / (maxEvaluationValue - 1)) * 100;
                                        return (
                                            <g key={pt.id}>
                                                <circle 
                                                    cx={`${x}%`} 
                                                    cy={`${y}%`} 
                                                    r="6" 
                                                    fill="white" 
                                                    stroke={pt.color} 
                                                    strokeWidth="3"
                                                    className="cursor-pointer hover:r-8 transition-all"
                                                    onMouseEnter={(e) => {
                                                        const rect = e.currentTarget.getBoundingClientRect();
                                                        setTooltipCoords({ x: rect.left + window.scrollX + 5, y: rect.top + window.scrollY });
                                                        setHoveredChartPoint(pt);
                                                    }}
                                                    onMouseLeave={() => setHoveredChartPoint(null)}
                                                />
                                            </g>
                                        );
                                    })}
                                </svg>
                                
                                {/* X Axis Labels */}
                                <div className="absolute top-full w-full flex justify-between mt-2 text-xs text-slate-500">
                                    {evolutionData.map((pt, i) => (
                                        <div key={i} className="text-center" style={{ position: 'absolute', left: `${(i / (evolutionData.length - 1)) * 100}%`, transform: 'translateX(-50%)' }}>
                                            {pt.dateLabel}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                        <p className="text-slate-500">Dados insuficientes para gerar o gráfico. É necessário pelo menos duas sessões avaliadas.</p>
                    </div>
                )}
            </div>
        )}
      </div>
    </ModuleContainer>
  );
};

export default ElectronicHealthRecord;
