
import React from 'react';
import CloseIcon from './icons/CloseIcon';

interface GmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientEmail: string;
  subject: string;
  body: string;
}

const GmailModal: React.FC<GmailModalProps> = ({ isOpen, onClose, recipientEmail, subject, body }) => {
  if (!isOpen) return null;

  const handleOpenGmail = () => {
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(recipientEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(gmailUrl, '_blank');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-end sm:items-center z-[100] animate-fade-in" onClick={onClose}>
      <div 
        className="bg-white w-full max-w-2xl rounded-t-lg sm:rounded-lg shadow-2xl overflow-hidden flex flex-col animate-slide-up sm:h-auto h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="bg-[#404040] text-white px-4 py-3 flex justify-between items-center rounded-t-lg">
            <span className="font-medium text-sm">Nova Mensagem</span>
            <button onClick={onClose} className="hover:bg-white/20 p-1 rounded transition-colors">
                <CloseIcon />
            </button>
        </div>

        <div className="p-0 flex flex-col flex-grow bg-white relative">
             <div className="border-b border-slate-200 px-4 py-3 flex items-center">
                 <span className="text-slate-500 w-16 text-sm">Para</span>
                 <span className="bg-slate-100 px-2 py-1 rounded text-slate-700 text-sm">{recipientEmail}</span>
             </div>
             <div className="border-b border-slate-200 px-4 py-3">
                 <input 
                    readOnly 
                    value={subject} 
                    className="w-full outline-none text-sm font-medium text-slate-700 placeholder-slate-400 bg-transparent"
                 />
             </div>
             <div className="flex-grow p-4 overflow-y-auto min-h-[250px]">
                 <textarea 
                    readOnly 
                    value={body} 
                    className="w-full h-full resize-none outline-none text-slate-700 text-sm font-sans whitespace-pre-wrap bg-transparent"
                 />
             </div>

             <div className="p-4 border-t border-slate-100 flex justify-between items-center bg-slate-50">
                 <div className="text-xs text-slate-500 hidden sm:block">
                     Esta ação abrirá o Gmail em uma nova aba.
                 </div>
                 <div className="flex gap-3 w-full sm:w-auto justify-end">
                     <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-full text-sm font-medium transition-colors">
                         Cancelar
                     </button>
                     <button 
                        onClick={handleOpenGmail} 
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full font-medium text-sm shadow-md transition-colors flex items-center gap-2"
                     >
                         Abrir Gmail e Enviar
                     </button>
                 </div>
             </div>
        </div>
      </div>
    </div>
  );
};

export default GmailModal;
