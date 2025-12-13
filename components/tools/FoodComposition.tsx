
import React, { useState, useMemo } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { foodCompositionData, FoodCompositionItem } from '../../data/foodCompositionData';

interface FoodCompositionProps {
    onClose?: () => void;
}

interface MealItem {
    item: FoodCompositionItem;
    weight: number; // grams
}

// Nutrition Label Component
const NutritionLabel: React.FC<{ data: any, weight: number, title?: string }> = ({ data, weight, title }) => {
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
        <div className="border-2 border-black bg-white text-black font-sans p-3 shadow-sm w-full rounded-sm relative overflow-hidden text-xs sm:text-sm">
            {/* Decorative background logo opacity */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[8rem] opacity-[0.03] pointer-events-none">🥗</div>

            {title && <h3 className="text-center font-black text-base mb-2 border-b-4 border-black pb-1 uppercase tracking-wider">{title}</h3>}
            
            <h2 className="font-black text-3xl leading-none mb-1">Nutrition Facts</h2>
            <p className="text-xs font-bold mb-1 flex justify-between items-end">
                <span>Serving Size</span>
                <span className="font-black text-xl">{weight}g</span>
            </p>
            
            <div className="h-2 bg-black my-1"></div>
            
            <div className="flex justify-between items-end border-b-4 border-black pb-1">
                <div>
                    <div className="font-bold text-base">Amount per serving</div>
                    <div className="font-black text-2xl">Calories</div>
                </div>
                <div className="font-black text-5xl">{data.energy.toFixed(0)}</div>
            </div>

            <div className="text-sm font-medium">
                <div className="text-right text-[10px] font-bold pt-1 border-b border-gray-400 mb-1">% Daily Value*</div>

                {/* Macros Section */}
                <div className="border-b border-gray-300 py-1 flex justify-between items-center group hover:bg-gray-50 transition">
                    <span className="flex items-center gap-1"><span className="text-lg">🛢️</span> <span className="font-black">Total Fat</span></span>
                    <span className="font-bold text-red-600">{data.fat.toFixed(1)}g <span className="text-black text-[10px] font-normal ml-1">({getDV(data.fat, dv.fat)}%)</span></span>
                </div>

                <div className="border-b border-gray-300 py-1 flex justify-between items-center group hover:bg-gray-50 transition">
                    <span className="flex items-center gap-1"><span className="text-lg">🧂</span> <span className="font-black">Sodium</span></span>
                    <span className="font-bold text-gray-600">{data.sodium.toFixed(0)}mg <span className="text-black text-[10px] font-normal ml-1">({getDV(data.sodium, dv.sodium)}%)</span></span>
                </div>

                <div className="border-b border-gray-300 py-1 flex justify-between items-center group hover:bg-gray-50 transition">
                    <span className="flex items-center gap-1"><span className="text-lg">🍞</span> <span className="font-black">Total Carb</span></span>
                    <span className="font-bold text-blue-600">{data.carb.toFixed(1)}g <span className="text-black text-[10px] font-normal ml-1">({getDV(data.carb, dv.carb)}%)</span></span>
                </div>

                <div className="border-b border-gray-300 py-1 pl-6 flex justify-between items-center text-gray-700 bg-gray-50/50">
                    <span className="flex items-center gap-1 text-xs">🥦 Dietary Fiber</span>
                    <span className="font-bold">{data.fiber.toFixed(1)}g <span className="text-[10px] font-normal">({getDV(data.fiber, dv.fiber)}%)</span></span>
                </div>

                <div className="border-b-[6px] border-black py-1 flex justify-between items-center group hover:bg-gray-50 transition">
                    <span className="flex items-center gap-1"><span className="text-lg">🥩</span> <span className="font-black">Protein</span></span>
                    <span className="font-bold text-green-700">{data.protein.toFixed(1)}g</span>
                </div>

                {/* Micronutrients - Compact Grid */}
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 py-2 text-[10px] sm:text-xs font-medium">
                    <div className="flex justify-between border-b border-gray-200 py-0.5">
                        <span>🍊 Vit C</span>
                        <span className="font-bold text-orange-600">{data.vitC.toFixed(1)} mg</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-200 py-0.5">
                        <span>🦴 Calc</span>
                        <span className="font-bold text-blue-800">{data.calcium.toFixed(0)} mg</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-200 py-0.5">
                        <span>🩸 Iron</span>
                        <span className="font-bold text-red-800">{data.iron.toFixed(2)} mg</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-200 py-0.5">
                        <span>🍌 Potas</span>
                        <span className="font-bold text-purple-700">{data.potassium.toFixed(0)} mg</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-200 py-0.5">
                        <span>⚙️ Zinc</span>
                        <span className="font-bold text-gray-700">{data.zinc?.toFixed(2) || '-'} mg</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-200 py-0.5">
                        <span>✨ Phos</span>
                        <span className="font-bold text-teal-700">{data.phosphorus.toFixed(0)} mg</span>
                    </div>
                </div>
            </div>
            
            <div className="text-[9px] leading-tight text-gray-500 pt-1 border-t border-gray-200">
                * %DV based on 2000 kcal diet.
            </div>
        </div>
    );
};

