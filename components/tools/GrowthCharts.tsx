
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
    
    // State
    const [standard, setStandard] = useState<'WHO' | 'CDC'>('WHO');
    const [datasetKey, setDatasetKey] = useState<string>('who_bmi');
    const [gender, setGender] = useState<'male' | 'female'>(initialData?.gender || 'male');
    const [userAge, setUserAge] = useState<number>(initialData?.age || 10);
    const [userValue, setUserValue] = useState<number>(0);

    // Filter available datasets based on standard
    const availableDatasets = useMemo(() => {
        return Object.values(growthDatasets).filter(d => d.type === standard);
    }, [standard]);

    // Update dataset key when standard changes
    useEffect(() => {
        if (availableDatasets.length > 0) {
            // Try to keep same type (e.g. weight) if possible
            const currentType = datasetKey.split('_').pop(); // bmi, weight, height
            const match = availableDatasets.find(d => d.id.includes(currentType || ''));
            if (match) setDatasetKey(match.id);
            else setDatasetKey(availableDatasets[0].id);
        }
    }, [standard, availableDatasets]);

    // Pre-fill user value based on selected dataset type
    useEffect(() => {
        if (initialData) {
            if (datasetKey.includes('bmi')) setUserValue(initialData.bmi || 0);
            else if (datasetKey.includes('weight')) setUserValue(initialData.weight || 0);
            else if (datasetKey.includes('height') || datasetKey.includes('length')) setUserValue(initialData.height || 0);
            else if (datasetKey.includes('head')) setUserValue(initialData.head_circumference || 0);
        }
    }, [datasetKey, initialData]);

    const activeDataset = growthDatasets[datasetKey];
    const dataPoints = activeDataset ? (gender === 'male' ? activeDataset.male : activeDataset.female) : [];

    // --- Chart Interpretation ---
    const interpretation = useMemo(() => {
        if (!userValue || !dataPoints.length) return null;
        
        // Find closest age point
        const ref = dataPoints.reduce((prev, curr) => 
            Math.abs(curr.age - userAge) < Math.abs(prev.age - userAge) ? curr : prev
        );

        let percentile = '';
        let color = '';

        if (userValue < ref.p3) { percentile = '< 3rd'; color = 'text-red-600'; }
        else if (userValue < ref.p15) { percentile = '3rd - 15th'; color = 'text-orange-500'; }
        else if (userValue < ref.p50) { percentile = '15th - 50th'; color = 'text-green-600'; }
        else if (userValue < ref.p85) { percentile = '50th - 85th'; color = 'text-green-700'; }
        else if (userValue < ref.p97) { percentile = '85th - 97th'; color = 'text-orange-500'; }
        else { percentile = '> 97th'; color = 'text-red-600'; }

        return { percentile, color, ref };
    }, [userValue, userAge, dataPoints]);

    // --- SVG Chart Logic ---
    const chartWidth = 800;
    const chartHeight = 400;
    const padding = { top: 20, right: 30, bottom: 40, left: 50 };

    const xMin = Math.min(...dataPoints.map(d => d.age));
    const xMax = Math.max(...dataPoints.map(d => d.age));
    
    const allY = dataPoints.flatMap(d => [d.p3, d.p97]);
    if (userValue) allY.push(userValue);
    
    const yMin = Math.floor(Math.min(...allY) * 0.9);
    const yMax = Math.ceil(Math.max(...allY) * 1.1);

    const getX = (age: number) => padding.left + ((age - xMin) / (xMax - xMin)) * (chartWidth - padding.left - padding.right);
    const getY = (val: number) => chartHeight - padding.bottom - ((val - yMin) / (yMax - yMin)) * (chartHeight - padding.bottom - padding.top);

    const createPath = (key: keyof GrowthPoint) => {
        return 'M ' + dataPoints.map(d => `${getX(d.age)},${getY(d[key] as number)}`).join(' L ');
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 max-w-5xl mx-auto animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <span>📈</span> {t.tools.growthCharts.title}
                    </h2>
                    <p className="text-sm text-gray-500">
                        {activeDataset?.label} ({gender === 'male' ? t.kcal.male : t.kcal.female})
                    </p>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setStandard('WHO')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition ${standard === 'WHO' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                    >
                        WHO
                    </button>
                    <button 
                        onClick={() => setStandard('CDC')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition ${standard === 'CDC' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                    >
                        CDC
                    </button>
                    {onClose && (
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100">✕</button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Controls */}
                <div className="lg:col-span-1 space-y-4 bg-gray-50 p-4 rounded-xl h-fit">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Chart Type</label>
                        <select 
                            value={datasetKey}
                            onChange={(e) => setDatasetKey(e.target.value)}
                            className="w-full p-2 border rounded text-sm"
                        >
                            {availableDatasets.map(d => (
                                <option key={d.id} value={d.id}>{d.label}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Gender</label>
                        <div className="flex rounded overflow-hidden border border-gray-300">
                            <button onClick={() => setGender('male')} className={`flex-1 py-1 text-sm ${gender === 'male' ? 'bg-blue-500 text-white' : 'bg-white'}`}>Male</button>
                            <button onClick={() => setGender('female')} className={`flex-1 py-1 text-sm ${gender === 'female' ? 'bg-pink-500 text-white' : 'bg-white'}`}>Female</button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{activeDataset?.xLabel}</label>
                        <input 
                            type="number" 
                            value={userAge} 
                            onChange={(e) => setUserAge(Number(e.target.value))}
                            className="w-full p-2 border rounded"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Value ({activeDataset?.yLabel})</label>
                        <input 
                            type="number" 
                            value={userValue || ''} 
                            onChange={(e) => setUserValue(Number(e.target.value))}
                            className="w-full p-2 border rounded font-bold text-blue-700"
                            placeholder="0"
                        />
                    </div>

                    {interpretation && (
                        <div className="mt-4 p-3 bg-white rounded border border-gray-200 shadow-sm text-center">
                            <div className="text-xs text-gray-400 uppercase font-bold">Percentile</div>
                            <div className={`text-lg font-extrabold ${interpretation.color}`}>
                                {interpretation.percentile}
                            </div>
                            <div className="text-[10px] text-gray-400 mt-1">
                                50th P: {interpretation.ref.p50}
                            </div>
                        </div>
                    )}
                </div>

                {/* Chart Area */}
                <div className="lg:col-span-3 border border-gray-200 rounded-xl bg-white p-2 shadow-inner overflow-x-auto">
                    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto min-w-[600px]">
                        {/* Grid Lines Y */}
                        {[0, 0.25, 0.5, 0.75, 1].map(pct => {
                            const val = yMin + pct * (yMax - yMin);
                            const y = getY(val);
                            return (
                                <g key={pct}>
                                    <line x1={padding.left} y1={y} x2={chartWidth - padding.right} y2={y} stroke="#f3f4f6" />
                                    <text x={padding.left - 5} y={y + 3} textAnchor="end" fontSize="10" fill="#9ca3af">{val.toFixed(1)}</text>
                                </g>
                            );
                        })}
                        
                        {/* Grid Lines X */}
                        {dataPoints.filter((_, i) => i % 2 === 0).map(d => (
                            <g key={d.age}>
                                <line x1={getX(d.age)} y1={padding.top} x2={getX(d.age)} y2={chartHeight - padding.bottom} stroke="#f3f4f6" />
                                <text x={getX(d.age)} y={chartHeight - padding.bottom + 15} textAnchor="middle" fontSize="10" fill="#9ca3af">{d.age}</text>
                            </g>
                        ))}

                        {/* Percentile Lines */}
                        <path d={createPath('p97')} fill="none" stroke="#ef4444" strokeWidth="1" strokeDasharray="4,4" />
                        <text x={getX(dataPoints[dataPoints.length-1].age)} y={getY(dataPoints[dataPoints.length-1].p97)} dx="5" fontSize="10" fill="#ef4444">97th</text>

                        <path d={createPath('p85')} fill="none" stroke="#f97316" strokeWidth="1" strokeDasharray="4,4" />
                        <text x={getX(dataPoints[dataPoints.length-1].age)} y={getY(dataPoints[dataPoints.length-1].p85 as number)} dx="5" fontSize="10" fill="#f97316">85th</text>

                        <path d={createPath('p50')} fill="none" stroke="#22c55e" strokeWidth="2" />
                        <text x={getX(dataPoints[dataPoints.length-1].age)} y={getY(dataPoints[dataPoints.length-1].p50)} dx="5" fontSize="10" fill="#22c55e">50th</text>

                        <path d={createPath('p15')} fill="none" stroke="#f97316" strokeWidth="1" strokeDasharray="4,4" />
                        <text x={getX(dataPoints[dataPoints.length-1].age)} y={getY(dataPoints[dataPoints.length-1].p15 as number)} dx="5" fontSize="10" fill="#f97316">15th</text>

                        <path d={createPath('p3')} fill="none" stroke="#ef4444" strokeWidth="1" strokeDasharray="4,4" />
                        <text x={getX(dataPoints[dataPoints.length-1].age)} y={getY(dataPoints[dataPoints.length-1].p3)} dx="5" fontSize="10" fill="#ef4444">3rd</text>

                        {/* User Point */}
                        {userValue > 0 && (
                            <>
                                <circle cx={getX(userAge)} cy={getY(userValue)} r="6" fill="#3b82f6" stroke="white" strokeWidth="2" />
                                <line x1={padding.left} y1={getY(userValue)} x2={chartWidth - padding.right} y2={getY(userValue)} stroke="#3b82f6" strokeWidth="1" strokeDasharray="2,2" opacity="0.5" />
                                <line x1={getX(userAge)} y1={padding.top} x2={getX(userAge)} y2={chartHeight - padding.bottom} stroke="#3b82f6" strokeWidth="1" strokeDasharray="2,2" opacity="0.5" />
                            </>
                        )}
                        
                        {/* Axes Labels */}
                        <text x={chartWidth / 2} y={chartHeight - 5} textAnchor="middle" fontSize="12" fill="#6b7280" fontWeight="bold">{activeDataset?.xLabel}</text>
                        <text x={15} y={chartHeight / 2} textAnchor="middle" transform={`rotate(-90, 15, ${chartHeight / 2})`} fontSize="12" fill="#6b7280" fontWeight="bold">{activeDataset?.yLabel}</text>
                    </svg>
                </div>
            </div>
        </div>
    );
};

export default GrowthCharts;
