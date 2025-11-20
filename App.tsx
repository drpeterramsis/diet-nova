
import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ToolCard from "./components/ToolCard";
import BmiModal from "./components/BmiModal";
import KcalCalculator from "./components/calculations/KcalCalculator";
import MealCreator from "./components/tools/MealCreator";
import FoodExchange from "./components/tools/FoodExchange";
import MealPlanner from "./components/tools/MealPlanner";
import Profile from "./components/Profile";
import ScrollToTopButton from "./components/ScrollToTopButton";
import Login from "./components/Login";
import Loading from "./components/Loading";
import { LanguageProvider, useLanguage } from "./contexts/LanguageContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Session } from "@supabase/supabase-js";

const Dashboard = ({ 
  setBmiOpen, 
  onToolClick,
  session
}: { 
  setBmiOpen: (v: boolean) => void, 
  onToolClick: (toolId: string) => void,
  session: Session | null
}) => {
  const { t, isRTL } = useLanguage();
  const { profile } = useAuth();
  
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
          {session && (
              <div className="mb-4 inline-block px-4 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium">
                {profile?.role === 'doctor' ? `👨‍⚕️ ${t.auth.doctor}` : `👤 ${t.auth.patient}`} : {profile?.full_name}
              </div>
          )}
          
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <ToolCard
            title={t.tools.bmi.title}
            desc={t.tools.bmi.desc}
            onClick={() => setBmiOpen(true)}
            icon={<span className="text-2xl font-bold">BMI</span>}
          />

          <ToolCard
            title={t.tools.kcal.title}
            desc={t.tools.kcal.desc}
            onClick={() => onToolClick('kcal')}
            icon={<span className="text-2xl">🔥</span>}
          />

          <ToolCard
            title={t.tools.mealCreator.title}
            desc={t.tools.mealCreator.desc}
            onClick={() => onToolClick('meal-creator')}
            icon={<span className="text-2xl">🥗</span>}
            locked={!session}
          />

           <ToolCard
            title={t.tools.mealPlanner.title}
            desc={t.tools.mealPlanner.desc}
            onClick={() => onToolClick('meal-planner')}
            icon={<span className="text-2xl">📅</span>}
          />

          <ToolCard
            title={t.tools.exchangeSimple.title}
            desc={t.tools.exchangeSimple.desc}
            onClick={() => onToolClick('exchange-simple')}
            icon={<span className="text-2xl">📋</span>}
          />

           <ToolCard
            title={t.tools.exchangePro.title}
            desc={t.tools.exchangePro.desc}
            onClick={() => onToolClick('exchange-pro')}
            icon={<span className="text-2xl">📊</span>}
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
  const [previousTool, setPreviousTool] = useState<string | null>(null);
  const [plannedKcal, setPlannedKcal] = useState<number>(0);
  const [showLogin, setShowLogin] = useState(false);
  
  const { t, isRTL } = useLanguage();
  const { session, loading } = useAuth();

  // Auto scroll to top when activeTool changes
  useEffect(() => {
    if (activeTool) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeTool]);

  // Close login modal automatically on successful login
  useEffect(() => {
    if (session) {
        setShowLogin(false);
    }
  }, [session]);

  if (loading) {
    return <Loading fullScreen text="Initializing Diet-Nova..." />;
  }

  const handleNavHome = () => {
    setActiveTool(null);
    setPreviousTool(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavTools = () => {
    setActiveTool(null);
    setPreviousTool(null);
    setTimeout(() => {
      const toolsSection = document.getElementById('tools');
      if (toolsSection) {
        toolsSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const handleNavProfile = () => {
      setActiveTool('profile');
  };

  const handleToolClick = (toolId: string) => {
      // Check restrictions
      if (toolId === 'meal-creator' && !session) {
          setShowLogin(true);
          return;
      }
      setActiveTool(toolId);
  };

  const handlePlanMeals = (kcal: number) => {
    setPlannedKcal(kcal);
    setPreviousTool(activeTool);
    setActiveTool('meal-planner');
  };

  const handleBackToCalculator = () => {
    if (previousTool) {
      setActiveTool(previousTool);
      setPreviousTool(null);
    }
  };

  // Helper to determine if complex tools should be kept alive
  const showKcal = activeTool === 'kcal';
  const showPlanner = activeTool === 'meal-planner';
  const isComplexFlow = showKcal || showPlanner;

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[var(--color-bg)]">
      <Header 
        onNavigateHome={handleNavHome} 
        onNavigateTools={handleNavTools}
        onNavigateProfile={handleNavProfile}
        onLoginClick={() => setShowLogin(true)}
      />

      <main className="flex-grow">
        {activeTool ? (
          <div className="container mx-auto px-4 py-8 pb-24 animate-fade-in">
            <button 
              onClick={() => {
                setActiveTool(null);
                setPreviousTool(null);
              }}
              className="flex items-center gap-2 text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] font-medium mb-6 transition group"
            >
              <span className={`text-xl transform transition-transform ${isRTL ? 'rotate-180 group-hover:translate-x-1' : 'group-hover:-translate-x-1'}`}>
                ←
              </span>
              {t.common.backHome}
            </button>
            
            {/* Complex State Persistence Logic */}
            {isComplexFlow && (
              <>
                <div className={showKcal ? 'block' : 'hidden'}>
                  <KcalCalculator onPlanMeals={handlePlanMeals} />
                </div>
                <div className={showPlanner ? 'block' : 'hidden'}>
                  <MealPlanner 
                    initialTargetKcal={plannedKcal} 
                    onBack={previousTool === 'kcal' ? handleBackToCalculator : undefined}
                  />
                </div>
              </>
            )}

            {/* Standard Tools (Unmount when inactive) */}
            {activeTool === 'meal-creator' && <MealCreator />}
            {activeTool === 'exchange-simple' && <FoodExchange mode="simple" />}
            {activeTool === 'exchange-pro' && <FoodExchange mode="pro" />}
            {activeTool === 'profile' && <Profile />}

          </div>
        ) : (
          <Dashboard setBmiOpen={setBmiOpen} onToolClick={handleToolClick} session={session} />
        )}
      </main>

      {/* ScrollToTopButton */}
      <ScrollToTopButton />

      {/* Modals */}
      <BmiModal open={bmiOpen} onClose={() => setBmiOpen(false)} />
      
      {showLogin && (
        <Login onClose={() => setShowLogin(false)} />
      )}
      
      <Footer />
    </div>
  );
};

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;