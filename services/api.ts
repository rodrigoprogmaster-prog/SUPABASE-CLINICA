
import { supabase } from './supabase';
import { Patient, Appointment, SessionNote, InternalObservation, Transaction, ConsultationType, NotificationLog, AuditLogEntry, BlockedDay } from '../types';

// Helper genérico para buscar dados com log de erro detalhado
const fetchTable = async <T>(table: string): Promise<T[]> => {
  const { data, error } = await supabase.from(table).select('*');
  if (error) {
    // Ignorar erro de tabela inexistente (PGRST205 ou 42P01) para evitar crash/spam enquanto o DB não está atualizado
    if (error.code === 'PGRST205' || error.code === '42P01') {
        console.warn(`Tabela '${table}' não encontrada no Supabase. Retornando lista vazia.`);
        return [];
    }
    console.error(`Erro ao buscar ${table}:`, JSON.stringify(error, null, 2));
    return [];
  }
  return data as T[];
};

// Helper genérico para salvar (upsert)
const saveItem = async <T extends { id: string }>(table: string, item: T): Promise<T | null> => {
  const { data, error } = await supabase.from(table).upsert(item).select().single();
  if (error) {
    if (error.code === 'PGRST205' || error.code === '42P01') {
        console.warn(`Não foi possível salvar em '${table}': Tabela não existe.`);
        return null;
    }
    console.error(`Erro ao salvar em ${table}:`, JSON.stringify(error, null, 2));
    return null;
  }
  return data as T;
};

// Helper genérico para deletar
const deleteItem = async (table: string, id: string): Promise<boolean> => {
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) {
    if (error.code === 'PGRST205' || error.code === '42P01') {
        console.warn(`Não foi possível deletar de '${table}': Tabela não existe.`);
        return false;
    }
    console.error(`Erro ao deletar de ${table}:`, JSON.stringify(error, null, 2));
    return false;
  }
  return true;
};

export const api = {
  patients: {
    list: () => fetchTable<Patient>('patients'),
    save: (patient: Patient) => saveItem('patients', patient),
    delete: (id: string) => deleteItem('patients', id),
  },
  appointments: {
    list: () => fetchTable<Appointment>('appointments'),
    save: (app: Appointment) => saveItem('appointments', app),
    delete: (id: string) => deleteItem('appointments', id),
  },
  notes: {
    list: () => fetchTable<SessionNote>('session_notes'),
    save: (note: SessionNote) => saveItem('session_notes', note),
    delete: (id: string) => deleteItem('session_notes', id),
  },
  observations: {
    list: () => fetchTable<InternalObservation>('internal_observations'),
    save: (obs: InternalObservation) => saveItem('internal_observations', obs),
    delete: (id: string) => deleteItem('internal_observations', id),
  },
  transactions: {
    list: () => fetchTable<Transaction>('transactions'),
    save: (t: Transaction) => saveItem('transactions', t),
    delete: (id: string) => deleteItem('transactions', id),
  },
  consultationTypes: {
    list: () => fetchTable<ConsultationType>('consultation_types'),
    save: (ct: ConsultationType) => saveItem('consultation_types', ct),
    delete: (id: string) => deleteItem('consultation_types', id),
  },
  blockedDays: {
    list: () => fetchTable<BlockedDay>('blocked_days'),
    save: (day: BlockedDay) => saveItem('blocked_days', day),
    delete: (id: string) => deleteItem('blocked_days', id),
  },
  notificationLogs: {
    list: () => fetchTable<NotificationLog>('notification_logs'),
    save: (log: NotificationLog) => saveItem('notification_logs', log),
  },
  auditLogs: {
    list: () => fetchTable<AuditLogEntry>('audit_logs'),
    save: (log: AuditLogEntry) => saveItem('audit_logs', log),
  },
  settings: {
    get: async (key: string) => {
        const { data, error } = await supabase.from('app_settings').select('value').eq('key', key).single();
        if (error) {
             if (error.code === 'PGRST116') return null; // Não encontrado
             if (error.code === 'PGRST205' || error.code === '42P01') {
                 console.warn(`Tabela 'app_settings' não encontrada.`);
                 return null;
             }
             console.error(`Erro ao buscar config ${key}:`, JSON.stringify(error, null, 2));
        }
        return data?.value || null;
    },
    set: async (key: string, value: any) => {
        const { error } = await supabase.from('app_settings').upsert({ key, value });
        if (error) {
            if (error.code === 'PGRST205' || error.code === '42P01') {
                 console.warn(`Tabela 'app_settings' não encontrada. Não foi possível salvar.`);
                 return;
            }
            console.error(`Erro ao salvar config ${key}:`, JSON.stringify(error, null, 2));
        }
    }
  }
};
