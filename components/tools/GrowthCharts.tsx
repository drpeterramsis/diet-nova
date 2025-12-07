
import React, { useState, useMemo, useEffect } from 'react';
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
    percentile: string;
    color: string;
    interpretation: string;
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

    // --- Calculation Helper ---
    const calculateInterpretation = (dataset: GrowthDataset, val: number): { percentile: string, color: string, interpretation: string } => {
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
             return { percentile: 'Out of Range', color: '#9ca3af', interpretation: 'Measurements outside chart range' };
        }

        let pText = '';
        let pColor = '';
        let interp = '';

        if (val < ref.p3) { pText = '< 3rd'; pColor = '#ef4444'; interp = 'Low / Underweight'; }
        else if (ref.p5 && val < ref.p5) { pText = '3rd - 5th'; pColor = '#f97316'; interp = 'Risk of Low'; } // CDC specific
        else if (ref.p15 && val < ref.p15) { pText = '5th - 15th'; pColor = '#f97316'; interp = 'Risk of Low'; } // WHO uses 15
        else if (ref.p25 && val < ref.p25) { pText = '10th - 25th'; pColor = '#22c55e'; interp = 'Normal'; }
        else if (val < ref.p50) { pText = '25th - 50th'; pColor = '#22c55e'; interp = 'Normal'; }
        else if (ref.p75 && val < ref.p75) { pText = '50th - 75th'; pColor = '#22c55e'; interp = 'Normal'; }
        else if (ref.p85 && val < ref.p85) { pText = '75th - 85th'; pColor = '#22c55e'; interp = 'Normal'; }
        else if (ref.p90 && val < ref.p90) { pText = '85th - 90th'; pColor = '#f97316'; interp = 'Risk of High'; }
        else if (ref.p95 && val < ref.p95) { pText = '90th - 95th'; pColor = '#f97316'; interp = 'High Risk'; }
        else if (val < ref.p97) { pText = '95th - 97th'; pColor = '#ef4444'; interp = 'High / Overweight'; }
        else { pText = '> 97th'; pColor = '#ef4444'; interp = 'Very High / Obese'; }

        return { percentile: pText, color: pColor, interpretation: interp };
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

            if (d.ageRange === '0-36m') {
                if (totalMonths <= 36) {
                    include = true;
                    // Map value to Y axis
                    if (d.yLabel.includes('Weight')) val = Number(weight);
                    else if (d.yLabel.includes('Length')) val = Number(height);
                    else if (d.yLabel.includes('Head')) val = Number(headCirc);
                }
            } else if (d.ageRange === '2-20y' || d.ageRange === '5-19y') {
                if (ageYears >= 2) {
                    // Specific check for WHO 5-19
                    if (d.ageRange === '5-19y' && ageYears < 5) include = false;
                    else {
                        include = true;
                        if (d.yLabel.includes('Weight')) val = Number(weight);
                        else if (d.yLabel.includes('Stature') || d.yLabel.includes('Height')) val = Number(height);
                        else if (d.yLabel.includes('BMI')) val = Number(bmi);
                    }
                }
            }

            if (include) {
                charts.push({ dataset: d, userVal: val });
                if (val > 0) {
                    // Check if we have X value for W/L or W/S
                    const hasX = (d.xLabel.includes('Length') || d.xLabel.includes('Stature')) ? (Number(height) > 0) : true;
                    
                    if (hasX) {
                        const analysis = calculateInterpretation(d, val);
                        res.push({
                            datasetId: d.id,
                            label: d.label,
                            value: val,
                            percentile: analysis.percentile,
                            color: analysis.color,
                            interpretation: analysis.interpretation
                        });
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
                note += `- ${r.label}: ${r.value} (${r.percentile}) -> ${r.interpretation}\n`;
                if (r.percentile.includes('< 3rd') || r.percentile.includes('> 97th')) {
                    note += `  ⚠️ Flag: Potential Biologically Implausible Value (BIV) or Extreme Outlier. Verify measurement.\n`;
                }
            });
        }
        
        onSave(note);
    };

    // --- Single Chart Component ---
    const GrowthChartSVG = ({ dataset, userVal }: { dataset: GrowthDataset, userVal: number }) => {
        const dataPoints = gender === 'male' ? dataset.male : dataset.female;
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
        const width = 400;
        const heightPx = 250;
        const pad = { t: 20, r: 30, b: 30, l: 40 };

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
            <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm flex flex-col h-full break-inside-avoid">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h4 className="font-bold text-gray-700 text-sm">{dataset.label}</h4>
                        <p className="text-[10px] text-gray-400">{dataset.yLabel}</p>
                    </div>
                    {result && (
                        <div className="text-right">
                            <span className="block text-xs font-bold px-2 py-0.5 rounded bg-gray-50" style={{ color: result.color }}>
                                {result.percentile}
                            </span>
                            <span className="block text-[9px] text-gray-500">{result.interpretation}</span>
                        </div>
                    )}
                </div>
                
                <div className="flex-grow relative">
                    <svg viewBox={`0 0 ${width} ${heightPx}`} className="w-full h-auto">
                        {/* Grid Y */}
                        {[0, 0.25, 0.5, 0.75, 1].map(pct => {
                            const val = yMin + pct * (yMax - yMin);
                            const y = getY(val);
                            return (
                                <g key={pct}>
                                    <line x1={pad.l} y1={y} x2={width - pad.r} y2={y} stroke="#f3f4f6" />
                                    <text x={pad.l - 5} y={y + 3} textAnchor="end" fontSize="10" fill="#9ca3af">{val.toFixed(1)}</text>
                                </g>
                            );
                        })}

                        {/* Percentiles */}
                        <path d={createPath('p97')} fill="none" stroke="#ef4444" strokeWidth="1" strokeDasharray="4,4" />
                        {dataset.male[0].p95 && <path d={createPath('p95')} fill="none" stroke="#f97316" strokeWidth="1" strokeDasharray="2,2" />}
                        {dataset.male[0].p90 && <path d={createPath('p90')} fill="none" stroke="#f97316" strokeWidth="1" strokeDasharray="4,4" />}
                        {dataset.male[0].p85 && <path d={createPath('p85')} fill="none" stroke="#f97316" strokeWidth="1" strokeDasharray="4,4" />}
                        <path d={createPath('p50')} fill="none" stroke="#22c55e" strokeWidth="1.5" />
                        {dataset.male[0].p25 && <path d={createPath('p25')} fill="none" stroke="#f97316" strokeWidth="1" strokeDasharray="4,4" />}
                        {dataset.male[0].p15 && <path d={createPath('p15')} fill="none" stroke="#f97316" strokeWidth="1" strokeDasharray="4,4" />}
                        {dataset.male[0].p10 && <path d={createPath('p10')} fill="none" stroke="#f97316" strokeWidth="1" strokeDasharray="4,4" />}
                        {dataset.male[0].p5 && <path d={createPath('p5')} fill="none" stroke="#f97316" strokeWidth="1" strokeDasharray="2,2" />}
                        <path d={createPath('p3')} fill="none" stroke="#ef4444" strokeWidth="1" strokeDasharray="4,4" />

                        {/* User Point */}
                        {userVal > 0 && currentX >= xMin && currentX <= xMax && (
                            <>
                                <circle cx={getX(currentX)} cy={getY(userVal)} r="5" fill="#3b82f6" stroke="white" strokeWidth="2" />
                                <line x1={pad.l} y1={getY(userVal)} x2={width - pad.r} y2={getY(userVal)} stroke="#3b82f6" strokeWidth="1" strokeDasharray="2,2" opacity="0.5" />
                                <line x1={getX(currentX)} y1={pad.t} x2={getX(currentX)} y2={heightPx - pad.b} stroke="#3b82f6" strokeWidth="1" strokeDasharray="2,2" opacity="0.5" />
                            </>
                        )}

                        {/* Axis Label X */}
                        <text x={width/2} y={heightPx - 5} textAnchor="middle" fontSize="10" fill="#9ca3af">{dataset.xLabel}</text>
                    </svg>
                </div>
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
                    <div className="flex bg-white rounded-lg p-1 border border-gray-200">
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
                        <button onClick={handleSaveToNotes} className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg font-bold text-sm hover:bg-[var(--color-primary-hover)] transition">
                            Save to Profile
                        </button>
                    )}
                    <button onClick={handlePrint} className="px-4 py-2 bg-gray-800 text-white rounded-lg font-bold text-sm hover:bg-gray-900 transition">
                        🖨️ Report
                    </button>
                    {onClose && (
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-white transition">✕</button>
                    )}
                </div>
            </div>

            {/* --- REPORT HEADER (Visible only in Print) --- */}
            <div className="hidden print:block mb-8 text-center border-b-2 border-black pb-4">
                <h1 className="text-3xl font-bold uppercase">{clinicName}</h1>
                <p className="text-lg">Growth Assessment Report</p>
                <p className="text-sm">Nutritionist: {nutritionistName}</p>
                <p className="text-sm">Date: {new Date().toLocaleDateString('en-GB')}</p>
            </div>

            {/* Inputs Grid (Hidden in Print) */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 no-print">
                {/* Important Reminder */}
                <div className="mb-4 bg-yellow-50 text-yellow-800 text-xs p-3 rounded border border-yellow-200 font-medium">
                    <strong>Reminder:</strong> For children from birth to 2 years, use WHO growth charts. For children 2 to 20 years, use CDC growth charts.
                </div>

                <div className="mb-4 pb-2 border-b border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input type="text" placeholder="Clinic Name" value={clinicName} onChange={e => setClinicName(e.target.value)} className="text-xs border-b border-gray-300 focus:border-blue-500 outline-none p-1" />
                    <input type="text" placeholder="Nutritionist Name" value={nutritionistName} onChange={e => setNutritionistName(e.target.value)} className="text-xs border-b border-gray-300 focus:border-blue-500 outline-none p-1" />
                    <input type="text" placeholder="Patient Name (Optional)" value={patientName} onChange={e => setPatientName(e.target.value)} className="text-xs border-b border-gray-300 focus:border-blue-500 outline-none p-1" />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {/* Row 1: Personal */}
                    <div className="col-span-2 md:col-span-1">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Gender</label>
                        <div className="flex rounded overflow-hidden border border-gray-300">
                            <button onClick={() => setGender('male')} className={`flex-1 py-1.5 text-sm ${gender === 'male' ? 'bg-blue-600 text-white' : 'bg-gray-50'}`}>Male</button>
                            <button onClick={() => setGender('female')} className={`flex-1 py-1.5 text-sm ${gender === 'female' ? 'bg-pink-600 text-white' : 'bg-gray-50'}`}>Female</button>
                        </div>
                    </div>
                    
                    <div className="col-span-2 md:col-span-1">
                        <div className="flex justify-between mb-1 items-center">
                            <label className="block text-xs font-bold text-gray-500 uppercase">Age Mode</label>
                            {/* Professional Toggle for Manual/Auto */}
                            <div className="flex bg-gray-100 p-0.5 rounded text-[10px]">
                                <button
                                    onClick={() => setAgeMode('auto')}
                                    className={`px-2 py-0.5 rounded transition ${ageMode === 'auto' ? 'bg-white shadow text-blue-600 font-bold' : 'text-gray-500'}`}
                                >
                                    Auto
                                </button>
                                <button
                                    onClick={() => setAgeMode('manual')}
                                    className={`px-2 py-0.5 rounded transition ${ageMode === 'manual' ? 'bg-white shadow text-blue-600 font-bold' : 'text-gray-500'}`}
                                >
                                    Manual
                                </button>
                            </div>
                        </div>
                        {ageMode === 'auto' ? (
                            <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="w-full p-1.5 border rounded text-sm" />
                        ) : (
                            <div className="flex gap-1 items-center">
                                <div className="relative w-1/2">
                                    <input type="number" placeholder="0" value={ageYears} onChange={(e) => setAgeYears(Number(e.target.value))} className="w-full p-1.5 border rounded text-sm text-center" min="0" />
                                    <span className="absolute right-1 top-1.5 text-[10px] text-gray-400">Yrs</span>
                                </div>
                                <div className="relative w-1/2">
                                    <input type="number" placeholder="0" value={ageMonths} onChange={(e) => setAgeMonths(Number(e.target.value))} className="w-full p-1.5 border rounded text-sm text-center" min="0" max="11" />
                                    <span className="absolute right-1 top-1.5 text-[10px] text-gray-400">Mos</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Row 2: Measurements */}
                    <div className="col-span-1">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Weight (kg)</label>
                        <input type="number" value={weight} onChange={(e) => setWeight(e.target.value === '' ? '' : Number(e.target.value))} className="w-full p-1.5 border rounded text-sm font-bold text-blue-700" placeholder="0" />
                    </div>
                    <div className="col-span-1">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{totalMonths < 24 ? 'Length' : 'Height'} (cm)</label>
                        <input type="number" value={height} onChange={(e) => setHeight(e.target.value === '' ? '' : Number(e.target.value))} className="w-full p-1.5 border rounded text-sm font-bold text-blue-700" placeholder="0" />
                    </div>
                    <div className="col-span-1">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Head Circ (cm)</label>
                        <input type="number" value={headCirc} onChange={(e) => setHeadCirc(e.target.value === '' ? '' : Number(e.target.value))} className="w-full p-1.5 border rounded text-sm font-bold text-purple-700" placeholder="0" />
                    </div>
                    
                    {/* Calculated */}
                    <div className="col-span-1 md:col-span-2 lg:col-span-1">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">BMI (Auto)</label>
                        <div className="w-full p-1.5 border rounded text-sm bg-gray-100 text-center font-mono font-bold text-gray-700">
                            {bmi || '-'}
                        </div>
                    </div>
                </div>

                {/* Additional Inputs for WHO Infants (<2y) */}
                {standard === 'WHO' && totalMonths < 24 && (
                    <div className="mt-4 pt-3 border-t border-dashed border-gray-200">
                        <p className="text-xs font-bold text-green-700 uppercase mb-2">Detailed Infant Metrics (Recording Only)</p>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Arm Circ (cm)</label>
                                <input type="number" value={armCirc} onChange={(e) => setArmCirc(e.target.value === '' ? '' : Number(e.target.value))} className="w-full p-1.5 border rounded text-sm" placeholder="MAC" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">TSF (mm)</label>
                                <input type="number" value={tsf} onChange={(e) => setTsf(e.target.value === '' ? '' : Number(e.target.value))} className="w-full p-1.5 border rounded text-sm" placeholder="Triceps" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">SSF (mm)</label>
                                <input type="number" value={ssf} onChange={(e) => setSsf(e.target.value === '' ? '' : Number(e.target.value))} className="w-full p-1.5 border rounded text-sm" placeholder="Subscapular" />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* --- PATIENT DATA SUMMARY (Print Mode) --- */}
            <div className="hidden print:block mb-6 border p-4 rounded bg-gray-50">
                <table className="w-full text-sm">
                    <tbody>
                        <tr>
                            <td className="font-bold w-32">Patient Name:</td>
                            <td>{patientName || 'N/A'}</td>
                            <td className="font-bold w-32">Gender:</td>
                            <td className="capitalize">{gender}</td>
                        </tr>
                        <tr>
                            <td className="font-bold">Age:</td>
                            <td>{ageYears} Years, {ageMonths} Months</td>
                            <td className="font-bold">DOB:</td>
                            <td>{dob || 'N/A'}</td>
                        </tr>
                    </tbody>
                </table>
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
                                    <th className="p-3 text-center">Percentile</th>
                                    <th className="p-3 text-left">Interpretation</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {results.map((res) => (
                                    <tr key={res.datasetId}>
                                        <td className="p-3 font-medium">{res.label}</td>
                                        <td className="p-3 text-center font-bold">{res.value}</td>
                                        <td className="p-3 text-center" style={{ color: res.color, fontWeight: 'bold' }}>{res.percentile}</td>
                                        <td className="p-3 text-gray-600">
                                            {res.interpretation}
                                            {/* Flag for extreme outliers */}
                                            {(res.percentile.includes('< 3rd') || res.percentile.includes('> 97th')) && (
                                                <span className="block text-[10px] text-red-500 font-bold mt-1">⚠️ Possible BIV (Extreme)</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Charts Grid */}
            <h3 className="font-bold text-gray-700 mb-4 uppercase text-sm border-b border-gray-200 pb-1 print:mb-2">Growth Charts</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 print:gap-8 print:block">
                {visibleCharts.length > 0 ? (
                    visibleCharts.map((chart) => (
                        <div key={chart.dataset.id} className="h-80 print:h-96 print:mb-8 print:break-inside-avoid">
                            <GrowthChartSVG dataset={chart.dataset} userVal={chart.userVal} />
                        </div>
                    ))
                ) : (
                    <div className="col-span-full text-center py-10 text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">
                        <span className="text-4xl block mb-2">📊</span>
                        No charts available for this age range ({ageYears}y {ageMonths}m) in {standard} standard.
                        {standard === 'WHO' && ageYears < 5 && <p className="text-xs mt-2 text-red-400">(WHO data currently available for 5-19y only. Switch to CDC for infants/toddlers)</p>}
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
