import React, { useState, useMemo, useEffect } from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import { mealCreatorDatabase, FoodItem } from "../../data/mealCreatorData";
import { supabase } from "../../lib/supabase";
import { FoodExchangeRow } from "../../data/exchangeData";
import { MacroDonut } from "../Visuals";

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

export const SimpleMealCreator: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const [activeData, setActiveData] = useState<FoodItem[]>(mealCreatorDatabase);
  const [isLoading, setIsLoading] = useState(false);
  const [dataSource, setDataSource] = useState<'local' | 'cloud'>('local'); // Track DB source
  const [searchQuery, setSearchQuery] = useState("");
  const [mealItems, setMealItems] = useState<{ item: FoodItem, serves: number }[]>([]);

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
                  setDataSource('cloud'); // Update status
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
      setMealItems(prev => [...prev, { item, serves: 1 }]);
      setSearchQuery("");
  };

  const updateServe = (index: number, val: number) => {
      setMealItems(prev => prev.map((it, i) => i === index ? { ...it, serves: Math.max(0, val) } : it));
  };

  const removeItem = (index: number) => {
      setMealItems(prev => prev.filter((_, i) => i !== index));
  };

  // --- Calculate Totals (Updated to include Fiber) ---
  const totals = useMemo(() => {
      return mealItems.reduce((acc, { item, serves }) => ({
          kcal: acc.kcal + (item.kcal * serves),
          cho: acc.cho + (item.cho * serves),
          protein: acc.protein + (item.protein * serves),
          fat: acc.fat + (item.fat * serves),
          fiber: acc.fiber + (item.fiber * serves) // Added Fiber sum
      }), { kcal: 0, cho: 0, protein: 0, fat: 0, fiber: 0 });
  }, [mealItems]);

  // --- Calculate Group Serves Summary ---
  const groupSummary = useMemo(() => {
      const groups: Record<string, number> = {};
      mealItems.forEach(({ item, serves }) => {
          groups[item.group] = (groups[item.group] || 0) + serves;
      });
      return groups;
  }, [mealItems]);

  return (
    <div className="max-w-6xl mx-auto animate-fade-in pb-12">
        <div className="mb-6 bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
                <h1 className="text-2xl font-bold text-green-700 flex items-center gap-2">
                    <span>🥗</span> Meal Builder
                </h1>
                <div className="flex items-center gap-2">
                    <p className="text-sm text-gray-500">Create a single meal using food exchanges.</p>
                    {/* Cloud Database Sign Logo */}
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1 font-bold ${dataSource === 'cloud' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                        {dataSource === 'cloud' ? '☁️ Cloud DB' : '💾 Local DB'}
                    </span>
                </div>
            </div>
            <div className="relative w-full md:w-96">
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
                                // Formatted search result like Day Food Planner
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
                        // Calculate item specifics for display
                        const c = (entry.item.cho * entry.serves).toFixed(1);
                        const p = (entry.item.protein * entry.serves).toFixed(1);
                        const f = (entry.item.fat * entry.serves).toFixed(1);
                        const fib = (entry.item.fiber * entry.serves).toFixed(1);

                        return (
                            <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center gap-4 animate-fade-in group hover:border-green-200 transition-colors">
                                <div className="flex-grow w-full text-center sm:text-left">
                                    <h3 className="font-bold text-gray-800 text-sm">
                                        {renderHighlightedText(entry.item.name)}
                                    </h3>
                                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1">
                                        <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{entry.item.group}</span>
                                        {/* Nutrient Summary per Content */}
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
                        {/* Total Fibers Added */}
                        <div className="flex justify-between p-2 bg-green-50 rounded border border-green-100">
                            <span className="text-green-800 font-medium">Fiber</span>
                            <span className="font-bold text-green-700">{totals.fiber.toFixed(1)}g</span>
                        </div>
                        <div className="flex justify-between p-3 bg-gray-100 rounded mt-2 font-bold text-lg border-t-2 border-gray-200">
                            <span>Total Energy</span>
                            <span>{totals.kcal.toFixed(0)} kcal</span>
                        </div>
                    </div>

                    {/* Summary Table of Serves Groups */}
                    {Object.keys(groupSummary).length > 0 && (
                        <div className="border-t pt-4">
                            <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 tracking-wider">Serves Distribution</h4>
                            <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                                <table className="w-full text-xs">
                                    <thead className="bg-gray-100 text-gray-600">
                                        <tr>
                                            <th className="p-2 text-left">Group</th>
                                            <th className="p-2 text-right">Serves</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {Object.entries(groupSummary).map(([group, count]) => (
                                            <tr key={group}>
                                                <td className="p-2 font-medium text-gray-700">{group}</td>
                                                <td className="p-2 text-right font-bold text-gray-900">{(count as number).toFixed(1)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};
