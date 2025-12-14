
import React, { useState, useMemo, useEffect } from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import { mealCreatorDatabase, FoodItem } from "../../data/mealCreatorData";
import { MacroDonut, ProgressBar } from "../Visuals";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { SavedMeal } from "../../types";
import Toast from "../Toast";
import { FoodExchangeRow } from "../../data/exchangeData";

interface MealCreatorProps {
    initialLoadId?: string | null;
    autoOpenLoad?: boolean;
    autoOpenNew?: boolean;
}

type MealTime = 'Pre-Breakfast' | 'Breakfast' | 'Morning Snack' | 'Lunch' | 'Afternoon Snack' | 'Dinner' | 'Late Snack';
const MEAL_TIMES: MealTime[] = ['Pre-Breakfast', 'Breakfast', 'Morning Snack', 'Lunch', 'Afternoon Snack', 'Dinner', 'Late Snack'];

interface PlannerItem extends FoodItem {
    selected: boolean;
    optionGroup: 'A' | 'B'; // Main or Alternative
}

interface DayPlan {
    [key: string]: PlannerItem[];
}

interface WeeklyPlan {
    [day: number]: DayPlan;
}

// Regex to detect text like "(150 gm)" or "(1)"
const REGEX_PARENS = /(\(\d+.*?\))/g;

const renderHighlightedText = (text: string) => {
    const parts = text.split(REGEX_PARENS);
    return (
        <span>
            {parts.map((part, i) => 
                REGEX_PARENS.test(part) 
                ? <span key={i} className="text-red-500 font-bold">{part}</span> 
                : part
            )}
        </span>
    );
};

