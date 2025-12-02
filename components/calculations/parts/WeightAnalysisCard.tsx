import React from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { KcalResults } from '../hooks/useKcalCalculations';

interface WeightAnalysisProps {
  results: KcalResults;
}

const WeightAnalysisCard: React.FC<WeightAnalysisProps> = ({ results: r }) => {
  const { t } = useLanguage();

  return (
    <div className="card bg-white shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
          <h2 className="text-sm font-bold text-[var(--color-heading)] uppercase tracking-wider">
              {t.kcal.weightAnalysis}
          </h2>
          {/* Protocol Badge */}
          {r.protocol && (
             <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${r.protocol.isHighObesity ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-green-100 text-green-700 border-green-200'}`}>
                 {r.protocol.isHighObesity ? 'Adjusted Wt. Indicated' : 'Ideal Wt. Indicated'}
             </span>
          )}
      </div>

      <div className="p-4 space-y-4">
          {/* Protocol Recommendation Box */}
          {r.protocol && (
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-white border-l-4 border-blue-500 rounded-r-lg shadow-sm">
                  <div>
                      <div className="text-xs text-gray-500 font-medium uppercase mb-0.5">{t.kcal.recommendation}</div>
                      <div className="text-sm font-bold text-blue-800">
                          {t.kcal[r.protocol.recommendationLabel as keyof typeof t.kcal]}
                      </div>
                  </div>
                  <div className="text-right">
                      <div className="text-2xl font-mono font-bold text-blue-600 leading-none">
                          {r.protocol.recommendedWeight.toFixed(1)}
                      </div>
                      <div className="text-[10px] text-gray-400">kg</div>
                  </div>
              </div>
          )}

          {/* Compact Grid of Weights */}
          <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 bg-gray-50 rounded border border-gray-100">
                  <div className="flex justify-between items-end mb-1">
                      <span className="text-[10px] text-gray-500 font-bold uppercase">{t.kcal.idealWeightSimple}</span>
                      <span className="text-[10px] text-gray-400">{r.IBW_diff_val?.toFixed(0)}%</span>
                  </div>
                  <div className="font-mono font-bold text-gray-700">{r.IBW || '-'} <span className="text-xs font-normal text-gray-400">kg</span></div>
              </div>

              <div className="p-2.5 bg-gray-50 rounded border border-gray-100">
                  <div className="flex justify-between items-end mb-1">
                      <span className="text-[10px] text-gray-500 font-bold uppercase">{t.kcal.idealWeightAccurate}</span>
                      <span className="text-[10px] text-gray-400">{r.IBW_sel_diff_val?.toFixed(0)}%</span>
                  </div>
                  <div className="font-mono font-bold text-gray-700">{r.IBW_2 || '-'} <span className="text-xs font-normal text-gray-400">kg</span></div>
              </div>

              <div className="p-2.5 bg-gray-50 rounded border border-gray-100">
                  <div className="mb-1">
                      <span className="text-[10px] text-gray-500 font-bold uppercase">{t.kcal.adjustedWeight}</span>
                  </div>
                  <div className="font-mono font-bold text-gray-700">{r.ABW || '-'} <span className="text-xs font-normal text-gray-400">kg</span></div>
              </div>

              <div className="p-2.5 bg-gray-50 rounded border border-gray-100">
                  <div className="mb-1">
                      <span className="text-[10px] text-gray-500 font-bold uppercase">{t.kcal.threshold}</span>
                  </div>
                  <div className="font-mono font-bold text-gray-600">{r.protocol?.threshold.toFixed(1) || '-'} <span className="text-xs font-normal text-gray-400">kg</span></div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default WeightAnalysisCard;