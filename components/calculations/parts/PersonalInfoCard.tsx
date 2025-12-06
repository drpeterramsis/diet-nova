import React from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { InputGroup, SelectGroup } from '../InputComponents';
import { PediatricAge } from '../hooks/useKcalCalculations';

interface PersonalInfoProps {
  gender: 'male' | 'female';
  setGender: (v: 'male' | 'female') => void;
  age: number;
  setAge: (v: number) => void;
  ageMode: 'manual' | 'auto';
  setAgeMode: (v: 'manual' | 'auto') => void;
  dob: string;
  setDob: (v: string) => void;
  reportDate: string;
  setReportDate: (v: string) => void;
  pediatricAge: PediatricAge | null;
  height: number;
  setHeight: (v: number) => void;
  waist: number;
  setWaist: (v: number) => void;
  hip: number;
  setHip: (v: number) => void;
  mac: number;
  setMac: (v: number) => void;
  tsf: number;
  setTsf: (v: number) => void;
  physicalActivity: number;
  setPhysicalActivity: (v: number) => void;
  onOpenHeightEstimator?: () => void;
  onOpenPediatricWaist?: () => void;
  onOpenPediatricMAMC?: () => void;
  onOpenGrowthCharts?: () => void;
}

const PersonalInfoCard: React.FC<PersonalInfoProps> = ({
  gender, setGender,
  age, setAge,
  ageMode, setAgeMode,
  dob, setDob,
  reportDate, setReportDate,
  pediatricAge,
  height, setHeight,
  waist, setWaist,
  hip, setHip,
  mac, setMac,
  tsf, setTsf,
  physicalActivity, setPhysicalActivity,
  onOpenHeightEstimator,
  onOpenPediatricWaist,
  onOpenPediatricMAMC,
  onOpenGrowthCharts
}) => {
  const { t } = useLanguage();

  const isInfant = age < 2; // < 24 months

  return (
    <div className="card bg-white">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
        <span className="text-2xl">👤</span>
        <h2 className="text-xl font-bold text-[var(--color-heading)]">{t.kcal.personalInfo}</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t.kcal.gender}</label>
            <div className="flex rounded-lg overflow-hidden border border-gray-200">
                <button 
                onClick={() => setGender('male')}
                className={`flex-1 py-2 transition ${gender === 'male' ? 'bg-[var(--color-primary)] text-white' : 'bg-gray-50 text-gray-600'}`}
                >
                {t.kcal.male}
                </button>
                <button 
                onClick={() => setGender('female')}
                className={`flex-1 py-2 transition ${gender === 'female' ? 'bg-[var(--color-primary)] text-white' : 'bg-gray-50 text-gray-600'}`}
                >
                {t.kcal.female}
                </button>
            </div>
        </div>

        {/* Age Section */}
        <div className="col-span-2 md:col-span-1">
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex justify-end gap-2 mb-2">
                    <button 
                        onClick={() => setAgeMode('manual')}
                        className={`text-xs px-2 py-1 rounded ${ageMode === 'manual' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border'}`}
                    >
                        {t.kcal.manual}
                    </button>
                    <button 
                        onClick={() => setAgeMode('auto')}
                        className={`text-xs px-2 py-1 rounded ${ageMode === 'auto' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border'}`}
                    >
                        {t.kcal.auto}
                    </button>
                </div>
                
                {ageMode === 'manual' ? (
                    <InputGroup label={t.kcal.age} value={age} onChange={setAge} error={age === 0} />
                ) : (
                    <div className="space-y-2">
                        <div>
                            <label className="block text-xs text-gray-600 mb-1">{t.kcal.dob}</label>
                            <input 
                                type="date" 
                                className="w-full p-2 border rounded text-sm bg-white"
                                value={dob || ''}
                                onChange={(e) => setDob(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-600 mb-1">{t.kcal.reportDate}</label>
                            <input 
                                type="date" 
                                className="w-full p-2 border rounded text-sm bg-white"
                                value={reportDate || ''}
                                onChange={(e) => setReportDate(e.target.value)}
                            />
                        </div>
                        <div className="flex justify-between items-center pt-1">
                            <span className="text-sm font-medium text-gray-600">{t.kcal.calcAge}:</span>
                            <span className="text-lg font-bold text-[var(--color-primary)]">{age}</span>
                        </div>
                        {pediatricAge && (
                            <div className="text-xs text-gray-500 font-mono bg-white p-1 rounded border border-gray-100 text-center">
                                {pediatricAge.years}Y {pediatricAge.months}M {pediatricAge.days}D
                            </div>
                        )}
                    </div>
                )}

                <div className={`mt-2 text-xs font-bold px-2 py-1 rounded text-center ${age < 20 ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                    {age < 20 ? t.kcal.pediatricStatus : t.kcal.adultStatus}
                </div>
                
                {/* Growth Chart Button for Pediatrics */}
                {age < 20 && onOpenGrowthCharts && (
                    <button 
                        onClick={onOpenGrowthCharts}
                        className="mt-2 w-full bg-blue-100 hover:bg-blue-200 text-blue-800 text-xs font-bold py-2 rounded transition flex items-center justify-center gap-2"
                    >
                        <span>📈</span> Growth Charts
                    </button>
                )}
            </div>
        </div>

        <InputGroup label={t.kcal.height} value={height} onChange={setHeight} error={height === 0} />
        
        {onOpenHeightEstimator && (
            <button 
                onClick={onOpenHeightEstimator}
                className="col-span-2 text-xs text-[var(--color-primary)] underline hover:text-[var(--color-primary-dark)] text-right -mt-4 mb-2"
            >
                {t.tools.heightEstimator.title}
            </button>
        )}

        <InputGroup label={t.kcal.waist} value={waist} onChange={setWaist} />
        
        {age < 20 && onOpenPediatricWaist && (
             <button 
                onClick={onOpenPediatricWaist}
                className="col-span-2 text-xs text-purple-600 underline hover:text-purple-800 text-right -mt-4 mb-2"
            >
                Analyze Pediatric Waist
            </button>
        )}

        <InputGroup label={t.kcal.hip} value={hip} onChange={setHip} />

        <div className="col-span-2 grid grid-cols-2 gap-5 pt-2 border-t border-gray-100">
            <InputGroup label={t.kcal.mac} value={mac} onChange={setMac} />
            <InputGroup label={t.kcal.tsf} value={tsf} onChange={setTsf} />
            {age < 20 && onOpenPediatricMAMC && (
                <button 
                    onClick={onOpenPediatricMAMC}
                    className="col-span-2 text-xs text-purple-600 underline hover:text-purple-800 text-center -mt-2"
                >
                    Analyze Pediatric MAMC
                </button>
            )}
        </div>
        
        <div className="col-span-2">
            <SelectGroup 
                label={t.kcal.activity}
                value={physicalActivity}
                onChange={setPhysicalActivity}
                options={[
                { value: 0, label: t.kcal.selectActivity },
                { value: 1.2, label: `1.2 - ${t.kcal.activityLevels.sedentary}` },
                { value: 1.375, label: `1.375 - ${t.kcal.activityLevels.mild}` },
                { value: 1.55, label: `1.55 - ${t.kcal.activityLevels.moderate}` },
                { value: 1.725, label: `1.725 - ${t.kcal.activityLevels.heavy}` },
                { value: 1.9, label: `1.9 - ${t.kcal.activityLevels.veryActive}` },
                ]}
            />
        </div>
      </div>
    </div>
  );
};

export default PersonalInfoCard;