import React from "react";
import { useLanguage } from "../contexts/LanguageContext";

const Footer = () => {
  const { t } = useLanguage();
  
  return (
    <footer className="fixed bottom-0 left-0 w-full bg-[var(--color-primary-dark)] text-white py-2 z-40">
      <div className="text-center">
        <p className="text-[10px] tracking-wide px-4 opacity-90">
          © 2025 Diet-Nova | Dr. Peter Ramsis
          <span className="mx-2 text-[var(--color-primary-light)] opacity-50">|</span>
          <span className="text-[10px] text-[var(--color-primary-light)] opacity-80 uppercase">
            {t.common.copyright} (v2.0.35)
          </span>
        </p>
      </div>
    </footer>
  );
};

export default Footer;