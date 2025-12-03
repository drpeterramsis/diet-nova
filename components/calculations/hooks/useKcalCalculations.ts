import { useState, useEffect } from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';

export interface KcalResults {
  weightLoss: string;
  weightLossRef: string;
  weightLossColor: string;
  dryWeight: string;
  bmi: string;
  bmiRef: string;
  bmiColor: string;
  bmiSel: string;
  bmiSelRef: string;
  bmiSelColor: string;
  IBW: string;
  ABW: string;
  IBW_2: string;
  ABW_2: string;
  IBW_diff_val: number;
  IBW_sel_diff_val: number;
  adjustedWeightAmputation?: string;
  protocol?: {
      ibw30: number;
      threshold: number;
      isHighObesity: boolean;
      recommendedWeight: number;
      recommendationLabel: string;
  };
  waistRisk?: {
      status: string;
      color: string;
      value: number;
  };
  elderlyInfo?: {
      isElderly: boolean;
      note: string;
  };
  m1?: {
    under: number[];
    norm: number[];
    over: number[];
  };
  m2?: {
    actual: number[];
    selected: number[];
  };
  m3?: {
    harris: {
      bmr: number[];
      tee: number[];
    };
    mifflin: {
      bmr: number[];
      tee: number[];
    };
  };
}

export interface PediatricAge {
    years: number;
    months: number;
    days: number;
}

export interface KcalInitialData {
    gender?: 'male' | 'female';
    age?: number;
    dob?: string;
    height?: number;
    weight?: number;
}

