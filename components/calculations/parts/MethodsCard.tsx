
import React, { useState } from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { KcalResults } from '../hooks/useKcalCalculations';

interface MethodsCardProps {
  results: KcalResults;
  deficit: number;
  setDeficit: (v: number) => void;
  goal?: 'loss' | 'gain';
  setGoal?: (v: 'loss' | 'gain') => void;
  customFactor?: number;
  setCustomFactor?: (v: number) => void;
}

interface TooltipProps {
    formula: string;
    details?: string;
}

const EquationTooltip: React.FC<TooltipProps> = ({ formula, details }) => (
    <div className="group relative inline-block ml-1 z-[999]">
        <span className="cursor-help text-blue-500 text-[10px] font-bold border border-blue-200 rounded-full w-4 h-4 inline-flex items-center justify-center bg-blue-50 hover:bg-blue-600 hover:text-white transition">
            i
        </span>
        <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[320px] bg-gray-900 text-white text-[10px] p-3 rounded-lg shadow-xl break-words text-left leading-relaxed z-[1000]">
            <div className="font-bold text-blue-300 mb-1 border-b border-gray-700 pb-1">Equation:</div>
            <div className="font-mono mb-2 whitespace-pre-wrap">{formula}</div>
            {details && (
                <>
                    <div className="font-bold text-green-300 mb-1 border-b border-gray-700 pb-1">Calculation:</div>
                    <div className="font-mono text-gray-300 whitespace-pre-wrap">{details}</div>
                </>
            )}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
        </div>
    </div>
);

