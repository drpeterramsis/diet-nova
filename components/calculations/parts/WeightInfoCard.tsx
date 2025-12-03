
import React, { useState } from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { InputGroup, SelectGroup } from '../InputComponents';

interface WeightInfoProps {
  currentWeight: number;
  setCurrentWeight: (v: number) => void;
  selectedWeight: number;
  setSelectedWeight: (v: number) => void;
  usualWeight: number;
  setUsualWeight: (v: number) => void;
  changeDuration: number;
  setChangeDuration: (v: number) => void;
  ascites: number;
  setAscites: (v: number) => void;
  edema: number;
  setEdema: (v: number) => void;
}

const WeightInfoCard: React.FC<WeightInfoProps> = ({
  currentWeight, setCurrentWeight, selectedWeight, setSelectedWeight,
  usualWeight, setUsualWeight, changeDuration, setChangeDuration,
  ascites, setAscites, edema, setEdema
}) => {
  const { t } = useLanguage();
  const [showSpecialCondition, setShowSpecialCondition] = useState(false);

  return (
    <div className="card bg-white">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
        <span className="text-2xl">⚖️</span>
        <h2 className="text-xl font-bold text-[var(--color-heading)]">{t.kcal.weightInfo}</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <InputGroup label={t.kcal.currentWeight} value={currentWeight} onChange={setCurrentWeight} error={currentWeight === 0} />
        <InputGroup label={t.kcal.selectedWeight} value={selectedWeight} onChange={setSelectedWeight} error={selectedWeight === 0} />
      </div>

      {/* Special Conditions Toggle */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <button 
          onClick={() => setShowSpecialCondition(!showSpecialCondition)}
          className="flex items-center justify-between w-full p-3 rounded-lg bg-[var(--color-bg-soft)] hover:bg-green-100 transition text-[var(--color-heading)]"
        >
          <span className="font-semibold flex items-center gap-2">
             🩺 {t.kcal.specialConditions}
          </span>
          <span className="text-sm text-[var(--color-primary)]">
             {showSpecialCondition ? t.kcal.hideConditions : t.kcal.showConditions}
          </span>
        </button>

        {showSpecialCondition && (
           <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-5 animate-fade-in">
              <InputGroup label={t.kcal.usualWeight} value={usualWeight} onChange={setUsualWeight} />
              <SelectGroup 
                label={t.kcal.duration}
                value={changeDuration}
                onChange={setChangeDuration}
                options={[
                  { value: 0, label: '-' },
                  { value: 2, label: '1 Week' },
                  { value: 5, label: '1 Month' },
                  { value: 7.5, label: '3 Months' },
                  { value: 10, label: '6 Months' },
                  { value: 20, label: '1 Year' },
                ]}
              />
              
              <div className="md:col-span-2 pt-2 border-t border-gray-100 mt-2">
                  <p className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wide">
                      Mendenhall's Figure (Fluid Correction)
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <SelectGroup 
                        label={t.kcal.ascites}
                        value={ascites}
                        onChange={setAscites}
                        options={[
                          { value: 0, label: 'None' },
                          { value: 2.2, label: 'Minimal (2.2kg)' },
                          { value: 6, label: 'Moderate (6kg)' },
                          { value: 14, label: 'Severe (14kg)' },
                        ]}
                      />
                      <SelectGroup 
                        label={t.kcal.edema}
                        value={edema}
                        onChange={setEdema}
                        options={[
                          { value: 0, label: 'None' },
                          { value: 1, label: 'Minimal (1kg)' },
                          { value: 5, label: 'Moderate (5kg)' },
                          { value: 10, label: 'Severe (10kg)' },
                        ]}
                      />
                  </div>
              </div>
           </div>
        )}
      </div>
    </div>
  );
};

export default WeightInfoCard;
