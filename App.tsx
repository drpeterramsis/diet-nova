import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ToolCard from "./components/ToolCard";
import BmiModal from "./components/BmiModal";
import KcalCalculator from "./components/calculations/KcalCalculator";
import MealCreator from "./components/tools/MealCreator";
import FoodExchange from "./components/tools/FoodExchange";
import { MealPlanner } from "./components/tools/MealPlanner";
import ClientManager from "./components/tools/ClientManager";
import BmrCalculator from "./components/tools/BmrCalculator";
import NFPEChecklist from "./components/tools/NFPEChecklist";
import Encyclopedia from "./components/tools/Encyclopedia";
import Profile from "./components/Profile";
import UserDashboard from "./components/UserDashboard";
import ScrollToTopButton from "./components/ScrollToTopButton";
import Login from "./components/Login";
import Loading from "./components/Loading";
import ToolsGrid from "./components/ToolsGrid";
import { LanguageProvider, useLanguage } from "./contexts/LanguageContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Session } from "@supabase/supabase-js";
import { KcalInitialData } from "./components/calculations/hooks/useKcalCalculations";
import { Client, ClientVisit } from "./types";

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
          <div className="flex gap-4 justify-center">
              <button 
                onClick={() => document.getElementById('tools')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white px-8 py-4 rounded-2xl text-lg shadow-lg hover:shadow-xl transition transform hover:-translate-y-1 font-semibold"
              >
                {t.common.explore}
              </button>
              <button 
                onClick={() => onToolClick('encyclopedia')}
                className="bg-white hover:bg-gray-50 text-[var(--color-primary)] border border-[var(--color-primary)] px-8 py-4 rounded-2xl text-lg shadow-md hover:shadow-lg transition transform hover:-translate-y-1 font-semibold flex items-center gap-2"
              >
                <span>📚</span> Encyclopedia
              </button>
          </div>
        </div>
      </section>

      {/* Encyclopedia Teaser Section */}
      <section className="container mx-auto px-4 py-12">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-6 cursor-pointer transform hover:scale-[1.01] transition duration-300" onClick={() => onToolClick('encyclopedia')}>
              <div className="flex items-center gap-6">
                  <div className="text-6xl bg-white/20 p-4 rounded-full">📚</div>
                  <div>
                      <h3 className="text-2xl font-bold mb-2">Nutrient Encyclopedia</h3>
                      <p className="opacity-90 max-w-lg">Access our comprehensive library of Vitamins & Minerals. View food sources, functions, deficiencies, and reference charts.</p>
                  </div>
              </div>
              <button className="bg-white text-blue-600 px-6 py-3 rounded-xl font-bold hover:bg-gray-100 transition whitespace-nowrap shadow-md">
                  Browse Encyclopedia
              </button>
          </div>
      </section>

      {/* Tools Section */}
      <section id="tools" className="container mx-auto px-4 py-10 mb-10">
        <h3 className="text-3xl font-bold text-[var(--color-heading)] mb-8 text-center border-b pb-4 border-gray-200">
            Professional Tools
        </h3>
        <ToolsGrid 
            onToolClick={onToolClick} 
            setBmiOpen={setBmiOpen} 
            isAuthenticated={!!session} 
        />
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
  const [selectedLoadId, setSelectedLoadId] = useState<string | null>(null);
  
  // Extra Nav Flags
  const [autoOpenLoad, setAutoOpenLoad] = useState(false);
  const [autoOpenNew, setAutoOpenNew] = useState(false);

  // Data passing between tools
  const [toolData, setToolData] = useState<any>(null);
  // Specific to Kcal Calculator linked to a visit
  const [currentVisit, setCurrentVisit] = useState<{client: Client, visit: ClientVisit} | null>(null);
  // Specific to NFPE
  const [currentClientForNFPE, setCurrentClientForNFPE] = useState<Client | undefined>(undefined);
  
  const { t, isRTL } = useLanguage();
  const { session, profile, loading } = useAuth();

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
    setSelectedLoadId(null);
    setToolData(null);
    setCurrentVisit(null);
    setCurrentClientForNFPE(undefined);
    setAutoOpenLoad(false);
    setAutoOpenNew(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavTools = () => {
    if (activeTool) {
      handleNavHome();
    }
    
    setTimeout(() => {
      const toolsLanding = document.getElementById('tools'); 
      const toolsDashboard = document.getElementById('dashboard-tools'); 
      
      if (toolsLanding) {
        toolsLanding.scrollIntoView({ behavior: 'smooth' });
      } else if (toolsDashboard) {
        toolsDashboard.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const handleNavProfile = () => {
      setActiveTool('profile');
  };

  const handleToolClick = (toolId: string, loadId?: string, action?: 'load' | 'new') => {
      if (toolId === 'meal-creator' && !session) {
          setShowLogin(true);
          return;
      }
      if (toolId === 'client-manager') {
        if (!session) {
            setShowLogin(true);
            return;
        }
        if (profile?.role !== 'doctor') {
            alert("Access Restricted: This tool is for nutritionists only.");
            return;
        }
      }
      if (loadId) {
          setSelectedLoadId(loadId);
      } else {
          setSelectedLoadId(null);
      }
      
      // Set flags for auto actions
      setAutoOpenLoad(action === 'load');
      setAutoOpenNew(action === 'new');

      setToolData(null); // Reset tool data on clean navigation
      setCurrentVisit(null); // Reset visit linkage
      setCurrentClientForNFPE(undefined); // Reset NFPE linkage
      setActiveTool(toolId);
  };

  const handlePlanMeals = (kcal: number) => {
    setPlannedKcal(kcal);
    setPreviousTool(activeTool);
    setActiveTool('meal-planner');
  };

  const handleAnalyzeClient = (client: Client, visit: ClientVisit) => {
      // Map Client Visit data to KcalInitialData
      const initData: KcalInitialData = {
          gender: client.gender,
          age: client.age,
          dob: client.dob,
          // Use visit data preferably, fallback to client profile
          weight: visit.weight || client.weight,
          height: visit.height || client.height
      };
      
      setToolData(initData);
      setCurrentVisit({ client, visit });
      setActiveTool('kcal');
  };

  const handlePlanMealsForClient = (client: Client, visit: ClientVisit) => {
      setCurrentVisit({ client, visit });
      setActiveTool('meal-planner');
  };

  const handleRunNFPEForClient = (client: Client) => {
      setCurrentClientForNFPE(client);
      setActiveTool('nfpe');
  };

  const handleBackToCalculator = () => {
    if (previousTool) {
      setActiveTool(previousTool);
      setPreviousTool(null);
    }
  };

  const handleBackToClientProfile = () => {
     if (currentVisit) {
         setActiveTool('client-manager');
         // Pass the client ID to auto-open the profile view in ClientManager
         setSelectedLoadId(currentVisit.client.id); 
         setCurrentVisit(null); // Clear visit context as we are exiting the tool
     }
  };

  const handleBackFromNFPE = () => {
      if (currentClientForNFPE) {
          setActiveTool('client-manager');
          setSelectedLoadId(currentClientForNFPE.id);
          setCurrentClientForNFPE(undefined);
      } else {
          handleNavHome();
      }
  };

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
            <div className="flex items-center justify-between mb-6 no-print">
                <button 
                  onClick={handleNavHome}
                  className="flex items-center gap-2 text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] font-medium transition group"
                >
                  <span className={`text-xl transform transition-transform ${isRTL ? 'rotate-180 group-hover:translate-x-1' : 'group-hover:-translate-x-1'}`}>
                    ←
                  </span>
                  {t.common.backHome}
                </button>
                
                {/* Back to Client Profile Button */}
                {currentVisit && isComplexFlow && (
                    <div className="flex items-center gap-3">
                         <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-xs font-bold shadow-sm hidden sm:flex items-center gap-2">
                             <span>👥 Client Mode: {currentVisit.client.full_name}</span>
                         </div>
                         <button 
                             onClick={handleBackToClientProfile}
                             className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition shadow-sm flex items-center gap-2"
                         >
                             <span>👤</span> Back to Profile
                         </button>
                    </div>
                )}
            </div>
            
            {/* Complex State Persistence Logic */}
            {isComplexFlow && (
              <>
                <div className={showKcal ? 'block' : 'hidden'}>
                  <KcalCalculator 
                    onPlanMeals={handlePlanMeals} 
                    initialData={toolData} 
                    activeVisit={currentVisit} // Pass visit context
                  />
                </div>
                <div className={showPlanner ? 'block' : 'hidden'}>
                  <MealPlanner 
                    initialTargetKcal={plannedKcal} 
                    onBack={previousTool === 'kcal' ? handleBackToCalculator : undefined}
                    initialLoadId={activeTool === 'meal-planner' ? selectedLoadId : null}
                    autoOpenLoad={autoOpenLoad}
                    autoOpenNew={autoOpenNew}
                    activeVisit={currentVisit} // Pass visit context
                  />
                </div>
              </>
            )}

            {/* Standard Tools (Unmount when inactive) */}
            {activeTool === 'meal-creator' && (
                <MealCreator 
                    initialLoadId={selectedLoadId} 
                    autoOpenLoad={autoOpenLoad}
                    autoOpenNew={autoOpenNew}
                />
            )}
            {activeTool === 'exchange-simple' && <FoodExchange mode="simple" />}
            {activeTool === 'exchange-pro' && <FoodExchange mode="pro" />}
            {activeTool === 'client-manager' && (
                <ClientManager 
                    initialClientId={selectedLoadId} 
                    onAnalyzeInKcal={handleAnalyzeClient}
                    onPlanMeals={handlePlanMealsForClient}
                    onRunNFPE={handleRunNFPEForClient}
                    autoOpenNew={autoOpenNew}
                />
            )}
            {activeTool === 'bmr' && <BmrCalculator />}
            {activeTool === 'profile' && <Profile />}
            {activeTool === 'nfpe' && (
                <NFPEChecklist 
                    client={currentClientForNFPE} 
                    onBack={currentClientForNFPE ? handleBackFromNFPE : undefined} 
                />
            )}
            {activeTool === 'encyclopedia' && <Encyclopedia />}

          </div>
        ) : (
           session ? (
             <UserDashboard onNavigateTool={handleToolClick} setBmiOpen={setBmiOpen} />
           ) : (
             <Dashboard setBmiOpen={setBmiOpen} onToolClick={handleToolClick} session={session} />
           )
        )}
      </main>

      {/* ScrollToTopButton */}
      <div className="no-print">
        <ScrollToTopButton />
      </div>

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