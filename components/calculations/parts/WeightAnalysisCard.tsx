
import React from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { KcalResults } from '../hooks/useKcalCalculations';

interface WeightAnalysisProps {
  results: KcalResults;
}

const WeightAnalysisCard: React.FC<WeightAnalysisProps> = ({ results: r }) => {
  const { t } = useLanguage();

  return (
    <div className="card bg-white shadow-md border border-blue-100 overflow-hidden">
      <div className="p-3 bg-blue-50 border-b border-blue-100 flex justify-between items-center">
          <h2 className="text-sm font-bold text-blue-900 uppercase tracking-wider">
              {t.kcal.weightAnalysis}
          </h2>
          {/* Protocol Badge */}
          {r.protocol && !r.pediatric && (
             <span className={`text-[9px] font-bold px-2 py-1 rounded-full border ${r.protocol.isHighObesity ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-green-100 text-green-700 border-green-200'}`}>
                 {r.protocol.isHighObesity ? 'Adjusted Wt' : 'Ideal Wt'}
             </span>
          )}
          {r.pediatric && (
              <span className="text-[9px] font-bold px-2 py-1 rounded-full border bg-purple-100 text-purple-700 border-purple-200">
                  Pediatric
              </span>
          )}
      </div>

      <div className="p-4 space-y-4">
          {/* Weight Comparison Grid */}
          <div className="grid grid-cols-2 gap-4 p-3 rounded-lg bg-gray-50 border border-gray-100">
              <div className="text-center border-r border-gray-200 pr-2">
                  <div className="text-[10px] font-bold text-gray-400 uppercase">Dry (Actual)</div>
                  <div className="font-mono font-bold text-lg text-gray-800">{r.dryWeight} kg</div>
                  <div className={`text-xs font-bold ${r.bmiColor}`}>{r.bmi} BMI</div>
              </div>
              <div className="text-center pl-2">
                  <div className="text-[10px] font-bold text-blue-400 uppercase">Selected</div>
                  <div className="font-mono font-bold text-lg text-blue-800">{r.bmiSel !== '0.0' ? 'Using Sel.' : '-'}</div>
                  <div className={`text-xs font-bold ${r.bmiSelColor}`}>{r.bmiSel} BMI</div>
              </div>
          </div>

          {/* Pediatric IBW Analysis */}
          {r.pediatric && (
              <div className="space-y-2">
                  <h4 className="text-xs font-bold text-purple-700 uppercase border-b border-purple-100 pb-1">Pediatric Ideal Weight Methods</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 bg-purple-50 rounded border border-purple-100">
                          <div className="text-purple-600 font-bold mb-1">Moore's Method</div>
                          <div className="text-sm font-mono font-bold text-gray-800">{r.pediatric.ibwMoore || '-'} kg</div>
                          <div className="text-[9px] text-gray-500">Wt at Height %ile</div>
                      </div>
                      <div className="p-2 bg-purple-50 rounded border border-purple-100">
                          <div className="text-purple-600 font-bold mb-1">BMI 50th %ile</div>
                          <div className="text-sm font-mono font-bold text-gray-800">{r.pediatric.ibwBMI50 || '-'} kg</div>
                          <div className="text-[9px] text-gray-500">Target BMI 50%</div>
                      </div>
                      <div className="p-2 bg-gray-50 rounded border border-gray-100">
                          <div className="text-gray-500 font-bold mb-1">New APLS Eq.</div>
                          <div className="text-sm font-mono font-bold text-gray-700">{r.pediatric.ibwAPLS || '-'} kg</div>
                      </div>
                      <div className="p-2 bg-gray-50 rounded border border-gray-100">
                          <div className="text-gray-500 font-bold mb-1">Best Guess Eq.</div>
                          <div className="text-sm font-mono font-bold text-gray-700">{r.pediatric.ibwBestGuess || '-'} kg</div>
                      </div>
                  </div>
              </div>
          )}

          {/* Adult Protocol Recommendation Box */}
          {!r.pediatric && r.protocol && (
              <div>
                  <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded text-center">
                      <div className="text-xs font-bold text-green-700 uppercase">✅ Recommendation</div>
                      <div className="font-mono text-xl font-extrabold text-green-800">
                          {r.protocol.recommendedWeight.toFixed(1)} <span className="text-sm">kg</span>
                      </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 bg-white border border-gray-200 rounded">
                          <div className="text-gray-500 font-bold">IBW (Hamwi)</div>
                          <div className="font-mono text-gray-800 font-bold">{r.IBW_2} kg</div>
                      </div>
                      <div className="p-2 bg-white border border-gray-200 rounded">
                          <div className="text-gray-500 font-bold">Adj. BW</div>
                          <div className="font-mono text-gray-800 font-bold">{r.ABW_2} kg</div>
                      </div>
                  </div>
              </div>
          )}
      </div>
    </div>
  );
};

export default WeightAnalysisCard;
