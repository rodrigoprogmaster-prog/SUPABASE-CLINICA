
import React, { useState, useMemo, useEffect } from 'react';
import { View, Patient, Appointment } from '../types';
import ModuleContainer from './ModuleContainer';
import TrashIcon from './icons/TrashIcon';
import TooltipIcon from './icons/TooltipIcon';
import MoneyIcon from './icons/MoneyIcon';
import FileTextIcon from './icons/FileTextIcon';
import UserXIcon from './icons/UserXIcon';
import UserCheckIcon from './icons/UserCheckIcon';
import Skeleton from './Skeleton';
import CloseIcon from './icons/CloseIcon';
import { api } from '../services/api';

interface PatientManagementProps {
  onNavigate: (view: View) => void;
  onViewPEP: (patientId: string, isConsultation?: boolean, showStartButton?: boolean) => void;
  onViewFinancials: (patientId: string) => void;
  patients: Patient[];
  setPatients: React.Dispatch<React.SetStateAction<Patient[]>>;
  appointments: Appointment[];
  onLogAction: (action: string, details: string) => void;
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
  onModalStateChange?: (isOpen: boolean) => void;
}

const Tooltip: React.FC<{ text: string }> = ({ text }) => (
  <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-max max-w-xs p-2 text-xs text-white bg-slate-700 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50">
    {text}
    <svg className="absolute text-slate-700 h-2 w-full left-0 top-full" x="0px" y="0px" viewBox="0 0 255 255">
      <polygon className="fill-current" points="0,0 127.5,127.5 255,0"/>
    </svg>
  </span>
);

const initialFormData = {
    id: '', name: '', email: '', phone: '', dateOfBirth: '', address: '', occupation: '',
    internalNotes: '', emergencyName: '', emergencyPhone: ''
};

const formatPhoneNumber = (value: string) => {
  if (!value) return '';
  let digits = value.replace(/\D/g, ''); 

  if (digits.length > 11) {
    digits = digits.substring(0, 11);
  }

  let formatted = '';
  if (digits.length > 0) {
    formatted += `(${digits.substring(0, 2)}`;
  }
  if (digits.length >= 2) {
    formatted += `)`;
  }
  if (digits.length > 2) {
    formatted += ` ${digits.substring(2, 3)}`;
  }
  if (digits.length > 3) {
    formatted += digits.substring(3, 7);
  }
  if (digits.length > 7) {
    formatted += `-${digits.substring(7, 11)}`;
  }
  return formatted;
};

// Elegant UI Style
const inputClass = "w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-700 font-medium transition-all focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none placeholder-slate-400 hover:border-indigo-300 shadow-sm";
const textareaClass = "w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-700 font-medium transition-all focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none placeholder-slate-400 hover:border-indigo-300 shadow-sm resize-none";

