import React, { useState, useEffect } from 'react';

interface KcalCalculatorProps {}

const KcalCalculator: React.FC<KcalCalculatorProps> = () => {
  // State for user inputs
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [age, setAge] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const [waist, setWaist] = useState<number>(0);
  const [physicalActivity, setPhysicalActivity] = useState<number>(0);
  const [currentWeight, setCurrentWeight] = useState<number>(0);
  const [usualWeight, setUsualWeight] = useState<number>(0);
  const [changeDuration, setChangeDuration] = useState<number>(0);
  const [ascites, setAscites] = useState<number>(0);
  const [edema, setEdema] = useState<number>(0);
  const [selectedWeight, setSelectedWeight] = useState<number>(0);
  const [deficit, setDeficit] = useState<number>(0);
  
  // State for special condition toggle
  const [showSpecialCondition, setShowSpecialCondition] = useState<boolean>(false);
  
  // State for active method
  const [activeMethod, setActiveMethod] = useState<'method1' | 'method2' | 'method3' | 'viewAll' | 'none'>('none');

  // State for calculation results
  const [results, setResults] = useState({
    weightLoss: '',
    weightLossRef: '',
    dryWeight: '',
    waistResult: '',
    waistRef: '',
    bmi: '',
    bmiRef: '',
    bmiSel: '',
    bmiSelRef: '',
    IBW: '',
    IBW_diff: '',
    ABW: '',
    IBW_2: '',
    IBW_sel_diff: '',
    ABW_2: '',
    
    // Method 1 results
    under_sed_m1: '',
    under_norm_m1: '',
    under_heavy_m1: '',
    norm_sed_m1: '',
    norm_norm_m1: '',
    norm_heavy_m1: '',
    over_sed_m1: '',
    over_norm_m1: '',
    over_heavy_m1: '',
    
    // Method 2 results
    AW_sed_m2: '',
    SW_sed_m2: '',
    AW_mod_m2: '',
    SW_mod_m2: '',
    AW_modh_m2: '',
    SW_modh_m2: '',
    AW_active_m2: '',
    SW_active_m2: '',
    
    // Method 3 results
    AW_BMR_harris: '',
    SW_BMR_harris: '',
    AW_tee_harris: '',
    SW_tee_harris: '',
    AW_h_est_kcal: '',
    SW_h_est_kcal: '',
    AW_BMR_mifflin: '',
    SW_BMR_mifflin: '',
    AW_tee_mifflin: '',
    SW_tee_mifflin: '',
    AW_m_est_kcal: '',
    SW_m_est_kcal: ''
  });

  // Calculate all results
  const calculateAll = () => {
    const temp_weight = currentWeight;
    const usual_weight = usualWeight;
    const height_cm = height;
    const age_years = age;
    const physicalActivity_val = physicalActivity;
    const ascites_val = ascites;
    const edema_val = edema;
    const weight_sel = selectedWeight;
    const deficit_val = deficit;
    const height_m = height_cm / 100;

    // Dry Weight calculation
    let weight = temp_weight - ascites_val - edema_val;
    let weightLoss = usual_weight > 0 ? ((usual_weight - weight) / usual_weight) * 100 : 0;
    weightLoss = weightLoss < 0 ? 0 : weightLoss;

    // Weight Loss Reference
    let weightLossRef = '';
    let weightLossColor = '';
    if (changeDuration > 0) {
      if (changeDuration === 2) { // Week selection
        if (weightLoss < 1) {
          weightLossRef = '';
        } else if (weightLoss >= 1 && weightLoss <= 2) {
          weightLossRef = 'Moderate Malnutrition';
          weightLossColor = 'text-orange-500';
        } else {
          weightLossRef = 'Severe Malnutrition';
          weightLossColor = 'text-red-500';
        }
      } else {
        if (weightLoss < changeDuration) {
          weightLossRef = '';
        } else if (weightLoss === changeDuration) {
          weightLossRef = 'Moderate Malnutrition';
          weightLossColor = 'text-orange-500';
        } else {
          weightLossRef = 'Severe Malnutrition';
          weightLossColor = 'text-red-500';
        }
      }
    }

    weight = weight < 0 ? 0 : weight;

    // Ideal Body Weight calculations
    let IBW = height_cm - 100;
    IBW = IBW < 0 ? 0 : IBW;

    let IBW_diff = weight > 0 ? ((weight - IBW) / weight) * 100 : 0;
    IBW_diff = IBW_diff < 0 ? 0 : IBW_diff;

    let IBW_2 = 0;
    let ABW = 0;
    let ABW_2 = 0;

    if (gender === 'male') {
      IBW_2 = ((height_cm - 154) * 0.9) + 50;
      ABW = ((weight - IBW) * 0.38) + IBW;
      ABW_2 = ((weight - IBW_2) * 0.38) + IBW_2;
    } else {
      IBW_2 = ((height_cm - 154) * 0.9) + 45.5;
      ABW = ((weight - IBW) * 0.32) + IBW;
      ABW_2 = ((weight - IBW_2) * 0.32) + IBW_2;
    }

    IBW_2 = IBW_2 < 0 ? 0 : IBW_2;
    ABW = ABW < 0 ? 0 : ABW;
    ABW_2 = ABW_2 < 0 ? 0 : ABW_2;

    let IBW_sel_diff = weight > 0 ? ((weight - IBW_2) / weight) * 100 : 0;
    IBW_sel_diff = IBW_sel_diff < 0 ? 0 : IBW_sel_diff;

    // Waist calculation
    let waistRef = '';
    let waistColor = 'text-gray-600';
    if (waist > 0) {
      if (gender === 'male') {
        if (waist < 78) {
          waistRef = 'Below normal';
          waistColor = 'text-blue-500';
        } else if (waist <= 94) {
          waistRef = 'Normal range (78-94)';
          waistColor = 'text-green-500';
        } else if (waist <= 102) {
          waistRef = 'Overweight (94-102)';
          waistColor = 'text-orange-500';
        } else {
          waistRef = 'Obese (more than 102)';
          waistColor = 'text-red-500';
        }
      } else {
        if (waist < 64) {
          waistRef = 'Below normal';
          waistColor = 'text-blue-500';
        } else if (waist <= 80) {
          waistRef = 'Normal range (64-80)';
          waistColor = 'text-green-500';
        } else if (waist <= 88) {
          waistRef = 'Overweight (80-88)';
          waistColor = 'text-orange-500';
        } else {
          waistRef = 'Obese (more than 88)';
          waistColor = 'text-red-500';
        }
      }
    }

    // BMI calculations
    let bmi = 0;
    let bmiRef = '';
    let bmiColor = 'text-gray-600';
    if (temp_weight > 0 && height_m > 0) {
      bmi = temp_weight / (height_m * height_m);
      if (bmi < 16) {
        bmiRef = 'PEM III';
        bmiColor = 'text-purple-500';
      } else if (bmi < 17) {
        bmiRef = 'PEM II';
        bmiColor = 'text-blue-500';
      } else if (bmi < 18.5) {
        bmiRef = 'PEM I';
        bmiColor = 'text-orange-500';
      } else if (bmi < 25) {
        bmiRef = 'Normal Weight';
        bmiColor = 'text-green-500';
      } else if (bmi < 30) {
        bmiRef = 'Overweight';
        bmiColor = 'text-red-700';
      } else if (bmi < 35) {
        bmiRef = 'Obesity I';
        bmiColor = 'text-red-500';
      } else if (bmi < 40) {
        bmiRef = 'Obesity II';
        bmiColor = 'text-red-500';
      } else {
        bmiRef = 'Extreme Obesity';
        bmiColor = 'text-red-600';
      }
    }

    let bmi_sel = 0;
    let bmiSelRef = '';
    let bmiSelColor = 'text-gray-600';
    if (weight_sel > 0 && height_m > 0) {
      bmi_sel = weight_sel / (height_m * height_m);
      if (bmi_sel < 16) {
        bmiSelRef = 'PEM III';
        bmiSelColor = 'text-purple-500';
      } else if (bmi_sel < 17) {
        bmiSelRef = 'PEM II';
        bmiSelColor = 'text-blue-500';
      } else if (bmi_sel < 18.5) {
        bmiSelRef = 'PEM I';
        bmiSelColor = 'text-orange-500';
      } else if (bmi_sel < 25) {
        bmiSelRef = 'Normal Weight';
        bmiSelColor = 'text-green-500';
      } else if (bmi_sel < 30) {
        bmiSelRef = 'Overweight';
        bmiSelColor = 'text-red-700';
      } else if (bmi_sel < 35) {
        bmiSelRef = 'Obesity I';
        bmiSelColor = 'text-red-500';
      } else if (bmi_sel < 40) {
        bmiSelRef = 'Obesity II';
        bmiSelColor = 'text-red-500';
      } else {
        bmiSelRef = 'Extreme Obesity';
        bmiSelColor = 'text-red-600';
      }
    }

    // BMR and TEE calculations
    let AW_BMR_harris = 0, SW_BMR_harris = 0;
    let AW_BMR_mifflin = 0, SW_BMR_mifflin = 0;

    if (gender === 'male') {
      // Harris
      AW_BMR_harris = 66.5 + (13.75 * weight) + (5.003 * height_cm) - (6.75 * age_years);
      SW_BMR_harris = 66.5 + (13.75 * weight_sel) + (5.003 * height_cm) - (6.75 * age_years);
      // Mifflin
      AW_BMR_mifflin = (10 * weight) + (6.25 * height_cm) - (5 * age_years) + 5;
      SW_BMR_mifflin = (10 * weight_sel) + (6.25 * height_cm) - (5 * age_years) + 5;
    } else {
      // Harris
      AW_BMR_harris = 655.1 + (9.563 * weight) + (1.850 * height_cm) - (4.676 * age_years);
      SW_BMR_harris = 655.1 + (9.563 * weight_sel) + (1.850 * height_cm) - (4.676 * age_years);
      // Mifflin
      AW_BMR_mifflin = (10 * weight) + (6.25 * height_cm) - (5 * age_years) - 161;
      SW_BMR_mifflin = (10 * weight_sel) + (6.25 * height_cm) - (5 * age_years) - 161;
    }

    const AW_tee_harris = AW_BMR_harris * physicalActivity_val;
    const SW_tee_harris = SW_BMR_harris * physicalActivity_val;
    const AW_h_est_kcal = AW_tee_harris - deficit_val;
    const SW_h_est_kcal = SW_tee_harris - deficit_val;

    const AW_tee_mifflin = AW_BMR_mifflin * physicalActivity_val;
    const SW_tee_mifflin = SW_BMR_mifflin * physicalActivity_val;
    const AW_m_est_kcal = AW_tee_mifflin - deficit_val;
    const SW_m_est_kcal = SW_tee_mifflin - deficit_val;

    // Method 1 calculations
    const under_sed_m1 = weight_sel * 35;
    const under_norm_m1 = weight_sel * 40;
    const under_heavy_m1 = weight_sel * 45;
    
    const norm_sed_m1 = weight_sel * 30;
    const norm_norm_m1 = weight_sel * 35;
    const norm_heavy_m1 = weight_sel * 40;
    
    const over_sed_m1 = weight_sel * 20;
    const over_norm_m1 = weight_sel * 30;
    const over_heavy_m1 = weight_sel * 35;

    // Method 2 calculations
    const AW_sed_m2 = weight * 25;
    const SW_sed_m2 = weight_sel * 25;
    const AW_mod_m2 = weight * 30;
    const SW_mod_m2 = weight_sel * 30;
    const AW_modh_m2 = weight * 35;
    const SW_modh_m2 = weight_sel * 35;
    const AW_active_m2 = weight * 40;
    const SW_active_m2 = weight_sel * 40;

    // Update results state with colors
    setResults({
      weightLoss: usual_weight > 0 ? `${weightLoss.toFixed(2)} %` : '0 %',
      weightLossRef,
      dryWeight: `${weight.toFixed(2)} kg`,
      waistResult: `${waist} cm`,
      waistRef,
      bmi: bmi > 0 ? `${bmi.toFixed(2)} kg/m²` : '-',
      bmiRef,
      bmiSel: bmi_sel > 0 ? `${bmi_sel.toFixed(2)} kg/m²` : '-',
      bmiSelRef,
      IBW: `${IBW.toFixed(2)} kg`,
      IBW_diff: !isNaN(IBW_diff) ? 
        (IBW_diff <= 30 ? 
          `${IBW_diff.toFixed(2)} % (Diff) Use IBW` : 
          `${IBW_diff.toFixed(2)} % (Diff) Use ABW`) : '',
      ABW: `${ABW.toFixed(2)} kg`,
      IBW_2: `${IBW_2.toFixed(2)} kg`,
      IBW_sel_diff: !isNaN(IBW_sel_diff) ? 
        (IBW_sel_diff <= 30 ? 
          `${IBW_sel_diff.toFixed(2)} % (Diff) Use IBW` : 
          `${IBW_sel_diff.toFixed(2)} % (Diff) Use ABW`) : '',
      ABW_2: `${ABW_2.toFixed(2)} kg`,
      
      // Method 1
      under_sed_m1: `${under_sed_m1.toFixed(0)} Kcal`,
      under_norm_m1: `${under_norm_m1.toFixed(0)} Kcal`,
      under_heavy_m1: `${under_heavy_m1.toFixed(0)} Kcal`,
      norm_sed_m1: `${norm_sed_m1.toFixed(0)} Kcal`,
      norm_norm_m1: `${norm_norm_m1.toFixed(0)} Kcal`,
      norm_heavy_m1: `${norm_heavy_m1.toFixed(0)} Kcal`,
      over_sed_m1: `${over_sed_m1.toFixed(0)} Kcal`,
      over_norm_m1: `${over_norm_m1.toFixed(0)} Kcal`,
      over_heavy_m1: `${over_heavy_m1.toFixed(0)} Kcal`,
      
      // Method 2
      AW_sed_m2: `${AW_sed_m2.toFixed(0)} Kcal`,
      SW_sed_m2: `${SW_sed_m2.toFixed(0)} Kcal`,
      AW_mod_m2: `${AW_mod_m2.toFixed(0)} Kcal`,
      SW_mod_m2: `${SW_mod_m2.toFixed(0)} Kcal`,
      AW_modh_m2: `${AW_modh_m2.toFixed(0)} Kcal`,
      SW_modh_m2: `${SW_modh_m2.toFixed(0)} Kcal`,
      AW_active_m2: `${AW_active_m2.toFixed(0)} Kcal`,
      SW_active_m2: `${SW_active_m2.toFixed(0)} Kcal`,
      
      // Method 3
      AW_BMR_harris: `${AW_BMR_harris.toFixed(0)} Kcal`,
      SW_BMR_harris: `${SW_BMR_harris.toFixed(0)} Kcal`,
      AW_tee_harris: `${AW_tee_harris.toFixed(0)} Kcal`,
      SW_tee_harris: `${SW_tee_harris.toFixed(0)} Kcal`,
      AW_h_est_kcal: `${AW_h_est_kcal.toFixed(0)} Kcal`,
      SW_h_est_kcal: `${SW_h_est_kcal.toFixed(0)} Kcal`,
      AW_BMR_mifflin: `${AW_BMR_mifflin.toFixed(0)} Kcal`,
      SW_BMR_mifflin: `${SW_BMR_mifflin.toFixed(0)} Kcal`,
      AW_tee_mifflin: `${AW_tee_mifflin.toFixed(0)} Kcal`,
      SW_tee_mifflin: `${SW_tee_mifflin.toFixed(0)} Kcal`,
      AW_m_est_kcal: `${AW_m_est_kcal.toFixed(0)} Kcal`,
      SW_m_est_kcal: `${SW_m_est_kcal.toFixed(0)} Kcal`
    });
  };

  // Calculate on state changes
  useEffect(() => {
    calculateAll();
  }, [gender, age, height, waist, physicalActivity, currentWeight, usualWeight, changeDuration, ascites, edema, selectedWeight, deficit]);

  // Helper functions
  const getInputColor = (value: number) => {
    return value === 0 ? 'text-red-500' : 'text-[var(--color-primary)]';
  };

  const getStatusColor = (value: string) => {
    if (value.includes('Severe') || value.includes('Obese') || value.includes('Extreme')) return 'text-red-500';
    if (value.includes('Moderate') || value.includes('Overweight')) return 'text-orange-500';
    if (value.includes('Normal') || value.includes('Use IBW')) return 'text-green-500';
    if (value.includes('Below')) return 'text-blue-500';
    return 'text-gray-600';
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[var(--color-heading)] mb-2">
            Advanced Calorie Calculator
          </h1>
          <p className="text-[var(--color-text-light)]">
            Professional nutritional assessment and calorie calculations
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Side - Input Cards */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information Card */}
            <div className="card bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-[var(--color-heading)] mb-4">
                Personal Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Gender */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                    Gender
                  </label>
                  <div className="flex space-x-4">
                    <button
                      onClick={() => setGender('male')}
                      className={`flex-1 py-2 px-4 rounded-lg border-2 transition ${
                        gender === 'male' 
                          ? 'border-[var(--color-primary)] bg-[var(--color-bg-soft)] text-[var(--color-primary)]' 
                          : 'border-gray-300 text-gray-600'
                      }`}
                    >
                      Male
                    </button>
                    <button
                      onClick={() => setGender('female')}
                      className={`flex-1 py-2 px-4 rounded-lg border-2 transition ${
                        gender === 'female' 
                          ? 'border-[var(--color-primary)] bg-[var(--color-bg-soft)] text-[var(--color-primary)]' 
                          : 'border-gray-300 text-gray-600'
                      }`}
                    >
                      Female
                    </button>
                  </div>
                </div>

                {/* Basic Info */}
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                    Age (years)
                  </label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className={`w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] ${getInputColor(age)}`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(Number(e.target.value))}
                    className={`w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] ${getInputColor(height)}`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                    Waist (cm)
                  </label>
                  <input
                    type="number"
                    value={waist}
                    onChange={(e) => setWaist(Number(e.target.value))}
                    className={`w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] ${getInputColor(waist)}`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                    Physical Activity
                  </label>
                  <select
                    value={physicalActivity}
                    onChange={(e) => setPhysicalActivity(Number(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  >
                    <option value={0}>Select Activity Level</option>
                    <option value={1.5}>Sedentary</option>
                    <option value={1.375}>Mild</option>
                    <option value={1.55}>Moderate</option>
                    <option value={1.725}>Very Active</option>
                    <option value={1.9}>Heavy Active</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Weight Information Card */}
            <div className="card bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-[var(--color-heading)] mb-4">
                Weight Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                    Current Weight (kg)
                  </label>
                  <input
                    type="number"
                    value={currentWeight}
                    onChange={(e) => setCurrentWeight(Number(e.target.value))}
                    className={`w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] ${getInputColor(currentWeight)}`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                    Selected Weight (kg)
                  </label>
                  <input
                    type="number"
                    value={selectedWeight}
                    onChange={(e) => setSelectedWeight(Number(e.target.value))}
                    className={`w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] ${getInputColor(selectedWeight)}`}
                  />
                </div>
              </div>

              {/* Special Condition Toggle */}
              <div className="mt-4 p-4 bg-[var(--color-bg-soft)] rounded-lg">
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setShowSpecialCondition(!showSpecialCondition)}
                >
                  <span className={`font-semibold ${showSpecialCondition ? 'text-[var(--color-primary)]' : 'text-[var(--color-text)]'}`}>
                    {showSpecialCondition ? '▼' : '▶'} Special Conditions
                  </span>
                  <span className={`text-sm ${showSpecialCondition ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-light)]'}`}>
                    {showSpecialCondition ? 'Hide' : 'Show'} Weight Change & Medical Conditions
                  </span>
                </div>

                {showSpecialCondition && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                        Usual Weight (kg)
                      </label>
                      <input
                        type="number"
                        value={usualWeight}
                        onChange={(e) => setUsualWeight(Number(e.target.value))}
                        className={`w-full border border-gray-300 rounded-lg px-3 py-2 ${getInputColor(usualWeight)}`}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                        Change Duration
                      </label>
                      <select
                        value={changeDuration}
                        onChange={(e) => setChangeDuration(Number(e.target.value))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      >
                        <option value={0}>Select Duration</option>
                        <option value={2}>Week</option>
                        <option value={5}>1 Month</option>
                        <option value={7.5}>3 Months</option>
                        <option value={10}>6 Months</option>
                        <option value={20}>1 Year</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                        Ascites Degree
                      </label>
                      <select
                        value={ascites}
                        onChange={(e) => setAscites(Number(e.target.value))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      >
                        <option value={0}>None</option>
                        <option value={2.2}>Minimal</option>
                        <option value={6}>Moderate</option>
                        <option value={14}>Severe</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                        Edema Degree
                      </label>
                      <select
                        value={edema}
                        onChange={(e) => setEdema(Number(e.target.value))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      >
                        <option value={0}>None</option>
                        <option value={1}>Minimal</option>
                        <option value={5}>Moderate</option>
                        <option value={10}>Severe</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Calculation Methods Card */}
            <div className="card bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-[var(--color-heading)] mb-4">
                Calculation Methods
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  onClick={() => setActiveMethod('method1')}
                  className={`p-4 rounded-lg border-2 transition ${
                    activeMethod === 'method1' 
                      ? 'border-[var(--color-primary)] bg-[var(--color-bg-soft)] text-[var(--color-primary)]' 
                      : 'border-gray-300 text-gray-600 hover:border-[var(--color-primary)]'
                  }`}
                >
                  <div className="font-semibold">Method 1</div>
                  <div className="text-sm text-gray-500">Weight-based Kcal</div>
                </button>

                <button
                  onClick={() => setActiveMethod('method2')}
                  className={`p-4 rounded-lg border-2 transition ${
                    activeMethod === 'method2' 
                      ? 'border-[var(--color-primary)] bg-[var(--color-bg-soft)] text-[var(--color-primary)]' 
                      : 'border-gray-300 text-gray-600 hover:border-[var(--color-primary)]'
                  }`}
                >
                  <div className="font-semibold">Method 2</div>
                  <div className="text-sm text-gray-500">Activity-based Kcal</div>
                </button>

                <button
                  onClick={() => setActiveMethod('method3')}
                  className={`p-4 rounded-lg border-2 transition ${
                    activeMethod === 'method3' 
                      ? 'border-[var(--color-primary)] bg-[var(--color-bg-soft)] text-[var(--color-primary)]' 
                      : 'border-gray-300 text-gray-600 hover:border-[var(--color-primary)]'
                  }`}
                >
                  <div className="font-semibold">Method 3</div>
                  <div className="text-sm text-gray-500">BMR & TEE</div>
                </button>
              </div>

              {/* Method Results */}
              {activeMethod && (
                <div className="mt-6 p-4 bg-[var(--color-bg-soft)] rounded-lg">
                  {activeMethod === 'method1' && (
                    <div>
                      <h3 className="font-semibold text-[var(--color-heading)] mb-3">Weight-based Calorie Calculation</h3>
                      <div className="grid grid-cols-4 gap-2 text-sm">
                        <div className="font-semibold">Weight Status</div>
                        <div className="font-semibold">Sedentary</div>
                        <div className="font-semibold">Moderate</div>
                        <div className="font-semibold">Heavy</div>
                        
                        <div className="text-blue-600">Underweight</div>
                        <div>{results.under_sed_m1}</div>
                        <div>{results.under_norm_m1}</div>
                        <div>{results.under_heavy_m1}</div>
                        
                        <div className="text-green-600">Normal</div>
                        <div>{results.norm_sed_m1}</div>
                        <div>{results.norm_norm_m1}</div>
                        <div>{results.norm_heavy_m1}</div>
                        
                        <div className="text-red-600">Overweight</div>
                        <div>{results.over_sed_m1}</div>
                        <div>{results.over_norm_m1}</div>
                        <div>{results.over_heavy_m1}</div>
                      </div>
                    </div>
                  )}

                  {activeMethod === 'method2' && (
                    <div>
                      <h3 className="font-semibold text-[var(--color-heading)] mb-3">Activity-based Calorie Calculation</h3>
                      <div className="grid grid-cols-5 gap-2 text-sm">
                        <div className="font-semibold">Weight</div>
                        <div className="font-semibold">Sedentary</div>
                        <div className="font-semibold">Moderate</div>
                        <div className="font-semibold">Mod-High</div>
                        <div className="font-semibold">Active</div>
                        
                        <div>Actual</div>
                        <div>{results.AW_sed_m2}</div>
                        <div>{results.AW_mod_m2}</div>
                        <div>{results.AW_modh_m2}</div>
                        <div>{results.AW_active_m2}</div>
                        
                        <div className="text-green-600">Selected</div>
                        <div>{results.SW_sed_m2}</div>
                        <div>{results.SW_mod_m2}</div>
                        <div>{results.SW_modh_m2}</div>
                        <div>{results.SW_active_m2}</div>
                      </div>
                    </div>
                  )}

                  {activeMethod === 'method3' && (
                    <div>
                      <h3 className="font-semibold text-[var(--color-heading)] mb-3">BMR & Total Energy Expenditure</h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2 bg-white rounded">
                          <span className="font-semibold">Deficit (Kcal)</span>
                          <input
                            type="number"
                            value={deficit}
                            onChange={(e) => setDeficit(Number(e.target.value))}
                            className="w-20 border border-gray-300 rounded px-2 py-1 text-center"
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div className="font-semibold">Metric</div>
                          <div className="font-semibold text-red-600">Actual Weight</div>
                          <div className="font-semibold text-green-600">Selected Weight</div>
                          
                          <div>BMR Harris</div>
                          <div>{results.AW_BMR_harris}</div>
                          <div>{results.SW_BMR_harris}</div>
                          
                          <div>TEE Harris</div>
                          <div>{results.AW_tee_harris}</div>
                          <div>{results.SW_tee_harris}</div>
                          
                          <div className="font-semibold bg-orange-50">Est. Kcal Harris</div>
                          <div className="font-semibold bg-orange-50">{results.AW_h_est_kcal}</div>
                          <div className="font-semibold bg-orange-50">{results.SW_h_est_kcal}</div>
                          
                          <div>BMR Mifflin</div>
                          <div>{results.AW_BMR_mifflin}</div>
                          <div>{results.SW_BMR_mifflin}</div>
                          
                          <div>TEE Mifflin</div>
                          <div>{results.AW_tee_mifflin}</div>
                          <div>{results.SW_tee_mifflin}</div>
                          
                          <div className="font-semibold bg-orange-50">Est. Kcal Mifflin</div>
                          <div className="font-semibold bg-orange-50">{results.AW_m_est_kcal}</div>
                          <div className="font-semibold bg-orange-50">{results.SW_m_est_kcal}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Results Summary */}
          <div className="space-y-6">
            {/* Summary Card */}
            <div className="card bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-[var(--color-heading)] mb-4">
                Health Summary
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-[var(--color-bg-soft)] rounded-lg">
                  <span className="font-medium">Weight Loss</span>
                  <div className="text-right">
                    <div className="font-semibold text-[var(--color-primary)]">{results.weightLoss}</div>
                    <div className={`text-sm ${getStatusColor(results.weightLossRef)}`}>{results.weightLossRef}</div>
                  </div>
                </div>

                <div className="flex justify-between items-center p-3 bg-[var(--color-bg-soft)] rounded-lg">
                  <span className="font-medium">Dry Weight</span>
                  <div className="font-semibold text-[var(--color-primary)]">{results.dryWeight}</div>
                </div>

                <div className="flex justify-between items-center p-3 bg-[var(--color-bg-soft)] rounded-lg">
                  <span className="font-medium">Waist</span>
                  <div className="text-right">
                    <div className="font-semibold text-[var(--color-primary)]">{results.waistResult}</div>
                    <div className={`text-sm ${getStatusColor(results.waistRef)}`}>{results.waistRef}</div>
                  </div>
                </div>

                <div className="flex justify-between items-center p-3 bg-[var(--color-bg-soft)] rounded-lg">
                  <span className="font-medium">BMI</span>
                  <div className="text-right">
                    <div className="font-semibold text-[var(--color-primary)]">{results.bmi}</div>
                    <div className={`text-sm ${getStatusColor(results.bmiRef)}`}>{results.bmiRef}</div>
                  </div>
                </div>

                <div className="flex justify-between items-center p-3 bg-[var(--color-bg-soft)] rounded-lg">
                  <span className="font-medium">BMI (Selected)</span>
                  <div className="text-right">
                    <div className="font-semibold text-[var(--color-primary)]">{results.bmiSel}</div>
                    <div className={`text-sm ${getStatusColor(results.bmiSelRef)}`}>{results.bmiSelRef}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Ideal Weight Card */}
            <div className="card bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-[var(--color-heading)] mb-4">
                Weight Analysis
              </h2>
              <div className="space-y-4">
                <div className="p-3 bg-[var(--color-bg-soft)] rounded-lg">
                  <div className="font-medium mb-2">Ideal Body Weight (Simple)</div>
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--color-primary)] font-semibold">{results.IBW}</span>
                    <span className={`text-sm ${getStatusColor(results.IBW_diff)}`}>
                      {results.IBW_diff}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-[var(--color-bg-soft)] rounded-lg">
                  <div className="font-medium mb-2">Adjusted Body Weight</div>
                  <div className="text-[var(--color-primary)] font-semibold">{results.ABW}</div>
                </div>

                <div className="p-3 bg-[var(--color-bg-soft)] rounded-lg">
                  <div className="font-medium mb-2">Ideal Body Weight (Accurate)</div>
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--color-primary)] font-semibold">{results.IBW_2}</span>
                    <span className={`text-sm ${getStatusColor(results.IBW_sel_diff)}`}>
                      {results.IBW_sel_diff}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-[var(--color-bg-soft)] rounded-lg">
                  <div className="font-medium mb-2">Adjusted Body Weight (Accurate)</div>
                  <div className="text-[var(--color-primary)] font-semibold">{results.ABW_2}</div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-[var(--color-heading)] mb-4">
                Quick Actions
              </h2>
              <div className="space-y-3">
                <button
                  onClick={() => setActiveMethod('viewAll')}
                  className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white py-2 px-4 rounded-lg transition"
                >
                  View All Methods
                </button>
                <button
                  onClick={() => {
                    setActiveMethod('none');
                    setShowSpecialCondition(false);
                  }}
                  className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-lg transition"
                >
                  Reset View
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KcalCalculator;