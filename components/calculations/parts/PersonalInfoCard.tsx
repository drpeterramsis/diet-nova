
import React from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { InputGroup, SelectGroup } from '../InputComponents';
import { PediatricAge, PregnancyState } from '../hooks/useKcalCalculations';

interface PersonalInfoProps {
  gender: 'male' | 'female';
  setGender: (v: 'male' | 'female') => void;
  
  age: number;
  setAge: (v: number) => void;
  ageMode?: 'manual' | 'auto';
  setAgeMode?: (v: 'manual' | 'auto') => void;
  dob?: string;
  setDob?: (v: string) => void;
  reportDate?: string;
  setReportDate?: (v: string) => void;
  pediatricAge?: PediatricAge | null;

  height: number;
  setHeight: (v: number) => void;
  waist: number;
  setWaist: (v: number) => void;
  hip?: number;
  setHip?: (v: number) => void;
  
  mac?: number;
  setMac?: (v: number) => void;
  tsf?: number;
  setTsf?: (v: number) => void;

  physicalActivity: number;
  setPhysicalActivity: (v: number) => void;
  
  pregnancyState?: PregnancyState;
  setPregnancyState?: (v: PregnancyState) => void;

  onOpenHeightEstimator?: () => void;
  onOpenPediatricWaist?: () => void;
  onOpenPediatricMAMC?: () => void;
  onOpenGrowthCharts?: () => void;
}

