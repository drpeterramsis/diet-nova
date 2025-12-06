import React, { useState, useMemo, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { growthDatasets, GrowthPoint } from '../../data/growthChartData';

interface GrowthChartsProps {
    initialData?: {
        name?: string;
        gender: 'male' | 'female';
        age: number; // Years
        dob?: string;
        visitDate?: string;
        weight?: number;
        height?: number;
        bmi?: number;
        head_circumference?: number;
    };
    onClose?: () => void;
    onSave?: (note: string) => void;
}

const GrowthCharts: React.FC<GrowthChartsProps> = ({ initialData, onClose, onSave }) => {
    const { t } = useLanguage();
    
    // --- Configuration State ---
    const [clinicName, setClinicName] = useState("Diet-Nova Clinic");
    const [doctorName, setDoctorName] = useState("Dr. Peter Ramsis");
    const [view, setView] = useState<'charts' | 'report'>('charts');

    // --- Inputs State ---
    const [clientName, setClientName] = useState(initialData?.name || '');
    const [gender, setGender] = useState<'male' | 'female'>(initialData?.gender || 'male');
    
    const [ageMode, setAgeMode] = useState<'manual' | 'auto'>('auto');
    const [dob, setDob] = useState(initialData?.dob || '');
    const [visitDate, setVisitDate] = useState(initialData?.visitDate || new Date().toISOString().split('T')[0]);
    const [manualAgeYears, setManualAgeYears] = useState<number>(initialData?.age || 0);
    const [manualAgeMonths, setManualAgeMonths] = useState<number>(0);

    const [weight, setWeight] = useState<number | ''>(initialData?.weight || '');
    const [height, setHeight] = useState<number | ''>(initialData?.height || '');
    const [headCirc, setHeadCirc] = useState<number | ''>(initialData?.head_circumference || '');

    // --- Chart State ---
    const [standard, setStandard] = useState<'WHO' | 'CDC'>('WHO');
    const [activeMetric, setActiveMetric] = useState<'bmi' | 'weight' | 'height' | 'head'>('bmi');

    // --- Calculations ---
    const calculatedAge = useMemo(() => {
        if (ageMode === 'manual') {
            return {
                years: manualAgeYears + (manualAgeMonths / 12),
                months: (manualAgeYears * 12) + manualAgeMonths,
                display: `${manualAgeYears}y ${manualAgeMonths}m`
            };
        } else {
            if (!dob || !visitDate) return { years: 0, months: 0, display: '-' };
            const d1 = new Date(dob);
            const d2 = new Date(visitDate);
            const diffTime = Math.abs(d2.getTime() - d1.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
            const years = diffDays / 365.25;
            const months = diffDays / 30.44;
            
            const yDisplay = Math.floor(years);
            const mDisplay = Math.floor(months % 12);
            
            return {
                years,
                months,
                display: `${yDisplay}y ${mDisplay}m`
            };
        }
    }, [ageMode, dob, visitDate, manualAgeYears, manualAgeMonths]);

    const currentBMI = useMemo(() => {
        const w = Number(weight);
        const h = Number(height) / 100; // cm to m
        if (w > 0 && h > 0) return Number((w / (h * h)).toFixed(1));
        return 0;
    }, [weight, height]);

    // --- Dataset Logic ---
    const getDataset = (metric: string, std: 'WHO' | 'CDC') => {
        // Selector logic
        // 0-36m: CDC Infant
        // 2-20y: CDC Child
        // 5-19y: WHO
        let key = '';
        const ageY = calculatedAge.years;

        if (std === 'WHO') {
            // WHO 2007 (5-19y) - Only available currently in data
            // If < 5, fallback to CDC or show warning (In real app, add WHO 0-5)
            // For this demo, using WHO 5-19 keys
            if (metric === 'bmi') key = 'who_bmi';
            else if (metric === 'weight') key = 'who_weight';
            else if (metric === 'height') key = 'who_height';
        } else {
            // CDC
            if (ageY < 3 && (metric === 'weight' || metric === 'height' || metric === 'head')) {
                if (metric === 'weight') key = 'cdc_infant_weight';
                if (metric === 'height') key = 'cdc_infant_length';
            } else {
                if (metric === 'bmi') key = 'cdc_child_bmi';
                // Note: Limited CDC data in current file, fallback handling
            }
        }
        return growthDatasets[key];
    };

    const analyzeMetric = (val: number, metric: 'bmi' | 'weight' | 'height' | 'head') => {
        if (!val || val <= 0) return null;
        
        const dataset = getDataset(metric, standard);
        if (!dataset) return { percentile: 'N/A', risk: 'No Data', color: 'text-gray-400', p50: 0 };

        const dataPoints = gender === 'male' ? dataset.male : dataset.female;
        // Find closest age point
        const targetAge = dataset.ageRange === '0-36m' ? calculatedAge.months : calculatedAge.years;
        
        // Simple closest point lookup
        const ref = dataPoints.reduce((prev, curr) => 
            Math.abs(curr.age - targetAge) < Math.abs(prev.age - targetAge) ? curr : prev
        );

        let percentile = '';
        let color = '';
        let risk = '';

        // Logic
        if (val < ref.p3) { percentile = '< 3rd'; color = 'text-red-600'; risk = 'Low'; }
        else if (val < (ref.p5 || ref.p3)) { percentile = '3rd - 5th'; color = 'text-orange-500'; risk = 'Risk of Low'; }
        else if (val < ref.p50) { percentile = '5th - 50th'; color = 'text-green-600'; risk = 'Normal'; }
        else if (val < (ref.p85 || ref.p90)) { percentile = '50th - 85th'; color = 'text-green-700'; risk = 'Normal'; }
        else if (val < (ref.p95 || ref.p97)) { percentile = '85th - 95th'; color = 'text-orange-500'; risk = 'Risk of High'; }
        else { percentile = '> 97th'; color = 'text-red-600'; risk = 'High'; }

        return { percentile, risk, color, p50: ref.p50, ref };
    };

    const analysis = useMemo(() => {
        return {
            weight: analyzeMetric(Number(weight), 'weight'),
            height: analyzeMetric(Number(height), 'height'),
            bmi: analyzeMetric(currentBMI, 'bmi'),
            head: analyzeMetric(Number(headCirc), 'head')
        };
    }, [weight, height, currentBMI, headCirc, standard, calculatedAge, gender]);

    // --- Actions ---
    const handleSave = () => {
        if (!onSave) return;
        let note = `[Growth Analysis - ${visitDate}]\n`;
        note += `Name: ${clientName || 'Patient'} | Age: ${calculatedAge.display} | Gender: ${gender}\n`;
        note += `Standard: ${standard}\n`;
        
        if (weight) note += `• Weight: ${weight} kg (${analysis.weight?.percentile || '-'}) [Ref P50: ${analysis.weight?.p50}]\n`;
        if (height) note += `• Height: ${height} cm (${analysis.height?.percentile || '-'}) [Ref P50: ${analysis.height?.p50}]\n`;
        if (currentBMI) note += `• BMI: ${currentBMI} (${analysis.bmi?.percentile || '-'}) [Ref P50: ${analysis.bmi?.p50}]\n`;
        if (headCirc) note += `• Head Circ: ${headCirc} cm (${analysis.head?.percentile || '-'}) [Ref P50: ${analysis.head?.p50}]\n`;
        
        onSave(note);
    };

    const handlePrint = () => {
        window.print();
    };

    // --- Chart SVG Renderer (Reusable) ---
    const ChartSVG = ({ metric, standardOverride }: { metric: 'bmi' | 'weight' | 'height' | 'head', standardOverride?: 'WHO' | 'CDC' }) => {
        const currentStandard = standardOverride || standard;
        const dataset = getDataset(metric, currentStandard);
        if (!dataset) return <div className="h-64 flex items-center justify-center text-gray-400 text-xs border rounded bg-gray-50">No chart data ({currentStandard} {metric})</div>;

        const dataPoints = gender === 'male' ? dataset.male : dataset.female;
        const userVal = metric === 'bmi' ? currentBMI : (metric === 'weight' ? Number(weight) : (metric === 'height' ? Number(height) : Number(headCirc)));
        const targetAge = dataset.ageRange === '0-36m' ? calculatedAge.months : calculatedAge.years;

        const chartWidth = 600;
        const chartHeight = 300;
        const padding = { top: 20, right: 30, bottom: 40, left: 40 };

        const xMin = Math.min(...dataPoints.map(d => d.age));
        const xMax = Math.max(...dataPoints.map(d => d.age));
        
        const allY = dataPoints.flatMap(d => [d.p3, d.p97]);
        if (userVal) allY.push(userVal);
        
        const yMin = Math.floor(Math.min(...allY) * 0.9);
        const yMax = Math.ceil(Math.max(...allY) * 1.1);

        const getX = (a: number) => padding.left + ((a - xMin) / (xMax - xMin)) * (chartWidth - padding.left - padding.right);
        const getY = (val: number) => chartHeight - padding.bottom - ((val - yMin) / (yMax - yMin)) * (chartHeight - padding.bottom - padding.top);

        const createPath = (key: keyof GrowthPoint) => 'M ' + dataPoints.map(d => `${getX(d.age)},${getY(d[key] as number)}`).join(' L ');

        return (
            <div className="border border-gray-200 rounded-xl bg-white p-2 overflow-hidden shadow-sm break-inside-avoid">
                <h4 className="text-center font-bold text-gray-700 mb-2 text-sm">{dataset.label}</h4>
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto">
                    {/* Grid Lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map(pct => {
                        const val = yMin + pct * (yMax - yMin);
                        const y = getY(val);
                        return <line key={pct} x1={padding.left} y1={y} x2={chartWidth - padding.right} y2={y} stroke="#f3f4f6" />;
                    })}
                    
                    {/* Curves */}
                    <path d={createPath('p97')} fill="none" stroke="#ef4444" strokeWidth="1" strokeDasharray="4,4" />
                    <text x={chartWidth - padding.right} y={getY(dataPoints[dataPoints.length-1].p97)} dx="-5" dy="3" fontSize="9" fill="#ef4444" textAnchor="end">97th</text>

                    <path d={createPath('p85')} fill="none" stroke="#f97316" strokeWidth="1" strokeDasharray="4,4" />
                    
                    <path d={createPath('p50')} fill="none" stroke="#22c55e" strokeWidth="2" />
                    <text x={chartWidth - padding.right} y={getY(dataPoints[dataPoints.length-1].p50)} dx="-5" dy="3" fontSize="9" fill="#22c55e" textAnchor="end">50th</text>

                    <path d={createPath('p3')} fill="none" stroke="#ef4444" strokeWidth="1" strokeDasharray="4,4" />
                    <text x={chartWidth - padding.right} y={getY(dataPoints[dataPoints.length-1].p3)} dx="-5" dy="3" fontSize="9" fill="#ef4444" textAnchor="end">3rd</text>

                    {/* User Point */}
                    {userVal > 0 && targetAge >= xMin && targetAge <= xMax && (
                        <>
                            <circle cx={getX(targetAge)} cy={getY(userVal)} r="5" fill="#3b82f6" stroke="white" strokeWidth="2" />
                            <line x1={padding.left} y1={getY(userVal)} x2={chartWidth - padding.right} y2={getY(userVal)} stroke="#3b82f6" strokeWidth="1" strokeDasharray="2,2" opacity="0.5" />
                            <line x1={getX(targetAge)} y1={padding.top} x2={getX(targetAge)} y2={chartHeight - padding.bottom} stroke="#3b82f6" strokeWidth="1" strokeDasharray="2,2" opacity="0.5" />
                        </>
                    )}

                    {/* Axes Labels */}
                    <text x={chartWidth/2} y={chartHeight - 5} textAnchor="middle" fontSize="10" fill="#9ca3af">{dataset.xLabel}</text>
                    <text x={10} y={chartHeight/2} textAnchor="middle" transform={`rotate(-90, 10, ${chartHeight/2})`} fontSize="10" fill="#9ca3af">{dataset.yLabel}</text>
                </svg>
            </div>
        );
    };

    return (
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg border border-gray-100 max-w-6xl mx-auto animate-fade-in flex flex-col min-h-[80vh]">
            
            {/* --- SCREEN HEADER (Hidden on Print) --- */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 no-print">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <span>📈</span> {t.tools.growthCharts.title}
                    </h2>
                    <p className="text-sm text-gray-500">Comprehensive Pediatric Growth Assessment</p>
                </div>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button 
                        onClick={() => setView('charts')}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition ${view === 'charts' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
                    >
                        Interactive Charts
                    </button>
                    <button 
                        onClick={() => setView('report')}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition ${view === 'report' ? 'bg-white shadow text-purple-600' : 'text-gray-500'}`}
                    >
                        Summary & Report
                    </button>
                </div>
                {onClose && (
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100">✕</button>
                )}
            </div>

            {/* --- PRINT ONLY LAYOUT --- */}
            <div className="hidden print:block">
                {/* Print Header */}
                <div className="border-b-2 border-gray-800 pb-4 mb-6">
                    <div className="flex justify-between items-end">
                        <div>
                           <h1 className="text-3xl font-serif font-bold text-gray-900 mb-1">{clinicName}</h1>
                           <p className="text-sm text-gray-600 font-bold">{doctorName}</p>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-gray-500">Report Date: {new Date().toLocaleDateString()}</div>
                            <div className="text-xs text-gray-400">Diet-Nova System v2.0.134</div>
                        </div>
                    </div>
                    {/* Patient Data Grid */}
                    <div className="mt-6 border-t border-gray-300 pt-4">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Patient Information</h3>
                        <div className="grid grid-cols-4 gap-4 text-sm bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <div>
                                <span className="block text-gray-500 text-xs">Name</span>
                                <span className="font-bold">{clientName || 'N/A'}</span>
                            </div>
                            <div>
                                <span className="block text-gray-500 text-xs">Gender</span>
                                <span className="font-bold capitalize">{gender}</span>
                            </div>
                            <div>
                                <span className="block text-gray-500 text-xs">DOB</span>
                                <span className="font-bold">{dob || 'N/A'}</span>
                            </div>
                            <div>
                                <span className="block text-gray-500 text-xs">Calc. Age</span>
                                <span className="font-bold">{calculatedAge.display}</span>
                            </div>
                            {/* Row 2 */}
                            <div className="mt-2">
                                <span className="block text-gray-500 text-xs">Weight</span>
                                <span className="font-bold">{weight ? weight + ' kg' : '-'}</span>
                            </div>
                            <div className="mt-2">
                                <span className="block text-gray-500 text-xs">Height</span>
                                <span className="font-bold">{height ? height + ' cm' : '-'}</span>
                            </div>
                            <div className="mt-2">
                                <span className="block text-gray-500 text-xs">BMI</span>
                                <span className="font-bold">{currentBMI > 0 ? currentBMI : '-'}</span>
                            </div>
                            <div className="mt-2">
                                <span className="block text-gray-500 text-xs">Head Circ.</span>
                                <span className="font-bold">{headCirc ? headCirc + ' cm' : '-'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Print Content: Charts Dual Mode */}
                <div className="space-y-8">
                    {/* WHO Section */}
                    <div>
                        <h3 className="text-lg font-bold border-b border-gray-300 mb-4 pb-1">WHO Standards (5-19 Years)</h3>
                        <div className="grid grid-cols-2 gap-6">
                            <ChartSVG metric="weight" standardOverride="WHO" />
                            <ChartSVG metric="height" standardOverride="WHO" />
                            <ChartSVG metric="bmi" standardOverride="WHO" />
                        </div>
                    </div>

                    <div className="break-before-page pt-8" />

                    {/* CDC Section */}
                    <div>
                        <h3 className="text-lg font-bold border-b border-gray-300 mb-4 pb-1">CDC Standards (2-20 Years / 0-36 Months)</h3>
                        <div className="grid grid-cols-2 gap-6">
                            <ChartSVG metric="weight" standardOverride="CDC" />
                            <ChartSVG metric="height" standardOverride="CDC" />
                            <ChartSVG metric="bmi" standardOverride="CDC" />
                        </div>
                    </div>
                </div>

                {/* Print Footer */}
                <div className="fixed bottom-0 left-0 w-full text-center text-[10px] text-gray-400 border-t p-2 bg-white">
                    Diet-Nova Clinical Report | v2.0.134 | {new Date().toLocaleDateString()}
                </div>
            </div>

            {/* --- SCREEN CONTENT --- */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-grow no-print">
                {/* --- Left Column: Inputs --- */}
                <div className="lg:col-span-3 space-y-6 bg-gray-50 p-4 rounded-xl h-fit border border-gray-100">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Standard</label>
                        <div className="flex rounded-md overflow-hidden border border-gray-300">
                            <button onClick={() => setStandard('WHO')} className={`flex-1 py-1.5 text-xs font-bold ${standard === 'WHO' ? 'bg-blue-600 text-white' : 'bg-white'}`}>WHO</button>
                            <button onClick={() => setStandard('CDC')} className={`flex-1 py-1.5 text-xs font-bold ${standard === 'CDC' ? 'bg-blue-600 text-white' : 'bg-white'}`}>CDC</button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Patient Name</label>
                        <input type="text" className="w-full p-2 border rounded text-sm" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Optional" />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Gender</label>
                            <select value={gender} onChange={e => setGender(e.target.value as any)} className="w-full p-2 border rounded text-sm">
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mode</label>
                            <select value={ageMode} onChange={e => setAgeMode(e.target.value as any)} className="w-full p-2 border rounded text-sm">
                                <option value="auto">Auto Age</option>
                                <option value="manual">Manual</option>
                            </select>
                        </div>
                    </div>

                    {ageMode === 'auto' ? (
                        <div className="space-y-2">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date of Birth</label>
                                <input type="date" value={dob} onChange={e => setDob(e.target.value)} className="w-full p-2 border rounded text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Visit Date</label>
                                <input type="date" value={visitDate} onChange={e => setVisitDate(e.target.value)} className="w-full p-2 border rounded text-sm" />
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Years</label>
                                <input type="number" value={manualAgeYears} onChange={e => setManualAgeYears(Number(e.target.value))} className="w-full p-2 border rounded text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Months</label>
                                <input type="number" value={manualAgeMonths} onChange={e => setManualAgeMonths(Number(e.target.value))} className="w-full p-2 border rounded text-sm" />
                            </div>
                        </div>
                    )}

                    <div className="bg-blue-100 p-2 rounded text-center text-blue-800 font-bold text-sm">
                        Age: {calculatedAge.display}
                    </div>

                    <hr className="border-gray-200" />

                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Weight (kg)</label>
                            <input type="number" value={weight} onChange={e => setWeight(e.target.value === '' ? '' : Number(e.target.value))} className="w-full p-2 border rounded font-bold text-blue-700" placeholder="0.0" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Height/Length (cm)</label>
                            <input type="number" value={height} onChange={e => setHeight(e.target.value === '' ? '' : Number(e.target.value))} className="w-full p-2 border rounded font-bold text-blue-700" placeholder="0.0" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Head Circ. (cm)</label>
                            <input type="number" value={headCirc} onChange={e => setHeadCirc(e.target.value === '' ? '' : Number(e.target.value))} className="w-full p-2 border rounded font-bold text-blue-700" placeholder="0.0" />
                        </div>
                        {currentBMI > 0 && (
                            <div className="bg-gray-100 p-2 rounded text-center text-xs font-mono">
                                Calc. BMI: <strong>{currentBMI}</strong>
                            </div>
                        )}
                    </div>

                    <hr className="border-gray-200" />

                    {onSave && (
                        <button onClick={handleSave} className="w-full bg-[var(--color-primary)] text-white py-2 rounded font-bold shadow hover:bg-[var(--color-primary-hover)] transition text-sm">
                            Save to Notes
                        </button>
                    )}
                </div>

                {/* --- Right Column: Visualization --- */}
                <div className="lg:col-span-9">
                    
                    {/* View: Charts (Screen) */}
                    {view === 'charts' && (
                        <div className="space-y-4">
                            <div className="flex gap-2 mb-4 bg-gray-50 p-1 rounded-lg w-fit overflow-x-auto">
                                <button onClick={() => setActiveMetric('bmi')} className={`px-4 py-1.5 text-sm font-bold rounded transition whitespace-nowrap ${activeMetric === 'bmi' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}>BMI-for-Age</button>
                                <button onClick={() => setActiveMetric('weight')} className={`px-4 py-1.5 text-sm font-bold rounded transition whitespace-nowrap ${activeMetric === 'weight' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}>Weight-for-Age</button>
                                <button onClick={() => setActiveMetric('height')} className={`px-4 py-1.5 text-sm font-bold rounded transition whitespace-nowrap ${activeMetric === 'height' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}>Height-for-Age</button>
                                <button onClick={() => setActiveMetric('head')} className={`px-4 py-1.5 text-sm font-bold rounded transition whitespace-nowrap ${activeMetric === 'head' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}>Head-for-Age</button>
                            </div>

                            <div className="relative">
                                <ChartSVG metric={activeMetric} />
                                {/* Current Analysis Box */}
                                {analysis[activeMetric] && analysis[activeMetric]?.risk !== 'No Data' && (
                                    <div className="absolute top-4 right-4 bg-white/90 p-3 rounded-lg border border-gray-200 shadow-sm text-right backdrop-blur-sm">
                                        <div className="text-xs text-gray-400 font-bold uppercase">Percentile</div>
                                        <div className={`text-xl font-extrabold ${analysis[activeMetric]?.color}`}>{analysis[activeMetric]?.percentile}</div>
                                        <div className={`text-xs font-medium ${analysis[activeMetric]?.color}`}>{analysis[activeMetric]?.risk}</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* View: Report Config (Screen) */}
                    {view === 'report' && (
                        <div className="space-y-8">
                            <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 flex flex-col sm:flex-row gap-4 justify-between items-end">
                                <div className="w-full sm:w-auto flex-grow">
                                    <h4 className="font-bold text-yellow-800 text-sm mb-2">Report Header Configuration</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <input type="text" value={clinicName} onChange={e => setClinicName(e.target.value)} className="p-2 border rounded text-sm w-full" placeholder="Clinic Name" />
                                        <input type="text" value={doctorName} onChange={e => setDoctorName(e.target.value)} className="p-2 border rounded text-sm w-full" placeholder="Doctor Name" />
                                    </div>
                                </div>
                                <button onClick={handlePrint} className="bg-gray-800 text-white px-6 py-2 rounded-lg font-bold shadow hover:bg-gray-900 transition flex items-center gap-2">
                                    <span>🖨️</span> Print Full Report
                                </button>
                            </div>

                            {/* Screen Summary Table */}
                            <div className="border border-gray-300 rounded-lg overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-100 text-gray-800 border-b border-gray-300">
                                        <tr>
                                            <th className="p-3 text-left">Measurement</th>
                                            <th className="p-3 text-center">Value</th>
                                            <th className="p-3 text-center">Percentile</th>
                                            <th className="p-3 text-center">Status</th>
                                            <th className="p-3 text-center text-gray-500">Ref (50th)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        <tr>
                                            <td className="p-3 font-medium">Weight</td>
                                            <td className="p-3 text-center">{weight || '-'} kg</td>
                                            <td className={`p-3 text-center font-bold ${analysis.weight?.color}`}>{analysis.weight?.percentile || '-'}</td>
                                            <td className="p-3 text-center">{analysis.weight?.risk || '-'}</td>
                                            <td className="p-3 text-center text-gray-500">{analysis.weight?.p50 || '-'}</td>
                                        </tr>
                                        <tr>
                                            <td className="p-3 font-medium">Height</td>
                                            <td className="p-3 text-center">{height || '-'} cm</td>
                                            <td className={`p-3 text-center font-bold ${analysis.height?.color}`}>{analysis.height?.percentile || '-'}</td>
                                            <td className="p-3 text-center">{analysis.height?.risk || '-'}</td>
                                            <td className="p-3 text-center text-gray-500">{analysis.height?.p50 || '-'}</td>
                                        </tr>
                                        <tr>
                                            <td className="p-3 font-medium">BMI</td>
                                            <td className="p-3 text-center">{currentBMI || '-'}</td>
                                            <td className={`p-3 text-center font-bold ${analysis.bmi?.color}`}>{analysis.bmi?.percentile || '-'}</td>
                                            <td className="p-3 text-center">{analysis.bmi?.risk || '-'}</td>
                                            <td className="p-3 text-center text-gray-500">{analysis.bmi?.p50 || '-'}</td>
                                        </tr>
                                        <tr>
                                            <td className="p-3 font-medium">Head Circ.</td>
                                            <td className="p-3 text-center">{headCirc || '-'} cm</td>
                                            <td className={`p-3 text-center font-bold ${analysis.head?.color}`}>{analysis.head?.percentile || '-'}</td>
                                            <td className="p-3 text-center">{analysis.head?.risk || '-'}</td>
                                            <td className="p-3 text-center text-gray-500">{analysis.head?.p50 || '-'}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <div className="text-center text-xs text-gray-400 mt-4">
                                On screen shows currently selected standard only. Print to see both WHO and CDC charts.
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GrowthCharts;