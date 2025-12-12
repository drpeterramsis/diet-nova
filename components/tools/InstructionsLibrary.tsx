
import React, { useState, useMemo, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { instructionsDatabase, InstructionItem } from '../../data/instructionsData';
import { useAuth } from '../../contexts/AuthContext';

interface InstructionsLibraryProps {
    onClose?: () => void;
}

const InstructionsLibrary: React.FC<InstructionsLibraryProps> = ({ onClose }) => {
    const { t, isRTL } = useLanguage();
    const { profile } = useAuth();
    
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedInstruction, setSelectedInstruction] = useState<InstructionItem | null>(null);
    
    // Print customization state
    const [doctorName, setDoctorName] = useState(profile?.full_name || 'Dr. Peter Ramsis');
    const [clinicName, setClinicName] = useState('Diet-Nova Clinic');
    const [patientName, setPatientName] = useState('');
    const [printDate, setPrintDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        if(profile?.full_name) setDoctorName(profile.full_name);
    }, [profile]);

    const filteredItems = useMemo(() => {
        if (!searchQuery) return instructionsDatabase;
        const q = searchQuery.toLowerCase();
        return instructionsDatabase.filter(item => 
            item.title.toLowerCase().includes(q) || 
            item.titleAr.includes(q) ||
            item.content.toLowerCase().includes(q)
        );
    }, [searchQuery]);

    const handlePrint = () => {
        window.print();
    };

    // Helper to detect Arabic content for RTL alignment
    const isArabicText = (text: string) => {
        const arabicPattern = /[\u0600-\u06FF]/;
        return arabicPattern.test(text);
    };

    return (
        <div className="max-w-6xl mx-auto animate-fade-in pb-12">
            
            {/* Header / No Print */}
            <div className="flex justify-between items-center mb-6 bg-white p-6 rounded-xl shadow-sm border border-gray-100 no-print">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--color-heading)] flex items-center gap-2">
                        <span>📋</span> Client Instructions Library
                    </h1>
                    <p className="text-sm text-gray-500">Select, customize, and print instructions for your patients.</p>
                </div>
                {onClose && (
                    <button onClick={onClose} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition text-sm font-medium">
                        Close Tool
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Sidebar: List */}
                <div className="lg:col-span-4 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-fit no-print">
                    <div className="p-4 border-b border-gray-100 bg-gray-50">
                        <input 
                            type="text" 
                            placeholder="Search instructions..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-sm"
                            dir={isRTL ? 'rtl' : 'ltr'}
                        />
                    </div>
                    <div className="max-h-[600px] overflow-y-auto">
                        {filteredItems.map(item => (
                            <div 
                                key={item.id}
                                onClick={() => setSelectedInstruction(item)}
                                className={`p-4 border-b border-gray-50 cursor-pointer transition hover:bg-blue-50 ${selectedInstruction?.id === item.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
                            >
                                <h3 className="font-bold text-gray-800 text-sm">{item.title}</h3>
                                <p className="text-xs text-gray-500 font-arabic mt-1">{item.titleAr}</p>
                                <span className="inline-block mt-2 px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded-full uppercase tracking-wider">
                                    {item.category}
                                </span>
                            </div>
                        ))}
                        {filteredItems.length === 0 && (
                            <div className="p-8 text-center text-gray-400 text-sm">
                                No instructions found.
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Content: Preview & Print */}
                <div className="lg:col-span-8">
                    {selectedInstruction ? (
                        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                            {/* Controls (No Print) */}
                            <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-col md:flex-row justify-between items-end gap-4 no-print">
                                <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Doctor Name</label>
                                        <input type="text" value={doctorName} onChange={e => setDoctorName(e.target.value)} className="w-full p-1.5 border rounded text-xs" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Clinic Name</label>
                                        <input type="text" value={clinicName} onChange={e => setClinicName(e.target.value)} className="w-full p-1.5 border rounded text-xs" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Client Name</label>
                                        <input type="text" value={patientName} onChange={e => setPatientName(e.target.value)} className="w-full p-1.5 border rounded text-xs" placeholder="Optional" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Date</label>
                                        <input type="date" value={printDate} onChange={e => setPrintDate(e.target.value)} className="w-full p-1.5 border rounded text-xs" />
                                    </div>
                                </div>
                                <button 
                                    onClick={handlePrint}
                                    className="bg-gray-800 hover:bg-gray-900 text-white px-6 py-2 rounded-lg font-bold shadow-md transition flex items-center gap-2 whitespace-nowrap h-fit"
                                >
                                    <span>🖨️</span> Print
                                </button>
                            </div>

                            {/* Print Area */}
                            <div className="p-8 md:p-12 print:p-0 print:w-full print:h-full bg-white print:fixed print:top-0 print:left-0 print:z-[9999]">
                                {/* Print Header */}
                                <div className="border-b-2 border-gray-800 pb-4 mb-8 flex justify-between items-end">
                                    <div>
                                        <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">{clinicName}</h1>
                                        <p className="text-sm text-gray-600 mt-1">{doctorName}</p>
                                    </div>
                                    <div className="text-right text-sm">
                                        {patientName && <p><strong>Client:</strong> {patientName}</p>}
                                        <p><strong>Date:</strong> {printDate}</p>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="prose max-w-none">
                                    <div className="whitespace-pre-wrap leading-relaxed text-gray-800 text-sm md:text-base">
                                        {selectedInstruction.content.split('\n').map((line, i) => {
                                            const isAr = isArabicText(line);
                                            const dir = isAr ? 'rtl' : 'ltr';
                                            const alignClass = isAr ? 'text-right font-arabic' : 'text-left';
                                            const headerColor = isAr ? 'text-green-700' : 'text-blue-700';

                                            // Header Detection (Starts and ends with **)
                                            if (line.trim().startsWith('**') && line.trim().endsWith('**')) {
                                                return (
                                                    <h4 key={i} className={`font-bold text-lg mt-6 mb-3 ${alignClass} ${headerColor}`} dir={dir}>
                                                        {line.replace(/\*\*/g, '')}
                                                    </h4>
                                                );
                                            }
                                            
                                            // Bold parts logic
                                            if (line.includes('**')) {
                                                const parts = line.split(/(\*\*.*?\*\*)/g);
                                                return (
                                                    <div key={i} className={`mb-2 ${alignClass}`} dir={dir}>
                                                        {parts.map((part, j) => {
                                                            if (part.startsWith('**') && part.endsWith('**')) {
                                                                return <strong key={j} className="text-gray-900">{part.replace(/\*\*/g, '')}</strong>;
                                                            }
                                                            return part;
                                                        })}
                                                    </div>
                                                )
                                            }
                                            
                                            // Separator
                                            if (line.trim() === '---') {
                                                return <hr key={i} className="my-8 border-gray-200 border-t-2 border-dashed" />;
                                            }
                                            
                                            // Normal line
                                            return <div key={i} className={`mb-2 ${alignClass}`} dir={dir}>{line}</div>;
                                        })}
                                    </div>
                                </div>

                                {/* Print Footer */}
                                <div className="mt-16 pt-4 border-t border-gray-200 text-center text-xs text-gray-400">
                                    Instructions provided by {clinicName}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center h-96 text-gray-400">
                            <span className="text-4xl mb-2">📄</span>
                            <p>Select an instruction topic to preview</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InstructionsLibrary;
