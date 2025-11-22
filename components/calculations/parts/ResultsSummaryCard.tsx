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
  onPlanMeals?: (kcal: number) => void;
  reqKcal?: number | '';
  setReqKcal?: (val: number | '') => void;
}

const ResultsSummaryCard: React.FC<ResultsSummaryProps> = ({ results: r, onPlanMeals, reqKcal, setReqKcal }) => {
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

      {/* Action Area */}
      {onPlanMeals && setReqKcal !== undefined && (
        <div className="mt-6 pt-4 border-t border-gray-100">
           <div className="mb-3">
             <label className="block text-sm font-medium text-gray-700 mb-1">{t.kcal.kcalRequired}</label>
             <input 
               type="number" 
               className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-center font-bold text-lg"
               placeholder="2000"
               value={reqKcal}
               onChange={(e) => setReqKcal(Number(e.target.value))}
               dir="ltr"
             />
           </div>
           <button 
             onClick={() => reqKcal && onPlanMeals(Number(reqKcal))}
             disabled={!reqKcal}
             className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 rounded-lg transition font-medium shadow-sm flex items-center justify-center gap-2"
           >
             <span>📅</span> {t.kcal.planMeals}
           </button>
        </div>
      )}
    </div>
  );
};

export default ResultsSummaryCard;