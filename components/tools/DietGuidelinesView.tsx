
import React from 'react';
import { dietGuidelinesData } from '../../data/dietGuidelinesData';

interface DietGuidelinesViewProps {
    selectedId: string;
    onSelect: (id: string) => void;
}

const DietGuidelinesView: React.FC<DietGuidelinesViewProps> = ({ selectedId, onSelect }) => {
    // Find the currently selected diet based on the prop passed from parent
    const selectedDiet = dietGuidelinesData.find(d => d.id === selectedId) || dietGuidelinesData[0];

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden flex flex-col md:flex-row h-[calc(100vh-200px)] animate-fade-in">
            {/* Sidebar List */}
            <div className="w-full md:w-1/3 lg:w-1/4 bg-gray-50 border-b md:border-b-0 md:border-r border-gray-200 overflow-y-auto">
                <div className="p-4 bg-gray-100 border-b border-gray-200 sticky top-0 z-10">
                    <h3 className="font-bold text-gray-700 flex items-center gap-2">
                        <span>🥗</span> Diet Guide Reference
                    </h3>
                </div>
                <div className="p-2 space-y-1">
                    {dietGuidelinesData.map((diet) => (
                        <button
                            key={diet.id}
                            onClick={() => onSelect(diet.id)}
                            className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-all duration-200 border ${
                                selectedId === diet.id
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
                        <div className="border-b border-gray-100 pb-4">
                            <h3 className="text-2xl font-bold text-gray-800 mb-2">{selectedDiet.name}</h3>
                            <div className="bg-blue-50 text-blue-800 px-4 py-3 rounded-lg border-l-4 border-blue-500 text-sm font-medium">
                                <strong>Focus:</strong> {selectedDiet.focus}
                            </div>
                        </div>

                        {/* Nutrient Table */}
                        {(Object.keys(selectedDiet.macronutrients).length > 0 || Object.keys(selectedDiet.micronutrients).length > 0) && (
                            <div>
                                <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 border-b pb-1">Nutrient Recommendations</h4>
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
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
                                            {/* Don't render a default checkmark if text starts with one */}
                                            {char.trim().startsWith('✅') || char.trim().startsWith('📉') || char.trim().startsWith('•') ? null : <span className="text-green-500 mt-1">✔</span>}
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
                                            {/* Don't render default warning if note starts with emoji */}
                                            {note.trim().startsWith('🛑') || note.trim().startsWith('⚠️') || note.trim().startsWith('🩸') || note.trim().startsWith('🍬') || note.trim().startsWith('🧠') ? null : <span className="text-orange-500 mt-0.5">⚠️</span>}
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
    );
};

export default DietGuidelinesView;