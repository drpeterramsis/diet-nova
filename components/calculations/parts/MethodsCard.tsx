


import React, { useState } from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { KcalResults } from '../hooks/useKcalCalculations';

interface MethodsCardProps {
  results: KcalResults;
  deficit: number;
  setDeficit: (v: number) => void;
}

// Tooltip Helper
const EquationTooltip: React.FC<{ formula: string }> = ({ formula }) => (
    <div className="group relative inline-block ml-1">
        <span className="cursor-help text-gray-400 text-[10px] font-mono border border-gray-300 rounded px-1 hover:bg-gray-100 hover:text-blue-600 transition">
            fx
        </span>
        <div className="hidden group-hover:block absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[200px] bg-gray-800 text-white text-[10px] p-2 rounded shadow-lg break-words text-center leading-tight">
            {formula}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
        </div>
    </div>
);

const MethodsCard: React.FC<MethodsCardProps> = ({ results: r, deficit, setDeficit }) => {
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

      {/* Render Active Method */}
      <div className="bg-white rounded-xl overflow-hidden animate-fade-in border border-gray-100">
          
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
              </div>
          )}

          {/* ADULT METHODS */}
          
          {/* M1: Simple Weight Based */}
          {activeMethod === 'method1' && r.m1 && (
            <div className="p-4 grid grid-cols-2 gap-4 text-center">
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <h4 className="text-[10px] font-bold text-gray-500 uppercase">Current Wt</h4>
                    <div className="text-xl font-bold text-gray-800">{r.m1.resultDry.toFixed(0)}</div>
                    <div className="text-[9px] text-gray-400 mt-1">Factor: 25-30</div>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <h4 className="text-[10px] font-bold text-blue-500 uppercase">Selected Wt</h4>
                    <div className="text-xl font-bold text-blue-700">{r.m1.resultSel.toFixed(0)}</div>
                </div>
            </div>
          )}

          {/* M2: Factors Table */}
           {activeMethod === 'method2' && r.m2 && (
            <div className="p-2">
                <table className="w-full text-xs text-center border-collapse">
                  <thead>
                    <tr className="bg-gray-100 text-gray-600">
                      <th className="p-2 border border-gray-200">Basis</th>
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
                 <h3 className="font-bold text-gray-700 text-xs uppercase">Metabolic Equations</h3>
                 <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold text-red-500 uppercase">Deficit:</span>
                    <input 
                        type="number" 
                        value={deficit} 
                        onChange={(e) => setDeficit(Number(e.target.value))}
                        className="w-12 h-6 p-1 rounded border text-center text-xs bg-red-50 border-red-200"
                    />
                 </div>
               </div>
               
               <table className="w-full text-xs border-collapse">
                 <thead className="bg-gray-100 text-gray-600 text-[10px] uppercase">
                   <tr>
                     <th className="p-2 text-left border-b w-1/4">Equation</th>
                     <th className="p-2 text-center border-b">BMR (Dry)</th>
                     <th className="p-2 text-center border-b bg-gray-50 font-bold text-gray-800">TEE (Dry)</th>
                     <th className="p-2 text-center border-b bg-blue-50 font-bold text-blue-800">TEE (Sel)</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                   <tr className="hover:bg-gray-50">
                      <td className="p-2 font-bold text-gray-700 flex items-center gap-1">
                          Mifflin <EquationTooltip formula="(10*W) + (6.25*H) - (5*A) + S" />
                      </td>
                      <td className="p-2 text-center text-gray-500">{r.m3.mifflin.bmrDry.toFixed(0)}</td>
                      <td className="p-2 text-center font-mono font-bold">{r.m3.mifflin.teeDry.toFixed(0)}</td>
                      <td className="p-2 text-center font-mono font-bold text-blue-600 bg-blue-50/30">{r.m3.mifflin.teeSel.toFixed(0)}</td>
                   </tr>
                   <tr className="hover:bg-gray-50">
                      <td className="p-2 font-medium text-gray-600 flex items-center gap-1">
                          Harris <EquationTooltip formula="66.5 + (13.75*W) + (5.003*H) - (6.75*A)" />
                      </td>
                      <td className="p-2 text-center text-gray-500">{r.m3.harris.bmrDry.toFixed(0)}</td>
                      <td className="p-2 text-center font-mono">{r.m3.harris.teeDry.toFixed(0)}</td>
                      <td className="p-2 text-center font-mono text-blue-600 bg-blue-50/30">{r.m3.harris.teeSel.toFixed(0)}</td>
                   </tr>
                 </tbody>
               </table>
               {deficit > 0 && (
                   <div className="text-[10px] text-center text-red-500 mt-1 font-bold">
                       Results shown are TEE. Subtract {deficit} manually or apply in Planner.
                   </div>
               )}
             </div>
          )}

          {/* M6: Adult EER */}
          {activeMethod === 'method6' && r.m6 && (
              <div className="p-4 grid grid-cols-2 gap-4 text-center">
                <div className="col-span-2 text-xs text-gray-500 mb-2 flex justify-center items-center gap-1">
                    IOM Estimated Energy Requirement
                    <EquationTooltip formula={r.m6.proteinRef || "Standard EER Eq"} />
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