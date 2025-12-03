
import React, { useState } from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { KcalResults } from '../hooks/useKcalCalculations';

interface MethodsCardProps {
  results: KcalResults;
  deficit: number;
  setDeficit: (v: number) => void;
}

const MethodsCard: React.FC<MethodsCardProps> = ({ results, deficit, setDeficit }) => {
  const { t } = useLanguage();
  const [activeMethod, setActiveMethod] = useState<'method1' | 'method2' | 'method3' | 'method4' | 'method5' | 'none'>('none');

  const r = results;

  return (
    <div className="card bg-white">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">🧮</span>
        <h2 className="text-xl font-bold text-[var(--color-heading)]">{t.kcal.methods}</h2>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
         {['method1', 'method2', 'method3', 'method4', 'method5'].map((m, idx) => (
           <button
            key={m}
            onClick={() => setActiveMethod(m as any)}
            className={`px-3 py-2 rounded-lg border transition-all text-center shadow-sm text-xs font-bold ${
              activeMethod === m 
              ? 'border-[var(--color-primary)] bg-[var(--color-bg-soft)] text-[var(--color-primary)] ring-1 ring-[var(--color-primary)]' 
              : 'border-gray-200 text-gray-600 hover:border-[var(--color-primary)] hover:shadow-md'
            }`}
           >
             M{idx + 1}
           </button>
         ))}
      </div>

      {/* Render Active Method */}
      {activeMethod !== 'none' && (
        <div className="bg-[var(--color-bg-soft)] rounded-xl p-4 border border-[var(--color-border)] overflow-x-auto animate-fade-in">
          
          {/* METHOD 1 */}
          {activeMethod === 'method1' && r.m1 && (
            <div>
                <h3 className="font-bold text-gray-700 mb-2">Method 1: BMI Rapid Calc</h3>
                <div className="text-sm space-y-2">
                    <div className="flex justify-between border-b pb-1">
                        <span>Current BMI</span>
                        <span className="font-mono font-bold">{r.m1.bmiValue.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                        <span>Logic Used</span>
                        <span>BMI {r.m1.bmiValue > 40 ? '> 40' : '< 40'} (× {r.m1.factor})</span>
                    </div>
                    <div className="flex justify-between pt-1 bg-white p-2 rounded border border-green-100">
                        <span className="font-bold text-[var(--color-primary)]">Requirement</span>
                        <span className="font-mono font-bold text-xl">{r.m1.result.toFixed(0)} kcal</span>
                    </div>
                </div>
            </div>
          )}

          {/* METHOD 2 */}
           {activeMethod === 'method2' && r.m2 && (
            <table className="w-full text-sm">
              <caption className="text-left font-bold text-gray-700 mb-2">Method 2: Weight * Factor</caption>
              <thead>
                <tr className="text-left border-b border-green-200">
                  <th className="pb-2 px-2">Weight</th>
                  <th className="pb-2 px-2">25 Kcal</th>
                  <th className="pb-2 px-2">30 Kcal</th>
                  <th className="pb-2 px-2">35 Kcal</th>
                  <th className="pb-2 px-2">40 Kcal</th>
                </tr>
              </thead>
              <tbody className="font-mono text-[var(--color-primary-dark)]">
                <tr className="border-b border-white/50">
                  <td className="py-2 px-2 font-sans font-medium">Actual</td>
                  {r.m2.actual.map((v: number, i: number) => <td key={i} className="px-2">{v.toFixed(0)}</td>)}
                </tr>
                <tr>
                  <td className="py-2 px-2 font-sans font-medium text-green-700">Selected</td>
                  {r.m2.selected.map((v: number, i: number) => <td key={i} className="px-2">{v.toFixed(0)}</td>)}
                </tr>
              </tbody>
            </table>
          )}

          {/* METHOD 3 */}
           {activeMethod === 'method3' && r.m3 && (
             <div className="space-y-4">
               <div className="flex items-center justify-between mb-2">
                 <h3 className="font-bold text-gray-700">Method 3: BMR + PA + TEF</h3>
                 <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold">{t.kcal.deficit}</span>
                    <input 
                        type="number" 
                        value={deficit} 
                        onChange={(e) => setDeficit(Number(e.target.value))}
                        className="w-16 p-1 rounded border text-center text-xs"
                        dir="ltr"
                    />
                 </div>
               </div>
               <table className="w-full text-sm">
                 <thead>
                   <tr className="border-b border-green-200">
                     <th className="text-left pb-2">Metric</th>
                     <th className="pb-2 text-right">Actual W.</th>
                     <th className="pb-2 text-right">Selected W.</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-white/50">
                   {/* Mifflin */}
                   <tr>
                     <td className="py-1 text-xs uppercase tracking-wider opacity-70 font-bold bg-green-50/50" colSpan={3}>Mifflin-St Jeor (Recommended)</td>
                   </tr>
                   <tr>
                      <td className="py-1 pl-2">BMR</td>
                      <td className="text-right font-mono">{r.m3.mifflin.bmr[0].toFixed(0)}</td>
                      <td className="text-right font-mono text-green-700 font-bold">{r.m3.mifflin.bmr[1].toFixed(0)}</td>
                   </tr>
                   <tr>
                      <td className="py-1 pl-2">TEE (Incl. 10% TEF)</td>
                      <td className="text-right font-mono">{(r.m3.mifflin.tee[0] - deficit).toFixed(0)}</td>
                      <td className="text-right font-mono text-green-700 font-bold">{(r.m3.mifflin.tee[1] - deficit).toFixed(0)}</td>
                   </tr>

                   {/* Katch-McArdle (If available) */}
                   {r.m3.katch && (
                       <>
                       <tr>
                         <td className="py-1 text-xs uppercase tracking-wider opacity-70 font-bold bg-purple-50/50 pt-3" colSpan={3}>Katch-McArdle (InBody/LBM)</td>
                       </tr>
                       <tr>
                          <td className="py-1 pl-2">BMR (Based on LBM)</td>
                          <td className="text-right font-mono text-purple-700 font-bold" colSpan={2}>{r.m3.katch.bmr.toFixed(0)}</td>
                       </tr>
                       <tr>
                          <td className="py-1 pl-2">TEE (Incl. 10% TEF)</td>
                          <td className="text-right font-mono text-purple-700 font-bold" colSpan={2}>{(r.m3.katch.tee - deficit).toFixed(0)}</td>
                       </tr>
                       </>
                   )}

                   {/* Harris */}
                   <tr>
                     <td className="py-1 text-xs uppercase tracking-wider opacity-70 pt-3" colSpan={3}>Harris Benedict (Old)</td>
                   </tr>
                   <tr>
                      <td className="py-1 pl-2">BMR</td>
                      <td className="text-right font-mono">{r.m3.harris.bmr[0].toFixed(0)}</td>
                      <td className="text-right font-mono text-green-700 font-bold">{r.m3.harris.bmr[1].toFixed(0)}</td>
                   </tr>
                   <tr>
                      <td className="py-1 pl-2">TEE (Incl. 10% TEF)</td>
                      <td className="text-right font-mono">{(r.m3.harris.tee[0] - deficit).toFixed(0)}</td>
                      <td className="text-right font-mono text-green-700 font-bold">{(r.m3.harris.tee[1] - deficit).toFixed(0)}</td>
                   </tr>
                 </tbody>
               </table>
             </div>
          )}

          {/* METHOD 4 */}
          {activeMethod === 'method4' && r.m4 && (
              <div>
                  <h3 className="font-bold text-gray-700 mb-2">Method 4: Ratio Equation</h3>
                  <div className="mb-2 text-xs text-gray-500">
                      Based on Status: <span className="font-bold text-gray-800">{r.m4.status}</span>
                  </div>
                  <table className="w-full text-sm bg-white rounded border border-gray-200">
                      <thead>
                          <tr className="bg-gray-50 text-xs text-gray-600">
                              <th className="p-2 text-left">Activity</th>
                              <th className="p-2 text-right">Kcal/Kg</th>
                              <th className="p-2 text-right">Total</th>
                          </tr>
                      </thead>
                      <tbody>
                          <tr className="border-b border-gray-100">
                              <td className="p-2">Sedentary</td>
                              <td className="p-2 text-right text-gray-500 font-mono">
                                  {r.m4.status === 'Overweight' ? '20-25' : r.m4.status === 'Underweight' ? '35' : '30'}
                              </td>
                              <td className="p-2 text-right font-bold font-mono">{r.m4.sedentary.toFixed(0)}</td>
                          </tr>
                          <tr className="border-b border-gray-100">
                              <td className="p-2">Moderate</td>
                              <td className="p-2 text-right text-gray-500 font-mono">
                                  {r.m4.status === 'Overweight' ? '30' : r.m4.status === 'Underweight' ? '40' : '35'}
                              </td>
                              <td className="p-2 text-right font-bold font-mono">{r.m4.moderate.toFixed(0)}</td>
                          </tr>
                          <tr>
                              <td className="p-2">Heavy</td>
                              <td className="p-2 text-right text-gray-500 font-mono">
                                  {r.m4.status === 'Overweight' ? '35' : r.m4.status === 'Underweight' ? '45-50' : '40'}
                              </td>
                              <td className="p-2 text-right font-bold font-mono">{r.m4.heavy.toFixed(0)}</td>
                          </tr>
                      </tbody>
                  </table>
              </div>
          )}

          {/* METHOD 5 */}
          {activeMethod === 'method5' && r.m5 && (
              <div>
                  <h3 className="font-bold text-gray-700 mb-2">Method 5: Category Requirement</h3>
                  <div className="space-y-3">
                      <div className="flex justify-between border-b border-gray-200 pb-2">
                          <span className="text-sm text-gray-600">Category Applied</span>
                          <span className="text-sm font-bold text-gray-800">{r.m5.category}</span>
                      </div>
                      
                      {r.m5.notes.length > 0 && (
                          <div className="bg-yellow-50 p-2 rounded text-xs text-yellow-800 border border-yellow-100">
                              {r.m5.notes.map((n, i) => <div key={i}>{n}</div>)}
                          </div>
                      )}

                      <div className="bg-white p-3 rounded border border-green-200 flex justify-between items-center">
                          <span className="font-bold text-[var(--color-primary)]">Calculated Requirement</span>
                          <span className="text-2xl font-bold font-mono">{r.m5.result.toFixed(0)} kcal</span>
                      </div>
                      <div className="text-[10px] text-gray-400 italic">
                          * Athletes should use 40 kcal/kg independent of above.
                      </div>
                  </div>
              </div>
          )}

        </div>
      )}
    </div>
  );
};

export default MethodsCard;