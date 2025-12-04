
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
  whr?: {
      ratio: string;
      status: string;
      color: string;
  };
  whtr?: {
      ratio: string;
      status: string;
      color: string;
  };
  anthropometry?: {
      estimatedBMI?: string;
      mamc?: string;
  };
  bodyComposition?: {
      bodyFatPercent: number;
      bodyFatSource: 'Manual' | 'Estimated';
      fatMass: number;
      leanBodyMass: number;
      targetWeight?: number;
      targetWeightDiff?: number;
  };
  elderlyInfo?: {
      isElderly: boolean;
      note: string;
  };
  m1?: {
    bmiValue: number;
    factor: number;
    resultDry: number;
    resultSel: number;
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
    katch?: {
        bmr: number;
        tee: number;
    };
    who?: {
        bmr: number;
        tee: number;
    };
    schofield?: {
        bmr: number;
        tee: number;
    };
    accp?: {
        bmr: number;
        tee: number;
    };
    iretonJones?: {
        bmr: number;
        tee: number;
    };
  };
  m4?: {
      factors: { sedentary: number, moderate: number, heavy: number };
      status: 'Overweight' | 'Normal' | 'Underweight';
      dry: { sedentary: number, moderate: number, heavy: number };
      sel: { sedentary: number, moderate: number, heavy: number };
  };
  m5?: {
      resultDry: number;
      resultSel: number;
      category: string;
      notes: string[];
  };
  m6?: {
      result: number;
      label: string;
      note: string;
      proteinRef?: string;
  }
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

