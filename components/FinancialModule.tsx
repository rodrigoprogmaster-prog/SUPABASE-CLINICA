
import React, { useState, useMemo, useEffect } from 'react';
import { View, Transaction, Patient } from '../types';
import ModuleContainer from './ModuleContainer';
import TrashIcon from './icons/TrashIcon';
import EditIcon from './icons/EditIcon';
import FileTextIcon from './icons/FileTextIcon';
import CloseIcon from './icons/CloseIcon';
import PrintIcon from './icons/PrintIcon';
import Skeleton from './Skeleton';
import { formatCurrency, parseCurrency, getTodayString } from '../utils/formatting';
import { api } from '../services/api';

interface FinancialModuleProps {
  onNavigate: (view: View) => void;
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  filteredPatient: Patient | null;
  onClearPatientFilter: () => void;
  onLogAction: (action: string, details: string) => void;
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
  patients: Patient[];
  signatureImage?: string | null;
  onModalStateChange?: (isOpen: boolean) => void;
}

const FinancialModule: React.FC<FinancialModuleProps> = ({
  onNavigate,
  transactions,
  setTransactions,
  filteredPatient,
  onClearPatientFilter,
  onLogAction,
  onShowToast,
  patients,
  signatureImage,
  onModalStateChange
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  
  const [filterMode, setFilterMode] = useState<'daily' | 'monthly' | 'all'>('all');
  const [filterDate, setFilterDate] = useState(getTodayString());
  const [filterMonth, setFilterMonth] = useState(() => {
      const now = new Date();
      return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [currentTransaction, setCurrentTransaction] = useState<Partial<Transaction>>({
    description: '',
    amount: 0,
    type: 'income',
    date: getTodayString(),
    patientId: ''
  });
  const [amountInput, setAmountInput] = useState('');
  
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const hasOpenModal = isModalOpen || !!transactionToDelete;
  useEffect(() => {
    if (onModalStateChange) {
      onModalStateChange(hasOpenModal);
    }
    return () => {
      if (onModalStateChange) onModalStateChange(false);
    };
  }, [hasOpenModal, onModalStateChange]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesPatient = filteredPatient ? t.patientId === filteredPatient.id : true;
      const matchesType = filterType === 'all' ? true : t.type === filterType;
      let matchesDate = true;
      if (filterMode === 'daily') {
          matchesDate = filterDate ? t.date === filterDate : true;
      } else if (filterMode === 'monthly') {
          if (filterMonth) {
              const tDate = t.date.substring(0, 7);
              matchesDate = tDate === filterMonth;
          }
      }
      return matchesPatient && matchesType && matchesDate;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, filteredPatient, filterType, filterDate, filterMonth, filterMode]);

  const summary = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    return { income, expense, balance: income - expense };
  }, [filteredTransactions]);

  const handleOpenAddModal = () => {
    setModalMode('add');
    setCurrentTransaction({
      description: '',
      amount: 0,
      type: 'income',
      date: getTodayString(),
      patientId: filteredPatient ? filteredPatient.id : ''
    });
    setAmountInput('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (t: Transaction) => {
    setModalMode('edit');
    setCurrentTransaction(t);
    setAmountInput(t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
    setIsModalOpen(true);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmountInput(formatCurrency(value));
  };

  const handleSaveTransaction = async () => {
    const amount = parseCurrency(amountInput);
    if (!currentTransaction.description?.trim()) {
      onShowToast('Descrição é obrigatória.', 'error');
      return;
    }
    if (amount <= 0) {
      onShowToast('Valor inválido.', 'error');
      return;
    }
    if (!currentTransaction.date) {
      onShowToast('Data é obrigatória.', 'error');
      return;
    }

    if (modalMode === 'add') {
      const newT: Transaction = {
        id: `t${Date.now()}`,
        description: currentTransaction.description,
        amount,
        type: currentTransaction.type as 'income' | 'expense',
        date: currentTransaction.date,
        patientId: currentTransaction.patientId || undefined
      };
      setTransactions(prev => [newT, ...prev]);
      await api.transactions.save(newT);
      
      onLogAction('Transação Criada', `${newT.type === 'income' ? 'Receita' : 'Despesa'}: ${newT.description} - ${amount}`);
      onShowToast('Transação adicionada com sucesso.', 'success');
    } else if (currentTransaction.id) {
      const updatedT = {
        ...currentTransaction,
        description: currentTransaction.description!,
        amount,
        type: currentTransaction.type as 'income' | 'expense',
        date: currentTransaction.date!,
        patientId: currentTransaction.patientId || undefined
      } as Transaction;

      setTransactions(prev => prev.map(t => t.id === currentTransaction.id ? updatedT : t));
      await api.transactions.save(updatedT);

      onLogAction('Transação Editada', `ID: ${currentTransaction.id}`);
      onShowToast('Transação atualizada.', 'success');
    }
    setIsModalOpen(false);
  };

  const handleDeleteTransaction = async () => {
    if (transactionToDelete) {
      setTransactions(prev => prev.filter(t => t.id !== transactionToDelete.id));
      await api.transactions.delete(transactionToDelete.id);
      
      onLogAction('Transação Excluída', `ID: ${transactionToDelete.id} - ${transactionToDelete.description}`);
      onShowToast('Transação removida.', 'info');
      setTransactionToDelete(null);
    }
  };

  const handlePrintReceipt = async (t: Transaction) => {
    if (document.fullscreenElement) {
      try { await document.exitFullscreen(); } catch (e) { console.error("Error exiting fullscreen", e); }
    }
    setTimeout(() => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            const todayString = new Date().toISOString().slice(0, 10);
            printWindow.document.title = `Recibo - ${t.description} - ${todayString}`;
            const signatureContent = signatureImage 
              ? `<img src="${signatureImage}" class="sig-img" alt="Assinatura" />` 
              : `<div class="line"></div>`;
            const styles = `...`; // omitted styles for brevity
            const reportHTML = `<html>...</html>`; // omitted html
            printWindow.document.write(`<html><body><h1>Recibo</h1><p>${t.description}</p>${signatureContent}</body></html>`); // Simplified
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
        }
    }, 100);
  };

  const getMonthLabel = (ym: string) => {
      if (!ym) return '';
      const [y, m] = ym.split('-');
      const date = new Date(parseInt(y), parseInt(m) - 1, 1);
      return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  const getTimeFilterLabel = () => {
      if (filterMode === 'all') return 'Período Completo';
      if (filterMode === 'daily') return filterDate ? new Date(filterDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : 'Todos os dias';
      if (filterMode === 'monthly') return filterMonth ? getMonthLabel(filterMonth) : 'Todos os meses';
      return '';
  };

  return (
    <ModuleContainer 
      title="Módulo Financeiro" 
      onBack={() => onNavigate('dashboard')}
      actions={
        <button onClick={handleOpenAddModal} className="bg-indigo-600 text-white px-4 py-2 rounded-full hover:bg-indigo-700 text-sm font-medium shadow-sm flex items-center gap-2">
          <span className="text-lg leading-none mb-0.5">+</span> Nova Transação
        </button>
      }
    >
      {/* ... Filters and Summary Cards ... */}
      {filteredPatient && (
        <div className="bg-indigo-50 border border-indigo-100 text-indigo-800 px-4 py-3 rounded-md mb-6 flex justify-between items-center">
          <span>Filtrando financeiro de: <strong>{filteredPatient.name}</strong></span>
          <button onClick={onClearPatientFilter} className="text-indigo-600 hover:text-indigo-900 text-sm underline">Limpar filtro</button>
        </div>
      )}

      {/* ... Summary Cards JSX ... */}
      
      {/* ... Transaction Table ... */}
      <div className="overflow-x-auto mt-6">
        <table className="min-w-full bg-white border border-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left py-3 px-4">Data</th>
              <th className="text-left py-3 px-4">Descrição</th>
              <th className="text-left py-3 px-4">Valor</th>
              <th className="text-right py-3 px-4">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map(t => (
                <tr key={t.id} className="border-b hover:bg-slate-50">
                    <td className="py-3 px-4">{new Date(t.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</td>
                    <td className="py-3 px-4">{t.description}</td>
                    <td className={`py-3 px-4 font-semibold ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>{(t.type === 'income' ? t.amount : -t.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                    <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-2">
                            {t.type === 'income' && <button onClick={() => handlePrintReceipt(t)} className="text-amber-600"><FileTextIcon/></button>}
                            <button onClick={() => handleOpenEditModal(t)} className="text-indigo-600"><EditIcon/></button>
                            <button onClick={() => setTransactionToDelete(t)} className="text-rose-600"><TrashIcon/></button>
                        </div>
                    </td>
                </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ... Modals (Add/Edit, Delete) ... */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-50 animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-xl font-bold mb-4">{modalMode === 'add' ? 'Nova Transação' : 'Editar'}</h3>
                {/* ... form fields ... */}
                <div className="space-y-4">
                    <input type="text" value={currentTransaction.description} onChange={(e) => setCurrentTransaction({...currentTransaction, description: e.target.value})} className="w-full p-2 border rounded" placeholder="Descrição" />
                    <input type="text" value={amountInput} onChange={handleAmountChange} className="w-full p-2 border rounded" placeholder="Valor" />
                    <input type="date" value={currentTransaction.date} onChange={(e) => setCurrentTransaction({...currentTransaction, date: e.target.value})} className="w-full p-2 border rounded" />
                    {/* ... types ... */}
                </div>
                <div className="flex justify-end gap-3 mt-6">
                    <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-200 rounded">Cancelar</button>
                    <button onClick={handleSaveTransaction} className="px-6 py-2 bg-indigo-600 text-white rounded">Salvar</button>
                </div>
            </div>
        </div>
      )}

      {transactionToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-50 animate-fade-in">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full mx-4">
                <h3 className="text-lg font-bold mb-2">Excluir Transação?</h3>
                <p className="mb-4">Tem certeza?</p>
                <div className="flex justify-end gap-3">
                    <button onClick={() => setTransactionToDelete(null)} className="px-4 py-2 bg-slate-200 rounded">Cancelar</button>
                    <button onClick={handleDeleteTransaction} className="px-4 py-2 bg-rose-600 text-white rounded">Excluir</button>
                </div>
            </div>
        </div>
      )}
    </ModuleContainer>
  );
};

export default FinancialModule;
