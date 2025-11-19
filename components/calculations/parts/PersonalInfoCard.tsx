import React from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { InputGroup, SelectGroup } from '../InputComponents';

interface PersonalInfoProps {
  gender: 'male' | 'female';
  setGender: (v: 'male' | 'female') => void;
  age: number;
  setAge: (v: number) => void;
  height: number;
  setHeight: (v: number) => void;
  waist: number;
  setWaist: (v: number) => void;
  physicalActivity: number;
  setPhysicalActivity: (v: number) => void;
}

const PersonalInfoCard: React.FC<PersonalInfoProps> = ({
  gender, setGender, age, setAge, height, setHeight, waist, setWaist, physicalActivity, setPhysicalActivity
}) => {
  const { t } = useLanguage();

  return (
    <div className="card bg-white">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
        <span className="text-2xl">👤</span>
        <h2 className="text-xl font-bold text-[var(--color-heading)]">{t.kcal.personalInfo}</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Gender Toggle */}
        <div className="col-span-2">
          <label className="block text-sm font-medium text-[var(--color-text)] mb-2">{t.kcal.gender}</label>
          <div className="flex rounded-lg overflow-hidden border border-[var(--color-primary)]/30">
            <button 
              onClick={() => setGender('male')}
              className={`flex-1 py-2 transition ${gender === 'male' ? 'bg-[var(--color-primary)] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              {t.kcal.male}
            </button>
            <button 
              onClick={() => setGender('female')}
              className={`flex-1 py-2 transition ${gender === 'female' ? 'bg-[var(--color-primary)] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              {t.kcal.female}
            </button>
          </div>
        </div>

        <InputGroup label={t.kcal.age} value={age} onChange={setAge} error={age === 0} />
        <InputGroup label={t.kcal.height} value={height} onChange={setHeight} error={height === 0} />
        <InputGroup label={t.kcal.waist} value={waist} onChange={setWaist} error={waist === 0} />
        
        <SelectGroup 
          label={t.kcal.activity}
          value={physicalActivity}
          onChange={setPhysicalActivity}
          options={[
            { value: 0, label: t.kcal.selectActivity },
            { value: 1.2, label: t.kcal.activityLevels.sedentary },
            { value: 1.375, label: t.kcal.activityLevels.mild },
            { value: 1.55, label: t.kcal.activityLevels.moderate },
            { value: 1.725, label: t.kcal.activityLevels.heavy },
            { value: 1.9, label: t.kcal.activityLevels.veryActive },
          ]}
        />
      </div>
    </div>
  );
};

export default PersonalInfoCard;