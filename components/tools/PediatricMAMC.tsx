
import React, { useState, useMemo } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { pediatricMacData, pediatricTsfData, AnthropometryRow } from '../../data/pediatricData';

interface PediatricMAMCProps {
    initialGender?: 'male' | 'female';
    initialAge?: number;
    initialMac?: number;
    onClose?: () => void;
    onSave?: (note: string) => void;
}

const PediatricMAMC: React.FC<PediatricMAMCProps> = ({ initialGender, initialAge, initialMac, onClose, onSave }) => {
    const { t } = useLanguage();
    const [gender, setGender] = useState<'male' | 'female'>(initialGender || 'male');
    const [age, setAge] = useState<number>(initialAge || 10);
    const [mac, setMac] = useState<number>(initialMac || 0); // cm
    const [tsf, setTsf] = useState<number>(0); // mm
    const [activeTab, setActiveTab] = useState<'mac' | 'tsf'>('mac');

    const macData = gender === 'male' ? pediatricMacData.male : pediatricMacData.female;
    const tsfData = gender === 'male' ? pediatricTsfData.male : pediatricTsfData.female;

    const clampedAge = Math.max(2, Math.min(19, age));

    const analysis = useMemo(() => {
        // MAMC Calculation
        // MAMC = MAC (cm) - (3.14 * TSF (cm))
        let mamcVal = 0;
        let macAnalysis = { percentile: '-', color: '' };
        let tsfAnalysis = { percentile: '-', color: '' };

        if (mac > 0 && tsf > 0) {
            const tsfCm = tsf / 10;
            mamcVal = mac - (3.14 * tsfCm);
        }

        const getAnalysis = (val: number, data: AnthropometryRow[]) => {
            if (!val || val <= 0) return { percentile: '-', color: '' };
            const ref = data.find(d => d.age === clampedAge);
            if (!ref) return { percentile: '-', color: '' };

            if (val < ref.p5) return { percentile: '< 5th (Low)', color: 'text-red-600' };
            if (val < ref.p10) return { percentile: '5th - 10th', color: 'text-orange-500' };
            if (val < ref.p50) return { percentile: '10th - 50th', color: 'text-green-600' };
            if (val < ref.p95) return { percentile: '50th - 95th', color: 'text-green-700' };
            return { percentile: '> 95th (High)', color: 'text-orange-600' };
        };

        if (mac > 0) macAnalysis = getAnalysis(mac, macData);
        if (tsf > 0) tsfAnalysis = getAnalysis(tsf, tsfData);

        return { mamcVal, macAnalysis, tsfAnalysis };
    }, [mac, tsf, clampedAge, macData, tsfData]);

    const handleSave = () => {
        if (!onSave) return;
        const note = `[Pediatric Anthropometry]
• Age: ${age}y, Gender: ${gender}
• MAC: ${mac} cm (${analysis.macAnalysis.percentile})
• TSF: ${tsf} mm (${analysis.tsfAnalysis.percentile})
• Calculated MAMC: ${analysis.mamcVal.toFixed(2)} cm
formula: MAMC = MAC - (3.14 * TSF_cm)`;
        onSave(note);
    };

    // --- Chart Logic ---
    const Chart = ({ type }: { type: 'mac' | 'tsf' }) => {
        const data = type === 'mac' ? macData : tsfData;
        const value = type === 'mac' ? mac : tsf;
        const unit = type === 'mac' ? 'cm' : 'mm';
        const label = type === 'mac' ? 'Mid-Arm Circ.' : 'Triceps Skinfold';
        
        const chartHeight = 250;
        const chartWidth = 500;
        const paddingX = 40;
        const paddingY = 30;

        const getX = (a: number) => paddingX + ((a - 2) / (19 - 2)) * (chartWidth - paddingX * 2);
        
        // Find Y Scale
        const allVals = data.flatMap(d => [d.p5, d.p95]);
        const minY = Math.floor(Math.min(...allVals) * 0.9);
        const maxY = Math.ceil(Math.max(...allVals) * 1.1);
        
        const getY = (v: number) => chartHeight - paddingY - ((v - minY) / (maxY - minY)) * (chartHeight - paddingY * 2);

        const createPath = (key: keyof AnthropometryRow) => 'M ' + data.map(d => `${getX(d.age)},${getY(d[key])}`).join(' L ');

        return (
            <div className="border border-gray-200 rounded-xl bg-white p-4 shadow-inner relative overflow-hidden">
                <h4 className="text-center font-bold text-gray-700 mb-2">{label} Percentiles</h4>
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto">
                    {/* X Axis */}
                    {[2, 5, 10, 15, 19].map(a => (
                        <React.Fragment key={a}>
                            <line x1={getX(a)} y1={paddingY} x2={getX(a)} y2={chartHeight - paddingY} stroke="#f3f4f6" strokeWidth="1" />
                            <text x={getX(a)} y={chartHeight - 10} textAnchor="middle" fontSize="10" fill="#9ca3af">{a}</text>
                        </React.Fragment>
                    ))}
                    
                    {/* Curves */}
                    <path d={createPath('p95')} fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4,4" />
                    <text x={getX(19)} y={getY(data[data.length-1].p95)} dx="2" dy="2" fontSize="9" fill="#ef4444">95</text>

                    <path d={createPath('p50')} fill="none" stroke="#22c55e" strokeWidth="2" />
                    <text x={getX(19)} y={getY(data[data.length-1].p50)} dx="2" dy="2" fontSize="9" fill="#22c55e">50</text>

                    <path d={createPath('p5')} fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4,4" />
                    <text x={getX(19)} y={getY(data[data.length-1].p5)} dx="2" dy="2" fontSize="9" fill="#ef4444">5</text>

                    {/* User Point */}
                    {value > 0 && (
                        <>
                            <circle cx={getX(clampedAge)} cy={getY(value)} r="5" fill="#3b82f6" stroke="white" strokeWidth="2" />
                            <line x1={getX(clampedAge)} y1={paddingY} x2={getX(clampedAge)} y2={chartHeight - paddingY} stroke="#3b82f6" strokeWidth="1" strokeDasharray="2,2" opacity="0.5" />
                            <line x1={paddingX} y1={getY(value)} x2={chartWidth - paddingX} y2={getY(value)} stroke="#3b82f6" strokeWidth="1" strokeDasharray="2,2" opacity="0.5" />
                        </>
                    )}
                </svg>
            </div>
        );
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 max-w-5xl mx-auto animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <span>💪</span> Pediatric Muscle Analysis (MAMC)
                    </h2>
                    <p className="text-sm text-gray-500">Calculate Mid-Arm Muscle Circumference (2-19y)</p>
                </div>
                {onClose && (
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left: Inputs & Result */}
                <div className="lg:col-span-4 space-y-6 bg-gray-50 p-5 rounded-xl">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Gender</label>
                            <div className="flex rounded-md overflow-hidden border border-gray-300">
                                <button onClick={() => setGender('male')} className={`flex-1 py-1.5 text-sm ${gender === 'male' ? 'bg-blue-600 text-white' : 'bg-white'}`}>Male</button>
                                <button onClick={() => setGender('female')} className={`flex-1 py-1.5 text-sm ${gender === 'female' ? 'bg-pink-600 text-white' : 'bg-white'}`}>Female</button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Age (Years)</label>
                            <input type="number" value={age} onChange={(e) => setAge(Number(e.target.value))} className="w-full p-2 border rounded" min="2" max="19" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">MAC (cm)</label>
                                <input type="number" value={mac || ''} onChange={(e) => setMac(Number(e.target.value))} className="w-full p-2 border rounded font-bold text-blue-700" placeholder="cm" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">TSF (mm)</label>
                                <input type="number" value={tsf || ''} onChange={(e) => setTsf(Number(e.target.value))} className="w-full p-2 border rounded font-bold text-orange-700" placeholder="mm" />
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-200 pt-4">
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
                            <div className="text-xs text-gray-400 uppercase font-bold mb-1">Calculated MAMC</div>
                            <div className="text-3xl font-extrabold text-purple-700 mb-1">
                                {analysis.mamcVal > 0 ? analysis.mamcVal.toFixed(2) : '-'} <span className="text-lg">cm</span>
                            </div>
                            <div className="text-[10px] text-gray-400 mb-3">Formula: MAC - (3.14 * TSF_cm)</div>
                            
                            <div className="text-left text-xs space-y-1 bg-gray-50 p-2 rounded">
                                <div className="flex justify-between">
                                    <span>MAC Status:</span>
                                    <span className={`font-bold ${analysis.macAnalysis.color}`}>{analysis.macAnalysis.percentile}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>TSF Status:</span>
                                    <span className={`font-bold ${analysis.tsfAnalysis.color}`}>{analysis.tsfAnalysis.percentile}</span>
                                </div>
                            </div>

                            {onSave && (
                                <button 
                                    onClick={handleSave}
                                    disabled={analysis.mamcVal <= 0}
                                    className="mt-4 w-full bg-[var(--color-primary)] text-white py-2 rounded text-sm font-bold hover:bg-[var(--color-primary-hover)] transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Save to Notes
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Charts */}
                <div className="lg:col-span-8">
                    <div className="flex gap-2 mb-4 bg-gray-100 p-1 rounded-lg w-fit mx-auto lg:mx-0">
                        <button 
                            onClick={() => setActiveTab('mac')}
                            className={`px-4 py-1.5 text-sm font-bold rounded-md transition ${activeTab === 'mac' ? 'bg-white shadow text-blue-700' : 'text-gray-500'}`}
                        >
                            Mid-Arm Circ. Chart
                        </button>
                        <button 
                            onClick={() => setActiveTab('tsf')}
                            className={`px-4 py-1.5 text-sm font-bold rounded-md transition ${activeTab === 'tsf' ? 'bg-white shadow text-orange-700' : 'text-gray-500'}`}
                        >
                            Triceps Skinfold Chart
                        </button>
                    </div>
                    
                    <div className="animate-fade-in">
                        {activeTab === 'mac' && <Chart type="mac" />}
                        {activeTab === 'tsf' && <Chart type="tsf" />}
                    </div>
                    
                    <div className="mt-4 p-3 bg-yellow-50 text-yellow-800 text-xs rounded border border-yellow-200">
                        <strong>Note:</strong> MAMC (Mid-Arm Muscle Circumference) reflects somatic protein reserves. <br/>
                        Low MAMC indicates muscle wasting even if weight is normal (e.g. high fat or edema).
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PediatricMAMC;