export type PregnancyState = 'none' | 'preg_1' | 'preg_2' | 'preg_3' | 'lact_0_6' | 'lact_7_12';

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
  const [hip, setHip] = useState<number>(0); 
  // New Anthropometry
  const [mac, setMac] = useState<number>(0); // Mid Arm Circumference (cm)
  const [tsf, setTsf] = useState<number>(0); // Triceps Skinfold (mm)

  const [physicalActivity, setPhysicalActivity] = useState<number>(0);
  
  const [currentWeight, setCurrentWeight] = useState<number>(0);
  const [selectedWeight, setSelectedWeight] = useState<number>(0);
  const [usualWeight, setUsualWeight] = useState<number>(0);
  
  const [changeDuration, setChangeDuration] = useState<number>(0);
  const [ascites, setAscites] = useState<number>(0);
  const [edema, setEdema] = useState<number>(0);
  const [amputationPercent, setAmputationPercent] = useState<number>(0);
  
  // New InBody/Body Comp Inputs
  const [bodyFatPercent, setBodyFatPercent] = useState<number | ''>('');
  const [desiredBodyFat, setDesiredBodyFat] = useState<number | ''>('');

  // Pregnancy / Lactation State (for EER)
  const [pregnancyState, setPregnancyState] = useState<PregnancyState>('none');

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
      setHip(0);
      setMac(0);
      setTsf(0);
      setPhysicalActivity(0);
      setCurrentWeight(0);
      setSelectedWeight(0);
      setUsualWeight(0);
      setChangeDuration(0);
      setAscites(0);
      setEdema(0);
      setAmputationPercent(0);
      setBodyFatPercent('');
      setDesiredBodyFat('');
      setPregnancyState('none');
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
    const hip_cm = hip;
    const mac_cm = mac;
    const tsf_mm = tsf;
    
    // 1. Dry Weight
    let dryWeightVal = temp_weight - ascites - edema;
    dryWeightVal = dryWeightVal < 0 ? 0 : dryWeightVal;
    
    // Weight Loss Calculation (Fix: allow both positive and negative to show gain/loss context, but primarily loss)
    // Formula: (Usual - Actual) / Usual
    let weightLoss = 0;
    if (usual_weight > 0) {
        weightLoss = ((usual_weight - dryWeightVal) / usual_weight) * 100;
    }

    // 2. Weight Loss Reference
    let weightLossRef = '';
    let weightLossColor = '';
    
    if (changeDuration > 0 && weightLoss > 0) {
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
    } else if (weightLoss < 0) {
        weightLossRef = 'Weight Gain';
        weightLossColor = 'text-blue-500';
    }

    // 3. Ideal Body Weight (IBW)
    let IBW = height_cm - 100; 
    IBW = IBW < 0 ? 0 : IBW;
    let IBW_diff = dryWeightVal > 0 ? ((dryWeightVal - IBW) / dryWeightVal) * 100 : 0;
    let IBW_2 = 0, ABW = 0, ABW_2 = 0;

    if (gender === 'male') {
      IBW_2 = ((height_cm - 154) * 0.9) + 50;
      ABW = ((dryWeightVal - IBW) * 0.38) + IBW;
      ABW_2 = ((dryWeightVal - IBW_2) * 0.38) + IBW_2;
    } else {
      IBW_2 = ((height_cm - 154) * 0.9) + 45.5;
      ABW = ((dryWeightVal - IBW) * 0.32) + IBW;
      ABW_2 = ((dryWeightVal - IBW_2) * 0.32) + IBW_2;
    }

    let IBW_sel_diff = dryWeightVal > 0 ? ((dryWeightVal - IBW_2) / dryWeightVal) * 100 : 0;

    // 4. Amputation Adjustment (Osterkamp)
    let adjustedWeightAmputationStr = '';
    if (amputationPercent > 0 && dryWeightVal > 0) {
        // Formula: Adjusted BW = Actual BW / (100 - % Amputation) * 100
        const denom = 100 - amputationPercent;
        if (denom > 0) {
            const adj = (dryWeightVal / denom) * 100;
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

    const bmiData = calculateBMI(dryWeightVal, height_m);
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

    // 7. Waist Hip Ratio (WHR) - WHO
    let whrData = undefined;
    if (waist_cm > 0 && hip_cm > 0) {
        const ratio = waist_cm / hip_cm;
        let status = '';
        let color = '';
        if (gender === 'male') {
            if (ratio <= 0.9) { status = 'Low Risk'; color = 'text-green-600'; }
            else { status = 'High Risk'; color = 'text-red-600'; }
        } else { // female
            if (ratio <= 0.85) { status = 'Low Risk'; color = 'text-green-600'; }
            else { status = 'High Risk'; color = 'text-red-600'; }
        }
        whrData = { ratio: ratio.toFixed(2), status, color };
    }

    // 8. Waist to Height Ratio (WHtR)
    let whtrData = undefined;
    if (waist_cm > 0 && height_cm > 0) {
        const ratio = waist_cm / height_cm;
        let status = '';
        let color = '';
        
        if (gender === 'male') {
            if (ratio < 0.35) { status = t.kcal.status.underweight; color = 'text-blue-500'; }
            else if (ratio <= 0.43) { status = t.kcal.status.slim; color = 'text-green-400'; }
            else if (ratio <= 0.53) { status = t.kcal.status.healthy; color = 'text-green-600'; }
            else if (ratio <= 0.58) { status = t.kcal.status.overweight; color = 'text-orange-500'; }
            else if (ratio <= 0.63) { status = t.kcal.status.obese; color = 'text-red-500'; }
            else { status = t.kcal.status.veryObese; color = 'text-red-800'; }
        } else { // female
            if (ratio < 0.35) { status = t.kcal.status.underweight; color = 'text-blue-500'; }
            else if (ratio <= 0.42) { status = t.kcal.status.slim; color = 'text-green-400'; }
            else if (ratio <= 0.49) { status = t.kcal.status.healthy; color = 'text-green-600'; }
            else if (ratio <= 0.54) { status = t.kcal.status.overweight; color = 'text-orange-500'; }
            else if (ratio <= 0.58) { status = t.kcal.status.obese; color = 'text-red-500'; }
            else { status = t.kcal.status.veryObese; color = 'text-red-800'; }
        }
        whtrData = { ratio: ratio.toFixed(2), status, color };
    }

    // 9. Anthropometry (New: Est BMI & MAMC)
    let anthropometryData = undefined;
    if (mac_cm > 0) {
        let estBMI = 0;
        if (gender === 'male') {
            estBMI = (1.01 * mac_cm) - 4.7;
        } else {
            estBMI = (1.10 * mac_cm) - 6.7;
        }
        
        let mamc_val = undefined;
        if (tsf_mm > 0) {
            // MAMC (cm) = MAC (cm) - (0.314 * TSF (mm))
            mamc_val = mac_cm - (0.314 * tsf_mm);
        }

        anthropometryData = {
            estimatedBMI: estBMI.toFixed(1),
            mamc: mamc_val ? mamc_val.toFixed(1) : undefined
        };
    }

    // 10. Protocol Check (30% Rule)
    const ibw30 = IBW_2 * 0.30;
    const threshold = IBW_2 + ibw30;
    const isHighObesity = dryWeightVal > threshold;
    const recommendedWeight = isHighObesity ? ABW_2 : IBW_2;
    const recommendationLabel = isHighObesity ? 'useAdjusted' : 'useIdeal';

    // 11. BMR & TEE (Mifflin/Harris) - METHOD 3
    // Use default PA 1.2 if not set to ensure TEE isn't 0
    const paFactor = physicalActivity_val > 0 ? physicalActivity_val : 1.2;
    
    let AW_BMR_harris = 0, SW_BMR_harris = 0;
    let AW_BMR_mifflin = 0, SW_BMR_mifflin = 0;

    if (gender === 'male') {
      AW_BMR_harris = 66.5 + (13.75 * dryWeightVal) + (5.003 * height_cm) - (6.75 * age_years);
      SW_BMR_harris = 66.5 + (13.75 * selectedWeight) + (5.003 * height_cm) - (6.75 * age_years);
      AW_BMR_mifflin = (10 * dryWeightVal) + (6.25 * height_cm) - (5 * age_years) + 5;
      SW_BMR_mifflin = (10 * selectedWeight) + (6.25 * height_cm) - (5 * age_years) + 5;
    } else {
      AW_BMR_harris = 655.1 + (9.563 * dryWeightVal) + (1.850 * height_cm) - (4.676 * age_years);
      SW_BMR_harris = 655.1 + (9.563 * selectedWeight) + (1.850 * height_cm) - (4.676 * age_years);
      AW_BMR_mifflin = (10 * dryWeightVal) + (6.25 * height_cm) - (5 * age_years) - 161;
      SW_BMR_mifflin = (10 * selectedWeight) + (6.25 * height_cm) - (5 * age_years) - 161;
    }

    // TEE Calculation (with 10% TEF)
    const tefFactor = 1.1; 
    
    // NEW EQUATIONS (WHO/FAO & Schofield & ACCP & Ireton-Jones) - Using Dry Weight by default for these simple ones
    let whoBMR = 0;
    if (gender === 'male') {
        if (age_years >= 0 && age_years < 3) whoBMR = (59.512 * dryWeightVal) - 30.4;
        else if (age_years < 10) whoBMR = (22.706 * dryWeightVal) + 504.3;
        else if (age_years < 18) whoBMR = (17.686 * dryWeightVal) + 658.2;
        else if (age_years < 30) whoBMR = (15.4 * dryWeightVal) - (27 * height_m) + 717;
        else if (age_years < 60) whoBMR = (11.3 * dryWeightVal) + (16 * height_m) + 901;
        else whoBMR = (8.8 * dryWeightVal) + (1128 * height_m) - 1071;
    } else {
        if (age_years >= 0 && age_years < 3) whoBMR = (58.317 * dryWeightVal) - 31.1;
        else if (age_years < 10) whoBMR = (20.315 * dryWeightVal) + 485.9;
        else if (age_years < 18) whoBMR = (13.384 * dryWeightVal) + 692.6;
        else if (age_years < 30) whoBMR = (13.3 * dryWeightVal) + (334 * height_m) + 35;
        else if (age_years < 60) whoBMR = (8.7 * dryWeightVal) - (25 * height_m) + 865;
        else whoBMR = (9.2 * dryWeightVal) + (637 * height_m) - 302;
    }

    let schofieldBMR = 0;
    if (gender === 'male') {
        if (age_years < 3) schofieldBMR = (0.167 * dryWeightVal) + (15.174 * height_m) - 617.6;
        else if (age_years < 10) schofieldBMR = (19.59 * dryWeightVal) + (130.3 * height_m) + 414.9;
        else if (age_years < 18) schofieldBMR = (16.25 * dryWeightVal) + (137.2 * height_m) + 515.5;
        else schofieldBMR = (15.057 * dryWeightVal) + (100.4 * height_m) + 705.8; 
    } else {
        if (age_years < 3) schofieldBMR = (16.252 * dryWeightVal) + (1023.2 * height_m) - 413.5;
        else if (age_years < 10) schofieldBMR = (16.969 * dryWeightVal) + (161.8 * height_m) + 371.2;
        else if (age_years < 18) schofieldBMR = (8.365 * dryWeightVal) + (465 * height_m) + 200.0;
        else schofieldBMR = (13.623 * dryWeightVal) + (283 * height_m) + 98.2; 
    }

    // ACCP Equation (American College of Chest Physicians)
    let accpWeight = dryWeightVal;
    if (bmiData.val > 25) accpWeight = IBW_2; // Ideal
    const accpBMR = 25 * accpWeight;

    // Ireton-Jones 1997
    const ijMale = gender === 'male' ? 244 : 0;
    const ijBMR = 1784 - (11 * age_years) + (5 * dryWeightVal) + ijMale; 

    // 12. Body Composition & Katch-McArdle
    let bodyCompData = undefined;
    let katchData = undefined;
    
    // Determine Body Fat %: Manual OR Estimated (Deurenberg)
    let finalBodyFat = 0;
    let bodyFatSource: 'Manual' | 'Estimated' = 'Estimated';

    if (bodyFatPercent && Number(bodyFatPercent) > 0) {
        finalBodyFat = Number(bodyFatPercent);
        bodyFatSource = 'Manual';
    } else if (bmiData.val > 0 && age_years > 0) {
        // Deurenberg Equation: (1.20 * BMI) + (0.23 * Age) - (10.8 * sex) - 5.4
        // sex: men=1, women=0
        const sexFactor = gender === 'male' ? 1 : 0;
        finalBodyFat = (1.20 * bmiData.val) + (0.23 * age_years) - (10.8 * sexFactor) - 5.4;
        if (finalBodyFat < 0) finalBodyFat = 0;
    }

    if (finalBodyFat > 0 && dryWeightVal > 0) {
        // Calculate Fat Mass and Lean Body Mass
        const fatMass = dryWeightVal * (finalBodyFat / 100);
        const leanBodyMass = dryWeightVal - fatMass;
        
        // Katch-McArdle BMR = 370 + (21.6 * LBM)
        const bmrKatch = 370 + (21.6 * leanBodyMass);
        const teeKatch = (bmrKatch * paFactor);

        // Target Weight Calc (if desired body fat is set)
        let targetWeight = undefined;
        let targetWeightDiff = undefined;
        if (desiredBodyFat && Number(desiredBodyFat) > 0) {
            // Target Weight = LBM / (1 - DesiredBF%)
            const desiredDecimal = Number(desiredBodyFat) / 100;
            if (desiredDecimal < 1) {
                targetWeight = leanBodyMass / (1 - desiredDecimal);
                targetWeightDiff = dryWeightVal - targetWeight;
            }
        }

        bodyCompData = {
            bodyFatPercent: Number(finalBodyFat.toFixed(1)),
            bodyFatSource,
            fatMass: Number(fatMass.toFixed(1)),
            leanBodyMass: Number(leanBodyMass.toFixed(1)),
            targetWeight: targetWeight ? Number(targetWeight.toFixed(1)) : undefined,
            targetWeightDiff: targetWeightDiff ? Number(targetWeightDiff.toFixed(1)) : undefined
        };

        katchData = {
            bmr: bmrKatch,
            tee: teeKatch
        };
    }

    // --- METHOD 1 (BMI Based) ---
    // If BMI > 40: Weight * 15, Else: Weight * 20
    const m1Factor = bmiData.val > 40 ? 15 : 20;
    const m1ResultDry = dryWeightVal * m1Factor;
    
    // For Selected
    const m1FactorSel = bmiSelData.val > 40 ? 15 : 20;
    const m1ResultSel = selectedWeight * m1FactorSel;

    // --- METHOD 4 (Ratio Equation) ---
    // Determine status
    let m4Status: 'Overweight' | 'Normal' | 'Underweight' = 'Normal';
    if (bmiData.val < 18.5) m4Status = 'Underweight';
    else if (bmiData.val >= 25) m4Status = 'Overweight';
    else m4Status = 'Normal';

    let m4Factors = { sedentary: 30, moderate: 35, heavy: 40 }; // Default Normal
    
    if (m4Status === 'Overweight') {
        m4Factors = { sedentary: 22.5, moderate: 30, heavy: 35 }; // 20-25 averaged to 22.5
    } else if (m4Status === 'Underweight') {
        m4Factors = { sedentary: 35, moderate: 40, heavy: 47.5 }; // 45-50 averaged to 47.5
    }

    const m4Result = {
        factors: m4Factors,
        status: m4Status,
        dry: {
            sedentary: dryWeightVal * m4Factors.sedentary,
            moderate: dryWeightVal * m4Factors.moderate,
            heavy: dryWeightVal * m4Factors.heavy
        },
        sel: {
            sedentary: selectedWeight * m4Factors.sedentary,
            moderate: selectedWeight * m4Factors.moderate,
            heavy: selectedWeight * m4Factors.heavy
        }
    };

    // --- METHOD 5 (Estimated Minimum Energy Requirements - Revised) ---
    let m5ResultDry = 0;
    let m5ResultSel = 0;
    let m5Category = '';
    const m5Notes: string[] = [];

    if (age <= 19) { 
        if (age <= 1) {
            m5ResultDry = 1000;
            m5ResultSel = 1000;
            m5Category = 'Infant/Toddler (1st yr)';
        } else if (age <= 10) {
            // 1000 kcal + 100 kcal/yr up to 2000 kcal at age 10
            m5ResultDry = 1000 + (age * 100);
            m5ResultSel = 1000 + (age * 100);
            m5Category = `Child (${age}y)`;
        } else if (age <= 15) {
            const yearsAfter10 = age - 10;
            if (gender === 'male') {
                 // 2000 + 200/yr after age 10
                 const val = 2000 + (yearsAfter10 * 200);
                 m5ResultDry = val;
                 m5ResultSel = val;
                 m5Category = `Adolescent Boy (${age}y)`;
            } else {
                 // 2000 + 50-100/yr after age 10. Avg 75.
                 const val = 2000 + (yearsAfter10 * 75);
                 m5ResultDry = val;
                 m5ResultSel = val;
                 m5Category = `Adolescent Girl (${age}y)`;
                 m5Notes.push("Range: +50-100 kcal/yr after age 10");
            }
        } else {
            // Age > 15
            if (gender === 'male') {
                 // Boys > 15 logic
                 let factor = 32.5; // Sedentary avg (30-35)
                 let activityLabel = 'Sedentary';
                 if (physicalActivity_val >= 1.4 && physicalActivity_val < 1.7) {
                     factor = 40; activityLabel = 'Moderate';
                 } else if (physicalActivity_val >= 1.7) {
                     factor = 50; activityLabel = 'Very Active';
                 }
                 m5ResultDry = dryWeightVal * factor;
                 m5ResultSel = selectedWeight * factor;
                 m5Category = `Male Youth >15 (${activityLabel})`;
                 m5Notes.push(`Factor: ${factor} kcal/kg`);
            } else {
                 // Girls > 15: "Calculate as for an adult"
                 let baseFactor = 30; // Ideal
                 if (bmiData.val >= 25) { baseFactor = 20; m5Category = 'Female Youth >15 (Overweight)'; }
                 else if (bmiData.val < 18.5) { baseFactor = 40; m5Category = 'Female Youth >15 (Underweight)'; }
                 else { m5Category = 'Female Youth >15 (Ideal)'; }
                 m5ResultDry = dryWeightVal * baseFactor;
                 m5ResultSel = selectedWeight * baseFactor;
            }
        }
    } else {
        // Adult (>19) Logic - Traditional Category
        let baseFactor = 30;
        if (bmiData.val >= 25) { baseFactor = 20; m5Category = 'Adult (Overweight)'; }
        else if (bmiData.val < 18.5) { baseFactor = 40; m5Category = 'Adult (Underweight)'; }
        else { m5Category = 'Adult (Ideal)'; }

        m5ResultDry = dryWeightVal * baseFactor;
        m5ResultSel = selectedWeight * baseFactor;

        // Elderly Adjustment (> 50y)
        if (age > 50) {
            const decadesOver50 = Math.floor((age - 50) / 10);
            if (decadesOver50 > 0) {
                const reductionPct = decadesOver50 * 10;
                const reductionValDry = m5ResultDry * (reductionPct / 100);
                const reductionValSel = m5ResultSel * (reductionPct / 100);
                m5ResultDry -= reductionValDry;
                m5ResultSel -= reductionValSel;
                m5Notes.push(`Elderly Adjustment: -${reductionPct}%`);
            }
        }
    }

    // --- METHOD 6 (EER - IOM 2002) with Protein Reference ---
    let m6Result = 0;
    let m6Label = '';
    let m6Note = '';
    let m6ProteinRef = '';

    // EER PA Coefficient Mapping
    // Mapped from user's selection (1.2 ~ 1.9) to standard DRI PA (1.0 ~ 1.48)
    let paEER = 1.0; 
    if (physicalActivity_val < 1.3) paEER = 1.00; // Sedentary
    else if (physicalActivity_val < 1.5) paEER = gender === 'male' ? 1.11 : 1.12; // Low Active
    else if (physicalActivity_val < 1.7) paEER = gender === 'male' ? 1.25 : 1.27; // Active
    else paEER = gender === 'male' ? 1.48 : 1.45; // Very Active

    // 1. Infants (0-35 months)
    const totalMonths = (pediatricAge?.years || 0) * 12 + (pediatricAge?.months || 0);
    // Use Dry Weight for calculation
    const W = dryWeightVal; 
    const H_m = height_m;

    if (age < 3 && totalMonths <= 35) {
        if (totalMonths <= 3) {
             m6Result = (89 * W - 100) + 175;
             m6ProteinRef = '9.1g';
        }
        else if (totalMonths <= 6) {
             m6Result = (89 * W - 100) + 56;
             m6ProteinRef = '9.1g';
        }
        else if (totalMonths <= 12) {
             m6Result = (89 * W - 100) + 22;
             m6ProteinRef = '11g';
        }
        else {
             m6Result = (89 * W - 100) + 20;
             m6ProteinRef = '13g';
        }
        m6Label = `Infant (${totalMonths}mo)`;
    } 
    // 2. Children (3-18 years)
    else if (age >= 3 && age <= 18) {
        if (gender === 'male') {
            if (age <= 8) {
                m6Result = 88.5 - (61.9 * age) + paEER * (26.7 * W + 903 * H_m) + 20;
                m6ProteinRef = '19g';
            }
            else {
                m6Result = 88.5 - (61.9 * age) + paEER * (26.7 * W + 903 * H_m) + 25;
                m6ProteinRef = '34-52g';
            }
        } else {
            if (age <= 8) {
                m6Result = 135.3 - (30.8 * age) + paEER * (10.0 * W + 934 * H_m) + 20;
                m6ProteinRef = '19g';
            }
            else {
                m6Result = 135.3 - (30.8 * age) + paEER * (10.0 * W + 934 * H_m) + 25;
                m6ProteinRef = '34-46g';
            }
        }
        m6Label = `Child/Adolescent (${age}y)`;
    }
    // 3. Adults (19+)
    else {
        if (gender === 'male') {
            m6Result = 662 - (9.53 * age) + paEER * (15.91 * W + 539.6 * H_m);
        } else {
            m6Result = 354 - (6.91 * age) + paEER * (9.36 * W + 726 * H_m);
        }
        m6Label = `Adult (${age}y)`;
        
        // Pregnancy / Lactation Add-ons
        if (gender === 'female' && pregnancyState !== 'none') {
            if (pregnancyState === 'preg_1') { 
                m6Result += 0; m6Note = 'Pregnancy (1st Tri): +0'; 
            }
            else if (pregnancyState === 'preg_2') { 
                m6Result += 340; m6Note = 'Pregnancy (2nd Tri): +340'; 
            }
            else if (pregnancyState === 'preg_3') { 
                m6Result += 452; m6Note = 'Pregnancy (3rd Tri): +452'; 
            }
            else if (pregnancyState === 'lact_0_6') { 
                m6Result += 330; m6Note = 'Lactation (0-6m): +330 (500-170)'; 
            }
            else if (pregnancyState === 'lact_7_12') { 
                m6Result += 400; m6Note = 'Lactation (7-12m): +400'; 
            }
        }
    }

    setResults({
        weightLoss: usual_weight > 0 ? weightLoss.toFixed(1) : '0',
        weightLossRef, weightLossColor,
        dryWeight: dryWeightVal.toFixed(1),
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
        whr: whrData,
        whtr: whtrData,
        
        anthropometry: anthropometryData,
        bodyComposition: bodyCompData,
        
        elderlyInfo,

        // Methods
        m1: {
            bmiValue: bmiData.val,
            factor: m1Factor,
            resultDry: m1ResultDry,
            resultSel: m1ResultSel
        },
        m2: {
            actual: [dryWeightVal * 25, dryWeightVal * 30, dryWeightVal * 35, dryWeightVal * 40],
            selected: [selectedWeight * 25, selectedWeight * 30, selectedWeight * 35, selectedWeight * 40]
        },
        m3: {
            harris: {
                bmr: [AW_BMR_harris, SW_BMR_harris],
                tee: [AW_BMR_harris * paFactor * tefFactor, SW_BMR_harris * paFactor * tefFactor]
            },
            mifflin: {
                bmr: [AW_BMR_mifflin, SW_BMR_mifflin],
                tee: [AW_BMR_mifflin * paFactor * tefFactor, SW_BMR_mifflin * paFactor * tefFactor]
            },
            katch: katchData ? {
                bmr: katchData.bmr,
                tee: katchData.tee * tefFactor
            } : undefined,
            who: {
                bmr: whoBMR,
                tee: whoBMR * paFactor * tefFactor
            },
            schofield: {
                bmr: schofieldBMR,
                tee: schofieldBMR * paFactor * tefFactor
            },
            accp: {
                bmr: accpBMR,
                tee: accpBMR 
            },
            iretonJones: {
                bmr: ijBMR,
                tee: ijBMR 
            }
        },
        m4: m4Result,
        m5: {
            resultDry: m5ResultDry,
            resultSel: m5ResultSel,
            category: m5Category,
            notes: m5Notes
        },
        m6: {
            result: m6Result,
            label: m6Label,
            note: m6Note,
            proteinRef: m6ProteinRef
        }
    });

  }, [gender, age, height, waist, hip, mac, tsf, physicalActivity, currentWeight, selectedWeight, usualWeight, changeDuration, ascites, edema, amputationPercent, bodyFatPercent, desiredBodyFat, pregnancyState, pediatricAge, deficit, t]);

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
      hip, setHip,
      mac, setMac,
      tsf, setTsf,
      physicalActivity, setPhysicalActivity,
      currentWeight, setCurrentWeight,
      selectedWeight, setSelectedWeight,
      usualWeight, setUsualWeight,
      changeDuration, setChangeDuration,
      ascites, setAscites,
      edema, setEdema,
      amputationPercent, setAmputationPercent,
      bodyFatPercent, setBodyFatPercent,
      desiredBodyFat, setDesiredBodyFat,
      pregnancyState, setPregnancyState,
      deficit, setDeficit,
      reqKcal, setReqKcal
    },
    results,
    resetInputs
  };
};
