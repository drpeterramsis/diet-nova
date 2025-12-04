
import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { pediatricWaistData, WaistPercentileRow } from '../../data/pediatricData';

interface PediatricWaistProps {
    initialGender?: 'male' | 'female';
    initialAge?: number;
    initialWaist?: number;
    onClose?: () => void;
    onSave?: (note: string) => void;
}

const PediatricWaist: React.FC<PediatricWaistProps> = ({ initialGender, initialAge, initialWaist, onClose, onSave }) => {
    const { t } = useLanguage();
    const [gender, setGender] = useState<'male' | 'female'>(initialGender || 'male');
    const [age, setAge] = useState<number>(initialAge || 10);
    const [waist, setWaist] = useState<number>(initialWaist || 0);

    const data = gender === 'male' ? pediatricWaistData.male : pediatricWaistData.female;

    // Ensure age is within 2-19 range for calculation
    const clampedAge = Math.max(2, Math.min(19, age));
    
    const analysis = useMemo(() => {
        if (!waist || waist <= 0) return null;
        
        // Find exact age match or closest
        const ref = data.find(d => d.age === clampedAge);
        if (!ref) return null;

        let percentile = '';
        let color = '';
        let risk = '';

        if (waist < ref.p50) {
            percentile = '< 50th';
            color = 'text-green-600';
            risk = 'Normal';
        } else if (waist < ref.p75) {
            percentile = '50th - 75th';
            color = 'text-green-700';
            risk = 'Average / Normal';
        } else if (waist < ref.p90) {
            percentile = '75th - 90th';
            color = 'text-orange-500';
            risk = 'Increased Risk (Overweight)';
        } else {
            percentile = '> 90th';
            color = 'text-red-600';
            risk = 'High Risk (Central Obesity)';
        }

        return { percentile, color, risk, ref };
    }, [waist, clampedAge, data]);

    const handleSave = () => {
        if (!analysis || !onSave) return;
        const note = `[Pediatric Waist Analysis]
• Age: ${age}y, Gender: ${gender}
• Waist: ${waist} cm
• Percentile: ${analysis.percentile}
• Interpretation: ${analysis.risk} (Ref 90th: ${analysis.ref.p90} cm)`;
        onSave(note);
    };

    // --- Chart Logic ---
    const chartHeight = 300;
    const chartWidth = 600;
    const paddingX = 40;
    const paddingY = 30;
    
    // Scale X (Age 2 to 19)
    const getX = (a: number) => paddingX + ((a - 2) / (19 - 2)) * (chartWidth - paddingX * 2);
    
    // Scale Y (Waist 40 to 120 approx)
    const maxY = 120;
    const minY = 40;
    const getY = (w: number) => chartHeight - paddingY - ((w - minY) / (maxY - minY)) * (chartHeight - paddingY * 2);

    // Generate Paths
    const createPath = (key: keyof WaistPercentileRow) => {
        return 'M ' + data.map(d => `${getX(d.age)},${getY(d[key])}`).join(' L ');
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 max-w-4xl mx-auto animate-fade-in relative">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <span>📏</span> Pediatric Waist Analysis
                    </h2>
                    <p className="text-sm text-gray-500">Percentiles for ages 2-19 years (US 2007-2010)</p>
                </div>
                {onClose && (
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Controls */}
                <div className="space-y-6 bg-gray-50 p-4 rounded-xl h-fit">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">{t.kcal.gender}</label>
                        <div className="flex rounded-lg overflow-hidden border border-gray-300">
                            <button 
                                onClick={() => setGender('male')} 
                                className={`flex-1 py-2 text-sm font-bold ${gender === 'male' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'}`}
                            >
                                Male
                            </button>
                            <button 
                                onClick={() => setGender('female')} 
                                className={`flex-1 py-2 text-sm font-bold ${gender === 'female' ? 'bg-pink-600 text-white' : 'bg-white text-gray-600'}`}
                            >
                                Female
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Age (2-19y)</label>
                        <div className="flex items-center gap-2">
                            <input 
                                type="range" min="2" max="19" step="1" 
                                value={age} onChange={(e) => setAge(Number(e.target.value))}
                                className="flex-grow h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <input 
                                type="number" value={age} onChange={(e) => setAge(Number(e.target.value))}
                                className="w-16 p-2 border rounded text-center font-bold"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Waist Circ. (cm)</label>
                        <input 
                            type="number" 
                            value={waist || ''} onChange={(e) => setWaist(Number(e.target.value))}
                            className="w-full p-3 border-2 border-blue-200 rounded-lg text-lg font-bold text-center focus:border-blue-500 outline-none"
                            placeholder="e.g. 60"
                        />
                    </div>

                    {/* Result Card */}
                    {analysis ? (
                        <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm text-center">
                            <div className="text-xs text-gray-500 uppercase font-bold mb-1">Interpretation</div>
                            <div className={`text-xl font-extrabold mb-1 ${analysis.color}`}>{analysis.percentile}</div>
                            <div className={`text-sm font-medium ${analysis.color}`}>{analysis.risk}</div>
                            <div className="mt-3 text-xs text-gray-400 border-t pt-2">
                                Ref 90th: {analysis.ref.p90} cm
                            </div>
                            {onSave && (
                                <button 
                                    onClick={handleSave}
                                    className="mt-3 w-full bg-[var(--color-primary)] text-white py-2 rounded text-sm font-bold hover:bg-[var(--color-primary-hover)] transition shadow-sm"
                                >
                                    Save to Notes
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="text-center text-sm text-gray-400 py-4">Enter waist circumference to see analysis.</div>
                    )}
                </div>

                {/* Chart */}
                <div className="md:col-span-2">
                    <div className="border border-gray-200 rounded-xl bg-white p-4 shadow-inner relative overflow-hidden">
                        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto">
                            {/* Grid Lines */}
                            {[40, 60, 80, 100, 120].map(y => (
                                <line key={y} x1={paddingX} y1={getY(y)} x2={chartWidth - paddingX} y2={getY(y)} stroke="#f3f4f6" strokeWidth="1" />
                            ))}
                            {[2, 5, 10, 15, 19].map(a => (
                                <line key={a} x1={getX(a)} y1={paddingY} x2={getX(a)} y2={chartHeight - paddingY} stroke="#f3f4f6" strokeWidth="1" />
                            ))}

                            {/* Curves */}
                            <path d={createPath('p90')} fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray="5,5" />
                            <text x={getX(19)} y={getY(data[data.length-1].p90)} dx="5" dy="5" fontSize="10" fill="#ef4444">90th</text>

                            <path d={createPath('p75')} fill="none" stroke="#f97316" strokeWidth="2" strokeDasharray="5,5" />
                            <text x={getX(19)} y={getY(data[data.length-1].p75)} dx="5" dy="5" fontSize="10" fill="#f97316">75th</text>

                            <path d={createPath('p50')} fill="none" stroke="#22c55e" strokeWidth="2" />
                            <text x={getX(19)} y={getY(data[data.length-1].p50)} dx="5" dy="5" fontSize="10" fill="#22c55e">50th</text>

                            {/* User Point */}
                            {waist > 0 && (
                                <>
                                    <circle cx={getX(clampedAge)} cy={getY(waist)} r="6" fill={analysis?.color.replace('text-', 'bg-') || '#3b82f6'} stroke="white" strokeWidth="2" />
                                    <line x1={getX(clampedAge)} y1={paddingY} x2={getX(clampedAge)} y2={chartHeight - paddingY} stroke="#3b82f6" strokeWidth="1" strokeDasharray="2,2" opacity="0.5" />
                                    <line x1={paddingX} y1={getY(waist)} x2={chartWidth - paddingX} y2={getY(waist)} stroke="#3b82f6" strokeWidth="1" strokeDasharray="2,2" opacity="0.5" />
                                </>
                            )}

                            {/* Axes Labels */}
                            <text x={chartWidth/2} y={chartHeight - 5} textAnchor="middle" fontSize="12" fill="#6b7280">Age (Years)</text>
                            <text x="15" y={chartHeight/2} textAnchor="middle" transform={`rotate(-90, 15, ${chartHeight/2})`} fontSize="12" fill="#6b7280">Waist (cm)</text>
                            
                            {/* X Axis Ticks */}
                            {[2, 5, 10, 15, 19].map(a => (
                                <text key={a} x={getX(a)} y={chartHeight - 15} textAnchor="middle" fontSize="10" fill="#9ca3af">{a}</text>
                            ))}
                            {/* Y Axis Ticks */}
                            {[40, 60, 80, 100, 120].map(y => (
                                <text key={y} x={30} y={getY(y) + 3} textAnchor="end" fontSize="10" fill="#9ca3af">{y}</text>
                            ))}
                        </svg>
                    </div>
                    <div className="mt-2 text-[10px] text-gray-400 text-center">
                        Reference: Table 18. Waist circumference in centimeters for children and adolescents aged 2–19 years.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PediatricWaist;