const PersonalInfoCard: React.FC<PersonalInfoProps> = ({
  gender, setGender, 
  age, setAge, ageMode, setAgeMode, dob, setDob, reportDate, setReportDate, pediatricAge,
  height, setHeight, waist, setWaist, hip, setHip, mac, setMac, tsf, setTsf,
  physicalActivity, setPhysicalActivity,
  pregnancyState, setPregnancyState,
  onOpenHeightEstimator,
  onOpenPediatricWaist,
  onOpenPediatricMAMC,
  onOpenGrowthCharts
}) => {
  const { t } = useLanguage();

  const isInfant = age < 2; // < 24 months
  const isPediatric = pediatricAge !== null || age < 20;

  return (
    <div className="card bg-white p-4">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
        <span className="text-xl">👤</span>
        <h2 className="text-lg font-bold text-[var(--color-heading)]">{t.kcal.personalInfo}</h2>
        
        {/* Growth Charts Trigger - Visible if Pediatric */}
        {isPediatric && onOpenGrowthCharts && (
            <button 
                onClick={onOpenGrowthCharts}
                className="ml-auto bg-blue-100 hover:bg-blue-200 text-blue-800 text-[10px] font-bold px-3 py-1 rounded-full border border-blue-200 flex items-center gap-1 transition"
                title="Open Growth Charts"
            >
                <span>📈</span> Charts
            </button>
        )}
      </div>
      
      <div className="space-y-5">
          {/* Row 1: Demographics & Height (2 Column Grid) */}
          <div className="grid grid-cols-2 gap-4">
            
            {/* Gender - Compact Toggle */}
            <div className="col-span-1">
              <label className="block text-xs font-bold text-gray-500 mb-1.5">{t.kcal.gender}</label>
              <div className="flex rounded overflow-hidden border border-[var(--color-primary)]/30 text-sm h-10 shadow-sm">
                <button 
                  onClick={() => setGender('male')}
                  className={`flex-1 transition font-medium ${gender === 'male' ? 'bg-[var(--color-primary)] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  {t.kcal.male}
                </button>
                <button 
                  onClick={() => setGender('female')}
                  className={`flex-1 transition font-medium ${gender === 'female' ? 'bg-[var(--color-primary)] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  {t.kcal.female}
                </button>
              </div>
            </div>

            {/* Age - Compact */}
            <div className="col-span-1 relative">
                {setAgeMode && setDob && setReportDate ? (
                   <div>
                       <div className="flex justify-between mb-1.5">
                           <label className="block text-xs font-bold text-gray-500">{t.kcal.age}</label>
                           <div className="flex bg-gray-100 rounded p-0.5 text-[10px]">
                              <button onClick={() => setAgeMode('manual')} className={`px-2 rounded ${ageMode === 'manual' ? 'bg-white shadow text-blue-600' : 'text-gray-400'}`}>Man</button>
                              <button onClick={() => setAgeMode('auto')} className={`px-2 rounded ${ageMode === 'auto' ? 'bg-white shadow text-blue-600' : 'text-gray-400'}`}>Auto</button>
                           </div>
                       </div>
                       {ageMode === 'manual' ? (
                           <input type="number" value={age} onChange={(e) => setAge(Number(e.target.value))} className="w-full h-10 border rounded px-3 text-sm focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition" />
                       ) : (
                           <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="w-full h-10 border rounded px-2 text-xs focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition" />
                       )}
                       {pediatricAge && ageMode === 'auto' && (
                           <div className="absolute -bottom-4 right-0 text-[10px] font-bold text-blue-600 bg-blue-50 px-1 rounded border border-blue-100">
                               {pediatricAge.years}y {pediatricAge.months}m
                           </div>
                       )}
                   </div>
                ) : (
                   <InputGroup label={t.kcal.age} value={age} onChange={setAge} />
                )}
            </div>

            {/* Height */}
            <div className="col-span-1 relative">
                <label className="block text-xs font-bold text-gray-500 mb-1.5">{isInfant ? "Length" : t.kcal.height}</label>
                <div className="relative">
                    <input type="number" value={height} onChange={(e) => setHeight(Number(e.target.value))} className="w-full h-10 border rounded px-3 text-sm focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition" />
                    <span className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none">cm</span>
                </div>
                {onOpenHeightEstimator && (
                    <button onClick={onOpenHeightEstimator} className="absolute -top-6 right-0 text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 hover:bg-blue-100 transition">Estimate?</button>
                )}
            </div>

            {/* Activity */}
            <div className="col-span-1">
                <label className="block text-xs font-bold text-gray-500 mb-1.5">{t.kcal.activity}</label>
                <select 
                    value={physicalActivity} 
                    onChange={(e) => setPhysicalActivity(Number(e.target.value))} 
                    className="w-full h-10 border rounded px-2 text-xs bg-white focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition"
                >
                    <option value={0}>Select...</option>
                    <option value={1.2}>{t.kcal.activityLevels.sedentary}</option>
                    <option value={1.375}>{t.kcal.activityLevels.mild}</option>
                    <option value={1.55}>{t.kcal.activityLevels.moderate}</option>
                    <option value={1.725}>{t.kcal.activityLevels.heavy}</option>
                    <option value={1.9}>{t.kcal.activityLevels.veryActive}</option>
                </select>
            </div>
          </div>

          {/* Row 2: Anthropometry (2 Column Grid) */}
          <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
              <label className="block text-[10px] font-bold text-gray-400 mb-3 uppercase tracking-wider">Detailed Anthropometry</label>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-1">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">{t.kcal.waist}</label>
                    <div className="flex gap-1">
                        <input type="number" value={waist} onChange={(e) => setWaist(Number(e.target.value))} className="w-full h-9 border rounded px-2 text-xs focus:ring-1 focus:ring-blue-400" />
                        {onOpenPediatricWaist && age >= 2 && age <= 19 && (
                            <button onClick={onOpenPediatricWaist} className="px-1.5 bg-white border rounded text-xs hover:bg-blue-50 text-blue-600" title="Percentile Chart">📊</button>
                        )}
                    </div>
                </div>
                <div className="col-span-1">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">{t.kcal.hip}</label>
                    <input type="number" value={hip} onChange={(e) => setHip && setHip(Number(e.target.value))} className="w-full h-9 border rounded px-2 text-xs focus:ring-1 focus:ring-blue-400" />
                </div>
                <div className="col-span-1">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">{t.kcal.mac}</label>
                    <div className="flex gap-1">
                        <input type="number" value={mac} onChange={(e) => setMac && setMac(Number(e.target.value))} className="w-full h-9 border rounded px-2 text-xs focus:ring-1 focus:ring-blue-400" />
                        {onOpenPediatricMAMC && age >= 2 && age <= 19 && (
                            <button onClick={onOpenPediatricMAMC} className="px-1.5 bg-white border rounded text-xs hover:bg-blue-50 text-blue-600" title="MAMC Analysis">💪</button>
                        )}
                    </div>
                </div>
                <div className="col-span-1">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">{t.kcal.tsf}</label>
                    <input type="number" value={tsf} onChange={(e) => setTsf && setTsf(Number(e.target.value))} className="w-full h-9 border rounded px-2 text-xs focus:ring-1 focus:ring-blue-400" />
                </div>
              </div>
          </div>

          {/* Row 3: Pregnancy (Conditional) */}
          {gender === 'female' && age > 10 && setPregnancyState && (
              <div className="bg-pink-50 p-3 rounded-lg border border-pink-100 flex items-center gap-3">
                  <label className="text-xs font-bold text-pink-700 uppercase whitespace-nowrap">Status:</label>
                  <select 
                      value={pregnancyState || 'none'} 
                      onChange={(e) => setPregnancyState(e.target.value as PregnancyState)}
                      className="flex-grow h-9 border border-pink-200 rounded text-xs focus:ring-pink-400 bg-white px-2"
                  >
                      <option value="none">None</option>
                      <option value="preg_1">Pregnancy (1st Trim)</option>
                      <option value="preg_2">Pregnancy (2nd Trim)</option>
                      <option value="preg_3">Pregnancy (3rd Trim)</option>
                      <option value="lact_0_6">Lactation (0-6m)</option>
                      <option value="lact_7_12">Lactation (7-12m)</option>
                  </select>
              </div>
          )}
      </div>
    </div>
  );
};

export default PersonalInfoCard;
