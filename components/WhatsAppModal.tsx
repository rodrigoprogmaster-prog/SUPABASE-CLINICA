
import React, { useState } from 'react';
import CloseIcon from './icons/CloseIcon';
import SendIcon from './icons/SendIcon';
import CopyIcon from './icons/CopyIcon';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  patientName: string;
  phone: string;
  message: string;
}

const WhatsAppModal: React.FC<WhatsAppModalProps> = ({ isOpen, onClose, onConfirm, patientName, phone, message }) => {
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen) return null;

  const handleConfirmSend = () => {
    const phoneClean = phone.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/55${phoneClean}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    if (onConfirm) {
        onConfirm();
    }
    onClose();
  };

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-[100] animate-fade-in" onClick={onClose}>
      <div 
        className="bg-[#efeae2] w-full max-w-md rounded-lg shadow-2xl overflow-hidden flex flex-col animate-slide-up max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header similar ao WhatsApp */}
        <div className="bg-[#008069] text-white px-4 py-3 flex justify-between items-center shadow-md">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-[#008069] font-bold">
                    {patientName.charAt(0).toUpperCase()}
                </div>
                <div>
                    <h3 className="font-semibold text-sm">{patientName}</h3>
                    <p className="text-xs opacity-90 text-white">{phone}</p>
                </div>
            </div>
            <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition-colors">
                <CloseIcon />
            </button>
        </div>

        {/* Body simulando chat */}
        <div className="flex-grow p-6 overflow-y-auto bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat">
             <div className="bg-[#d9fdd3] p-3 rounded-lg rounded-tr-none shadow-sm max-w-[90%] ml-auto relative">
                 <p className="text-sm text-slate-800 whitespace-pre-wrap">{message}</p>
                 <div className="text-[10px] text-slate-500 text-right mt-1 flex justify-end items-center gap-1">
                     {new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                     <span className="text-blue-400">✓✓</span>
                 </div>
                 {/* Triângulo do balão */}
                 <div className="absolute top-0 -right-2 w-0 h-0 border-t-[10px] border-t-[#d9fdd3] border-r-[10px] border-r-transparent"></div>
             </div>
        </div>

        {/* Footer de Ação */}
        <div className="p-4 bg-[#f0f2f5] border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3">
             <button 
                onClick={onClose} 
                className="w-full sm:w-auto px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-full text-sm font-medium transition-colors"
             >
                 Cancelar
             </button>
             
             <div className="flex gap-2 w-full sm:w-auto justify-end">
                 <button
                    onClick={handleCopyMessage}
                    className={`flex-1 sm:flex-none px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-sm border ${isCopied ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}
                 >
                     <CopyIcon />
                     {isCopied ? 'Copiado!' : 'Copiar Texto'}
                 </button>

                 <button 
                    onClick={handleConfirmSend} 
                    className="flex-1 sm:flex-none bg-[#008069] hover:bg-[#006d59] text-white px-6 py-2 rounded-full font-medium text-sm shadow-md transition-colors flex items-center justify-center gap-2"
                 >
                     <SendIcon />
                     Abrir WhatsApp
                 </button>
             </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppModal;
