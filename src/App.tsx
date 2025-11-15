import React from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import BMI from './components/BMI';

const App: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-grow container mx-auto p-5">
        <h1 className="text-2xl font-bold mb-4">Nutrition Calculators</h1>

        {/* BMI Card */}
        <BMI />

        {/* لاحقًا ممكن نضيف أدوات أخرى هنا */}
      </main>

      <Footer />
    </div>
  );
};

export default App;