export const useKcalCalculations = (initialData?: KcalInitialData | null) => {
  const { t } = useLanguage();

  // --- State ---
  const [gender, setGender] = useState<'male' | 'female'>('male');
  
  // Age Logic
  const [age, setAge] = useState<number>(0);
  const [ageMode, setAgeMode] = useState<'manual' | 'auto'>('manual');
  const [dob, setDob] = useState<string>('');
  const [reportDate, setReportDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [pediatricAge, setPediatricAge] = useState<PediatricAge | null>(null);

  const [height, setHeight] = useState<number>(0);
  const [waist, setWaist] = useState<number>(0);
  const [physicalActivity, setPhysicalActivity] = useState<number>(0);
  
  const [currentWeight, setCurrentWeight] = useState<number>(0);
  const [selectedWeight, setSelectedWeight] = useState<number>(0);
  const [usualWeight, setUsualWeight] = useState<number>(0);
  
  const [changeDuration, setChangeDuration] = useState<number>(0);
  const [ascites, setAscites] = useState<number>(0);
  const [edema, setEdema] = useState<number>(0);
  const [amputationPercent, setAmputationPercent] = useState<number>(0);
  const [deficit, setDeficit] = useState<number>(0);
  
  // Results
  const [reqKcal, setReqKcal] = useState<number | ''>('');
  const [results, setResults] = useState<KcalResults>({} as KcalResults);

  // Initialize from passed data (e.g. from Client Manager)
  useEffect(() => {
      if (initialData) {
          if (initialData.gender) setGender(initialData.gender);
          // Only set height if it's provided and non-zero (optional check)
          if (initialData.height) setHeight(initialData.height);
          if (initialData.weight) {
              setCurrentWeight(initialData.weight);
              setSelectedWeight(initialData.weight);
          }
          
          if (initialData.dob) {
              setAgeMode('auto');
              setDob(initialData.dob);
              // Calculate initial pediatric age immediately if possible
              calculateAgeFromDob(initialData.dob, reportDate);
          } else if (initialData.age) {
              setAgeMode('manual');
              setAge(initialData.age);
              // Reset pediatric if manual
              setPediatricAge(null);
          }
      }
  }, [initialData]);

  // Helper to calculate age detail
  const calculateAgeFromDob = (birthDateStr: string, reportDateStr: string) => {
      const birth = new Date(birthDateStr);
      const report = new Date(reportDateStr);
      
      if (!isNaN(birth.getTime()) && !isNaN(report.getTime())) {
          let years = report.getFullYear() - birth.getFullYear();
          let months = report.getMonth() - birth.getMonth();
          let days = report.getDate() - birth.getDate();

          if (days < 0) {
              months--;
              // Get days in previous month
              const prevMonth = new Date(report.getFullYear(), report.getMonth(), 0);
              days += prevMonth.getDate();
          }
          if (months < 0) {
              years--;
              months += 12;
          }

          const calculatedAge = Math.max(0, years);
          setAge(calculatedAge);
          
          // If pediatric (< 20 years), we store detailed Y/M/D
          if (calculatedAge < 20) {
              setPediatricAge({ years: calculatedAge, months: Math.max(0, months), days: Math.max(0, days) });
          } else {
              setPediatricAge(null);
          }
      }
  };

  const resetInputs = () => {
      setGender('male');
      setAge(0);
      setAgeMode('manual');
      setDob('');
      setPediatricAge(null);
      setHeight(0);
      setWaist(0);
      setPhysicalActivity(0);
      setCurrentWeight(0);
      setSelectedWeight(0);
      setUsualWeight(0);
      setChangeDuration(0);
      setAscites(0);
      setEdema(0);
      setAmputationPercent(0);
      setDeficit(0);
      setReqKcal('');
  };

  // Recalculate whenever inputs change
  useEffect(() => {
      if (ageMode === 'auto' && dob && reportDate) {
          calculateAgeFromDob(dob, reportDate);
      } else if (ageMode === 'manual') {
          if (age >= 20) {
              setPediatricAge(null);
          }
      }
  }, [ageMode, dob, reportDate, age]);

  useEffect(() => {
    const temp_weight = currentWeight;
    const usual_weight = usualWeight;
    const height_cm = height;
    const age_years = age;
    const physicalActivity_val = physicalActivity;
    const height_m = height_cm / 100;
    const waist_cm = waist;
    
    // 1. Dry Weight
    let weight = temp_weight - ascites - edema;
    weight = weight < 0 ? 0 : weight;
    
    let weightLoss = usual_weight > 0 ? ((usual_weight - weight) / usual_weight) * 100 : 0;
    weightLoss = weightLoss < 0 ? 0 : weightLoss;

    // 2. Weight Loss Reference
    let weightLossRef = '';
    let weightLossColor = '';
    
    if (changeDuration > 0) {
        let isSevere = false;
        let isModerate = false;

        if (changeDuration === 2) { // 1 Week
             if (weightLoss > 2) isSevere = true;
             else if (weightLoss >= 1) isModerate = true;
        } else if (changeDuration === 5) { // 1 Month
             if (weightLoss > 5) isSevere = true;
             else if (weightLoss >= 5) isModerate = true;
        } else if (changeDuration === 7.5) { // 3 Months
             if (weightLoss > 7.5) isSevere = true;
             else if (weightLoss >= 7.5) isModerate = true;
        } else if (changeDuration === 10) { // 6 Months
             if (weightLoss > 10) isSevere = true;
             else if (weightLoss >= 10) isModerate = true;
        } else if (changeDuration === 20) { // 1 Year
             if (weightLoss > 20) isSevere = true;
             else if (weightLoss >= 20) isModerate = true;
        }

        if (isSevere) {
            weightLossRef = 'Severe Malnutrition';
            weightLossColor = 'text-red-500';
        } else if (isModerate) {
            weightLossRef = 'Moderate Malnutrition';
            weightLossColor = 'text-orange-500';
        }
    }

    // 3. Ideal Body Weight (IBW)
    let IBW = height_cm - 100; 
    IBW = IBW < 0 ? 0 : IBW;
    let IBW_diff = weight > 0 ? ((weight - IBW) / weight) * 100 : 0;
    let IBW_2 = 0, ABW = 0, ABW_2 = 0;

    if (gender === 'male') {
      IBW_2 = ((height_cm - 154) * 0.9) + 50;
      ABW = ((weight - IBW) * 0.38) + IBW;
      ABW_2 = ((weight - IBW_2) * 0.38) + IBW_2;
    } else {
      IBW_2 = ((height_cm - 154) * 0.9) + 45.5;
      ABW = ((weight - IBW) * 0.32) + IBW;
      ABW_2 = ((weight - IBW_2) * 0.32) + IBW_2;
    }

    let IBW_sel_diff = weight > 0 ? ((weight - IBW_2) / weight) * 100 : 0;

    // 4. Amputation Adjustment (Osterkamp)
    let adjustedWeightAmputationStr = '';
    if (amputationPercent > 0 && weight > 0) {
        // Formula: Adjusted BW = Actual BW / (100 - % Amputation) * 100
        const denom = 100 - amputationPercent;
        if (denom > 0) {
            const adj = (weight / denom) * 100;
            adjustedWeightAmputationStr = adj.toFixed(1);
        }
    }

    // 5. BMI & Elderly Logic
    const calculateBMI = (w: number, h: number) => {
        if (w <= 0 || h <= 0) return { val: 0, ref: '', col: '' };
        const val = w / (h * h);
        let ref = '', col = '';
        if (val < 18.5) { ref = t.kcal.status.underweight; col = 'text-blue-500'; }
        else if (val < 25) { ref = t.kcal.status.normal; col = 'text-green-500'; }
        else if (val < 30) { ref = t.kcal.status.overweight; col = 'text-orange-500'; }
        else { ref = t.kcal.status.obese; col = 'text-red-500'; }
        return { val, ref, col };
    };

    const bmiData = calculateBMI(temp_weight, height_m);
    const bmiSelData = calculateBMI(selectedWeight, height_m);

    // Elderly logic (> 59y)
    let elderlyInfo = undefined;
    if (age > 59) {
        elderlyInfo = {
            isElderly: true,
            note: "Elderly (>59y): Normal Range 22 - 27. Optimal is 27."
        };
    }

    // 6. Waist Circumference Risk
    let waistRisk = undefined;
    if (waist_cm > 0) {
        let status = 'Low Risk (Normal)';
        let color = 'text-green-600';
        
        if (gender === 'male') {
            if (waist_cm >= 102) {
                status = 'High Risk (Obese)';
                color = 'text-red-600';
            } else if (waist_cm >= 94) {
                status = 'Increased Risk (Overweight)';
                color = 'text-orange-500';
            }
        } else { // female
            if (waist_cm >= 88) {
                status = 'High Risk (Obese)';
                color = 'text-red-600';
            } else if (waist_cm >= 80) {
                status = 'Increased Risk (Overweight)';
                color = 'text-orange-500';
            }
        }
        waistRisk = { status, color, value: waist_cm };
    }

    // 7. Protocol Check (30% Rule)
    const ibw30 = IBW_2 * 0.30;
    const threshold = IBW_2 + ibw30;
    const isHighObesity = weight > threshold;
    const recommendedWeight = isHighObesity ? ABW_2 : IBW_2;
    const recommendationLabel = isHighObesity ? 'useAdjusted' : 'useIdeal'; // Keys for translation

    // 8. BMR & TEE
    let AW_BMR_harris = 0, SW_BMR_harris = 0;
    let AW_BMR_mifflin = 0, SW_BMR_mifflin = 0;

    if (gender === 'male') {
      AW_BMR_harris = 66.5 + (13.75 * weight) + (5.003 * height_cm) - (6.75 * age_years);
      SW_BMR_harris = 66.5 + (13.75 * selectedWeight) + (5.003 * height_cm) - (6.75 * age_years);
      AW_BMR_mifflin = (10 * weight) + (6.25 * height_cm) - (5 * age_years) + 5;
      SW_BMR_mifflin = (10 * selectedWeight) + (6.25 * height_cm) - (5 * age_years) + 5;
    } else {
      AW_BMR_harris = 655.1 + (9.563 * weight) + (1.850 * height_cm) - (4.676 * age_years);
      SW_BMR_harris = 655.1 + (9.563 * selectedWeight) + (1.850 * height_cm) - (4.676 * age_years);
      AW_BMR_mifflin = (10 * weight) + (6.25 * height_cm) - (5 * age_years) - 161;
      SW_BMR_mifflin = (10 * selectedWeight) + (6.25 * height_cm) - (5 * age_years) - 161;
    }

    setResults({
        weightLoss: usual_weight > 0 ? weightLoss.toFixed(1) : '0',
        weightLossRef, weightLossColor,
        dryWeight: weight.toFixed(1),
        bmi: bmiData.val.toFixed(1), bmiRef: bmiData.ref, bmiColor: bmiData.col,
        bmiSel: bmiSelData.val.toFixed(1), bmiSelRef: bmiSelData.ref, bmiSelColor: bmiSelData.col,
        IBW: IBW.toFixed(1), ABW: ABW.toFixed(1),
        IBW_2: IBW_2.toFixed(1), ABW_2: ABW_2.toFixed(1),
        IBW_diff_val: IBW_diff,
        IBW_sel_diff_val: IBW_sel_diff,
        adjustedWeightAmputation: adjustedWeightAmputationStr,
        
        protocol: {
            ibw30,
            threshold,
            isHighObesity,
            recommendedWeight,
            recommendationLabel
        },
        
        waistRisk,
        elderlyInfo,

        // Methods
        m1: {
            under: [selectedWeight * 35, selectedWeight * 40, selectedWeight * 45],
            norm: [selectedWeight * 30, selectedWeight * 35, selectedWeight * 40],
            over: [selectedWeight * 20, selectedWeight * 30, selectedWeight * 35]
        },
        m2: {
            actual: [weight * 25, weight * 30, weight * 35, weight * 40],
            selected: [selectedWeight * 25, selectedWeight * 30, selectedWeight * 35, selectedWeight * 40]
        },
        m3: {
            harris: {
                bmr: [AW_BMR_harris, SW_BMR_harris],
                tee: [AW_BMR_harris * physicalActivity_val, SW_BMR_harris * physicalActivity_val]
            },
            mifflin: {
                bmr: [AW_BMR_mifflin, SW_BMR_mifflin],
                tee: [AW_BMR_mifflin * physicalActivity_val, SW_BMR_mifflin * physicalActivity_val]
            }
        }
    });

  }, [gender, age, height, waist, physicalActivity, currentWeight, selectedWeight, usualWeight, changeDuration, ascites, edema, amputationPercent, deficit, t]);

  return {
    inputs: {
      gender, setGender,
      age, setAge,
      ageMode, setAgeMode,
      dob, setDob,
      reportDate, setReportDate,
      pediatricAge,
      height, setHeight,
      waist, setWaist,
      physicalActivity, setPhysicalActivity,
      currentWeight, setCurrentWeight,
      selectedWeight, setSelectedWeight,
      usualWeight, setUsualWeight,
      changeDuration, setChangeDuration,
      ascites, setAscites,
      edema, setEdema,
      amputationPercent, setAmputationPercent,
      deficit, setDeficit,
      reqKcal, setReqKcal
    },
    results,
    resetInputs
  };
};