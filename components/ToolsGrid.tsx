import React from 'react';
import ToolCard from './ToolCard';
import { useLanguage } from '../contexts/LanguageContext';

interface ToolsGridProps {
  onToolClick: (toolId: string) => void;
  setBmiOpen: (v: boolean) => void;
  isAuthenticated: boolean;
}

const ToolsGrid: React.FC<ToolsGridProps> = ({ onToolClick, setBmiOpen, isAuthenticated }) => {
  const { t } = useLanguage();

  return (
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
        locked={!isAuthenticated}
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
  );
};

export default ToolsGrid;