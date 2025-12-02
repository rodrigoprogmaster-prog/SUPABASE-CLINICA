
export interface Anamnesis {
  // 1. Dados Pessoais
  civilStatus: 'solteiro(a)' | 'casado(a)' | 'divorciado(a)' | 'viuvo(a)' | 'namorando' | '';
  hasChildren: 'sim' | 'nao' | '';
  numberOfChildren: number | ''; // Conditional on hasChildren = 'sim'
  hadAbortion: 'sim' | 'nao' | '';
  occupation: string;
  educationLevel: 'fundamental' | 'medio' | 'graduacao' | 'graduacao_incompleta' | 'pos_graduacao' | '';

  // 2. Histórico Familiar
  mothersName: string;
  mothersRelationship: 'pessima' | 'ruim' | 'boa' | 'otima' | '';
  fathersName: string;
  fathersRelationship: 'pessima' | 'ruim' | 'boa' | 'otima' | '';
  hasSiblings: 'sim' | 'nao' | '';
  numberOfSiblings: number | ''; // Conditional on hasSiblings = 'sim'
  siblingsRelationship: 'pessima' | 'ruim' | 'boa' | 'otima' | '';
  childhoodDescription: 'pessima' | 'ruim' | 'boa' | 'otima' | '';

  // 3. Saúde Geral
  continuousMedication: 'sim' | 'nao' | '';
  medicationsDetails: string; // Conditional on continuousMedication = 'sim'
  relevantMedicalDiagnosis: string;
  substanceUse_marijuana: boolean;
  substanceUse_cocaine: boolean;
  substanceUse_alcohol: boolean;
  substanceUse_cigarette: boolean;
  substanceUse_none: boolean; // Mutually exclusive with other substance use
  sleepQuality: 'pessima' | 'ruim' | 'boa' | 'otima' | '';

  // 4. Aspectos Psicológicos e Emocionais
  mainSymptoms_sadness: boolean;
  mainSymptoms_depression: boolean;
  mainSymptoms_anxiety: boolean;
  mainSymptoms_nervousness: boolean;
  mainSymptoms_phobias: boolean;
  mainSymptoms_otherFear: string; // Conditional if mainSymptoms_phobias is true
  anxietyLevel: 'baixo' | 'normal' | 'alto' | '';
  irritabilityLevel: 'baixo' | 'normal' | 'alto' | '';
  sadnessLevel: 'baixo' | 'normal' | 'alto' | '';
  carriesGuilt: 'sim' | 'nao' | '';
  carriesInjustice: 'sim' | 'nao' | '';
  suicidalThoughts: 'sim' | 'nao' | '';
  suicidalThoughtsComment: string; // Conditional on suicidalThoughts = 'sim'

  // 5. Vida Social e Rotina
  hasCloseFriends: 'sim' | 'nao' | '';
  socialConsideration: 'expansivo(a)' | 'reservado(a)' | '';
  physicalActivity: 'sim' | 'nao' | '';
  financialStatus: 'ruim' | 'estavel' | 'boa' | 'otima' | '';
  dailyRoutine: string;

  // 6. Buscando Ajuda
  howFoundAnalysis: 'indicacao' | 'internet' | 'outro' | '';
  howFoundAnalysisOther: string; // Conditional on howFoundAnalysis = 'outro'
  previousTherapy: 'sim' | 'nao' | '';
  previousTherapyDuration: string; // Conditional on previousTherapy = 'sim'
  mainReason: string;
  situationStart: string;
  triggeringEvent: string;
  expectationsAnalysis: string;

  // 7. Observações Gerais
  generalObservations: string;
}

export interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  joinDate: string;
  dateOfBirth: string;
  address: string;
  occupation: string;
  emergencyContact: {
    name: string;
    phone: string;
  };
  anamnesis?: Anamnesis;
  internalNotes?: string; // Added internal notes field
  isActive: boolean;
}

export interface ConsultationType {
  id: string;
  name: string;
  price: number;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  time: string;
  status: 'scheduled' | 'completed' | 'canceled';
  consultationTypeId: string;
  price: number;
  reminderSent?: boolean;
}

export interface SessionNote {
  id: string;
  patientId: string;
  date: string;
  content: string;
  appointmentId?: string;
  evaluation?: 'pessimo' | 'ruim' | 'bom' | 'otimo'; // Added evaluation field
}

export interface InternalObservation {
  id: string;
  patientId: string;
  date: string;
  content: string;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
  patientId?: string;
}

export interface BlockedDay {
  id: string;
  date: string;
  reason?: string;
}

export interface NotificationLog {
  id: string;
  date: string;
  patientName: string;
  type: 'email' | 'sms' | 'both';
  status: 'sent';
  details: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string; // e.g. 'create_patient', 'update_status'
  details: string; // What changed
  user: string; // In single user system: 'Vanessa Gonçalves'
}

export interface ToastNotification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export type View = 'dashboard' | 'patients' | 'schedule' | 'pep' | 'financial' | 'admin' | 'managementDashboard' | 'settings' | 'recordsHistory' | 'help';