const FoodComposition: React.FC<FoodCompositionProps> = ({ onClose }) => {
    const { t, isRTL } = useLanguage();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [selectedItem, setSelectedItem] = useState<FoodCompositionItem | null>(null);
    const [mealItems, setMealItems] = useState<MealItem[]>([]);
    const [inputWeight, setInputWeight] = useState<number>(100);
    const [showSearchGuide, setShowSearchGuide] = useState(false);

    const categories = useMemo(() => {
        const cats = new Set(foodCompositionData.map(d => d.category));
        return ['All', ...Array.from(cats)];
    }, []);

    const filteredData = useMemo(() => {
        let data = foodCompositionData;
        
        // 1. Filter by Category
        if (selectedCategory !== 'All') {
            data = data.filter(d => d.category === selectedCategory);
        }

        // 2. Filter by Deep Search
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            data = data.filter(item => {
                // Priority Check: Name or Code
                if (item.food.toLowerCase().includes(q)) return true;
                if (String(item.code).includes(q)) return true;
                
                // Deep Check: Iterate all values (e.g. searching for specific calorie count '335')
                // We join all values into a string for a single broad check
                const allValues = Object.values(item).join(' ').toLowerCase();
                return allValues.includes(q);
            });
        }
        return data;
    }, [searchQuery, selectedCategory]);

    const addToMeal = () => {
        if (selectedItem && inputWeight > 0) {
            // Add new item
            setMealItems(prev => [...prev, { item: selectedItem, weight: inputWeight }]);
            setInputWeight(100); // Reset to default
        }
    };

    const removeFromMeal = (index: number) => {
        setMealItems(prev => prev.filter((_, i) => i !== index));
    };

    const updateMealItemWeight = (index: number, newWeight: number) => {
        setMealItems(prev => prev.map((item, i) => i === index ? { ...item, weight: Math.max(0, newWeight) } : item));
    };

    // Calculate details for the currently selected item based on weight
    const selectedItemCalculated = useMemo(() => {
        if (!selectedItem) return null;
        const factor = inputWeight / 100;
        return {
            energy: selectedItem.energy * factor,
            protein: selectedItem.protein * factor,
            fat: selectedItem.fat * factor,
            carb: selectedItem.carb * factor,
            fiber: selectedItem.fiber * factor,
            calcium: selectedItem.calcium * factor,
            iron: selectedItem.iron * factor,
            sodium: selectedItem.sodium * factor,
            potassium: selectedItem.potassium * factor,
            phosphorus: selectedItem.phosphorus * factor,
            vitC: selectedItem.vitC * factor,
            zinc: (selectedItem.zinc || 0) * factor
        };
    }, [selectedItem, inputWeight]);

    const mealTotals = useMemo(() => {
        const totals = {
            energy: 0, protein: 0, fat: 0, carb: 0, fiber: 0,
            calcium: 0, iron: 0, sodium: 0, potassium: 0, phosphorus: 0, vitC: 0, zinc: 0
        };
        let totalWeight = 0;

        mealItems.forEach(({ item, weight }) => {
            const factor = weight / 100;
            totalWeight += weight;
            totals.energy += item.energy * factor;
            totals.protein += item.protein * factor;
            totals.fat += item.fat * factor;
            totals.carb += item.carb * factor;
            totals.fiber += item.fiber * factor;
            totals.calcium += item.calcium * factor;
            totals.iron += item.iron * factor;
            totals.sodium += item.sodium * factor;
            totals.potassium += item.potassium * factor;
            totals.phosphorus += item.phosphorus * factor;
            totals.vitC += item.vitC * factor;
            totals.zinc += (item.zinc || 0) * factor;
        });
        return { totals, totalWeight };
    }, [mealItems]);

    return (
        <div className="max-w-[1920px] mx-auto animate-fade-in pb-12">
            
            {/* Header */}
            <div className="flex justify-between items-center mb-6 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--color-heading)] flex items-center gap-2">
                        <span>🧪</span> {t.tools.foodComposition.title}
                    </h1>
                    <p className="text-sm text-gray-500">Analyze food composition, check nutrition facts, and build meals.</p>
                </div>
                {onClose && (
                    <button onClick={onClose} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition text-sm font-medium">
                        Close Tool
                    </button>
                )}
            </div>

            {/* 4 Cards Layout (Responsive Grid) */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 h-[calc(100vh-200px)] min-h-[600px]">
                
                {/* CARD 1: DATABASE SEARCH */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gray-50">
                        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                            <span>🔍</span> Database
                        </h3>
                        <div className="relative">
                            <input 
                                type="text" 
                                placeholder="Search (Name, Code, Nutrient...)" 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-sm mb-3 pr-8"
                                dir={isRTL ? 'rtl' : 'ltr'}
                            />
                            <button 
                                className="absolute right-2 top-2.5 text-gray-400 hover:text-blue-600 text-xs"
                                onClick={() => setShowSearchGuide(!showSearchGuide)}
                                title="Search Guide"
                            >
                                ❓
                            </button>
                        </div>
                        {showSearchGuide && (
                            <div className="bg-blue-50 border border-blue-100 p-2 rounded text-[10px] text-blue-800 mb-2 leading-tight">
                                <strong>Search Tip:</strong> You can search by Name (e.g. 'Rice'), Code (e.g. '25'), or ANY nutrient value (e.g. '335' for calories).
                            </div>
                        )}
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition ${selectedCategory === cat ? 'bg-[var(--color-primary)] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'}`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-grow overflow-y-auto p-2 space-y-2 bg-gray-50/50">
                        {filteredData.map(item => (
                            <div 
                                key={item.id}
                                onClick={() => setSelectedItem(item)}
                                className={`p-3 border rounded-lg cursor-pointer transition hover:shadow-md flex flex-col gap-1 ${selectedItem?.id === item.id ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-400' : 'bg-white border-gray-200 hover:border-blue-300'}`}
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
                        ))}
                        {filteredData.length === 0 && (
                            <div className="p-8 text-center text-gray-400 text-sm">No foods found.</div>
                        )}
                    </div>
                </div>

                {/* CARD 2: SELECTED ITEM ANALYSIS */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col overflow-hidden relative">
                    <div className="p-4 border-b border-gray-100 bg-blue-50">
                        <h3 className="font-bold text-blue-900 mb-1 flex items-center gap-2">
                            <span>🥗</span> Item Analysis
                        </h3>
                    </div>
                    
                    {selectedItem && selectedItemCalculated ? (
                        <div className="flex-grow overflow-y-auto p-4 flex flex-col gap-4">
                            <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-sm text-center">
                                <h4 className="font-bold text-gray-800 text-base mb-1 truncate" title={selectedItem.food}>{selectedItem.food}</h4>
                                <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider block">{selectedItem.category}</span>
                            </div>

                            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                                <label className="text-xs font-bold text-gray-600 whitespace-nowrap uppercase">Weight (g)</label>
                                <input 
                                    type="number" 
                                    value={inputWeight}
                                    onChange={(e) => setInputWeight(Math.max(0, Number(e.target.value)))}
                                    className="w-full p-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-center font-bold text-lg"
                                />
                            </div>

                            {/* NUTRITION LABEL WRAPPER - SCROLLABLE IF NEEDED */}
                            <div className="flex-grow overflow-y-auto border border-gray-100 rounded">
                                <NutritionLabel 
                                    data={selectedItemCalculated} 
                                    weight={inputWeight} 
                                />
                            </div>

                            <button 
                                onClick={addToMeal}
                                className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition shadow-md flex items-center justify-center gap-2 mt-auto"
                            >
                                <span>+</span> Add to Meal
                            </button>
                        </div>
                    ) : (
                        <div className="flex-grow flex flex-col items-center justify-center text-gray-400 p-8 text-center bg-gray-50/30">
                            <span className="text-6xl mb-4 opacity-20">👈</span>
                            <p>Select a food item to view analysis.</p>
                        </div>
                    )}
                </div>

                {/* CARD 3: MEAL LIST (CALCULATION) */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col overflow-hidden relative">
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
                            return (
                                <div key={idx} className="flex flex-col gap-1 p-2 bg-white rounded border border-gray-200 shadow-sm hover:border-green-300 transition-colors">
                                    <div className="flex justify-between items-start">
                                        <div className="font-bold text-gray-800 text-sm truncate flex-grow pr-2" title={item.item.food}>
                                            {item.item.food}
                                        </div>
                                        <button 
                                            onClick={() => removeFromMeal(idx)}
                                            className="text-red-400 hover:text-red-600 hover:bg-red-50 p-0.5 rounded transition text-lg leading-none"
                                            title="Remove"
                                        >
                                            ×
                                        </button>
                                    </div>
                                    
                                    <div className="flex items-center justify-between mt-1">
                                        <div className="flex items-center gap-1 bg-gray-100 rounded px-2 py-0.5">
                                            <input 
                                                type="number" 
                                                value={item.weight} 
                                                onChange={(e) => updateMealItemWeight(idx, Number(e.target.value))}
                                                className="w-12 text-xs text-center bg-transparent border-b border-gray-400 focus:border-green-500 outline-none font-bold text-gray-700"
                                            />
                                            <span className="text-[10px] text-gray-500">g</span>
                                        </div>
                                        <div className="text-xs font-mono font-bold text-green-700">
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

                {/* CARD 4: MEAL TOTALS (LABEL) */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col overflow-hidden relative">
                    <div className="p-4 border-b border-gray-100 bg-purple-50 flex justify-between items-center">
                        <h3 className="font-bold text-purple-900 flex items-center gap-2">
                            <span>📊</span> Total Nutrition
                        </h3>
                    </div>

                    <div className="flex-grow overflow-y-auto p-4 bg-white flex flex-col">
                        {mealItems.length > 0 ? (
                            <div className="w-full flex-grow">
                                <NutritionLabel 
                                    data={mealTotals.totals} 
                                    weight={mealTotals.totalWeight} 
                                    title="Meal Summary"
                                />
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-300">
                                <span className="text-4xl mb-2 opacity-20">🧾</span>
                                <p className="text-sm text-center px-4">Add items to the Meal List to generate the aggregate Nutrition Facts label.</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default FoodComposition;
