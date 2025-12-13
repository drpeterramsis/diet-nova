
import React, { useState } from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { KcalResults } from '../hooks/useKcalCalculations';

interface ResultsSummaryProps {
  results: KcalResults;
  onPlanMeals?: (kcal: number) => void;
  reqKcal?: number | '';
  setReqKcal?: (val: number | '') => void;
  notes?: string;
  setNotes?: (val: string) => void;
}

interface TooltipProps {
    formula: string;
    details?: string;
}

const EquationTooltip: React.FC<TooltipProps> = ({ formula, details }) => (
    <div className="group relative inline-block ml-1 z-[999]">
        <span className="cursor-help text-blue-300 text-[9px] font-bold border border-blue-500/30 rounded-full w-3.5 h-3.5 inline-flex items-center justify-center bg-blue-500/10 hover:bg-blue-500 hover:text-white transition">
            i
        </span>
        <div className="hidden group-hover:block absolute right-0 top-full mt-2 w-max max-w-[280px] bg-gray-900 text-white text-[10px] p-3 rounded-lg shadow-xl break-words text-left leading-relaxed border border-gray-700 z-[9999]">
            {formula && <div className="font-bold text-blue-300 mb-1 border-b border-gray-700 pb-1">Equation:</div>}
            {formula && <div className="font-mono mb-2 whitespace-pre-wrap">{formula}</div>}
            {details && (
                <>
                    <div className="font-bold text-green-300 mb-1 border-b border-gray-700 pb-1">Calculation:</div>
                    <div className="font-mono text-gray-300 whitespace-pre-wrap">{details}</div>
                </>
            )}
        </div>
    </div>
);

