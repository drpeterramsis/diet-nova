
import React, { useState, useMemo, useEffect } from 'react';
import { foodCompositionData, FoodCompositionItem } from '../../data/foodCompositionData';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import Toast from '../Toast';

interface MealItem {
    id: string; // unique ID for list key
    item: FoodCompositionItem;
    weight: number; // grams
}

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
    const [mealItems, setMealItems] = useState<MealItem[]>([]);
    
    // UI State
    const [isLoading, setIsLoading] = useState(false);
    const [saveStatus, setSaveStatus] = useState('');
    const [criteria, setCriteria] = useState<WarningCriteria[]>(DEFAULT_CRITERIA);
    const [showCriteriaPanel, setShowCriteriaPanel] = useState(false);

    // Initial Data Fetch
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

    const filteredFoods = useMemo(() => {
        if (!searchQuery) return [];
        const q = searchQuery.toLowerCase();
        return activeData.filter(f => f.food.toLowerCase().includes(q) || String(f.code).includes(q));
    }, [searchQuery, activeData]);

    const totals = useMemo(() => {
        return mealItems.reduce((acc, { item, weight }) => {
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
    }, [mealItems]);

    const addItem = (food: FoodCompositionItem) => {
        const newItem: MealItem = {
            id: Date.now().toString(),
            item: food,
            weight: 100 // Default 100g
        };
        setMealItems(prev => [...prev, newItem]);
        setSearchQuery('');
    };

    const updateWeight = (id: string, weight: number) => {
        setMealItems(prev => prev.map(i => i.id === id ? { ...i, weight: Math.max(0, weight) } : i));
    };

    const removeItem = (id: string) => {
        setMealItems(prev => prev.filter(i => i.id !== id));
    };

    const getWarningStatus = (c: WarningCriteria) => {
        const val = totals[c.nutrient as keyof typeof totals] || 0;
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
                    <p className="text-purple-200 text-sm opacity-90">Analysis-based meal creation with clinical warning limits.</p>
                </div>
                <button 
                    onClick={() => setMealItems([])} 
                    className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg font-bold text-sm transition"
                >
                    Reset All
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* LEFT: Search & List */}
                <div className="lg:col-span-4 space-y-4">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
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
                    </div>

                    {/* Active Meal List */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[500px]">
                        <div className="p-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                            <span className="font-bold text-gray-700 text-sm uppercase">Selected Foods ({mealItems.length})</span>
                            <span className="text-xs text-gray-500">Edit weights (g) below</span>
                        </div>
                        <div className="flex-grow overflow-y-auto p-2 space-y-2">
                            {mealItems.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                    <span className="text-4xl mb-2 opacity-30">🍽️</span>
                                    <p className="text-sm">Start adding foods to analyze</p>
                                </div>
                            ) : (
                                mealItems.map((item, idx) => (
                                    <div key={item.id} className="p-3 border border-gray-100 rounded-lg hover:border-purple-200 transition bg-gray-50/50">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-bold text-gray-800 text-sm leading-tight">{item.item.food}</span>
                                            <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600">×</button>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center bg-white border rounded px-2">
                                                <input 
                                                    type="number" 
                                                    value={item.weight} 
                                                    onChange={e => updateWeight(item.id, Number(e.target.value))}
                                                    className="w-12 p-1 text-center font-bold text-sm outline-none"
                                                />
                                                <span className="text-xs text-gray-500">g</span>
                                            </div>
                                            <div className="text-xs text-gray-500 ml-auto font-mono">
                                                {((item.item.energy * item.weight) / 100).toFixed(0)} kcal
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* CENTER: Summary & Warnings */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-purple-600">
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <span>📊</span> Nutritional Analysis
                        </h3>
                        
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 text-center">
                                <span className="block text-xs font-bold text-blue-600 uppercase mb-1">Energy</span>
                                <span className="text-3xl font-black text-blue-800">{totals.energy.toFixed(0)}</span>
                                <span className="text-xs text-blue-500 block">kcal</span>
                            </div>
                            <div className="p-4 bg-green-50 rounded-xl border border-green-100 text-center">
                                <span className="block text-xs font-bold text-green-600 uppercase mb-1">Protein</span>
                                <span className="text-3xl font-black text-green-800">{totals.protein.toFixed(1)}</span>
                                <span className="text-xs text-green-500 block">grams</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {/* Macros Bars */}
                            <div>
                                <div className="flex justify-between text-xs mb-1 font-bold text-gray-600">
                                    <span>Carbohydrates</span>
                                    <span>{totals.carb.toFixed(1)}g</span>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-blue-500" style={{ width: `${Math.min((totals.carb/300)*100, 100)}%` }}></div></div>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs mb-1 font-bold text-gray-600">
                                    <span>Fat</span>
                                    <span>{totals.fat.toFixed(1)}g</span>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-yellow-500" style={{ width: `${Math.min((totals.fat/80)*100, 100)}%` }}></div></div>
                            </div>
                        </div>

                        {/* Micros Grid */}
                        <div className="mt-6 pt-4 border-t border-gray-100 grid grid-cols-3 gap-3 text-center">
                            <div className="p-2 bg-gray-50 rounded">
                                <div className="text-[10px] uppercase text-gray-500 font-bold">Sodium</div>
                                <div className="font-mono font-bold text-gray-800">{totals.sodium.toFixed(0)}</div>
                            </div>
                            <div className="p-2 bg-gray-50 rounded">
                                <div className="text-[10px] uppercase text-gray-500 font-bold">Potassium</div>
                                <div className="font-mono font-bold text-gray-800">{totals.potassium.toFixed(0)}</div>
                            </div>
                            <div className="p-2 bg-gray-50 rounded">
                                <div className="text-[10px] uppercase text-gray-500 font-bold">Phos</div>
                                <div className="font-mono font-bold text-gray-800">{totals.phosphorus.toFixed(0)}</div>
                            </div>
                            <div className="p-2 bg-gray-50 rounded">
                                <div className="text-[10px] uppercase text-gray-500 font-bold">Calcium</div>
                                <div className="font-mono font-bold text-gray-800">{totals.calcium.toFixed(0)}</div>
                            </div>
                            <div className="p-2 bg-gray-50 rounded">
                                <div className="text-[10px] uppercase text-gray-500 font-bold">Iron</div>
                                <div className="font-mono font-bold text-gray-800">{totals.iron.toFixed(1)}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT: Warning Criteria */}
                <div className="lg:col-span-3">
                    <div className="bg-white rounded-xl shadow-lg border border-red-100 overflow-hidden">
                        <div className="p-4 bg-red-50 border-b border-red-100 flex justify-between items-center">
                            <h3 className="font-bold text-red-800 flex items-center gap-2 text-sm">
                                <span>⚠️</span> Clinical Warnings
                            </h3>
                            <button 
                                onClick={() => setShowCriteriaPanel(!showCriteriaPanel)}
                                className="text-xs bg-white border border-red-200 text-red-600 px-2 py-1 rounded hover:bg-red-50"
                            >
                                {showCriteriaPanel ? 'Hide Config' : 'Config'}
                            </button>
                        </div>
                        
                        <div className="p-4 space-y-3">
                            {criteria.map((c, idx) => {
                                const status = getWarningStatus(c);
                                const currentVal = totals[c.nutrient as keyof typeof totals] || 0;
                                return (
                                    <div key={idx} className={`p-3 rounded-lg border flex justify-between items-center ${status === 'fail' ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                                        <div>
                                            <div className="text-xs font-bold text-gray-700">{c.label} {c.operator} {c.value}</div>
                                            <div className={`text-sm font-mono font-bold ${status === 'fail' ? 'text-red-700' : 'text-green-700'}`}>
                                                {currentVal.toFixed(0)}
                                            </div>
                                        </div>
                                        <div className={`text-xl ${status === 'fail' ? 'text-red-500' : 'text-green-500'}`}>
                                            {status === 'fail' ? '🛑' : '✅'}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        
                        {/* Config Panel */}
                        {showCriteriaPanel && (
                             <div className="p-4 bg-gray-50 border-t border-gray-200 animate-fade-in text-xs">
                                 <p className="font-bold text-gray-500 mb-2">Edit Warning Thresholds</p>
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
    );
};
