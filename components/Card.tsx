
import React from 'react';

interface CardProps {
  title: string;
  description?: string;
  icon: React.ReactNode;
  onClick: () => void;
  isActionable?: boolean;
}

const Card: React.FC<CardProps> = ({ title, description, icon, isActionable = true, onClick }) => {
  const baseClasses = "bg-white rounded-lg shadow-md p-6 flex flex-col items-start text-left";
  const actionableClasses = "transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1 cursor-pointer border border-transparent hover:border-indigo-200";
  const nonActionableClasses = "bg-slate-50 border-slate-200 border text-slate-400";

  return (
    <div
      className={`${baseClasses} ${isActionable ? actionableClasses : nonActionableClasses}`}
      onClick={isActionable ? onClick : undefined}
    >
      <div className={`mb-4 p-3 rounded-full ${isActionable ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-500'}`}>
        {icon}
      </div>
      <h3 className={`text-xl font-bold ${description ? 'mb-2' : 'mb-0'} ${isActionable ? 'text-slate-800' : 'text-slate-500'}`}>
        {title}
      </h3>
      {description && (
        <p className="text-slate-500 text-sm">
          {description}
        </p>
      )}
    </div>
  );
};

export default Card;
