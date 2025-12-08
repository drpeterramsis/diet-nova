

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { growthDatasets, GrowthPoint, GrowthDataset } from '../../data/growthChartData';

interface GrowthChartsProps {
    initialData?: {
        name?: string;
        gender: 'male' | 'female';
        age: number;
        weight?: number;
        height?: number;
        bmi?: number;
        head_circumference?: number;
    };
    onClose?: () => void;
    onSave?: (note: string) => void;
}

interface AssessmentResult {
    datasetId: string;
    label: string;
    value: number;
    rangeLabel: string; // e.g. "50th - 75th"
    exactPercentile: number | null; // e.g. 65.4
    zScore: number | null; // e.g. +1.2
    color: string;
    interpretation: string; // "May be abnormal", "Overweight", etc.
    equationRecommendation: string; // "WHO or DRI equation", "IBW for age", etc.
    biv?: boolean; // Flag for Biologically Implausible Value
    recommendations?: {
        physical?: string;
        labs?: string;
        management?: string; // New field for Weight Management Advice
    };
}

// Helper: Approximate Inverse Normal Distribution (Probit) to get Z-Score from Percentile
// Source: Abramowitz and Stegun (1964) formula
function percentileToZScore(p: number): number | null {
    if (p <= 0 || p >= 100) return null;
    
    // Convert percentage to decimal probability
    const prob = p / 100;
    
    const c0 = 2.515517;
    const c1 = 0.802853;
    const c2 = 0.010328;
    const d1 = 1.432788;
    const d2 = 0.189269;
    const d3 = 0.001308;

    const t = Math.sqrt(-2 * Math.log(Math.min(prob, 1 - prob)));
    let z = t - ((c2 * t + c1) * t + c0) / (((d3 * t + d2) * t + d1) * t + 1);

    if (prob < 0.5) z = -z;
    
    return parseFloat(z.toFixed(2));
}

// Helper: Get Pediatric Weight Management Advice (Based on Table)
function getPediatricWeightManagementAdvice(ageYears: number, percentile: number): string | undefined {
    if (ageYears < 2 || ageYears > 18) return undefined;
    if (percentile < 85) return undefined;

    // Logic based on provided table
    if (ageYears >= 2 && ageYears <= 5) {
        if (percentile >= 99) return "Gradual wt loss of up to 0.5 kg/month if BMI > 21 or 22.";
        if (percentile >= 95) return "Weight maintenance.";
        if (percentile >= 85) return "No Risk: Maintain wt velocity. | With Risk: Decrease wt velocity or wt maintenance.";
    } else if (ageYears >= 6 && ageYears <= 11) {
        if (percentile >= 99) return "Wt loss not to exceed an average of 1 kg/week.";
        if (percentile >= 95) return "Wt maintenance or gradual loss (0.5 kg/month).";
        if (percentile >= 85) return "No Risk: Maintain wt velocity. | With Risk: Decrease wt velocity or wt maintenance.";
    } else if (ageYears >= 12 && ageYears <= 18) {
        if (percentile >= 99) return "Wt loss not to exceed an average of 1 kg/week.";
        if (percentile >= 95) return "Wt loss not to exceed an average of 1 kg/week.";
        if (percentile >= 85) return "No Risk: Maintain wt velocity (after linear growth complete, maintain wt). | With Risk: Decrease wt velocity or wt maintenance.";
    }
    return undefined;
}

