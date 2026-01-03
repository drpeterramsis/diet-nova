
import React, { useState, useMemo, useEffect, useRef } from 'react';
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

// Nutrient Options for Composition Filter (Matching FoodComposition)
const NUTRIENT_OPTS: Array<{label: string, value: keyof FoodCompositionItem}> = [
    { label: 'Energy (kcal)', value: 'energy' },
    { label: 'Protein (g)', value: 'protein' },
    { label: 'Fat (g)', value: 'fat' },
    { label: 'Carbohydrate (g)', value: 'carb' },
    { label: 'Fiber (g)', value: 'fiber' },
    { label: 'Water (g)', value: 'water' },
    { label: 'Ash (g)', value: 'ash' },
    { label: 'Calcium (mg)', value: 'calcium' },
    { label: 'Phosphorus (mg)', value: 'phosphorus' },
    { label: 'Iron (mg)', value: 'iron' },
    { label: 'Sodium (mg)', value: 'sodium' },
    { label: 'Potassium (mg)', value: 'potassium' },
    { label: 'Magnesium (mg)', value: 'magnesium' },
    { label: 'Zinc (mg)', value: 'zinc' },
    { label: 'Copper (mg)', value: 'copper' },
    { label: 'Vit A (ugRE)', value: 'vitA' },
    { label: 'Vit C (mg)', value: 'vitC' },
    { label: 'Thiamin (mg)', value: 'thiamin' },
    { label: 'Riboflavin (mg)', value: 'riboflavin' },
    { label: 'Refuse %', value: 'refuse' },
];

// --- Rich Text Editor (Duplicated from MealCreator to maintain isolation) ---
const RichTextEditorModal: React.FC<{
    initialHtml: string;
    onSave: (html: string) => void;
    onClose: () => void;
    title?: string;
}> = ({ initialHtml, onSave, onClose, title = "Edit Instructions" }) => {
    const editorRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (editorRef.current) { editorRef.current.innerHTML = initialHtml; }
    }, []);
    const execCmd = (command: string, value: string | undefined = undefined) => {
        document.execCommand(command, false, value);
        editorRef.current?.focus();
    };
    const handleSave = () => { if (editorRef.current) { onSave(editorRef.current.innerHTML); } };
    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm no-print">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in border border-gray-100">
                <div className="p-4 border-b bg-gray-50 flex justify-between items-center"><h3 className="font-bold text-gray-800">{title}</h3><button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">✕</button></div>
                <div className="p-2 border-b flex gap-1 flex-wrap bg-gray-50">
                    <button onClick={() => execCmd('bold')} className="p-1.5 min-w-[30px] rounded hover:bg-gray-200 font-bold border border-gray-300">B</button>
                    <button onClick={() => execCmd('italic')} className="p-1.5 min-w-[30px] rounded hover:bg-gray-200 italic border border-gray-300">I</button>
                    <button onClick={() => execCmd('underline')} className="p-1.5 min-w-[30px] rounded hover:bg-gray-200 underline border border-gray-300">U</button>
                    <div className="w-px h-6 bg-gray-300 mx-1"></div>
                    <button onClick={() => execCmd('insertUnorderedList')} className="p-1.5 min-w-[30px] rounded hover:bg-gray-200 border border-gray-300">•</button>
                </div>
                <div ref={editorRef} className="p-4 min-h-[200px] max-h-[400px] overflow-y-auto outline-none text-sm leading-relaxed bg-white" contentEditable suppressContentEditableWarning />
                <div className="p-4 border-t bg-gray-50 flex justify-end gap-2"><button onClick={onClose} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded transition">Cancel</button><button onClick={handleSave} className="px-6 py-2 bg-purple-600 text-white font-bold rounded hover:bg-purple-700 shadow-sm transition">Save Changes</button></div>
            </div>
        </div>
    );
};

