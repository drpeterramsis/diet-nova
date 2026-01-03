
import React, { useState, useMemo, useEffect } from 'react';
import { foodCompositionData, FoodCompositionItem } from '../../data/foodCompositionData';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import Toast from '../Toast';
import { MacroDonut, ProgressBar } from '../Visuals';

// Reusing Concepts from MealCreator but with Advanced Data
type MealTime = 'Pre-Breakfast' | 'Breakfast' | 'Morning Snack' | 'Lunch' | 'Afternoon Snack' | 'Dinner' | 'Late Snack';
const MEAL_TIMES: MealTime[] = ['Pre-Breakfast', 'Breakfast', 'Morning Snack', 'Lunch', 'Afternoon Snack', 'Dinner', 'Late Snack'];

const MEAL_ICONS: Record<string, string> = {
    'Pre-Breakfast': '🌅',
    'Breakfast': '🍳',
    'Morning Snack': '🍎',
    'Lunch': '🥗',
    'Afternoon Snack': '🍇',
    'Dinner': '🍲',
    'Late Snack': '🥛'
};

const ALT_OPTIONS = ['main', ...Array.from({length: 10}, (_, i) => `Alt ${i+1}`)];

interface AdvancedPlannerItem {
    id: string; // unique ID for list key
    item: FoodCompositionItem;
    weight: number; // grams
    selected: boolean;
    optionGroup: string; // 'main' or 'Alt 1', etc.
}

interface MealMeta {
    timeStart: string;
    timeEnd: string;
    notes: string;
}

interface AdvancedDayPlan {
    items: Record<string, AdvancedPlannerItem[]>;
    meta: Record<string, MealMeta>;
    title?: string;
}

interface AdvancedWeeklyPlan {
    [day: number]: AdvancedDayPlan;
    instructions?: string;
}

const DEFAULT_ADV_WEEKLY_PLAN: AdvancedWeeklyPlan = {
    1: { items: MEAL_TIMES.reduce((acc, time) => ({ ...acc, [time]: [] }), {}), meta: {}, title: '' },
    instructions: ""
};

interface WarningCriteria {
    nutrient: keyof FoodCompositionItem;
    label: string;
    operator: '>' | '<';
    value: number;
}

const DEFAULT_CRITERIA: WarningCriteria[] = [
    { nutrient: 'sodium', label: 'Sodium', operator: '<', value: 2000 },
    { nutrient: 'potassium', label: 'Potassium', operator: '<', value: 2000 },
    { nutrient: 'phosphorus', label: 'Phosphorus', operator: '<', value: 1000 },
    { nutrient: 'protein', label: 'Protein', operator: '>', value: 60 },
];

