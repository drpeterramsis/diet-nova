
import React, { useState, useMemo, useEffect } from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import { mealCreatorDatabase, FoodItem } from "../../data/mealCreatorData";
import { supabase } from "../../lib/supabase";
import { FoodExchangeRow } from "../../data/exchangeData";
import { MacroDonut } from "../Visuals";
import { useAuth } from "../../contexts/AuthContext"; // Import Auth for Saving
import Toast from "../Toast"; // Import Toast for notifications

// --- Helper for Text Highlighting (Matching Day Food Planner) ---
const REGEX_HIGHLIGHT = /(\/|\(.*?\))/g;
const renderHighlightedText = (text: string) => {
    const parts = text.split(REGEX_HIGHLIGHT);
    return (
        <span>
            {parts.map((part, i) => 
                REGEX_HIGHLIGHT.test(part) 
                ? <span key={i} className="text-red-500 font-bold">{part}</span> 
                : part
            )}
        </span>
    );
};

// --- Interfaces for Save Functionality ---
interface MealMeta {
    tag: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack' | 'Drink';
    note: string;
}

export const SimpleMealCreator: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const { session } = useAuth();
  
  // Data States
  const [activeData, setActiveData] = useState<FoodItem[]>(mealCreatorDatabase);
  const [isLoading, setIsLoading] = useState(false);
  const [dataSource, setDataSource] = useState<'local' | 'cloud'>('local'); 
  const [searchQuery, setSearchQuery] = useState("");
  const [mealItems, setMealItems] = useState<{ item: FoodItem, serves: number }[]>([]);

  // Editing States
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [tempEditName, setTempEditName] = useState("");

  // Save/Load States
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [mealName, setMealName] = useState("");
  const [mealMeta, setMealMeta] = useState<MealMeta>({ tag: 'Lunch', note: '' });

  // --- Fetch Cloud Data ---
  const mapDBToItem = (row: FoodExchangeRow): FoodItem => ({
      name: row.food, group: row.food_group, serves: Number(row.serve), cho: Number(row.cho), protein: Number(row.protein), fat: Number(row.fat), fiber: Number(row.fiber), kcal: Number(row.kcal)
  });

  useEffect(() => {
      const fetchDB = async () => {
          setIsLoading(true);
          try {
              const { data, error } = await supabase.from('food_exchange').select('*').order('food', { ascending: true }).limit(2000);
              if (error) throw error;
              if (data && data.length > 0) { 
                  setActiveData(data.map(mapDBToItem)); 
                  setDataSource('cloud'); 
              } else {
                  setDataSource('local');
              }
          } catch (err) { 
              console.warn("Using local DB", err); 
              setDataSource('local'); 
          } finally { 
              setIsLoading(false); 
          }
      };
      fetchDB();
  }, []);

  const filteredFoods = useMemo(() => {
    if (!searchQuery) return activeData;
    const q = searchQuery.toLowerCase();
    return activeData.filter(f => f.name.toLowerCase().includes(q) || f.group.toLowerCase().includes(q));
  }, [searchQuery, activeData]);

  const addToMeal = (item: FoodItem) => {
      // Create a deep copy of item so editing name doesn't affect source data
      setMealItems(prev => [...prev, { item: { ...item }, serves: 1 }]);
      setSearchQuery("");
  };

  const updateServe = (index: number, val: number) => {
      setMealItems(prev => prev.map((it, i) => i === index ? { ...it, serves: Math.max(0, val) } : it));
  };

  const removeItem = (index: number) => {
      setMealItems(prev => prev.filter((_, i) => i !== index));
  };

  // --- Item Editing Logic ---
  const startEditing = (index: number, currentName: string) => {
      setEditingIndex(index);
      setTempEditName(currentName);
  };

  const saveEditing = () => {
      if (editingIndex !== null) {
          setMealItems(prev => prev.map((it, i) => i === editingIndex ? { ...it, item: { ...it.item, name: tempEditName } } : it));
          setEditingIndex(null);
          setTempEditName("");
      }
  };

  const cancelEditing = () => {
      setEditingIndex(null);
      setTempEditName("");
  };

  // --- Calculate Totals ---
  const totals = useMemo(() => {
      return mealItems.reduce((acc, { item, serves }) => ({
          kcal: acc.kcal + (item.kcal * serves),
          cho: acc.cho + (item.cho * serves),
          protein: acc.protein + (item.protein * serves),
          fat: acc.fat + (item.fat * serves),
          fiber: acc.fiber + (item.fiber * serves)
      }), { kcal: 0, cho: 0, protein: 0, fat: 0, fiber: 0 });
  }, [mealItems]);

  // --- Calculate Group Serves Summary with Kcal % ---
  const groupSummary = useMemo(() => {
      const groups: Record<string, { serves: number, kcal: number }> = {};
      
      mealItems.forEach(({ item, serves }) => {
          if (!groups[item.group]) {
              groups[item.group] = { serves: 0, kcal: 0 };
          }
          groups[item.group].serves += serves;
          groups[item.group].kcal += (item.kcal * serves);
      });
      
      return groups;
  }, [mealItems]);

  // --- Cloud Save Logic ---
  const handleSaveMeal = async () => {
      if (!mealName.trim()) {
          alert("Please enter a name for the meal.");
          return;
      }
      if (!session) return;

      setSaveStatus("Saving to cloud...");
      
      try {
          const payload = {
              user_id: session.user.id,
              name: mealName,
              tool_type: 'meal-creator', // Standard identifier
              data: {
                  addedFoods: mealItems, // Standard structure
                  tag: mealMeta.tag, // New: Meal Tag
                  note: mealMeta.note, // New: Meal Note
                  savedAt: new Date().toISOString()
              }
          };

          const { error } = await supabase.from('saved_meals').insert(payload);
          
          if (error) throw error;
          
          setSaveStatus("Meal Saved Successfully!");
          setTimeout(() => {
              setSaveStatus("");
              setShowSaveModal(false);
          }, 2000);

      } catch (err: any) {
          console.error(err);
          setSaveStatus("Error: " + err.message);
      }
  };

  return (
    <div className="max-w-6xl mx-auto animate-fade-in pb-12">
        <Toast message={saveStatus} />

        {/* Header Section */}
        <div className="mb-6 bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
                <h1 className="text-2xl font-bold text-green-700 flex items-center gap-2">
                    <span>🥗</span> Meal Builder
                </h1>
                <div className="flex items-center gap-2">
                    <p className="text-sm text-gray-500">Create a single meal using food exchanges.</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1 font-bold ${dataSource === 'cloud' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                        {dataSource === 'cloud' ? '☁️ Cloud DB' : '💾 Local DB'}
                    </span>
                </div>
            </div>
            
            <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto items-center">
                {/* Search Bar */}
                <div className="relative w-full md:w-80">
                    <input 
                        type="text" 
                        placeholder="Search food exchange..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none shadow-sm"
                        dir={isRTL ? 'rtl' : 'ltr'}
                    />
                    <span className={`absolute top-1/2 -translate-y-1/2 text-gray-400 left-3`}>🔍</span>
                    {searchQuery && (
                        <div className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded-b-lg shadow-xl max-h-80 overflow-y-auto z-50">
                            {isLoading ? <div className="p-4 text-center text-gray-400">Loading...</div> : 
                            filteredFoods.length === 0 ? <div className="p-4 text-center text-gray-400">No items found.</div> :
                            <ul className="divide-y divide-gray-50">
                                {filteredFoods.map((f, i) => (
                                    <li key={i} className="px-4 py-3 hover:bg-green-50 cursor-pointer flex justify-between items-center group transition-colors" onClick={() => addToMeal(f)}>
                                        <div className="text-left">
                                            <div className="font-medium text-gray-800 text-sm">
                                                {renderHighlightedText(f.name)}
                                            </div>
                                            <div className="text-xs text-gray-500 flex gap-2 mt-0.5">
                                                <span className="bg-gray-100 px-1.5 rounded">{f.group}</span>
                                                <span className="font-bold text-blue-600">{f.kcal} kcal</span>
                                            </div>
                                        </div>
                                        <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded font-bold group-hover:bg-green-200 transition-colors">+ Add</div>
                                    </li>
                                ))}
                            </ul>
                            }
                        </div>
                    )}
                </div>

                {/* Save Button */}
                {session && (
                    <button 
                        onClick={() => setShowSaveModal(true)}
                        className="bg-blue-600 text-white px-4 py-3 rounded-lg font-bold shadow-md hover:bg-blue-700 transition flex items-center gap-2 whitespace-nowrap"
                    >
                        <span>💾</span> Save
                    </button>
                )}
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Meal Items List (Left Column) */}
            <div className="lg:col-span-2 space-y-4">
                {mealItems.length === 0 ? (
                    <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-12 text-center text-gray-400">
                        <span className="text-4xl mb-2 block">🍽️</span>
                        <p>Search and add items to build your meal.</p>
                    </div>
                ) : (
                    mealItems.map((entry, idx) => {
                        const c = (entry.item.cho * entry.serves).toFixed(1);
                        const p = (entry.item.protein * entry.serves).toFixed(1);
                        const f = (entry.item.fat * entry.serves).toFixed(1);
                        const fib = (entry.item.fiber * entry.serves).toFixed(1);
                        const isEditing = editingIndex === idx;

                        return (
                            <div key={idx} className={`bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center gap-4 animate-fade-in group hover:border-green-200 transition-colors ${isEditing ? 'ring-2 ring-yellow-200 border-yellow-300' : ''}`}>
                                <div className="flex-grow w-full text-center sm:text-left">
                                    <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                                        {isEditing ? (
                                            <div className="flex gap-2 w-full">
                                                <input 
                                                    type="text" 
                                                    value={tempEditName} 
                                                    onChange={(e) => setTempEditName(e.target.value)} 
                                                    className="flex-grow border-b-2 border-yellow-400 outline-none text-sm font-bold bg-transparent"
                                                    autoFocus
                                                />
                                                <button onClick={saveEditing} className="text-green-600 text-xs font-bold">✓</button>
                                                <button onClick={cancelEditing} className="text-red-600 text-xs font-bold">✕</button>
                                            </div>
                                        ) : (
                                            <>
                                                <h3 className="font-bold text-gray-800 text-sm break-words">
                                                    {renderHighlightedText(entry.item.name)}
                                                </h3>
                                                <button 
                                                    onClick={() => startEditing(idx, entry.item.name)}
                                                    className="text-gray-300 hover:text-blue-500 transition opacity-0 group-hover:opacity-100"
                                                    title="Edit Text"
                                                >
                                                    ✎
                                                </button>
                                            </>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1">
                                        <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{entry.item.group}</span>
                                        <div className="flex gap-2 text-[10px] font-mono border-l pl-2 border-gray-200">
                                            <span className="text-blue-600 font-bold">C:{c}</span>
                                            <span className="text-red-600 font-bold">P:{p}</span>
                                            <span className="text-yellow-600 font-bold">F:{f}</span>
                                            <span className="text-green-600 font-bold">Fib:{fib}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-0 pt-3 sm:pt-0 mt-2 sm:mt-0 border-gray-100">
                                    <div className="text-center">
                                        <label className="block text-[9px] text-gray-400 font-bold uppercase mb-1">Serves</label>
                                        <input 
                                            type="number" 
                                            value={entry.serves} 
                                            step="0.5" 
                                            min="0"
                                            onChange={(e) => updateServe(idx, Number(e.target.value))}
                                            className="w-14 p-1 border rounded text-center font-bold text-green-700 text-sm focus:ring-1 focus:ring-green-500 outline-none" 
                                        />
                                    </div>
                                    <div className="w-16 text-right">
                                        <div className="font-mono font-bold text-gray-800 text-sm">{(entry.item.kcal * entry.serves).toFixed(0)}</div>
                                        <div className="text-[9px] text-gray-400 uppercase">kcal</div>
                                    </div>
                                    <button onClick={() => removeItem(idx)} className="text-red-300 hover:text-red-600 text-xl font-bold px-2 transition-colors ml-1">×</button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Meal Summary (Right Column) */}
            <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-green-500 sticky top-4">
                    <h3 className="font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
                        <span>📊</span> Meal Summary
                    </h3>
                    
                    <div className="flex justify-center mb-6">
                        <MacroDonut cho={totals.cho} pro={totals.protein} fat={totals.fat} totalKcal={totals.kcal} />
                    </div>

                    <div className="space-y-2 text-sm mb-6">
                        <div className="flex justify-between p-2 bg-blue-50 rounded border border-blue-100">
                            <span className="text-blue-800 font-medium">Carbs</span>
                            <span className="font-bold text-blue-700">{totals.cho.toFixed(1)}g</span>
                        </div>
                        <div className="flex justify-between p-2 bg-red-50 rounded border border-red-100">
                            <span className="text-red-800 font-medium">Protein</span>
                            <span className="font-bold text-red-700">{totals.protein.toFixed(1)}g</span>
                        </div>
                        <div className="flex justify-between p-2 bg-yellow-50 rounded border border-yellow-100">
                            <span className="text-yellow-800 font-medium">Fat</span>
                            <span className="font-bold text-yellow-700">{totals.fat.toFixed(1)}g</span>
                        </div>
                        <div className="flex justify-between p-2 bg-green-50 rounded border border-green-100">
                            <span className="text-green-800 font-medium">Fiber</span>
                            <span className="font-bold text-green-700">{totals.fiber.toFixed(1)}g</span>
                        </div>
                        <div className="flex justify-between p-3 bg-gray-100 rounded mt-2 font-bold text-lg border-t-2 border-gray-200">
                            <span>Total Energy</span>
                            <span>{totals.kcal.toFixed(0)} kcal</span>
                        </div>
                    </div>

                    {/* Summary Table of Serves Groups with % Kcal */}
                    {Object.keys(groupSummary).length > 0 && (
                        <div className="border-t pt-4">
                            <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 tracking-wider">Serves Distribution</h4>
                            <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                                <table className="w-full text-xs">
                                    <thead className="bg-gray-100 text-gray-600">
                                        <tr>
                                            <th className="p-2 text-left">Group</th>
                                            <th className="p-2 text-center">Serves</th>
                                            <th className="p-2 text-right">% Kcal</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {Object.entries(groupSummary).map(([group, data]) => {
                                            const itemData = data as { serves: number, kcal: number };
                                            const pct = totals.kcal > 0 ? (itemData.kcal / totals.kcal) * 100 : 0;
                                            return (
                                                <tr key={group}>
                                                    <td className="p-2 font-medium text-gray-700">{group}</td>
                                                    <td className="p-2 text-center font-bold text-gray-900">{itemData.serves.toFixed(1)}</td>
                                                    <td className="p-2 text-right text-blue-600 font-bold">{pct.toFixed(1)}%</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* SAVE MODAL */}
        {showSaveModal && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
                    <div className="p-5 bg-blue-50 border-b border-blue-100 flex justify-between items-center">
                        <h3 className="font-bold text-blue-900 text-lg">Save Meal to Cloud</h3>
                        <button onClick={() => setShowSaveModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Meal Name *</label>
                            <input 
                                type="text" 
                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                                placeholder="e.g., Post-Workout High Protein"
                                value={mealName}
                                onChange={e => setMealName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tag</label>
                            <div className="flex flex-wrap gap-2">
                                {['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Drink'].map(tag => (
                                    <button 
                                        key={tag}
                                        onClick={() => setMealMeta(prev => ({ ...prev, tag: tag as any }))}
                                        className={`px-3 py-1.5 rounded-full text-xs font-bold border transition ${mealMeta.tag === tag ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Notes</label>
                            <textarea 
                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none h-24" 
                                placeholder="Add optional notes..."
                                value={mealMeta.note}
                                onChange={e => setMealMeta(prev => ({ ...prev, note: e.target.value }))}
                            ></textarea>
                        </div>
                    </div>
                    <div className="p-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
                        <button onClick={() => setShowSaveModal(false)} className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-200 rounded-lg transition">Cancel</button>
                        <button onClick={handleSaveMeal} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition shadow-md">Save Meal</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
