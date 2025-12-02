

import React from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { KcalResults } from '../hooks/useKcalCalculations';
import { WeightComparison } from '../../Visuals';

interface WeightAnalysisProps {
  results: KcalResults;
}

const WeightAnalysisCard: React.FC<WeightAnalysisProps> = ({ results: r }) => {
  const { t } = useLanguage();
  
  // Parse numeric values for the chart
  const idealWeight = parseFloat(r.IBW) || 0;
  const dryWeight = parseFloat(r.dryWeight) || 0;

  return (
    <div className="card bg-white shadow-lg">
      <h2 className="text-xl font-bold text-[var(--color-heading)] mb-4">
          {t.kcal.weightAnalysis}
      </h2>

      {/* Chart */}
      {dryWeight > 0 && idealWeight > 0 && (
        <div className="mb-6 border-b border-gray-100 pb-4">
           <WeightComparison 
              actual={dryWeight} 
              ideal={idealWeight} 
              labelActual={t.kcal.dryWeight}
              labelIdeal="Ideal"
           />
        </div>
      )}

      <div className="space-y-4 text-sm">
          {/* Protocol Check Section (New) */}
          {r.protocol && (
              <div className={`p-4 rounded-xl border-l-4 ${r.protocol.isHighObesity ? 'bg-orange-50 border-orange-400' : 'bg-blue-50 border-blue-400'}`}>
                  <h3 className={`font-bold mb-2 uppercase text-xs ${r.protocol.isHighObesity ? 'text-orange-700' : 'text-blue-700'}`}>
                      {t.kcal.protocolCheck}
                  </h3>
                  <div className="space-y-1 mb-3">
                      <div className="flex justify-between">
                          <span className="text-gray-600">Ideal (Accurate):</span>
                          <span className="font-mono font-bold">{r.IBW_2} kg</span>
                      </div>
                      <div className="flex justify-between text-xs opacity-80">
                          <span className="text-gray-500">{t.kcal.threshold}:</span>
                          <span className="font-mono">{r.protocol.threshold.toFixed(1)} kg</span>
                      </div>
                      <div className="flex justify-between border-t border-black/5 pt-1 mt-1">
                          <span className="text-gray-600 font-medium">Current Dry Wt:</span>
                          <span className={`font-mono font-bold ${r.protocol.isHighObesity ? 'text-red-600' : 'text-gray-700'}`}>
                              {r.dryWeight} kg
                          </span>
                      </div>
                  </div>
                  <div className="bg-white p-2 rounded text-center border border-gray-200">
                      <span className="block text-xs text-gray-400 uppercase tracking-wide mb-1">{t.kcal.recommendation}</span>
                      <span className={`font-bold text-sm ${r.protocol.isHighObesity ? 'text-orange-600' : 'text-blue-600'}`}>
                          {t.kcal[r.protocol.recommendationLabel as keyof typeof t.kcal]}
                      </span>
                      <div className="text-lg font-extrabold text-gray-800 mt-1">
                          {r.protocol.recommendedWeight.toFixed(1)} kg
                      </div>
                  </div>
              </div>
          )}

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