export const AdvancedMealCreator: React.FC = () => {
    const { session } = useAuth();
    
    // Data State
    const [activeData, setActiveData] = useState<FoodCompositionItem[]>(foodCompositionData);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Planning State (Weekly Structure)
    const [currentDay, setCurrentDay] = useState<number>(1);
    const [weeklyPlan, setWeeklyPlan] = useState<AdvancedWeeklyPlan>(DEFAULT_ADV_WEEKLY_PLAN);
    const [activeMealTime, setActiveMealTime] = useState<MealTime>('Lunch');
    
    // UI State
    const [isLoading, setIsLoading] = useState(false);
    const [saveStatus, setSaveStatus] = useState('');
    const [criteria, setCriteria] = useState<WarningCriteria[]>(DEFAULT_CRITERIA);
    const [showCriteriaPanel, setShowCriteriaPanel] = useState(false);

    // Initial Data Fetch (Same as FoodComposition)
    useEffect(() => {
        const fetchDB = async () => {
            setIsLoading(true);
            try {
                const { data, error } = await supabase.from('food_composition').select('*').limit(2000);
                if (!error && data && data.length > 0) {
                    const mapped = data.map((row: any) => ({
                        id: String(row.id),
                        code: row.code,
                        food: row.food_name,
                        category: row.food_group,
                        energy: row.energy_kcal,
                        protein: row.protein_g,
                        fat: row.fat_g,
                        carb: row.carbohydrate_g,
                        fiber: row.fiber_g,
                        water: row.water_g,
                        ash: row.ash_g,
                        calcium: row.calcium_mg,
                        phosphorus: row.phosphorus_mg,
                        magnesium: row.magnesium_mg,
                        iron: row.iron_mg,
                        zinc: row.zinc_mg,
                        copper: row.copper_mg,
                        sodium: row.sodium_mg,
                        potassium: row.potassium_mg,
                        vitA: row.vitamin_a_ugre,
                        vitC: row.vitamin_c_mg,
                        riboflavin: row.riboflavin_mg,
                        thiamin: row.thiamin_mg,
                        refuse: row.refuse_percent
                    }));
                    setActiveData(mapped);
                }
            } catch (err) {
                console.warn("Using local data for Advanced Creator");
            } finally {
                setIsLoading(false);
            }
        };
        fetchDB();
    }, []);

    const ensureDayExists = (day: number) => {
        setWeeklyPlan(prev => {
            if (prev[day]) return prev;
            return { ...prev, [day]: { items: MEAL_TIMES.reduce((acc, t) => ({ ...acc, [t]: [] }), {}), meta: {}, title: '' } };
        });
    };
  
    useEffect(() => { if (typeof currentDay === 'number') ensureDayExists(currentDay); }, [currentDay]);

    const filteredFoods = useMemo(() => {
        if (!searchQuery) return [];
        const q = searchQuery.toLowerCase();
        return activeData.filter(f => f.food.toLowerCase().includes(q) || String(f.code).includes(q));
    }, [searchQuery, activeData]);

    // Calculate totals for Current Day (Main Options Only)
    const dailyTotals = useMemo(() => {
        const dayData = weeklyPlan[currentDay];
        if (!dayData?.items) return { energy: 0, protein: 0, fat: 0, carb: 0, sodium: 0, potassium: 0, phosphorus: 0, calcium: 0, iron: 0 };

        const allItems = Object.values(dayData.items).flat() as AdvancedPlannerItem[];

        return allItems.reduce((acc, { item, weight, selected, optionGroup }) => {
            if (!selected || optionGroup !== 'main') return acc; // Only count selected main items
            const factor = weight / 100;
            return {
                energy: acc.energy + (item.energy * factor),
                protein: acc.protein + (item.protein * factor),
                fat: acc.fat + (item.fat * factor),
                carb: acc.carb + (item.carb * factor),
                sodium: acc.sodium + (item.sodium * factor),
                potassium: acc.potassium + (item.potassium * factor),
                phosphorus: acc.phosphorus + (item.phosphorus * factor),
                calcium: acc.calcium + (item.calcium * factor),
                iron: acc.iron + (item.iron * factor)
            };
        }, { energy: 0, protein: 0, fat: 0, carb: 0, sodium: 0, potassium: 0, phosphorus: 0, calcium: 0, iron: 0 });
    }, [weeklyPlan, currentDay]);

    const addItem = (food: FoodCompositionItem) => {
        setWeeklyPlan(prev => {
            const dayData = prev[currentDay] || { items: {}, meta: {}, title: '' };
            const currentList = dayData.items?.[activeMealTime] || [];
            const newItem: AdvancedPlannerItem = {
                id: Date.now().toString(),
                item: food,
                weight: 100, // Default 100g
                selected: true,
                optionGroup: 'main'
            };
            return { ...prev, [currentDay]: { ...dayData, items: { ...dayData.items, [activeMealTime]: [...currentList, newItem] } } };
        });
        setSearchQuery('');
    };

    const updateItem = (mealTime: string, index: number, field: keyof AdvancedPlannerItem, value: any) => {
        setWeeklyPlan(prev => {
            const dayData = prev[currentDay];
            const newList = [...(dayData.items?.[mealTime] || [])];
            if (newList[index]) {
                newList[index] = { ...newList[index], [field]: value };
            }
            return { ...prev, [currentDay]: { ...dayData, items: { ...dayData.items, [mealTime]: newList } } };
        });
    };

    const removeItem = (mealTime: string, index: number) => {
        setWeeklyPlan(prev => {
            const dayData = prev[currentDay];
            const newList = [...(dayData.items?.[mealTime] || [])];
            newList.splice(index, 1);
            return { ...prev, [currentDay]: { ...dayData, items: { ...dayData.items, [mealTime]: newList } } };
        });
    };

    const getWarningStatus = (c: WarningCriteria) => {
        const val = dailyTotals[c.nutrient as keyof typeof dailyTotals] || 0;
        if (c.operator === '<') {
            return val > c.value ? 'fail' : 'pass';
        } else {
            return val < c.value ? 'fail' : 'pass';
        }
    };

    return (
        <div className="max-w-[1920px] mx-auto animate-fade-in pb-12">
            <Toast message={saveStatus} />

            {/* Header */}
            <div className="bg-gradient-to-r from-purple-800 to-indigo-900 p-6 rounded-xl shadow-lg mb-6 text-white flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <span>🧪</span> Advanced Day Menu
                    </h1>
                    <p className="text-purple-200 text-sm opacity-90">Precision planning (by grams) with clinical warning limits.</p>
                </div>
                <button 
                    onClick={() => { if(confirm("Reset entire plan?")) setWeeklyPlan(DEFAULT_ADV_WEEKLY_PLAN); }}
                    className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg font-bold text-sm transition"
                >
                    Reset Plan
                </button>
            </div>

            {/* Day Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4 no-print items-center border-b border-gray-200">
                {[1, 2, 3, 4, 5, 6, 7].map(d => (
                    <button key={d} onClick={() => setCurrentDay(d)} className={`px-6 py-2 rounded-t-lg font-bold text-sm transition-all whitespace-nowrap ${currentDay === d ? 'bg-purple-600 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>Day {d}</button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* LEFT: Search & Database */}
                <div className="lg:col-span-3 space-y-4">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 sticky top-4">
                        <h3 className="font-bold text-gray-700 mb-2 flex items-center gap-2">
                            <span>🔍</span> Food Database
                        </h3>
                        <div className="relative">
                            <input 
                                type="text" 
                                placeholder="Search food by name or code..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                            />
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                            
                            {searchQuery && (
                                <div className="absolute top-full left-0 w-full bg-white shadow-xl rounded-b-lg border border-gray-200 max-h-80 overflow-y-auto z-50">
                                    {isLoading ? <div className="p-4 text-center text-gray-400">Loading...</div> : 
                                    filteredFoods.length === 0 ? <div className="p-4 text-center text-gray-400">No foods found.</div> :
                                    filteredFoods.map(f => (
                                        <div 
                                            key={f.code} 
                                            onClick={() => addItem(f)}
                                            className="p-3 hover:bg-purple-50 cursor-pointer border-b border-gray-50 flex justify-between items-center group"
                                        >
                                            <div className="text-sm font-medium text-gray-800">
                                                {f.food}
                                                <div className="text-xs text-gray-500 font-mono mt-0.5">
                                                    {f.energy} kcal | P: {f.protein} | K+: {f.potassium}
                                                </div>
                                            </div>
                                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded group-hover:bg-purple-200 font-bold">+</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="mt-4 text-xs text-gray-500 text-center">
                            Currently adding to: <span className="font-bold text-purple-600">{activeMealTime}</span>
                        </div>
                    </div>
                </div>

                {/* CENTER: Meal Planner */}
                <div className="lg:col-span-6 space-y-4">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
                        <h2 className="text-lg font-bold text-gray-800">Day {currentDay} Plan</h2>
                    </div>

                    {MEAL_TIMES.map((time) => {
                        const dayItems = weeklyPlan[currentDay]?.items?.[time] || [];
                        const isActive = activeMealTime === time;
                        const groups = Array.from(new Set(dayItems.map(i => i.optionGroup)));
                        
                        // Calculate Meal Total Kcal (Main only)
                        const mealKcal = dayItems.reduce((acc, i) => i.optionGroup === 'main' && i.selected ? acc + (i.item.energy * (i.weight/100)) : acc, 0);

                        return (
                            <div key={time} className={`rounded-xl shadow-sm border overflow-hidden transition-all ${isActive ? 'border-purple-400 ring-2 ring-purple-100' : 'border-gray-200'}`}>
                                <div 
                                    className={`px-4 py-3 flex flex-col md:flex-row justify-between items-center cursor-pointer ${isActive ? 'bg-purple-50' : 'bg-gray-50'}`} 
                                    onClick={() => setActiveMealTime(time)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-purple-500 animate-pulse' : 'bg-gray-300'}`}></div>
                                        <h3 className={`font-bold text-lg flex items-center gap-2 ${isActive ? 'text-purple-900' : 'text-gray-700'}`}>{MEAL_ICONS[time]} {time}</h3>
                                    </div>
                                    <div className="text-xs font-bold text-gray-600">{mealKcal.toFixed(0)} kcal</div>
                                </div>
                                
                                {dayItems.length > 0 && (
                                    <div className="bg-white p-4">
                                        {groups.map(g => (
                                            <div key={g} className="mb-4 last:mb-0">
                                                <div className="text-xs font-bold uppercase text-gray-400 mb-2 border-b border-gray-100 pb-1">{g === 'main' ? 'Main Option' : g}</div>
                                                {dayItems.map((item, idx) => {
                                                    if(item.optionGroup !== g) return null;
                                                    const kcal = (item.item.energy * (item.weight / 100)).toFixed(0);
                                                    return (
                                                        <div key={item.id} className="flex items-center gap-2 mb-2 p-2 rounded hover:bg-gray-50 border border-transparent hover:border-gray-200 transition">
                                                            <input 
                                                                type="checkbox" 
                                                                checked={item.selected} 
                                                                onChange={e => updateItem(time, idx, 'selected', e.target.checked)} 
                                                            />
                                                            <div className="flex-grow text-sm">
                                                                <div className="font-bold text-gray-800">{item.item.food}</div>
                                                                <div className="text-[10px] text-gray-500 flex gap-2">
                                                                    <span>P: {(item.item.protein * item.weight/100).toFixed(1)}</span>
                                                                    <span>Na: {(item.item.sodium * item.weight/100).toFixed(0)}</span>
                                                                    <span>K: {(item.item.potassium * item.weight/100).toFixed(0)}</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <input 
                                                                    type="number" 
                                                                    value={item.weight} 
                                                                    onChange={e => updateItem(time, idx, 'weight', Number(e.target.value))} 
                                                                    className="w-14 p-1 border rounded text-center text-sm font-bold bg-white"
                                                                />
                                                                <span className="text-xs text-gray-500">g</span>
                                                            </div>
                                                            <div className="w-12 text-right text-xs font-bold text-purple-700">{kcal} kc</div>
                                                            <select 
                                                                value={item.optionGroup} 
                                                                onChange={(e) => updateItem(time, idx, 'optionGroup', e.target.value)} 
                                                                className="text-[10px] border rounded bg-white p-1 ml-2 w-16"
                                                            >
                                                                {ALT_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                                                            </select>
                                                            <button onClick={() => removeItem(time, idx)} className="text-red-400 hover:text-red-600 ml-1">×</button>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* RIGHT: Summary & Warnings */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-purple-600 sticky top-4">
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <span>📊</span> Daily Analysis (Main)
                        </h3>
                        
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-center">
                                <span className="block text-[10px] font-bold text-blue-600 uppercase mb-1">Energy</span>
                                <span className="text-2xl font-black text-blue-800">{dailyTotals.energy.toFixed(0)}</span>
                                <span className="text-[10px] text-blue-500 block">kcal</span>
                            </div>
                            <div className="p-3 bg-green-50 rounded-xl border border-green-100 text-center">
                                <span className="block text-[10px] font-bold text-green-600 uppercase mb-1">Protein</span>
                                <span className="text-2xl font-black text-green-800">{dailyTotals.protein.toFixed(1)}</span>
                                <span className="text-[10px] text-green-500 block">grams</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <MacroDonut cho={dailyTotals.carb} pro={dailyTotals.protein} fat={dailyTotals.fat} totalKcal={dailyTotals.energy} />
                        </div>

                        {/* Micros Grid */}
                        <div className="mt-6 pt-4 border-t border-gray-100 grid grid-cols-2 gap-3 text-center text-xs">
                            <div className="p-2 bg-gray-50 rounded">
                                <div className="text-[10px] uppercase text-gray-500 font-bold">Sodium</div>
                                <div className="font-mono font-bold text-gray-800">{dailyTotals.sodium.toFixed(0)}</div>
                            </div>
                            <div className="p-2 bg-gray-50 rounded">
                                <div className="text-[10px] uppercase text-gray-500 font-bold">Potassium</div>
                                <div className="font-mono font-bold text-gray-800">{dailyTotals.potassium.toFixed(0)}</div>
                            </div>
                            <div className="p-2 bg-gray-50 rounded">
                                <div className="text-[10px] uppercase text-gray-500 font-bold">Phos</div>
                                <div className="font-mono font-bold text-gray-800">{dailyTotals.phosphorus.toFixed(0)}</div>
                            </div>
                            <div className="p-2 bg-gray-50 rounded">
                                <div className="text-[10px] uppercase text-gray-500 font-bold">Calcium</div>
                                <div className="font-mono font-bold text-gray-800">{dailyTotals.calcium.toFixed(0)}</div>
                            </div>
                        </div>
                        
                        {/* Clinical Warnings */}
                        <div className="mt-6">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="text-xs font-bold text-red-800 uppercase">⚠️ Clinical Limits</h4>
                                <button onClick={() => setShowCriteriaPanel(!showCriteriaPanel)} className="text-[10px] text-blue-600 underline">Config</button>
                            </div>
                            <div className="space-y-2">
                                {criteria.map((c, idx) => {
                                    const status = getWarningStatus(c);
                                    const currentVal = dailyTotals[c.nutrient as keyof typeof dailyTotals] || 0;
                                    return (
                                        <div key={idx} className={`p-2 rounded border flex justify-between items-center text-xs ${status === 'fail' ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                                            <span className="font-bold text-gray-700">{c.label} {c.operator} {c.value}</span>
                                            <div className="flex items-center gap-2">
                                                <span className={`font-mono font-bold ${status === 'fail' ? 'text-red-700' : 'text-green-700'}`}>{currentVal.toFixed(0)}</span>
                                                <span>{status === 'fail' ? '🛑' : '✅'}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            
                            {/* Criteria Config Panel */}
                            {showCriteriaPanel && (
                                <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded text-xs animate-fade-in">
                                    <p className="font-bold text-gray-500 mb-2">Edit Thresholds</p>
                                    {criteria.map((c, idx) => (
                                        <div key={idx} className="flex gap-1 mb-2 items-center">
                                            <span className="w-16 font-bold truncate">{c.label}</span>
                                            <select 
                                                value={c.operator} 
                                                onChange={e => {
                                                    const newC = [...criteria];
                                                    newC[idx].operator = e.target.value as any;
                                                    setCriteria(newC);
                                                }}
                                                className="border rounded p-1"
                                            >
                                                <option value="<">&lt;</option>
                                                <option value=">">&gt;</option>
                                            </select>
                                            <input 
                                                type="number" 
                                                value={c.value} 
                                                onChange={e => {
                                                    const newC = [...criteria];
                                                    newC[idx].value = Number(e.target.value);
                                                    setCriteria(newC);
                                                }}
                                                className="w-16 border rounded p-1"
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
