
import React from 'react';
import { NotificationLog } from '../types';
import CloseIcon from './icons/CloseIcon';

interface NotificationModalProps {
  onClose: () => void;
  logs: NotificationLog[];
}

const NotificationModal: React.FC<NotificationModalProps> = ({ onClose, logs }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-50 animate-fade-in" onClick={onClose}>
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full mx-4 overflow-hidden flex flex-col max-h-[80vh] animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4 pb-2 border-b">
            <h3 className="text-lg font-bold text-slate-800">Histórico de Notificações Enviadas</h3>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100"><CloseIcon/></button>
        </div>
        <div className="overflow-y-auto flex-grow">
            {logs.length > 0 ? (
                <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 sticky top-0">
                        <tr>
                            <th className="text-left py-2 px-2 text-slate-600">Data/Hora</th>
                            <th className="text-left py-2 px-2 text-slate-600">Paciente</th>
                            <th className="text-left py-2 px-2 text-slate-600">Canal</th>
                            <th className="text-left py-2 px-2 text-slate-600">Detalhes</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {logs.map(log => (
                            <tr key={log.id} className="hover:bg-slate-50">
                                <td className="py-2 px-2 text-slate-500 whitespace-nowrap">
                                    {new Date(log.date).toLocaleString('pt-BR')}
                                </td>
                                <td className="py-2 px-2 font-medium text-slate-700">{log.patientName}</td>
                                <td className="py-2 px-2">
                                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                        log.type === 'email' ? 'bg-blue-100 text-blue-700' :
                                        log.type === 'sms' ? 'bg-green-100 text-green-700' :
                                        'bg-purple-100 text-purple-700'
                                    }`}>
                                        {log.type === 'email' ? 'E-mail' : log.type === 'sms' ? 'WhatsApp' : 'Ambos'}
                                    </span>
                                </td>
                                <td className="py-2 px-2 text-slate-600 text-xs">
                                    {log.details}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p className="text-slate-500 text-center py-8">Nenhuma notificação registrada recentemente.</p>
            )}
        </div>
        <div className="flex justify-end mt-4 pt-2 border-t">
            <button onClick={onClose} className="px-4 py-2 rounded-full bg-slate-200 text-slate-800 hover:bg-slate-300 text-sm font-medium">
                Fechar
            </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;
