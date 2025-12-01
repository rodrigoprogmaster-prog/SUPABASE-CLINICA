
import React, { useState } from 'react';
import UserIcon from './icons/UserIcon';

interface LoginProps {
  onLoginSuccess: (isMasterAccess?: boolean) => void;
  currentPassword?: string;
  profileImage: string | null;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess, currentPassword = '2577', profileImage }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const MASTER_PASSWORD = '140552';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === currentPassword) {
      onLoginSuccess(false);
    } else if (password === MASTER_PASSWORD) {
      onLoginSuccess(true);
    } else {
      setError('Senha incorreta. Tente novamente.');
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen flex bg-white font-sans">
      {/* Left Side - Branding & Visuals (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-100 relative overflow-hidden items-center justify-center border-r border-slate-100">
        {/* Decorative Circles - Softer Pastels & Lower Opacity */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-100 opacity-20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-slate-200 opacity-20 rounded-full blur-3xl"></div>
        <div className="absolute top-[40%] left-[20%] w-64 h-64 bg-violet-100 opacity-20 rounded-full blur-2xl"></div>
        
        <div className="relative z-10 text-center px-12">
            <div className="mb-6 inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-white shadow-xl shadow-slate-100 border border-slate-50 text-indigo-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
                    <path d="M9 12l2 2 4-4"/>
                </svg>
            </div>
            <h1 className="text-4xl font-bold text-slate-700 mb-4 tracking-tight">Clínica Vanessa Gonçalves</h1>
            <p className="text-slate-500 text-lg font-light leading-relaxed">
                Gestão integrada, prontuários seguros e agendamento inteligente. 
                <br/>O cuidado que seus pacientes merecem começa aqui.
            </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
            
            <div className="text-center">
                <div className="mx-auto h-28 w-28 rounded-full p-1 bg-gradient-to-tr from-slate-50 to-indigo-50 shadow-sm mb-6">
                    <div className="h-full w-full rounded-full bg-white p-1 overflow-hidden relative flex items-center justify-center border border-slate-100">
                        {profileImage ? (
                            <img src={profileImage} alt="Perfil" className="h-full w-full object-cover rounded-full" />
                        ) : (
                            <div className="text-slate-300 transform scale-150">
                                <UserIcon />
                            </div>
                        )}
                    </div>
                </div>
                <h2 className="text-3xl font-bold text-slate-700 tracking-tight">Bem-vinda de volta</h2>
                <p className="text-slate-400 mt-2">Vanessa Gonçalves</p>
            </div>

            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="password-login" className="block text-sm font-medium text-slate-600 mb-1">
                            Senha de Acesso
                        </label>
                        <div className="relative">
                            <input
                                id="password-login"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={`
                                    appearance-none block w-full px-4 py-3.5 border rounded-xl shadow-sm placeholder-slate-300 
                                    bg-slate-50/50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all focus:bg-white
                                    ${error ? 'border-rose-200 ring-1 ring-rose-50 bg-rose-50/30' : 'border-slate-200 hover:border-slate-300'}
                                `}
                                placeholder="Digite sua senha"
                                autoFocus
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                            </div>
                        </div>
                        {error && (
                            <div className="flex items-center gap-2 mt-2 text-rose-500 text-sm animate-fade-in">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                                <span>{error}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div>
                    <button
                        type="submit"
                        className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-indigo-500 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-lg shadow-indigo-100/50 transition-all duration-200 transform hover:-translate-y-0.5"
                    >
                        Acessar Sistema
                    </button>
                </div>
            </form>

            <div className="pt-6 text-center">
                <p className="text-xs text-slate-300">
                    Sistema Protegido • Versão 1.0
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
