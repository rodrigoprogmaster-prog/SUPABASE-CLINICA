
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { View, ConsultationType, Patient, Appointment, SessionNote, InternalObservation, Transaction, AuditLogEntry } from '../types';
import ModuleContainer from './ModuleContainer';
import TrashIcon from './icons/TrashIcon';
import { formatCurrency, parseCurrency } from '../utils/formatting';
import { mockPatients, mockAppointments, mockNotes, mockObservations, mockTransactions, mockConsultationTypes } from '../data/mockData';
import FileTextIcon from './icons/FileTextIcon';
import DownloadIcon from './icons/DownloadIcon';
import UploadIcon from './icons/UploadIcon';
import CloseIcon from './icons/CloseIcon';
import UserIcon from './icons/UserIcon';
import CheckIcon from './icons/UserCheckIcon';
import EditIcon from './icons/EditIcon';
import { api } from '../services/api';

interface SettingsModuleProps {
  onNavigate: (view: View) => void;
  currentPassword?: string;
  onChangePassword: (newPassword: string) => void;
  consultationTypes: ConsultationType[];
  setConsultationTypes: React.Dispatch<React.SetStateAction<ConsultationType[]>>;
  
  patients: Patient[];
  appointments: Appointment[];
  notes: SessionNote[];
  observations: InternalObservation[];
  transactions: Transaction[];

  setPatients: React.Dispatch<React.SetStateAction<Patient[]>>;
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  setNotes: React.Dispatch<React.SetStateAction<SessionNote[]>>;
  setObservations: React.Dispatch<React.SetStateAction<InternalObservation[]>>;
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  auditLogs: AuditLogEntry[];
  setAuditLogs?: React.Dispatch<React.SetStateAction<AuditLogEntry[]>>;

  profileImage: string | null;
  setProfileImage: (img: string | null) => void; 
  
  signatureImage?: string | null;
  setSignatureImage?: (img: string | null) => void;

  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
  onboardingMode?: boolean;
  isMasterAccess?: boolean;
  onModalStateChange?: (isOpen: boolean) => void;
  onCompleteOnboarding?: () => void;
}

const ChevronDownIcon = () => (
  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-500 group-hover:text-indigo-600 transition-colors">
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  </div>
);

// Elegant UI Styles
const inputClass = "w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-700 font-medium transition-all focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none placeholder-slate-400 hover:border-indigo-300 shadow-sm";
const selectClass = "appearance-none w-full p-3 pr-10 border border-slate-200 rounded-xl bg-slate-50 text-slate-700 font-medium transition-all focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none cursor-pointer hover:border-indigo-300 shadow-sm";