const MethodsCard: React.FC<MethodsCardProps> = ({ results: r, deficit, setDeficit, goal, setGoal, customFactor, setCustomFactor }) => {
  const { t } = useLanguage();
  const [activeMethod, setActiveMethod] = useState<string>(r.pediatric ? 'pediatric' : 'method3');

  const isPediatric = !!r.pediatric;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 mb-2">
         {isPediatric ? (
             <button
                onClick={() => setActiveMethod('pediatric')}
                className={`px-3 py-1.5 rounded-lg border transition-all text-center shadow-sm text-xs font-bold ${
                  activeMethod === 'pediatric' 
                  ? 'border-purple-600 bg-purple-50 text-purple-700 ring-1 ring-purple-500' 
                  : 'border-gray-200 text-gray-600 hover:border-purple-300'
                }`}
             >
                 👶 Pediatric
             </button>
         ) : (
             ['method1', 'method2', 'method3', 'method6'].map((m, idx) => (
               <button
                key={m}
                onClick={() => setActiveMethod(m)}
                className={`px-3 py-1.5 rounded-lg border transition-all text-center shadow-sm text-xs font-bold ${
                  activeMethod === m 
                  ? 'border-[var(--color-primary)] bg-[var(--color-bg-soft)] text-[var(--color-primary)] ring-1 ring-[var(--color-primary)]' 
                  : 'border-gray-200 text-gray-600 hover:border-[var(--color-primary)] hover:shadow-md'
                }`}
               >
                 {m === 'method1' ? 'M1 (Wt)' : m === 'method2' ? 'M2 (Fac)' : m === 'method3' ? 'M3 (Eq)' : 'M6 (EER)'}
               </button>
             ))
         )}
      </div>

      {/* Warning Note - Only visible for Adults */}
      {!isPediatric && (
          <div className="bg-orange-50 border-l-4 border-orange-400 p-2 text-[10px] text-orange-800">
              <strong>Note:</strong> M1, M2, and M6 provide direct total energy estimates. Use <strong>M3 (Equations)</strong> if you specifically need to calculate deficit or surplus from BMR.
          </div>
      )}

      {/* Render Active Method */}
      <div className="bg-white rounded-xl overflow-visible animate-fade-in border border-gray-100 relative z-10">
          
          {/* PEDIATRIC METHODS */}
          {activeMethod === 'pediatric' && r.pediatricMethods && r.pediatric && (
              <div className="p-3 space-y-3">
                  <div className="flex justify-between items-center text-xs font-bold text-gray-500 uppercase px-2">
                      <span>Method</span>
                      <div className="flex gap-4">
                          <span className="text-gray-800">Current</span>
                          <span className="text-blue-600">Selected</span>
                      </div>
                  </div>
                  
                  {/* DRI/IOM */}
                  <div className="bg-gray-50 p-2 rounded-lg border border-gray-200 flex justify-between items-center">
                      <div>
                          <div className="text-xs font-bold text-gray-700 flex items-center">
                              DRI / IOM
                              <EquationTooltip formula={r.pediatricMethods.driEER.formula} />
                          </div>
                          <div className="text-[10px] text-gray-500">{r.pediatricMethods.driEER.label}</div>
                      </div>
                      <div className="text-right flex gap-4">
                          <div className="font-mono font-bold text-gray-800">{r.pediatricMethods.driEER.valDry.toFixed(0)}</div>
                          <div className="font-mono font-bold text-blue-600">{r.pediatricMethods.driEER.valSel.toFixed(0)}</div>
                      </div>
                  </div>

                  {/* Catch-Up (Special Case) */}
                  <div className="bg-green-50 p-2 rounded-lg border border-green-200 flex justify-between items-center">
                      <div>
                          <div className="text-xs font-bold text-green-800 flex items-center">
                              Catch-Up
                              <EquationTooltip formula="(120 * IBW) / Actual Wt" />
                          </div>
                          <div className="text-[10px] text-green-600">{r.pediatric.catchUpKcal} kcal/kg</div>
                      </div>
                      <div className="font-mono font-bold text-green-700 text-lg">
                          {r.pediatric.catchUpTotal}
                      </div>
                  </div>

                  {/* Obese BEE */}
                  <div className="bg-white p-2 rounded border border-gray-100 flex justify-between items-center">
                      <div className="text-xs font-bold text-gray-600 flex items-center">
                          Obese BEE
                          <EquationTooltip formula={r.pediatricMethods.obeseBEE.formula} />
                      </div>
                      <div className="flex gap-4">
                          <div className="font-mono text-gray-800">{r.pediatricMethods.obeseBEE.valDry.toFixed(0)}</div>
                          <div className="font-mono text-blue-600">{r.pediatricMethods.obeseBEE.valSel.toFixed(0)}</div>
                      </div>
                  </div>

                  {/* Maintenance TEE */}
                  <div className="bg-white p-2 rounded border border-gray-100 flex justify-between items-center">
                      <div className="text-xs font-bold text-gray-600 flex items-center">
                          Maint. TEE
                          <EquationTooltip formula={r.pediatricMethods.maintenanceTEE.formula} />
                      </div>
                      <div className="flex gap-4">
                          <div className="font-mono text-gray-800">{r.pediatricMethods.maintenanceTEE.valDry.toFixed(0)}</div>
                          <div className="font-mono text-blue-600">{r.pediatricMethods.maintenanceTEE.valSel.toFixed(0)}</div>
                      </div>
                  </div>

                  {/* Ratio */}
                  <div className="bg-white p-2 rounded border border-gray-100 flex justify-between items-center">
                      <div className="text-xs font-bold text-gray-600 flex items-center">
                          Ratio (Age/Wt)
                          <EquationTooltip formula={r.pediatricMethods.ratio.formula} />
                      </div>
                      <div className="flex gap-4">
                          <div className="font-mono text-gray-800">{r.pediatricMethods.ratio.valDry.toFixed(0)}</div>
                          <div className="font-mono text-blue-600">{r.pediatricMethods.ratio.valSel.toFixed(0)}</div>
                      </div>
                  </div>
              </div>
          )}

          {/* ADULT METHODS */}
          
          {/* M1: Simple Weight Based */}
          {activeMethod === 'method1' && r.m1 && (
            <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <h4 className="text-[10px] font-bold text-gray-500 uppercase flex justify-center items-center gap-1">
                            Current Wt (Auto)
                            <EquationTooltip formula="Wt * Factor (Status Based)" details={r.detailedFormulas?.m1} />
                        </h4>
                        <div className="text-xl font-bold text-gray-800">{r.m1.resultDry.toFixed(0)}</div>
                        <div className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded mt-1 inline-block font-bold">Factor: {r.m1.factor}</div>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <h4 className="text-[10px] font-bold text-blue-500 uppercase">Selected Wt (Auto)</h4>
                        <div className="text-xl font-bold text-blue-700">{r.m1.resultSel.toFixed(0)}</div>
                    </div>
                </div>

                {setCustomFactor && (
                    <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-yellow-800 uppercase">Manual Factor Adjustment</span>
                            <input 
                                type="number" 
                                value={customFactor} 
                                onChange={(e) => setCustomFactor(Number(e.target.value))}
                                className="w-16 h-7 p-1 text-center text-sm font-bold border border-yellow-300 rounded bg-white focus:ring-1 focus:ring-yellow-500"
                            />
                        </div>
                        <div className="flex justify-between text-xs">
                            <div className="text-center">
                                <span className="block text-gray-500 mb-1">Current Wt</span>
                                <span className="font-mono font-bold text-gray-800 text-sm">{r.m1.customResultDry.toFixed(0)}</span>
                            </div>
                            <div className="text-center">
                                <span className="block text-blue-500 mb-1">Selected Wt</span>
                                <span className="font-mono font-bold text-blue-700 text-sm">{r.m1.customResultSel.toFixed(0)}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
          )}

          {/* M2: Factors Table */}
           {activeMethod === 'method2' && r.m2 && (
            <div className="p-2 space-y-3">
                {setCustomFactor && r.m1 && (
                    <div className="bg-yellow-50 p-2 mx-1 rounded border border-yellow-100 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-yellow-800">Custom Factor:</span>
                            <input 
                                type="number" 
                                value={customFactor} 
                                onChange={(e) => setCustomFactor && setCustomFactor(Number(e.target.value))}
                                className="w-12 h-6 p-1 text-center font-bold border border-yellow-300 rounded bg-white"
                            />
                        </div>
                        <div className="flex gap-4">
                            <span>Dry: <b className="text-gray-800">{r.m1.customResultDry.toFixed(0)}</b></span>
                            <span>Sel: <b className="text-blue-700">{r.m1.customResultSel.toFixed(0)}</b></span>
                        </div>
                    </div>
                )}

                <table className="w-full text-xs text-center border-collapse">
                  <thead>
                    <tr className="bg-gray-100 text-gray-600">
                      <th className="p-2 border border-gray-200 flex justify-center items-center gap-1">
                          Basis
                          <EquationTooltip formula="Weight * Factor" details={r.detailedFormulas?.m2} />
                      </th>
                      <th className="p-2 border border-gray-200">25 kcal</th>
                      <th className="p-2 border border-gray-200">30 kcal</th>
                      <th className="p-2 border border-gray-200">35 kcal</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-2 border border-gray-200 font-bold text-gray-700">Current</td>
                      {r.m2.actual.slice(0,3).map((v,i) => <td key={i} className="p-2 border border-gray-200 font-mono">{v.toFixed(0)}</td>)}
                    </tr>
                    <tr className="bg-blue-50">
                      <td className="p-2 border border-blue-200 font-bold text-blue-700">Selected</td>
                      {r.m2.selected.slice(0,3).map((v,i) => <td key={i} className="p-2 border border-blue-200 font-mono text-blue-800">{v.toFixed(0)}</td>)}
                    </tr>
                  </tbody>
                </table>
            </div>
          )}

          {/* M3: Equations */}
           {activeMethod === 'method3' && r.m3 && (
             <div className="p-3 space-y-3">
               <div className="flex items-center justify-between mb-1">
                 <h3 className="font-bold text-gray-700 text-xs uppercase flex items-center gap-1">
                     Metabolic Equations
                     {r.m3.actFactor && (
                         <span className="text-[10px] font-normal text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100">
                             PA: {r.m3.actFactor}
                         </span>
                     )}
                 </h3>
                 
                 {/* Goal Toggle & Input */}
                 {setGoal && (
                     <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                         <div className="flex rounded overflow-hidden text-[10px] font-bold shadow-sm">
                             <button 
                                onClick={() => setGoal('loss')}
                                className={`px-2 py-1 ${goal === 'loss' ? 'bg-red-500 text-white' : 'bg-white text-gray-600'}`}
                             >
                                 Loss (-)
                             </button>
                             <button 
                                onClick={() => setGoal('gain')}
                                className={`px-2 py-1 ${goal === 'gain' ? 'bg-green-500 text-white' : 'bg-white text-gray-600'}`}
                             >
                                 Gain (+)
                             </button>
                         </div>
                         <input 
                            type="number" 
                            value={deficit} 
                            onChange={(e) => setDeficit(Number(e.target.value))}
                            className="w-12 h-6 p-1 rounded border text-center text-xs bg-white border-gray-300 font-bold text-gray-700 focus:ring-1 focus:ring-blue-400"
                            placeholder="Kcal"
                        />
                     </div>
                 )}
               </div>
               
               <table className="w-full text-xs border-collapse">
                 <thead className="bg-gray-100 text-gray-600 text-[10px] uppercase">
                   <tr>
                     <th className="p-2 text-left border-b w-1/4">Equation</th>
                     <th className="p-2 text-center border-b">BMR (Base)</th>
                     <th className="p-2 text-center border-b bg-gray-50 font-bold text-gray-800">Target (Dry)</th>
                     <th className="p-2 text-center border-b bg-blue-50 font-bold text-blue-800">Target (Sel)</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                   <tr className="hover:bg-gray-50">
                      <td className="p-2 font-bold text-gray-700 flex items-center gap-1">
                          Mifflin <EquationTooltip formula="(10*W) + (6.25*H) - (5*A) + S" details={r.detailedFormulas?.mifflinDry} />
                      </td>
                      <td className="p-2 text-center text-gray-500">{r.m3.mifflin.bmrDry.toFixed(0)}</td>
                      <td className="p-2 text-center font-mono font-bold">{r.m3.mifflin.teeDry.toFixed(0)}</td>
                      <td className="p-2 text-center font-mono font-bold text-blue-600 bg-blue-50/30">{r.m3.mifflin.teeSel.toFixed(0)}</td>
                   </tr>
                   <tr className="hover:bg-gray-50">
                      <td className="p-2 font-medium text-gray-600 flex items-center gap-1">
                          Harris <EquationTooltip formula="66.5 + (13.75*W) + (5.003*H) - (6.75*A)" details={r.detailedFormulas?.harrisDry} />
                      </td>
                      <td className="p-2 text-center text-gray-500">{r.m3.harris.bmrDry.toFixed(0)}</td>
                      <td className="p-2 text-center font-mono">{r.m3.harris.teeDry.toFixed(0)}</td>
                      <td className="p-2 text-center font-mono text-blue-600 bg-blue-50/30">{r.m3.harris.teeSel.toFixed(0)}</td>
                   </tr>
                 </tbody>
               </table>
               
               {/* Adjustment Note */}
               {deficit > 0 && (
                   <div className={`text-[10px] text-center mt-1 font-bold p-1 rounded ${goal === 'loss' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                       Note: TEE targets include {goal === 'loss' ? 'deficit' : 'surplus'} of {goal === 'loss' ? '-' : '+'}{deficit} kcal for weight {goal === 'loss' ? 'loss' : 'gain'}.
                   </div>
               )}
             </div>
          )}

          {/* M6: Adult EER */}
          {activeMethod === 'method6' && r.m6 && (
              <div className="p-4 grid grid-cols-2 gap-4 text-center">
                <div className="col-span-2 text-xs text-gray-500 mb-2 flex justify-center items-center gap-1">
                    IOM Estimated Energy Requirement
                    <EquationTooltip formula={r.m6.proteinRef || "Standard EER Eq"} details={r.detailedFormulas?.eer} />
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <h4 className="text-[10px] font-bold text-gray-500 uppercase">Current Wt</h4>
                    <div className="text-xl font-bold text-gray-800">{r.m6.resultDry.toFixed(0)}</div>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <h4 className="text-[10px] font-bold text-blue-500 uppercase">Selected Wt</h4>
                    <div className="text-xl font-bold text-blue-700">{r.m6.resultSel.toFixed(0)}</div>
                </div>
            </div>
          )}
      </div>
    </div>
  );
};

export default MethodsCard;
