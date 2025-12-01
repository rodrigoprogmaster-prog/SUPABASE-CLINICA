
import React from 'react';
import { View } from '../types';
import HomeIcon from './icons/HomeIcon';
import PatientIcon from './icons/PatientIcon';
import CalendarIcon from './icons/CalendarIcon';
import FileTextIcon from './icons/FileTextIcon';
import DollarSignIcon from './icons/DollarSignIcon';
import CloseIcon from './icons/CloseIcon';
import LogoutIcon from './icons/LogoutIcon';
import UserIcon from './icons/UserIcon';
import SettingsIcon from './icons/SettingsIcon';
import HelpCircleIcon from './icons/HelpCircleIcon';

interface SidebarProps {
  activeView: View;
  onNavigate: (view: View) => void;
  onSettingsClick: () => void;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  profileImage: string | null;
  isHidden?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, onNavigate, onSettingsClick, isOpen, onClose, onLogout, profileImage, isHidden = false }) => {
  
  const menuItems = [
    { id: 'dashboard', label: 'Painel Principal', icon: <HomeIcon /> },
    { id: 'patients', label: 'Pacientes', icon: <PatientIcon /> },
    { id: 'schedule', label: 'Agendamento', icon: <CalendarIcon /> },
    { id: 'recordsHistory', label: 'Prontuário', icon: <FileTextIcon /> },
    { id: 'financial', label: 'Financeiro', icon: <DollarSignIcon /> },
    { id: 'settings', label: 'Configurações', icon: <SettingsIcon /> },
    { id: 'help', label: 'Ajuda', icon: <HelpCircleIcon /> },
  ];

  if (isHidden) return null;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`
          fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-50 border-r border-slate-200 shadow-lg lg:shadow-none transform transition-transform duration-300 ease-in-out flex flex-col
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo / Title Area */}
        <div className="h-20 flex items-center px-6 border-b border-slate-200/60 shrink-0 gap-3 bg-slate-50">
            <div className="h-10 w-10 rounded-full bg-white border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center cursor-pointer shadow-sm" onClick={() => onNavigate('dashboard')}>
                {profileImage ? (
                     <img src={profileImage} alt="Perfil" className="h-full w-full object-cover" />
                ) : (
                    <span className="text-indigo-300">
                        <UserIcon />
                    </span>
                )}
            </div>
            <div onClick={() => onNavigate('dashboard')} className="cursor-pointer flex-grow">
                <h1 className="text-sm font-bold text-slate-700 leading-tight">
                Clínica<br/><span className="font-light text-slate-500">Vanessa Gonçalves</span>
                </h1>
            </div>
            <button onClick={onClose} className="lg:hidden text-slate-500 hover:text-slate-700">
                <CloseIcon />
            </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1.5 overflow-y-auto flex-grow custom-scrollbar">
            <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 mt-2">Menu</p>
            {menuItems.map((item) => {
                const isActive = activeView === item.id || (activeView === 'pep' && item.id === 'recordsHistory');
                return (
                <button
                    key={item.id}
                    onClick={() => {
                        if (item.id === 'settings') {
                            onSettingsClick();
                        } else {
                            onNavigate(item.id as View);
                        }
                        onClose(); // Close sidebar on mobile after selection
                    }}
                    className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
                    ${isActive 
                        ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200' 
                        : 'text-slate-500 hover:bg-white hover:text-slate-700 hover:shadow-sm'}
                    `}
                >
                    <div className={`${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`}>
                        {item.icon}
                    </div>
                    {item.label}
                </button>
                );
            })}
        </nav>

        {/* Footer / Logout */}
        <div className="p-4 border-t border-slate-200/60 shrink-0 bg-slate-50">
            <button 
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-slate-500 hover:bg-white hover:text-rose-600 hover:shadow-sm transition-all duration-200 group"
            >
                <div className="text-slate-400 group-hover:text-rose-500 transition-colors">
                    <LogoutIcon />
                </div>
                Sair do Sistema
            </button>
            <p className="text-center text-[10px] text-slate-300 mt-4 uppercase tracking-widest font-semibold opacity-70">
                Versão 1.0
            </p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
