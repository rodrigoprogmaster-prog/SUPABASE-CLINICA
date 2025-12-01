
import { Patient, Appointment, SessionNote, Transaction, InternalObservation, ConsultationType, Anamnesis } from '../types';

export const mockConsultationTypes: ConsultationType[] = [
  { id: 'ct-1', name: 'Sessão Individual', price: 150.00 },
  { id: 'ct-2', name: 'Terapia de Casal', price: 250.00 },
  { id: 'ct-3', name: 'Avaliação Inicial', price: 100.00 },
];

// Helper to create an empty anamnesis object conforming to the interface
const createEmptyAnamnesis = (): Anamnesis => ({
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
  hasCloseFriends: '', socialConsideration: '', physicalActivity: '', financialStatus: '', dailyRoutine: '',
  howFoundAnalysis: '', howFoundAnalysisOther: '', previousTherapy: '', previousTherapyDuration: '',
  mainReason: '', situationStart: '', triggeringEvent: '', expectationsAnalysis: '',
  generalObservations: '',
});

export const mockPatients: Patient[] = [
  {
    id: 'p1',
    name: 'Ana Silva',
    email: 'ana.silva@email.com',
    phone: '(11) 99999-1234',
    joinDate: '2023-01-15',
    dateOfBirth: '1985-04-12',
    address: 'Rua das Flores, 123, São Paulo - SP',
    occupation: 'Arquiteta',
    emergencyContact: { name: 'João Silva', phone: '(11) 98888-1234' },
    isActive: true,
    // Fix: Updated anamnesis structure to match the Anamnesis interface
    anamnesis: {
      ...createEmptyAnamnesis(), // Start with a complete empty anamnesis
      civilStatus: 'casado(a)',
      hasChildren: 'sim',
      numberOfChildren: 2,
      occupation: 'Arquiteta',
      educationLevel: 'graduacao',
      mothersName: 'Maria Silva',
      mothersRelationship: 'boa',
      fathersName: 'Pedro Silva',
      fathersRelationship: 'otima',
      hasSiblings: 'sim',
      numberOfSiblings: 1,
      siblingsRelationship: 'boa',
      childhoodDescription: 'boa',
      continuousMedication: 'nao',
      relevantMedicalDiagnosis: 'Nenhum',
      substanceUse_none: true,
      sleepQuality: 'ruim',
      mainSymptoms_anxiety: true,
      mainSymptoms_sadness: true,
      anxietyLevel: 'alto',
      irritabilityLevel: 'normal',
      sadnessLevel: 'alto',
      carriesGuilt: 'sim',
      carriesInjustice: 'nao',
      suicidalThoughts: 'nao',
      hasCloseFriends: 'sim',
      socialConsideration: 'expansivo(a)',
      physicalActivity: 'sim',
      financialStatus: 'estavel',
      dailyRoutine: 'Rotina de trabalho intensa, pouco tempo para lazer durante a semana.',
      howFoundAnalysis: 'indicacao',
      previousTherapy: 'nao',
      mainReason: 'Ansiedade excessiva relacionada ao trabalho e dificuldades de sono.',
      situationStart: 'Há cerca de 6 meses, após uma promoção no trabalho.',
      triggeringEvent: 'Aumento significativo da carga de trabalho e responsabilidades.',
      expectationsAnalysis: 'Espera desenvolver estratégias para lidar com a ansiedade e melhorar a qualidade do sono.',
      generalObservations: 'Paciente muito articulada, parece ter alta auto-observação. É importante explorar a dinâmica familiar, especialmente a relação com a mãe, que teve histórico de depressão pós-parto.'
    }
  },
  {
    id: 'p2',
    name: 'Carlos Souza',
    email: 'carlos.souza@email.com',
    phone: '(21) 97777-5678',
    joinDate: '2023-03-10',
    dateOfBirth: '1990-08-25',
    address: 'Av. Paulista, 1000, Apt 45, São Paulo - SP',
    occupation: 'Desenvolvedor de Software',
    emergencyContact: { name: 'Maria Souza', phone: '(21) 96666-5678' },
    isActive: true,
    // Fix: Updated anamnesis structure to match the Anamnesis interface (empty fields)
    anamnesis: createEmptyAnamnesis()
  },
  {
    id: 'p3',
    name: 'Mariana Oliveira',
    email: 'mari.oliveira@email.com',
    phone: '(31) 95555-4321',
    joinDate: '2022-11-05',
    dateOfBirth: '1978-12-01',
    address: 'Rua Augusta, 500, São Paulo - SP',
    occupation: 'Professora',
    emergencyContact: { name: 'Pedro Oliveira', phone: '(31) 94444-4321' },
    isActive: false, // Inactive patient example
    anamnesis: createEmptyAnamnesis() // Ensure inactive patients also have a valid anamnesis structure
  },
];

