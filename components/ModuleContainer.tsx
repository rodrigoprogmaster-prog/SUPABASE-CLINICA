
import React from 'react';
import ArrowLeftIcon from './icons/ArrowLeftIcon';

interface ModuleContainerProps {
  title: string;
  onBack: () => void;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

const ModuleContainer: React.FC<ModuleContainerProps> = ({ title, onBack, children, actions }) => {
  return (
    <div className="bg-white p-6 sm:p-8 rounded-lg shadow-lg animate-fade-in border border-slate-200">
      <div className="flex justify-between items-center mb-6 border-b pb-4 border-slate-200">
        <div className="flex items-center gap-4">
          <h2 className="text-xl md:text-2xl font-bold text-slate-700">{title}</h2>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors duration-200"
          aria-label="Voltar"
        >
          <ArrowLeftIcon />
          <span className="hidden sm:inline">Voltar</span>
        </button>
      </div>
      <div>{children}</div>
    </div>
  );
};

export default ModuleContainer;