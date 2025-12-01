
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
  const [activeTab, setActiveTab] = useState<'assessment' | 'summary'>('assessment');

  const toggleItem = (itemId: string) => {
    const newSet = new Set(selectedItems);
    if (newSet.has(itemId)) {
      newSet.delete(itemId);
    } else {
      newSet.add(itemId);
    }
    setSelectedItems(newSet);
  };

  const generateReportText = () => {
    let report = `[NFPE Assessment - ${new Date().toLocaleDateString('en-GB')}]\n`;
    let hasFindings = false;

    nfpeData.forEach(system => {
      const activeInSystem = system.items.filter(i => selectedItems.has(i.id));
      if (activeInSystem.length > 0) {
        hasFindings = true;
        report += `\n${system.icon} ${system.name} (${system.nameAr}):\n`;
        activeInSystem.forEach(item => {
          report += `• ${item.sign} / ${item.signAr}\n`;
          report += `  - Deficiency: ${item.deficiency} | ${item.deficiencyAr}\n`;
          report += `  - Suggestion: ${item.food} | ${item.foodAr}\n`;
        });
      }
    });

    if (!hasFindings) report += "\nNo significant physical findings recorded.";
    
    return report;
  };

  const handleSaveToClient = async () => {
    if (!client) return;
    setIsSaving(true);
    setSaveStatus('');

    const newNotes = generateReportText();
    
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
      navigator.clipboard.writeText(generateReportText());
      setSaveStatus('Copied to clipboard!');
      setTimeout(() => setSaveStatus(''), 2000);
  };

  // Organize findings for the summary tab
  const activeFindingsBySystem = nfpeData.map(system => ({
      ...system,
      items: system.items.filter(item => selectedItems.has(item.id))
  })).filter(sys => sys.items.length > 0);

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
        
        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
             <button 
                onClick={() => setActiveTab('assessment')}
                className={`px-4 py-2 rounded-md text-sm font-bold transition ${activeTab === 'assessment' ? 'bg-white text-[var(--color-primary)] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
             >
                 Checklist
             </button>
             <button 
                onClick={() => setActiveTab('summary')}
                className={`px-4 py-2 rounded-md text-sm font-bold transition ${activeTab === 'summary' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
             >
                 Report ({selectedItems.size})
             </button>
        </div>
      </div>

      {saveStatus && (
          <div className={`mb-6 p-3 rounded-lg text-center font-bold ${saveStatus.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              {saveStatus}
          </div>
      )}

      {/* ASSESSMENT TAB */}
      {activeTab === 'assessment' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
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
                                            {/* Minimal hint in checklist view, full details in summary */}
                                            {isSelected && (
                                                <div className="mt-1 text-[10px] text-red-500 font-medium">
                                                    Possible Def: {item.deficiency}
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
      )}

      {/* SUMMARY TAB */}
      {activeTab === 'summary' && (
          <div className="animate-fade-in space-y-6">
              <div className="bg-purple-50 p-6 rounded-xl border border-purple-100 flex justify-between items-center">
                   <div>
                       <h2 className="text-xl font-bold text-purple-900">Assessment Summary</h2>
                       <p className="text-sm text-purple-700">Review selected signs and nutritional recommendations.</p>
                   </div>
                   <div className="flex gap-2">
                        {client ? (
                            <button 
                                onClick={handleSaveToClient}
                                disabled={isSaving}
                                className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white px-6 py-2 rounded-lg font-bold shadow-md transition disabled:opacity-50"
                            >
                                {isSaving ? 'Saving...' : '💾 Save to Profile'}
                            </button>
                        ) : (
                            <button 
                                onClick={handleCopy}
                                className="bg-gray-800 hover:bg-gray-900 text-white px-6 py-2 rounded-lg font-bold shadow-md transition"
                            >
                                📋 Copy Text
                            </button>
                        )}
                   </div>
              </div>

              {activeFindingsBySystem.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300 text-gray-400">
                      <div className="text-4xl mb-3">🩺</div>
                      <p className="font-medium">No physical signs selected.</p>
                      <p className="text-sm">Go to the "Checklist" tab to record your findings.</p>
                  </div>
              ) : (
                  <div className="space-y-6">
                      {activeFindingsBySystem.map(sys => (
                          <div key={sys.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                              <div className="bg-gray-50 p-4 border-b border-gray-200 flex items-center gap-3">
                                  <span className="text-2xl">{sys.icon}</span>
                                  <div>
                                      <h3 className="font-bold text-gray-800">{sys.name}</h3>
                                      <p className="text-xs text-gray-500 font-arabic">{sys.nameAr}</p>
                                  </div>
                              </div>
                              <div className="divide-y divide-gray-100">
                                  {sys.items.map(item => (
                                      <div key={item.id} className="p-4 hover:bg-gray-50 transition">
                                          <div className="flex flex-col md:flex-row gap-6">
                                              
                                              {/* 1. Symptom & Image */}
                                              <div className="md:w-1/3 space-y-3">
                                                  <div>
                                                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Symptom / العلامة</span>
                                                      <div className="font-bold text-gray-800 text-lg leading-tight">{item.sign}</div>
                                                      <div className="text-gray-600 font-arabic text-sm">{item.signAr}</div>
                                                  </div>
                                                  {item.image && (
                                                      <div className="w-full h-32 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                                          <img src={item.image} alt={item.sign} className="w-full h-full object-cover" />
                                                      </div>
                                                  )}
                                              </div>

                                              {/* 2. Deficiency Info */}
                                              <div className="md:w-1/3 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
                                                   <span className="text-xs font-bold text-red-500 uppercase tracking-wider block mb-1">Nutrients / Deficiency</span>
                                                   <div className="font-bold text-red-700 text-lg">{item.deficiency}</div>
                                                   <div className="text-red-600 font-arabic text-sm">{item.deficiencyAr}</div>
                                              </div>

                                              {/* 3. Nutrition Advice */}
                                              <div className="md:w-1/3 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
                                                   <span className="text-xs font-bold text-green-600 uppercase tracking-wider block mb-1">Suggested Nutrition</span>
                                                   <div className="font-medium text-gray-800">{item.food}</div>
                                                   <div className="text-sm text-gray-600 font-arabic mt-1">{item.foodAr}</div>
                                              </div>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      ))}
                  </div>
              )}
          </div>
      )}

    </div>
  );
};

export default NFPEChecklist;
