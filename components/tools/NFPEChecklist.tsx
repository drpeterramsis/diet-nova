
import React, { useState, useEffect, useMemo } from 'react';
import { nfpeData, NFPESystem, NFPEItem } from '../../data/nfpeData';
import { useLanguage } from '../../contexts/LanguageContext';
import { Client } from '../../types';
import { supabase } from '../../lib/supabase';
import Toast from '../Toast';

interface NFPEChecklistProps {
  client?: Client;
  onBack?: () => void;
}

const NFPEChecklist: React.FC<NFPEChecklistProps> = ({ client, onBack }) => {
  const { t, isRTL } = useLanguage();
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [saveStatus, setSaveStatus] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'assessment' | 'summary'>('assessment');
  const [searchQuery, setSearchQuery] = useState('');

  // Load existing state if available
  useEffect(() => {
    if (client && client.nfpe_data && client.nfpe_data.selectedItems) {
        setSelectedItems(new Set(client.nfpe_data.selectedItems));
    }
  }, [client]);

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

  // Logic 1: Save State Only (Checklist State)
  const handleSaveState = async () => {
      if (!client) return;
      setIsSaving(true);
      setSaveStatus('Saving...');
      
      try {
          // This requires the 'nfpe_data' column in Supabase 'clients' table.
          const { error } = await supabase
            .from('clients')
            .update({ 
                nfpe_data: { 
                    selectedItems: Array.from(selectedItems),
                    updatedAt: new Date().toISOString()
                } 
            })
            .eq('id', client.id);

          if (error) {
              if (error.message && error.message.includes("column \"nfpe_data\" of relation \"clients\" does not exist")) {
                  throw new Error("Missing DB Column. Please check settings.");
              }
              throw error;
          }
          setSaveStatus('Checklist Saved Successfully!');
          setTimeout(() => setSaveStatus(''), 2000);
      } catch (err: any) {
          console.error("Save State Error:", err);
          setSaveStatus('Error: ' + (err.message || 'Check database schema'));
      } finally {
          setIsSaving(false);
      }
  };

  // Logic 2: Save to Notes (Legacy / Printable)
  const handleSaveToNotes = async () => {
    if (!client) return;
    setIsSaving(true);
    setSaveStatus('Saving...');

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
      setSaveStatus('Report appended to Notes!');
      setTimeout(() => setSaveStatus(''), 2000);
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

  // Filter systems and items based on search query
  const filteredSystems = useMemo(() => {
      if (!searchQuery) return nfpeData;
      const q = searchQuery.toLowerCase();
      
      return nfpeData.map(system => ({
          ...system,
          items: system.items.filter(item => 
              item.sign.toLowerCase().includes(q) || 
              item.signAr.includes(q) || 
              item.deficiency.toLowerCase().includes(q)
          )
      })).filter(system => system.items.length > 0);
  }, [searchQuery]);

  // Organize findings for the summary tab
  const activeFindingsBySystem = useMemo(() => {
      return nfpeData.map(system => ({
        ...system,
        items: system.items.filter(item => selectedItems.has(item.id))
      })).filter(sys => sys.items.length > 0);
  }, [selectedItems]);

  // Aggregated Summary Logic (Bilingual)
  const aggregatedSummary = useMemo(() => {
      const defs = new Set<string>();
      const defsAr = new Set<string>();
      const foods = new Set<string>();
      const foodsAr = new Set<string>();

      nfpeData.forEach(sys => {
          sys.items.forEach(item => {
              if (selectedItems.has(item.id)) {
                  // English Deficiencies
                  item.deficiency.split(/,|&|\//).forEach(d => {
                      const trimD = d.trim();
                      if (trimD && !trimD.toLowerCase().includes('deficiency')) defs.add(trimD);
                  });
                  // Arabic Deficiencies
                  item.deficiencyAr.split(/,|،|\//).forEach(d => {
                      const trimD = d.trim();
                      if (trimD) defsAr.add(trimD);
                  });
                  
                  // English Foods
                  item.food.split(/,|&|\//).forEach(f => {
                      foods.add(f.trim());
                  });
                  // Arabic Foods
                  item.foodAr.split(/,|،|\//).forEach(f => {
                      foodsAr.add(f.trim());
                  });
              }
          });
      });

      return {
          deficiencies: Array.from(defs).sort(),
          deficienciesAr: Array.from(defsAr).sort(),
          foods: Array.from(foods).sort(),
          foodsAr: Array.from(foodsAr).sort()
      };
  }, [selectedItems]);

  return (
    <div className="max-w-6xl mx-auto animate-fade-in pb-12">
      <Toast message={saveStatus} />
      
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

      {/* ASSESSMENT TAB */}
      {activeTab === 'assessment' && (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                 <div className="relative w-full md:w-96">
                    <input 
                        type="text" 
                        placeholder="Search signs, deficiencies..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full p-2.5 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                        dir={isRTL ? 'rtl' : 'ltr'}
                    />
                    <span className={`absolute top-1/2 -translate-y-1/2 text-gray-400 left-3`}>🔍</span>
                 </div>

                 {client && (
                    <button 
                        onClick={handleSaveState}
                        disabled={isSaving}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold shadow-md transition disabled:opacity-50 text-sm flex items-center gap-2 no-print"
                    >
                        💾 Save Checklist State
                    </button>
                 )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                {filteredSystems.map((system: NFPESystem) => {
                const activeCount = system.items.filter(i => selectedItems.has(i.id)).length;
                
                return (
                    <div key={system.id} className={`card bg-white transition-all duration-300 ${activeCount > 0 ? 'ring-2 ring-[var(--color-primary)] shadow-lg' : 'shadow-sm hover:shadow-md'}`}>
                        <div className="flex items-center gap-3 mb-4 pb-2 border-b border-gray-100">
                            <span className="text-2xl">{system.icon}</span>
                            <div>
                                <h3 className="font-bold text-gray-800">{system.name}</h3>
                                <p className="text-xs text-gray-500">{system.nameAr}</p>
                            </div>
                            {activeCount > 0 && (
                                <span className="ml-auto bg-[var(--color-primary)] text-white text-xs font-bold px-2 py-1 rounded-full">
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
                                        className={`p-3 rounded-lg border cursor-pointer transition-all ${isSelected ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100 hover:border-gray-300'}`}
                                    >
                                        <div className="flex items-start gap-2">
                                            <div className={`mt-1 w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'bg-red-500 border-red-500' : 'border-gray-300'}`}>
                                                {isSelected && <span className="text-white text-[10px]">✓</span>}
                                            </div>
                                            <div>
                                                <p className={`text-sm font-medium ${isSelected ? 'text-red-700' : 'text-gray-700'}`}>
                                                    {item.sign}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-0.5">{item.signAr}</p>
                                                
                                                {isSelected && (
                                                    <div className="mt-2 text-xs bg-white bg-opacity-60 p-2 rounded">
                                                        <p className="font-bold text-red-600">Possible Deficiency:</p>
                                                        <p>{item.deficiency}</p>
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
        </div>
      )}

      {/* SUMMARY REPORT TAB */}
      {activeTab === 'summary' && (
          <div className="animate-fade-in space-y-8">
              {/* Findings Section */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Recorded Findings</h3>
                  {activeFindingsBySystem.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No findings recorded yet.</p>
                  ) : (
                      <div className="grid grid-cols-1 gap-6">
                          {activeFindingsBySystem.map(system => (
                              <div key={system.id}>
                                  <h4 className="font-bold text-[var(--color-primary)] flex items-center gap-2 mb-2">
                                      <span>{system.icon}</span> {system.name}
                                  </h4>
                                  <div className="space-y-2 pl-4 border-l-2 border-gray-100">
                                      {system.items.map(item => (
                                          <div key={item.id} className="bg-gray-50 p-3 rounded-lg">
                                              <p className="font-bold text-gray-800">{item.sign}</p>
                                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 text-sm">
                                                  <div>
                                                      <span className="text-red-600 font-bold block text-xs uppercase">Deficiency</span>
                                                      {item.deficiency}
                                                  </div>
                                                  <div>
                                                      <span className="text-green-600 font-bold block text-xs uppercase">Food Sources</span>
                                                      {item.food}
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

              {/* Aggregated Deficiencies */}
              {activeFindingsBySystem.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-red-50 rounded-xl border border-red-200 p-6">
                          <h3 className="text-lg font-bold text-red-800 mb-4 flex items-center gap-2">
                              <span>⚠️</span> Potential Deficiencies
                          </h3>
                          <div className="flex flex-wrap gap-2">
                              {aggregatedSummary.deficiencies.map((def, idx) => (
                                  <span key={idx} className="bg-white text-red-700 px-3 py-1 rounded-full text-sm font-medium border border-red-100 shadow-sm">
                                      {def}
                                  </span>
                              ))}
                          </div>
                      </div>

                      <div className="bg-green-50 rounded-xl border border-green-200 p-6">
                          <h3 className="text-lg font-bold text-green-800 mb-4 flex items-center gap-2">
                              <span>🥗</span> Recommended Foods
                          </h3>
                          <div className="flex flex-wrap gap-2">
                              {aggregatedSummary.foods.map((food, idx) => (
                                  <span key={idx} className="bg-white text-green-700 px-3 py-1 rounded-full text-sm font-medium border border-green-100 shadow-sm">
                                      {food}
                                  </span>
                              ))}
                          </div>
                      </div>
                  </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 no-print">
                  <button 
                      onClick={handleCopy}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-bold transition"
                  >
                      Copy to Clipboard
                  </button>
                  {client && (
                      <button 
                          onClick={handleSaveToNotes}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-bold transition shadow-md"
                      >
                          Append to Client Notes
                      </button>
                  )}
                  <button 
                      onClick={() => window.print()}
                      className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg font-bold transition shadow-md"
                  >
                      Print Report
                  </button>
              </div>
          </div>
      )}
    </div>
  );
};

export default NFPEChecklist;
