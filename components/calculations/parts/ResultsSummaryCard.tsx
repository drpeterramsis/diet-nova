import React from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { KcalResults } from '../hooks/useKcalCalculations';

const ResultRow = ({ label, val, sub, col }: any) => (
  <div className="flex justify-between items-center p-3 bg-[var(--color-bg-soft)] rounded-lg border border-transparent hover:border-[var(--color-border)] transition">
      <span className="font-medium text-gray-700">{label}</span>
      <div className="text-right">
          <div className={`font-bold text-lg ${col || 'text-[var(--color-primary)]'}`} dir="ltr">{val}</div>
          {sub && <div className={`text-xs ${col || 'text-gray-500'}`}>{sub}</div>}
      </div>
  </div>
);

interface ResultsSummaryProps {
  results: KcalResults;
}

const ResultsSummaryCard: React.FC<ResultsSummaryProps> = ({ results: r }) => {
  const { t } = useLanguage();

  return (
    <div className="card bg-white shadow-xl ring-1 ring-[var(--color-border)]">
      <h2 className="text-xl font-bold text-[var(--color-heading)] mb-4 flex items-center gap-2">
          📊 {t.kcal.summary}
      </h2>
      <div className="space-y-3">
          <ResultRow 
              label={t.kcal.weightLoss} 
              val={r.weightLoss ? `${r.weightLoss}%` : '-'} 
              sub={r.weightLossRef} 
              col={r.weightLossColor}
          />
          <ResultRow 
              label={t.kcal.dryWeight} 
              val={r.dryWeight ? `${r.dryWeight} kg` : '-'}
          />
          <ResultRow 
              label={`BMI`} 
              val={r.bmi || '-'} 
              sub={r.bmiRef}
              col={r.bmiColor}
          />
          <ResultRow 
              label={`BMI (Sel)`} 
              val={r.bmiSel || '-'} 
              sub={r.bmiSelRef}
              col={r.bmiSelColor}
          />
      </div>
    </div>
  );
};

export default ResultsSummaryCard;