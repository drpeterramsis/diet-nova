
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
  const [activeSystem, setActiveSystem] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState('');
  const [isSaving, setIsSaving] = useState(false);

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
        report += `\n${system.icon} ${system.name}:\n`;
        activeInSystem.forEach(item => {
          report += `- ${item.sign} (Possible: ${item.deficiency})\n`;
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
    
    // Append to existing notes
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
      
      // Auto-clear success message
      setTimeout(() => {
          setSaveStatus('');
          if(onBack) onBack(); // Go back to client profile after save
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
            <h1 className="text-2xl font-bold text-[var(--color-heading)]">Nutrition-Focused Physical Exam</h1>
            {client && <p className="text-sm text-gray-500">Assessment for: <span className="font-bold text-[var(--color-primary)]">{client.full_name}</span></p>}
          </div>
        </div>
        
        <div className="flex gap-2">
            {client ? (
                <button 
                    onClick={handleSaveToClient}
                    disabled={isSaving}
                    className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white px-6 py-2 rounded-lg font-bold shadow-md transition disabled:opacity-50"
                >
                    {isSaving ? 'Saving...' : '💾 Save to Notes'}
                </button>
            ) : (
                <button 
                    onClick={handleCopy}
                    className="bg-gray-800 hover:bg-gray-900 text-white px-6 py-2 rounded-lg font-bold shadow-md transition"
                >
                    📋 Copy Report
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
                    <h3 className="font-bold text-gray-800 flex-grow">{system.name}</h3>
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
                                    <div className={`w-4 h-4 mt-0.5 rounded border flex items-center justify-center ${isSelected ? 'bg-red-500 border-red-500' : 'border-gray-300'}`}>
                                        {isSelected && <span className="text-white text-xs">✓</span>}
                                    </div>
                                    <div>
                                        <div className={`text-sm font-medium ${isSelected ? 'text-red-700' : 'text-gray-700'}`}>
                                            {item.sign}
                                        </div>
                                        {isSelected && (
                                            <div className="text-xs text-red-500 font-medium mt-1 animate-fade-in">
                                                Poss. Deficiency: {item.deficiency}
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
  );
};

export default NFPEChecklist;
