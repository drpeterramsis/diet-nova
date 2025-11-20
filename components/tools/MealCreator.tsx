import React, { useState, useMemo } from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import { mealCreatorDatabase, FoodItem } from "../../data/mealCreatorData";

const MealCreator: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [addedFoods, setAddedFoods] = useState<FoodItem[]>([]);

  // Search Logic
  const filteredFoods = useMemo(() => {
    if (!searchQuery) return [];
    const q = searchQuery.toLowerCase();
    return mealCreatorDatabase.filter(
      (food) => food.name.toLowerCase().includes(q) || food.group.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const addFood = (food: FoodItem) => {
    setAddedFoods([...addedFoods, { ...food, serves: 1 }]);
    setSearchQuery("");
  };

  const removeFood = (index: number) => {
    const newFoods = [...addedFoods];
    newFoods.splice(index, 1);
    setAddedFoods(newFoods);
  };

  const updateServes = (index: number, val: number) => {
    const newFoods = [...addedFoods];
    newFoods[index].serves = val;
    setAddedFoods(newFoods);
  };

  const resetCreator = () => {
    setAddedFoods([]);
    setSearchQuery("");
  };

  // Calculations
  const summary = useMemo(() => {
    let totalServes = 0, totalCHO = 0, totalProtein = 0, totalFat = 0, totalFiber = 0, totalKcal = 0;
    const groupSummary: Record<string, any> = {};

    addedFoods.forEach(food => {
      const s = food.serves;
      totalServes += s;
      totalCHO += food.cho * s;
      totalProtein += food.protein * s;
      totalFat += food.fat * s;
      totalFiber += food.fiber * s;
      totalKcal += food.kcal * s;

      if (!groupSummary[food.group]) {
        groupSummary[food.group] = { serves: 0, cho: 0, protein: 0, fat: 0, fiber: 0, kcal: 0 };
      }
      groupSummary[food.group].serves += s;
      groupSummary[food.group].cho += food.cho * s;
      groupSummary[food.group].protein += food.protein * s;
      groupSummary[food.group].fat += food.fat * s;
      groupSummary[food.group].fiber += food.fiber * s;
      groupSummary[food.group].kcal += food.kcal * s;
    });

    return { totalServes, totalCHO, totalProtein, totalFat, totalFiber, totalKcal, groupSummary };
  }, [addedFoods]);

  const percentages = useMemo(() => {
     const k = summary.totalKcal || 1;
     return {
         cho: ((summary.totalCHO * 4) / k * 100).toFixed(1),
         pro: ((summary.totalProtein * 4) / k * 100).toFixed(1),
         fat: ((summary.totalFat * 9) / k * 100).toFixed(1),
         fib: ((summary.totalFiber * 2) / k * 100).toFixed(1),
     }
  }, [summary]);

  return (
    <div className="max-w-6xl mx-auto animate-fade-in space-y-8">
      
      {/* Header & Search */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-[var(--color-heading)] bg-clip-text text-transparent bg-gradient-to-r from-[var(--color-primary-dark)] to-[var(--color-primary)]">
          {t.tools.mealCreator.title}
        </h1>
        
        <div className="relative max-w-xl mx-auto">
          <input
            type="text"
            className="w-full px-6 py-3 rounded-full border-2 border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none shadow-sm text-lg"
            placeholder={t.mealCreator.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            dir={isRTL ? 'rtl' : 'ltr'}
          />
          {searchQuery && filteredFoods.length > 0 && (
            <ul className="absolute w-full bg-white mt-2 rounded-xl shadow-xl max-h-60 overflow-y-auto z-50 border border-gray-100 text-right">
              {filteredFoods.map((food, idx) => (
                <li 
                  key={idx} 
                  onClick={() => addFood(food)}
                  className="px-4 py-3 hover:bg-green-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors"
                >
                  <div className="font-medium text-[var(--color-text)]">{food.name.replace(/\(.*?\)/g, '')}</div>
                  <div className="text-xs text-[var(--color-text-light)] flex justify-between">
                     <span>{food.group}</span>
                     <span className="text-red-500">{food.name.match(/\(.*?\)/g)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Added Foods Table */}
        <div className="lg:col-span-2 card bg-white shadow-lg overflow-hidden">
           <div className="flex justify-between items-center mb-4 px-2">
              <h3 className="font-bold text-lg text-[var(--color-heading)]">Meal Items</h3>
              <button onClick={resetCreator} className="text-red-500 text-sm hover:underline">{t.mealCreator.clear}</button>
           </div>
           
           <div className="overflow-x-auto">
             <table className="w-full">
               <thead className="bg-[var(--color-bg-soft)] text-[var(--color-heading)]">
                 <tr>
                   <th className="p-3 text-right w-1/2">{t.mealCreator.foodName}</th>
                   <th className="p-3 text-center">{t.mealCreator.serves}</th>
                   <th className="p-3 text-center">{t.mealCreator.kcal}</th>
                   <th className="p-3"></th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                 {addedFoods.map((food, idx) => (
                   <tr key={idx} className="hover:bg-gray-50">
                     <td className="p-3 text-right text-sm">
                       <div className="font-medium">{food.name.replace(/\(.*?\)/g, '')}</div>
                       <div className="text-xs text-gray-500">{food.group} <span className="text-red-400">{food.name.match(/\(.*?\)/g)}</span></div>
                     </td>
                     <td className="p-3 text-center">
                       <input 
                         type="number" 
                         min="0.25" 
                         step="0.25"
                         value={food.serves}
                         onChange={(e) => updateServes(idx, Number(e.target.value))}
                         className="w-16 text-center border rounded p-1 focus:ring-1 focus:ring-[var(--color-primary)]"
                       />
                     </td>
                     <td className="p-3 text-center font-mono text-blue-600">
                       {(food.kcal * food.serves).toFixed(0)}
                     </td>
                     <td className="p-3 text-center">
                       <button onClick={() => removeFood(idx)} className="text-red-400 hover:text-red-600 text-xl">×</button>
                     </td>
                   </tr>
                 ))}
                 {addedFoods.length === 0 && (
                   <tr>
                     <td colSpan={4} className="p-8 text-center text-gray-400 italic">
                       No food items added yet. Search above to add.
                     </td>
                   </tr>
                 )}
               </tbody>
             </table>
           </div>
        </div>

        {/* Right: Summary */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Total Summary Card */}
          <div className="card bg-gradient-to-b from-green-50 to-white border-green-200 shadow-lg">
            <h3 className="font-bold text-center text-[var(--color-primary-dark)] mb-4 border-b border-green-200 pb-2">
              {t.mealCreator.mealSummary}
            </h3>
            
            <div className="space-y-3 text-sm">
               <div className="flex justify-between p-2 bg-yellow-50 rounded border border-yellow-100">
                  <span>{t.mealCreator.total} (Serves)</span>
                  <span className="font-bold">{summary.totalServes.toFixed(2)}</span>
               </div>
               <div className="grid grid-cols-2 gap-2">
                 <div className="p-2 bg-blue-50 rounded text-center">
                   <div className="text-xs text-gray-500">CHO</div>
                   <div className="font-bold text-blue-700">{summary.totalCHO.toFixed(1)}g</div>
                   <div className="text-[10px] text-blue-400">{percentages.cho}%</div>
                 </div>
                 <div className="p-2 bg-red-50 rounded text-center">
                   <div className="text-xs text-gray-500">Protein</div>
                   <div className="font-bold text-red-700">{summary.totalProtein.toFixed(1)}g</div>
                   <div className="text-[10px] text-red-400">{percentages.pro}%</div>
                 </div>
                 <div className="p-2 bg-yellow-50 rounded text-center">
                   <div className="text-xs text-gray-500">Fat</div>
                   <div className="font-bold text-yellow-700">{summary.totalFat.toFixed(1)}g</div>
                   <div className="text-[10px] text-yellow-400">{percentages.fat}%</div>
                 </div>
                 <div className="p-2 bg-green-50 rounded text-center">
                   <div className="text-xs text-gray-500">Fiber</div>
                   <div className="font-bold text-green-700">{summary.totalFiber.toFixed(1)}g</div>
                 </div>
               </div>
               
               <div className="mt-4 p-4 bg-[var(--color-primary)] text-white rounded-xl text-center shadow-md">
                 <div className="text-sm opacity-90">{t.mealCreator.totalCalories}</div>
                 <div className="text-3xl font-bold">{summary.totalKcal.toFixed(0)}</div>
                 <div className="text-xs opacity-80">Kcal</div>
               </div>
            </div>
          </div>

          {/* Group Summary */}
          {Object.keys(summary.groupSummary).length > 0 && (
            <div className="card bg-white shadow">
              <h4 className="font-bold text-sm text-gray-600 mb-2">Group Breakdown</h4>
              <div className="space-y-1 text-xs">
                {Object.entries(summary.groupSummary).map(([group, val]: [string, any]) => (
                  <div key={group} className="flex justify-between items-center p-2 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition">
                    <span className="font-medium text-gray-700">{group}</span>
                    <div className="text-right">
                        <span className="font-mono text-[var(--color-primary)] font-bold block">{val.kcal.toFixed(0)} kcal</span>
                        <span className="text-[10px] text-gray-500 block">{val.serves.toFixed(2)} Serves</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
};

export default MealCreator;