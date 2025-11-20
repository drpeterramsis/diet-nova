
import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface CardProps {
  title: string;
  desc: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  locked?: boolean;
}

const ToolCard = ({ title, desc, onClick, icon, locked }: CardProps) => {
  const { t } = useLanguage();

  return (
    <div 
      className="card text-center hover:shadow-xl transition-all duration-300 cursor-pointer group transform hover:-translate-y-1 bg-white relative overflow-hidden"  
      onClick={onClick} 
    >
      {locked && (
        <div className="absolute top-3 right-3 bg-red-100 text-red-600 p-1.5 rounded-full z-10">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
           </svg>
        </div>
      )}
      
      <div className="h-12 w-12 mx-auto mb-4 bg-[var(--color-bg-soft)] rounded-full flex items-center justify-center text-[var(--color-primary)] group-hover:bg-[var(--color-primary)] group-hover:text-white transition-colors">
        {icon || (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        )}
      </div>
      <h3 className="text-xl font-bold text-[var(--color-heading)] mb-2 group-hover:text-[var(--color-primary)] transition-colors">
        {title}
      </h3>
      <p className="text-[var(--color-text-light)] mb-4 text-sm leading-relaxed min-h-[40px]">{desc}</p>
      <button 
         className={`w-full text-white px-4 py-2 rounded-lg transition shadow-md flex items-center justify-center gap-2 ${
            locked 
            ? 'bg-gray-400 cursor-not-allowed hover:bg-gray-500' 
            : 'bg-[var(--color-primary)] group-hover:bg-[var(--color-primary-hover)]'
         }`}
      >
        {locked ? (
            <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                {t.common.loginRequired}
            </>
        ) : t.common.open}
      </button>
    </div>
  );
};

export default ToolCard;