
import React, { useState } from 'react';
import { labReferences, labPanels } from '../../data/labData';
import { useLanguage } from '../../contexts/LanguageContext';

const LabReference: React.FC = () => {
    const { t } = useLanguage();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredRefs = labReferences.filter(ref => 
        ref.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ref.rows.some(row => row.some(cell => cell.toLowerCase().includes(searchTerm.toLowerCase())))
    );

    return (
        <div className="max-w-6xl mx-auto animate-fade-in space-y-8 pb-12">
            
            {/* Header */}
            <div className="text-center space-y-4 mb-8">
                <h1 className="text-3xl font-bold text-[var(--color-heading)] flex items-center justify-center gap-3">
                    <span>🧬</span> {t.tools.labs.title}
                </h1>
                <p className="text-gray-600 max-w-2xl mx-auto">
                    Standard biochemical reference ranges and suggested test panels for clinical nutrition.
                </p>
            </div>

            {/* Panels Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {labPanels.map(panel => (
                    <div key={panel.id} className="card bg-white hover:shadow-lg transition-all border-t-4 border-t-[var(--color-primary)]">
                        <h3 className="font-bold text-lg text-gray-800 mb-1">{panel.title}</h3>
                        <p className="text-xs text-gray-500 font-arabic mb-4">{panel.titleAr}</p>
                        <ul className="space-y-1.5">
                            {panel.tests.map((test, i) => (
                                <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                                    <span className="text-[var(--color-primary)]">•</span>
                                    {test}
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            {/* Reference Ranges Section */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-800">Reference Ranges</h2>
                    <input 
                        type="text" 
                        placeholder="Search labs..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="p-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 masonry">
                    {filteredRefs.map((ref, idx) => (
                        <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden break-inside-avoid h-fit">
                            <div className="bg-gray-50 p-3 border-b border-gray-200 font-bold text-gray-700">
                                {ref.title}
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-100 text-gray-600">
                                        <tr>
                                            {ref.headers.map((h, i) => (
                                                <th key={i} className="p-2 text-left font-semibold">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {ref.rows.map((row, rIdx) => (
                                            <tr key={rIdx} className="hover:bg-blue-50/50">
                                                {row.map((cell, cIdx) => (
                                                    <td key={cIdx} className={`p-2 ${cIdx === 0 ? 'font-medium text-gray-800' : 'text-gray-600 font-mono'}`}>
                                                        {cell}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}
                </div>
                {filteredRefs.length === 0 && (
                    <div className="text-center py-10 text-gray-400">No references found.</div>
                )}
            </div>
        </div>
    );
};

export default LabReference;
