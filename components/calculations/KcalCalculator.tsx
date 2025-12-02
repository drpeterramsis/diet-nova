
import React, { useEffect, useState } from 'react';
import { useKcalCalculations, KcalInitialData } from './hooks/useKcalCalculations';
import PersonalInfoCard from './parts/PersonalInfoCard';
import WeightInfoCard from './parts/WeightInfoCard';
import MethodsCard from './parts/MethodsCard';
import ResultsSummaryCard from './parts/ResultsSummaryCard';
import WeightAnalysisCard from './parts/WeightAnalysisCard';
import { Client, ClientVisit } from '../../types';
import { supabase } from '../../lib/supabase';

interface KcalCalculatorProps {
  onPlanMeals?: (kcal: number) => void;
  initialData?: KcalInitialData | null;
  activeVisit?: { client: Client, visit: ClientVisit } | null;
}

const KcalCalculator: React.FC<KcalCalculatorProps> = ({ onPlanMeals, initialData, activeVisit }) => {
  const { inputs, results } = useKcalCalculations(initialData);
  const [saveStatus, setSaveStatus] = useState('');

  // Hydrate state from activeVisit.kcal_data if available
  useEffect(() => {
      if (activeVisit?.visit.kcal_data) {
          const data = activeVisit.visit.kcal_data;
          if (data.inputs) {
              // Hydrate all persistent fields from saved data
              if (data.inputs.gender) inputs.setGender(data.inputs.gender);
              if (data.inputs.age) inputs.setAge(data.inputs.age);
              if (data.inputs.height) inputs.setHeight(data.inputs.height);
              if (data.inputs.waist) inputs.setWaist(data.inputs.waist);
              
              if (data.inputs.physicalActivity) inputs.setPhysicalActivity(data.inputs.physicalActivity);
              if (data.inputs.currentWeight) inputs.setCurrentWeight(data.inputs.currentWeight);
              if (data.inputs.selectedWeight) inputs.setSelectedWeight(data.inputs.selectedWeight);
              if (data.inputs.usualWeight) inputs.setUsualWeight(data.inputs.usualWeight);
              
              if (data.inputs.deficit) inputs.setDeficit(data.inputs.deficit);
              if (data.inputs.ascites) inputs.setAscites(data.inputs.ascites);
              if (data.inputs.edema) inputs.setEdema(data.inputs.edema);
              if (data.inputs.changeDuration) inputs.setChangeDuration(data.inputs.changeDuration);
              
              // Hydrate reqKcal
              if (data.inputs.reqKcal) inputs.setReqKcal(data.inputs.reqKcal);
          }
      }
  }, [activeVisit]); // Run once when visit changes

  const handleSaveToVisit = async () => {
      if (!activeVisit) return;
      setSaveStatus('Saving...');
      
      const stateSnapshot = {
          inputs: {
              gender: inputs.gender,
              age: inputs.age,
              height: inputs.height,
              waist: inputs.waist,
              currentWeight: inputs.currentWeight,
              selectedWeight: inputs.selectedWeight,
              usualWeight: inputs.usualWeight,
              physicalActivity: inputs.physicalActivity,
              deficit: inputs.deficit,
              ascites: inputs.ascites,
              edema: inputs.edema,
              changeDuration: inputs.changeDuration,
              reqKcal: inputs.reqKcal // Save the required kcal manually input by user
          },
          results: results // Save calculated results for reference
      };

      try {
          const { error } = await supabase
            .from('client_visits')
            .update({ kcal_data: stateSnapshot })
            .eq('id', activeVisit.visit.id);

          if (error) throw error;
          setSaveStatus('Saved to Visit Record!');
          setTimeout(() => setSaveStatus(''), 3000);
      } catch (err) {
          console.error(err);
          setSaveStatus('Error Saving');
      }
  };

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      
      {/* Active Visit Toolbar */}
      {activeVisit && (
          <div className="bg-green-50 border border-green-200 p-4 rounded-xl mb-6 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm">
              <div>
                  <h3 className="font-bold text-green-800 text-lg">
                     Client: {activeVisit.client.full_name}
                  </h3>
                  <p className="text-sm text-green-600 flex flex-wrap gap-3">
                     <span>Visit Date: {new Date(activeVisit.visit.visit_date).toLocaleDateString('en-GB')}</span>
                     <span>•</span>
                     <span>Code: {activeVisit.client.client_code || '-'}</span>
                     <span>•</span>
                     <span>Clinic: {activeVisit.client.clinic || 'N/A'}</span>
                  </p>
              </div>
              <div className="flex items-center gap-3">
                  {saveStatus && <span className="text-sm font-medium text-green-700 animate-pulse">{saveStatus}</span>}
                  
                  {/* Shortcut to Plan Meals if ReqKcal exists */}
                  {onPlanMeals && inputs.reqKcal && (
                      <button 
                          onClick={() => onPlanMeals(Number(inputs.reqKcal))}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg shadow font-bold transition flex items-center gap-2"
                      >
                          <span>📅</span> Plan Meals
                      </button>
                  )}

                  <button 
                    onClick={handleSaveToVisit}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg shadow font-bold transition flex items-center gap-2"
                  >
                      <span>💾</span> Save Calculation
                  </button>
              </div>
          </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Inputs & Methods */}
        <div className="lg:col-span-2 space-y-6">
            <PersonalInfoCard 
              gender={inputs.gender} setGender={inputs.setGender}
              
              age={inputs.age} setAge={inputs.setAge}
              ageMode={inputs.ageMode} setAgeMode={inputs.setAgeMode}
              dob={inputs.dob} setDob={inputs.setDob}
              reportDate={inputs.reportDate} setReportDate={inputs.setReportDate}
              pediatricAge={inputs.pediatricAge}

              height={inputs.height} setHeight={inputs.setHeight}
              waist={inputs.waist} setWaist={inputs.setWaist}
              physicalActivity={inputs.physicalActivity} setPhysicalActivity={inputs.setPhysicalActivity}
            />

            <WeightInfoCard 
              currentWeight={inputs.currentWeight} setCurrentWeight={inputs.setCurrentWeight}
              selectedWeight={inputs.selectedWeight} setSelectedWeight={inputs.setSelectedWeight}
              usualWeight={inputs.usualWeight} setUsualWeight={inputs.setUsualWeight}
              changeDuration={inputs.changeDuration} setChangeDuration={inputs.setChangeDuration}
              ascites={inputs.ascites} setAscites={inputs.setAscites}
              edema={inputs.edema} setEdema={inputs.setEdema}
            />

            <MethodsCard 
              results={results}
              deficit={inputs.deficit}
              setDeficit={inputs.setDeficit}
            />
        </div>

        {/* Right Column: Results */}
        <div className="lg:col-span-1 space-y-6">
            <div className="sticky top-24 space-y-4">
                <ResultsSummaryCard 
                    results={results} 
                    onPlanMeals={onPlanMeals} 
                    reqKcal={inputs.reqKcal}
                    setReqKcal={inputs.setReqKcal}
                />
                <WeightAnalysisCard results={results} />
            </div>
        </div>

      </div>
    </div>
  );
};

export default KcalCalculator;