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

export const useKcalCalculations = () => {
  const { t } = useLanguage();

  // --- State ---
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [age, setAge] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const [waist, setWaist] = useState<number>(0);
  const [physicalActivity, setPhysicalActivity] = useState<number>(0);
  
  const [currentWeight, setCurrentWeight] = useState<number>(0);
  const [selectedWeight, setSelectedWeight] = useState<number>(0);
  const [usualWeight, setUsualWeight] = useState<number>(0);
  
  const [changeDuration, setChangeDuration] = useState<number>(0);
  const [ascites, setAscites] = useState<number>(0);
  const [edema, setEdema] = useState<number>(0);
  const [deficit, setDeficit] = useState<number>(0);
  
  const [results, setResults] = useState<KcalResults>({} as KcalResults);

  useEffect(() => {
    const temp_weight = currentWeight;
    const usual_weight = usualWeight;
    const height_cm = height;
    const age_years = age;
    const physicalActivity_val = physicalActivity;
    const height_m = height_cm / 100;
    
    // 1. Dry Weight
    let weight = temp_weight - ascites - edema;
    weight = weight < 0 ? 0 : weight;
    
    let weightLoss = usual_weight > 0 ? ((usual_weight - weight) / usual_weight) * 100 : 0;
    weightLoss = weightLoss < 0 ? 0 : weightLoss;

    // 2. Weight Loss Reference
    let weightLossRef = '';
    let weightLossColor = '';
    
    if (changeDuration > 0) {
        if (changeDuration === 2) { // 1 Week
             if (weightLoss >= 1 && weightLoss <= 2) { weightLossRef = 'Moderate Malnutrition'; weightLossColor = 'text-orange-500'; } 
             else if (weightLoss > 2) { weightLossRef = 'Severe Malnutrition'; weightLossColor = 'text-red-500'; }
        } else {
             if (weightLoss === changeDuration) { weightLossRef = 'Moderate Malnutrition'; weightLossColor = 'text-orange-500'; }
             else if (weightLoss > changeDuration) { weightLossRef = 'Severe Malnutrition'; weightLossColor = 'text-red-500'; }
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

    // 4. BMI
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

    // 5. BMR & TEE
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

  }, [gender, age, height, waist, physicalActivity, currentWeight, selectedWeight, usualWeight, changeDuration, ascites, edema, deficit, t]);

  return {
    inputs: {
      gender, setGender,
      age, setAge,
      height, setHeight,
      waist, setWaist,
      physicalActivity, setPhysicalActivity,
      currentWeight, setCurrentWeight,
      selectedWeight, setSelectedWeight,
      usualWeight, setUsualWeight,
      changeDuration, setChangeDuration,
      ascites, setAscites,
      edema, setEdema,
      deficit, setDeficit
    },
    results
  };
};