
import React, { useState } from 'react';
import { nfpeData, NFPESystem, NFPEItem } from '../../data/nfpeData';
import { useLanguage } from '../../contexts/LanguageContext';
import { Client } from '../../types';
import { supabase } from '../../lib/supabase';

interface NFPEChecklistProps {
  client?: Client;
  onBack?: () => void;
}

const NFPEChecklist: React.FC<NFPEChecklistProps> = ({ client, onBack }) => {
  const { t } = useLanguage();
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [saveStatus, setSaveStatus] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  const toggleItem = (itemId: string) => {
    const newSet = new Set(selectedItems);
    if (newSet.has(itemId)) {
      newSet.delete(itemId);
    } else {
      newSet.add(itemId);
    }
    setSelectedItems(newSet);
  };

  const generateReport = () => {
    let report = "[NFPE Assessment Findings]\n";
    let hasFindings = false;

    nfpeData.forEach(system => {
      const activeInSystem = system.items.filter(i => selectedItems.has(i.id));
      if (activeInSystem.length > 0) {
        hasFindings = true;
        report += `\n${system.icon} ${system.name} (${system.nameAr}):\n`;
        activeInSystem.forEach(item => {
          report += `- ${item.sign} / ${item.signAr}\n  (Poss. Deficiency: ${item.deficiency} | ${item.deficiencyAr})\n`;
        });
      }
    });

    if (!hasFindings) report += "\nNo significant physical findings recorded.";
    
    report += `\n\nDate: ${new Date().toLocaleDateString('en-GB')}`;
    return report;
  };

  const handleSaveToClient = async () => {
    if (!client) return;
    setIsSaving(true);
    setSaveStatus('');

    const newNotes = generateReport();
    
    const updatedNotes = client.notes 
      ? `${client.notes}\n\n${newNotes}` 
      : newNotes;

    try {
      const { error } = await supabase
        .from('clients')
        .update({ notes: updatedNotes })
        .eq('id', client.id);

      if (error) throw error;
      setSaveStatus('Saved to Client Notes!');
      
      setTimeout(() => {
          setSaveStatus('');
          if(onBack) onBack(); 
      }, 1500);

    } catch (err: any) {
      console.error(err);
      setSaveStatus('Error saving: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = () => {
      navigator.clipboard.writeText(generateReport());
      setSaveStatus('Copied to clipboard!');
      setTimeout(() => setSaveStatus(''), 2000);
  };

  // Get selected items list for Summary
  const selectedList = nfpeData.flatMap(system => 
      system.items.filter(item => selectedItems.has(item.id)).map(item => ({...item, systemName: system.name, systemNameAr: system.nameAr}))
  );

  return (
    <div className="max-w-6xl mx-auto animate-fade-in pb-12">
      
      {/* Header */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          {onBack && (
               <button onClick={onBack} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg transition flex items-center gap-2 text-sm whitespace-nowrap">
                   <span>←</span> Back
               </button>
           )}
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-heading)]">NFPE Assessment</h1>
            <p className="text-sm text-gray-500">Nutrition Focused Physical Exam <span className="mx-1">|</span> الفحص البدني للتغذية</p>
            {client && <p className="text-sm mt-1 text-blue-600 font-bold">Client: {client.full_name}</p>}
          </div>
        </div>
        
        <div className="flex gap-2">
            <button 
                onClick={() => setShowSummary(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-bold shadow-md transition flex items-center gap-2"
            >
                <span>📑</span> Summary ({selectedItems.size})
            </button>
            {client ? (
                <button 
                    onClick={handleSaveToClient}
                    disabled={isSaving}
                    className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white px-4 py-2 rounded-lg font-bold shadow-md transition disabled:opacity-50"
                >
                    {isSaving ? 'Saving...' : '💾 Save Notes'}
                </button>
            ) : (
                <button 
                    onClick={handleCopy}
                    className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg font-bold shadow-md transition"
                >
                    📋 Copy
                </button>
            )}
        </div>
      </div>

      {saveStatus && (
          <div className={`mb-6 p-3 rounded-lg text-center font-bold ${saveStatus.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              {saveStatus}
          </div>
      )}

      {/* Grid of Systems */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {nfpeData.map((system: NFPESystem) => {
           const activeCount = system.items.filter(i => selectedItems.has(i.id)).length;
           
           return (
            <div key={system.id} className={`card bg-white transition-all duration-300 ${activeCount > 0 ? 'ring-2 ring-[var(--color-primary)] shadow-lg' : 'shadow-sm hover:shadow-md'}`}>
                <div className="flex items-center gap-3 mb-4 pb-2 border-b border-gray-100">
                    <span className="text-2xl">{system.icon}</span>
                    <div className="flex-grow">
                        <h3 className="font-bold text-gray-800">{system.name}</h3>
                        <p className="text-xs text-gray-500 font-arabic">{system.nameAr}</p>
                    </div>
                    {activeCount > 0 && (
                        <span className="bg-[var(--color-primary)] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                            {activeCount}
                        </span>
                    )}
                </div>
                
                <div className="space-y-2">
                    {system.items.map((item: NFPEItem) => {
                        const isSelected = selectedItems.has(item.id);
                        return (
                            <div 
                                key={item.id}
                                onClick={() => toggleItem(item.id)}
                                className={`p-2 rounded-lg cursor-pointer border transition-all ${
                                    isSelected 
                                    ? 'bg-red-50 border-red-200' 
                                    : 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-200'
                                }`}
                            >
                                <div className="flex items-start gap-2">
                                    <div className={`w-5 h-5 mt-1 rounded border flex flex-shrink-0 items-center justify-center ${isSelected ? 'bg-red-500 border-red-500' : 'border-gray-300'}`}>
                                        {isSelected && <span className="text-white text-xs">✓</span>}
                                    </div>
                                    <div className="flex-grow">
                                        <div className={`text-sm font-medium ${isSelected ? 'text-red-700' : 'text-gray-700'}`}>
                                            {item.sign}
                                        </div>
                                        <div className={`text-xs font-arabic ${isSelected ? 'text-red-600' : 'text-gray-500'}`}>
                                            {item.signAr}
                                        </div>
                                        {isSelected && (
                                            <div className="mt-2 pt-2 border-t border-red-100 text-xs text-red-800">
                                                <div className="flex justify-between">
                                                    <span className="font-bold">Deficiency:</span>
                                                    <span>{item.deficiency}</span>
                                                </div>
                                                <div className="text-right font-arabic opacity-80">{item.deficiencyAr}</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
           );
        })}
      </div>

      {/* Summary Modal */}
      {showSummary && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                  <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                      <h2 className="text-xl font-bold text-gray-800">Assessment Summary ({selectedList.length})</h2>
                      <button onClick={() => setShowSummary(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
                  </div>
                  
                  <div className="p-4 overflow-y-auto flex-grow bg-gray-50">
                      {selectedList.length === 0 ? (
                          <div className="text-center py-10 text-gray-500">
                              No signs selected. Please check items from the list.
                          </div>
                      ) : (
                          <div className="space-y-4">
                              {selectedList.map((item, idx) => (
                                  <div key={idx} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                                      <div className="flex flex-col md:flex-row gap-4 justify-between">
                                          {/* Sign */}
                                          <div className="md:w-1/3">
                                              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Observation / العلامة</div>
                                              <div className="font-bold text-gray-800">{item.sign}</div>
                                              <div className="text-gray-600 font-arabic text-sm">{item.signAr}</div>
                                              <div className="mt-1 inline-block px-2 py-0.5 bg-gray-100 text-xs rounded text-gray-500">{item.systemName}</div>
                                          </div>
                                          
                                          {/* Deficiency */}
                                          <div className="md:w-1/3 border-t md:border-t-0 md:border-l border-gray-100 pt-2 md:pt-0 md:pl-4">
                                               <div className="text-xs font-bold text-red-400 uppercase tracking-wider mb-1">Possible Deficiency / النقص</div>
                                               <div className="font-bold text-red-700">{item.deficiency}</div>
                                               <div className="text-red-600 font-arabic text-sm">{item.deficiencyAr}</div>
                                          </div>

                                          {/* Food */}
                                          <div className="md:w-1/3 border-t md:border-t-0 md:border-l border-gray-100 pt-2 md:pt-0 md:pl-4">
                                               <div className="text-xs font-bold text-green-600 uppercase tracking-wider mb-1">Dietary Suggestions / الغذاء</div>
                                               <div className="text-sm text-gray-700 font-medium">{item.food}</div>
                                               <div className="text-sm text-gray-600 font-arabic mt-1">{item.foodAr}</div>
                                          </div>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>

                  <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-white rounded-b-xl">
                      <button 
                        onClick={() => setShowSummary(false)}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                      >
                          Close
                      </button>
                      <button 
                        onClick={() => {
                            handleCopy();
                            setShowSummary(false);
                        }}
                        className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition font-bold shadow-sm"
                      >
                          Copy Text Report
                      </button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default NFPEChecklist;
