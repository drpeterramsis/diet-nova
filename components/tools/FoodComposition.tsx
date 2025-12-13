
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

    const mealTotals = useMemo(() => {
        const totals = {
            energy: 0, protein: 0, fat: 0, carb: 0, fiber: 0,
            calcium: 0, iron: 0, sodium: 0, potassium: 0, vitC: 0
        };
        mealItems.forEach(({ item, weight }) => {
            const factor = weight / 100;
            totals.energy += item.energy * factor;
            totals.protein += item.protein * factor;
            totals.fat += item.fat * factor;
            totals.carb += item.carb * factor;
            totals.fiber += item.fiber * factor;
            totals.calcium += item.calcium * factor;
            totals.iron += item.iron * factor;
            totals.sodium += item.sodium * factor;
            totals.potassium += item.potassium * factor;
            totals.vitC += item.vitC * factor;
        });
        return totals;
    }, [mealItems]);

    return (
        <div className="max-w-7xl mx-auto animate-fade-in pb-12">
            
            {/* Header */}
            <div className="flex justify-between items-center mb-6 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--color-heading)] flex items-center gap-2">
                        <span>🧪</span> {t.tools.foodComposition.title}
                    </h1>
                    <p className="text-sm text-gray-500">Analyze food nutrient composition and calculate meals.</p>
                </div>
                {onClose && (
                    <button onClick={onClose} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition text-sm font-medium">
                        Close
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left: Search & List */}
                <div className="lg:col-span-5 space-y-4">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex gap-2 mb-4">
                            <input 
                                type="text" 
                                placeholder="Search foods (Name, Code)..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-sm"
                                dir={isRTL ? 'rtl' : 'ltr'}
                            />
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition ${selectedCategory === cat ? 'bg-[var(--color-primary)] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden max-h-[600px] overflow-y-auto">
                        {filteredData.map(item => (
                            <div 
                                key={item.id}
                                onClick={() => setSelectedItem(item)}
                                className={`p-3 border-b border-gray-50 cursor-pointer transition hover:bg-blue-50 flex justify-between items-center ${selectedItem?.id === item.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
                            >
                                <div>
                                    <h4 className="font-bold text-gray-800 text-sm">{item.food}</h4>
                                    <p className="text-xs text-gray-500">{item.energy} kcal | {item.protein}g P | {item.carb}g C | {item.fat}g F</p>
                                </div>
                                <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-1 rounded">#{item.code}</span>
                            </div>
                        ))}
                        {filteredData.length === 0 && (
                            <div className="p-8 text-center text-gray-400 text-sm">No foods found.</div>
                        )}
                    </div>
                </div>

                {/* Right: Detail & Meal */}
                <div className="lg:col-span-7 space-y-6">
                    {/* Selected Item Detail Card */}
                    {selectedItem ? (
                        <div className="bg-white p-6 rounded-xl shadow-md border border-blue-100">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h2 className="text-xl font-bold text-blue-900">{selectedItem.food}</h2>
                                    <p className="text-sm text-blue-600 font-medium">{selectedItem.category} (per 100g)</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-gray-800">{selectedItem.energy} <span className="text-sm text-gray-500">kcal</span></div>
                                </div>
                            </div>

                            <div className="grid grid-cols-4 gap-4 mb-6 bg-gray-50 p-4 rounded-lg text-center">
                                <div>
                                    <div className="text-xs text-gray-500 uppercase font-bold">Carb</div>
                                    <div className="text-lg font-bold text-blue-600">{selectedItem.carb}g</div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 uppercase font-bold">Protein</div>
                                    <div className="text-lg font-bold text-red-600">{selectedItem.protein}g</div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 uppercase font-bold">Fat</div>
                                    <div className="text-lg font-bold text-yellow-600">{selectedItem.fat}g</div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 uppercase font-bold">Fiber</div>
                                    <div className="text-lg font-bold text-green-600">{selectedItem.fiber}g</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-xs text-gray-600 mb-6">
                                <div className="p-2 border rounded bg-white"><span className="block font-bold">Ca</span> {selectedItem.calcium} mg</div>
                                <div className="p-2 border rounded bg-white"><span className="block font-bold">Fe</span> {selectedItem.iron} mg</div>
                                <div className="p-2 border rounded bg-white"><span className="block font-bold">Na</span> {selectedItem.sodium} mg</div>
                                <div className="p-2 border rounded bg-white"><span className="block font-bold">K</span> {selectedItem.potassium} mg</div>
                                <div className="p-2 border rounded bg-white"><span className="block font-bold">P</span> {selectedItem.phosphorus} mg</div>
                                <div className="p-2 border rounded bg-white"><span className="block font-bold">Vit C</span> {selectedItem.vitC} mg</div>
                            </div>

                            <div className="flex gap-4 items-end border-t border-gray-100 pt-4">
                                <div className="flex-grow">
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Quantity (grams)</label>
                                    <input 
                                        type="number" 
                                        value={inputWeight}
                                        onChange={(e) => setInputWeight(Number(e.target.value))}
                                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <button 
                                    onClick={addToMeal}
                                    className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition shadow-sm"
                                >
                                    Add to Meal
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-gray-50 rounded-xl border border-dashed border-gray-300 p-10 text-center text-gray-400">
                            Select a food item to view details
                        </div>
                    )}

                    {/* Meal Calculator */}
                    {mealItems.length > 0 && (
                        <div className="bg-white p-6 rounded-xl shadow-lg border border-purple-100">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-lg text-purple-900">Meal Calculation</h3>
                                <button onClick={() => setMealItems([])} className="text-xs text-red-500 hover:text-red-700">Clear All</button>
                            </div>

                            <div className="space-y-2 mb-6 max-h-60 overflow-y-auto">
                                {mealItems.map((item, idx) => {
                                    const factor = item.weight / 100;
                                    return (
                                        <div key={idx} className="flex justify-between items-center p-2 bg-purple-50 rounded border border-purple-100 text-sm">
                                            <div>
                                                <div className="font-bold text-gray-800">{item.item.food}</div>
                                                <div className="text-xs text-gray-500">{item.weight}g</div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right text-xs">
                                                    <div className="font-bold">{(item.item.energy * factor).toFixed(0)} kcal</div>
                                                    <div className="text-gray-500">{(item.item.carb * factor).toFixed(1)}g C</div>
                                                </div>
                                                <button onClick={() => removeFromMeal(idx)} className="text-red-400 hover:text-red-600">×</button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="border-t-2 border-purple-100 pt-4">
                                <h4 className="text-sm font-bold text-gray-500 uppercase mb-3">Total Composition</h4>
                                <div className="grid grid-cols-4 gap-4 text-center">
                                    <div className="p-3 bg-gray-800 text-white rounded-lg">
                                        <div className="text-xl font-bold">{mealTotals.energy.toFixed(0)}</div>
                                        <div className="text-[10px] uppercase opacity-70">Kcal</div>
                                    </div>
                                    <div className="p-3 bg-blue-100 text-blue-900 rounded-lg">
                                        <div className="text-lg font-bold">{mealTotals.carb.toFixed(1)}g</div>
                                        <div className="text-[10px] uppercase opacity-70">Carb</div>
                                    </div>
                                    <div className="p-3 bg-red-100 text-red-900 rounded-lg">
                                        <div className="text-lg font-bold">{mealTotals.protein.toFixed(1)}g</div>
                                        <div className="text-[10px] uppercase opacity-70">Protein</div>
                                    </div>
                                    <div className="p-3 bg-yellow-100 text-yellow-900 rounded-lg">
                                        <div className="text-lg font-bold">{mealTotals.fat.toFixed(1)}g</div>
                                        <div className="text-[10px] uppercase opacity-70">Fat</div>
                                    </div>
                                </div>
                                <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-center text-gray-600">
                                    <div className="bg-gray-50 p-1 rounded">Iron: {mealTotals.iron.toFixed(1)} mg</div>
                                    <div className="bg-gray-50 p-1 rounded">Calc: {mealTotals.calcium.toFixed(0)} mg</div>
                                    <div className="bg-gray-50 p-1 rounded">Sod: {mealTotals.sodium.toFixed(0)} mg</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FoodComposition;
