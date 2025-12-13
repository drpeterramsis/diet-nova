
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
        <div className="border-2 border-black bg-white text-black font-sans p-4 shadow-xl max-w-sm mx-auto w-full rounded-sm relative overflow-hidden">
            {/* Decorative background logo opacity */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10rem] opacity-[0.03] pointer-events-none">🥗</div>

            {title && <h3 className="text-center font-black text-lg mb-2 border-b-4 border-black pb-1 uppercase tracking-wider">{title}</h3>}
            
            <h2 className="font-black text-5xl leading-none mb-1">Nutrition Facts</h2>
            <p className="text-sm font-bold mb-1 flex justify-between items-end">
                <span>Serving Size</span>
                <span className="font-black text-2xl">{weight}g</span>
            </p>
            
            <div className="h-3 bg-black my-1"></div>
            
            <div className="flex justify-between items-end border-b-4 border-black pb-2">
                <div>
                    <div className="font-bold text-lg">Amount per serving</div>
                    <div className="font-black text-3xl">Calories</div>
                </div>
                <div className="font-black text-6xl">{data.energy.toFixed(0)}</div>
            </div>

            <div className="text-sm font-medium">
                <div className="text-right text-xs font-bold pt-1 border-b border-gray-400 mb-1">% Daily Value*</div>

                {/* Macros Section */}
                <div className="border-b border-gray-300 py-1.5 flex justify-between items-center group hover:bg-gray-50 transition">
                    <span className="flex items-center gap-2"><span className="text-xl">🛢️</span> <span className="font-black">Total Fat</span></span>
                    <span className="font-bold text-red-600 text-xl">{data.fat.toFixed(1)}g <span className="text-black text-xs font-normal ml-1">({getDV(data.fat, dv.fat)}%)</span></span>
                </div>

                <div className="border-b border-gray-300 py-1.5 flex justify-between items-center group hover:bg-gray-50 transition">
                    <span className="flex items-center gap-2"><span className="text-xl">🧂</span> <span className="font-black">Sodium</span></span>
                    <span className="font-bold text-gray-600 text-lg">{data.sodium.toFixed(0)}mg <span className="text-black text-xs font-normal ml-1">({getDV(data.sodium, dv.sodium)}%)</span></span>
                </div>

                <div className="border-b border-gray-300 py-1.5 flex justify-between items-center group hover:bg-gray-50 transition">
                    <span className="flex items-center gap-2"><span className="text-xl">🍞</span> <span className="font-black">Total Carb</span></span>
                    <span className="font-bold text-blue-600 text-xl">{data.carb.toFixed(1)}g <span className="text-black text-xs font-normal ml-1">({getDV(data.carb, dv.carb)}%)</span></span>
                </div>

                <div className="border-b border-gray-300 py-1 pl-9 flex justify-between items-center text-gray-700 bg-gray-50/50">
                    <span className="flex items-center gap-1 text-sm">🥦 Dietary Fiber</span>
                    <span className="font-bold">{data.fiber.toFixed(1)}g <span className="text-xs font-normal">({getDV(data.fiber, dv.fiber)}%)</span></span>
                </div>

                <div className="border-b-[8px] border-black py-1.5 flex justify-between items-center group hover:bg-gray-50 transition">
                    <span className="flex items-center gap-2"><span className="text-xl">🥩</span> <span className="font-black">Protein</span></span>
                    <span className="font-bold text-green-700 text-xl">{data.protein.toFixed(1)}g</span>
                </div>

                {/* Micronutrients */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 py-3 text-xs font-medium">
                    <div className="flex justify-between border-b border-gray-200 py-1">
                        <span>🍊 Vitamin C</span>
                        <span className="font-bold text-orange-600">{data.vitC.toFixed(1)} mg</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-200 py-1">
                        <span>🦴 Calcium</span>
                        <span className="font-bold text-blue-800">{data.calcium.toFixed(0)} mg</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-200 py-1">
                        <span>🩸 Iron</span>
                        <span className="font-bold text-red-800">{data.iron.toFixed(2)} mg</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-200 py-1">
                        <span>🍌 Potassium</span>
                        <span className="font-bold text-purple-700">{data.potassium.toFixed(0)} mg</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-200 py-1">
                        <span>⚙️ Zinc</span>
                        <span className="font-bold text-gray-700">{data.zinc?.toFixed(2) || '-'} mg</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-200 py-1">
                        <span>✨ Phos</span>
                        <span className="font-bold text-teal-700">{data.phosphorus.toFixed(0)} mg</span>
                    </div>
                </div>
            </div>
            
            <div className="text-[10px] leading-tight text-gray-500 pt-2 border-t border-gray-200">
                * The % Daily Value (DV) tells you how much a nutrient in a serving of food contributes to a daily diet. 2,000 calories a day is used for general nutrition advice.
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

    const categories = useMemo(() => {
        const cats = new Set(foodCompositionData.map(d => d.category));
        return ['All', ...Array.from(cats)];
    }, []);

    const filteredData = useMemo(() => {
        let data = foodCompositionData;
        if (selectedCategory !== 'All') {
            data = data.filter(d => d.category === selectedCategory);
        }
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            data = data.filter(d => 
                d.food.toLowerCase().includes(q) || 
                String(d.code).includes(q)
            );
        }
        return data;
    }, [searchQuery, selectedCategory]);

    const addToMeal = () => {
        if (selectedItem && inputWeight > 0) {
            // Check if item already exists to update it or add new
            // For simplicity, just append. If strict uniqueness needed, we can check IDs.
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

            {/* 3 Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)] min-h-[600px]">
                
                {/* Column 1: Database Search */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gray-50">
                        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                            <span>🔍</span> Database
                        </h3>
                        <input 
                            type="text" 
                            placeholder="Search foods..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-sm mb-3"
                            dir={isRTL ? 'rtl' : 'ltr'}
                        />
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
                                {/* Detailed Subtitles */}
                                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-gray-500 mt-1 font-mono">
                                    <span className="text-green-700 font-bold">{item.energy} kcal</span>
                                    <span>P: {item.protein}g</span>
                                    <span>C: {item.carb}g</span>
                                    <span>F: {item.fat}g</span>
                                    <span>Ca: {item.calcium}mg</span>
                                    <span>Fe: {item.iron}mg</span>
                                </div>
                            </div>
                        ))}
                        {filteredData.length === 0 && (
                            <div className="p-8 text-center text-gray-400 text-sm">No foods found.</div>
                        )}
                    </div>
                </div>

                {/* Column 2: Selected Meal Analysis */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col overflow-hidden relative">
                    <div className="p-4 border-b border-gray-100 bg-blue-50">
                        <h3 className="font-bold text-blue-900 mb-1 flex items-center gap-2">
                            <span>🥗</span> Selected Item Analysis
                        </h3>
                    </div>
                    
                    {selectedItem && selectedItemCalculated ? (
                        <div className="flex-grow overflow-y-auto p-4 flex flex-col gap-4">
                            <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm text-center">
                                <h4 className="font-bold text-gray-800 text-lg mb-1">{selectedItem.food}</h4>
                                <span className="text-xs text-blue-600 font-bold uppercase tracking-wider">{selectedItem.category}</span>
                            </div>

                            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                                <label className="text-sm font-bold text-gray-600 whitespace-nowrap">Quantity (g):</label>
                                <input 
                                    type="number" 
                                    value={inputWeight}
                                    onChange={(e) => setInputWeight(Math.max(0, Number(e.target.value)))}
                                    className="w-full p-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-center font-bold text-lg"
                                />
                            </div>

                            {/* NUTRITION LABEL */}
                            <NutritionLabel 
                                data={selectedItemCalculated} 
                                weight={inputWeight} 
                            />

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
                            <p>Select a food item from the database to view its Nutrition Facts label.</p>
                        </div>
                    )}
                </div>

                {/* Column 3: Total Meal Summary */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col overflow-hidden relative">
                    <div className="p-4 border-b border-gray-100 bg-green-50 flex justify-between items-center">
                        <h3 className="font-bold text-green-900 flex items-center gap-2">
                            <span>🍽️</span> Meal Calculation
                        </h3>
                        <span className="bg-white text-green-800 text-xs font-bold px-2 py-1 rounded border border-green-200">
                            {mealItems.length} Items
                        </span>
                    </div>

                    <div className="flex-grow flex flex-col overflow-hidden">
                        {/* List of Added Items */}
                        <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-gray-50/50 max-h-[40%] border-b border-gray-200">
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
                                <div className="text-center text-xs text-gray-400 py-4 italic">Meal list is empty</div>
                            )}
                        </div>

                        {/* Aggregate Label */}
                        <div className="flex-1 overflow-y-auto p-4 bg-white">
                            {mealItems.length > 0 ? (
                                <>
                                    <div className="mb-4 flex justify-between items-center">
                                        <h4 className="text-sm font-bold text-gray-500 uppercase">Total Facts</h4>
                                        <button onClick={() => setMealItems([])} className="text-xs text-red-600 hover:underline">Clear Meal</button>
                                    </div>
                                    <NutritionLabel 
                                        data={mealTotals.totals} 
                                        weight={mealTotals.totalWeight} 
                                        title="Meal Summary"
                                    />
                                </>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-gray-300">
                                    <span className="text-4xl mb-2 opacity-20">🧾</span>
                                    <p className="text-sm">Add items to see Total Nutrition Facts</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default FoodComposition;
