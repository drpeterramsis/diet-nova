
import React, { useState, useMemo, useEffect } from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import { mealCreatorDatabase, FoodItem } from "../../data/mealCreatorData";
import { supabase } from "../../lib/supabase";
import { FoodExchangeRow } from "../../data/exchangeData";
import { MacroDonut } from "../Visuals";

export const SimpleMealCreator: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const [activeData, setActiveData] = useState<FoodItem[]>(mealCreatorDatabase);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mealItems, setMealItems] = useState<{ item: FoodItem, serves: number }[]>([]);

  // Fetch Cloud Data (Same logic as MealPlanner/MealCreator)
  const mapDBToItem = (row: FoodExchangeRow): FoodItem => ({
      name: row.food, group: row.food_group, serves: Number(row.serve), cho: Number(row.cho), protein: Number(row.protein), fat: Number(row.fat), fiber: Number(row.fiber), kcal: Number(row.kcal)
  });

  useEffect(() => {
      const fetchDB = async () => {
          setIsLoading(true);
          try {
              const { data, error } = await supabase.from('food_exchange').select('*').order('food', { ascending: true }).limit(2000);
              if (error) throw error;
              if (data && data.length > 0) { setActiveData(data.map(mapDBToItem)); }
          } catch (err) { console.warn("Using local DB", err); } finally { setIsLoading(false); }
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

  const totals = useMemo(() => {
      return mealItems.reduce((acc, { item, serves }) => ({
          kcal: acc.kcal + (item.kcal * serves),
          cho: acc.cho + (item.cho * serves),
          protein: acc.protein + (item.protein * serves),
          fat: acc.fat + (item.fat * serves)
      }), { kcal: 0, cho: 0, protein: 0, fat: 0 });
  }, [mealItems]);

  return (
    <div className="max-w-6xl mx-auto animate-fade-in pb-12">
        <div className="mb-6 bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
                <h1 className="text-2xl font-bold text-green-700 flex items-center gap-2">
                    <span>🥗</span> Meal Builder
                </h1>
                <p className="text-sm text-gray-500">Create a single meal using food exchanges.</p>
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
                    <div className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded-b-lg shadow-xl max-h-60 overflow-y-auto z-50">
                        {isLoading ? <div className="p-4 text-center text-gray-400">Loading...</div> : 
                         filteredFoods.length === 0 ? <div className="p-4 text-center text-gray-400">No items found.</div> :
                         filteredFoods.map((item, idx) => (
                             <div key={idx} onClick={() => addToMeal(item)} className="p-3 hover:bg-green-50 cursor-pointer border-b border-gray-50 flex justify-between items-center">
                                 <div>
                                     <div className="font-bold text-gray-800 text-sm">{item.name}</div>
                                     <div className="text-[10px] text-gray-500">{item.group} • {item.kcal} kcal</div>
                                 </div>
                                 <span className="text-green-600 font-bold text-lg">+</span>
                             </div>
                         ))
                        }
                    </div>
                )}
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
                {mealItems.length === 0 ? (
                    <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-12 text-center text-gray-400">
                        <span className="text-4xl mb-2 block">🍽️</span>
                        <p>Search and add items to build your meal.</p>
                    </div>
                ) : (
                    mealItems.map((entry, idx) => (
                        <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 animate-fade-in">
                            <div className="flex-grow">
                                <h3 className="font-bold text-gray-800">{entry.item.name}</h3>
                                <p className="text-xs text-gray-500">{entry.item.group}</p>
                            </div>
                            <div className="text-center">
                                <label className="block text-[10px] text-gray-400 font-bold uppercase mb-1">Serves</label>
                                <input 
                                    type="number" 
                                    value={entry.serves} 
                                    step="0.5" 
                                    min="0"
                                    onChange={(e) => updateServe(idx, Number(e.target.value))}
                                    className="w-16 p-1 border rounded text-center font-bold text-green-700" 
                                />
                            </div>
                            <div className="w-20 text-right">
                                <div className="font-mono font-bold text-gray-800">{(entry.item.kcal * entry.serves).toFixed(0)}</div>
                                <div className="text-[10px] text-gray-400">kcal</div>
                            </div>
                            <button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600 text-xl font-bold px-2">×</button>
                        </div>
                    ))
                )}
            </div>

            <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-green-500">
                    <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Meal Summary</h3>
                    <div className="flex justify-center mb-6">
                        <MacroDonut cho={totals.cho} pro={totals.protein} fat={totals.fat} totalKcal={totals.kcal} />
                    </div>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between p-2 bg-blue-50 rounded"><span>Carbs</span><span className="font-bold text-blue-700">{totals.cho.toFixed(1)}g</span></div>
                        <div className="flex justify-between p-2 bg-red-50 rounded"><span>Protein</span><span className="font-bold text-red-700">{totals.protein.toFixed(1)}g</span></div>
                        <div className="flex justify-between p-2 bg-yellow-50 rounded"><span>Fat</span><span className="font-bold text-yellow-700">{totals.fat.toFixed(1)}g</span></div>
                        <div className="flex justify-between p-3 bg-gray-100 rounded mt-2 font-bold text-lg border-t-2 border-gray-200"><span>Total Energy</span><span>{totals.kcal.toFixed(0)} kcal</span></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};
