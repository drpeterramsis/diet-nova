import React from "react";
import { useLanguage } from "../contexts/LanguageContext";

const Footer = () => {
  const { t } = useLanguage();
  
  return (
    <footer className="fixed bottom-0 left-0 w-full bg-[var(--color-primary-dark)] text-white py-3 z-40">
      <div className="text-center">
        <p className="text-sm tracking-wide px-4">
          © 2025 Diet-Nova | Dr. Peter Ramsis
          <span className="block text-xs text-[var(--color-primary-light)] mt-1 opacity-80">
            {t.common.copyright}
          </span>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
