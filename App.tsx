import React, { useState } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ToolCard from "./components/ToolCard";
import BmiModal from "./components/BmiModal";
import KcalCalculator from "./components/calculations/KcalCalculator";
import { LanguageProvider, useLanguage } from "./contexts/LanguageContext";

const Dashboard = ({ 
  setBmiOpen, 
  setActiveTool 
}: { 
  setBmiOpen: (v: boolean) => void, 
  setActiveTool: (v: string) => void 
}) => {
  const { t, isRTL } = useLanguage();
  
  return (
    <>
      {/* Hero Section */}
      <section className="relative text-center py-20 md:py-32 overflow-hidden bg-[var(--color-bg-soft)] rounded-b-[3rem] shadow-sm">
        {/* Decorative Background */}
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
            <div className="absolute top-10 left-10 w-32 h-32 bg-green-500 rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 right-10 w-48 h-48 bg-blue-400 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 container mx-auto px-4 animate-fade-in">
          <h2 className="text-4xl md:text-6xl font-extrabold text-[var(--color-heading)] mb-6 leading-tight">
            {t.home.welcome}
          </h2>
          <p className="text-lg md:text-xl text-[var(--color-text-light)] mb-10 max-w-2xl mx-auto leading-relaxed">
            {t.home.subtitle}
          </p>
          <button 
             onClick={() => document.getElementById('tools')?.scrollIntoView({ behavior: 'smooth' })}
             className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white px-8 py-4 rounded-2xl text-lg shadow-lg hover:shadow-xl transition transform hover:-translate-y-1 font-semibold"
          >
            {t.common.explore}
          </button>
        </div>
      </section>

      {/* Tools Section */}
      <section id="tools" className="container mx-auto px-4 py-20 mb-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <ToolCard
            title={t.tools.bmi.title}
            desc={t.tools.bmi.desc}
            onClick={() => setBmiOpen(true)}
            icon={<span className="text-2xl font-bold">BMI</span>}
          />

          <ToolCard
            title={t.tools.kcal.title}
            desc={t.tools.kcal.desc}
            onClick={() => setActiveTool('kcal')}
            icon={<span className="text-2xl">🔥</span>}
          />

          <ToolCard
            title={t.tools.bmr.title}
            desc={t.tools.bmr.desc}
            onClick={() => {}} // Placeholder
            icon={<span className="text-2xl">⚡</span>}
          />
        </div>
      </section>
    </>
  );
};

const AppContent = () => {
  const [bmiOpen, setBmiOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const { t, isRTL } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[var(--color-bg)]">
      <Header />

      <main className="flex-grow">
        {activeTool ? (
          <div className="container mx-auto px-4 py-8 pb-24 animate-fade-in">
            <button 
              onClick={() => setActiveTool(null)}
              className="flex items-center gap-2 text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] font-medium mb-6 transition group"
            >
              <span className={`text-xl transform transition-transform ${isRTL ? 'rotate-180 group-hover:translate-x-1' : 'group-hover:-translate-x-1'}`}>
                ←
              </span>
              {t.common.backHome}
            </button>
            
            {activeTool === 'kcal' && <KcalCalculator />}
          </div>
        ) : (
          <Dashboard setBmiOpen={setBmiOpen} setActiveTool={setActiveTool} />
        )}
      </main>

      <BmiModal open={bmiOpen} onClose={() => setBmiOpen(false)} />
      <Footer />
    </div>
  );
};

function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

export default App;