// FIX: Export SettingsModule as a named export
export const SettingsModule: React.FC<SettingsModuleProps> = ({ 
  onNavigate, 
  currentPassword,
  onChangePassword,
  consultationTypes,
  setConsultationTypes,
  
  patients,
  appointments,
  notes,
  observations,
  transactions,

  setPatients,
  setAppointments,
  setNotes,
  setObservations,
  setTransactions,
  auditLogs,
  setAuditLogs,

  profileImage,
  setProfileImage,
  
  signatureImage,
  setSignatureImage,

  onShowToast,
  onboardingMode = false,
  isMasterAccess = false,
  onModalStateChange,
  onCompleteOnboarding
}) => {
  const [settingsTab, setSettingsTab] = useState<'profile' | 'security' | 'services' | 'data' | 'docs' | 'audit'>('profile');
  
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypePrice, setNewTypePrice] = useState('');
  const [typeErrors, setTypeErrors] = useState({ name: '', price: '' });

  const [editingTypeId, setEditingTypeId] = useState<string | null>(null);
  const [editTypeName, setEditTypeName] = useState('');
  const [editTypePrice, setEditTypePrice] = useState('');
  
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [backupPasswordInput, setBackupPasswordInput] = useState('');
  const [backupError, setBackupError] = useState('');

  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [restorePasswordInput, setRestorePasswordInput] = useState('');
  const [restoreError, setRestoreError] = useState('');
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [auditSearch, setAuditSearch] = useState('');
  const [auditDateFilter, setAuditDateFilter] = useState('');

  const MASTER_PASSWORD = '140552';
  const DEFAULT_PASSWORD = '2577';

  // Force reset tab on mode change
  useEffect(() => {
    if (onboardingMode) {
        setSettingsTab('profile');
    }
  }, [onboardingMode]);

  const hasOpenModal = isBackupModalOpen || isRestoreModalOpen;
  useEffect(() => {
    if (onModalStateChange) {
      onModalStateChange(hasOpenModal);
    }
    return () => {
      if (onModalStateChange) onModalStateChange(false);
    };
  }, [hasOpenModal, onModalStateChange]);

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();

    if (oldPassword !== currentPassword && oldPassword !== MASTER_PASSWORD && !onboardingMode) {
      onShowToast('A senha antiga está incorreta.', 'error');
      return;
    }
    if (newPassword.length < 4) {
      onShowToast('A nova senha deve ter pelo menos 4 caracteres.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      onShowToast('As novas senhas não coincidem.', 'error');
      return;
    }

    onChangePassword(newPassword);
    
    if (oldPassword === DEFAULT_PASSWORD) {
        onShowToast('Senha padrão alterada. Por favor, faça login com a nova senha.', 'success');
        if (onCompleteOnboarding) {
            setTimeout(() => {
                onCompleteOnboarding();
            }, 1500);
        }
    } else {
        onShowToast('Senha alterada com sucesso!', 'success');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
    }
  };

  const handleFinishOnboarding = () => {
      const isPasswordChanged = currentPassword !== DEFAULT_PASSWORD;
      const isProfileSet = !!profileImage;

      if (!isPasswordChanged) {
          onShowToast('É obrigatório alterar a senha padrão para continuar.', 'error');
          return;
      }

      if (!isProfileSet) {
          onShowToast('É obrigatório definir uma foto de perfil.', 'error');
          return;
      }

      if (onCompleteOnboarding) {
          onCompleteOnboarding();
      }
  };

  const handleAddConsultationType = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseCurrency(newTypePrice);
    // Removed validation checks
    const newType: ConsultationType = { id: `ct-${Date.now()}`, name: newTypeName.trim() || 'Serviço sem nome', price };
    setConsultationTypes(prev => [...prev, newType].sort((a, b) => a.name.localeCompare(b.name)));
    await api.consultationTypes.save(newType);
    
    setNewTypeName('');
    setNewTypePrice('');
    onShowToast('Tipo de consulta adicionado.', 'success');
  };

  const handleDeleteConsultationType = async (id: string) => {
    setConsultationTypes(prev => prev.filter(ct => ct.id !== id));
    await api.consultationTypes.delete(id);
    onShowToast('Tipo de consulta removido.', 'info');
  };

  const handleStartEdit = (ct: ConsultationType) => {
      setEditingTypeId(ct.id);
      setEditTypeName(ct.name);
      setEditTypePrice(ct.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
  };

  const handleCancelEdit = () => {
      setEditingTypeId(null);
      setEditTypeName('');
      setEditTypePrice('');
  };

  const handleEditPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setEditTypePrice(formatCurrency(e.target.value));
  };

  const handleSaveEdit = async (id: string) => {
      const price = parseCurrency(editTypePrice);
      // Removed validation checks

      const updatedType = { id, name: editTypeName || 'Serviço sem nome', price: price };
      setConsultationTypes(prev => prev.map(ct => ct.id === id ? updatedType : ct));
      await api.consultationTypes.save(updatedType);
      
      onShowToast('Tipo de consulta atualizado.', 'success');
      handleCancelEdit();
  };
  
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewTypePrice(formatCurrency(e.target.value));
    if(typeErrors.price) setTypeErrors(prev => ({...prev, price: ''}));
  };

  const handleTypeNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setNewTypeName(e.target.value);
      if(typeErrors.name) setTypeErrors(prev => ({...prev, name: ''}));
  };

  const handleLoadMockData = () => {
      setPatients(mockPatients);
      setAppointments(mockAppointments);
      setNotes(mockNotes);
      setObservations(mockObservations);
      setTransactions(mockTransactions);
      setConsultationTypes(prev => {
          const existingIds = new Set(prev.map(ct => ct.id));
          const newTypes = mockConsultationTypes.filter(ct => !existingIds.has(ct.id));
          return [...prev, ...newTypes];
      });
      onShowToast('Dados de teste carregados na memória!', 'success');
      setTimeout(() => { onNavigate('dashboard'); }, 1000);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    document.documentElement.requestFullscreen().catch(() => {});
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setProfileImage(base64String);
        onShowToast('Foto de perfil atualizada.', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
      setProfileImage(null);
      onShowToast('Foto de perfil removida.', 'info');
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    document.documentElement.requestFullscreen().catch(() => {});
    const file = e.target.files?.[0];
    if (file && setSignatureImage) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setSignatureImage(base64String);
        onShowToast('Assinatura digital atualizada.', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveSignature = () => {
      if(setSignatureImage) {
          setSignatureImage(null);
          onShowToast('Assinatura digital removida.', 'info');
      }
  };

  const handleInitiateBackup = () => {
      setIsBackupModalOpen(true);
      setBackupPasswordInput('');
      setBackupError('');
  };

  const confirmBackup = (e: React.FormEvent) => {
      e.preventDefault();
      if (backupPasswordInput === currentPassword || backupPasswordInput === MASTER_PASSWORD) {
          executeBackup();
      } else {
          setBackupError('Senha incorreta.');
      }
  };

  const executeBackup = () => {
      const backupData = {
          version: "2.0",
          timestamp: new Date().toISOString(),
          patients,
          appointments,
          notes,
          observations,
          transactions,
          consultationTypes,
          auditLogs,
          settings: {
            profileImage,
            signatureImage
          }
      };

      const now = new Date();
      const dateStr = now.toLocaleDateString('pt-BR').replace(/\//g, '-');
      const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }).replace(/:/g, '-');
      const filename = `backup_completo_clinica_${dateStr}_${timeStr}.json`;

      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setIsBackupModalOpen(false);
      onShowToast('Backup completo realizado e download iniciado.', 'success');
  };

  const handleTriggerRestore = () => {
      if (fileInputRef.current) {
          fileInputRef.current.click();
      }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          setRestoreFile(file);
          setIsRestoreModalOpen(true);
          setRestorePasswordInput('');
          setRestoreError('');
          e.target.value = '';
      }
  };

  const confirmRestore = (e: React.FormEvent) => {
      e.preventDefault();
      if (restorePasswordInput === currentPassword || restorePasswordInput === MASTER_PASSWORD) {
          executeRestore();
      } else {
          setRestoreError('Senha incorreta.');
      }
  };

  const executeRestore = () => {
      if (!restoreFile) return;

      const reader = new FileReader();
      reader.onload = async (e) => {
          try {
              const content = e.target?.result as string;
              const data = JSON.parse(content);

              if (data && typeof data === 'object') {
                  if (data.patients) {
                      setPatients(data.patients);
                      for(const p of data.patients) await api.patients.save(p);
                  }
                  if (data.appointments) {
                      setAppointments(data.appointments);
                      for(const a of data.appointments) await api.appointments.save(a);
                  }
                  
                  if (data.notes) setNotes(data.notes);
                  if (data.observations) setObservations(data.observations);
                  if (data.transactions) setTransactions(data.transactions);
                  if (data.consultationTypes) setConsultationTypes(data.consultationTypes);
                  if (data.auditLogs && setAuditLogs) setAuditLogs(data.auditLogs);

                  if (data.settings) {
                      if (data.settings.profileImage !== undefined) setProfileImage(data.settings.profileImage);
                      if (data.settings.signatureImage !== undefined && setSignatureImage) setSignatureImage(data.settings.signatureImage);
                  }
                  
                  setIsRestoreModalOpen(false);
                  onShowToast('Restauração iniciada! Dados sendo enviados ao banco...', 'info');
                  setTimeout(() => onNavigate('dashboard'), 2000);
              } else {
                  setRestoreError('Arquivo de backup inválido ou corrompido.');
              }
          } catch (err) {
              setRestoreError('Erro ao processar o arquivo.');
          }
      };
      reader.readAsText(restoreFile);
  };

  const filteredAuditLogs = useMemo(() => {
      return auditLogs.filter(log => {
          const matchesSearch = log.details.toLowerCase().includes(auditSearch.toLowerCase()) || 
                                log.action.toLowerCase().includes(auditSearch.toLowerCase());
          const matchesDate = auditDateFilter ? log.timestamp.startsWith(auditDateFilter) : true;
          return matchesSearch && matchesDate;
      }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [auditLogs, auditSearch, auditDateFilter]);

  return (
    <ModuleContainer 
        title={onboardingMode ? "Configuração Inicial" : "Configurações do Sistema"} 
        onBack={() => onNavigate('dashboard')}
    >
      {/* ... Modals (Backup/Restore) ... */}
      {isBackupModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-[70] animate-fade-in">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-lg font-bold mb-4">Backup</h3>
                <p className="mb-4">Digite sua senha para confirmar o backup.</p>
                <form onSubmit={confirmBackup}>
                    <input type="password" value={backupPasswordInput} onChange={(e) => setBackupPasswordInput(e.target.value)} className={inputClass} autoFocus />
                    {backupError && <p className="text-red-500 text-xs mt-1">{backupError}</p>}
                    <div className="flex justify-end gap-3 mt-4">
                        <button type="button" onClick={() => setIsBackupModalOpen(false)} className="px-4 py-2 bg-slate-200 rounded-full text-slate-700 hover:bg-slate-300 transition-colors">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors">Baixar</button>
                    </div>
                </form>
            </div>
          </div>
      )}

      {isRestoreModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-[70] animate-fade-in">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-lg font-bold mb-4 text-slate-800">Restaurar</h3>
                <p className="mb-4 text-slate-600">Confirme a senha para restaurar o backup.</p>
                <form onSubmit={confirmRestore}>
                    <input type="password" value={restorePasswordInput} onChange={(e) => setRestorePasswordInput(e.target.value)} className={inputClass} autoFocus />
                    {restoreError && <p className="text-red-500 text-xs mt-1">{restoreError}</p>}
                    <div className="flex justify-end gap-3 mt-4">
                        <button type="button" onClick={() => setIsRestoreModalOpen(false)} className="px-4 py-2 bg-slate-200 rounded-full text-slate-700 hover:bg-slate-300 transition-colors">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-amber-600 text-white rounded-full hover:bg-amber-700 transition-colors">Restaurar</button>
                    </div>
                </form>
            </div>
          </div>
      )}

         <div className="space-y-6">
            {/* Tabs */}
            <div className="flex border-b border-slate-200 mb-6 overflow-x-auto">
                {['profile', 'security', !onboardingMode && 'services', !onboardingMode && 'data', !onboardingMode && 'docs', isMasterAccess && !onboardingMode && 'audit'].filter(Boolean).map(tab => (
                    <button 
                        key={tab as string}
                        onClick={() => setSettingsTab(tab as any)}
                        className={`py-2 px-4 font-medium text-sm border-b-2 whitespace-nowrap capitalize ${settingsTab === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'}`}
                    >
                        {tab === 'profile' ? 'Perfil' : tab === 'security' ? 'Segurança' : tab === 'services' ? 'Serviços' : tab === 'data' ? 'Dados' : tab === 'docs' ? 'Documentação' : 'Logs'}
                    </button>
                ))}
            </div>

            {/* Profile Tab */}
            {settingsTab === 'profile' && (
                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 animate-fade-in">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Foto de Perfil</h3>
                    <div className="flex items-center gap-6">
                        <div className="h-24 w-24 rounded-full bg-slate-100 border-2 border-slate-200 overflow-hidden relative flex items-center justify-center">
                            {profileImage ? (
                                <img src={profileImage} alt="Perfil" className="h-full w-full object-cover" />
                            ) : (
                                <UserIcon className="w-12 h-12 text-slate-300" />
                            )}
                        </div>
                        <div>
                            <input type="file" id="profile-upload" accept="image/*" onChange={handleImageUpload} className="hidden" />
                            <div className="flex gap-3">
                                <label htmlFor="profile-upload" className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium cursor-pointer">Carregar Foto</label>
                                {profileImage && <button onClick={handleRemoveImage} className="px-4 py-2 bg-rose-50 text-rose-700 rounded-full text-sm font-medium">Remover</button>}
                            </div>
                        </div>
                    </div>
                    {/* Signature */}
                    <div className="mt-8 border-t border-slate-100 pt-6">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">Assinatura Digital</h3>
                        <div className="flex items-center gap-6">
                            <div className="w-64 h-24 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center overflow-hidden">
                                {signatureImage ? <img src={signatureImage} alt="Assinatura" className="h-full w-auto object-contain p-2" /> : <span className="text-slate-400 text-xs">Sem assinatura</span>}
                            </div>
                            <div>
                                <input type="file" id="signature-upload" accept="image/*" onChange={handleSignatureUpload} className="hidden" />
                                <div className="flex gap-3">
                                    <label htmlFor="signature-upload" className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-full text-sm font-medium cursor-pointer">Carregar</label>
                                    {signatureImage && <button onClick={handleRemoveSignature} className="px-4 py-2 bg-rose-50 text-rose-700 rounded-full text-sm font-medium">Remover</button>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Security Tab */}
            {settingsTab === 'security' && (
                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 animate-fade-in">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Alterar Senha</h3>
                    <form onSubmit={handlePasswordChange} className="space-y-5">
                        {!onboardingMode && (
                            <div>
                                <label htmlFor="old-password" className="block text-sm font-medium text-slate-700 mb-1">Senha Antiga</label>
                                <input
                                    type="password"
                                    id="old-password"
                                    value={oldPassword}
                                    onChange={(e) => setOldPassword(e.target.value)}
                                    className={inputClass}
                                />
                            </div>
                        )}
                        <div>
                            <label htmlFor="new-password" className="block text-sm font-medium text-slate-700 mb-1">Nova Senha</label>
                            <input
                                type="password"
                                id="new-password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label htmlFor="confirm-password" className="block text-sm font-medium text-slate-700 mb-1">Confirmar Nova Senha</label>
                            <input
                                type="password"
                                id="confirm-password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className={inputClass}
                            />
                        </div>
                        <div className="flex justify-end pt-4 border-t border-slate-100">
                            {onboardingMode ? (
                                <button type="submit" className="px-6 py-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm font-medium">
                                    Salvar Senha
                                </button>
                            ) : (
                                <button type="submit" className="px-6 py-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm font-medium">
                                    Alterar Senha
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            )}
            
            {/* Services Tab */}
            {settingsTab === 'services' && !onboardingMode && (
                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 animate-fade-in">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Gerenciar Tipos de Consulta</h3>
                    <p className="text-slate-600 mb-6">Adicione, edite ou remova os tipos de consulta oferecidos e seus respectivos valores.</p>

                    <div className="mb-8 p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <h4 className="font-semibold text-slate-700 mb-3">Adicionar Novo Tipo</h4>
                        <form onSubmit={handleAddConsultationType} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                            <div className="md:col-span-2">
                                <label htmlFor="newTypeName" className="block text-sm font-medium text-slate-700 mb-1">Nome do Serviço</label>
                                <input
                                    type="text"
                                    id="newTypeName"
                                    value={newTypeName}
                                    onChange={handleTypeNameChange}
                                    className={inputClass}
                                    placeholder="Ex: Sessão Individual"
                                />
                                {typeErrors.name && <p className="text-red-500 text-xs mt-1">{typeErrors.name}</p>}
                            </div>
                            <div>
                                <label htmlFor="newTypePrice" className="block text-sm font-medium text-slate-700 mb-1">Valor</label>
                                <input
                                    type="text"
                                    id="newTypePrice"
                                    value={newTypePrice}
                                    onChange={handlePriceChange}
                                    className={inputClass}
                                    placeholder="R$ 0,00"
                                    inputMode="numeric"
                                />
                                {typeErrors.price && <p className="text-red-500 text-xs mt-1">{typeErrors.price}</p>}
                            </div>
                            <div className="md:col-span-3 flex justify-end">
                                <button type="submit" className="px-6 py-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm font-medium">
                                    Adicionar Serviço
                                </button>
                            </div>
                        </form>
                    </div>

                    <h4 className="font-semibold text-slate-700 mb-3">Serviços Cadastrados</h4>
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white border border-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-slate-600">Serviço</th>
                                    <th className="text-right py-3 px-4 uppercase font-semibold text-sm text-slate-600">Valor</th>
                                    <th className="text-right py-3 px-4 uppercase font-semibold text-sm text-slate-600">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {consultationTypes.length > 0 ? (
                                    consultationTypes.map(ct => (
                                        <tr key={ct.id} className="border-b border-slate-200 hover:bg-slate-50">
                                            <td className="py-3 px-4">
                                                {editingTypeId === ct.id ? (
                                                    <input 
                                                        type="text" 
                                                        value={editTypeName} 
                                                        onChange={(e) => setEditTypeName(e.target.value)} 
                                                        className="p-1 border rounded w-full"
                                                    />
                                                ) : (
                                                    <span className="font-medium text-slate-800">{ct.name}</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                {editingTypeId === ct.id ? (
                                                    <input 
                                                        type="text" 
                                                        value={editTypePrice} 
                                                        onChange={handleEditPriceChange} 
                                                        className="p-1 border rounded w-full text-right"
                                                        inputMode="numeric"
                                                    />
                                                ) : (
                                                    <span className="font-semibold text-emerald-600">
                                                        {ct.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <div className="flex justify-end gap-3">
                                                    {editingTypeId === ct.id ? (
                                                        <>
                                                            <button 
                                                                onClick={() => handleSaveEdit(ct.id)} 
                                                                className="text-emerald-600 hover:text-emerald-800 p-1 rounded-full hover:bg-emerald-50"
                                                                title="Salvar"
                                                            >
                                                                <CheckIcon />
                                                            </button>
                                                            <button 
                                                                onClick={handleCancelEdit} 
                                                                className="text-slate-600 hover:text-slate-800 p-1 rounded-full hover:bg-slate-50"
                                                                title="Cancelar Edição"
                                                            >
                                                                <CloseIcon />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button 
                                                                onClick={() => handleStartEdit(ct)} 
                                                                className="text-indigo-600 hover:text-indigo-800 p-1 rounded-full hover:bg-indigo-50"
                                                                title="Editar"
                                                            >
                                                                <EditIcon />
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDeleteConsultationType(ct.id)} 
                                                                className="text-rose-600 hover:text-rose-800 p-1 rounded-full hover:bg-rose-50"
                                                                title="Excluir"
                                                            >
                                                                <TrashIcon />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={3} className="text-center py-8 text-slate-500">
                                            Nenhum tipo de consulta cadastrado.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Data Tab */}
            {settingsTab === 'data' && !onboardingMode && (
                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 animate-fade-in">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Gerenciador de Dados</h3>
                    <p className="text-slate-600 mb-6">Mantenha seus dados seguros com backups e restaurações. Você também pode carregar dados de teste.</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Backup Section */}
                        <div className="bg-slate-50 p-5 rounded-lg border border-slate-200">
                            <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                <DownloadIcon /> Fazer Backup
                            </h4>
                            <p className="text-sm text-slate-600 mb-4">
                                Baixe um arquivo JSON com todos os dados do sistema para guardar em segurança. Requer confirmação de senha.
                            </p>
                            <button 
                                onClick={handleInitiateBackup}
                                className="w-full px-5 py-2.5 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm font-medium flex items-center justify-center gap-2"
                            >
                                <DownloadIcon /> Baixar Backup
                            </button>
                        </div>

                        {/* Restore Section */}
                        <div className="bg-slate-50 p-5 rounded-lg border border-slate-200">
                            <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                <UploadIcon /> Restaurar Backup
                            </h4>
                            <p className="text-sm text-slate-600 mb-4">
                                Carregue um arquivo de backup JSON para restaurar os dados do sistema. Esta ação irá sobrescrever os dados atuais.
                            </p>
                            <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept=".json" className="hidden" />
                            <button 
                                onClick={handleTriggerRestore}
                                className="w-full px-5 py-2.5 rounded-full bg-amber-600 text-white hover:bg-amber-700 transition-colors shadow-sm font-medium flex items-center justify-center gap-2"
                            >
                                <UploadIcon /> Carregar e Restaurar
                            </button>
                        </div>
                    </div>

                    {/* Load Mock Data */}
                    <div className="mt-8 border-t border-slate-100 pt-6">
                        <h4 className="font-semibold text-slate-700 mb-3">Dados de Teste</h4>
                        <p className="text-sm text-slate-600 mb-4">
                            Carregue um conjunto de dados de exemplo para testar as funcionalidades do sistema. 
                            <span className="font-bold text-rose-600"> Esta ação irá misturar com dados existentes e não é recomendada em uso normal.</span>
                        </p>
                        <button 
                            onClick={handleLoadMockData}
                            className="px-6 py-2.5 rounded-full bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors font-medium"
                        >
                            Carregar Dados de Teste
                        </button>
                    </div>
                </div>
            )}

            {/* Documentation Tab */}
            {settingsTab === 'docs' && !onboardingMode && (
                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 animate-fade-in">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Documentação</h3>
                    <div className="text-slate-600 space-y-4">
                        <p>
                            Aqui você encontrará informações detalhadas sobre como usar o sistema, 
                            dicas e as políticas de privacidade.
                        </p>
                        <ul className="list-disc list-inside space-y-1">
                            <li>Manual do Usuário</li>
                            <li>Perguntas Frequentes</li>
                            <li>Termos de Serviço</li>
                            <li>Política de Privacidade</li>
                        </ul>
                        <button onClick={() => onNavigate('help')} className="text-indigo-600 hover:text-indigo-800 font-medium text-sm mt-4 inline-flex items-center gap-2">
                            <FileTextIcon className="w-4 h-4"/> Acessar Central de Ajuda Completa
                        </button>
                    </div>
                </div>
            )}

            {/* Audit Log Tab (Master Access Only) */}
            {settingsTab === 'audit' && isMasterAccess && !onboardingMode && setAuditLogs && (
                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 animate-fade-in">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Logs de Auditoria</h3>
                    <p className="text-slate-600 mb-6">Registre e visualize todas as ações importantes realizadas no sistema.</p>

                    <div className="mb-6 flex flex-col md:flex-row gap-4">
                        <input
                            type="text"
                            placeholder="Buscar por ação ou detalhes..."
                            value={auditSearch}
                            onChange={(e) => setAuditSearch(e.target.value)}
                            className={inputClass + " flex-grow"}
                        />
                        <input
                            type="date"
                            value={auditDateFilter}
                            onChange={(e) => setAuditDateFilter(e.target.value)}
                            className={inputClass + " w-full md:w-auto"}
                        />
                         <button
                            onClick={() => { setAuditSearch(''); setAuditDateFilter(''); }}
                            className="px-4 py-2 rounded-full bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors text-sm font-medium w-full md:w-auto"
                        >
                            Limpar Filtros
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white border border-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-slate-600">Data/Hora</th>
                                    <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-slate-600">Ação</th>
                                    <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-slate-600">Detalhes</th>
                                    <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-slate-600">Usuário</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAuditLogs.length > 0 ? (
                                    filteredAuditLogs.map(log => (
                                        <tr key={log.id} className="border-b border-slate-200 hover:bg-slate-50">
                                            <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">{new Date(log.timestamp).toLocaleString('pt-BR')}</td>
                                            <td className="py-3 px-4 text-sm font-medium text-slate-700">{log.action}</td>
                                            <td className="py-3 px-4 text-sm text-slate-600 max-w-xs">{log.details}</td>
                                            <td className="py-3 px-4 text-sm text-slate-500">{log.user}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="text-center py-10 text-slate-500">
                                            Nenhum log de auditoria encontrado.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {onboardingMode && (
                <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                    <button 
                        onClick={handleFinishOnboarding}
                        className="px-8 py-3 rounded-full bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors shadow-lg"
                    >
                        Concluir Configuração
                    </button>
                </div>
            )}
        </div>
    </ModuleContainer>
  );
};