const ResultsSummaryCard: React.FC<ResultsSummaryProps> = ({ results: r, onPlanMeals, reqKcal, setReqKcal, notes, setNotes }) => {
  const { t } = useLanguage();
  const [showSelectModal, setShowSelectModal] = useState(false);

  const handleSelect = (val: number) => {
      if(setReqKcal) setReqKcal(Number(val.toFixed(0)));
      setShowSelectModal(false);
  };

  // Prepare Selection Data with Notes
  const options = [];
  
  if (r.pediatric) {
      if(r.pediatricMethods) {
          options.push({ label: 'DRI/IOM (Dry)', val: r.pediatricMethods.driEER.valDry, note: '' });
          options.push({ label: 'DRI/IOM (Sel)', val: r.pediatricMethods.driEER.valSel, note: '' });
          options.push({ label: 'Catch-Up Total', val: r.pediatric.catchUpTotal, note: 'Catch-up Growth' });
          options.push({ label: 'Maintenance TEE (Dry)', val: r.pediatricMethods.maintenanceTEE.valDry, note: '' });
      }
  } else {
      // Adult Options
      if (r.m1) {
          const manualNote = ' (Manual Factor)';
          const autoNote = ` (Auto Factor: ${r.m1.factor})`;
          
          options.push({ label: `M1 Auto - Dry`, val: r.m1.resultDry, note: autoNote });
          options.push({ label: `M1 Auto - Sel`, val: r.m1.resultSel, note: autoNote });
          options.push({ label: `M1 Manual - Dry`, val: r.m1.customResultDry, note: manualNote });
          options.push({ label: `M1 Manual - Sel`, val: r.m1.customResultSel, note: manualNote });
      }
      if (r.m3) {
          const adjNote = r.m3.adjustmentNote ? ` ${r.m3.adjustmentNote}` : '';
          options.push({ label: 'Mifflin TEE (Dry)', val: r.m3.mifflin.teeDry, note: adjNote });
          options.push({ label: 'Mifflin TEE (Sel)', val: r.m3.mifflin.teeSel, note: adjNote });
          options.push({ label: 'Harris TEE (Dry)', val: r.m3.harris.teeDry, note: adjNote });
          options.push({ label: 'Harris TEE (Sel)', val: r.m3.harris.teeSel, note: adjNote });
      }
      if (r.m6) {
          options.push({ label: 'EER (IOM) - Dry', val: r.m6.resultDry, note: '' });
          options.push({ label: 'EER (IOM) - Sel', val: r.m6.resultSel, note: '' });
      }
  }

  return (
    <div className="card shadow-lg overflow-visible border-0 ring-1 ring-black/5 bg-gradient-to-br from-gray-800 to-gray-900 text-white relative z-20">
      {/* Header */}
      <div className="p-4 border-b border-gray-700/50 flex justify-between items-center rounded-t-xl">
          <h2 className="text-lg font-bold flex items-center gap-2 text-white">
              📊 {t.kcal.summary}
          </h2>
          <div className="text-right">
              <div className="text-[10px] uppercase opacity-60 font-bold tracking-wider flex items-center justify-end gap-1">
                  {t.kcal.dryWeight}
                  <EquationTooltip formula="Current Wt - (Ascites + Edema)" details={r.detailedFormulas?.dryWeight} />
              </div>
              <div className="font-mono font-bold text-xl leading-none text-green-400">{r.dryWeight} <span className="text-sm opacity-70">kg</span></div>
          </div>
      </div>
      
      <div className="p-5 space-y-5 rounded-b-xl">
          {/* Status Indicators Grid */}
          <div className="grid grid-cols-2 gap-4">
              {/* BMI (Dry) */}
              <div className="text-center p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 flex flex-col justify-center min-h-[100px]">
                  <div className="text-[10px] text-gray-400 uppercase tracking-wide font-bold mb-1 flex items-center justify-center gap-1">
                      BMI (Dry)
                      <EquationTooltip formula="Dry Weight / Height²" details={r.detailedFormulas?.bmi} />
                  </div>
                  <div className={`text-3xl font-extrabold ${r.bmiColor ? r.bmiColor.replace('text-', 'text-') : 'text-white'}`}>{r.bmi}</div>
                  <div className="text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-2 self-center bg-white/20 text-white">
                      {r.bmiRef || '-'}
                  </div>
              </div>

              {/* Weight Loss */}
              <div className="text-center p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 flex flex-col justify-center min-h-[100px]">
                  <div className="text-[10px] text-gray-400 uppercase tracking-wide font-bold mb-1 flex items-center justify-center gap-1">
                      {t.kcal.weightLoss}
                      <EquationTooltip formula="((Usual - Dry) / Usual) * 100" details={r.detailedFormulas?.weightLoss} />
                  </div>
                  <div className={`text-3xl font-extrabold ${r.weightLossColor ? r.weightLossColor.replace('text-', 'text-') : 'text-white'}`}>{r.weightLoss}%</div>
                  {r.weightLossRef ? (
                      <div className="text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-2 self-center bg-white/20 text-white">
                          {r.weightLossRef}
                      </div>
                  ) : <div className="mt-2 text-[10px] text-gray-500">-</div>}
              </div>
          </div>

          {/* Action Area */}
          {onPlanMeals && setReqKcal !== undefined && (
            <div className="pt-4 border-t border-gray-700/50 animate-fade-in space-y-4">
               {/* Notes Field */}
               {setNotes !== undefined && (
                   <div>
                       <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-wider">Calculation Notes</label>
                       <textarea 
                           className="w-full p-2 bg-white/5 border border-white/10 rounded-lg focus:ring-1 focus:ring-green-500 outline-none text-xs text-white placeholder-gray-600 resize-none"
                           placeholder="Add notes for this calculation..."
                           rows={3}
                           value={notes}
                           onChange={(e) => setNotes(e.target.value)}
                       />
                   </div>
               )}

               <div>
                   <label className="block text-sm font-bold text-gray-400 uppercase mb-2 tracking-wider">{t.kcal.kcalRequired}</label>
                   <div className="flex gap-2">
                       <input 
                         type="number" 
                         className="w-full p-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-bold text-2xl text-center text-white transition shadow-inner placeholder-gray-600"
                         placeholder="Enter Target Kcal"
                         value={reqKcal}
                         onChange={(e) => setReqKcal(Number(e.target.value))}
                         dir="ltr"
                       />
                       <button 
                           onClick={() => setShowSelectModal(true)}
                           className="bg-blue-600 hover:bg-blue-700 text-white w-12 h-full rounded-xl font-bold transition shadow-lg flex items-center justify-center flex-shrink-0"
                           title="Select from calculated results"
                       >
                           <span className="text-xl">📝</span>
                       </button>
                   </div>
               </div>
               <button 
                 onClick={() => reqKcal && onPlanMeals(Number(reqKcal))}
                 disabled={!reqKcal}
                 className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3.5 rounded-xl transition font-bold shadow-lg flex items-center justify-center gap-2 transform active:scale-[0.98]"
               >
                 <span>📅</span> {t.kcal.planMeals}
               </button>
            </div>
          )}
      </div>

      {/* Select Modal */}
      {showSelectModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[100] p-4 text-gray-800">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                  <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                      <h3 className="font-bold text-gray-800">Select Target Calorie</h3>
                      <button onClick={() => setShowSelectModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                  </div>
                  <div className="p-2 max-h-[60vh] overflow-y-auto">
                      <table className="w-full text-sm">
                          <tbody>
                              {options.map((opt, idx) => (
                                  <tr 
                                    key={idx} 
                                    onClick={() => handleSelect(opt.val)}
                                    className="hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0 transition"
                                  >
                                      <td className="p-3">
                                          <div className="text-gray-700 font-medium">{opt.label}</div>
                                          {opt.note && <div className="text-[10px] text-gray-500">{opt.note}</div>}
                                      </td>
                                      <td className="p-3 text-right font-bold text-blue-600 font-mono text-lg">{opt.val?.toFixed(0)}</td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default ResultsSummaryCard;