const MealCreator: React.FC<MealCreatorProps> = ({ initialLoadId, autoOpenLoad, autoOpenNew }) => {
  const { t, isRTL } = useLanguage();
  const { session } = useAuth();
  
  // Data Source State
  const [activeData, setActiveData] = useState<FoodItem[]>(mealCreatorDatabase);
  const [dataSource, setDataSource] = useState<'local' | 'cloud'>('local');
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');

  // Weekly Planner State (Default 7 Days)
  const [currentDay, setCurrentDay] = useState<number>(1);
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan>({
      1: MEAL_TIMES.reduce((acc, time) => ({ ...acc, [time]: [] }), {})
  });
  
  // UI State
  const [searchQuery, setSearchQuery] = useState("");
  const [targetKcal, setTargetKcal] = useState<number>(2000);
  const [showAddMenu, setShowAddMenu] = useState<number | null>(null); // Index of item in search results

  // Save/Load State
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [planName, setPlanName] = useState('');
  const [loadedPlanId, setLoadedPlanId] = useState<string | null>(null);
  const [lastSavedName, setLastSavedName] = useState<string>('');
  const [savedPlans, setSavedPlans] = useState<SavedMeal[]>([]);
  const [statusMsg, setStatusMsg] = useState('');
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [loadSearchQuery, setLoadSearchQuery] = useState('');

  // --- 1. Database Integration ---
  const mapDBToItem = (row: FoodExchangeRow): FoodItem => ({
      name: row.food,
      group: row.food_group,
      serves: Number(row.serve),
      cho: Number(row.cho),
      protein: Number(row.protein),
      fat: Number(row.fat),
      fiber: Number(row.fiber),
      kcal: Number(row.kcal)
  });

  const mapItemToDB = (item: FoodItem): FoodExchangeRow => ({
      food: item.name,
      food_group: item.group,
      serve: item.serves,
      cho: item.cho,
      protein: item.protein,
      fat: item.fat,
      fiber: item.fiber,
      kcal: item.kcal
  });

  useEffect(() => {
      const fetchDB = async () => {
          setIsLoadingData(true);
          try {
              const { data, error } = await supabase
                  .from('food_exchange')
                  .select('*')
                  .order('food', { ascending: true })
                  .limit(2000);

              if (error) throw error;

              if (data && data.length > 0) {
                  const mapped = data.map(mapDBToItem);
                  setActiveData(mapped);
                  setDataSource('cloud');
              } else {
                  console.log("No cloud data found, using local.");
                  setDataSource('local');
              }
          } catch (err) {
              console.warn("Using local exchange data. DB Error:", err);
              setDataSource('local');
          } finally {
              setIsLoadingData(false);
          }
      };
      fetchDB();
  }, []);

  const handleSyncToCloud = async () => {
      if (!session) return;
      if (!window.confirm("This will upload local exchange items to the Supabase database. Continue?")) return;
      setSyncMsg('Syncing...');
      try {
          const payload = mealCreatorDatabase.map(mapItemToDB);
          const { error } = await supabase.from('food_exchange').insert(payload);
          
          if (error) throw error;
          setSyncMsg('Success! Data uploaded.');
          window.location.reload(); 
      } catch (err: any) {
          console.error(err);
          setSyncMsg('Error: ' + err.message);
      }
  };

  // --- 2. Search Logic ---
  const filteredFoods = useMemo(() => {
    if (!searchQuery) return [];
    const q = searchQuery.toLowerCase();
    return activeData.filter(
      (food) => food.name.toLowerCase().includes(q) || food.group.toLowerCase().includes(q)
    );
  }, [searchQuery, activeData]);

  // --- 3. Planner Logic ---
  
  // Helper to ensure current day structure exists
  const ensureDayExists = (day: number) => {
      setWeeklyPlan(prev => {
          if (prev[day]) return prev;
          return {
              ...prev,
              [day]: MEAL_TIMES.reduce((acc, time) => ({ ...acc, [time]: [] }), {})
          };
      });
  };

  useEffect(() => {
      ensureDayExists(currentDay);
  }, [currentDay]);

  const addToPlan = (food: FoodItem, mealTime: MealTime, optionGroup: 'A' | 'B' = 'A') => {
      setWeeklyPlan(prev => {
          const currentDayPlan = prev[currentDay] || MEAL_TIMES.reduce((acc, time) => ({ ...acc, [time]: [] }), {});
          const currentList = currentDayPlan[mealTime] || [];
          
          return {
              ...prev,
              [currentDay]: {
                  ...currentDayPlan,
                  [mealTime]: [...currentList, { ...food, serves: 1, selected: true, optionGroup }]
              }
          };
      });
      setSearchQuery("");
      setShowAddMenu(null);
  };

  const removeFromPlan = (mealTime: string, index: number) => {
      setWeeklyPlan(prev => {
          const currentDayPlan = prev[currentDay];
          const newList = [...currentDayPlan[mealTime]];
          newList.splice(index, 1);
          return {
              ...prev,
              [currentDay]: {
                  ...currentDayPlan,
                  [mealTime]: newList
              }
          };
      });
  };

  const updateItem = (mealTime: string, index: number, field: keyof PlannerItem, value: any) => {
      setWeeklyPlan(prev => {
          const currentDayPlan = prev[currentDay];
          const newList = [...currentDayPlan[mealTime]];
          newList[index] = { ...newList[index], [field]: value };
          return {
              ...prev,
              [currentDay]: {
                  ...currentDayPlan,
                  [mealTime]: newList
              }
          };
      });
  };

  // Toggle Entire Option Group (A or B)
  const toggleGroup = (mealTime: string, group: 'A' | 'B', status: boolean) => {
      setWeeklyPlan(prev => {
          const currentDayPlan = prev[currentDay];
          const newList = currentDayPlan[mealTime].map(item => 
              item.optionGroup === group ? { ...item, selected: status } : item
          );
          return {
              ...prev,
              [currentDay]: {
                  ...currentDayPlan,
                  [mealTime]: newList
              }
          };
      });
  };

  const resetPlanner = () => {
      if(!confirm("Clear all days?")) return;
      setWeeklyPlan({ 1: MEAL_TIMES.reduce((acc, time) => ({ ...acc, [time]: [] }), {}) });
      setCurrentDay(1);
      setPlanName("");
      setLoadedPlanId(null);
      setLastSavedName("");
  };

  const clearDay = () => {
      if(!confirm("Clear current day only?")) return;
      setWeeklyPlan(prev => ({
          ...prev,
          [currentDay]: MEAL_TIMES.reduce((acc, time) => ({ ...acc, [time]: [] }), {})
      }));
  };

  // --- 4. Calculations (Current Day Only) ---
  const summary = useMemo(() => {
    let totalServes = 0, totalCHO = 0, totalProtein = 0, totalFat = 0, totalFiber = 0, totalKcal = 0;
    
    const currentDayPlan = weeklyPlan[currentDay];
    if (!currentDayPlan) return { totalServes: 0, totalCHO: 0, totalProtein: 0, totalFat: 0, totalFiber: 0, totalKcal: 0 };

    (Object.values(currentDayPlan) as PlannerItem[][]).forEach(mealList => {
        mealList.forEach(item => {
            if (item.selected) { // Only count if checkbox is active
                const s = item.serves;
                totalServes += s;
                totalCHO += item.cho * s;
                totalProtein += item.protein * s;
                totalFat += item.fat * s;
                totalFiber += item.fiber * s;
                totalKcal += item.kcal * s;
            }
        });
    });

    return { totalServes, totalCHO, totalProtein, totalFat, totalFiber, totalKcal };
  }, [weeklyPlan, currentDay]);

  const percentages = useMemo(() => {
     const k = summary.totalKcal || 1;
     return {
         cho: ((summary.totalCHO * 4) / k * 100).toFixed(1),
         pro: ((summary.totalProtein * 4) / k * 100).toFixed(1),
         fat: ((summary.totalFat * 9) / k * 100).toFixed(1),
     }
  }, [summary]);

  // --- 5. Save/Load --- (Same logic, new structure)
  const fetchPlans = async () => {
    if (!session) return;
    setIsLoadingPlans(true);
    setLoadSearchQuery('');
    try {
        const { data, error } = await supabase
          .from('saved_meals')
          .select('*')
          .eq('tool_type', 'day-planner') // New Type
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        if (data) setSavedPlans(data);
    } catch (err) {
        console.error('Error fetching plans:', err);
        setStatusMsg("Error loading plans.");
    } finally {
        setIsLoadingPlans(false);
    }
  };

  const savePlan = async () => {
    if (!planName.trim()) {
        alert("Please enter a plan name.");
        return;
    }
    if (!session) return;
    
    setStatusMsg("Saving...");
    // Save the WHOLE week structure
    const planData = { weeklyPlan, targetKcal };
    const isUpdate = loadedPlanId && (planName === lastSavedName);

    try {
        let data;
        if (isUpdate) {
            const { data: updated, error } = await supabase
                .from('saved_meals')
                .update({ name: planName, data: planData })
                .eq('id', loadedPlanId)
                .eq('user_id', session.user.id)
                .select()
                .single();
            if (error) throw error;
            data = updated;
        } else {
            const { data: inserted, error } = await supabase
                .from('saved_meals')
                .insert({
                    user_id: session.user.id,
                    name: planName,
                    tool_type: 'day-planner',
                    data: planData,
                    created_at: new Date().toISOString()
                })
                .select()
                .single();
            if (error) throw error;
            data = inserted;
        }
        
        if (data) {
            setLoadedPlanId(data.id);
            setLastSavedName(data.name);
            setStatusMsg(isUpdate ? "Plan Updated Successfully!" : "Plan Saved Successfully!");
        }
        
        fetchPlans(); 
        setTimeout(() => setStatusMsg(''), 3000);
    } catch (err: any) {
        console.error('Error saving:', err);
        setStatusMsg("Failed to save: " + err.message);
    }
  };

  const loadPlan = (plan: SavedMeal) => {
    if (!plan.data) return;
    
    // Handle Legacy (Single Day) vs New (Weekly)
    if (plan.data.weeklyPlan) {
        setWeeklyPlan(plan.data.weeklyPlan);
    } else if (plan.data.dayPlan) {
        // Legacy convert
        setWeeklyPlan({ 1: plan.data.dayPlan });
    }

    if (plan.data.targetKcal) setTargetKcal(plan.data.targetKcal);
    setPlanName(plan.name);
    setLoadedPlanId(plan.id); 
    setLastSavedName(plan.name); 
    setShowLoadModal(false);
    setStatusMsg(t.common.loadSuccess);
    setTimeout(() => setStatusMsg(''), 3000);
  };

  // Filter Saved Plans Logic
  const filteredSavedPlans = useMemo(() => {
      if (!loadSearchQuery) return savedPlans;
      const q = loadSearchQuery.toLowerCase();
      return savedPlans.filter(plan => plan.name.toLowerCase().includes(q));
  }, [savedPlans, loadSearchQuery]);

  // Handle Initial Load
  useEffect(() => {
      if (initialLoadId && session) {
          const autoLoad = async () => {
              const { data } = await supabase.from('saved_meals').select('*').eq('id', initialLoadId).single();
              if (data) loadPlan(data);
          };
          autoLoad();
      }
  }, [initialLoadId]);

  // --- Print Logic ---
  const handlePrint = (mode: 'day' | 'week') => {
      // Add a class to body to control CSS printing logic if needed, or just rely on CSS media queries
      const printArea = document.getElementById('print-area');
      if (printArea) {
          if (mode === 'day') {
              document.body.classList.add('print-day-only');
              document.body.classList.remove('print-week');
          } else {
              document.body.classList.add('print-week');
              document.body.classList.remove('print-day-only');
          }
          window.print();
          // Reset
          document.body.classList.remove('print-day-only');
          document.body.classList.remove('print-week');
      }
  };

  return (
    <div className="max-w-[1920px] mx-auto animate-fade-in space-y-6 pb-12">
      <Toast message={statusMsg || syncMsg} />

      {/* Header & Search */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col xl:flex-row justify-between items-center gap-6 sticky top-20 z-40 no-print">
          <div className="text-center xl:text-left">
              <h1 className="text-3xl font-bold text-[var(--color-heading)] bg-clip-text text-transparent bg-gradient-to-r from-[var(--color-primary-dark)] to-[var(--color-primary)]">
                  Day Food Planner
              </h1>
              <p className="text-sm text-gray-500 mt-1 flex items-center gap-2 justify-center xl:justify-start">
                  Plan meals, check alternatives, and track daily intake.
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${dataSource === 'cloud' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
                      {dataSource === 'cloud' ? '☁️ Cloud DB' : '💾 Local Data'}
                  </span>
              </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full max-w-xl">
              <input
                type="text"
                className="w-full px-6 py-3 rounded-full border-2 border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none shadow-sm text-lg"
                placeholder={t.mealCreator.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                dir={isRTL ? 'rtl' : 'ltr'}
              />
              {/* Search Results Dropdown */}
              {searchQuery && filteredFoods.length > 0 && (
                <ul className="absolute w-full bg-white mt-2 rounded-xl shadow-2xl max-h-80 overflow-y-auto z-50 border border-gray-100 text-right">
                  {filteredFoods.map((food, idx) => (
                    <li 
                      key={idx} 
                      className="px-4 py-3 hover:bg-green-50 border-b border-gray-50 last:border-0 transition-colors flex justify-between items-center group relative"
                      onMouseEnter={() => setShowAddMenu(idx)}
                      onMouseLeave={() => setShowAddMenu(null)}
                    >
                      <div className="flex-grow text-left cursor-pointer" onClick={() => addToPlan(food, 'Lunch')}>
                          <div className="font-medium text-[var(--color-text)]">
                              {renderHighlightedText(food.name)}
                          </div>
                          <div className="text-xs text-[var(--color-text-light)] flex justify-between">
                             <span>{food.group}</span>
                             <span className="font-bold text-blue-600">{food.kcal.toFixed(0)} kcal</span>
                          </div>
                      </div>
                      
                      {/* Add Button with Dropdown */}
                      <div className="flex items-center gap-2 flex-wrap justify-end max-w-[200px]">
                          <button 
                             onClick={() => addToPlan(food, 'Pre-Breakfast')}
                             className="text-[10px] bg-purple-100 text-purple-800 px-2 py-1 rounded hover:bg-purple-200"
                          >
                              Pre-B
                          </button>
                          <button 
                             onClick={() => addToPlan(food, 'Breakfast')}
                             className="text-[10px] bg-orange-100 text-orange-800 px-2 py-1 rounded hover:bg-orange-200"
                          >
                              Break
                          </button>
                          <button 
                             onClick={() => addToPlan(food, 'Lunch')}
                             className="text-[10px] bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200"
                          >
                              Lunch
                          </button>
                          <button 
                             onClick={() => addToPlan(food, 'Dinner')}
                             className="text-[10px] bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200"
                          >
                              Dinner
                          </button>
                          <button 
                             onClick={() => addToPlan(food, 'Morning Snack')}
                             className="text-[10px] bg-gray-100 text-gray-800 px-2 py-1 rounded hover:bg-gray-200"
                          >
                              Snack
                          </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap">
                {session && (
                    <>
                    <input 
                        type="text" placeholder="Plan Name" value={planName} onChange={e => setPlanName(e.target.value)}
                        className="w-32 p-2 border rounded text-sm focus:ring-1 focus:ring-blue-400 outline-none"
                    />
                    <button onClick={savePlan} className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded transition" title="Save Plan">💾</button>
                    <button onClick={() => { fetchPlans(); setShowLoadModal(true); }} className="bg-purple-500 hover:bg-purple-600 text-white p-2 rounded transition" title="Load Plan">📂</button>
                    </>
                )}
                {session && dataSource === 'local' && (
                    <button onClick={handleSyncToCloud} className="bg-orange-100 text-orange-700 px-3 py-2 rounded text-xs font-bold hover:bg-orange-200">
                        ☁️ Sync
                    </button>
                )}
                <div className="flex bg-gray-100 rounded-lg p-1">
                    <button onClick={() => handlePrint('day')} className="px-3 py-1 text-xs font-bold text-gray-600 hover:bg-white rounded shadow-sm">Print Day</button>
                    <button onClick={() => handlePrint('week')} className="px-3 py-1 text-xs font-bold text-gray-600 hover:bg-white rounded shadow-sm">Print Week</button>
                </div>
                <button onClick={resetPlanner} className="text-red-500 hover:text-red-700 text-sm font-medium border border-red-200 px-3 py-2 rounded hover:bg-red-50">
                    Clear All
                </button>
          </div>
      </div>

      {/* Day Navigation Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-print">
          {[1, 2, 3, 4, 5, 6, 7].map(day => (
              <button
                key={day}
                onClick={() => setCurrentDay(day)}
                className={`px-6 py-2 rounded-t-lg font-bold text-sm transition-all border-b-2 ${
                    currentDay === day 
                    ? 'bg-white text-blue-600 border-blue-600 shadow-sm' 
                    : 'bg-gray-100 text-gray-500 border-transparent hover:bg-gray-200'
                }`}
              >
                  Day {day}
              </button>
          ))}
          <button onClick={clearDay} className="ml-auto text-xs text-red-400 hover:text-red-600 px-3">Clear Day {currentDay}</button>
      </div>

      <div id="print-area" className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          
          {/* Main Planner: Meal Sections */}
          <div className="xl:col-span-8 space-y-6">
              
              {/* PRINT WEEK VIEW (Hidden normally, visible on print if mode is week) */}
              <div className="hidden print-week-only">
                  <h2 className="text-2xl font-bold mb-4 text-center">Weekly Meal Plan</h2>
                  {Object.keys(weeklyPlan).map(dayStr => {
                      const d = Number(dayStr);
                      const dayData = weeklyPlan[d];
                      return (
                          <div key={d} className="mb-6 break-inside-avoid border p-2">
                              <h3 className="font-bold text-lg border-b bg-gray-100 p-1">Day {d}</h3>
                              <div className="text-xs grid grid-cols-1 gap-2 mt-2">
                                  {MEAL_TIMES.map(time => {
                                      const items = dayData?.[time]?.filter(i => i.selected) || [];
                                      if(items.length === 0) return null;
                                      return (
                                          <div key={time}>
                                              <strong className="text-gray-700">{time}:</strong> {items.map(i => i.name).join(', ')}
                                          </div>
                                      )
                                  })}
                              </div>
                          </div>
                      )
                  })}
              </div>

              {/* CURRENT DAY VIEW (Default) */}
              <div className="print-day-content">
                  <div className="mb-4 print:block hidden text-center">
                      <h2 className="text-2xl font-bold">Daily Meal Plan - Day {currentDay}</h2>
                  </div>

                  {MEAL_TIMES.map((time) => {
                      const dayData = weeklyPlan[currentDay] || {};
                      const items = dayData[time] || [];
                      const groupA = items.filter(i => i.optionGroup !== 'B');
                      const groupB = items.filter(i => i.optionGroup === 'B');
                      
                      const hasItems = items.length > 0;
                      
                      // Calculate active calories for header
                      const sectionKcal = items.filter(i => i.selected).reduce((acc, i) => acc + (i.kcal * i.serves), 0);

                      return (
                        <div key={time} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6 break-inside-avoid">
                            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                                <h3 className="font-bold text-gray-700 text-lg flex items-center gap-2">
                                    {time === 'Breakfast' ? '🍳' : time === 'Lunch' ? '🥗' : time === 'Dinner' ? '🍲' : '🍎'} 
                                    {time}
                                </h3>
                                <div className="flex items-center gap-3">
                                    {hasItems && (
                                        <button 
                                            onClick={() => {
                                                // If B exists but empty, do nothing. If B has items, user is adding to it.
                                                // Actually, simpler: Set search context to add to B for this meal.
                                                // For now, just a visual indicator or toggle is tricky without search context.
                                                // Workaround: We use the Search Bar to add.
                                                // Let's rely on the user adding via search, then moving? No, search adds to A by default.
                                                // Let's make "Add Alternative" act as a state toggle for the search bar?
                                                // Or simpler: Add to A, then user clicks "Move to Alt".
                                                alert("To add an alternative option, select items from search, add to this meal, then use the 'Move to Option B' button on the item.");
                                            }}
                                            className="text-[10px] bg-white border border-blue-200 text-blue-600 px-2 py-1 rounded hover:bg-blue-50 no-print"
                                        >
                                            + Alternative
                                        </button>
                                    )}
                                    <span className="text-xs font-mono font-bold text-gray-500">
                                        {sectionKcal.toFixed(0)} kcal
                                    </span>
                                </div>
                            </div>
                            
                            {!hasItems ? (
                                <div className="p-4 text-center text-sm text-gray-400 italic">No items added. Search above to add to {time}.</div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {/* OPTION A */}
                                    {groupA.length > 0 && (
                                        <div className="relative">
                                            {groupB.length > 0 && (
                                                <div className="bg-blue-50/50 px-2 py-1 text-[10px] font-bold text-blue-800 uppercase flex justify-between items-center">
                                                    <span>Option A (Main)</span>
                                                    <label className="flex items-center gap-1 cursor-pointer no-print">
                                                        <input type="checkbox" onChange={(e) => toggleGroup(time, 'A', e.target.checked)} checked={groupA.every(i => i.selected)} />
                                                        Select All
                                                    </label>
                                                </div>
                                            )}
                                            {groupA.map((item, idx) => {
                                                const realIdx = items.indexOf(item); // Find index in main array
                                                return (
                                                    <div key={realIdx} className={`p-3 flex flex-col sm:flex-row items-center gap-3 transition ${!item.selected ? 'bg-gray-50 opacity-60' : 'hover:bg-blue-50'}`}>
                                                        <input 
                                                            type="checkbox" 
                                                            checked={item.selected} 
                                                            onChange={(e) => updateItem(time, realIdx, 'selected', e.target.checked)}
                                                            className="w-5 h-5 cursor-pointer accent-blue-600 no-print"
                                                        />
                                                        
                                                        <div className="flex-grow text-left w-full sm:w-auto">
                                                            <div className="font-bold text-gray-800 text-sm">
                                                                {renderHighlightedText(item.name)}
                                                            </div>
                                                            <div className="text-[10px] text-gray-500 flex gap-2">
                                                                <span>{item.group}</span>
                                                                {groupB.length > 0 && (
                                                                    <button onClick={() => updateItem(time, realIdx, 'optionGroup', 'B')} className="text-blue-500 hover:underline no-print">
                                                                        → Move to Option B
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                            <input 
                                                                type="number" step="0.25" min="0" 
                                                                value={item.serves}
                                                                onChange={(e) => updateItem(time, realIdx, 'serves', Number(e.target.value))}
                                                                className="w-14 p-1 border rounded text-center text-sm font-bold focus:ring-1 focus:ring-blue-400"
                                                            />
                                                            <span className="text-xs text-gray-500">serves</span>
                                                        </div>

                                                        <div className="text-right w-24 hidden sm:block">
                                                            <div className="font-mono font-bold text-blue-700 text-sm">{(item.kcal * item.serves).toFixed(0)} kcal</div>
                                                            <div className="text-[9px] text-gray-400 flex gap-1 justify-end">
                                                                <span>P:{(item.protein*item.serves).toFixed(0)}</span>
                                                                <span>C:{(item.cho*item.serves).toFixed(0)}</span>
                                                                <span>F:{(item.fat*item.serves).toFixed(0)}</span>
                                                            </div>
                                                        </div>

                                                        <button onClick={() => removeFromPlan(time, realIdx)} className="text-red-400 hover:text-red-600 px-2 text-lg no-print">×</button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* OPTION B */}
                                    {groupB.length > 0 && (
                                        <div className="relative border-t-2 border-dashed border-gray-200">
                                            <div className="bg-orange-50/50 px-2 py-1 text-[10px] font-bold text-orange-800 uppercase flex justify-between items-center">
                                                <span>Option B (Alternative)</span>
                                                <label className="flex items-center gap-1 cursor-pointer no-print">
                                                    <input type="checkbox" onChange={(e) => toggleGroup(time, 'B', e.target.checked)} checked={groupB.every(i => i.selected)} />
                                                    Select All
                                                </label>
                                            </div>
                                            {groupB.map((item, idx) => {
                                                const realIdx = items.indexOf(item);
                                                return (
                                                    <div key={realIdx} className={`p-3 flex flex-col sm:flex-row items-center gap-3 transition ${!item.selected ? 'bg-gray-50 opacity-60' : 'hover:bg-orange-50'}`}>
                                                        <input 
                                                            type="checkbox" 
                                                            checked={item.selected} 
                                                            onChange={(e) => updateItem(time, realIdx, 'selected', e.target.checked)}
                                                            className="w-5 h-5 cursor-pointer accent-orange-600 no-print"
                                                        />
                                                        
                                                        <div className="flex-grow text-left w-full sm:w-auto">
                                                            <div className="font-bold text-gray-800 text-sm">
                                                                {renderHighlightedText(item.name)}
                                                            </div>
                                                            <div className="text-[10px] text-gray-500 flex gap-2">
                                                                <span>{item.group}</span>
                                                                <button onClick={() => updateItem(time, realIdx, 'optionGroup', 'A')} className="text-orange-500 hover:underline no-print">
                                                                    ↑ Move to Option A
                                                                </button>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                            <input 
                                                                type="number" step="0.25" min="0" 
                                                                value={item.serves}
                                                                onChange={(e) => updateItem(time, realIdx, 'serves', Number(e.target.value))}
                                                                className="w-14 p-1 border rounded text-center text-sm font-bold focus:ring-1 focus:ring-orange-400"
                                                            />
                                                            <span className="text-xs text-gray-500">serves</span>
                                                        </div>

                                                        <div className="text-right w-24 hidden sm:block">
                                                            <div className="font-mono font-bold text-orange-700 text-sm">{(item.kcal * item.serves).toFixed(0)} kcal</div>
                                                            <div className="text-[9px] text-gray-400 flex gap-1 justify-end">
                                                                <span>P:{(item.protein*item.serves).toFixed(0)}</span>
                                                                <span>C:{(item.cho*item.serves).toFixed(0)}</span>
                                                                <span>F:{(item.fat*item.serves).toFixed(0)}</span>
                                                            </div>
                                                        </div>

                                                        <button onClick={() => removeFromPlan(time, realIdx)} className="text-red-400 hover:text-red-600 px-2 text-lg no-print">×</button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                      );
                  })}
              </div>
          </div>

          {/* Sidebar: Totals & Targets */}
          <div className="xl:col-span-4 space-y-6">
              <div className="bg-white rounded-xl shadow-lg border-t-4 border-t-blue-600 p-6 sticky top-40">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <span>📊</span> Daily Summary (Day {currentDay})
                  </h3>

                  <div className="mb-6">
                      <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Target Calories</label>
                      <div className="relative">
                        <input 
                            type="number" 
                            className="w-full p-2 border-2 border-blue-200 rounded-lg text-center font-bold text-xl text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                            placeholder="0"
                            value={targetKcal} 
                            onChange={(e) => setTargetKcal(parseFloat(e.target.value))}
                            dir="ltr"
                        />
                        <span className="absolute right-3 top-3 text-gray-400 text-xs font-medium">Kcal</span>
                      </div>
                  </div>

                  <div className="mb-6">
                      <MacroDonut 
                        cho={summary.totalCHO} 
                        pro={summary.totalProtein} 
                        fat={summary.totalFat} 
                        totalKcal={summary.totalKcal} 
                      />
                  </div>

                  <div className="space-y-4">
                      <ProgressBar 
                        current={summary.totalKcal} 
                        target={targetKcal} 
                        label="Calories" 
                        unit="kcal" 
                        color="bg-blue-500"
                      />
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center mt-6">
                     <div className="p-2 bg-blue-50 rounded border border-blue-100">
                        <div className="text-xs text-gray-500">CHO</div>
                        <div className="font-bold text-blue-700">{summary.totalCHO.toFixed(0)}g</div>
                        <div className="text-[10px] text-blue-400">{percentages.cho}%</div>
                     </div>
                     <div className="p-2 bg-red-50 rounded border border-red-100">
                        <div className="text-xs text-gray-500">PRO</div>
                        <div className="font-bold text-red-700">{summary.totalProtein.toFixed(0)}g</div>
                        <div className="text-[10px] text-red-400">{percentages.pro}%</div>
                     </div>
                     <div className="p-2 bg-yellow-50 rounded border border-yellow-100">
                        <div className="text-xs text-gray-500">FAT</div>
                        <div className="font-bold text-yellow-700">{summary.totalFat.toFixed(0)}g</div>
                        <div className="text-[10px] text-yellow-400">{percentages.fat}%</div>
                     </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-gray-50 rounded text-center text-xs text-gray-500 no-print">
                      <strong>Note:</strong> Calculation includes only checked items. Use Option A/B to create alternatives.
                  </div>
              </div>
          </div>

      </div>

      {/* Load Modal */}
      {showLoadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm no-print">
            <div className="bg-white p-6 rounded-xl w-full max-w-lg shadow-2xl h-[80vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">{t.common.load}</h3>
                    <button onClick={() => setShowLoadModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>
                <div className="mb-4">
                    <input 
                        type="text" placeholder={t.common.search} value={loadSearchQuery} onChange={(e) => setLoadSearchQuery(e.target.value)}
                        className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    />
                </div>
                <div className="flex-grow overflow-y-auto space-y-2 pr-2">
                    {isLoadingPlans ? (
                        <div className="text-center py-10 text-gray-400">Loading...</div>
                    ) : filteredSavedPlans.length === 0 ? (
                        <div className="text-center py-10 text-gray-400">No saved plans found.</div>
                    ) : (
                        filteredSavedPlans.map(plan => (
                            <div key={plan.id} className="flex justify-between items-center p-3 bg-gray-50 hover:bg-blue-50 rounded-lg border border-gray-100 group">
                                <div>
                                    <div className="font-bold text-gray-800">{plan.name}</div>
                                    <div className="text-xs text-gray-500">{new Date(plan.created_at).toLocaleDateString()}</div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => loadPlan(plan)} className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600">Load</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
      )}
      
      {/* CSS for Print Hiding */}
      <style>{`
        @media print {
            .print-week-only { display: none; }
            body.print-week .print-week-only { display: block; }
            body.print-week .print-day-content { display: none; }
            
            body.print-day-only .print-week-only { display: none; }
            body.print-day-only .print-day-content { display: block; }
        }
      `}</style>
    </div>
  );
};

export default MealCreator;