
import React, { useState, useEffect } from 'react';
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
  edemaCorrectionPercent?: number;
  setEdemaCorrectionPercent?: (v: number) => void;
  amputationPercent?: number;
  setAmputationPercent?: (v: number) => void;
  bodyFatPercent?: number | '';
  setBodyFatPercent?: (v: number | '') => void;
  age?: number;
}

const WeightInfoCard: React.FC<WeightInfoProps> = ({
  currentWeight, setCurrentWeight, selectedWeight, setSelectedWeight,
  usualWeight, setUsualWeight, changeDuration, setChangeDuration,
  ascites, setAscites, edema, setEdema,
  edemaCorrectionPercent, setEdemaCorrectionPercent,
  amputationPercent, setAmputationPercent,
  bodyFatPercent, setBodyFatPercent,
  age
}) => {
  const { t } = useLanguage();
  const [showSpecialCondition, setShowSpecialCondition] = useState(false);
  
  // Local state for amputations
  const [ampSelection, setAmpSelection] = useState<Record<string, number>>({
      hand: 0,
      forearm: 0,
      arm: 0,
      foot: 0,
      lowerLeg: 0,
      leg: 0
  });

  // Recalculate percent when selection changes
  useEffect(() => {
      if (setAmputationPercent) {
          let total = 0;
          total += ampSelection.hand * 0.7;
          total += ampSelection.forearm * 2.3; // Forearm + Hand approx
          total += ampSelection.arm * 5.0;
          
          total += ampSelection.foot * 1.5;
          total += ampSelection.lowerLeg * 5.9; // Lower Leg + Foot approx
          total += ampSelection.leg * 16.0;
          
          setAmputationPercent(Number(total.toFixed(2)));
      }
  }, [ampSelection]);

  const updateAmp = (key: string, val: number) => {
      setAmpSelection(prev => ({ ...prev, [key]: val }));
  };

  const isPediatric = age !== undefined && age < 18;

  return (
    <div className="card bg-white p-3">
      <div className="flex items-center gap-2 mb-3 pb-1 border-b border-gray-100">
        <span className="text-xl">⚖️</span>
        <h2 className="text-lg font-bold text-[var(--color-heading)]">{t.kcal.weightInfo}</h2>
      </div>

      {/* Condensed 3-Column Grid for Weights */}
      <div className="grid grid-cols-3 gap-3">
        <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">{t.kcal.currentWeight}</label>
            <input type="number" value={currentWeight || ''} onChange={(e) => setCurrentWeight(Number(e.target.value))} className="w-full h-9 border rounded px-2 text-sm font-bold text-blue-700" />
        </div>
        <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">{t.kcal.selectedWeight}</label>
            <input type="number" value={selectedWeight || ''} onChange={(e) => setSelectedWeight(Number(e.target.value))} className="w-full h-9 border rounded px-2 text-sm text-green-700" />
        </div>
        <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">{t.kcal.usualWeight}</label>
            <input type="number" value={usualWeight || ''} onChange={(e) => setUsualWeight(Number(e.target.value))} className="w-full h-9 border rounded px-2 text-sm" />
        </div>
      </div>

      {/* Special Conditions Toggle */}
      <div className="mt-3 pt-2 border-t border-gray-100">
        <button 
          onClick={() => setShowSpecialCondition(!showSpecialCondition)}
          className="flex items-center justify-between w-full py-1.5 px-3 rounded bg-gray-50 hover:bg-gray-100 transition text-[var(--color-heading)] text-xs"
        >
          <span className="font-semibold flex items-center gap-2">
             🩺 Advanced / Clinical Conditions
          </span>
          <span className="text-[var(--color-primary)]">
             {showSpecialCondition ? '▲' : '▼'}
          </span>
        </button>

        {showSpecialCondition && (
           <div className="mt-3 space-y-3 animate-fade-in bg-gray-50/50 p-2 rounded">
              
              {/* Row 1: Duration, Body Fat, Fluid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-1">{t.kcal.duration}</label>
                      <select value={changeDuration} onChange={(e) => setChangeDuration(Number(e.target.value))} className="w-full h-8 border rounded px-1 text-xs bg-white">
                          <option value={0}>-</option>
                          <option value={2}>1 Wk</option>
                          <option value={5}>1 Mo</option>
                          <option value={7.5}>3 Mo</option>
                          <option value={10}>6 Mo</option>
                          <option value={20}>1 Yr</option>
                      </select>
                  </div>
                  {setBodyFatPercent && (
                      <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">Body Fat %</label>
                          <input type="number" value={bodyFatPercent || ''} onChange={(e) => setBodyFatPercent(e.target.value === '' ? '' : Number(e.target.value))} className="w-full h-8 border rounded px-2 text-xs" />
                      </div>
                  )}
                  <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-1">{t.kcal.ascites}</label>
                      <select value={ascites} onChange={(e) => setAscites(Number(e.target.value))} className="w-full h-8 border rounded px-1 text-xs bg-white">
                          <option value={0}>None</option>
                          <option value={2.2}>Min</option>
                          <option value={6}>Mod</option>
                          <option value={14}>Sev</option>
                      </select>
                  </div>
                  <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-1">{t.kcal.edema}</label>
                      <select value={edema} onChange={(e) => setEdema(Number(e.target.value))} className="w-full h-8 border rounded px-1 text-xs bg-white">
                          <option value={0}>None</option>
                          <option value={1}>Min</option>
                          <option value={5}>Mod</option>
                          <option value={10}>Sev</option>
                      </select>
                  </div>
              </div>
              
              {/* Edema Correction (Percentage) */}
              {setEdemaCorrectionPercent && (isPediatric || (edemaCorrectionPercent || 0) > 0) && (
                  <div className="bg-red-50 p-2 rounded border border-red-100 flex items-center gap-2">
                      <label className="text-[10px] font-bold text-red-600 uppercase whitespace-nowrap">Edema Corr %:</label>
                      <div className="flex gap-1 text-[10px]">
                          {[0, 0.1, 0.2].map(v => (
                              <button 
                                key={v}
                                onClick={() => setEdemaCorrectionPercent(v)}
                                className={`px-2 py-1 rounded border ${edemaCorrectionPercent === v ? 'bg-red-600 text-white' : 'bg-white text-red-600 border-red-200'}`}
                              >
                                {v === 0 ? 'None' : (v * 100) + '%'}
                              </button>
                          ))}
                      </div>
                      {(edemaCorrectionPercent || 0) > 0 && (
                          <div className="ml-auto text-[10px] font-bold text-red-700 bg-white px-2 py-1 rounded border border-red-200">
                              Dry: {(currentWeight * (1 - (edemaCorrectionPercent || 0))).toFixed(1)}kg
                          </div>
                      )}
                  </div>
              )}

              {/* Amputations */}
              {setAmputationPercent && (
                  <div className="bg-white p-2 rounded border border-gray-200">
                      <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] font-bold text-gray-500 uppercase">{t.kcal.amputations}</span>
                          {amputationPercent ? <span className="text-[10px] font-mono bg-red-100 text-red-600 px-1 rounded">-{amputationPercent.toFixed(1)}%</span> : null}
                      </div>
                      <div className="grid grid-cols-6 gap-1">
                          {['hand', 'forearm', 'arm', 'foot', 'lowerLeg', 'leg'].map(part => (
                              <div key={part} className="text-center">
                                  <label className="block text-[8px] text-gray-400 mb-0.5 capitalize">{part}</label>
                                  <select 
                                    value={ampSelection[part]} 
                                    onChange={(e) => updateAmp(part, Number(e.target.value))} 
                                    className="w-full text-[10px] p-0.5 border rounded bg-gray-50"
                                  >
                                      <option value={0}>0</option>
                                      <option value={1}>1</option>
                                      <option value={2}>2</option>
                                  </select>
                              </div>
                          ))}
                      </div>
                  </div>
              )}
           </div>
        )}
      </div>
    </div>
  );
};

export default WeightInfoCard;
