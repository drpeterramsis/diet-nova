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
  const [activeMethod, setActiveMethod] = useState<'method1' | 'method2' | 'method3' | 'none'>('none');

  const r = results;

  return (
    <div className="card bg-white">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">🧮</span>
        <h2 className="text-xl font-bold text-[var(--color-heading)]">{t.kcal.methods}</h2>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
         {['method1', 'method2', 'method3'].map((m) => (
           <button
            key={m}
            onClick={() => setActiveMethod(m as any)}
            className={`flex-1 px-4 py-3 rounded-xl border transition-all text-center shadow-sm ${
              activeMethod === m 
              ? 'border-[var(--color-primary)] bg-[var(--color-bg-soft)] text-[var(--color-primary)] ring-1 ring-[var(--color-primary)]' 
              : 'border-gray-200 text-gray-600 hover:border-[var(--color-primary)] hover:shadow-md'
            }`}
           >
             <div className="font-bold text-sm md:text-base">{t.kcal[m as keyof typeof t.kcal] as string}</div>
             <div className="text-xs opacity-70">{t.kcal[(m + 'Desc') as keyof typeof t.kcal] as string}</div>
           </button>
         ))}
      </div>

      {/* Render Active Method */}
      {activeMethod !== 'none' && r.m1 && (
        <div className="bg-[var(--color-bg-soft)] rounded-xl p-4 border border-[var(--color-border)] overflow-x-auto animate-fade-in">
          {activeMethod === 'method1' && r.m1 && (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-green-200">
                  <th className="pb-2 px-2 text-[var(--color-heading)]">{t.kcal.status.normal}</th>
                  <th className="pb-2 px-2">{t.kcal.activityLevels.sedentary}</th>
                  <th className="pb-2 px-2">{t.kcal.activityLevels.moderate}</th>
                  <th className="pb-2 px-2">{t.kcal.activityLevels.heavy}</th>
                </tr>
              </thead>
              <tbody className="font-mono text-[var(--color-primary-dark)]">
                <tr className="border-b border-white/50">
                  <td className="py-2 px-2 text-blue-600 font-sans">{t.kcal.status.underweight}</td>
                  <td className="px-2">{r.m1.under[0].toFixed(0)}</td>
                  <td className="px-2">{r.m1.under[1].toFixed(0)}</td>
                  <td className="px-2">{r.m1.under[2].toFixed(0)}</td>
                </tr>
                <tr className="border-b border-white/50">
                  <td className="py-2 px-2 text-green-600 font-sans">{t.kcal.status.normal}</td>
                  <td className="px-2">{r.m1.norm[0].toFixed(0)}</td>
                  <td className="px-2">{r.m1.norm[1].toFixed(0)}</td>
                  <td className="px-2">{r.m1.norm[2].toFixed(0)}</td>
                </tr>
                <tr>
                  <td className="py-2 px-2 text-red-600 font-sans">{t.kcal.status.overweight}</td>
                  <td className="px-2">{r.m1.over[0].toFixed(0)}</td>
                  <td className="px-2">{r.m1.over[1].toFixed(0)}</td>
                  <td className="px-2">{r.m1.over[2].toFixed(0)}</td>
                </tr>
              </tbody>
            </table>
          )}
           {activeMethod === 'method2' && r.m2 && (
            <table className="w-full text-sm">
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
           {activeMethod === 'method3' && r.m3 && (
             <div className="space-y-4">
               <div className="flex items-center justify-end gap-3 mb-2">
                 <span className="text-sm font-semibold">{t.kcal.deficit}</span>
                 <input 
                    type="number" 
                    value={deficit} 
                    onChange={(e) => setDeficit(Number(e.target.value))}
                    className="w-20 p-1 rounded border text-center"
                    dir="ltr"
                 />
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
                     <td className="py-1 text-xs uppercase tracking-wider opacity-70 font-bold bg-green-50/50" colSpan={3}>Mifflin-St Jeor (Modern)</td>
                   </tr>
                   <tr>
                      <td className="py-1 pl-2">BMR</td>
                      <td className="text-right font-mono">{r.m3.mifflin.bmr[0].toFixed(0)}</td>
                      <td className="text-right font-mono text-green-700 font-bold">{r.m3.mifflin.bmr[1].toFixed(0)}</td>
                   </tr>
                   <tr>
                      <td className="py-1 pl-2">TEE (Est)</td>
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
                          <td className="py-1 pl-2">TEE (Est)</td>
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
                      <td className="py-1 pl-2">TEE (Est)</td>
                      <td className="text-right font-mono">{(r.m3.harris.tee[0] - deficit).toFixed(0)}</td>
                      <td className="text-right font-mono text-green-700 font-bold">{(r.m3.harris.tee[1] - deficit).toFixed(0)}</td>
                   </tr>
                 </tbody>
               </table>
             </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MethodsCard;