
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
        <div className="border border-black bg-white text-black font-sans p-3 shadow-md max-w-sm mx-auto w-full">
            {title && <h3 className="text-center font-bold mb-2 border-b border-black pb-1">{title}</h3>}
            <h2 className="font-black text-4xl leading-none">Nutrition Facts</h2>
            <div className="border-b-[8px] border-black my-1"></div>
            <div className="flex justify-between items-baseline font-bold text-lg">
                <span>Serving Size</span>
                <span>{weight}g</span>
            </div>
            <div className="border-b-[4px] border-black my-1"></div>
            <div className="text-sm font-bold">Amount per serving</div>
            <div className="flex justify-between items-center border-b-[4px] border-black pb-1">
                <span className="font-black text-2xl">Calories</span>
                <span className="font-black text-4xl">{data.energy.toFixed(0)}</span>
            </div>
            <div className="text-sm">
                <div className="text-right text-xs font-bold pt-1 border-b border-gray-400">% Daily Value*</div>
                
                <div className="border-b border-gray-400 py-1 flex justify-between">
                    <span><span className="font-bold">Total Fat</span> {data.fat.toFixed(1)}g</span>
                    <span className="font-bold">{getDV(data.fat, dv.fat)}%</span>
                </div>
                
                <div className="border-b border-gray-400 py-1 flex justify-between">
                    <span><span className="font-bold">Sodium</span> {data.sodium.toFixed(0)}mg</span>
                    <span className="font-bold">{getDV(data.sodium, dv.sodium)}%</span>
                </div>
                
                <div className="border-b border-gray-400 py-1 flex justify-between">
                    <span><span className="font-bold">Total Carbohydrate</span> {data.carb.toFixed(1)}g</span>
                    <span className="font-bold">{getDV(data.carb, dv.carb)}%</span>
                </div>
                
                <div className="border-b border-gray-400 py-1 pl-4 flex justify-between">
                    <span>Dietary Fiber {data.fiber.toFixed(1)}g</span>
                    <span className="font-bold">{getDV(data.fiber, dv.fiber)}%</span>
                </div>
                
                <div className="border-b-[8px] border-black py-1 flex justify-between">
                    <span><span className="font-bold">Protein</span> {data.protein.toFixed(1)}g</span>
                    <span className="font-bold hidden">{getDV(data.protein, dv.protein)}%</span>
                </div>

                {/* Micronutrients */}
                <div className="border-b border-gray-400 py-1 flex justify-between">
                    <span>Vitamin C</span>
                    <span>{data.vitC.toFixed(1)} mg</span>
                </div>
                <div className="border-b border-gray-400 py-1 flex justify-between">
                    <span>Calcium</span>
                    <span>{data.calcium.toFixed(0)} mg</span>
                </div>
                <div className="border-b border-gray-400 py-1 flex justify-between">
                    <span>Iron</span>
                    <span>{data.iron.toFixed(2)} mg</span>
                </div>
                <div className="border-b border-gray-400 py-1 flex justify-between">
                    <span>Potassium</span>
                    <span>{data.potassium.toFixed(0)} mg</span>
                </div>
                <div className="py-1 flex justify-between">
                    <span>Phosphorus</span>
                    <span>{data.phosphorus.toFixed(0)} mg</span>
                </div>
            </div>
            <div className="border-t-[4px] border-black mt-1 pt-1 text-[9px] leading-tight text-gray-600">
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
            setMealItems(prev => [...prev, { item: selectedItem, weight: inputWeight }]);
            setInputWeight(100); // Reset to default
        }
    };

    const removeFromMeal = (index: number) => {
        setMealItems(prev => prev.filter((_, i) => i !== index));
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
            vitC: selectedItem.vitC * factor
        };
    }, [selectedItem, inputWeight]);

    const mealTotals = useMemo(() => {
        const totals = {
            energy: 0, protein: 0, fat: 0, carb: 0, fiber: 0,
            calcium: 0, iron: 0, sodium: 0, potassium: 0, phosphorus: 0, vitC: 0
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
                                    <div key={idx} className="flex justify-between items-center p-2 bg-white rounded border border-gray-200 shadow-sm">
                                        <div className="flex-grow min-w-0 mr-2">
                                            <div className="font-bold text-gray-800 text-sm truncate" title={item.item.food}>{item.item.food}</div>
                                            <div className="text-xs text-gray-500 font-mono">
                                                {item.weight}g <span className="mx-1">|</span> {(item.item.energy * factor).toFixed(0)} kcal
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => removeFromMeal(idx)}
                                            className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1 rounded transition"
                                        >
                                            ×
                                        </button>
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
