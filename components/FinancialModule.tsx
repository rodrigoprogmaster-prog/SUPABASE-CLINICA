
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
import SummaryDetailsModal from './SummaryDetailsModal'; // Import SummaryDetailsModal

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

// Define valores padrão para os filtros para melhor consistência
const DEFAULT_FILTER_DATE = getTodayString();
const DEFAULT_FILTER_MONTH = `${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}`;

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
  const [filterDate, setFilterDate] = useState(DEFAULT_FILTER_DATE);
  const [filterMonth, setFilterMonth] = useState(DEFAULT_FILTER_MONTH);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [currentTransaction, setCurrentTransaction] = useState<Partial<Transaction>>({
    description: '',
    amount: 0,
    type: 'income',
    date: DEFAULT_FILTER_DATE,
    patientId: ''
  });
  const [amountInput, setAmountInput] = useState('');
  
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [isSummaryDetailsModalOpen, setIsSummaryDetailsModalOpen] = useState(false); // New state for SummaryDetailsModal

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const hasOpenModal = isModalOpen || !!transactionToDelete || isSummaryDetailsModalOpen; // Include new modal state
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
      date: DEFAULT_FILTER_DATE,
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
    // Validation checks removed to allow saving without filling all fields

    if (modalMode === 'add') {
      const newT: Transaction = {
        id: `t${Date.now()}`,
        description: currentTransaction.description || 'Sem descrição',
        amount,
        type: currentTransaction.type as 'income' | 'expense',
        date: currentTransaction.date || getTodayString(),
        patientId: currentTransaction.patientId || undefined
      };
      setTransactions(prev => [newT, ...prev]);
      await api.transactions.save(newT);
      
      onLogAction('Transação Criada', `${newT.type === 'income' ? 'Receita' : 'Despesa'}: ${newT.description} - ${amount}`);
      onShowToast('Transação adicionada com sucesso.', 'success');
    } else if (currentTransaction.id) {
      const updatedT = {
        ...currentTransaction,
        description: currentTransaction.description || 'Sem descrição',
        amount,
        type: currentTransaction.type as 'income' | 'expense',
        date: currentTransaction.date || getTodayString(),
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

  // Enhanced handlePrintReceipt for individual transactions
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
                              <p>Recebi de <strong>${patients.find(p => p.id === t.patientId)?.name || 'Cliente'}</strong></p>
                              <p>A importância de <strong>${t.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></p>
                              <p>Referente a <strong>${t.description}</strong>.</p>
                              <p>Data da transação: ${new Date(t.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</p>
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
        <div className="flex items-center gap-3">
            <button 
                onClick={() => setIsSummaryDetailsModalOpen(true)}
                className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-full hover:bg-slate-50 transition-colors text-sm font-medium shadow-sm"
            >
                <PrintIcon />
                Imprimir Relatório
            </button>
            <button onClick={handleOpenAddModal} className="bg-indigo-600 text-white px-4 py-2 rounded-full hover:bg-indigo-700 text-sm font-medium shadow-sm flex items-center gap-2">
            <span className="text-lg leading-none mb-0.5">+</span> Nova Transação
            </button>
        </div>
      }
    >
        <SummaryDetailsModal 
            isOpen={isSummaryDetailsModalOpen}
            onClose={() => setIsSummaryDetailsModalOpen(false)}
            type={'monthlyRevenue'} // Using monthlyRevenue type to represent generic financial report
            data={filteredTransactions}
            title={`Relatório Financeiro (${getTimeFilterLabel()})`}
        />

      {filteredPatient && (
        <div className="bg-indigo-50 border border-indigo-100 text-indigo-800 px-4 py-3 rounded-md mb-6 flex justify-between items-center">
          <span>Filtrando financeiro de: <strong>{filteredPatient.name}</strong></span>
          <button onClick={onClearPatientFilter} className="text-indigo-600 hover:text-indigo-900 text-sm underline">Limpar filtro</button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 mb-6 flex flex-col gap-4">
        <h3 className="text-lg font-semibold text-slate-700">Filtros de Transação</h3>
        
        {/* New Grid for filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Tipo de Transação</label>
              <div className="flex flex-wrap gap-4">
                <label className="inline-flex items-center">
                  <input 
                    type="radio" 
                    name="filterType" 
                    value="all" 
                    checked={filterType === 'all'} 
                    onChange={() => setFilterType('all')} 
                    className="form-radio text-indigo-600"
                  />
                  <span className="ml-2 text-slate-600 text-sm">Todas</span>
                </label>
                <label className="inline-flex items-center">
                  <input 
                    type="radio" 
                    name="filterType" 
                    value="income" 
                    checked={filterType === 'income'} 
                    onChange={() => setFilterType('income')} 
                    className="form-radio text-emerald-600"
                  />
                  <span className="ml-2 text-slate-600 text-sm">Receitas</span>
                </label>
                <label className="inline-flex items-center">
                  <input 
                    type="radio" 
                    name="filterType" 
                    value="expense" 
                    checked={filterType === 'expense'} 
                    onChange={() => setFilterType('expense')} 
                    className="form-radio text-rose-600"
                  />
                  <span className="ml-2 text-slate-600 text-sm">Despesas</span>
                </label>
              </div>
            </div>

            {/* Date Filter Mode */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Período</label>
              <div className="flex flex-wrap gap-4">
                <label className="inline-flex items-center">
                  <input 
                    type="radio" 
                    name="filterMode" 
                    value="all" 
                    checked={filterMode === 'all'} 
                    onChange={() => setFilterMode('all')} 
                    className="form-radio text-indigo-600"
                  />
                  <span className="ml-2 text-slate-600 text-sm">Completo</span>
                </label>
                <label className="inline-flex items-center">
                  <input 
                    type="radio" 
                    name="filterMode" 
                    value="daily" 
                    checked={filterMode === 'daily'} 
                    onChange={() => setFilterMode('daily')} 
                    className="form-radio text-indigo-600"
                  />
                  <span className="ml-2 text-slate-600 text-sm">Diário</span>
                </label>
                <label className="inline-flex items-center">
                  <input 
                    type="radio" 
                    name="filterMode" 
                    value="monthly" 
                    checked={filterMode === 'monthly'} 
                    onChange={() => setFilterMode('monthly')} 
                    className="form-radio text-indigo-600"
                  />
                  <span className="ml-2 text-slate-600 text-sm">Mensal</span>
                </label>
              </div>
            </div>

            {/* Specific Date/Month Input */}
            {(filterMode === 'daily' || filterMode === 'monthly') && (
              <div className="col-span-1 md:col-span-2 lg:col-span-1"> {/* Adjusted span for responsive flow */}
                <label htmlFor="filterDateOrMonth" className="block text-sm font-medium text-slate-700 mb-1">
                  {filterMode === 'daily' ? 'Selecione a Data' : 'Selecione o Mês'}
                </label>
                {filterMode === 'daily' && (
                  <input 
                    type="date" 
                    id="filterDateOrMonth" 
                    value={filterDate} 
                    onChange={(e) => setFilterDate(e.target.value)} 
                    className={inputClass}
                  />
                )}
                {filterMode === 'monthly' && (
                  <input 
                    type="month" 
                    id="filterDateOrMonth" 
                    value={filterMonth} 
                    onChange={(e) => setFilterMonth(e.target.value)} 
                    className={inputClass}
                  />
                )}
              </div>
            )}
        </div>

        {/* Clear Filters Button */}
        {(filterType !== 'all' || filterMode !== 'all' || (filterMode === 'daily' && filterDate !== DEFAULT_FILTER_DATE) || (filterMode === 'monthly' && filterMonth !== DEFAULT_FILTER_MONTH)) && (
            <div className="pt-4 border-t border-slate-100 mt-4">
                <button 
                    onClick={() => {
                        setFilterType('all');
                        setFilterMode('all');
                        setFilterDate(DEFAULT_FILTER_DATE);
                        setFilterMonth(DEFAULT_FILTER_MONTH);
                    }}
                    className="w-full px-4 py-2 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors text-sm font-medium"
                >
                    Limpar Filtros
                </button>
            </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-100 flex flex-col justify-between">
              <p className="text-sm font-bold text-emerald-700 uppercase tracking-wide mb-2">Receitas ({getTimeFilterLabel()})</p>
              <p className="text-3xl font-extrabold text-slate-800">{summary.income.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
          </div>
          <div className="bg-rose-50 rounded-lg p-4 border border-rose-100 flex flex-col justify-between">
              <p className="text-sm font-bold text-rose-700 uppercase tracking-wide mb-2">Despesas ({getTimeFilterLabel()})</p>
              <p className="text-3xl font-extrabold text-slate-800">{summary.expense.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
          </div>
          <div className={`rounded-lg p-4 border flex flex-col justify-between ${summary.balance >= 0 ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-50 border-slate-100'}`}>
              <p className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-2">Saldo ({getTimeFilterLabel()})</p>
              <p className={`text-3xl font-extrabold ${summary.balance >= 0 ? 'text-indigo-800' : 'text-slate-800'}`}>{summary.balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
          </div>
      </div>
      
      {/* Transaction Table */}
      <div className="overflow-x-auto mt-6">
        <h3 className="text-lg font-semibold text-slate-700 mb-4">Lista de Transações</h3>
        <table className="min-w-full bg-white border border-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-slate-600">Data</th>
              <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-slate-600">Descrição</th>
              <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-slate-600">Tipo</th>
              <th className="text-right py-3 px-4 uppercase font-semibold text-sm text-slate-600">Valor</th>
              <th className="text-right py-3 px-4 uppercase font-semibold text-sm text-slate-600">Ações</th>
            </tr>
          </thead>
          <tbody className="text-slate-700">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={`skeleton-${index}`} className="border-b border-slate-200">
                  <td className="py-3 px-4"><Skeleton className="h-4 w-3/4" /></td>
                  <td className="py-3 px-4"><Skeleton className="h-4 w-full" /></td>
                  <td className="py-3 px-4"><Skeleton className="h-4 w-1/2" /></td>
                  <td className="py-3 px-4 text-right"><Skeleton className="h-4 w-1/2 ml-auto" /></td>
                  <td className="py-3 px-4 text-right"><Skeleton className="h-6 w-16 ml-auto rounded-full" /></td>
                </tr>
              ))
            ) : (
                <>
                {filteredTransactions.length > 0 ? (
                    filteredTransactions.map(t => (
                        <tr key={t.id} className="border-b hover:bg-slate-50">
                            <td className="py-3 px-4 text-sm">{new Date(t.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</td>
                            <td className="py-3 px-4 text-sm">{t.description}</td>
                            <td className="py-3 px-4 text-sm">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${t.type === 'income' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                                    {t.type === 'income' ? 'Receita' : 'Despesa'}
                                </span>
                            </td>
                            <td className={`py-3 px-4 text-right font-semibold text-sm ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>{(t.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                            <td className="py-3 px-4 text-right">
                                <div className="flex justify-end gap-3">
                                    {t.type === 'income' && t.patientId && ( // Only show receipt for income linked to a patient
                                        <button 
                                            onClick={() => handlePrintReceipt(t)} 
                                            className="text-amber-600 hover:text-amber-800 p-1 rounded-full hover:bg-amber-50"
                                            title="Imprimir Recibo"
                                        >
                                            <FileTextIcon/>
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => handleOpenEditModal(t)} 
                                        className="text-indigo-600 hover:text-indigo-800 p-1 rounded-full hover:bg-indigo-50"
                                        title="Editar Transação"
                                    >
                                        <EditIcon/>
                                    </button>
                                    <button 
                                        onClick={() => setTransactionToDelete(t)} 
                                        className="text-rose-600 hover:text-rose-800 p-1 rounded-full hover:bg-rose-50"
                                        title="Excluir Transação"
                                    >
                                        <TrashIcon/>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan={5} className="text-center py-10 text-slate-500">
                            Nenhuma transação encontrada com os filtros aplicados.
                        </td>
                    </tr>
                )}
                </>
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Transaction Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-50 animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4 animate-slide-up" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-100">
                    <h3 className="text-xl font-bold text-slate-800">{modalMode === 'add' ? 'Nova Transação' : 'Editar Transação'}</h3>
                    <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800"><CloseIcon /></button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
                        <input 
                            type="text" 
                            id="description"
                            value={currentTransaction.description} 
                            onChange={(e) => setCurrentTransaction({...currentTransaction, description: e.target.value})} 
                            className={inputClass} 
                            placeholder="Ex: Consulta Ana Silva"
                        />
                    </div>
                    <div>
                        <label htmlFor="amount" className="block text-sm font-medium text-slate-700 mb-1">Valor</label>
                        <input 
                            type="text" 
                            id="amount"
                            value={amountInput} 
                            onChange={handleAmountChange} 
                            className={inputClass} 
                            placeholder="R$ 0,00"
                            inputMode="numeric"
                        />
                    </div>
                    <div>
                        <label htmlFor="type" className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                        <div className="relative group">
                            <select 
                                id="type"
                                value={currentTransaction.type} 
                                onChange={(e) => setCurrentTransaction({...currentTransaction, type: e.target.value as 'income' | 'expense'})} 
                                className={selectClass}
                            >
                                <option value="income">Receita</option>
                                <option value="expense">Despesa</option>
                            </select>
                            <ChevronDownIcon />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="date" className="block text-sm font-medium text-slate-700 mb-1">Data</label>
                        <input 
                            type="date" 
                            id="date"
                            value={currentTransaction.date} 
                            onChange={(e) => setCurrentTransaction({...currentTransaction, date: e.target.value})} 
                            className={inputClass} 
                        />
                    </div>
                    {/* Patient association only for income transactions, not expenses */}
                    {currentTransaction.type === 'income' && (
                        <div>
                            <label htmlFor="patientId" className="block text-sm font-medium text-slate-700 mb-1">Paciente (Opcional)</label>
                            <div className="relative group">
                                <select 
                                    id="patientId"
                                    value={currentTransaction.patientId} 
                                    onChange={(e) => setCurrentTransaction({...currentTransaction, patientId: e.target.value})} 
                                    className={selectClass}
                                >
                                    <option value="">Nenhum</option>
                                    {patients.sort((a,b) => a.name.localeCompare(b.name)).map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                                <ChevronDownIcon />
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                    <button onClick={() => setIsModalOpen(false)} type="button" className="px-4 py-2 rounded-full bg-slate-200 text-slate-800 hover:bg-slate-300 transition-colors">Cancelar</button>
                    <button onClick={handleSaveTransaction} type="submit" className="px-6 py-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm">Salvar</button>
                </div>
            </div>
        </div>
      )}

      {/* Delete Transaction Confirmation Modal */}
      {transactionToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-50 animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full mx-4 animate-slide-up" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Confirmar Exclusão</h3>
                <p className="text-slate-600 mb-6">
                    Você tem certeza que deseja excluir a transação de <span className="font-semibold">{transactionToDelete.description}</span> no valor de <span className="font-bold text-rose-600">{transactionToDelete.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>? Esta ação não pode ser desfeita.
                </p>
                <div className="flex justify-end gap-3 mt-8">
                    <button onClick={() => setTransactionToDelete(null)} type="button" className="px-4 py-2 rounded-full bg-slate-200 text-slate-800 hover:bg-slate-300 transition-colors">Cancelar</button>
                    <button onClick={handleDeleteTransaction} type="button" className="px-4 py-2 rounded-full bg-rose-600 text-white hover:bg-rose-700 transition-colors">Excluir Transação</button>
                </div>
            </div>
        </div>
      )}
    </ModuleContainer>
  );
};

export default FinancialModule;
