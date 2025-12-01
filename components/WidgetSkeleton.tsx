import React from 'react';
import Skeleton from './Skeleton';

const WidgetSkeleton: React.FC = () => (
  <div className="bg-white rounded-lg shadow-md border border-slate-100 overflow-hidden flex flex-col h-[270px]">
    <div className="p-4 border-b border-slate-100 bg-slate-50/50">
      <Skeleton className="h-5 w-3/5" />
    </div>
    <div className="p-4 flex-grow flex flex-col">
        <Skeleton className="h-4 w-full mb-3" />
        <Skeleton className="h-4 w-5/6 mb-3" />
        <Skeleton className="h-4 w-full" />
    </div>
    <div className="bg-slate-50/50 p-3 mt-auto text-center border-t border-slate-100">
      <Skeleton className="h-4 w-1/2 mx-auto" />
    </div>
  </div>
);

export default WidgetSkeleton;
