import React from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { KcalResults } from '../hooks/useKcalCalculations';

interface WeightAnalysisProps {
  results: KcalResults;
}

const WeightAnalysisCard: React.FC<WeightAnalysisProps> = ({ results: r }) => {
  const { t } = useLanguage();

  return (
    <div className="card bg-white shadow-lg">
      <h2 className="text-xl font-bold text-[var(--color-heading)] mb-4">
          {t.kcal.weightAnalysis}
      </h2>
      <div className="space-y-4 text-sm">
          <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex justify-between mb-1">
                  <span className="text-gray-600">{t.kcal.idealWeightSimple}</span>
                  <span className="font-bold font-mono text-[var(--color-primary)]">{r.IBW || '-'} kg</span>
              </div>
              {r.IBW && <div className="text-xs text-right text-gray-500">{r.IBW_diff_val?.toFixed(1)}% Diff</div>}
          </div>

          <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex justify-between">
                  <span className="text-gray-600">{t.kcal.adjustedWeight}</span>
                  <span className="font-bold font-mono text-[var(--color-primary)]">{r.ABW || '-'} kg</span>
              </div>
          </div>

           <div className="p-3 bg-green-50 border border-green-100 rounded-lg">
              <div className="flex justify-between mb-1">
                  <span className="text-[var(--color-primary-dark)] font-medium">{t.kcal.idealWeightAccurate}</span>
                  <span className="font-bold font-mono text-[var(--color-primary-dark)]">{r.IBW_2 || '-'} kg</span>
              </div>
               {r.IBW_2 && <div className="text-xs text-right text-green-700">{r.IBW_sel_diff_val?.toFixed(1)}% Diff</div>}
          </div>
      </div>
    </div>
  );
};

export default WeightAnalysisCard;