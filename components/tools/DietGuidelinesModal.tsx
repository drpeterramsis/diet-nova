
import React, { useState } from 'react';
import { dietGuidelinesData, DietGuideline } from '../../data/dietGuidelinesData';

interface DietGuidelinesModalProps {
    onClose: () => void;
}

const DietGuidelinesModal: React.FC<DietGuidelinesModalProps> = ({ onClose }) => {
    const [selectedDietId, setSelectedDietId] = useState<string>(dietGuidelinesData[0].id);

    const selectedDiet = dietGuidelinesData.find(d => d.id === selectedDietId) || dietGuidelinesData[0];

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[150] p-4 backdrop-blur-sm animate-fade-in no-print">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden border border-gray-100">
                {/* Header */}
                <div className="p-5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex justify-between items-center flex-shrink-0">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <span>🥗</span> Diet Guidelines Reference
                        </h2>
                        <p className="text-xs text-blue-100 opacity-90">Standard protocols and nutritional breakdowns</p>
                    </div>
                    <button onClick={onClose} className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition">
                        ✕
                    </button>
                </div>

                <div className="flex flex-grow overflow-hidden">
                    {/* Sidebar List */}
                    <div className="w-1/3 min-w-[220px] bg-gray-50 border-r border-gray-200 overflow-y-auto">
                        <div className="p-2 space-y-1">
                            {dietGuidelinesData.map((diet) => (
                                <button
                                    key={diet.id}
                                    onClick={() => setSelectedDietId(diet.id)}
                                    className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-all duration-200 border ${
                                        selectedDietId === diet.id
                                            ? 'bg-white border-blue-500 text-blue-700 shadow-sm font-bold border-l-4'
                                            : 'bg-transparent border-transparent text-gray-600 hover:bg-gray-100'
                                    }`}
                                >
                                    {diet.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Detail View */}
                    <div className="flex-grow bg-white overflow-y-auto p-6 md:p-8">
                        {selectedDiet && (
                            <div className="space-y-8 animate-fade-in">
                                {/* Title & Focus */}
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-800 mb-2">{selectedDiet.name}</h3>
                                    <div className="bg-blue-50 text-blue-800 px-4 py-3 rounded-lg border-l-4 border-blue-500 text-sm font-medium">
                                        <strong>Focus:</strong> {selectedDiet.focus}
                                    </div>
                                </div>

                                {/* Nutrient Table */}
                                {(Object.keys(selectedDiet.macronutrients).length > 0 || Object.keys(selectedDiet.micronutrients).length > 0) && (
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 border-b pb-1">Nutrient Recommendations</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Macros */}
                                            {Object.keys(selectedDiet.macronutrients).length > 0 && (
                                                <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                                                    <table className="w-full text-sm">
                                                        <thead className="bg-gray-100 text-gray-600 font-bold">
                                                            <tr><th className="p-2 text-left">Macronutrient</th><th className="p-2 text-right">Target</th></tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-200">
                                                            {selectedDiet.macronutrients.carb && <tr><td className="p-2">Carbohydrates</td><td className="p-2 text-right font-bold text-blue-600">{selectedDiet.macronutrients.carb}</td></tr>}
                                                            {selectedDiet.macronutrients.protein && <tr><td className="p-2">Protein</td><td className="p-2 text-right font-bold text-red-600">{selectedDiet.macronutrients.protein}</td></tr>}
                                                            {selectedDiet.macronutrients.fat && <tr><td className="p-2">Total Fat</td><td className="p-2 text-right font-bold text-yellow-600">{selectedDiet.macronutrients.fat}</td></tr>}
                                                            {selectedDiet.macronutrients.sfa && <tr><td className="p-2 pl-4 text-xs text-gray-500">Saturated (SFA)</td><td className="p-2 text-right font-mono text-xs">{selectedDiet.macronutrients.sfa}</td></tr>}
                                                            {selectedDiet.macronutrients.pufa && <tr><td className="p-2 pl-4 text-xs text-gray-500">Polyunsat (PUFA)</td><td className="p-2 text-right font-mono text-xs">{selectedDiet.macronutrients.pufa}</td></tr>}
                                                            {selectedDiet.macronutrients.mufa && <tr><td className="p-2 pl-4 text-xs text-gray-500">Monounsat (MUFA)</td><td className="p-2 text-right font-mono text-xs">{selectedDiet.macronutrients.mufa}</td></tr>}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                            {/* Micros */}
                                            {Object.keys(selectedDiet.micronutrients).length > 0 && (
                                                <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden h-fit">
                                                    <table className="w-full text-sm">
                                                        <thead className="bg-gray-100 text-gray-600 font-bold">
                                                            <tr><th className="p-2 text-left">Micronutrient</th><th className="p-2 text-right">Target</th></tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-200">
                                                            {selectedDiet.micronutrients.sodium && <tr><td className="p-2">Sodium</td><td className="p-2 text-right font-bold">{selectedDiet.micronutrients.sodium}</td></tr>}
                                                            {selectedDiet.micronutrients.cholesterol && <tr><td className="p-2">Cholesterol</td><td className="p-2 text-right font-bold">{selectedDiet.micronutrients.cholesterol}</td></tr>}
                                                            {selectedDiet.micronutrients.fiber && <tr><td className="p-2">Fiber</td><td className="p-2 text-right font-bold text-green-600">{selectedDiet.micronutrients.fiber}</td></tr>}
                                                            {selectedDiet.micronutrients.minerals && <tr><td className="p-2">Key Minerals</td><td className="p-2 text-right text-xs">{selectedDiet.micronutrients.minerals}</td></tr>}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Characteristics */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 border-b pb-1">Key Characteristics</h4>
                                        <ul className="space-y-2">
                                            {selectedDiet.characteristics.map((char, idx) => (
                                                <li key={idx} className="text-sm text-gray-700 flex gap-2 items-start">
                                                    <span className="text-green-500 mt-1">✔</span>
                                                    <span>{char}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Notes */}
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 border-b pb-1">Clinical Notes & Restrictions</h4>
                                        <ul className="space-y-2">
                                            {selectedDiet.notes.map((note, idx) => (
                                                <li key={idx} className="text-sm text-gray-700 flex gap-2 items-start bg-yellow-50 p-2 rounded border border-yellow-100">
                                                    <span className="text-orange-500 mt-0.5">⚠️</span>
                                                    <span>{note}</span>
                                                </li>
                                            ))}
                                            {selectedDiet.notes.length === 0 && <li className="text-sm text-gray-400 italic">No specific restrictions listed.</li>}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Footer */}
                <div className="p-4 bg-gray-50 border-t border-gray-200 text-right">
                    <button 
                        onClick={onClose} 
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-lg font-bold transition"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DietGuidelinesModal;