const GrowthCharts: React.FC<GrowthChartsProps> = ({ initialData, onClose, onSave }) => {
    const { t } = useLanguage();
    
    // --- State ---
    const [standard, setStandard] = useState<'WHO' | 'CDC'>('WHO');
    const [gender, setGender] = useState<'male' | 'female'>(initialData?.gender || 'male');
    
    // Report Fields
    const [patientName, setPatientName] = useState(initialData?.name || '');
    const [clinicName, setClinicName] = useState('Diet-Nova');
    const [nutritionistName, setNutritionistName] = useState('Dr. Peter Ramsis');

    // Age Inputs
    const [ageMode, setAgeMode] = useState<'auto' | 'manual'>('auto');
    const [dob, setDob] = useState<string>('');
    const [ageYears, setAgeYears] = useState<number>(initialData?.age || 0);
    const [ageMonths, setAgeMonths] = useState<number>(0);
    
    // Measurement Inputs
    const [weight, setWeight] = useState<number | ''>(initialData?.weight || '');
    const [height, setHeight] = useState<number | ''>(initialData?.height || '');
    const [headCirc, setHeadCirc] = useState<number | ''>(initialData?.head_circumference || '');
    
    // Extra Inputs for WHO 0-24m (Manual recording only for now as no chart data provided)
    const [armCirc, setArmCirc] = useState<number | ''>('');
    const [tsf, setTsf] = useState<number | ''>('');
    const [ssf, setSsf] = useState<number | ''>('');

    // Auto Calc BMI
    const [bmi, setBmi] = useState<number | ''>(initialData?.bmi || '');

    // Calculated total age in months (for Infants) and years (for Children)
    const totalMonths = useMemo(() => (ageYears * 12) + ageMonths, [ageYears, ageMonths]);
    const ageDecimal = useMemo(() => ageYears + (ageMonths / 12), [ageYears, ageMonths]);

    // --- Effects ---

    // 1. Calculate Age from DOB
    useEffect(() => {
        if (ageMode === 'auto' && dob) {
            const birthDate = new Date(dob);
            const today = new Date();
            if (!isNaN(birthDate.getTime())) {
                let years = today.getFullYear() - birthDate.getFullYear();
                let months = today.getMonth() - birthDate.getMonth();
                if (today.getDate() < birthDate.getDate()) {
                    months--;
                }
                if (months < 0) {
                    years--;
                    months += 12;
                }
                setAgeYears(years);
                setAgeMonths(months);
            }
        }
    }, [dob, ageMode]);

    // 2. Auto Calculate BMI
    useEffect(() => {
        if (weight && height) {
            const hMeters = Number(height) / 100;
            const bmiVal = Number(weight) / (hMeters * hMeters);
            setBmi(parseFloat(bmiVal.toFixed(1)));
        } else {
            setBmi('');
        }
    }, [weight, height]);

    // --- Helper: Interpolate Exact Percentile ---
    const interpolatePercentile = (val: number, ref: GrowthPoint): number | null => {
        // Define known percentiles available in data
        const percentiles = [3, 5, 10, 15, 25, 50, 75, 85, 90, 95, 97];
        
        // Map data keys to values
        const points = percentiles.map(p => ({
            p,
            val: (ref as any)[`p${p}`] as number | undefined
        })).filter(pt => pt.val !== undefined) as {p: number, val: number}[];

        if (val < points[0].val) return points[0].p - 1; // Below lowest
        if (val > points[points.length - 1].val) return points[points.length - 1].p + 1; // Above highest

        for (let i = 0; i < points.length - 1; i++) {
            const lower = points[i];
            const upper = points[i+1];
            
            if (val >= lower.val && val <= upper.val) {
                // Linear interpolation: P = P_low + ( (Val - Val_low) / (Val_high - Val_low) ) * (P_high - P_low)
                const fraction = (val - lower.val) / (upper.val - lower.val);
                return lower.p + fraction * (upper.p - lower.p);
            }
        }
        return null;
    };

    // --- Logic based on specific "Interpretation of Curves" table provided ---
    const getClinicalInterpretation = (
        metricType: 'height' | 'weight' | 'bmi' | 'head', 
        percentile: number,
        standard: 'WHO' | 'CDC'
    ) => {
        // Interpretation Logic derived from User's Table
        // Z > 3 (P > 99)
        // Z > 2 (P > 97)
        // Z > 1 (P > 85)
        // Z 0 (P 50) - Normal
        // Z < -1 (P < 15)
        // Z < -2 (P < 3) - User table says < -2 is Stunted. P3 is ~-1.88 SD. We use P3 as cutoff.
        // Z < -3 (P < 1)

        let interpretation = '';
        let color = '';
        let recommendation = '';

        // --- SEVERE LOW (< 1st Percentile / < -3 SD) ---
        if (percentile < 1) {
            color = '#ef4444'; // Red
            recommendation = "IBW for age (zero z score or 50th percentile)";
            if (metricType === 'height') interpretation = "Severely Stunted";
            else if (metricType === 'weight') interpretation = "Severely Underweight";
            else if (metricType === 'bmi') interpretation = "Severely Wasted";
            else interpretation = "Very Low";
        }
        // --- LOW (< 3rd Percentile / < -2 SD) ---
        else if (percentile < 3) {
            color = '#f97316'; // Orange
            recommendation = "IBW for age (zero z score or 50th percentile)";
            if (metricType === 'height') interpretation = "Stunted";
            else if (metricType === 'weight') interpretation = "Underweight";
            else if (metricType === 'bmi') interpretation = "Wasted";
            else interpretation = "Low";
        }
        // --- NORMAL / MILD LOW (3rd to 85th) ---
        // Table says Z < -1 is Normal. Z 0 is Normal. Z > 1 is Risk.
        else if (percentile <= 85) {
            color = '#22c55e'; // Green
            recommendation = "WHO or DRI equation";
            if (metricType === 'height') interpretation = "Normal";
            else if (metricType === 'weight') interpretation = "Normal (Use BMI)";
            else if (metricType === 'bmi') interpretation = "Normal";
            else interpretation = "Normal";
        }
        // --- RISK OF OVERWEIGHT / HIGH (85th to 97th) ---
        // Table says Z > 1 (85th) is Risk of Overweight for BMI. Normal for Ht.
        else if (percentile <= 97) {
            color = '#eab308'; // Yellow/Orange
            if (metricType === 'height') {
                interpretation = "Normal";
                recommendation = "WHO or DRI equation";
            } else if (metricType === 'weight') {
                interpretation = "Use BMI (High Wt)";
                recommendation = "Use BMI";
            } else if (metricType === 'bmi') {
                interpretation = "Risk of Overweight";
                recommendation = "WHO or DRI equation"; // Risk doesn't imply restriction yet usually
            } else {
                interpretation = "High Normal";
                recommendation = "Monitor";
            }
        }
        // --- OVERWEIGHT (97th to 99th) ---
        // Table says Z > 2 (97th) is Overweight for BMI.
        else if (percentile <= 99) {
            color = '#f97316'; // Orange
            if (metricType === 'height') {
                interpretation = "Normal"; // Height usually normal even if high
                recommendation = "WHO or DRI equation";
            } else if (metricType === 'weight') {
                interpretation = "Use BMI (High)";
                recommendation = "Use BMI";
            } else if (metricType === 'bmi') {
                interpretation = "Overweight";
                recommendation = "Equation for overweight and obese children";
            } else {
                interpretation = "High";
                recommendation = "Monitor";
            }
        }
        // --- OBESE / ABNORMAL (> 99th) ---
        // Table says Z > 3 (99th) is Obese for BMI. "May be abnormal" for Ht/Wt.
        else {
            color = '#ef4444'; // Red
            if (metricType === 'height') {
                interpretation = "May be abnormal";
                recommendation = "Check endocrine/genetic causes";
            } else if (metricType === 'weight') {
                interpretation = "May be abnormal (Use BMI)";
                recommendation = "Use BMI";
            } else if (metricType === 'bmi') {
                interpretation = "Obese";
                recommendation = "Equation for overweight and obese children";
            } else {
                interpretation = "Very High";
                recommendation = "Referral";
            }
        }

        // CDC Override for BMI (85-95 Overweight, >95 Obese)
        if (standard === 'CDC' && metricType === 'bmi') {
            if (percentile >= 95) {
                interpretation = "Obese";
                color = '#ef4444';
                recommendation = "Equation for overweight and obese children";
            } else if (percentile >= 85) {
                interpretation = "Overweight";
                color = '#f97316';
                recommendation = "Equation for overweight and obese children";
            }
        }

        return { interpretation, color, recommendation };
    };

    // --- Calculation Helper ---
    const calculateInterpretation = (dataset: GrowthDataset, val: number): AssessmentResult => {
        const dataPoints = gender === 'male' ? dataset.male : dataset.female;
        
        // Determine X Axis Value based on Dataset Config
        let currentX = 0;
        if (dataset.xLabel.includes('Length') || dataset.xLabel.includes('Stature')) {
            currentX = Number(height); // Use Height/Length as X
        } else if (dataset.xLabel.includes('Months')) {
            currentX = totalMonths; // Use Age in Months
        } else {
            currentX = ageDecimal; // Use Age in Years
        }
        
        // Find reference point (closest X match)
        const ref = dataPoints.reduce((prev, curr) => 
            Math.abs(curr.age - currentX) < Math.abs(prev.age - currentX) ? curr : prev
        );

        // Safety: If ref is too far (e.g. height is out of range for wt/len chart), skip
        if (Math.abs(ref.age - currentX) > 5 && (dataset.xLabel.includes('Length') || dataset.xLabel.includes('Stature'))) {
             return { 
                 datasetId: dataset.id,
                 label: dataset.label,
                 value: val,
                 rangeLabel: 'Out of Range',
                 exactPercentile: null,
                 zScore: null,
                 color: '#9ca3af', 
                 interpretation: 'Measurements outside chart range',
                 equationRecommendation: '-'
             };
        }

        let pText = '';
        let biv = false;
        
        // BIV Flagging Logic
        const range = ref.p97 - ref.p3;
        const extremeLow = ref.p3 - (range * 0.6); 
        const extremeHigh = ref.p97 + (range * 0.6); 

        if (val < extremeLow || val > extremeHigh) {
            biv = true;
        }

        // Calculate Exact Percentile & Z-Score
        const exactP = interpolatePercentile(val, ref);
        const zScore = exactP ? percentileToZScore(exactP) : null;

        // Basic Range Label
        if (val < ref.p3) pText = '< 3rd'; 
        else if (ref.p5 && val < ref.p5) pText = '3rd - 5th';
        else if (ref.p15 && val < ref.p15) pText = '5th - 15th';
        else if (ref.p25 && val < ref.p25) pText = '15th - 25th';
        else if (val < ref.p50) pText = '25th - 50th';
        else if (ref.p75 && val < ref.p75) pText = '50th - 75th';
        else if (ref.p85 && val < ref.p85) pText = '75th - 85th';
        else if (ref.p90 && val < ref.p90) pText = '85th - 90th';
        else if (ref.p95 && val < ref.p95) pText = '90th - 95th';
        else if (val < ref.p97) pText = '95th - 97th';
        else pText = '> 97th';

        // Determine Metric Type for Clinical Logic
        let metricType: 'height' | 'weight' | 'bmi' | 'head' = 'weight';
        if (dataset.yLabel.includes('Length') || dataset.yLabel.includes('Height') || dataset.yLabel.includes('Stature')) metricType = 'height';
        else if (dataset.yLabel.includes('BMI')) metricType = 'bmi';
        else if (dataset.yLabel.includes('Head')) metricType = 'head';

        // Get Clinical Logic based on Percentile/Z-Score
        const pForLogic = exactP !== null ? exactP : (val > ref.p97 ? 99 : val < ref.p3 ? 1 : 50);
        
        const { interpretation, color, recommendation } = getClinicalInterpretation(metricType, pForLogic, standard);

        // Additional Recommendations
        let detailedRecs: AssessmentResult['recommendations'] = undefined;
        
        if (metricType === 'bmi' && exactP) {
            // Pediatric Weight Management Instructions (New Feature)
            const managementAdvice = getPediatricWeightManagementAdvice(ageYears, exactP);

            if (exactP >= 85 && exactP < 95) {
                detailedRecs = {
                    physical: "Blood pressure, full exam",
                    labs: "Fasting lipid profile. Conditional testing for abnormalities in blood glucose or liver function.",
                    management: managementAdvice
                };
            } else if (exactP >= 95) {
                detailedRecs = {
                    physical: "Blood pressure, full exam",
                    labs: "Fasting lipid profile, fasting glucose level & post prandial (every 2 years), ALT and AST levels (every 2 years).",
                    management: managementAdvice
                };
            } else if (managementAdvice) {
                // For cases like >= 99th or if just management advice is relevant
                detailedRecs = {
                    management: managementAdvice
                };
            }
        }

        return { 
            datasetId: dataset.id,
            label: dataset.label,
            value: val,
            rangeLabel: pText,
            exactPercentile: exactP,
            zScore,
            color, 
            interpretation,
            equationRecommendation: recommendation,
            biv,
            recommendations: detailedRecs
        };
    };

    // --- Chart Logic ---

    // Determine relevant datasets based on Age & Standard
    const { visibleCharts, results } = useMemo(() => {
        const charts: { dataset: GrowthDataset, userVal: number }[] = [];
        const res: AssessmentResult[] = [];
        const datasets = Object.values(growthDatasets).filter(d => d.type === standard);

        datasets.forEach(d => {
            let include = false;
            let val = 0;

            if (d.ageRange === '0-24m') {
                 if (totalMonths <= 24) include = true;
            } else if (d.ageRange === '0-36m') {
                if (totalMonths <= 36) include = true;
            } else if (d.ageRange === '2-20y' || d.ageRange === '5-19y') {
                if (ageYears >= 2) {
                    // Specific check for WHO 5-19
                    if (d.ageRange === '5-19y' && ageYears < 5) include = false;
                    else include = true;
                }
            }

            if (include) {
                // Map value to Y axis
                if (d.yLabel.includes('Weight') && !d.yLabel.includes('Length') && !d.yLabel.includes('Stature')) val = Number(weight); // Wt for Age
                else if (d.yLabel.includes('Length') || d.yLabel.includes('Stature') || d.yLabel.includes('Height')) val = Number(height);
                else if (d.yLabel.includes('Head')) val = Number(headCirc);
                else if (d.yLabel.includes('BMI')) val = Number(bmi);
                else if (d.yLabel.includes('Weight') && (d.xLabel.includes('Length') || d.xLabel.includes('Stature'))) val = Number(weight); // Wt for Len/Stat

                charts.push({ dataset: d, userVal: val });
                
                if (val > 0) {
                    // Check if we have X value for W/L or W/S
                    const hasX = (d.xLabel.includes('Length') || d.xLabel.includes('Stature')) ? (Number(height) > 0) : true;
                    
                    if (hasX) {
                        const analysis = calculateInterpretation(d, val);
                        res.push(analysis);
                    }
                }
            }
        });

        // Sort order: Weight, Length/Height, BMI, Head, Weight-for-Length
        const order = ['weight-for-age', 'length-for-age', 'height-for-age', 'bmi', 'head', 'weight-for-length', 'weight-for-stature'];
        charts.sort((a, b) => {
            const aLabel = a.dataset.label.toLowerCase();
            const bLabel = b.dataset.label.toLowerCase();
            const aIdx = order.findIndex(k => aLabel.includes(k));
            const bIdx = order.findIndex(k => bLabel.includes(k));
            return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx);
        });

        return { visibleCharts: charts, results: res };
    }, [standard, totalMonths, ageYears, weight, height, headCirc, bmi, gender]);

    const handlePrint = () => {
        window.print();
    };

    const handleSaveToNotes = () => {
        if (!onSave) return;
        
        let note = `[Growth Chart Assessment - ${new Date().toLocaleDateString('en-GB')}]\n`;
        note += `Standard: ${standard} | Age: ${ageYears}y ${ageMonths}m | Gender: ${gender}\n`;
        note += `Measurements:\n`;
        if (weight) note += `- Weight: ${weight} kg\n`;
        if (height) note += `- Height: ${height} cm\n`;
        if (bmi) note += `- BMI: ${bmi} kg/m²\n`;
        if (headCirc) note += `- Head Circ: ${headCirc} cm\n`;
        if (standard === 'WHO' && totalMonths < 24) {
            if (armCirc) note += `- Arm Circ: ${armCirc} cm\n`;
            if (tsf) note += `- TSF: ${tsf} mm\n`;
            if (ssf) note += `- SSF: ${ssf} mm\n`;
        }
        
        if (results.length > 0) {
            note += `\nInterpretations:\n`;
            results.forEach(r => {
                const pVal = r.exactPercentile ? r.exactPercentile.toFixed(1) + 'th' : r.rangeLabel;
                const zVal = r.zScore !== null ? `(Z: ${r.zScore > 0 ? '+' : ''}${r.zScore} SD)` : '';
                note += `- ${r.label}: ${r.value} → ${pVal} ${zVal} | ${r.interpretation}\n`;
                if (r.equationRecommendation) note += `  [Eq]: ${r.equationRecommendation}\n`;
                
                if (r.recommendations) {
                    if (r.recommendations.physical) note += `  [Rec] Physical: ${r.recommendations.physical}\n`;
                    if (r.recommendations.labs) note += `  [Rec] Labs: ${r.recommendations.labs}\n`;
                    if (r.recommendations.management) note += `  [PLAN] Weight Mgmt: ${r.recommendations.management}\n`;
                }

                if (r.biv) {
                    note += `  ⚠️ FLAG: BIV (Biologically Implausible Value). Verify.\n`;
                }
            });
        }
        
        onSave(note);
    };

    // --- Single Chart Component ---
    const GrowthChartSVG = ({ dataset, userVal }: { dataset: GrowthDataset, userVal: number }) => {
        const dataPoints = gender === 'male' ? dataset.male : dataset.female;
        // Animation Ref
        const [isLoaded, setIsLoaded] = useState(false);
        useEffect(() => {
            setTimeout(() => setIsLoaded(true), 100);
        }, []);

        if (!dataPoints || dataPoints.length === 0) return <div className="text-xs text-gray-400 p-4">No Data Available</div>;

        // Determine X Axis
        let currentX = 0;
        if (dataset.xLabel.includes('Length') || dataset.xLabel.includes('Stature')) {
            currentX = Number(height);
        } else if (dataset.xLabel.includes('Months')) {
            currentX = totalMonths;
        } else {
            currentX = ageDecimal;
        }
        
        // SVG Dimensions
        const width = 500;
        const heightPx = 300;
        const pad = { t: 30, r: 40, b: 40, l: 50 };

        // Scales
        const xMin = dataPoints[0].age;
        const xMax = dataPoints[dataPoints.length - 1].age;
        
        // Dynamic Y Scale
        const yVals = dataPoints.flatMap(d => [d.p3, d.p97]);
        if (userVal > 0) yVals.push(userVal);
        const yMin = Math.floor(Math.min(...yVals) * 0.9);
        const yMax = Math.ceil(Math.max(...yVals) * 1.1);

        const getX = (val: number) => pad.l + ((val - xMin) / (xMax - xMin)) * (width - pad.l - pad.r);
        const getY = (val: number) => heightPx - pad.b - ((val - yMin) / (yMax - yMin)) * (heightPx - pad.b - pad.t);

        const createPath = (key: keyof GrowthPoint) => {
            return 'M ' + dataPoints.map(d => `${getX(d.age)},${getY(d[key] as number)}`).join(' L ');
        };

        const result = results.find(r => r.datasetId === dataset.id);

        return (
            <div className={`bg-white border rounded-xl p-3 shadow-sm flex flex-col h-full break-inside-avoid print:shadow-none print:border-gray-300 ${result?.biv ? 'border-red-300 ring-1 ring-red-200' : 'border-gray-200'}`}>
                {/* Chart Header */}
                <div className="flex justify-between items-start mb-2 border-b border-gray-100 pb-2 print:border-gray-200">
                    <div>
                        <h4 className="font-bold text-gray-800 text-sm">{dataset.label}</h4>
                        <p className="text-[10px] text-gray-500 font-medium">{dataset.yLabel} vs {dataset.xLabel}</p>
                    </div>
                    {result && (
                        <div className="text-right">
                            <div className="flex flex-col items-end">
                                <span className="text-lg font-bold leading-none" style={{ color: result.color }}>
                                    {result.exactPercentile ? result.exactPercentile.toFixed(1) + 'th' : result.rangeLabel}
                                </span>
                                {result.zScore !== null && (
                                    <span className="text-xs font-mono font-bold text-gray-700 bg-gray-100 px-1 rounded my-0.5">
                                        Z: {result.zScore > 0 ? '+' : ''}{result.zScore} SD
                                    </span>
                                )}
                                <span className="text-[10px] text-gray-500 font-bold">{result.interpretation}</span>
                            </div>
                            {result.biv && <span className="block text-[9px] text-red-600 font-bold bg-red-50 px-1 rounded mt-1">⚠️ BIV</span>}
                        </div>
                    )}
                </div>
                
                <div className="flex-grow relative w-full h-full">
                    <svg viewBox={`0 0 ${width} ${heightPx}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                        {/* Grid Y */}
                        {[0, 0.2, 0.4, 0.6, 0.8, 1].map(pct => {
                            const val = yMin + pct * (yMax - yMin);
                            const y = getY(val);
                            return (
                                <g key={pct}>
                                    <line x1={pad.l} y1={y} x2={width - pad.r} y2={y} stroke="#f0f0f0" strokeWidth="1" />
                                    <text x={pad.l - 8} y={y + 3} textAnchor="end" fontSize="10" fill="#9ca3af" fontWeight="500">{val.toFixed(0)}</text>
                                </g>
                            );
                        })}
                        {/* Grid X */}
                        {[0, 0.2, 0.4, 0.6, 0.8, 1].map(pct => {
                            const val = xMin + pct * (xMax - xMin);
                            const x = getX(val);
                            return (
                                <g key={pct}>
                                    <line x1={x} y1={pad.t} x2={x} y2={heightPx - pad.b} stroke="#f0f0f0" strokeWidth="1" />
                                    <text x={x} y={heightPx - pad.b + 12} textAnchor="middle" fontSize="10" fill="#9ca3af" fontWeight="500">{val.toFixed(0)}</text>
                                </g>
                            );
                        })}

                        {/* Percentile Lines */}
                        {/* 97th & 3rd - RED */}
                        <path d={createPath('p97')} fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={isLoaded ? 'animate-draw' : 'opacity-0'} />
                        <path d={createPath('p3')} fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={isLoaded ? 'animate-draw' : 'opacity-0'} />
                        <text x={width - pad.r + 5} y={getY(dataPoints[dataPoints.length-1].p97 as number)} fontSize="9" fill="#ef4444" alignmentBaseline="middle">97</text>
                        <text x={width - pad.r + 5} y={getY(dataPoints[dataPoints.length-1].p3 as number)} fontSize="9" fill="#ef4444" alignmentBaseline="middle">3</text>

                        {/* 85th & 15th - ORANGE */}
                        {dataset.male[0].p85 && <path d={createPath('p85')} fill="none" stroke="#f97316" strokeWidth="1" strokeDasharray="4,4" className={isLoaded ? 'animate-draw' : 'opacity-0'} />}
                        {dataset.male[0].p15 && <path d={createPath('p15')} fill="none" stroke="#f97316" strokeWidth="1" strokeDasharray="4,4" className={isLoaded ? 'animate-draw' : 'opacity-0'} />}
                        
                        {/* 50th - GREEN (Bold) */}
                        <path d={createPath('p50')} fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isLoaded ? 'animate-draw' : 'opacity-0'} />
                        <text x={width - pad.r + 5} y={getY(dataPoints[dataPoints.length-1].p50 as number)} fontSize="10" fill="#16a34a" fontWeight="bold" alignmentBaseline="middle">50</text>

                        {/* User Point */}
                        {userVal > 0 && currentX >= xMin && currentX <= xMax && (
                            <g>
                                {/* Dotted Guide Lines */}
                                <line x1={pad.l} y1={getY(userVal)} x2={getX(currentX)} y2={getY(userVal)} stroke="#2563eb" strokeWidth="1" strokeDasharray="3,3" opacity="0.6" />
                                <line x1={getX(currentX)} y1={getY(userVal)} x2={getX(currentX)} y2={heightPx - pad.b} stroke="#2563eb" strokeWidth="1" strokeDasharray="3,3" opacity="0.6" />
                                {/* Point */}
                                <circle cx={getX(currentX)} cy={getY(userVal)} r="6" fill="#2563eb" fillOpacity="0.2" />
                                <circle cx={getX(currentX)} cy={getY(userVal)} r="3" fill="#2563eb" stroke="white" strokeWidth="1" />
                            </g>
                        )}
                    </svg>
                </div>
                <style>{`
                    .animate-draw {
                        animation: dash 1.5s ease-out forwards;
                    }
                    @keyframes dash {
                        from { stroke-dasharray: 1000; stroke-dashoffset: 1000; opacity: 0.5; }
                        to { stroke-dasharray: 1000; stroke-dashoffset: 0; opacity: 1; }
                    }
                `}</style>
            </div>
        );
    };

    return (
        <div className="bg-gray-50 p-6 rounded-xl shadow-lg border border-gray-100 max-w-6xl mx-auto animate-fade-in relative">
            
            {/* Header / No Print Controls */}
            <div className="flex justify-between items-center mb-6 no-print">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <span>📈</span> {t.tools.growthCharts.title}
                    </h2>
                    <p className="text-sm text-gray-500">
                        Monitoring growth patterns ({standard})
                    </p>
                </div>
                <div className="flex gap-2">
                    <div className="flex bg-white rounded-lg p-1 border border-gray-200 shadow-sm">
                        <button 
                            onClick={() => setStandard('WHO')}
                            className={`px-4 py-1.5 rounded-md text-sm font-bold transition ${standard === 'WHO' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            WHO
                        </button>
                        <button 
                            onClick={() => setStandard('CDC')}
                            className={`px-4 py-1.5 rounded-md text-sm font-bold transition ${standard === 'CDC' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            CDC
                        </button>
                    </div>
                    {onSave && (
                        <button onClick={handleSaveToNotes} className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg font-bold text-sm hover:bg-[var(--color-primary-hover)] transition shadow-sm">
                            Save to Profile
                        </button>
                    )}
                    <button onClick={handlePrint} className="px-4 py-2 bg-gray-800 text-white rounded-lg font-bold text-sm hover:bg-gray-900 transition shadow-sm">
                        🖨️ Report
                    </button>
                    {onClose && (
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-white transition">✕</button>
                    )}
                </div>
            </div>

            {/* --- REPORT HEADER (Visible only in Print) --- */}
            <div className="hidden print:block mb-6 text-center border-b-2 border-black pb-2">
                <h1 className="text-2xl font-bold uppercase">{clinicName}</h1>
                <p className="text-md">Growth Assessment Report</p>
                <div className="flex justify-center gap-6 text-xs mt-1">
                    <span>Patient: <strong>{patientName || 'N/A'}</strong></span>
                    <span>Age: <strong>{ageYears}y {ageMonths}m</strong></span>
                    <span>Date: <strong>{new Date().toLocaleDateString('en-GB')}</strong></span>
                </div>
            </div>

            {/* Inputs Grid (Hidden in Print) */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 no-print">
                {/* Protocol Reminder */}
                <div className="mb-4 bg-yellow-50 text-yellow-900 text-xs p-3 rounded-lg border border-yellow-200 shadow-sm space-y-2">
                    <strong className="block text-sm">⚠️ Clinical Protocol (WHO 0-5y Logic applied)</strong>
                    <ul className="list-disc list-inside space-y-1 ml-1">
                        <li><strong>&lt; 2 Years:</strong> Use <span className="font-bold text-blue-700">WHO</span> (0-24m).</li>
                        <li><strong>2 - 20 Years:</strong> Use <span className="font-bold text-blue-700">CDC</span> or WHO.</li>
                        <li><strong>Z-Score Cutoffs (Approx):</strong>
                            <ul className="list-inside ml-4 text-[10px] text-yellow-800 mt-1 grid grid-cols-3 gap-x-4">
                                <li>&gt; 3 SD: Obese</li>
                                <li>&gt; 2 SD: Overweight</li>
                                <li>&gt; 1 SD: Risk of Overweight</li>
                                <li>-2 to +1 SD: Normal</li>
                                <li>&lt; -2 SD: Wasted/Stunted</li>
                                <li>&lt; -3 SD: Severely Wasted</li>
                            </ul>
                        </li>
                    </ul>
                </div>

                <div className="mb-4 pb-2 border-b border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input type="text" placeholder="Clinic Name" value={clinicName} onChange={e => setClinicName(e.target.value)} className="text-xs border-b border-gray-300 focus:border-blue-500 outline-none p-1" />
                    <input type="text" placeholder="Nutritionist Name" value={nutritionistName} onChange={e => setNutritionistName(e.target.value)} className="text-xs border-b border-gray-300 focus:border-blue-500 outline-none p-1" />
                    <input type="text" placeholder="Patient Name (Optional)" value={patientName} onChange={e => setPatientName(e.target.value)} className="text-xs border-b border-gray-300 focus:border-blue-500 outline-none p-1" />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 items-end">
                    {/* Row 1: Personal */}
                    <div className="col-span-2 md:col-span-1">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Gender</label>
                        <div className="flex rounded-lg overflow-hidden border border-gray-300 shadow-sm">
                            <button onClick={() => setGender('male')} className={`flex-1 py-1.5 text-sm font-bold transition ${gender === 'male' ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>Male</button>
                            <button onClick={() => setGender('female')} className={`flex-1 py-1.5 text-sm font-bold transition ${gender === 'female' ? 'bg-pink-600 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>Female</button>
                        </div>
                    </div>
                    
                    <div className="col-span-2 md:col-span-1">
                        <div className="flex justify-between mb-1 items-center">
                            <label className="block text-xs font-bold text-gray-500 uppercase">Age Mode</label>
                            {/* Professional Toggle for Manual/Auto */}
                            <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-200">
                                <button
                                    onClick={() => setAgeMode('auto')}
                                    className={`px-3 py-0.5 rounded-md text-[10px] font-bold transition ${ageMode === 'auto' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Auto
                                </button>
                                <button
                                    onClick={() => setAgeMode('manual')}
                                    className={`px-3 py-0.5 rounded-md text-[10px] font-bold transition ${ageMode === 'manual' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Manual
                                </button>
                            </div>
                        </div>
                        {ageMode === 'auto' ? (
                            <>
                                <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                                {ageYears !== undefined && ageMonths !== undefined && (
                                    <div className="mt-2 text-center">
                                        <span className="inline-block bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full border border-blue-200">
                                            {ageYears} Years, {ageMonths} Months
                                        </span>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="flex gap-2 items-center">
                                <div className="relative w-1/2">
                                    <input type="number" placeholder="0" value={ageYears} onChange={(e) => setAgeYears(Number(e.target.value))} className="w-full p-2 border rounded-lg text-sm text-center font-bold focus:ring-2 focus:ring-blue-500 outline-none" min="0" />
                                    <span className="absolute right-2 top-2 text-[10px] text-gray-400 font-bold uppercase">Yrs</span>
                                </div>
                                <div className="relative w-1/2">
                                    <input type="number" placeholder="0" value={ageMonths} onChange={(e) => setAgeMonths(Number(e.target.value))} className="w-full p-2 border rounded-lg text-sm text-center font-bold focus:ring-2 focus:ring-blue-500 outline-none" min="0" max="11" />
                                    <span className="absolute right-2 top-2 text-[10px] text-gray-400 font-bold uppercase">Mos</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Row 2: Measurements */}
                    <div className="col-span-1">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Weight (kg)</label>
                        <input type="number" value={weight} onChange={(e) => setWeight(e.target.value === '' ? '' : Number(e.target.value))} className="w-full p-2 border rounded-lg text-sm font-bold text-blue-700 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0" />
                    </div>
                    <div className="col-span-1">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{totalMonths < 24 ? 'Length' : 'Height'} (cm)</label>
                        <input type="number" value={height} onChange={(e) => setHeight(e.target.value === '' ? '' : Number(e.target.value))} className="w-full p-2 border rounded-lg text-sm font-bold text-blue-700 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0" />
                    </div>
                    <div className="col-span-1">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Head Circ (cm)</label>
                        <input type="number" value={headCirc} onChange={(e) => setHeadCirc(e.target.value === '' ? '' : Number(e.target.value))} className="w-full p-2 border rounded-lg text-sm font-bold text-purple-700 focus:ring-2 focus:ring-purple-500 outline-none" placeholder="0" />
                    </div>
                    
                    {/* Calculated */}
                    <div className="col-span-1 md:col-span-2 lg:col-span-1">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">BMI (Auto)</label>
                        <div className="w-full p-2 border rounded-lg text-sm bg-gray-100 text-center font-mono font-bold text-gray-700">
                            {bmi || '-'}
                        </div>
                    </div>
                </div>

                {/* Additional Inputs for WHO Infants (<2y) */}
                {standard === 'WHO' && totalMonths <= 24 && (
                    <div className="mt-4 pt-3 border-t border-dashed border-gray-200">
                        <div className="flex justify-between items-center mb-2">
                            <p className="text-xs font-bold text-green-700 uppercase">Detailed Infant Metrics (Recording Only)</p>
                            <span className="text-[10px] bg-green-50 text-green-600 px-2 py-0.5 rounded border border-green-100">0-2 Years</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Arm Circ (cm)</label>
                                <input type="number" value={armCirc} onChange={(e) => setArmCirc(e.target.value === '' ? '' : Number(e.target.value))} className="w-full p-1.5 border rounded text-sm focus:ring-1 focus:ring-green-500 outline-none" placeholder="MAC" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">TSF (mm)</label>
                                <input type="number" value={tsf} onChange={(e) => setTsf(e.target.value === '' ? '' : Number(e.target.value))} className="w-full p-1.5 border rounded text-sm focus:ring-1 focus:ring-green-500 outline-none" placeholder="Triceps" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">SSF (mm)</label>
                                <input type="number" value={ssf} onChange={(e) => setSsf(e.target.value === '' ? '' : Number(e.target.value))} className="w-full p-1.5 border rounded text-sm focus:ring-1 focus:ring-green-500 outline-none" placeholder="Subscapular" />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* --- SUMMARY TABLE --- */}
            {results.length > 0 && (
                <div className="mb-8">
                    <h3 className="font-bold text-gray-700 mb-2 uppercase text-sm border-b border-gray-200 pb-1">Assessment Summary</h3>
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-100 text-gray-700 text-xs uppercase">
                                <tr>
                                    <th className="p-3 text-left">Parameter</th>
                                    <th className="p-3 text-center">Value</th>
                                    <th className="p-3 text-center">Percentile / Z-Score</th>
                                    <th className="p-3 text-left">Clinical Interpretation</th>
                                    <th className="p-3 text-left">Equation Recommendation</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {results.map((res) => (
                                    <tr key={res.datasetId} className={res.biv ? "bg-red-50" : ""}>
                                        <td className="p-3 font-medium">{res.label}</td>
                                        <td className="p-3 text-center font-bold">{res.value}</td>
                                        <td className="p-3 text-center" style={{ color: res.color, fontWeight: 'bold' }}>
                                            <div>{res.exactPercentile ? res.exactPercentile.toFixed(1) + 'th' : res.rangeLabel}</div>
                                            {res.zScore !== null && (
                                                <div className="text-[10px] font-mono text-gray-500 font-normal">
                                                    Z: {res.zScore > 0 ? '+' : ''}{res.zScore} SD
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-3 font-bold" style={{ color: res.color }}>
                                            {res.interpretation}
                                            {res.biv && (
                                                <span className="block text-[10px] text-red-600 font-bold mt-1 bg-red-100 px-2 py-0.5 rounded w-fit">
                                                    ⚠️ BIV
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-3 text-gray-600 italic text-xs">
                                            {res.equationRecommendation}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* --- RECOMMENDATIONS SECTION --- */}
            {results.some(r => r.recommendations) && (
                <div className="mb-8 animate-fade-in break-inside-avoid">
                    <h3 className="font-bold text-blue-800 mb-2 uppercase text-sm border-b border-blue-200 pb-1 flex items-center gap-2">
                        <span>📋</span> Clinical Actions (High Risk)
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                        {results.filter(r => r.recommendations).map(res => (
                            <div key={res.datasetId + '-rec'} className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-sm">
                                <div className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                                    Based on {res.label} ({res.interpretation})
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                                    {res.recommendations?.management && (
                                        <div className="bg-orange-50 p-3 rounded border border-orange-200 col-span-1 md:col-span-2 lg:col-span-3">
                                            <div className="font-bold text-orange-800 mb-1 text-xs uppercase flex items-center gap-2">
                                                <span>⚖️</span> Weight Management Goal
                                            </div>
                                            <div className="text-orange-900 font-medium leading-relaxed">{res.recommendations.management}</div>
                                        </div>
                                    )}
                                    {res.recommendations?.physical && (
                                        <div className="bg-white p-3 rounded border border-blue-100">
                                            <div className="font-bold text-gray-700 mb-1 text-xs uppercase">🩺 Physical Examination</div>
                                            <div className="text-gray-600">{res.recommendations.physical}</div>
                                        </div>
                                    )}
                                    {res.recommendations?.labs && (
                                        <div className="bg-white p-3 rounded border border-blue-100">
                                            <div className="font-bold text-gray-700 mb-1 text-xs uppercase">🧪 Laboratory Tests</div>
                                            <div className="text-gray-600">{res.recommendations.labs}</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Charts Grid */}
            <h3 className="font-bold text-gray-700 mb-4 uppercase text-sm border-b border-gray-200 pb-1 print:mb-2">Growth Charts</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 print:gap-4 print:block">
                {visibleCharts.length > 0 ? (
                    visibleCharts.map((chart) => (
                        <div key={chart.dataset.id} className="h-96 print:h-64 print:mb-4 print:break-inside-avoid">
                            <GrowthChartSVG dataset={chart.dataset} userVal={chart.userVal} />
                        </div>
                    ))
                ) : (
                    <div className="col-span-full text-center py-10 text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">
                        <span className="text-4xl block mb-2">📊</span>
                        No charts available for this age range ({ageYears}y {ageMonths}m) in {standard} standard.
                        {standard === 'WHO' && ageYears < 5 && totalMonths > 24 && <p className="text-xs mt-2 text-red-400">(WHO data gap between 24m-5y? Please check CDC for this range or update source)</p>}
                    </div>
                )}
            </div>
            
            <div className="text-center text-xs text-gray-400 mt-8 hidden print:block border-t pt-2">
                Report generated by Diet-Nova System
            </div>
        </div>
    );
};

export default GrowthCharts;