export const AdvancedMealCreator: React.FC = () => {
    const { session } = useAuth();
    
    // Data State
    const [activeData, setActiveData] = useState<FoodCompositionItem[]>(foodCompositionData);
    const [dataSource, setDataSource] = useState<'local' | 'cloud'>('local'); // Track source
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('All'); // New Category Filter
    
    // Advanced Filter State
    const [showFilters, setShowFilters] = useState(false);
    const [compositionFilters, setCompositionFilters] = useState<Array<{ id: number; key: keyof FoodCompositionItem; op: '>' | '<' | '='; val: number }>>([]);

    // Planning State (Weekly Structure)
    const [currentDay, setCurrentDay] = useState<number | 'instructions'>(1);
    const [weeklyPlan, setWeeklyPlan] = useState<AdvancedWeeklyPlan>(DEFAULT_ADV_WEEKLY_PLAN);
    const [activeMealTime, setActiveMealTime] = useState<MealTime>('Lunch');
    
    // UI State
    const [isLoading, setIsLoading] = useState(false);
    const [saveStatus, setSaveStatus] = useState('');
    const [criteria, setCriteria] = useState<WarningCriteria[]>(DEFAULT_CRITERIA);
    const [showCriteriaPanel, setShowCriteriaPanel] = useState(false);
    const [showInstructionsEditor, setShowInstructionsEditor] = useState(false);

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
                    setDataSource('cloud');
                } else {
                    setDataSource('local');
                }
            } catch (err) {
                console.warn("Using local data for Advanced Creator");
                setDataSource('local');
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

    // --- Memos ---
    const categories = useMemo(() => {
        const cats = new Set(activeData.map(d => d.category));
        return ['All', ...Array.from(cats)];
    }, [activeData]);

    // --- Filter Logic ---
    const filteredFoods = useMemo(() => {
        let data = activeData;

        // 1. Category Filter
        if (selectedCategory !== 'All') {
            data = data.filter(f => f.category === selectedCategory);
        }

        // 2. Text Search
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            data = data.filter(f => f.food.toLowerCase().includes(q) || String(f.code).includes(q));
        }

        // 3. Composition Filters
        if (compositionFilters.length > 0) {
            data = data.filter(item => {
                return compositionFilters.every(filter => {
                    const itemVal = Number(item[filter.key] || 0);
                    const targetVal = filter.val;
                    
                    if (filter.op === '>') return itemVal > targetVal;
                    if (filter.op === '<') return itemVal < targetVal;
                    if (filter.op === '=') return Math.abs(itemVal - targetVal) < 0.1;
                    return true;
                });
            });
        }

        return data;
    }, [searchQuery, compositionFilters, activeData, selectedCategory]);

    const addFilter = () => {
        setCompositionFilters(prev => [
            ...prev, 
            { id: Date.now(), key: 'protein', op: '>', val: 10 }
        ]);
        setShowFilters(true);
    };

    const removeFilter = (id: number) => {
        setCompositionFilters(prev => prev.filter(f => f.id !== id));
    };

    const updateFilter = (id: number, field: 'key' | 'op' | 'val', value: any) => {
        setCompositionFilters(prev => prev.map(f => f.id === id ? { ...f, [field]: value } : f));
    };

    // --- Selection Logic ---
    const handleSelectAllDay = (mode: 'all' | 'none' | 'main-only') => {
        if (typeof currentDay !== 'number') return;
        setWeeklyPlan(prev => {
            const newPlan = { ...prev };
            const dayItems = { ...(newPlan[currentDay]?.items || {}) };
            Object.keys(dayItems).forEach(mt => {
                dayItems[mt] = dayItems[mt].map(it => {
                    let isSelected = it.selected;
                    if (mode === 'all') isSelected = true;
                    else if (mode === 'none') isSelected = false;
                    else if (mode === 'main-only') {
                        isSelected = it.optionGroup === 'main';
                    }
                    return { ...it, selected: isSelected };
                });
            });
            newPlan[currentDay] = { ...(newPlan[currentDay] || {meta: {}, title: ''}), items: dayItems };
            return newPlan;
        });
    };

    // Calculate totals for Current Day (Based on Selection)
    const dailyTotals = useMemo(() => {
        if (typeof currentDay !== 'number') return { energy: 0, protein: 0, fat: 0, carb: 0, sodium: 0, potassium: 0, phosphorus: 0, calcium: 0, iron: 0 };
        const dayData = weeklyPlan[currentDay];
        if (!dayData?.items) return { energy: 0, protein: 0, fat: 0, carb: 0, sodium: 0, potassium: 0, phosphorus: 0, calcium: 0, iron: 0 };

        const allItems = Object.values(dayData.items).flat() as AdvancedPlannerItem[];

        return allItems.reduce((acc, { item, weight, selected }) => {
            // Count anything that is SELECTED by the user
            if (!selected) return acc; 
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
        if (typeof currentDay !== 'number') return;
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
        if (typeof currentDay !== 'number') return;
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
        if (typeof currentDay !== 'number') return;
        setWeeklyPlan(prev => {
            const dayData = prev[currentDay];
            const newList = [...(dayData.items?.[mealTime] || [])];
            newList.splice(index, 1);
            return { ...prev, [currentDay]: { ...dayData, items: { ...dayData.items, [mealTime]: newList } } };
        });
    };

    const handleSaveInstructions = (html: string) => { 
        setWeeklyPlan(prev => ({ ...prev, instructions: html })); 
        setShowInstructionsEditor(false); 
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
            {showInstructionsEditor && <RichTextEditorModal title="Plan Instructions" initialHtml={weeklyPlan.instructions || ''} onSave={handleSaveInstructions} onClose={() => setShowInstructionsEditor(false)} />}

            {/* Header */}
            <div className="bg-gradient-to-r from-purple-800 to-indigo-900 p-6 rounded-xl shadow-lg mb-6 text-white flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <span>🧪</span> Advanced Day Menu
                    </h1>
                    <div className="flex items-center gap-2">
                        <p className="text-purple-200 text-sm opacity-90">Precision planning (by grams) with clinical warning limits.</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1 font-bold ${dataSource === 'cloud' ? 'bg-green-500/20 text-green-200 border-green-400/30' : 'bg-orange-500/20 text-orange-200 border-orange-400/30'}`}>
                            {dataSource === 'cloud' ? '☁️ Cloud DB' : '💾 Local Data'}
                        </span>
                    </div>
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
                <button 
                    onClick={() => setCurrentDay('instructions')} 
                    className={`px-6 py-2 rounded-t-lg font-bold text-sm transition-all border-b-2 whitespace-nowrap ${currentDay === 'instructions' ? 'bg-purple-600 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                >
                    📋 Instructions
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* LEFT: Search & Database (Hidden in Instructions View) */}
                {typeof currentDay === 'number' ? (
                <div className="lg:col-span-3 space-y-4">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 sticky top-4 flex flex-col h-[calc(100vh-200px)]">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="font-bold text-gray-700 flex items-center gap-2">
                                <span>🔍</span> Food Database
                            </h3>
                            <button 
                                className={`text-[10px] px-2 py-1 rounded transition border ${showFilters ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-purple-700 border-purple-200 hover:bg-purple-50'}`}
                                onClick={() => setShowFilters(!showFilters)}
                            >
                                {showFilters ? 'Hide Filters' : 'Filters'}
                            </button>
                        </div>

                        {/* Search Input */}
                        <div className="relative mb-3">
                            <input 
                                type="text" 
                                placeholder="Search by name or code..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full p-2.5 pl-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                            />
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                        </div>

                        {/* Category Dropdown */}
                        <div className="mb-3">
                            <select 
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg text-xs font-bold bg-white focus:ring-1 focus:ring-purple-400 outline-none"
                            >
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        {/* FILTERS PANEL */}
                        {showFilters && (
                            <div className="mb-3 bg-purple-50 p-2 rounded-lg border border-purple-100 animate-fade-in">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider">Active Filters ({compositionFilters.length})</span>
                                    <button onClick={addFilter} className="text-[10px] bg-purple-600 text-white px-2 py-0.5 rounded hover:bg-purple-700">+ Add Rule</button>
                                </div>
                                <div className="space-y-2 max-h-32 overflow-y-auto pr-1 scrollbar-thin">
                                    {compositionFilters.map(f => (
                                        <div key={f.id} className="flex gap-1 items-center">
                                            <select className="w-24 text-[10px] p-1 border rounded" value={f.key} onChange={(e) => updateFilter(f.id, 'key', e.target.value)}>
                                                {NUTRIENT_OPTS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                            </select>
                                            <select className="w-10 text-[10px] p-1 border rounded text-center font-bold" value={f.op} onChange={(e) => updateFilter(f.id, 'op', e.target.value)}>
                                                <option value=">">&gt;</option>
                                                <option value="<">&lt;</option>
                                                <option value="=">=</option>
                                            </select>
                                            <input type="number" className="w-12 text-[10px] p-1 border rounded" value={f.val} onChange={(e) => updateFilter(f.id, 'val', Number(e.target.value))} />
                                            <button onClick={() => removeFilter(f.id)} className="text-red-500 hover:text-red-700 text-xs px-1">✕</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="mt-2 text-[10px] text-gray-500 text-center border-t border-gray-100 pt-2 mb-2">
                            Adding to: <span className="font-bold text-purple-600">{activeMealTime}</span>
                        </div>

                        {/* Search Results List */}
                        <div className="flex-grow overflow-y-auto pr-1 space-y-2">
                            {isLoading ? <div className="p-4 text-center text-gray-400 text-xs">Loading...</div> : 
                            filteredFoods.length === 0 ? <div className="p-4 text-center text-gray-400 text-xs">No foods found.</div> :
                            filteredFoods.map(item => (
                                <div 
                                    key={item.id} 
                                    onClick={() => addItem(item)}
                                    className="p-3 border rounded-lg cursor-pointer transition hover:shadow-md flex flex-col gap-1 bg-white border-gray-200 hover:border-purple-300 group"
                                >
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-bold text-gray-800 text-sm leading-tight group-hover:text-purple-700 transition">{item.food}</h4>
                                        <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-mono">#{item.code}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-gray-500 mt-1 font-mono">
                                        <span className="text-green-700 font-bold">{item.energy} kcal</span>
                                        <span>P: {item.protein}g</span>
                                        <span>C: {item.carb}g</span>
                                        <span>F: {item.fat}g</span>
                                    </div>
                                    <div className="hidden group-hover:flex justify-end mt-1">
                                        <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-bold">+ Add</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                ) : <div className="lg:col-span-3"></div> }

                {/* CENTER: Meal Planner OR Instructions View */}
                <div className="lg:col-span-6 space-y-4">
                    {currentDay === 'instructions' ? (
                        <div className="bg-white rounded-2xl shadow-xl border border-purple-100 overflow-hidden animate-fade-in">
                            <div className="p-6 bg-gradient-to-br from-purple-600 to-indigo-700 text-white flex justify-between items-center">
                                <div><h2 className="text-2xl font-bold">Plan Instructions</h2></div>
                                <button onClick={() => setShowInstructionsEditor(true)} className="bg-white/20 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-white/30 transition">
                                    <span>📝</span> Edit Instructions
                                </button>
                            </div>
                            <div className="p-8 prose max-w-none min-h-[400px]">
                                {weeklyPlan.instructions ? 
                                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 leading-relaxed text-gray-800" dangerouslySetInnerHTML={{ __html: weeklyPlan.instructions }} /> 
                                : <div className="flex flex-col items-center justify-center h-full text-gray-400 py-20 italic">No instructions set. Click Edit to add.</div>}
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4 flex justify-between items-center">
                                <h2 className="text-lg font-bold text-gray-800">Day {currentDay} Plan</h2>
                                <div className="flex gap-2">
                                    <button onClick={() => handleSelectAllDay('all')} className="text-[10px] bg-blue-100 text-blue-700 px-3 py-1 rounded font-bold hover:bg-blue-200 transition">Select All</button>
                                    <button onClick={() => handleSelectAllDay('main-only')} className="text-[10px] bg-green-100 text-green-700 px-3 py-1 rounded font-bold hover:bg-green-200 transition">Select Main</button>
                                    <button onClick={() => handleSelectAllDay('none')} className="text-[10px] bg-gray-100 text-gray-700 px-3 py-1 rounded font-bold hover:bg-gray-200 transition">Unselect</button>
                                </div>
                            </div>

                            {MEAL_TIMES.map((time) => {
                                const dayItems = weeklyPlan[currentDay]?.items?.[time] || [];
                                const isActive = activeMealTime === time;
                                const groups = Array.from(new Set(dayItems.map(i => i.optionGroup)));
                                
                                // Calculate Meal Total Kcal (Based on selection)
                                const mealKcal = dayItems.reduce((acc, i) => i.selected ? acc + (i.item.energy * (i.weight/100)) : acc, 0);

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
                                            <div className="text-xs font-bold text-gray-600">{mealKcal.toFixed(0)} kcal (Selected)</div>
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
                                                                <div key={item.id} className={`flex items-center gap-2 mb-2 p-2 rounded border transition ${item.selected ? 'bg-white border-purple-200' : 'bg-gray-50 border-transparent opacity-60'}`}>
                                                                    <input 
                                                                        type="checkbox" 
                                                                        checked={item.selected} 
                                                                        onChange={e => updateItem(time, idx, 'selected', e.target.checked)} 
                                                                        className="cursor-pointer"
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
                                                                            className="w-14 p-1 border rounded text-center text-sm font-bold bg-white focus:ring-1 focus:ring-purple-400 outline-none"
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
                                                                    <button onClick={() => removeItem(time, idx)} className="text-red-400 hover:text-red-600 ml-1 font-bold text-lg">×</button>
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
                        </>
                    )}
                </div>

                {/* RIGHT: Summary & Warnings */}
                {typeof currentDay === 'number' ? (
                <div className="lg:col-span-3 space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-purple-600 sticky top-4">
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <span>📊</span> Daily Analysis (Selected)
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
                ) : <div className="lg:col-span-3"></div> }
            </div>
        </div>
    );
};