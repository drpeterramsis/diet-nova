import { useState } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ToolCard from "./components/ToolCard";
import BmiModal from "./components/BmiModal";
import KcalCalculator from "./components/KcalCalculator"; // استيراد المكون الجديد

function App() {
  const [bmiOpen, setBmiOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);

  // دالة للعودة للصفحة الرئيسية
  const handleBackToHome = () => {
    setActiveTool(null);
  };

  // إذا كان هناك أداة نشطة، اعرضها فقط
  if (activeTool) {
    return (
      <>
        <Header />
        
        {/* زر العودة للرئيسية */}
        <div className="container mx-auto px-4 py-4">
          <button 
            onClick={handleBackToHome}
            className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white px-4 py-2 rounded-lg transition mb-4"
          >
            ← Back to Home
          </button>
        </div>

        {/* عرض الأداة النشطة */}
        <div className="container mx-auto px-4 pb-20">
          {activeTool === 'kcal' && <KcalCalculator />}
          {/* يمكنك إضافة أدوات أخرى هنا لاحقاً */}
        </div>

        <Footer />
      </>
    );
  }

  // الصفحة الرئيسية
  return (
    <>
      <Header />

      {/* Hero Section */}
      <section className="text-center py-20 bg-[var(--color-bg-soft)]">
        <h2 className="text-4xl font-bold text-[var(--color-heading)]">
          Welcome to Diet-Nova
        </h2>

        <p className="text-lg text-[var(--color-text-light)] mt-4 max-w-xl mx-auto">
          Advanced nutrition tools, calculators, and personalized health insights.
        </p>

        <button className="mt-6 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] 
          text-white px-6 py-3 rounded-xl text-lg shadow-md transition">
          Explore Tools
        </button>
      </section>

      {/* Tools Section */}
      <section className="px-4 grid grid-cols-1 md:grid-cols-3 gap-6 my-10 container mx-auto">
        <ToolCard
          title="BMI Calculator"
          desc="Calculate your BMI instantly."
          onClick={() => setBmiOpen(true)}
        />

        <ToolCard
          title="Kcal Calculator"
          desc="Advanced calorie calculations for adults."
          onClick={() => setActiveTool('kcal')}
        />

        <ToolCard
          title="BMR Calculator"
          desc="Know your basal metabolic rate."
          onClick={() => alert("Coming soon")}
        />
      </section>

      {/* BMI Modal */}
      <BmiModal open={bmiOpen} onClose={() => setBmiOpen(false)} />

      <Footer />
    </>
  );
}

export default App;