import React, { useEffect, useState } from 'react';
import { useKcalCalculations, KcalInitialData } from './hooks/useKcalCalculations';
import PersonalInfoCard from './parts/PersonalInfoCard';
import WeightInfoCard from './parts/WeightInfoCard';
import MethodsCard from './parts/MethodsCard';
import ResultsSummaryCard from './parts/ResultsSummaryCard';
import WeightAnalysisCard from './parts/WeightAnalysisCard';
import HeightEstimator from '../tools/HeightEstimator';
import PediatricWaist from '../tools/PediatricWaist';
import PediatricMAMC from '../tools/PediatricMAMC';
import GrowthCharts from '../tools/GrowthCharts'; // Import
import { Client, ClientVisit } from '../../types';
import { supabase } from '../../lib/supabase';
import { useLanguage } from '../../contexts/LanguageContext';

interface KcalCalculatorProps {
  onPlanMeals: (kcal: number) => void;
  initialData?: KcalInitialData | null;
  activeVisit?: { client: Client; visit: ClientVisit } | null;
}

const CollapsibleCard = ({ title, children, defaultOpen = false }: { title: string, children: React.ReactNode, defaultOpen?: boolean }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="card bg-white shadow-sm border border-gray-100 overflow-hidden">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 transition"
            >
                <h3 className="font-bold text-gray-800">{title}</h3>
                <span className="text-gray-500">{isOpen ? '▲' : '▼'}</span>
            </button>
            {isOpen && <div className="p-4 border-t border-gray-100">{children}</div>}
        </div>
    );
};

