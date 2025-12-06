import React, { useState, useMemo, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { growthDatasets, GrowthPoint, GrowthDataset } from '../../data/growthChartData';

interface GrowthChartsProps {
    initialData?: {
        gender: 'male' | 'female';
        age: number;
        weight?: number;
        height?: number;
        bmi?: number;
        head_circumference?: number;
    };
    onClose?: () => void;
}

const GrowthCharts: React.FC<GrowthChartsProps> = ({ initialData, onClose }) => {
    const { t } = useLanguage();
    
    // --- State ---
    const [standard, setStandard] = useState<'WHO' | 'CDC'>('WHO');
    const [gender, setGender] = useState<'male' | 'female'>(initialData?.gender || 'male');
    
    // Age Inputs
    const [dob, setDob] = useState<string>('');
    const [ageYears, setAgeYears] = useState<number>(initialData?.age || 0);
    const [ageMonths, setAgeMonths] = useState<number>(0);
    
    // Measurement Inputs
    const [weight, setWeight] = useState<number | ''>(initialData?.weight || '');
    const [height, setHeight] = useState<number | ''>(initialData?.height || '');
    const [headCirc, setHeadCirc] = useState<number | ''>(initialData?.head_circumference || '');
    
    // Auto Calc BMI
    const [bmi, setBmi] = useState<number | ''>(initialData?.bmi || '');

    // Calculated total age in months (for Infants) and years (for Children)
    const totalMonths = useMemo(() => (ageYears * 12) + ageMonths, [ageYears, ageMonths]);
    const ageDecimal = useMemo(() => ageYears + (ageMonths / 12), [ageYears, ageMonths]);

    // --- Effects ---

    // 1. Calculate Age from DOB
    useEffect(() => {
        if (dob) {
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
    }, [dob]);

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

    // --- Chart Logic ---

    // Determine relevant datasets based on Age & Standard
    const visibleCharts = useMemo(() => {
        const charts: { dataset: GrowthDataset, userVal: number }[] = [];
        const datasets = Object.values(growthDatasets).filter(d => d.type === standard);

        // Filter based on age range logic
        // 0-36m (Infant) vs 2-20y / 5-19y (Child)
        const isInfant = totalMonths < 24; // Use infant charts if < 2 years usually, CDC goes to 36m.
        // For simplicity:
        // If age < 2 years: Use 0-36m charts
        // If age >= 2 years: Use 2-20y or 5-19y charts

        datasets.forEach(d => {
            let include = false;
            let val = 0;

            if (d.ageRange === '0-36m') {
                if (totalMonths <= 36) {
                    include = true;
                    if (d.id.includes('weight')) val = Number(weight);
                    else if (d.id.includes('length')) val = Number(height);
                    else if (d.id.includes('head')) val = Number(headCirc);
                }
            } else if (d.ageRange === '2-20y' || d.ageRange === '5-19y') {
                if (ageYears >= 2) {
                    // Specific check for WHO 5-19
                    if (d.ageRange === '5-19y' && ageYears < 5) include = false;
                    else {
                        include = true;
                        if (d.id.includes('weight')) val = Number(weight);
                        else if (d.id.includes('height')) val = Number(height);
                        else if (d.id.includes('bmi')) val = Number(bmi);
                    }
                }
            }

            if (include) {
                charts.push({ dataset: d, userVal: val });
            }
        });

        // Sort order: Weight, Height, BMI, Head
        const order = ['weight', 'length', 'height', 'bmi', 'head'];
        charts.sort((a, b) => {
            const aIdx = order.findIndex(k => a.dataset.id.includes(k));
            const bIdx = order.findIndex(k => b.dataset.id.includes(k));
            return aIdx - bIdx;
        });

        return charts;
    }, [standard, totalMonths, ageYears, weight, height, headCirc, bmi]);

    // --- Single Chart Component ---
    const GrowthChartSVG = ({ dataset, userVal }: { dataset: GrowthDataset, userVal: number }) => {
        const dataPoints = gender === 'male' ? dataset.male : dataset.female;
        if (!dataPoints || dataPoints.length === 0) return <div className="text-xs text-gray-400 p-4">No Data Available</div>;

        // Interpret Result
        let interpretation = null;
        const currentX = dataset.xLabel.includes('Months') ? totalMonths : ageDecimal;
        
        // Find reference point (closest age)
        const ref = dataPoints.reduce((prev, curr) => 
            Math.abs(curr.age - currentX) < Math.abs(prev.age - currentX) ? curr : prev
        );

        if (userVal > 0) {
            let pText = '';
            let pColor = '';
            if (userVal < ref.p3) { pText = '< 3rd'; pColor = '#ef4444'; }
            else if (userVal < ref.p15) { pText = '3rd - 15th'; pColor = '#f97316'; }
            else if (userVal < ref.p50) { pText = '15th - 50th'; pColor = '#22c55e'; }
            else if (userVal < ref.p85) { pText = '50th - 85th'; pColor = '#22c55e'; }
            else if (userVal < ref.p97) { pText = '85th - 97th'; pColor = '#f97316'; }
            else { pText = '> 97th'; pColor = '#ef4444'; }
            interpretation = { text: pText, color: pColor };
        }

        // SVG Dimensions
        const width = 400;
        const height = 250;
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
        const getY = (val: number) => height - pad.b - ((val - yMin) / (yMax - yMin)) * (height - pad.b - pad.t);

        const createPath = (key: keyof GrowthPoint) => {
            return 'M ' + dataPoints.map(d => `${getX(d.age)},${getY(d[key] as number)}`).join(' L ');
        };

        return (
            <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm flex flex-col h-full">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h4 className="font-bold text-gray-700 text-sm">{dataset.label}</h4>
                        <p className="text-[10px] text-gray-400">{dataset.yLabel}</p>
                    </div>
                    {interpretation && (
                        <span className="text-xs font-bold px-2 py-1 rounded bg-gray-50" style={{ color: interpretation.color }}>
                            {interpretation.text}
                        </span>
                    )}
                </div>
                
                <div className="flex-grow relative">
                    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
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
                        <path d={createPath('p85')} fill="none" stroke="#f97316" strokeWidth="1" strokeDasharray="4,4" />
                        <path d={createPath('p50')} fill="none" stroke="#22c55e" strokeWidth="1.5" />
                        <path d={createPath('p15')} fill="none" stroke="#f97316" strokeWidth="1" strokeDasharray="4,4" />
                        <path d={createPath('p3')} fill="none" stroke="#ef4444" strokeWidth="1" strokeDasharray="4,4" />

                        {/* User Point */}
                        {userVal > 0 && (
                            <>
                                <circle cx={getX(currentX)} cy={getY(userVal)} r="5" fill="#3b82f6" stroke="white" strokeWidth="2" />
                                <line x1={pad.l} y1={getY(userVal)} x2={width - pad.r} y2={getY(userVal)} stroke="#3b82f6" strokeWidth="1" strokeDasharray="2,2" opacity="0.5" />
                                <line x1={getX(currentX)} y1={pad.t} x2={getX(currentX)} y2={height - pad.b} stroke="#3b82f6" strokeWidth="1" strokeDasharray="2,2" opacity="0.5" />
                            </>
                        )}

                        {/* Axis Label X */}
                        <text x={width/2} y={height - 5} textAnchor="middle" fontSize="10" fill="#9ca3af">{dataset.xLabel}</text>
                    </svg>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-gray-50 p-6 rounded-xl shadow-lg border border-gray-100 max-w-6xl mx-auto animate-fade-in relative">
            <div className="flex justify-between items-center mb-6">
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
                    {onClose && (
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-white transition">✕</button>
                    )}
                </div>
            </div>

            {/* Inputs Grid */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6">
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
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date of Birth</label>
                        <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="w-full p-1.5 border rounded text-sm" />
                    </div>
                    <div className="col-span-1">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Age (Years)</label>
                        <input type="number" value={ageYears} onChange={(e) => setAgeYears(Number(e.target.value))} className="w-full p-1.5 border rounded text-sm" min="0" />
                    </div>
                    <div className="col-span-1">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Age (Months)</label>
                        <input type="number" value={ageMonths} onChange={(e) => setAgeMonths(Number(e.target.value))} className="w-full p-1.5 border rounded text-sm" min="0" max="11" />
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
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                {visibleCharts.length > 0 ? (
                    visibleCharts.map((chart) => (
                        <div key={chart.dataset.id} className="h-80">
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
        </div>
    );
};

export default GrowthCharts;