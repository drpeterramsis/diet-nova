
import React from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";

interface HeaderProps {
  onNavigateHome?: () => void;
  onNavigateTools?: () => void;
  onLoginClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onNavigateHome, onNavigateTools, onLoginClick }) => {
  const { t, lang, toggleLanguage } = useLanguage();
  const { session, signOut } = useAuth();

  return (
    <header className="bg-[var(--color-primary)] text-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center p-4">
        <div className="flex items-center gap-2 cursor-pointer" onClick={onNavigateHome}>
          <h1 className="text-2xl font-bold tracking-wide flex items-center">
            Diet<span className="text-[var(--color-primary-light)]">Nova</span>
            <span className="ml-2 text-xs bg-white/20 px-2 py-0.5 rounded-full hidden sm:inline-block">
              v2.0.23
            </span>
          </h1>
        </div>

        <nav>
          <ul className="flex items-center space-x-4 rtl:space-x-reverse text-lg">
             <li>
                  <button 
                    onClick={onNavigateHome}
                    className="hover:text-[var(--color-primary-light)] transition hidden md:block"
                  >
                    {t.header.home}
                  </button>
                </li>
                <li className="hidden md:block">
                  <button 
                    onClick={onNavigateTools}
                    className="hover:text-[var(--color-primary-light)] transition"
                  >
                    {t.header.tools}
                  </button>
                </li>
            <li>
              <button 
                onClick={toggleLanguage}
                className="flex items-center gap-1 bg-white/10 hover:bg-white/20 px-3 py-1 rounded-lg transition text-sm font-medium"
              >
                <span>{lang === 'en' ? '🇺🇸' : '🇪🇬'}</span>
                <span>{lang === 'en' ? 'AR' : 'EN'}</span>
              </button>
            </li>
            {session ? (
                <li>
                   <button 
                    onClick={signOut}
                    className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg transition text-sm"
                   >
                     {t.common.logout}
                   </button>
                </li>
            ) : (
                <li>
                   <button 
                    onClick={onLoginClick}
                    className="bg-white text-[var(--color-primary)] hover:bg-gray-100 px-4 py-1 rounded-lg transition text-sm font-bold shadow-sm"
                   >
                     {t.header.login}
                   </button>
                </li>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;