const KcalCalculator: React.FC<KcalCalculatorProps> = ({ onPlanMeals, initialData, activeVisit }) => {
  const { t } = useLanguage();
  const { inputs, results, resetInputs } = useKcalCalculations(initialData);
  const [saveStatus, setSaveStatus] = useState('');
  
  // Modal States
  const [showHeightEstimator, setShowHeightEstimator] = useState(false);
  const [showPediatricWaist, setShowPediatricWaist] = useState(false);
  const [showPediatricMAMC, setShowPediatricMAMC] = useState(false);
  const [showGrowthCharts, setShowGrowthCharts] = useState(false); // New State

  useEffect(() => {
      // Re-hydrate if needed when props change
      if (initialData) {
          // Logic handled inside hook, but could add reset here if needed
      }
  }, [initialData]);

  const handleSaveToVisit = async () => {
      // Logic placeholder for saving calculation to visit
      if (!activeVisit) return;
      setSaveStatus('Saving...');
      // Implementation...
      setSaveStatus('Saved!');
      setTimeout(() => setSaveStatus(''), 2000);
  };

  const applyEstimatedHeight = (h: number) => {
      inputs.setHeight(h);
      setShowHeightEstimator(false);
  };

  const applyEstimatedWeight = (w: number) => {
      inputs.setCurrentWeight(w);
      setShowHeightEstimator(false);
  };

  const handleToolNoteSave = (note: string) => {
      const newNotes = inputs.notes ? inputs.notes + "\n\n" + note : note;
      inputs.setNotes(newNotes);
      // Close the modal
      setShowPediatricWaist(false);
      setShowPediatricMAMC(false);
      setShowGrowthCharts(false); // Close growth charts too
  };

  return (
    <div className="max-w-[1920px] mx-auto animate-fade-in relative">
      
      {/* Top Bar & Active Visit Toolbar */}
      {activeVisit && (
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl mb-6 flex justify-between items-center shadow-sm">
              <div>
                  <h3 className="font-bold text-blue-800">Analyzing: {activeVisit.client.full_name}</h3>
                  <p className="text-xs text-blue-600">Visit Date: {new Date(activeVisit.visit.visit_date).toLocaleDateString()}</p>
              </div>
              <button onClick={handleSaveToVisit} className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold">
                  {saveStatus || 'Save to Visit'}
              </button>
          </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Inputs & Methods */}
        <div className="lg:col-span-2 space-y-6">
            <CollapsibleCard title={t.kcal.personalInfo} defaultOpen={true}>
                <PersonalInfoCard 
                gender={inputs.gender} setGender={inputs.setGender}
                age={inputs.age} setAge={inputs.setAge}
                ageMode={inputs.ageMode} setAgeMode={inputs.setAgeMode}
                dob={inputs.dob} setDob={inputs.setDob}
                reportDate={inputs.reportDate} setReportDate={inputs.setReportDate}
                pediatricAge={inputs.pediatricAge}
                height={inputs.height} setHeight={inputs.setHeight}
                waist={inputs.waist} setWaist={inputs.setWaist}
                hip={inputs.hip} setHip={inputs.setHip}
                mac={inputs.mac} setMac={inputs.setMac}
                tsf={inputs.tsf} setTsf={inputs.setTsf}
                physicalActivity={inputs.physicalActivity} setPhysicalActivity={inputs.setPhysicalActivity}
                onOpenHeightEstimator={() => setShowHeightEstimator(true)}
                onOpenPediatricWaist={() => setShowPediatricWaist(true)}
                onOpenPediatricMAMC={() => setShowPediatricMAMC(true)}
                onOpenGrowthCharts={() => setShowGrowthCharts(true)} // Pass new handler
                />
            </CollapsibleCard>

            {/* WeightInfoCard & MethodsCard */}
            <CollapsibleCard title={t.kcal.weightInfo} defaultOpen={true}>
                <WeightInfoCard 
                currentWeight={inputs.currentWeight} setCurrentWeight={inputs.setCurrentWeight}
                selectedWeight={inputs.selectedWeight} setSelectedWeight={inputs.setSelectedWeight}
                usualWeight={inputs.usualWeight} setUsualWeight={inputs.setUsualWeight}
                changeDuration={inputs.changeDuration} setChangeDuration={inputs.setChangeDuration}
                ascites={inputs.ascites} setAscites={inputs.setAscites}
                edema={inputs.edema} setEdema={inputs.setEdema}
                edemaCorrectionPercent={inputs.edemaCorrectionPercent} setEdemaCorrectionPercent={inputs.setEdemaCorrectionPercent}
                amputationPercent={inputs.amputationPercent} setAmputationPercent={inputs.setAmputationPercent}
                bodyFatPercent={inputs.bodyFatPercent} setBodyFatPercent={inputs.setBodyFatPercent}
                age={inputs.age}
                />
            </CollapsibleCard>

            <CollapsibleCard title={t.kcal.methods} defaultOpen={true}>
                <MethodsCard 
                results={results}
                deficit={inputs.deficit}
                setDeficit={inputs.setDeficit}
                />
            </CollapsibleCard>
        </div>

        {/* Right Column: Results */}
        <div className="lg:col-span-1 space-y-6">
            <div className="sticky top-24 space-y-4">
                <ResultsSummaryCard 
                    results={results} 
                    onPlanMeals={onPlanMeals} 
                    reqKcal={inputs.reqKcal}
                    setReqKcal={inputs.setReqKcal}
                    notes={inputs.notes}
                    setNotes={inputs.setNotes}
                />
                
                {inputs.setDesiredBodyFat && (
                    <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
                        <label className="block text-xs font-bold text-blue-800 uppercase mb-2">
                            {t.kcal.desiredBodyFat}
                        </label>
                        <input 
                            type="number" 
                            className="w-full p-2 border rounded"
                            placeholder="e.g. 15"
                            value={inputs.desiredBodyFat || ''}
                            onChange={(e) => inputs.setDesiredBodyFat(e.target.value === '' ? '' : Number(e.target.value))}
                        />
                        <p className="text-[10px] text-gray-400 mt-1">
                            Enter target % to calc required weight loss.
                        </p>
                    </div>
                )}

                <WeightAnalysisCard results={results} />
            </div>
        </div>

      </div>

      {/* Modals for Tools */}
      {showHeightEstimator && (
          <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="w-full max-w-lg">
                <HeightEstimator 
                    onClose={() => setShowHeightEstimator(false)}
                    onApplyHeight={applyEstimatedHeight}
                    onApplyWeight={applyEstimatedWeight}
                    initialData={{
                        gender: inputs.gender,
                        age: inputs.age
                    }}
                />
              </div>
          </div>
      )}

      {showPediatricWaist && (
          <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                  <PediatricWaist 
                      onClose={() => setShowPediatricWaist(false)}
                      initialGender={inputs.gender}
                      initialAge={inputs.age}
                      initialWaist={inputs.waist}
                      onSave={handleToolNoteSave}
                  />
              </div>
          </div>
      )}

      {showPediatricMAMC && (
          <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto">
                  <PediatricMAMC 
                      onClose={() => setShowPediatricMAMC(false)}
                      initialGender={inputs.gender}
                      initialAge={inputs.age}
                      initialMac={inputs.mac}
                      onSave={handleToolNoteSave}
                  />
              </div>
          </div>
      )}

      {/* Growth Charts Modal */}
      {showGrowthCharts && (
          <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="w-full max-w-[95vw] h-[95vh] overflow-y-auto">
                  <GrowthCharts 
                      onClose={() => setShowGrowthCharts(false)}
                      initialData={{
                          name: activeVisit?.client.full_name,
                          gender: inputs.gender,
                          age: inputs.age,
                          dob: inputs.dob,
                          visitDate: inputs.reportDate,
                          weight: inputs.currentWeight,
                          height: inputs.height
                      }}
                      onSave={handleToolNoteSave}
                  />
              </div>
          </div>
      )}
    </div>
  );
};

export default KcalCalculator;