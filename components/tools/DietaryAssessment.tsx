
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { DietaryAssessmentData, SavedMeal } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import Toast from '../Toast';

interface DietaryAssessmentProps {
  initialData?: DietaryAssessmentData;
  onSave?: (data: DietaryAssessmentData) => Promise<void>;
  onClose: () => void;
  isSaving?: boolean;
}

const ROW_KEYS = [
  'preBreakfast',
  'breakfast', 
  'snack1', 
  'lunch', 
  'snack2', 
  'dinner', 
  'snack3', 
  'water', 
  'sports'
];

export const DietaryAssessment: React.FC<DietaryAssessmentProps> = ({ initialData, onSave, onClose, isSaving }) => {
  const { t, isRTL } = useLanguage();
  const { session } = useAuth();
  
  const [daysCount, setDaysCount] = useState<number>(1);
  const [dates, setDates] = useState<string[]>([]);
  const [gridData, setGridData] = useState<DietaryAssessmentData['recall']>({});
  const [timeData, setTimeData] = useState<Record<string, Record<string, string>>>({});
  
  // Standalone Save State
  const [saveStatus, setSaveStatus] = useState('');
  const [localIsSaving, setLocalIsSaving] = useState(false);
  const [savedName, setSavedName] = useState('');

  // Initialize
  useEffect(() => {
    if (initialData) {
      setDaysCount(initialData.days || 1);
      setDates(initialData.dates || []);
      setGridData(initialData.recall || {});
      setTimeData(initialData.times || {});
    } else {
      // Default: 1 day, today's date
      setDaysCount(1);
      setDates([new Date().toISOString().split('T')[0]]);
      setGridData({});
      setTimeData({});
    }
  }, [initialData]);

  // Adjust dates array when days count changes
  useEffect(() => {
    const newDates = [...dates];
    if (newDates.length < daysCount) {
      for (let i = newDates.length; i < daysCount; i++) {
        newDates.push('');
      }
    } else if (newDates.length > daysCount) {
      newDates.splice(daysCount);
    }
    setDates(newDates);
  }, [daysCount]);

  const handleGridChange = (rowKey: string, dayIndex: number, value: string) => {
    setGridData(prev => ({
      ...prev,
      [rowKey]: {
        ...prev[rowKey],
        [`day${dayIndex + 1}`]: value
      }
    }));
  };

  const handleTimeChange = (rowKey: string, dayIndex: number, value: string) => {
    setTimeData(prev => ({
      ...prev,
      [rowKey]: {
        ...prev[rowKey],
        [`day${dayIndex + 1}`]: value
      }
    }));
  };

  const handleDateChange = (index: number, val: string) => {
    const newDates = [...dates];
    newDates[index] = val;
    setDates(newDates);
  };

  const getDataObject = (): DietaryAssessmentData => ({
      days: daysCount,
      dates: dates,
      recall: gridData,
      times: timeData
  });

  const handleSaveClick = async () => {
    const data = getDataObject();
    
    // If external save handler is provided (e.g. ClientManager), use it
    if (onSave) {
        await onSave(data);
    } else {
        // Standalone Save
        await handleStandaloneSave(data);
    }
  };

  const handleStandaloneSave = async (data: DietaryAssessmentData) => {
      if (!session) {
          alert("Please login to save assessments.");
          return;
      }
      const name = prompt("Enter a name for this assessment:", savedName || "Assessment " + new Date().toLocaleDateString());
      if (!name) return;
      setSavedName(name);
      setLocalIsSaving(true);
      setSaveStatus('Saving to Library...');
      
      try {
          const { error } = await supabase.from('saved_meals').insert({
              user_id: session.user.id,
              name: name,
              tool_type: 'dietary-assessment',
              data: data,
              created_at: new Date().toISOString()
          });
          
          if (error) throw error;
          setSaveStatus('Saved Successfully!');
          setTimeout(() => setSaveStatus(''), 3000);
      } catch (err: any) {
          setSaveStatus('Error: ' + err.message);
      } finally {
          setLocalIsSaving(false);
      }
  };

  const handlePrint = () => {
      window.print();
  };

  const getRowLabel = (key: string) => {
    switch (key) {
      case 'preBreakfast': return t.dietary.meals.preBreakfast;
      case 'breakfast': return t.dietary.meals.breakfast;
      case 'snack1': return t.dietary.meals.snack;
      case 'lunch': return t.dietary.meals.lunch;
      case 'snack2': return t.dietary.meals.snack;
      case 'dinner': return t.dietary.meals.dinner;
      case 'snack3': return t.dietary.meals.snack;
      case 'water': return t.dietary.meals.water;
      case 'sports': return t.dietary.meals.sports;
      default: return key;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 flex flex-col h-full animate-fade-in overflow-hidden">
      <Toast message={saveStatus} />
      
      {/* Header */}
      <div className="p-6 bg-yellow-50 border-b border-yellow-200 flex justify-between items-center flex-shrink-0 no-print">
        <div>
          <h2 className="text-2xl font-bold text-yellow-800 flex items-center gap-2">
            <span>📅</span> {t.dietary.title}
          </h2>
          <p className="text-yellow-700 text-sm opacity-80">24hr - 7 Days Recall</p>
        </div>
        <div className="flex gap-2">
            <button onClick={handlePrint} className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 transition shadow-sm font-medium text-sm">
                🖨️ Print
            </button>
            <button onClick={onClose} className="bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50 transition shadow-sm font-medium text-sm">
                {t.common.back}
            </button>
        </div>
      </div>

      {/* Print Header */}
      <div className="hidden print:block text-center p-4 border-b-2 border-black">
          <h1 className="text-2xl font-bold uppercase">Dietary Assessment Report</h1>
          <p className="text-sm">Recall Period: {daysCount} Day(s)</p>
      </div>

      {/* Controls (No Print) */}
      <div className="p-4 bg-white border-b border-gray-100 flex items-center gap-4 flex-shrink-0 no-print">
        <label className="font-bold text-gray-700 text-sm">{t.dietary.days}:</label>
        <select 
          value={daysCount}
          onChange={(e) => setDaysCount(Number(e.target.value))}
          className="p-2 border rounded-lg bg-gray-50 font-bold focus:ring-2 focus:ring-yellow-400 outline-none"
        >
          {[1,2,3,4,5,6,7].map(d => (
            <option key={d} value={d}>{d} Day{d > 1 ? 's' : ''}</option>
          ))}
        </select>
      </div>

      {/* Grid Container - Scrollable */}
      <div className="flex-grow flex flex-col overflow-hidden p-4 bg-gray-50 print:bg-white print:p-0">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex-grow overflow-auto print:border-none print:shadow-none">
            <table className="w-full border-collapse">
            <thead>
                <tr>
                <th className="p-3 bg-yellow-100 text-yellow-900 border border-yellow-200 sticky left-0 top-0 z-50 w-48 text-left min-w-[150px] shadow-sm print:shadow-none print:border-gray-400 print:bg-gray-200">
                    Meal / Day
                </th>
                {Array.from({ length: daysCount }).map((_, i) => (
                    <th key={i} className="p-2 bg-yellow-50 border border-yellow-200 min-w-[220px] sticky top-0 z-40 shadow-sm print:shadow-none print:border-gray-400 print:bg-gray-100">
                    <div className="flex flex-col gap-1">
                        <span className="text-yellow-800 font-bold print:text-black">Day {i + 1}</span>
                        <input 
                        type="date" 
                        value={dates[i] || ''} 
                        onChange={(e) => handleDateChange(i, e.target.value)}
                        className="text-xs p-1 border rounded text-center bg-white/50 focus:bg-white print:border-none print:bg-transparent"
                        />
                    </div>
                    </th>
                ))}
                </tr>
            </thead>
            <tbody>
                {ROW_KEYS.map((rowKey) => (
                <tr key={rowKey}>
                    <td className="p-3 bg-gray-50 font-bold text-gray-700 border border-gray-200 sticky left-0 z-30 shadow-sm print:shadow-none print:border-gray-400 print:bg-gray-50">
                    {getRowLabel(rowKey)}
                    </td>
                    {Array.from({ length: daysCount }).map((_, i) => (
                    <td key={i} className="p-0 border border-gray-200 align-top print:border-gray-400">
                        <div className="flex flex-col h-full min-h-[100px]">
                            {/* Time Input */}
                            <div className="p-1 border-b border-gray-100 bg-gray-50/30 flex items-center gap-1 print:border-gray-300">
                                <span className="text-[9px] text-gray-400 uppercase font-bold">Time:</span>
                                <input 
                                    type="text" 
                                    placeholder="8:00 AM" 
                                    value={timeData[rowKey]?.[`day${i+1}`] || ''}
                                    onChange={(e) => handleTimeChange(rowKey, i, e.target.value)}
                                    className="text-[10px] w-full bg-transparent outline-none font-medium text-gray-600 focus:text-blue-700"
                                />
                            </div>
                            {/* Text Area */}
                            <textarea
                                className="w-full flex-grow p-2 resize-none focus:bg-yellow-50 outline-none text-sm block border-0 bg-transparent print:text-xs"
                                placeholder="..."
                                value={gridData[rowKey]?.[`day${i+1}`] || ''}
                                onChange={(e) => handleGridChange(rowKey, i, e.target.value)}
                                dir="auto"
                            />
                        </div>
                    </td>
                    ))}
                </tr>
                ))}
            </tbody>
            </table>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-white flex justify-end gap-3 flex-shrink-0 no-print">
        <button 
          onClick={onClose}
          className="px-6 py-2 rounded-lg text-gray-600 hover:bg-gray-100 font-medium transition"
        >
          {t.common.cancel}
        </button>
        <button 
          onClick={handleSaveClick}
          disabled={isSaving || localIsSaving}
          className="px-8 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white font-bold shadow-md transition disabled:opacity-50 flex items-center gap-2"
        >
          {(isSaving || localIsSaving) ? 'Saving...' : t.common.save}
        </button>
      </div>

    </div>
  );
};