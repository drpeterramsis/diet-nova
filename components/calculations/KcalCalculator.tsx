

import React from 'react';
import { useKcalCalculations } from './hooks/useKcalCalculations';
import PersonalInfoCard from './parts/PersonalInfoCard';
import WeightInfoCard from './parts/WeightInfoCard';
import MethodsCard from './parts/MethodsCard';
import ResultsSummaryCard from './parts/ResultsSummaryCard';
import WeightAnalysisCard from './parts/WeightAnalysisCard';

interface KcalCalculatorProps {
  onPlanMeals?: (kcal: number) => void;
}

const KcalCalculator: React.FC<KcalCalculatorProps> = ({ onPlanMeals }) => {
  const { inputs, results } = useKcalCalculations();

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Inputs & Methods */}
        <div className="lg:col-span-2 space-y-6">
            <PersonalInfoCard 
              gender={inputs.gender} setGender={inputs.setGender}
              
              age={inputs.age} setAge={inputs.setAge}
              ageMode={inputs.ageMode} setAgeMode={inputs.setAgeMode}
              dob={inputs.dob} setDob={inputs.setDob}
              reportDate={inputs.reportDate} setReportDate={inputs.setReportDate}

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
            <div className="sticky top-24 space-y-6">
                <ResultsSummaryCard results={results} onPlanMeals={onPlanMeals} />
                <WeightAnalysisCard results={results} />
            </div>
        </div>

      </div>
    </div>
  );
};

export default KcalCalculator;