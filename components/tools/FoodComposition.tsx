
import React, { useState, useMemo, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { foodCompositionData, FoodCompositionItem } from '../../data/foodCompositionData';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { SavedMeal } from '../../types';
import Toast from '../Toast';

interface FoodCompositionProps {
    onClose?: () => void;
}

interface MealItem {
    item: FoodCompositionItem;
    weight: number; // grams
}

// Interface representing the Supabase DB Schema
interface FoodDBRow {
    id: number;
    code: number;
    food_name: string;
    food_group: string;
    energy_kcal: number;
    protein_g: number;
    fat_g: number;
    carbohydrate_g: number;
    fiber_g: number;
    water_g: number;
    ash_g: number;
    calcium_mg: number;
    phosphorus_mg: number;
    magnesium_mg: number;
    iron_mg: number;
    zinc_mg: number;
    copper_mg: number;
    sodium_mg: number;
    potassium_mg: number;
    vitamin_a_ugre: number;
    vitamin_c_mg: number;
    riboflavin_mg: number;
    thiamin_mg: number;
    refuse_percent: number;
}

// Helper to calculate nutrition for any item/weight
const calculateNutrition = (item: FoodCompositionItem, weight: number) => {
    const factor = weight / 100;
    return {
        energy: item.energy * factor,
        protein: item.protein * factor,
        fat: item.fat * factor,
        carb: item.carb * factor,
        fiber: item.fiber * factor,
        water: item.water * factor,
        ash: item.ash * factor,
        
        calcium: item.calcium * factor,
        iron: item.iron * factor,
        sodium: item.sodium * factor,
        potassium: item.potassium * factor,
        phosphorus: item.phosphorus * factor,
        magnesium: (item.magnesium || 0) * factor,
        zinc: (item.zinc || 0) * factor,
        copper: (item.copper || 0) * factor,
        
        vitC: item.vitC * factor,
        vitA: (item.vitA || 0) * factor,
        thiamin: (item.thiamin || 0) * factor,
        riboflavin: (item.riboflavin || 0) * factor,
        
        refuse: item.refuse // Percentage doesn't scale with weight directly for display, but useful context
    };
};

// Nutrition Label Component
const NutritionLabel: React.FC<{ data: any; weight: number; title?: string }> = ({ data, weight, title }) => {
    // DV baselines (approximate based on 2000 kcal diet)
    const dv = {
        fat: 78,
        sodium: 2300,
        carb: 275,
        fiber: 28,
        protein: 50
    };

    const getDV = (val: number, base: number) => {
        if (base === 0) return 0;
        return Math.round((val / base) * 100);
    };

    return (
        <div className="border-2 border-black bg-white text-black font-sans p-4 shadow-md w-full rounded-sm relative overflow-hidden text-sm leading-normal">
            {/* Decorative background logo opacity */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10rem] opacity-[0.03] pointer-events-none">🥗</div>

            {title && <h3 className="text-center font-black text-sm mb-2 border-b-2 border-black pb-1 uppercase tracking-widest truncate">{title}</h3>}
            
            <h2 className="font-black text-4xl leading-none mb-1">Nutrition Facts</h2>
            <div className="flex justify-between items-end border-b-[8px] border-black pb-1 mb-2">
                <div>
                    <p className="text-base font-bold">Serving Size</p>
                    <p className="text-xs text-gray-500">Refuse: {data.refuse}%</p>
                </div>
                <span className="font-black text-2xl">{weight}g</span>
            </div>
            
            <div className="flex justify-between items-end border-b-4 border-black pb-1 mb-1">
                <div>
                    <div className="font-bold text-sm">Amount per serving</div>
                    <div className="font-black text-2xl">Calories</div>
                </div>
                <div className="font-black text-5xl">{data.energy.toFixed(0)}</div>
            </div>

            <div className="text-sm font-medium">
                <div className="text-right text-xs font-bold border-b border-black mb-1 pt-1">% Daily Value*</div>

                {/* Macros Section */}
                <div className="border-b border-gray-300 py-1 flex justify-between items-center group hover:bg-gray-50 transition">
                    <span className="flex items-center gap-2"><span className="text-base">🛢️</span> <span className="font-black">Total Fat</span></span>
                    <span className="font-bold text-red-600">{data.fat.toFixed(1)}g <span className="text-black text-xs font-normal ml-1">({getDV(data.fat, dv.fat)}%)</span></span>
                </div>

                <div className="border-b border-gray-300 py-1 flex justify-between items-center group hover:bg-gray-50 transition">
                    <span className="flex items-center gap-2"><span className="text-base">🍞</span> <span className="font-black">Total Carb</span></span>
                    <span className="font-bold text-blue-600">{data.carb.toFixed(1)}g <span className="text-black text-xs font-normal ml-1">({getDV(data.carb, dv.carb)}%)</span></span>
                </div>

                <div className="border-b border-gray-300 py-1 pl-6 flex justify-between items-center text-gray-700 bg-gray-50/50">
                    <span className="flex items-center gap-1 text-sm">🥦 Dietary Fiber</span>
                    <span className="font-bold text-sm">{data.fiber.toFixed(1)}g <span className="text-xs font-normal">({getDV(data.fiber, dv.fiber)}%)</span></span>
                </div>

                <div className="border-b-[4px] border-black py-1 flex justify-between items-center group hover:bg-gray-50 transition">
                    <span className="flex items-center gap-2"><span className="text-base">🥩</span> <span className="font-black">Protein</span></span>
                    <span className="font-bold text-green-700">{data.protein.toFixed(1)}g</span>
                </div>

                {/* Extended Details (Water/Ash) */}
                <div className="grid grid-cols-2 gap-4 border-b border-gray-300 py-2 text-xs text-gray-600">
                    <div className="flex justify-between">
                        <span>💧 Water</span>
                        <span className="font-bold">{data.water.toFixed(1)} g</span>
                    </div>
                    <div className="flex justify-between">
                        <span>⚱️ Ash</span>
                        <span className="font-bold">{data.ash.toFixed(2)} g</span>
                    </div>
                </div>

                {/* Minerals Grid */}
                <div className="py-2">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-gray-500 mb-1">Minerals</h4>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs font-medium">
                        <div className="flex justify-between border-b border-gray-200 py-0.5">
                            <span>🦴 Calcium</span>
                            <span className="font-bold text-blue-800">{data.calcium.toFixed(0)} mg</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-200 py-0.5">
                            <span>🩸 Iron</span>
                            <span className="font-bold text-red-800">{data.iron.toFixed(2)} mg</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-200 py-0.5">
                            <span>🍌 Potassium</span>
                            <span className="font-bold text-purple-700">{data.potassium.toFixed(0)} mg</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-200 py-0.5">
                            <span>🧂 Sodium</span>
                            <span className="font-bold text-gray-700">{data.sodium.toFixed(0)} mg</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-200 py-0.5">
                            <span>✨ Phosphorus</span>
                            <span className="font-bold text-teal-700">{data.phosphorus.toFixed(0)} mg</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-200 py-0.5">
                            <span>⚙️ Magnesium</span>
                            <span className="font-bold text-gray-600">{data.magnesium.toFixed(0)} mg</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-200 py-0.5">
                            <span>🛡️ Zinc</span>
                            <span className="font-bold text-gray-700">{data.zinc.toFixed(2)} mg</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-200 py-0.5">
                            <span>🥉 Copper</span>
                            <span className="font-bold text-orange-800">{data.copper.toFixed(2)} mg</span>
                        </div>
                    </div>
                </div>

                {/* Vitamins Grid */}
                <div className="py-2 border-t border-black">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-gray-500 mb-1">Vitamins</h4>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs font-medium">
                        <div className="flex justify-between border-b border-gray-200 py-0.5">
                            <span>🍊 Vit C</span>
                            <span className="font-bold text-orange-600">{data.vitC.toFixed(1)} mg</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-200 py-0.5">
                            <span>👁️ Vit A</span>
                            <span className="font-bold text-green-600">{data.vitA.toFixed(0)} ugRE</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-200 py-0.5">
                            <span>⚡ Thiamin (B1)</span>
                            <span className="font-bold text-gray-700">{data.thiamin.toFixed(2)} mg</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-200 py-0.5">
                            <span>💡 Riboflavin (B2)</span>
                            <span className="font-bold text-yellow-600">{data.riboflavin.toFixed(2)} mg</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="text-[10px] leading-tight text-gray-500 pt-2 font-medium border-t border-gray-300 mt-1">
                * The % Daily Value (DV) tells you how much a nutrient in a serving of food contributes to a daily diet. 2,000 calories a day is used for general nutrition advice.
            </div>
        </div>
    );
};

// Nutrient Options for Composition Filter
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

const FoodComposition: React.FC<FoodCompositionProps> = ({ onClose }) => {
    const { t } = useLanguage();
    const { session } = useAuth();
    
    // --- States ---
    const [activeData, setActiveData] = useState<FoodCompositionItem[]>(foodCompositionData);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [dataSource, setDataSource] = useState<'local' | 'cloud'>('local');
    const [syncMsg, setSyncMsg] = useState('');

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    
    // Advanced Filters State
    const [showFilters, setShowFilters] = useState(false);
    const [compositionFilters, setCompositionFilters] = useState<Array<{ id: number; key: keyof FoodCompositionItem; op: '>' | '<' | '='; val: number }>>([]);

    // Editor / Analysis State
    const [selectedItem, setSelectedItem] = useState<FoodCompositionItem | null>(null);
    const [inputWeight, setInputWeight] = useState<number>(100);
    const [mealItems, setMealItems] = useState<MealItem[]>([]);
    
    // Label View State (Total vs Single Item)
    const [viewMode, setViewMode] = useState<'total' | 'item'>('total');
    const [viewingItemIndex, setViewingItemIndex] = useState<number | null>(null);

    // --- SAVE / LOAD STATE ---
    const [showLoadModal, setShowLoadModal] = useState(false);
    const [planName, setPlanName] = useState('');
    const [loadedPlanId, setLoadedPlanId] = useState<string | null>(null);
    const [lastSavedName, setLastSavedName] = useState<string>('');
    const [savedPlans, setSavedPlans] = useState<SavedMeal[]>([]);
    const [statusMsg, setStatusMsg] = useState('');
    const [isLoadingPlans, setIsLoadingPlans] = useState(false);
    const [loadSearchQuery, setLoadSearchQuery] = useState('');

    // --- DB Integration ---
    const mapDBToItem = (row: FoodDBRow): FoodCompositionItem => ({
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
    });

    const mapItemToDB = (item: FoodCompositionItem) => ({
        code: item.code,
        food_name: item.food,
        food_group: item.category,
        energy_kcal: item.energy,
        protein_g: item.protein,
        fat_g: item.fat,
        carbohydrate_g: item.carb,
        fiber_g: item.fiber,
        water_g: item.water,
        ash_g: item.ash,
        calcium_mg: item.calcium,
        phosphorus_mg: item.phosphorus,
        magnesium_mg: item.magnesium,
        iron_mg: item.iron,
        zinc_mg: item.zinc,
        copper_mg: item.copper,
        sodium_mg: item.sodium,
        potassium_mg: item.potassium,
        vitamin_a_ugre: item.vitA,
        vitamin_c_mg: item.vitC,
        riboflavin_mg: item.riboflavin,
        thiamin_mg: item.thiamin,
        refuse_percent: item.refuse
    });

    useEffect(() => {
        const fetchDB = async () => {
            setIsLoadingData(true);
            try {
                const { data, error } = await supabase
                    .from('food_composition')
                    .select('*')
                    .order('code', { ascending: true })
                    .limit(1000); // Reasonable limit for client-side functionality

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
                console.warn("Using local food data. DB Error:", err);
                setDataSource('local');
            } finally {
                setIsLoadingData(false);
            }
        };
        fetchDB();
    }, []);

    const handleSyncToCloud = async () => {
        if (!window.confirm("This will upload all local food items to the Supabase database. Continue?")) return;
        setSyncMsg('Syncing...');
        try {
            const payload = foodCompositionData.map(mapItemToDB);
            // Insert in batches to avoid payload limits
            const { error } = await supabase.from('food_composition').insert(payload);
            
            if (error) throw error;
            setSyncMsg('Success! Data uploaded.');
            window.location.reload(); // Reload to fetch from cloud
        } catch (err: any) {
            console.error(err);
            setSyncMsg('Error: ' + err.message);
        }
    };

    // --- Save/Load Logic ---
    const fetchPlans = async () => {
        if (!session) return;
        setIsLoadingPlans(true);
        setLoadSearchQuery('');
        try {
            const { data, error } = await supabase
              .from('saved_meals')
              .select('*')
              .eq('tool_type', 'food-composition')
              .eq('user_id', session.user.id)
              .order('created_at', { ascending: false });
            
            if (error) throw error;
            if (data) setSavedPlans(data);
        } catch (err) {
            console.error('Error fetching plans:', err);
            setStatusMsg("Error loading lists.");
        } finally {
            setIsLoadingPlans(false);
        }
    };

    const savePlan = async () => {
        if (!planName.trim()) {
            alert("Please enter a label for this food list.");
            return;
        }
        if (!session) return;
        
        setStatusMsg("Saving...");
        const planData = { mealItems };
        const timestamp = new Date().toISOString();
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
                        tool_type: 'food-composition',
                        data: planData,
                        created_at: timestamp
                    })
                    .select()
                    .single();
                if (error) throw error;
                data = inserted;
            }
            
            if (data) {
                setLoadedPlanId(data.id);
                setLastSavedName(data.name);
                setStatusMsg(isUpdate ? "List Updated Successfully!" : "List Saved Successfully!");
                fetchPlans();
                setTimeout(() => setStatusMsg(''), 3000);
            }
        } catch (err: any) {
            console.error(err);
            setStatusMsg("Failed to save: " + err.message);
        }
    };

    const loadPlan = (plan: SavedMeal) => {
        if (!plan.data || !plan.data.mealItems) return;
        setMealItems([...plan.data.mealItems]);
        setPlanName(plan.name);
        setLoadedPlanId(plan.id);
        setLastSavedName(plan.name);
        setShowLoadModal(false);
        setStatusMsg("List loaded successfully.");
        setTimeout(() => setStatusMsg(''), 3000);
    };

    const deletePlan = async (id: string) => {
        if (!window.confirm("Delete this saved list?")) return;
        try {
            const { error } = await supabase.from('saved_meals').delete().eq('id', id).eq('user_id', session?.user.id);
            if (error) throw error;
            setSavedPlans(prev => prev.filter(p => p.id !== id));
            if (loadedPlanId === id) {
                setLoadedPlanId(null);
                setPlanName('');
                setLastSavedName('');
            }
        } catch (err) {
            console.error("Error deleting:", err);
        }
    };

    const filteredSavedPlans = useMemo(() => {
        if (!loadSearchQuery) return savedPlans;
        const q = loadSearchQuery.toLowerCase();
        return savedPlans.filter(plan => plan.name.toLowerCase().includes(q));
    }, [savedPlans, loadSearchQuery]);

    // --- Memos ---
    const categories = useMemo(() => {
        const cats = new Set(activeData.map(d => d.category));
        return ['All', ...Array.from(cats)];
    }, [activeData]);

    const filteredData = useMemo(() => {
        let data = activeData;
        
        // 1. Filter by Category
        if (selectedCategory !== 'All') {
            data = data.filter(d => d.category === selectedCategory);
        }

        // 2. Filter by Name/Code Search
        if (searchQuery) {
            const q = searchQuery.toLowerCase().trim();
            data = data.filter(item => 
                item.food.toLowerCase().includes(q) || 
                String(item.code).includes(q)
            );
        }

        // 3. Filter by Composition (Advanced)
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
    }, [searchQuery, selectedCategory, compositionFilters, activeData]);

    // --- Filter Handlers ---
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

    // --- Meal Handlers ---
    const handleDatabaseSelect = (item: FoodCompositionItem) => {
        setSelectedItem(item);
        setInputWeight(100);
        setViewMode('total');
        setViewingItemIndex(null);
    };

    const addToMeal = () => {
        if (selectedItem && inputWeight > 0) {
            setMealItems(prev => [...prev, { item: selectedItem, weight: inputWeight }]);
        }
    };

    const updateMealItem = () => {
        if (viewingItemIndex !== null && selectedItem && inputWeight > 0) {
            const newItems = [...mealItems];
            newItems[viewingItemIndex] = { item: selectedItem, weight: inputWeight };
            setMealItems(newItems);
        }
    };

    const removeFromMeal = (index: number) => {
        setMealItems(prev => prev.filter((_, i) => i !== index));
        if (viewingItemIndex === index) {
            setViewMode('total');
            setViewingItemIndex(null);
        } else if (viewingItemIndex !== null && viewingItemIndex > index) {
            setViewingItemIndex(viewingItemIndex - 1);
        }
    };

    const handleMealItemClick = (index: number) => {
        const mealItem = mealItems[index];
        setSelectedItem(mealItem.item);
        setInputWeight(mealItem.weight);
        setViewingItemIndex(index);
        setViewMode('item');
    };

    const updateInlineWeight = (index: number, newWeight: number) => {
        setMealItems(prev => prev.map((item, i) => i === index ? { ...item, weight: Math.max(0, newWeight) } : item));
        if (viewingItemIndex === index) {
            setInputWeight(newWeight);
        }
    };

    const selectedItemCalculated = useMemo(() => {
        if (!selectedItem) return null;
        return calculateNutrition(selectedItem, inputWeight);
    }, [selectedItem, inputWeight]);

    const mealTotals = useMemo(() => {
        const totals = {
            energy: 0, protein: 0, fat: 0, carb: 0, fiber: 0,
            calcium: 0, iron: 0, sodium: 0, potassium: 0, phosphorus: 0, 
            magnesium: 0, zinc: 0, copper: 0,
            vitC: 0, vitA: 0, thiamin: 0, riboflavin: 0,
            water: 0, ash: 0, refuse: 0
        };
        let totalWeight = 0;

        mealItems.forEach(({ item, weight }) => {
            const nut = calculateNutrition(item, weight);
            totalWeight += weight;
            totals.energy += nut.energy;
            totals.protein += nut.protein;
            totals.fat += nut.fat;
            totals.carb += nut.carb;
            totals.fiber += nut.fiber;
            totals.water += nut.water;
            totals.ash += nut.ash;
            
            totals.calcium += nut.calcium;
            totals.iron += nut.iron;
            totals.sodium += nut.sodium;
            totals.potassium += nut.potassium;
            totals.phosphorus += nut.phosphorus;
            totals.magnesium += nut.magnesium;
            totals.zinc += nut.zinc;
            totals.copper += nut.copper;
            
            totals.vitC += nut.vitC;
            totals.vitA += nut.vitA;
            totals.thiamin += nut.thiamin;
            totals.riboflavin += nut.riboflavin;
        });
        return { totals, totalWeight };
    }, [mealItems]);

    const labelData = useMemo(() => {
        if (viewMode === 'item' && viewingItemIndex !== null && mealItems[viewingItemIndex]) {
            const item = mealItems[viewingItemIndex];
            return {
                data: calculateNutrition(item.item, item.weight),
                weight: item.weight,
                title: `Item: ${item.item.food}`
            };
        }
        return {
            data: mealTotals.totals,
            weight: mealTotals.totalWeight,
            title: "Meal Summary (Total)"
        };
    }, [viewMode, viewingItemIndex, mealItems, mealTotals]);

    return (
        <div className="max-w-[1920px] mx-auto animate-fade-in pb-12">
            <Toast message={statusMsg || syncMsg} />
            
            {/* Header */}
            <div className="flex flex-col xl:flex-row justify-between items-center mb-6 bg-white p-6 rounded-xl shadow-sm border border-gray-100 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--color-heading)] flex items-center gap-2">
                        <span>🧪</span> {t.tools.foodComposition.title}
                    </h1>
                    <p className="text-sm text-gray-500 flex items-center gap-2 flex-wrap">
                        Analyze food composition, check nutrition facts, and build meals.
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${dataSource === 'cloud' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
                            {dataSource === 'cloud' ? '☁️ Cloud DB' : '💾 Local Data'}
                        </span>
                    </p>
                </div>
                
                {/* Global Controls: Save / Load / Sync */}
                <div className="flex gap-2 items-center flex-wrap justify-center">
                    {session && (
                        <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-lg border border-gray-200">
                            <input 
                                type="text"
                                placeholder="Label for Saved List"
                                value={planName}
                                onChange={(e) => setPlanName(e.target.value)}
                                className="p-2 text-xs border rounded w-40 outline-none focus:ring-1 focus:ring-blue-400"
                            />
                            <button 
                                onClick={savePlan} 
                                className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition"
                                title="Save Food List"
                            >
                                💾
                            </button>
                            <button 
                                onClick={() => { fetchPlans(); setShowLoadModal(true); }}
                                className="bg-purple-600 text-white p-2 rounded hover:bg-purple-700 transition"
                                title="Load Saved List"
                            >
                                📂
                            </button>
                        </div>
                    )}

                    {session && dataSource === 'local' && (
                        <button 
                            onClick={handleSyncToCloud}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-lg transition text-xs font-bold border border-blue-200 whitespace-nowrap"
                        >
                            ☁️ Sync
                        </button>
                    )}
                    {onClose && (
                        <button onClick={onClose} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition text-sm font-medium whitespace-nowrap">
                            Close
                        </button>
                    )}
                </div>
            </div>

            {/* 4 Cards Layout (Responsive Grid) */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-start">
                
                {/* CARD 1: DATABASE SEARCH */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col overflow-hidden h-[650px]">
                    <div className="p-4 border-b border-gray-100 bg-gray-50">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                <span>🔍</span> Database
                            </h3>
                            <button 
                                className={`text-xs px-2 py-1 rounded transition border ${showFilters ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50'}`}
                                onClick={() => setShowFilters(!showFilters)}
                            >
                                {showFilters ? 'Hide Filters' : 'Composition Search'}
                            </button>
                        </div>

                        {/* Search Bar with Clear Button */}
                        <div className="relative mb-3">
                            <input 
                                type="text" 
                                placeholder="Search by name or code..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-sm pr-8 font-mono"
                                dir="ltr"
                            />
                            {searchQuery ? (
                                <button 
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-2 top-2.5 text-gray-400 hover:text-red-500 font-bold"
                                    title="Clear Search"
                                >
                                    ✕
                                </button>
                            ) : (
                                <span className="absolute right-2 top-2.5 text-gray-400">🔍</span>
                            )}
                        </div>

                        {/* ADVANCED FILTERS PANEL */}
                        {showFilters && (
                            <div className="mb-3 bg-blue-50 p-2 rounded-lg border border-blue-100 animate-fade-in">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">Active Filters ({compositionFilters.length})</span>
                                    <button onClick={addFilter} className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded hover:bg-blue-700">+ Add Rule</button>
                                </div>
                                <div className="space-y-2 max-h-32 overflow-y-auto pr-1 scrollbar-thin">
                                    {compositionFilters.map(f => (
                                        <div key={f.id} className="flex gap-1 items-center">
                                            <select 
                                                className="w-24 text-[10px] p-1 border rounded"
                                                value={f.key}
                                                onChange={(e) => updateFilter(f.id, 'key', e.target.value)}
                                            >
                                                {NUTRIENT_OPTS.map(opt => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                            
                                            <select 
                                                className="w-10 text-[10px] p-1 border rounded text-center font-bold"
                                                value={f.op}
                                                onChange={(e) => updateFilter(f.id, 'op', e.target.value)}
                                            >
                                                <option value=">">&gt;</option>
                                                <option value="<">&lt;</option>
                                                <option value="=">=</option>
                                            </select>

                                            <input 
                                                type="number" 
                                                className="w-12 text-[10px] p-1 border rounded"
                                                value={f.val}
                                                onChange={(e) => updateFilter(f.id, 'val', Number(e.target.value))}
                                            />

                                            <button onClick={() => removeFilter(f.id)} className="text-red-500 hover:text-red-700 text-xs px-1">✕</button>
                                        </div>
                                    ))}
                                    {compositionFilters.length === 0 && (
                                        <div className="text-[10px] text-gray-400 text-center py-2 italic">No active filters. Click + Add Rule.</div>
                                    )}
                                </div>
                            </div>
                        )}
                        
                        {/* Category Dropdown (Replaces horizontal scroll) */}
                        <div className="mb-1">
                            <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">Filter Category</label>
                            <select 
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg text-xs font-bold bg-white focus:ring-1 focus:ring-blue-400 outline-none"
                            >
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex-grow overflow-y-auto p-2 space-y-2 bg-gray-50/50">
                        {isLoadingData ? (
                            <div className="p-8 text-center text-gray-400 text-sm">Loading database...</div>
                        ) : filteredData.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 text-sm">No foods found.</div>
                        ) : (
                            filteredData.map(item => (
                                <div 
                                    key={item.id}
                                    onClick={() => handleDatabaseSelect(item)}
                                    className={`p-3 border rounded-lg cursor-pointer transition hover:shadow-md flex flex-col gap-1 ${selectedItem?.id === item.id && viewingItemIndex === null ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-400' : 'bg-white border-gray-200 hover:border-blue-300'}`}
                                >
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-bold text-gray-800 text-sm leading-tight">{item.food}</h4>
                                        <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-mono">#{item.code}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-gray-500 mt-1 font-mono">
                                        <span className="text-green-700 font-bold">{item.energy} kcal</span>
                                        <span>P: {item.protein}g</span>
                                        <span>C: {item.carb}g</span>
                                        <span>F: {item.fat}g</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* CARD 2: SELECTED ITEM ANALYSIS */}
                <div className={`bg-white rounded-xl shadow-lg border flex flex-col overflow-hidden relative transition-colors ${viewingItemIndex !== null ? 'border-yellow-300 ring-2 ring-yellow-100' : 'border-gray-200'}`}>
                    <div className={`p-4 border-b flex justify-between items-center ${viewingItemIndex !== null ? 'bg-yellow-50 border-yellow-200' : 'bg-blue-50 border-blue-100'}`}>
                        <h3 className={`font-bold mb-1 flex items-center gap-2 ${viewingItemIndex !== null ? 'text-yellow-800' : 'text-blue-900'}`}>
                            <span>🥗</span> {viewingItemIndex !== null ? 'Edit Item' : 'Item Analysis'}
                        </h3>
                        {viewingItemIndex !== null && <span className="text-[10px] font-bold bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded">EDITING</span>}
                    </div>
                    
                    {selectedItem && selectedItemCalculated ? (
                        <div className="p-4 flex flex-col gap-4">
                            <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-sm text-center">
                                <h4 className="font-bold text-gray-800 text-lg mb-1 truncate" title={selectedItem.food}>{selectedItem.food}</h4>
                                <span className="text-xs text-blue-600 font-bold uppercase tracking-wider block">{selectedItem.category}</span>
                            </div>

                            <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg border border-gray-200 justify-between">
                                <div className="flex items-center gap-3">
                                    <label className="text-sm font-bold text-gray-600 whitespace-nowrap uppercase">Weight (g)</label>
                                    <input 
                                        type="number" 
                                        value={inputWeight}
                                        onChange={(e) => setInputWeight(Math.max(0, Number(e.target.value)))}
                                        className="w-24 p-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-center font-bold text-xl"
                                    />
                                </div>
                                {viewingItemIndex !== null ? (
                                    <button 
                                        onClick={updateMealItem}
                                        className="h-12 w-16 bg-yellow-500 text-white rounded-lg font-bold hover:bg-yellow-600 transition shadow-md flex items-center justify-center text-sm"
                                        title="Update Item"
                                    >
                                        Update
                                    </button>
                                ) : (
                                    <button 
                                        onClick={addToMeal}
                                        className="h-12 w-14 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition shadow-md flex items-center justify-center text-2xl"
                                        title="Add to Meal"
                                    >
                                        +
                                    </button>
                                )}
                            </div>

                            {/* NUTRITION LABEL WRAPPER */}
                            <div className="w-full">
                                <NutritionLabel 
                                    data={selectedItemCalculated} 
                                    weight={inputWeight} 
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="flex-grow flex flex-col items-center justify-center text-gray-400 p-8 text-center bg-gray-50/30 min-h-[400px]">
                            <span className="text-6xl mb-4 opacity-20">👈</span>
                            <p>Select a food item to view analysis.</p>
                        </div>
                    )}
                </div>

                {/* CARD 3: MEAL LIST (CALCULATION) */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col overflow-hidden relative h-[650px]">
                    <div className="p-4 border-b border-gray-100 bg-green-50 flex justify-between items-center">
                        <h3 className="font-bold text-green-900 flex items-center gap-2">
                            <span>🍽️</span> Meal List
                        </h3>
                        <span className="bg-white text-green-800 text-xs font-bold px-2 py-1 rounded border border-green-200">
                            {mealItems.length}
                        </span>
                    </div>

                    <div className="flex-grow overflow-y-auto p-2 space-y-2 bg-gray-50/50">
                        {mealItems.map((item, idx) => {
                            const factor = item.weight / 100;
                            const isViewing = viewingItemIndex === idx;
                            return (
                                <div 
                                    key={idx} 
                                    onClick={() => handleMealItemClick(idx)}
                                    className={`flex flex-col gap-1 p-2 rounded border shadow-sm transition-all cursor-pointer ${
                                        isViewing 
                                        ? 'bg-yellow-50 border-yellow-300 ring-1 ring-yellow-200' 
                                        : 'bg-white border-gray-200 hover:border-green-300'
                                    }`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="font-bold text-gray-800 text-sm truncate flex-grow pr-2" title={item.item.food}>
                                            {item.item.food}
                                        </div>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); removeFromMeal(idx); }}
                                            className="text-red-400 hover:text-red-600 hover:bg-red-50 p-0.5 rounded transition text-lg leading-none"
                                            title="Remove"
                                        >
                                            ×
                                        </button>
                                    </div>
                                    
                                    <div className="flex items-center justify-between mt-1">
                                        <div className="flex items-center gap-1 bg-white/50 rounded px-2 py-0.5 border border-transparent hover:border-gray-300" onClick={e => e.stopPropagation()}>
                                            <input 
                                                type="number" 
                                                value={item.weight} 
                                                onChange={(e) => updateInlineWeight(idx, Number(e.target.value))}
                                                className="w-12 text-sm text-center bg-transparent border-b border-gray-400 focus:border-green-500 outline-none font-bold text-gray-700"
                                            />
                                            <span className="text-xs text-gray-500">g</span>
                                        </div>
                                        <div className="text-sm font-mono font-bold text-green-700">
                                            {(item.item.energy * factor).toFixed(0)} kcal
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {mealItems.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                <span className="text-4xl mb-2 opacity-20">🛒</span>
                                <p className="text-sm">Meal list is empty</p>
                            </div>
                        )}
                    </div>
                    {mealItems.length > 0 && (
                        <div className="p-3 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                            <span className="text-xs font-bold text-gray-500 uppercase">Total Items</span>
                            <button onClick={() => setMealItems([])} className="text-xs text-red-600 hover:underline">Clear All</button>
                        </div>
                    )}
                </div>

                {/* CARD 4: MEAL TOTALS / ITEM LABEL */}
                <div className={`bg-white rounded-xl shadow-lg border flex flex-col overflow-hidden relative transition-colors ${viewMode === 'item' ? 'border-yellow-200' : 'border-gray-200'}`}>
                    <div 
                        className={`p-4 border-b flex justify-between items-center cursor-pointer hover:opacity-80 transition ${viewMode === 'item' ? 'bg-yellow-100 border-yellow-200' : 'bg-purple-50 border-gray-100'}`}
                        onClick={() => { setViewMode('total'); setViewingItemIndex(null); }}
                        title="Click to reset to Meal Summary"
                    >
                        <h3 className={`font-bold flex items-center gap-2 ${viewMode === 'item' ? 'text-yellow-900' : 'text-purple-900'}`}>
                            <span>{viewMode === 'item' ? '🏷️' : '📊'}</span> {viewMode === 'item' ? 'Selected Item Label' : 'Total Nutrition'}
                        </h3>
                        {viewMode === 'item' && <span className="text-[10px] bg-white text-yellow-800 px-2 py-0.5 rounded font-bold border border-yellow-200">Reset</span>}
                    </div>

                    <div className="p-4 bg-white flex flex-col min-h-[400px]">
                        {mealItems.length > 0 ? (
                            <div className="w-full flex-grow">
                                <NutritionLabel 
                                    data={labelData.data} 
                                    weight={labelData.weight} 
                                    title={labelData.title}
                                />
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-300">
                                <span className="text-4xl mb-2 opacity-20">🧾</span>
                                <p className="text-sm text-center px-4">Add items to generate the Nutrition Facts label.</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* Load Modal */}
            {showLoadModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 backdrop-blur-sm no-print">
                    <div className="bg-white p-6 rounded-xl w-full max-w-lg shadow-2xl h-[80vh] flex flex-col animate-fade-in">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">Load Saved List</h3>
                            <button onClick={() => setShowLoadModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>
                        
                        <div className="mb-4">
                            <input 
                                type="text" 
                                placeholder="Search saved lists..."
                                value={loadSearchQuery}
                                onChange={(e) => setLoadSearchQuery(e.target.value)}
                                className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                            />
                        </div>

                        <div className="flex-grow overflow-y-auto space-y-2 pr-2">
                            {isLoadingPlans ? (
                                <div className="text-center py-10 text-gray-400">Loading...</div>
                            ) : filteredSavedPlans.length === 0 ? (
                                <div className="text-center py-10 text-gray-400">No saved lists found.</div>
                            ) : (
                                filteredSavedPlans.map(plan => (
                                    <div key={plan.id} className="flex justify-between items-center p-3 bg-gray-50 hover:bg-blue-50 rounded-lg border border-gray-100 group">
                                        <div>
                                            <div className="font-bold text-gray-800">{plan.name}</div>
                                            <div className="text-xs text-gray-500">{new Date(plan.created_at).toLocaleDateString()}</div>
                                        </div>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                                            <button onClick={() => loadPlan(plan)} className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600">Load</button>
                                            <button onClick={() => deletePlan(plan.id)} className="px-3 py-1 bg-red-100 text-red-600 text-xs rounded hover:bg-red-200">Del</button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FoodComposition;
