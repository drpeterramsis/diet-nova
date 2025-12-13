
import { useState, useEffect } from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { growthDatasets, GrowthDataset } from '../../../data/growthChartData';

export interface KcalResults {
  weightLoss: string;
  weightLossRef: string;
  weightLossColor: string;
  dryWeight: string;
  selectedWeight: string; // Added selected weight value
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
  formulas?: {
      ibw: string;
      abw: string;
  };
  detailedFormulas?: {
      ibw: string;
      abw: string;
      bmi: string;
      mifflinDry: string;
      mifflinSel: string;
      harrisDry: string;
      harrisSel: string;
      eer: string;
      m1?: string;
      m2?: string;
      dryWeight?: string;
      weightLoss?: string;
      protocol?: string;
  };
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
  pediatric?: {
      ibwMoore?: number;
      ibwBMI50?: number;
      ibwBestGuess?: number;
      ibwAPLS?: number;
      catchUpKcal?: number; // Kcal/kg
      catchUpTotal?: number;
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
    customFactor: number; // Added to expose manual factor
    resultDry: number;
    resultSel: number;
    customResultDry: number;
    customResultSel: number;
  };
  m2?: {
    actual: number[];
    selected: number[];
  };
  m3?: {
    adjustmentNote: string;
    actFactor: number; // Added to expose PA factor
    harris: {
      bmrDry: number;
      teeDry: number;
      bmrSel: number;
      teeSel: number;
    };
    mifflin: {
      bmrDry: number;
      teeDry: number;
      bmrSel: number;
      teeSel: number;
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
      resultDry: number;
      resultSel: number;
      label: string;
      note: string;
      proteinRef?: string;
  };
  pediatricMethods?: {
      driEER: { valDry: number, valSel: number, label: string, formula: string };
      obeseBEE: { valDry: number, valSel: number, label: string, formula: string };
      maintenanceTEE: { valDry: number, valSel: number, label: string, formula: string };
      ratio: { valDry: number, valSel: number, label: string, formula: string };
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

export type PregnancyState = 'none' | 'preg_1' | 'preg_2' | 'preg_3' | 'lact_0_6' | 'lact_7_12';

// --- Helper Functions for Pediatric Data ---
const getDataset = (type: 'height' | 'weight' | 'bmi', gender: 'male' | 'female', ageY: number): GrowthDataset | undefined => {
    // Priority: CDC for 2-20y, WHO for <2y
    const isInfant = ageY < 2;
    if (type === 'height') {
        return isInfant ? growthDatasets['who_inf_len_age'] : growthDatasets['cdc_child_stat_age'];
    }
    if (type === 'weight') {
        return isInfant ? growthDatasets['who_inf_wt_age'] : growthDatasets['cdc_child_wt_age'];
    }
    if (type === 'bmi') {
        return isInfant ? undefined : growthDatasets['cdc_child_bmi_age'];
    }
    return undefined;
};

const getPercentile = (val: number, ageY: number, dataset: GrowthDataset, gender: 'male' | 'female'): number => {
    const dataPoints = gender === 'male' ? dataset.male : dataset.female;
    let currentX = ageY;
    if (dataset.xLabel.includes('Months')) currentX = ageY * 12;
    
    const ref = dataPoints.reduce((prev, curr) => 
        Math.abs(curr.age - currentX) < Math.abs(prev.age - currentX) ? curr : prev
    );

    const points = [
        { p: 3, v: ref.p3 }, { p: 5, v: ref.p5 }, { p: 10, v: ref.p10 }, 
        { p: 25, v: ref.p25 }, { p: 50, v: ref.p50 }, { p: 75, v: ref.p75 }, 
        { p: 90, v: ref.p90 }, { p: 95, v: ref.p95 }, { p: 97, v: ref.p97 }
    ].filter(pt => pt.v !== undefined) as {p: number, v: number}[];

    if (val <= points[0].v) return points[0].p;
    if (val >= points[points.length-1].v) return points[points.length-1].p;

    for (let i = 0; i < points.length - 1; i++) {
        if (val >= points[i].v && val <= points[i+1].v) {
            const range = points[i+1].v - points[i].v;
            const dist = val - points[i].v;
            const fraction = dist / range;
            return points[i].p + (fraction * (points[i+1].p - points[i].p));
        }
    }
    return 50;
};

const getValueAtPercentile = (percentile: number, ageY: number, dataset: GrowthDataset, gender: 'male' | 'female'): number => {
    const dataPoints = gender === 'male' ? dataset.male : dataset.female;
    let currentX = ageY;
    if (dataset.xLabel.includes('Months')) currentX = ageY * 12;
    
    const ref = dataPoints.reduce((prev, curr) => 
        Math.abs(curr.age - currentX) < Math.abs(prev.age - currentX) ? curr : prev
    );

    const points = [
        { p: 3, v: ref.p3 }, { p: 5, v: ref.p5 }, { p: 10, v: ref.p10 }, 
        { p: 25, v: ref.p25 }, { p: 50, v: ref.p50 }, { p: 75, v: ref.p75 }, 
        { p: 90, v: ref.p90 }, { p: 95, v: ref.p95 }, { p: 97, v: ref.p97 }
    ].filter(pt => pt.v !== undefined) as {p: number, v: number}[];

    if (percentile <= 3) return points[0].v;
    if (percentile >= 97) return points[points.length-1].v;

    for (let i = 0; i < points.length - 1; i++) {
        if (percentile >= points[i].p && percentile <= points[i+1].p) {
            const rangeP = points[i+1].p - points[i].p;
            const distP = percentile - points[i].p;
            const frac = distP / rangeP;
            return points[i].v + (frac * (points[i+1].v - points[i].v));
        }
    }
    return ref.p50;
};

export const useKcalCalculations = (initialData?: KcalInitialData | null) => {
  const { t } = useLanguage();

  // --- State ---
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [age, setAge] = useState<number>(0);
  const [ageMode, setAgeMode] = useState<'manual' | 'auto'>('manual');
  const [dob, setDob] = useState<string>('');
  const [reportDate, setReportDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [pediatricAge, setPediatricAge] = useState<PediatricAge | null>(null);

  const [height, setHeight] = useState<number>(0);
  const [waist, setWaist] = useState<number>(0);
  const [hip, setHip] = useState<number>(0); 
  const [mac, setMac] = useState<number>(0); 
  const [tsf, setTsf] = useState<number>(0); 

  const [physicalActivity, setPhysicalActivity] = useState<number>(0);
  
  const [currentWeight, setCurrentWeight] = useState<number>(0);
  const [selectedWeight, setSelectedWeight] = useState<number>(0);
  const [usualWeight, setUsualWeight] = useState<number>(0);
  
  const [changeDuration, setChangeDuration] = useState<number>(0);
  const [ascites, setAscites] = useState<number>(0);
  const [edema, setEdema] = useState<number>(0);
  const [edemaCorrectionPercent, setEdemaCorrectionPercent] = useState<number>(0); 

  const [amputationPercent, setAmputationPercent] = useState<number>(0);
  
  const [bodyFatPercent, setBodyFatPercent] = useState<number | ''>('');
  const [desiredBodyFat, setDesiredBodyFat] = useState<number | ''>('');

  const [pregnancyState, setPregnancyState] = useState<PregnancyState>('none');

  const [deficit, setDeficit] = useState<number>(0); // This represents the magnitude
  const [goal, setGoal] = useState<'loss' | 'gain'>('loss'); // This represents the direction

  const [notes, setNotes] = useState<string>('');
  
  const [customFactor, setCustomFactor] = useState<number>(30); // Default Factor for M1/M2 Manual

  const [reqKcal, setReqKcal] = useState<number | ''>('');
  const [results, setResults] = useState<KcalResults>({} as KcalResults);

  useEffect(() => {
      if (initialData) {
          if (initialData.gender) setGender(initialData.gender);
          if (initialData.height) setHeight(initialData.height);
          if (initialData.weight) {
              setCurrentWeight(initialData.weight);
              setSelectedWeight(initialData.weight);
          }
          
          if (initialData.dob) {
              setAgeMode('auto');
              setDob(initialData.dob);
              calculateAgeFromDob(initialData.dob, reportDate);
          } else if (initialData.age) {
              setAgeMode('manual');
              setAge(initialData.age);
              setPediatricAge(null);
          }
      }
  }, [initialData]);

  const calculateAgeFromDob = (birthDateStr: string, reportDateStr: string) => {
      const birth = new Date(birthDateStr);
      const report = new Date(reportDateStr);
      
      if (!isNaN(birth.getTime()) && !isNaN(report.getTime())) {
          let years = report.getFullYear() - birth.getFullYear();
          let months = report.getMonth() - birth.getMonth();
          let days = report.getDate() - birth.getDate();

          if (days < 0) {
              months--;
              const prevMonthDate = new Date(report.getFullYear(), report.getMonth(), 0);
              days += prevMonthDate.getDate();
          }
          if (months < 0) {
              years--;
              months += 12;
          }

          const calculatedAge = Math.max(0, years);
          setAge(calculatedAge);
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
      setEdemaCorrectionPercent(0);
      setAmputationPercent(0);
      setBodyFatPercent('');
      setDesiredBodyFat('');
      setPregnancyState('none');
      setDeficit(0);
      setGoal('loss');
      setReqKcal('');
      setNotes('');
      setCustomFactor(30);
  };

  useEffect(() => {
      if (ageMode === 'auto' && dob && reportDate) {
          calculateAgeFromDob(dob, reportDate);
      } else if (ageMode === 'manual') {
          if (age >= 20) setPediatricAge(null);
      }
  }, [ageMode, dob, reportDate, age]);

  useEffect(() => {
    const temp_weight = currentWeight;
    const usual_weight = usualWeight;
    const height_cm = height;
    const age_years = age;
    const physicalActivity_val = physicalActivity;
    const height_m = height_cm / 100;
    const isPediatric = age_years < 19;
    const totalMonths = (pediatricAge?.years || age_years) * 12 + (pediatricAge?.months || 0);
    const ageForCalc = age_years + (pediatricAge ? pediatricAge.months/12 : 0);

    let dryWeightVal = 0;
    if (edemaCorrectionPercent > 0) {
        dryWeightVal = temp_weight * (1 - edemaCorrectionPercent);
    } else {
        dryWeightVal = temp_weight - ascites - edema;
    }
    dryWeightVal = Math.max(0, dryWeightVal);

    const selWeightVal = selectedWeight > 0 ? selectedWeight : dryWeightVal;
    
    let weightLoss = 0;
    if (usual_weight > 0) {
        weightLoss = ((usual_weight - dryWeightVal) / usual_weight) * 100;
    }

    let weightLossRef = '';
    let weightLossColor = '';

    const bmiVal = (height_m > 0 && dryWeightVal > 0) ? dryWeightVal / (height_m * height_m) : 0;
    const bmiValSel = (height_m > 0 && selWeightVal > 0) ? selWeightVal / (height_m * height_m) : 0;

    let bmiRef = '', bmiColor = '';
    if (!isPediatric) {
        if (bmiVal < 18.5) { bmiRef = t.kcal.status.underweight; bmiColor = 'text-blue-500'; }
        else if (bmiVal < 25) { bmiRef = t.kcal.status.normal; bmiColor = 'text-green-500'; }
        else if (bmiVal < 30) { bmiRef = t.kcal.status.overweight; bmiColor = 'text-orange-500'; }
        else { bmiRef = t.kcal.status.obese; bmiColor = 'text-red-500'; }
    } else {
        bmiRef = "See Growth Chart";
        bmiColor = 'text-gray-500';
    }

    let IBW = height_cm - 100; 
    let IBW_2 = 0, ABW = 0, ABW_2 = 0;
    
    const hamwiFormula = gender === 'male' ? "((H - 154) * 0.9) + 50" : "((H - 154) * 0.9) + 45.5";
    
    // UPDATED ABW Logic based on Gender from User Table
    const abwFactor = gender === 'male' ? 0.38 : 0.32;
    const abwFormula = gender === 'male'
        ? "((Actual - IBW) * 0.38) + IBW"
        : "((Actual - IBW) * 0.32) + IBW";

    if (gender === 'male') {
      IBW_2 = ((height_cm - 154) * 0.9) + 50;
    } else {
      IBW_2 = ((height_cm - 154) * 0.9) + 45.5;
    }
    
    ABW_2 = ((dryWeightVal - IBW_2) * abwFactor) + IBW_2; 

    // Detailed Formulas Generation
    const detailedFormulas: any = {};

    // 1. BMI
    detailedFormulas.bmi = `Wt(${dryWeightVal.toFixed(1)}) / Ht(${height_m.toFixed(2)})²`;

    // 2. IBW (Hamwi Metric)
    const ibwBase = gender === 'male' ? 50 : 45.5;
    detailedFormulas.ibw = `((${height_cm} - 154) * 0.9) + ${ibwBase}`;

    // 3. ABW (Updated Tooltip)
    detailedFormulas.abw = `((${dryWeightVal.toFixed(1)} - ${IBW_2.toFixed(1)}) * ${abwFactor}) + ${IBW_2.toFixed(1)}`;

    // --- PEDIATRIC SPECIFIC LOGIC ---
    let pediatricData: KcalResults['pediatric'] = undefined;
    let pedMethods: KcalResults['pediatricMethods'] = undefined;

    if (isPediatric) {
        // ... (Pediatric logic remains same) ...
        let ibwMoore = 0;
        const htDataset = getDataset('height', gender, ageForCalc);
        const wtDataset = getDataset('weight', gender, ageForCalc);
        
        if (htDataset && wtDataset && height_cm > 0) {
            const p = getPercentile(height_cm, ageForCalc, htDataset, gender);
            ibwMoore = getValueAtPercentile(p, ageForCalc, wtDataset, gender);
        }

        let ibwBMI50 = 0;
        const bmiDataset = getDataset('bmi', gender, ageForCalc);
        if (bmiDataset && height_m > 0) {
            const targetBMI = getValueAtPercentile(50, ageForCalc, bmiDataset, gender);
            ibwBMI50 = targetBMI * (height_m * height_m);
        }

        let ibwBestGuess = 0;
        if (totalMonths <= 11) ibwBestGuess = (totalMonths + 9) / 2;
        else if (age_years >= 1 && age_years <= 4) ibwBestGuess = 2 * (age_years + 5);
        else if (age_years >= 5) ibwBestGuess = 4 * age_years;

        let ibwAPLS = 0;
        if (totalMonths <= 12) ibwAPLS = (0.5 * totalMonths) + 4;
        else if (age_years <= 5) ibwAPLS = (2 * age_years) + 8;
        else if (age_years <= 12) ibwAPLS = (3 * age_years) + 7;

        const refIBW = ibwMoore || ibwBMI50 || ibwAPLS || ibwBestGuess;
        let catchUpVal = 0;
        if (refIBW > 0 && dryWeightVal > 0) {
            catchUpVal = (120 * refIBW) / dryWeightVal; 
        }

        pediatricData = {
            ibwMoore: Number(ibwMoore.toFixed(1)),
            ibwBMI50: Number(ibwBMI50.toFixed(1)),
            ibwBestGuess: Number(ibwBestGuess.toFixed(1)),
            ibwAPLS: Number(ibwAPLS.toFixed(1)),
            catchUpKcal: Number(catchUpVal.toFixed(0)),
            catchUpTotal: Number((catchUpVal * dryWeightVal).toFixed(0))
        };

        // Pediatric Formulas
        const calcEER = (wt: number) => {
            if (wt <= 0) return 0;
            const pa = physicalActivity_val > 0 ? physicalActivity_val : 1.0;
            const getPACoeff = (g: 'male'|'female', uPA: number) => {
                if (uPA < 1.3) return 1.0; 
                if (uPA < 1.5) return g==='male'?1.13:1.18; 
                if (uPA < 1.7) return g==='male'?1.26:1.35; 
                return g==='male'?1.42:1.60; 
            };
            const paCoeff = getPACoeff(gender, pa);

            if (totalMonths <= 3) return (89 * wt - 100) + 175;
            if (totalMonths <= 6) return (89 * wt - 100) + 56;
            if (totalMonths <= 12) return (89 * wt - 100) + 22;
            if (totalMonths <= 35) return (89 * wt - 100) + 20;
            if (gender === 'male') {
                if (age_years <= 8) return 88.5 - (61.9 * age_years) + paCoeff * (26.7 * wt + 903 * height_m) + 20;
                else return 88.5 - (61.9 * age_years) + paCoeff * (26.7 * wt + 903 * height_m) + 25;
            } else {
                if (age_years <= 8) return 135.3 - (30.8 * age_years) + paCoeff * (10.0 * wt + 934 * height_m) + 20;
                else return 135.3 - (30.8 * age_years) + paCoeff * (10.0 * wt + 934 * height_m) + 25;
            }
        };

        const eerDry = calcEER(dryWeightVal);
        const eerSel = calcEER(selWeightVal);
        const eerLabel = `DRI/IOM (${totalMonths < 36 ? totalMonths + 'm' : age_years + 'y'})`;
        const eerFormula = totalMonths <= 35 ? "(89 * Wt - 100) + [Age Factor]" : "Gender/Age Specific + PA Coeff";

        const calcBEEObese = (wt: number) => {
            if (wt <= 0) return 0;
            if (age_years >= 3 && age_years <= 18) {
                if (gender === 'male') return 420 - (33.5 * age_years) + (418.9 * height_m) + (16.7 * wt);
                else return 516 - (26.8 * age_years) + (347 * height_m) + (12.4 * wt);
            }
            return 0;
        };
        
        const beeObeseDry = calcBEEObese(dryWeightVal);
        const beeObeseSel = calcBEEObese(selWeightVal);
        const beeObeseFormula = gender === 'male' ? "420 - (33.5*A) + (418.9*H) + (16.7*W)" : "516 - (26.8*A) + (347*H) + (12.4*W)";

        const calcTEEMaint = (wt: number) => {
            if (wt <= 0) return 0;
            const pa = physicalActivity_val > 0 ? physicalActivity_val : 1.0; 
            if (age_years >= 3 && age_years <= 18) {
                if (gender === 'male') {
                    let paMaint = 1.0;
                    if (pa >= 1.3) paMaint = 1.12;
                    if (pa >= 1.5) paMaint = 1.24;
                    if (pa >= 1.7) paMaint = 1.45;
                    return -114 - (50.9 * age_years) + paMaint * (19.5 * wt + 161.4 * height_m);
                } else {
                    let paMaint = 1.0;
                    if (pa >= 1.3) paMaint = 1.18;
                    if (pa >= 1.5) paMaint = 1.35;
                    if (pa >= 1.7) paMaint = 1.60;
                    return 389 - (41.2 * age_years) + paMaint * (15.0 * wt + 701 * height_m);
                }
            }
            return 0;
        };

        const teeMaintDry = calcTEEMaint(dryWeightVal);
        const teeMaintSel = calcTEEMaint(selWeightVal);
        const teeMaintFormula = gender === 'male' ? "-114 - (50.9*A) + PA*(19.5*W + 161.4*H)" : "389 - (41.2*A) + PA*(15.0*W + 701*H)";

        const calcRatio = (wt: number) => {
            if (wt <= 0) return 0;
            const pa = physicalActivity_val > 0 ? physicalActivity_val : 1.0;
            if (age_years < 1) return 1000; 
            else if (age_years >= 1 && age_years <= 11) return 1000 + (100 * age_years);
            else if (age_years >= 12 && age_years <= 15) {
                if (gender === 'female') return 2000 + (75 * (age_years - 10));
                else return 2000 + (200 * (age_years - 10));
            } 
            else if (age_years > 15) {
                if (gender === 'female') return wt * 30; 
                else {
                    let factor = 32.5;
                    if (pa >= 1.3) factor = 35;
                    if (pa >= 1.5) factor = 40;
                    if (pa >= 1.7) factor = 50;
                    return wt * factor;
                }
            }
            return 0;
        };

        const ratioDry = calcRatio(dryWeightVal);
        const ratioSel = calcRatio(selWeightVal);
        let ratioLabel = 'Age-based';
        let ratioFormula = '';
        if (age_years < 1) { ratioLabel='Infant'; ratioFormula='1000 kcal base'; }
        else if (age_years <= 11) { ratioLabel='1-11y'; ratioFormula='1000 + 100*Age'; }
        else if (age_years > 15 && gender === 'male') { ratioLabel='Boys >15'; ratioFormula='Wt * ActivityFactor'; }
        else { ratioLabel='Adolescent Rule'; ratioFormula='Base + Age Increment'; }

        pedMethods = {
            driEER: { valDry: eerDry, valSel: eerSel, label: eerLabel, formula: eerFormula },
            obeseBEE: { valDry: beeObeseDry, valSel: beeObeseSel, label: 'BEE (Obese Eq)', formula: beeObeseFormula },
            maintenanceTEE: { valDry: teeMaintDry, valSel: teeMaintSel, label: 'TEE (Maint. Overweight)', formula: teeMaintFormula },
            ratio: { valDry: ratioDry, valSel: ratioSel, label: ratioLabel, formula: ratioFormula }
        };
    }

    // --- ADULT METHODS ---
    
    // Updated Logic for Method 1 based on Image (Status-based Factor)
    // Range logic applied as per request.
    let m1Factor = 30; 
    let m1LogicText = 'Normal';

    if (bmiVal < 18.5) {
        m1Factor = 35; // Range 35-40 (Underweight)
        m1LogicText = 'Underweight (35-40 kcal/kg)';
    } else if (bmiVal >= 18.5 && bmiVal < 25) {
        m1Factor = 30; // Range 30 (Normal)
        m1LogicText = 'Normal (30 kcal/kg)';
    } else if (bmiVal >= 25 && bmiVal < 30) {
        m1Factor = 25; // Range 25+ (Overweight)
        m1LogicText = 'Overweight (25 kcal/kg)';
    } else if (bmiVal >= 30 && bmiVal < 40) {
        m1Factor = 20; // Range 20-25 (Obese)
        m1LogicText = 'Obese (20-25 kcal/kg)';
    } else if (bmiVal >= 40) {
        m1Factor = 15; // Range 15-20 (Morbid Obese)
        m1LogicText = 'Morbid Obese (15-20 kcal/kg)';
    }
    
    const m1Dry = dryWeightVal * m1Factor;
    const m1Sel = selWeightVal * m1Factor;

    // Custom Factor Calculation
    const m1CustomDry = dryWeightVal * customFactor;
    const m1CustomSel = selWeightVal * customFactor;

    const m2Actual = [dryWeightVal * 25, dryWeightVal * 30, dryWeightVal * 35, dryWeightVal * 40];
    const m2Selected = [selWeightVal * 25, selWeightVal * 30, selWeightVal * 35, selWeightVal * 40];

    const calcHarris = (wt: number) => {
        if (wt <= 0) return 0;
        if (gender === 'male') return 66.5 + (13.75 * wt) + (5.003 * height_cm) - (6.75 * age_years);
        else return 655.1 + (9.563 * wt) + (1.850 * height_cm) - (4.676 * age_years);
    };
    
    const calcMifflin = (wt: number) => {
        if (wt <= 0) return 0;
        if (gender === 'male') return (10 * wt) + (6.25 * height_cm) - (5 * age_years) + 5;
        else return (10 * wt) + (6.25 * height_cm) - (5 * age_years) - 161;
    };

    const harrisDry = calcHarris(dryWeightVal);
    const harrisSel = calcHarris(selWeightVal);
    const mifflinDry = calcMifflin(dryWeightVal);
    const mifflinSel = calcMifflin(selWeightVal);
    
    const actFactor = physicalActivity_val > 0 ? physicalActivity_val : 1.2;

    // Adjusted TEE Calculation (Surplus or Deficit)
    const adjustmentVal = goal === 'loss' ? -deficit : deficit;
    const adjustmentNote = deficit > 0 ? (goal === 'loss' ? `(-${deficit} kcal)` : `(+${deficit} kcal)`) : '';

    const harrisDryTEE = (harrisDry * actFactor) + adjustmentVal;
    const harrisSelTEE = (harrisSel * actFactor) + adjustmentVal;
    const mifflinDryTEE = (mifflinDry * actFactor) + adjustmentVal;
    const mifflinSelTEE = (mifflinSel * actFactor) + adjustmentVal;

    // Detailed Formulas for Mifflin & Harris
    const s_mifflin = gender === 'male' ? 5 : -161;
    detailedFormulas.mifflinDry = `(10 * ${dryWeightVal.toFixed(1)}) + (6.25 * ${height_cm}) - (5 * ${age_years}) + (${s_mifflin})`;
    detailedFormulas.mifflinSel = `(10 * ${selWeightVal.toFixed(1)}) + (6.25 * ${height_cm}) - (5 * ${age_years}) + (${s_mifflin})`;

    if (gender === 'male') {
        detailedFormulas.harrisDry = `66.5 + (13.75 * ${dryWeightVal.toFixed(1)}) + (5.003 * ${height_cm}) - (6.75 * ${age_years})`;
        detailedFormulas.harrisSel = `66.5 + (13.75 * ${selWeightVal.toFixed(1)}) + (5.003 * ${height_cm}) - (6.75 * ${age_years})`;
    } else {
        detailedFormulas.harrisDry = `655.1 + (9.563 * ${dryWeightVal.toFixed(1)}) + (1.850 * ${height_cm}) - (4.676 * ${age_years})`;
        detailedFormulas.harrisSel = `655.1 + (9.563 * ${selWeightVal.toFixed(1)}) + (1.850 * ${height_cm}) - (4.676 * ${age_years})`;
    }

    let m5ResultDry = dryWeightVal * 30;
    let m5ResultSel = selWeightVal * 30;
    
    const calcAdultEER = (wt: number) => {
        if (wt <= 0) return 0;
        const paMap = actFactor >= 1.9 ? 1.48 : actFactor >= 1.7 ? 1.25 : actFactor >= 1.4 ? 1.11 : 1.0;
        if (gender === 'male') return 662 - (9.53 * age_years) + paMap * (15.91 * wt + 539.6 * height_m);
        else return 354 - (6.91 * age_years) + paMap * (9.36 * wt + 726 * height_m);
    };

    const m6ResultDry = calcAdultEER(dryWeightVal);
    const m6ResultSel = calcAdultEER(selWeightVal);
    const m6Formula = gender === 'male' ? "662 - 9.53A + PA(15.91W + 539.6H)" : "354 - 6.91A + PA(9.36W + 726H)";
    
    // EER Detailed Formula
    const paMap = actFactor >= 1.9 ? 1.48 : actFactor >= 1.7 ? 1.25 : actFactor >= 1.4 ? 1.11 : 1.0;
    if (gender === 'male') {
        detailedFormulas.eer = `662 - (9.53 * ${age_years}) + ${paMap} * ((15.91 * ${dryWeightVal.toFixed(1)}) + (539.6 * ${height_m.toFixed(2)}))`;
    } else {
        detailedFormulas.eer = `354 - (6.91 * ${age_years}) + ${paMap} * ((9.36 * ${dryWeightVal.toFixed(1)}) + (726 * ${height_m.toFixed(2)}))`;
    }

    const ibw30 = IBW_2 * 0.30;
    const threshold = IBW_2 + ibw30;
    const isHighObesity = dryWeightVal > threshold;
    const recommendedWeight = isHighObesity ? ABW_2 : IBW_2;

    // --- Detailed Tooltip Data for Quick Methods ---
    detailedFormulas.m1 = `Used Factor: ${m1Factor} kcal/kg (${m1LogicText})

Quick Methods (Guidelines):
• BMI < 18.5 (Underweight): 35-40 kcal/kg
• BMI 18.5-25 (Normal): 30 kcal/kg
• BMI 25-30 (Overweight): 25 kcal/kg
• BMI 30-40 (Obese): 20-25 kcal/kg
• BMI > 40 (Morbid): 15-20 kcal/kg`;

    detailedFormulas.m2 = `${dryWeightVal.toFixed(1)} (Dry Wt) * Factor`;
    
    detailedFormulas.dryWeight = edemaCorrectionPercent > 0 
        ? `${temp_weight} (Current) * (1 - ${edemaCorrectionPercent} (Edema %))`
        : `${temp_weight} (Current) - ${ascites} (Ascites) - ${edema} (Edema)`;

    detailedFormulas.weightLoss = usual_weight > 0 
        ? `((${usual_weight} (Usual) - ${dryWeightVal.toFixed(1)} (Dry)) / ${usual_weight}) * 100` 
        : 'Usual weight not provided';

    detailedFormulas.protocol = isHighObesity 
        ? `Patient > 30% of IBW.\nUsing Adjusted Body Weight (ABW).\nFormula: ((Actual - IBW) * ${abwFactor}) + IBW`
        : `Patient < 30% of IBW.\nUsing Ideal Body Weight (IBW).\nFormula: Hamwi Equation`;

    setResults({
        weightLoss: weightLoss.toFixed(1),
        weightLossRef, weightLossColor,
        dryWeight: dryWeightVal.toFixed(1),
        selectedWeight: selWeightVal.toFixed(1),
        bmi: bmiVal.toFixed(1), bmiRef, bmiColor,
        bmiSel: bmiValSel.toFixed(1), bmiSelRef: '', bmiSelColor: '',
        IBW: IBW.toFixed(1), ABW: ABW.toFixed(1),
        IBW_2: IBW_2.toFixed(1), ABW_2: ABW_2.toFixed(1),
        formulas: {
            ibw: hamwiFormula,
            abw: abwFormula
        },
        detailedFormulas,
        IBW_diff_val: 0, IBW_sel_diff_val: 0,
        protocol: {
            ibw30, threshold, isHighObesity, recommendedWeight, recommendationLabel: isHighObesity ? 'Adj' : 'Ideal'
        },
        pediatric: pediatricData,
        pediatricMethods: pedMethods,
        m1: { 
            bmiValue: bmiVal, 
            factor: m1Factor, 
            customFactor: customFactor, // Expose manually for UI
            resultDry: m1Dry, 
            resultSel: m1Sel,
            customResultDry: m1CustomDry,
            customResultSel: m1CustomSel
        },
        m2: { actual: m2Actual, selected: m2Selected },
        m3: {
            adjustmentNote,
            actFactor: actFactor, // Expose PA Factor
            harris: { bmrDry: harrisDry, teeDry: harrisDryTEE, bmrSel: harrisSel, teeSel: harrisSelTEE },
            mifflin: { bmrDry: mifflinDry, teeDry: mifflinDryTEE, bmrSel: mifflinSel, teeSel: mifflinSelTEE }
        },
        m5: { resultDry: m5ResultDry, resultSel: m5ResultSel, category: 'Adult', notes: [] },
        m6: { resultDry: m6ResultDry, resultSel: m6ResultSel, label: 'Adult EER (IOM)', note: '', proteinRef: m6Formula },
    });

  }, [gender, age, height, waist, hip, mac, tsf, physicalActivity, currentWeight, selectedWeight, usualWeight, changeDuration, ascites, edema, edemaCorrectionPercent, amputationPercent, bodyFatPercent, desiredBodyFat, pregnancyState, pediatricAge, deficit, goal, customFactor, t]);

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
      edemaCorrectionPercent, setEdemaCorrectionPercent,
      amputationPercent, setAmputationPercent,
      bodyFatPercent, setBodyFatPercent,
      desiredBodyFat, setDesiredBodyFat,
      pregnancyState, setPregnancyState,
      deficit, setDeficit,
      goal, setGoal,
      customFactor, setCustomFactor,
      reqKcal, setReqKcal,
      notes, setNotes
    },
    results,
    resetInputs
  };
};