
import React from 'react';
import { Transaction, Appointment, Patient } from '../types';
import CloseIcon from './icons/CloseIcon';
import PrintIcon from './icons/PrintIcon';

type SummaryType = 'monthlyRevenue' | 'weeklyIncome' | 'monthlyAppointments' | 'activePatients' | null;

interface SummaryDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: SummaryType;
  data: (Transaction | Appointment | Patient)[];
  title: string;
}

const SummaryDetailsModal: React.FC<SummaryDetailsModalProps> = ({ isOpen, onClose, type, data, title }) => {
  if (!isOpen) return null;

  const handlePrintReport = async () => {
    // Fix Fullscreen conflict
    if (document.fullscreenElement) {
        try {
            await document.exitFullscreen();
        } catch (e) {
            console.error("Error exiting fullscreen", e);
        }
    }

    setTimeout(() => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const todayString = new Date().toLocaleDateString('pt-BR');
        const reportTitle = title;

        // CSS Styles for the report
        const styles = `
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1f2937; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #4f46e5; padding-bottom: 20px; }
            .header h1 { margin: 0; color: #312e81; font-size: 24px; text-transform: uppercase; }
            .header p { margin: 5px 0 0; color: #6b7280; font-size: 14px; }
            
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 12px; }
            th { background-color: #f3f4f6; text-align: left; padding: 10px; border-bottom: 2px solid #e5e7eb; font-weight: 700; color: #374151; text-transform: uppercase; }
            td { padding: 10px; border-bottom: 1px solid #e5e7eb; color: #4b5563; }
            tr:nth-child(even) { background-color: #f9fafb; }
            
            .amount { font-family: monospace; font-weight: 600; }
            .text-right { text-align: right; }
            .text-green { color: #059669; }
            .text-red { color: #dc2626; }
            
            .summary-card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; margin-top: 20px; text-align: right; }
            .summary-card span { display: block; font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 600; }
            .summary-card strong { font-size: 20px; color: #0f172a; }

            .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 10px; }
        `;

        let tableHeaderHTML = '';
        let tableBodyHTML = '';
        let summaryHTML = '';

        if (type === 'monthlyRevenue' || type === 'weeklyIncome') {
            const transactions = data as Transaction[];
            const total = transactions.reduce((acc, t) => acc + (t.type === 'income' ? t.amount : -t.amount), 0);
            
            tableHeaderHTML = `
                <tr>
                    <th>Data</th>
                    <th>Descrição</th>
                    <th>Tipo</th>
                    <th class="text-right">Valor</th>
                </tr>
            `;
            
            tableBodyHTML = transactions.map(t => `
                <tr>
                    <td>${new Date(t.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</td>
                    <td>${t.description}</td>
                    <td>${t.type === 'income' ? 'Receita' : 'Despesa'}</td>
                    <td class="text-right amount ${t.type === 'income' ? 'text-green' : 'text-red'}">
                        ${t.type === 'income' ? '+' : '-'} ${t.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                </tr>
            `).join('');

            summaryHTML = `
                <div class="summary-card">
                    <span>Total do Período</span>
                    <strong>${total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
                </div>
            `;
        } else if (type === 'monthlyAppointments') {
            const appointments = data as Appointment[];
            tableHeaderHTML = `
                <tr>
                    <th>Data</th>
                    <th>Hora</th>
                    <th>Paciente</th>
                    <th class="text-right">Status</th>
                </tr>
            `;
            tableBodyHTML = appointments.map(app => `
                <tr>
                    <td>${new Date(app.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</td>
                    <td>${app.time}</td>
                    <td>${app.patientName}</td>
                    <td class="text-right">${app.status === 'completed' ? 'Realizada' : 'Agendada'}</td>
                </tr>
            `).join('');
            
            summaryHTML = `
                <div class="summary-card">
                    <span>Total de Consultas</span>
                    <strong>${appointments.length}</strong>
                </div>
            `;
        } else if (type === 'activePatients') {
            const patients = data as Patient[];
            tableHeaderHTML = `
                <tr>
                    <th>Nome</th>
                    <th>Telefone</th>
                    <th>Data de Nascimento</th>
                    <th class="text-right">Desde</th>
                </tr>
            `;
            tableBodyHTML = patients.map(p => `
                <tr>
                    <td>${p.name}</td>
                    <td>${p.phone}</td>
                    <td>${new Date(p.dateOfBirth).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</td>
                    <td class="text-right">${new Date(p.joinDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</td>
                </tr>
            `).join('');
            
            summaryHTML = `
                <div class="summary-card">
                    <span>Total de Pacientes Ativos</span>
                    <strong>${patients.length}</strong>
                </div>
            `;
        }

        const html = `
            <html>
                <head><title>${reportTitle}</title><style>${styles}</style></head>
                <body>
                    <div class="header">
                        <h1>${reportTitle}</h1>
                        <p>Clínica Vanessa Gonçalves • Gerado em ${todayString}</p>
                    </div>
                    <table>
                        <thead>${tableHeaderHTML}</thead>
                        <tbody>${tableBodyHTML}</tbody>
                    </table>
                    ${summaryHTML}
                    <div class="footer">Documento para uso administrativo interno.</div>
                </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
    }, 100);
  };

  const renderTableContent = () => {
    if (data.length === 0) {
      return (
        <tr>
          <td colSpan={4} className="text-center py-8 text-slate-500">
            Nenhum registro encontrado para este período.
          </td>
        </tr>
      );
    }

    // Render Transaction Table (Receitas)
    if (type === 'monthlyRevenue' || type === 'weeklyIncome') {
      const transactions = data as Transaction[];
      return transactions.map((t) => (
        <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50">
          <td className="py-3 px-4 text-sm text-slate-600">
            {new Date(t.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
          </td>
          <td className="py-3 px-4 text-sm text-slate-800 font-medium">{t.description}</td>
          <td className="py-3 px-4 text-sm text-emerald-600 font-bold text-right">
            {t.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </td>
        </tr>
      ));
    }

    // Render Appointment Table (Consultas)
    if (type === 'monthlyAppointments') {
      const appointments = data as Appointment[];
      return appointments.map((app) => (
        <tr key={app.id} className="border-b border-slate-100 hover:bg-slate-50">
          <td className="py-3 px-4 text-sm text-slate-600">
            {new Date(app.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
          </td>
          <td className="py-3 px-4 text-sm text-slate-600">{app.time}</td>
          <td className="py-3 px-4 text-sm text-slate-800 font-medium">{app.patientName}</td>
          <td className="py-3 px-4 text-sm text-right">
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                app.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-violet-100 text-violet-800'
            }`}>
                {app.status === 'completed' ? 'Realizada' : 'Agendada'}
            </span>
          </td>
        </tr>
      ));
    }

    // Render Patient Table (Pacientes Ativos)
    if (type === 'activePatients') {
      const patients = data as Patient[];
      return patients.map((p) => (
        <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
          <td className="py-3 px-4 text-sm text-slate-800 font-medium">{p.name}</td>
          <td className="py-3 px-4 text-sm text-slate-600">{p.phone}</td>
          <td className="py-3 px-4 text-sm text-slate-600">
             {new Date(p.joinDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
          </td>
        </tr>
      ));
    }
  };

  const renderHeaders = () => {
    if (type === 'monthlyRevenue' || type === 'weeklyIncome') {
      return (
        <>
          <th className="text-left py-3 px-4 font-semibold text-slate-600">Data</th>
          <th className="text-left py-3 px-4 font-semibold text-slate-600">Descrição</th>
          <th className="text-right py-3 px-4 font-semibold text-slate-600">Valor</th>
        </>
      );
    }
    if (type === 'monthlyAppointments') {
      return (
        <>
          <th className="text-left py-3 px-4 font-semibold text-slate-600">Data</th>
          <th className="text-left py-3 px-4 font-semibold text-slate-600">Hora</th>
          <th className="text-left py-3 px-4 font-semibold text-slate-600">Paciente</th>
          <th className="text-right py-3 px-4 font-semibold text-slate-600">Status</th>
        </>
      );
    }
    if (type === 'activePatients') {
      return (
        <>
          <th className="text-left py-3 px-4 font-semibold text-slate-600">Nome</th>
          <th className="text-left py-3 px-4 font-semibold text-slate-600">Telefone</th>
          <th className="text-left py-3 px-4 font-semibold text-slate-600">Data Cadastro</th>
        </>
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-50 animate-fade-in">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-3xl w-full mx-4 flex flex-col max-h-[80vh] animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4 border-b pb-4">
          <h3 className="text-xl font-bold text-slate-800">{title}</h3>
          <div className="flex items-center gap-3">
              {data.length > 0 && (
                  <button 
                    onClick={handlePrintReport}
                    className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-colors text-sm font-medium"
                  >
                      <PrintIcon />
                      Imprimir Relatório
                  </button>
              )}
              <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800">
                <CloseIcon />
              </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-grow custom-scrollbar">
          <table className="min-w-full">
            <thead className="bg-slate-50 sticky top-0">
              <tr>
                {renderHeaders()}
              </tr>
            </thead>
            <tbody>
              {renderTableContent()}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end mt-6 pt-4 border-t border-slate-100">
          <button 
            onClick={onClose} 
            className="px-6 py-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-colors font-medium"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default SummaryDetailsModal;