// Helper to get dynamic dates respecting local timezone
const getLocalISODate = (offsetDays: number = 0) => {
    const date = new Date();
    date.setDate(date.getDate() + offsetDays);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const todayStr = getLocalISODate(0);
const tomorrowStr = getLocalISODate(1);
const yesterdayStr = getLocalISODate(-1);

export const mockAppointments: Appointment[] = [
  {
    id: 'app1',
    patientId: 'p1',
    patientName: 'Ana Silva',
    date: todayStr, 
    time: '23:30', // Late time to ensure it appears in "Upcoming" regardless of current time
    status: 'scheduled',
    consultationTypeId: 'ct-1',
    price: 150.00,
    reminderSent: false,
  },
  {
    id: 'app2',
    patientId: 'p2',
    patientName: 'Carlos Souza',
    date: tomorrowStr,
    time: '10:00',
    status: 'scheduled',
    consultationTypeId: 'ct-1',
    price: 150.00,
    reminderSent: false,
  },
  {
    id: 'app3',
    patientId: 'p1',
    patientName: 'Ana Silva',
    date: yesterdayStr,
    time: '14:00',
    status: 'completed',
    consultationTypeId: 'ct-1',
    price: 150.00,
    reminderSent: true,
  },
    {
    id: 'app4',
    patientId: 'p3',
    patientName: 'Mariana Oliveira',
    date: '2023-10-15',
    time: '16:00',
    status: 'canceled',
    consultationTypeId: 'ct-1',
    price: 150.00,
    reminderSent: true,
  },
];

export const mockNotes: SessionNote[] = [
  {
    id: 'n1',
    patientId: 'p1',
    date: new Date(yesterdayStr).toISOString(),
    content: 'Paciente chegou pontual. Relatou melhora no sono após iniciar a higiene do sono discutida na última sessão. Ainda sente ansiedade antes de reuniões importantes.',
    appointmentId: 'app3'
  },
  {
    id: 'n2',
    patientId: 'p1',
    date: '2023-10-20T14:00:00.000Z',
    content: 'Primeira sessão. Estabelecemos o rapport. Paciente verbalizou suas queixas principais de forma clara.',
  }
];

export const mockObservations: InternalObservation[] = [
  {
    id: 'o1',
    patientId: 'p1',
    date: new Date(yesterdayStr).toISOString(),
    content: 'Investigar melhor a relação com a figura materna na próxima sessão. Parece haver um ponto de tensão não verbalizado.',
  }
];

export const mockTransactions: Transaction[] = [
  {
    id: 't1',
    description: 'Consulta - Ana Silva',
    amount: 150.00,
    type: 'income',
    date: yesterdayStr,
    patientId: 'p1'
  },
  {
    id: 't2',
    description: 'Aluguel Consultório',
    amount: 1200.00,
    type: 'expense',
    date: getLocalISODate(-5), // 5 days ago
  },
  {
    id: 't3',
    description: 'Consulta - Carlos Souza',
    amount: 150.00,
    type: 'income',
    date: getLocalISODate(-10),
    patientId: 'p2'
  }
];