import React from 'react';
import SettingsIcon from './icons/SettingsIcon';
import UserIcon from './icons/UserIcon';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingTasks: {
    passwordChanged: boolean;
    profileImageSet: boolean;
  };
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onClose, pendingTasks }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4 sm:px-6">
      {/* Backdrop with blur - removed onClick to prevent closing */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 cursor-not-allowed" 
      />

      {/* Modal Content */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all duration-300 animate-slide-up border border-slate-100">
        
        {/* Header / Hero Section */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-8 text-white text-center">
            <div className="mx-auto bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mb-4 backdrop-blur-md border border-white/30">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <path d="M12 18v-6"/>
                    <path d="M9 15l3 3 3-3"/>
                </svg>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Bem-vinda ao Seu Sistema</h2>
            <p className="text-indigo-100 mt-2 text-sm">Vamos configurar seu ambiente para uma experiência segura e personalizada.</p>
        </div>

        {/* Body */}
        <div className="p-8">
            <p className="text-slate-600 mb-6 text-center leading-relaxed">
                Para aproveitar ao máximo o sistema e manter seus dados seguros, <span className="font-bold text-indigo-600">recomendamos</span> que você realize as seguintes ações:
            </p>

            <div className="space-y-4 mb-8">
                {/* Task: Change Password */}
                <div className={`flex items-center p-4 rounded-xl border ${!pendingTasks.passwordChanged ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200 opacity-60'}`}>
                    <div className={`p-2 rounded-full mr-4 ${!pendingTasks.passwordChanged ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                        <div className="w-5 h-5">
                           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                        </div>
                    </div>
                    <div className="flex-grow">
                        <h4 className={`font-semibold text-sm ${!pendingTasks.passwordChanged ? 'text-amber-900' : 'text-emerald-900'}`}>Alterar Senha Padrão</h4>
                        <p className="text-xs text-slate-500">Substitua a senha inicial por uma de sua preferência.</p>
                    </div>
                    {pendingTasks.passwordChanged && (
                        <span className="text-emerald-600 font-bold text-lg">✓</span>
                    )}
                </div>

                {/* Task: Profile Photo */}
                <div className={`flex items-center p-4 rounded-xl border ${!pendingTasks.profileImageSet ? 'bg-indigo-50 border-indigo-200' : 'bg-emerald-50 border-emerald-200 opacity-60'}`}>
                    <div className={`p-2 rounded-full mr-4 ${!pendingTasks.profileImageSet ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'}`}>
                        <div className="w-5 h-5">
                            <UserIcon />
                        </div>
                    </div>
                    <div className="flex-grow">
                        <h4 className={`font-semibold text-sm ${!pendingTasks.profileImageSet ? 'text-indigo-900' : 'text-emerald-900'}`}>Definir Foto de Perfil</h4>
                        <p className="text-xs text-slate-500">Personalize o sistema com sua foto profissional.</p>
                    </div>
                     {pendingTasks.profileImageSet && (
                        <span className="text-emerald-600 font-bold text-lg">✓</span>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
                <button 
                    onClick={onClose}
                    className="w-full py-3.5 rounded-full bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
                >
                    <SettingsIcon />
                    Continuar para o Sistema
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeModal;