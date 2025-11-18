import { useState } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ToolCard from "./components/ToolCard";

import BmiModal from "./components/BmiModal";
// import BmrSection from "./components/BmrSection";

function App() {
  const [bmiOpen, setBmiOpen] = useState(false);

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

      {/* Tools */}
      <section className="px-4 grid grid-cols-1 md:grid-cols-3 gap-6 my-10 container mx-auto">
        <ToolCard
          title="BMI Calculator"
          desc="Calculate your BMI instantly."
          onClick={() => setBmiOpen(true)}
        />

        {/* BMR (disabled for now) */}
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
