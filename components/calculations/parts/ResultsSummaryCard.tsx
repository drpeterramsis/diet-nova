import React from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { KcalResults } from '../hooks/useKcalCalculations';

interface ResultsSummaryProps {
  results: KcalResults;
  onPlanMeals?: (kcal: number) => void;
  reqKcal?: number | '';
  setReqKcal?: (val: number | '') => void;
}

const ResultsSummaryCard: React.FC<ResultsSummaryProps> = ({ results: r, onPlanMeals, reqKcal, setReqKcal }) => {
  const { t } = useLanguage();

  return (
    <div className="card bg-white shadow-md border border-gray-200 overflow-hidden">
      {/* Header with Dry Weight */}
      <div className="p-4 bg-[var(--color-primary)] text-white flex justify-between items-center">
          <h2 className="text-lg font-bold flex items-center gap-2">
              📊 {t.kcal.summary}
          </h2>
          <div className="text-right">
              <div className="text-[10px] uppercase opacity-80">{t.kcal.dryWeight}</div>
              <div className="font-mono font-bold text-xl leading-none">{r.dryWeight} <span className="text-sm">kg</span></div>
          </div>
      </div>
      
      <div className="p-4 space-y-4">
          {/* Status Indicators Grid */}
          <div className="grid grid-cols-2 gap-3">
              {/* BMI */}
              <div className="text-center p-3 rounded-xl border border-gray-100 bg-gray-50 flex flex-col justify-center min-h-[100px]">
                  <div className="text-[10px] text-gray-500 uppercase tracking-wide font-bold mb-1">BMI</div>
                  <div className={`text-3xl font-extrabold ${r.bmiColor || 'text-gray-800'}`}>{r.bmi}</div>
                  <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-2 self-center ${r.bmiColor ? r.bmiColor.replace('text-', 'bg-').replace('600', '100').replace('500', '100') + ' ' + r.bmiColor : 'bg-gray-100 text-gray-500'}`}>
                      {r.bmiRef || '-'}
                  </div>
              </div>

              {/* Weight Loss */}
              <div className="text-center p-3 rounded-xl border border-gray-100 bg-gray-50 flex flex-col justify-center min-h-[100px]">
                  <div className="text-[10px] text-gray-500 uppercase tracking-wide font-bold mb-1">{t.kcal.weightLoss}</div>
                  <div className={`text-3xl font-extrabold ${r.weightLossColor || 'text-gray-700'}`}>{r.weightLoss}%</div>
                  {r.weightLossRef ? (
                      <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-2 self-center ${r.weightLossColor ? r.weightLossColor.replace('text-', 'bg-').replace('600', '100').replace('500', '100') + ' ' + r.weightLossColor : 'bg-gray-100 text-gray-500'}`}>
                          {r.weightLossRef}
                      </div>
                  ) : <div className="mt-2 text-[10px] text-gray-400">-</div>}
              </div>
          </div>

          {/* Action Area */}
          {onPlanMeals && setReqKcal !== undefined && (
            <div className="pt-4 border-t border-gray-100 animate-fade-in">
               <div className="mb-3">
                   <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">{t.kcal.kcalRequired}</label>
                   <input 
                     type="number" 
                     className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)] outline-none font-bold text-2xl text-center text-gray-800 transition shadow-inner"
                     placeholder="0"
                     value={reqKcal}
                     onChange={(e) => setReqKcal(Number(e.target.value))}
                     dir="ltr"
                   />
               </div>
               <button 
                 onClick={() => reqKcal && onPlanMeals(Number(reqKcal))}
                 disabled={!reqKcal}
                 className="w-full bg-gray-800 hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed text-white py-3.5 rounded-xl transition font-bold shadow-lg flex items-center justify-center gap-2 transform active:scale-95"
               >
                 <span>📅</span> {t.kcal.planMeals}
               </button>
            </div>
          )}
      </div>
    </div>
  );
};

export default ResultsSummaryCard;