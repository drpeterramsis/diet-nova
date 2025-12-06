import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  onNavigateHome: () => void;
  onNavigateTools: () => void;
  onNavigateProfile: () => void;
  onLoginClick: () => void;
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  onNavigateHome, 
  onNavigateTools, 
  onNavigateProfile, 
  onLoginClick, 
  onMenuClick 
}) => {
  const { t } = useLanguage();
  const { session, profile } = useAuth();

  return (
    <header className="bg-[var(--color-primary)] text-white shadow-md sticky top-0 z-50 no-print">
      <div className="container mx-auto px-4 h-16 flex justify-between items-center">
        <div className="flex items-center gap-2 cursor-pointer" onClick={onNavigateHome}>
            <h1 className="text-2xl font-bold tracking-wide flex items-center">
              Diet<span className="text-[var(--color-primary-light)]">Nova</span>
              <span className="ml-2 text-xs bg-white/20 px-2 py-0.5 rounded-full hidden sm:inline-block">
                v2.0.135
              </span>
            </h1>
        </div>

        <div className="hidden md:flex items-center gap-6">
          <button onClick={onNavigateHome} className="hover:text-[var(--color-primary-light)] transition font-medium">
            {t.header.home}
          </button>
          <button onClick={onNavigateTools} className="hover:text-[var(--color-primary-light)] transition font-medium">
            {t.header.tools}
          </button>
          {session ? (
             <div className="flex items-center gap-4">
                <button onClick={onNavigateProfile} className="flex items-center gap-2 hover:bg-white/10 px-3 py-1.5 rounded-lg transition">
                    <span className="text-xl">👤</span>
                    <div className="text-left">
                        <div className="text-xs opacity-75 leading-none">Welcome</div>
                        <div className="font-bold text-sm leading-none">{profile?.full_name?.split(' ')[0]}</div>
                    </div>
                </button>
             </div>
          ) : (
            <button 
              onClick={onLoginClick}
              className="bg-white text-[var(--color-primary)] px-5 py-2 rounded-full font-bold shadow hover:bg-gray-100 transition"
            >
              {t.header.login}
            </button>
          )}
        </div>

        <button onClick={onMenuClick} className="md:hidden text-2xl focus:outline-none">
          ☰
        </button>
      </div>
    </header>
  );
};

export default Header;