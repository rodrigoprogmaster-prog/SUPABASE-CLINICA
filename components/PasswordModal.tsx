
import React, { useState } from 'react';

interface PasswordModalProps {
  onClose: () => void;
  onSuccess: () => void;
  correctPassword?: string;
  target: 'settings' | 'patients' | null;
}

const PasswordModal: React.FC<PasswordModalProps> = ({ onClose, onSuccess, correctPassword, target }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const MASTER_PASSWORD = '140552';

  const targetText = target === 'settings' ? 'as configurações' : 'o cadastro de pacientes';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === correctPassword || password === MASTER_PASSWORD) {
      onSuccess();
    } else {
      setError('Senha incorreta. Tente novamente.');
      setPassword('');
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-50 transition-opacity duration-300 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white p-8 rounded-lg shadow-xl max-w-sm w-full mx-4 transform transition-transform duration-300 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold text-slate-800 mb-2">Acesso Restrito</h3>
        <p className="text-slate-600 mb-6">Por favor, insira a senha para acessar {targetText}.</p>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="password-input" className="sr-only">Senha</label>
            <input
              id="password-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full p-3 border rounded-md text-center bg-white ${error ? 'border-red-500' : 'border-slate-300'}`}
              placeholder="••••••"
              autoFocus
            />
            {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
          </div>
          <div className="flex justify-end gap-3 mt-8">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 rounded-full bg-slate-200 text-slate-800 hover:bg-slate-300 transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="px-4 py-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
            >
              Acessar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PasswordModal;