const PatientManagement: React.FC<PatientManagementProps> = ({ 
  onNavigate, onViewPEP, onViewFinancials, patients, setPatients, appointments, onLogAction, onShowToast, onModalStateChange 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  const [patientToToggleStatus, setPatientToToggleStatus] = useState<Patient | null>(null);
  const [formStep, setFormStep] = useState<'details' | 'confirm'>('details');
  const [showInactive, setShowInactive] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState(initialFormData);
  const [isLoading, setIsLoading] = useState(true);

  const [errors, setErrors] = useState({ 
    name: '', email: '', phone: '', dateOfBirth: '', address: '', occupation: ''
  });

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isModalOpen) {
        setTimeout(() => {
            setFormStep('details');
            setFormData(initialFormData);
            setErrors({ name: '', email: '', phone: '', dateOfBirth: '', address: '', occupation: '' });
        }, 300);
    }
  }, [isModalOpen]);

  const hasOpenModal = isModalOpen || !!patientToDelete || !!patientToToggleStatus;
  useEffect(() => {
    if (onModalStateChange) {
      onModalStateChange(hasOpenModal);
    }
    return () => {
      if (onModalStateChange) onModalStateChange(false);
    };
  }, [hasOpenModal, onModalStateChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    let processedValue = value;

    if (name === 'phone' || name === 'emergencyPhone') {
      processedValue = formatPhoneNumber(value);
    }

    setFormData(prev => ({ ...prev, [name]: processedValue }));
    if(errors[name as keyof typeof errors]) {
      setErrors(prev => ({...prev, [name]: ''}));
    }
  };

  const validateForm = () => {
    // Validation removed as requested. Always return true.
    setErrors({ name: '', email: '', phone: '', dateOfBirth: '', address: '', occupation: '' });
    return true;
  };

  const handleProceedToConfirm = () => {
    validateForm(); // Just clears errors if any
    setFormStep('confirm');
  };

  const handleConfirmAndSave = async () => {
    let patientData: Patient;
    
    if (modalMode === 'add') {
      patientData = {
        id: `p${Date.now()}`,
        name: formData.name, email: formData.email, phone: formData.phone, dateOfBirth: formData.dateOfBirth,
        address: formData.address, occupation: formData.occupation,
        emergencyContact: { name: formData.emergencyName, phone: formData.emergencyPhone },
        internalNotes: formData.internalNotes,
        joinDate: new Date().toISOString().split('T')[0], isActive: true,
      };
      
      setPatients(prev => [patientData, ...prev].sort((a,b) => a.name.localeCompare(b.name)));
      await api.patients.save(patientData);
      
      onLogAction('Cadastro Criado', `Paciente: ${patientData.name}`);
      onShowToast('Paciente cadastrado com sucesso!', 'success');
    } else {
        const originalPatient = patients.find(p => p.id === formData.id);
        const updatedPatient: Patient = {
            ...originalPatient!,
            name: formData.name, email: formData.email, phone: formData.phone, dateOfBirth: formData.dateOfBirth,
            address: formData.address, occupation: formData.occupation,
            emergencyContact: { name: formData.emergencyName, phone: formData.emergencyPhone },
            internalNotes: formData.internalNotes,
        };

        setPatients(prev => prev.map(p => p.id === formData.id ? updatedPatient : p));
        await api.patients.save(updatedPatient);
        
        let changes = [];
        if(originalPatient) {
             if(originalPatient.email !== formData.email) changes.push(`Email`);
             if(originalPatient.phone !== formData.phone) changes.push(`Tel`);
        }
        onLogAction('Cadastro Atualizado', `Paciente: ${formData.name}. ${changes.join(', ')}`);
        onShowToast('Dados do paciente atualizados.', 'success');
    }
    setIsModalOpen(false);
  };
  
  const openAddModal = () => {
      setModalMode('add');
      setIsModalOpen(true);
  };

  const openEditModal = (patient: Patient) => {
    setModalMode('edit');
    setFormData({
        id: patient.id,
        name: patient.name,
        email: patient.email,
        phone: patient.phone, 
        dateOfBirth: patient.dateOfBirth,
        address: patient.address,
        occupation: patient.occupation,
        internalNotes: patient.internalNotes || '',
        emergencyName: patient.emergencyContact?.name || '',
        emergencyPhone: patient.emergencyContact?.phone || '',
    });
    setIsModalOpen(true);
  };

  const handleDeletePatient = async () => {
    if (patientToDelete) {
        setPatients(prev => prev.filter(p => p.id !== patientToDelete.id));
        await api.patients.delete(patientToDelete.id);
        
        onLogAction('Paciente Excluído', `Nome: ${patientToDelete.name}, ID: ${patientToDelete.id}`);
        onShowToast('Paciente excluído com sucesso.', 'success');
        setPatientToDelete(null);
    }
  };

  const handleTogglePatientStatus = async () => {
    if (patientToToggleStatus) {
      const newStatus = !patientToToggleStatus.isActive;
      const updatedPatient = { ...patientToToggleStatus, isActive: newStatus };
      
      setPatients(prev => prev.map(p => 
        p.id === patientToToggleStatus.id ? updatedPatient : p
      ));
      await api.patients.save(updatedPatient);

      const statusText = newStatus ? 'Ativo' : 'Inativo';
      onLogAction('Status Paciente Alterado', `Paciente: ${patientToToggleStatus.name}. Novo Status: ${statusText}`);
      onShowToast(`Status alterado para ${statusText}.`, 'success');
      setPatientToToggleStatus(null);
    }
  };

  const displayedPatients = useMemo(() => 
    patients.filter(p => {
      const matchesStatus = showInactive ? true : p.isActive;
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    })
  , [patients, showInactive, searchTerm]);

  const patientHasAppointments = (patientId: string) => {
    return appointments.some(app => app.patientId === patientId);
  };

  return (
    <ModuleContainer title="Gestão de Pacientes" onBack={() => onNavigate('dashboard')}>
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative w-full md:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
            </div>
            <input 
                type="text"
                placeholder="Buscar paciente por nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={inputClass + " pl-10"} // Apply inputClass
            />
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full md:w-auto">
            <div className="flex items-center gap-3 bg-slate-100 px-4 py-2 rounded-full border border-slate-200">
                <label htmlFor="show_inactive" className="font-medium text-slate-600 text-sm cursor-pointer">Mostrar inativos</label>
                <input 
                    id="show_inactive"
                    type="checkbox" 
                    checked={showInactive}
                    onChange={(e) => setShowInactive(e.target.checked)}
                    // Tailwind custom checkbox classes
                    className="appearance-none relative w-4 h-4 rounded-sm border border-slate-400 cursor-pointer bg-white 
                                checked:bg-indigo-600 checked:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 
                                transition-all duration-200
                                before:content-[''] before:absolute before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 
                                before:w-2 before:h-2 before:bg-white before:rounded-full before:opacity-0 
                                checked:before:opacity-100 checked:before:scale-100 before:transition-all before:duration-200"
                />
            </div>
            <button
            onClick={openAddModal}
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-full hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm text-sm font-semibold w-full sm:w-auto justify-center"
            >
            <span className="text-lg leading-none mb-0.5">+</span> Adicionar Paciente
            </button>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-[60] transition-opacity duration-300 animate-fade-in">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 transform transition-transform duration-300 animate-slide-up max-h-[90vh] overflow-y-auto flex flex-col" onClick={(e) => e.stopPropagation()}>
            
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50 rounded-t-lg">
                <div>
                    <h3 className="text-xl font-bold text-slate-800">{modalMode === 'add' ? 'Cadastrar Novo Paciente' : 'Editar Cadastro'}</h3>
                    <p className="text-sm text-slate-500 mt-1">Preencha os dados abaixo para {modalMode === 'add' ? 'incluir um novo' : 'atualizar o'} registro.</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-full hover:bg-slate-200 text-slate-500 transition-colors">
                    <CloseIcon />
                </button>
            </div>

            <div className="p-6 sm:p-8">
            {formStep === 'details' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                  <div className="sm:col-span-2">
                    <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-1">Nome Completo</label>
                    <input 
                        type="text" id="name" name="name" 
                        value={formData.name} onChange={handleInputChange} 
                        className={inputClass}
                        placeholder="Ex: Maria da Silva"
                    />
                    {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                  </div>

                   <div>
                     <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1">E-mail</label>
                    <input 
                        type="email" id="email" name="email" 
                        value={formData.email} onChange={handleInputChange} 
                        className={inputClass}
                        placeholder="exemplo@email.com"
                    />
                    {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-semibold text-slate-700 mb-1">Celular / WhatsApp</label>
                    <input 
                        type="tel" id="phone" name="phone" 
                        value={formData.phone} onChange={handleInputChange} 
                        placeholder="(XX) 9XXXX-XXXX" 
                        className={inputClass}
                    />
                    {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                  </div>

                  <div>
                    <label htmlFor="dateOfBirth" className="block text-sm font-semibold text-slate-700 mb-1">Data de Nascimento</label>
                    <input 
                        type="date" id="dateOfBirth" name="dateOfBirth" 
                        max={new Date().toISOString().split('T')[0]} 
                        value={formData.dateOfBirth} onChange={handleInputChange} 
                        className={inputClass}
                    />
                    {errors.dateOfBirth && <p className="text-red-500 text-sm mt-1">{errors.dateOfBirth}</p>}
                  </div>
                   <div>
                    <label htmlFor="occupation" className="block text-sm font-semibold text-slate-700 mb-1">Profissão</label>
                    <input 
                        type="text" id="occupation" name="occupation" 
                        value={formData.occupation} onChange={handleInputChange} 
                        className={inputClass}
                    />
                    {errors.occupation && <p className="text-red-500 text-sm mt-1">{errors.occupation}</p>}
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="address" className="block text-sm font-semibold text-slate-700 mb-1">Endereço Completo</label>
                    <input 
                        type="text" id="address" name="address" 
                        value={formData.address} onChange={handleInputChange} 
                        className={inputClass}
                        placeholder="Rua, Número, Bairro, Cidade"
                    />
                    {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
                  </div>

                  {/* Emergency Contact Section */}
                  <div className="sm:col-span-2 border-t border-slate-100 pt-4 mt-2">
                      <h5 className="text-sm font-bold text-indigo-900 mb-3">Contato de Emergência</h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                          <div>
                              <label htmlFor="emergencyName" className="block text-sm font-semibold text-slate-700 mb-1">Nome do Contato</label>
                              <input 
                                  type="text" id="emergencyName" name="emergencyName" 
                                  value={formData.emergencyName} onChange={handleInputChange} 
                                  className={inputClass}
                                  placeholder="Nome do familiar/amigo"
                              />
                          </div>
                          <div>
                              <label htmlFor="emergencyPhone" className="block text-sm font-semibold text-slate-700 mb-1">Telefone de Emergência</label>
                              <input 
                                  type="tel" id="emergencyPhone" name="emergencyPhone" 
                                  value={formData.emergencyPhone} onChange={handleInputChange} 
                                  className={inputClass}
                                  placeholder="(XX) 9XXXX-XXXX" 
                              />
                          </div>
                      </div>
                  </div>
                  
                  <div className="sm:col-span-2">
                    <label htmlFor="internalNotes" className="flex items-center text-sm font-semibold text-slate-700 mb-1">
                        Notas Internas <span className="font-normal text-slate-400 ml-2 text-xs">(Opcional - Visível apenas para você)</span>
                    </label>
                    <textarea 
                        id="internalNotes" name="internalNotes" 
                        value={formData.internalNotes} onChange={handleInputChange} 
                        className={`${textareaClass} h-24`}
                    ></textarea>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-100">
                  <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors font-medium">Cancelar</button>
                  <button onClick={handleProceedToConfirm} className="px-6 py-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-colors font-medium shadow-sm">Revisar Dados</button>
                </div>
              </>
            )}

            {formStep === 'confirm' && (
               <div>
                <h4 className="text-lg font-semibold text-slate-800 mb-4">Confirme as Informações</h4>
                <div className="bg-slate-50 p-5 rounded-md border border-slate-200 space-y-3 text-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Nome</span>
                            <span className="text-slate-800 font-medium text-base">{formData.name || '-'}</span>
                        </div>
                         <div>
                            <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Data de Nascimento</span>
                            <span className="text-slate-800">{formData.dateOfBirth ? new Date(formData.dateOfBirth).toLocaleDateString('pt-BR', {timeZone:'UTC'}) : '-'}</span>
                        </div>
                        <div>
                            <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider">E-mail</span>
                            <span className="text-slate-800">{formData.email || '-'}</span>
                        </div>
                        <div>
                            <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Telefone</span>
                            <span className="text-slate-800">{formData.phone || '-'}</span>
                        </div>
                         <div>
                            <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Profissão</span>
                            <span className="text-slate-800">{formData.occupation || '-'}</span>
                        </div>
                         <div className="sm:col-span-2">
                            <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Endereço</span>
                            <span className="text-slate-800">{formData.address || '-'}</span>
                        </div>
                        
                        {(formData.emergencyName || formData.emergencyPhone) && (
                            <div className="sm:col-span-2 border-t border-slate-200 pt-3 mt-1">
                                <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Contato de Emergência</span>
                                <div className="flex gap-2 text-slate-800">
                                    <span className="font-medium">{formData.emergencyName || '-'}</span>
                                    <span>{formData.emergencyPhone ? `(${formData.emergencyPhone})` : ''}</span>
                                </div>
                            </div>
                        )}

                         <div className="sm:col-span-2">
                            <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Notas Internas</span>
                            <span className="text-slate-800 italic">{formData.internalNotes || 'Nenhuma nota adicionada.'}</span>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-100">
                  <button onClick={() => setFormStep('details')} className="px-4 py-2 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors font-medium">Voltar e Editar</button>
                  <button onClick={handleConfirmAndSave} className="px-6 py-2 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 transition-colors font-medium shadow-sm">Confirmar e Salvar</button>
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      )}
      
      {patientToToggleStatus && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-[60] animate-fade-in">
          <div className="bg-white p-6 sm:p-8 rounded-lg shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Confirmar Alteração</h3>
            <p className="text-slate-600 mb-6">
              Você tem certeza que deseja <span className="font-bold">{patientToToggleStatus.isActive ? 'INATIVAR' : 'REATIVAR'}</span> o paciente <span className="font-semibold">{patientToToggleStatus.name}</span>?
            </p>
            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setPatientToToggleStatus(null)} className="px-4 py-2 rounded-full bg-slate-200 text-slate-800 hover:bg-slate-300">Cancelar</button>
              <button onClick={handleTogglePatientStatus} className="px-4 py-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700">Sim, confirmar</button>
            </div>
          </div>
        </div>
      )}

      {patientToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-[60] animate-fade-in">
          <div className="bg-white p-6 sm:p-8 rounded-lg shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Confirmar Exclusão</h3>
            <p className="text-slate-600 mb-6">
                Você tem certeza que deseja excluir o paciente <span className="font-semibold">{patientToDelete.name}</span>? Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-3 mt-8">
                <button onClick={() => setPatientToDelete(null)} className="px-4 py-2 rounded-full bg-slate-200 text-slate-800 hover:bg-slate-300">Cancelar</button>
                <button onClick={handleDeletePatient} className="px-4 py-2 rounded-full bg-rose-600 text-white hover:bg-rose-700">Excluir Paciente</button>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto lg:overflow-visible">
        <h3 className="text-lg font-semibold text-slate-700 mb-4">Histórico de Pacientes</h3>
        <table className="min-w-full bg-white border border-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-slate-600">Nome</th>
              <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-slate-600 hidden md:table-cell">E-mail</th>
              <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-slate-600 hidden lg:table-cell">Data de Cadastro</th>
              <th className="text-center py-3 px-4 uppercase font-semibold text-sm text-slate-600">Ações</th>
            </tr>
          </thead>
          <tbody className="text-slate-700">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={`skeleton-${index}`} className="border-b border-slate-200">
                  <td className="py-3 px-4"><Skeleton className="h-4 w-3/4" /></td>
                  <td className="py-3 px-4 hidden md:table-cell"><Skeleton className="h-4 w-full" /></td>
                  <td className="py-3 px-4 hidden lg:table-cell"><Skeleton className="h-4 w-1/2" /></td>
                  <td className="py-3 px-4 text-center"><Skeleton className="h-6 w-20 mx-auto rounded-full" /></td>
                </tr>
              ))
            ) : (
              <>
                {displayedPatients.length > 0 ? (
                    displayedPatients.map((patient) => {
                    const hasAppointments = patientHasAppointments(patient.id);
                    return (
                    <tr 
                        key={patient.id} 
                        className={`border-b border-slate-200 transition-colors duration-200 hover:bg-indigo-50 cursor-pointer ${!patient.isActive ? 'bg-slate-100 text-slate-500 hover:bg-slate-200' : ''}`}
                        onClick={() => openEditModal(patient)}
                    >
                        <td className="py-3 px-4">{patient.name || 'Sem nome'}</td>
                        <td className="py-3 px-4 hidden md:table-cell">{patient.email || '-'}</td>
                        <td className="py-3 px-4 hidden lg:table-cell">{new Date(patient.joinDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</td>
                        <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-4">
                            <div className="group relative">
                            <button 
                                onClick={() => onViewPEP(patient.id)} 
                                className={`p-1 rounded-full hover:bg-slate-100 ${hasAppointments ? 'text-indigo-600 hover:text-indigo-800' : 'text-slate-400 cursor-not-allowed'}`}
                                aria-label={`Ver prontuário de ${patient.name}`}
                                disabled={!hasAppointments}
                            >
                                <FileTextIcon />
                            </button>
                            <Tooltip text={hasAppointments ? 'Ver Prontuário' : 'Nenhuma consulta registrada'} />
                            </div>
                            <div className="group relative">
                            <button onClick={() => onViewFinancials(patient.id)} className="p-1 rounded-full hover:bg-slate-100 text-emerald-600 hover:text-emerald-800" aria-label={`Ver financeiro de ${patient.name}`}><MoneyIcon /></button>
                            <Tooltip text="Ver Financeiro" />
                            </div>
                            <div className="group relative">
                            <button onClick={() => setPatientToToggleStatus(patient)} className={`p-1 rounded-full hover:bg-slate-100 ${patient.isActive ? 'text-amber-600 hover:text-amber-800' : 'text-emerald-600 hover:text-emerald-800'}`} aria-label={`${patient.isActive ? 'Inativar' : 'Reativar'} ${patient.name}`}>
                                {patient.isActive ? <UserXIcon /> : <UserCheckIcon />}
                            </button>
                            <Tooltip text={patient.isActive ? 'Inativar Paciente' : 'Reativar Paciente'} />
                            </div>
                            <div className="group relative">
                            <button onClick={() => setPatientToDelete(patient)} className="p-1 rounded-full hover:bg-slate-100 text-rose-600 hover:text-rose-800" aria-label={`Excluir ${patient.name}`}><TrashIcon /></button>
                            <Tooltip text="Excluir Paciente" />
                            </div>
                        </div>
                        </td>
                    </tr>
                    );
                    })
                ) : (
                    <tr>
                        <td colSpan={4} className="text-center py-10 text-slate-500">
                            {searchTerm ? 'Nenhum paciente encontrado com esse nome.' : 'Nenhum paciente encontrado.'}
                        </td>
                    </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>
    </ModuleContainer>
  );
};

export default PatientManagement;
