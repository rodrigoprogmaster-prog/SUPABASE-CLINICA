import React, { useState, useEffect } from 'react';

const HeaderClock: React.FC = () => {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000); // Update every second

    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="text-right">
      <p className="text-sm font-semibold text-slate-700">{formatTime(currentDateTime)}</p>
      <p className="text-xs text-slate-500 capitalize">{formatDate(currentDateTime)}</p>
    </div>
  );
};

export default HeaderClock;