
import React, { useState, useMemo, useEffect } from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import { mealCreatorDatabase, FoodItem } from "../../data/mealCreatorData";
import { supabase } from "../../lib/supabase";
import { FoodExchangeRow } from "../../data/exchangeData";
import { MacroDonut } from "../Visuals";
import { useAuth } from "../../contexts/AuthContext"; // Import Auth for Saving
import Toast from "../Toast"; // Import Toast for notifications
import { SavedMeal } from "../../types";

// --- Helper for Text Highlighting (Matching Day Food Planner) ---
const REGEX_HIGHLIGHT = /(\/|\(.*?\))/g;
const renderHighlightedText = (text: string) => {
    const parts = text.split(REGEX_HIGHLIGHT);
    return (
        <span>
            {parts.map((part, i) => 
                REGEX_HIGHLIGHT.test(part) 
                ? <span key={i} className="text-red-500 font-bold">{part}</span> 
                : part
            )}
        </span>
    );
};

// --- Interfaces for Save Functionality ---
interface MealMeta {
    tag: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack' | 'Drink' | 'Unspecified'; // Added Unspecified
    note: string;
}

// --- Helper to calculate stats for a saved meal item ---
const calculateSavedMealStats = (addedFoods: { item: FoodItem, serves: number }[]) => {
    if (!addedFoods || !Array.isArray(addedFoods)) return { kcal: 0, cho: 0, protein: 0, fat: 0, fiber: 0 };
    return addedFoods.reduce((acc, entry) => {
        // Robust check for item existence
        if (!entry || !entry.item) return acc;
        const { item, serves } = entry;
        return {
            kcal: acc.kcal + (item.kcal * serves),
            cho: acc.cho + (item.cho * serves),
            protein: acc.protein + (item.protein * serves),
            fat: acc.fat + (item.fat * serves),
            fiber: acc.fiber + (item.fiber * serves)
        };
    }, { kcal: 0, cho: 0, protein: 0, fat: 0, fiber: 0 });
};

export const SimpleMealCreator: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const { session } = useAuth();
  
  // Data States
  const [activeData, setActiveData] = useState<FoodItem[]>(mealCreatorDatabase);
  const [isLoading, setIsLoading] = useState(false);
  const [dataSource, setDataSource] = useState<'local' | 'cloud'>('local'); 
  const [searchQuery, setSearchQuery] = useState("");
  const [mealItems, setMealItems] = useState<{ item: FoodItem, serves: number }[]>([]);

  // Editing States
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [tempEditName, setTempEditName] = useState("");

  // Save/Load States
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [mealName, setMealName] = useState("");
  const [mealMeta, setMealMeta] = useState<MealMeta>({ tag: 'Unspecified', note: '' });
  const [loadedMealId, setLoadedMealId] = useState<string | null>(null); // Track loaded ID for updates

  // v2.0.251: Save Options Modal State
  const [showSaveOptions, setShowSaveOptions] = useState(false);

  // --- Library States (v2.0.247) ---
  const [libraryTab, setLibraryTab] = useState<'mine' | 'universal'>('mine');
  const [libraryMeals, setLibraryMeals] = useState<SavedMeal[]>([]);
  const [librarySearch, setLibrarySearch] = useState('');
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);
  
  // --- New Filter States (v2.0.249) ---
  const [filterOperator, setFilterOperator] = useState<'>' | '<' | '='>('>');
  const [filterKcal, setFilterKcal] = useState<number | ''>('');

  // --- Fetch Cloud Data (Ingredients) ---
  const mapDBToItem = (row: FoodExchangeRow): FoodItem => ({
      name: row.food, group: row.food_group, serves: Number(row.serve), cho: Number(row.cho), protein: Number(row.protein), fat: Number(row.fat), fiber: Number(row.fiber), kcal: Number(row.kcal)
  });

  useEffect(() => {
      const fetchDB = async () => {
          setIsLoading(true);
          try {
              const { data, error } = await supabase.from('food_exchange').select('*').order('food', { ascending: true }).limit(2000);
              if (error) throw error;
              if (data && data.length > 0) { 
                  setActiveData(data.map(mapDBToItem)); 
                  setDataSource('cloud'); 
              } else {
                  setDataSource('local');
              }
          } catch (err) { 
              console.warn("Using local DB", err); 
              setDataSource('local'); 
          } finally { 
              setIsLoading(false); 
          }
      };
      fetchDB();
  }, []);

  // --- Fetch Saved Meals Library (v2.0.247) ---
  const fetchLibraryMeals = async () => {
      if (!session && libraryTab === 'mine') return;
      setIsLoadingLibrary(true);
      try {
          let query = supabase
            .from('saved_meals')
            .select('*')
            .eq('tool_type', 'meal-creator')
            .order('created_at', { ascending: false });

          if (libraryTab === 'mine' && session) {
              query = query.eq('user_id', session.user.id);
          }
          
          query = query.limit(50); // Limit results

          const { data, error } = await query;
          if (error) throw error;
          setLibraryMeals(data || []);
      } catch (err: any) {
          console.error("Library fetch error:", err);
          setSaveStatus("Error loading library.");
      } finally {
          setIsLoadingLibrary(false);
      }
  };

  // Initial Fetch on Load
  useEffect(() => {
      fetchLibraryMeals();
  }, [session, libraryTab]);

  const filteredFoods = useMemo(() => {
    if (!searchQuery) return activeData;
    const q = searchQuery.toLowerCase();
    return activeData.filter(f => f.name.toLowerCase().includes(q) || f.group.toLowerCase().includes(q));
  }, [searchQuery, activeData]);

  // Filter Saved Meals for Library (v2.0.249: Enhanced Search + Kcal Filter)
  const filteredLibraryMeals = useMemo(() => {
      return libraryMeals.filter(meal => {
          // 1. Text Search (Name + Ingredients)
          const q = librarySearch.toLowerCase();
          const nameMatch = meal.name.toLowerCase().includes(q);
          const ingredientsMatch = meal.data?.addedFoods?.some((f: any) => f.item.name.toLowerCase().includes(q));
          const textMatch = !q || nameMatch || ingredientsMatch;

          // 2. Kcal Filter
          let kcalMatch = true;
          if (filterKcal !== '' && !isNaN(Number(filterKcal))) {
              const mealStats = calculateSavedMealStats(meal.data?.addedFoods || []);
              const target = Number(filterKcal);
              if (filterOperator === '>') kcalMatch = mealStats.kcal > target;
              else if (filterOperator === '<') kcalMatch = mealStats.kcal < target;
              else if (filterOperator === '=') kcalMatch = Math.abs(mealStats.kcal - target) < 20; // 20 kcal tolerance
          }

          return textMatch && kcalMatch;
      });
  }, [libraryMeals, librarySearch, filterKcal, filterOperator]);

  const addToMeal = (item: FoodItem) => {
      // Create a deep copy of item so editing name doesn't affect source data
      setMealItems(prev => [...prev, { item: { ...item }, serves: 1 }]);
      setSearchQuery("");
  };

  const updateServe = (index: number, val: number) => {
      setMealItems(prev => prev.map((it, i) => i === index ? { ...it, serves: Math.max(0, val) } : it));
  };

  const removeItem = (index: number) => {
      setMealItems(prev => prev.filter((_, i) => i !== index));
  };

  // --- Item Editing Logic ---
  const startEditing = (index: number, currentName: string) => {
      setEditingIndex(index);
      setTempEditName(currentName);
  };

  const saveEditing = () => {
      if (editingIndex !== null) {
          setMealItems(prev => prev.map((it, i) => i === editingIndex ? { ...it, item: { ...it.item, name: tempEditName } } : it));
          setEditingIndex(null);
          setTempEditName("");
      }
  };

  const cancelEditing = () => {
      setEditingIndex(null);
      setTempEditName("");
  };

  // --- Calculate Totals ---
  const totals = useMemo(() => {
      return mealItems.reduce((acc, { item, serves }) => ({
          kcal: acc.kcal + (item.kcal * serves),
          cho: acc.cho + (item.cho * serves),
          protein: acc.protein + (item.protein * serves),
          fat: acc.fat + (item.fat * serves),
          fiber: acc.fiber + (item.fiber * serves)
      }), { kcal: 0, cho: 0, protein: 0, fat: 0, fiber: 0 });
  }, [mealItems]);

  // --- Calculate Group Serves Summary with Kcal % ---
  const groupSummary = useMemo(() => {
      const groups: Record<string, { serves: number, kcal: number }> = {};
      
      mealItems.forEach(({ item, serves }) => {
          if (!item) return;
          if (!groups[item.group]) {
              groups[item.group] = { serves: 0, kcal: 0 };
          }
          groups[item.group].serves += serves;
          groups[item.group].kcal += (item.kcal * serves);
      });
      
      return groups;
  }, [mealItems]);

  // --- Reset/Clear Functions (v2.0.249) ---
  const clearMealContent = () => {
      if (mealItems.length > 0 && confirm("Clear all items from current meal?")) {
          setMealItems([]);
      }
  };

  const startNewMeal = () => {
      if (mealItems.length > 0 && !confirm("Start a fresh meal? Unsaved changes will be lost.")) return;
      setMealItems([]);
      setMealName("");
      setMealMeta({ tag: 'Unspecified', note: '' });
      setLoadedMealId(null);
      setSearchQuery("");
  };

  // --- Main Save Handler (v2.0.251) ---
  const handleSaveButton = () => {
      if (!mealName.trim()) {
          alert("Please enter a name for the meal.");
          return;
      }
      if (!session) return;

      if (loadedMealId) {
          // Meal is loaded, prompt user for action
          setShowSaveOptions(true);
      } else {
          // New meal, proceed to standard save logic (checking duplicates)
          performDatabaseSave('create_new');
      }
  };

  // --- Database Execution Logic (v2.0.251 Refactor) ---
  const performDatabaseSave = async (mode: 'update_current' | 'create_new') => {
      if (!session) return;
      setShowSaveOptions(false); // Close modal if open
      setSaveStatus("Processing...");

      try {
          const payload = {
              user_id: session.user.id,
              name: mealName,
              tool_type: 'meal-creator',
              data: {
                  addedFoods: mealItems,
                  tag: mealMeta.tag,
                  note: mealMeta.note,
                  savedAt: new Date().toISOString()
              }
          };

          let targetId = mode === 'update_current' ? loadedMealId : null;
          let isInsert = false;

          // If Create New (or initial save), check for name duplication first
          if (mode === 'create_new') {
              const { data: existing } = await supabase
                  .from('saved_meals')
                  .select('id, name')
                  .eq('user_id', session.user.id)
                  .eq('name', mealName)
                  .eq('tool_type', 'meal-creator');
              
              if (existing && existing.length > 0) {
                  // Duplicate found
                  if (confirm(`⚠️ Warning: A meal named "${mealName}" already exists!\n\n• Click OK to OVERWRITE the existing meal.\n• Click Cancel to go back and rename this meal.`)) {
                      targetId = existing[0].id; // We will update the duplicate record
                  } else {
                      setSaveStatus("Save Cancelled.");
                      setTimeout(() => setSaveStatus(""), 2000);
                      return; // Cancel
                  }
              } else {
                  isInsert = true;
              }
          }

          setSaveStatus(isInsert ? "Saving new meal..." : "Updating meal...");

          let data, error;
          if (isInsert) {
              const { data: inserted, error: insertErr } = await supabase.from('saved_meals').insert(payload).select().single();
              data = inserted;
              error = insertErr;
          } else if (targetId) {
              const { data: updated, error: updateErr } = await supabase.from('saved_meals').update(payload).eq('id', targetId).select().single();
              data = updated;
              error = updateErr;
          }

          if (error) throw error;

          if (data) {
              setLoadedMealId(data.id); // Update context to the saved meal ID
              setSaveStatus(isInsert ? "Meal Saved!" : "Meal Updated!");
              // Refresh library if viewing 'mine'
              if (libraryTab === 'mine') fetchLibraryMeals();
          }

          setTimeout(() => {
              setSaveStatus("");
              setShowSaveModal(false);
          }, 2000);

      } catch (err: any) {
          console.error(err);
          setSaveStatus("Error: " + err.message);
      }
  };

  // --- Cloud Load Logic (v2.0.247 / 2.0.248) ---
  const loadMealFromLibrary = (meal: SavedMeal) => {
      if (!meal.data || !meal.data.addedFoods) {
          setSaveStatus("Error: Meal data empty.");
          return;
      }
      
      const validItems = meal.data.addedFoods.filter((entry: any) => 
          entry && 
          entry.item && 
          typeof entry.item.name === 'string' &&
          typeof entry.serves === 'number'
      );

      if (validItems.length === 0 && meal.data.addedFoods.length > 0) {
          setSaveStatus("Error: Incompatible meal format.");
          return;
      }

      setMealItems(validItems);
      setMealName(meal.name);
      setLoadedMealId(meal.id); // Set ID for updates
      
      // Load Meta (Tag, Note) - v2.0.249
      setMealMeta({
          tag: meal.data.tag || 'Unspecified',
          note: meal.data.note || ''
      });
      
      setSaveStatus(`Loaded "${meal.name}"!`);
      setTimeout(() => setSaveStatus(""), 2000);
  };

  // --- Cloud Delete Logic (v2.0.247) ---
  const deleteMealFromLibrary = async (mealId: string) => {
      if (!confirm("Are you sure you want to delete this meal? This action cannot be undone.")) return;
      
      try {
          const { error } = await supabase.from('saved_meals').delete().eq('id', mealId).eq('user_id', session?.user.id);
          if (error) throw error;
          
          // Remove locally
          setLibraryMeals(prev => prev.filter(m => m.id !== mealId));
          // If deleted meal was loaded, clear ID
          if (loadedMealId === mealId) setLoadedMealId(null);
          
          setSaveStatus("Meal Deleted.");
          setTimeout(() => setSaveStatus(""), 2000);
      } catch (err: any) {
          console.error(err);
          setSaveStatus("Error deleting: " + err.message);
      }
  };

  // Render a single Library Meal Card
  const renderLibraryItem = (meal: SavedMeal) => {
        const stats = calculateSavedMealStats(meal.data?.addedFoods || []);
        const isOwner = session?.user.id === meal.user_id;

        return (
            <div key={meal.id} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-purple-300 transition group mb-3 last:mb-0">
                <div className="flex justify-between items-start mb-2">
                    <div className="flex-grow pr-2">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-gray-800 text-sm">{meal.name}</h4>
                            {meal.data?.tag && meal.data.tag !== 'Unspecified' && (
                                <span className="text-[9px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">{meal.data.tag}</span>
                            )}
                        </div>
                        {/* Bulleted list of items limited to 4 */}
                        <ul className="mt-1.5 space-y-0.5">
                            {meal.data?.addedFoods?.slice(0, 4).map((f: any, i: number) => (
                                <li key={i} className="text-[10px] text-gray-500 flex justify-between">
                                    <span className="truncate max-w-[120px]">• {f?.item?.name?.split('(')[0]}</span>
                                    <span className="font-bold text-gray-400">x{f.serves}</span>
                                </li>
                            ))}
                            {meal.data?.addedFoods?.length > 4 && (
                                <li className="text-[9px] text-blue-500 italic">+ {meal.data.addedFoods.length - 4} more items...</li>
                            )}
                        </ul>
                    </div>
                    <div className="text-right flex-shrink-0">
                        <div className="font-mono font-bold text-sm text-purple-700 leading-none">{stats.kcal.toFixed(0)}</div>
                        <div className="text-[8px] text-gray-400 uppercase">kcal</div>
                    </div>
                </div>

                {/* Nutrient Grid Mini */}
                <div className="grid grid-cols-4 gap-1 mb-2 bg-gray-50 p-1.5 rounded text-center text-[9px] font-mono text-gray-600">
                    <div><span className="block font-bold text-blue-600">{stats.cho.toFixed(0)}</span> C</div>
                    <div><span className="block font-bold text-red-600">{stats.protein.toFixed(0)}</span> P</div>
                    <div><span className="block font-bold text-yellow-600">{stats.fat.toFixed(0)}</span> F</div>
                    <div><span className="block font-bold text-green-600">{stats.fiber.toFixed(0)}</span> Fib</div>
                </div>

                <div className="flex justify-between items-center pt-1 border-t border-gray-50">
                    <div className="text-[9px] text-gray-400">
                        {new Date(meal.created_at).toLocaleDateString()}
                    </div>
                    <div className="flex gap-2">
                        {isOwner && (
                            <button 
                                onClick={() => deleteMealFromLibrary(meal.id)}
                                className="px-2 py-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition text-[10px]"
                                title="Delete"
                            >
                                🗑️
                            </button>
                        )}
                        <button 
                            onClick={() => loadMealFromLibrary(meal)}
                            className="px-3 py-1 bg-purple-600 text-white rounded text-[10px] font-bold hover:bg-purple-700 transition shadow-sm"
                        >
                            Load
                        </button>
                    </div>
                </div>
            </div>
        );
  };

  return (
    <div className="max-w-[1920px] mx-auto animate-fade-in pb-12">
        <Toast message={saveStatus} />

        {/* Global Header */}
        <div className="mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
            <div>
                <h1 className="text-2xl font-bold text-green-700 flex items-center gap-2">
                    <span>🥗</span> Meal Builder
                </h1>
                <div className="flex items-center gap-2">
                    <p className="text-sm text-gray-500 hidden sm:block">Create a single meal using food exchanges.</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1 font-bold ${dataSource === 'cloud' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                        {dataSource === 'cloud' ? '☁️ Cloud DB' : '💾 Local DB'}
                    </span>
                </div>
            </div>
            
            {/* New Meal Button */}
            <button 
                onClick={startNewMeal}
                className="bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 px-4 py-2 rounded-lg font-bold text-sm shadow-sm transition flex items-center gap-2"
            >
                <span>✨</span> New Meal
            </button>
        </div>

        {/* Main 3-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* COL 1: LIBRARY (3 Cols) */}
            <div className="lg:col-span-3 space-y-4">
                <div className="bg-white rounded-xl shadow-lg border border-purple-100 flex flex-col overflow-hidden h-[calc(100vh-200px)] sticky top-4">
                    <div className="p-4 bg-purple-50 border-b border-purple-100">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="font-bold text-purple-900 flex items-center gap-2">
                                <span>📚</span> Meal Library
                            </h3>
                            {session && (
                                <button 
                                    onClick={handleSaveButton} // v2.0.251: Trigger new save flow
                                    className="bg-white text-purple-600 px-3 py-1 rounded border border-purple-200 hover:bg-purple-100 text-xs font-bold shadow-sm flex items-center gap-1"
                                    title="Save Current Meal"
                                >
                                    <span>💾</span> Save
                                </button>
                            )}
                        </div>
                        
                        {/* Tabs */}
                        <div className="flex bg-white rounded-lg p-1 border border-purple-100 mb-3">
                            <button 
                                onClick={() => setLibraryTab('mine')}
                                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition ${libraryTab === 'mine' ? 'bg-purple-100 text-purple-800' : 'text-gray-500 hover:bg-gray-50'}`}
                            >
                                My Meals
                            </button>
                            <button 
                                onClick={() => setLibraryTab('universal')}
                                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition ${libraryTab === 'universal' ? 'bg-purple-100 text-purple-800' : 'text-gray-500 hover:bg-gray-50'}`}
                            >
                                Universal
                            </button>
                        </div>

                        {/* Search & Filter (v2.0.249) */}
                        <div className="space-y-2">
                            <input 
                                type="text" 
                                placeholder="Search name or ingredients..." 
                                value={librarySearch}
                                onChange={(e) => setLibrarySearch(e.target.value)}
                                className="w-full p-2 border border-purple-200 rounded text-xs focus:ring-2 focus:ring-purple-400 outline-none"
                            />
                            <div className="flex gap-1">
                                <select 
                                    value={filterOperator} 
                                    onChange={(e) => setFilterOperator(e.target.value as any)}
                                    className="p-1.5 border border-purple-200 rounded text-xs bg-white text-purple-800 font-bold outline-none"
                                >
                                    <option value=">">&gt;</option>
                                    <option value="<">&lt;</option>
                                    <option value="=">=</option>
                                </select>
                                <input 
                                    type="number" 
                                    placeholder="Kcal..." 
                                    value={filterKcal}
                                    onChange={(e) => setFilterKcal(e.target.value === '' ? '' : Number(e.target.value))}
                                    className="flex-grow p-1.5 border border-purple-200 rounded text-xs focus:ring-1 focus:ring-purple-400 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex-grow overflow-y-auto p-3 bg-gray-50 space-y-2">
                        {isLoadingLibrary ? (
                            <div className="text-center py-10 text-gray-400 text-xs">Loading library...</div>
                        ) : filteredLibraryMeals.length === 0 ? (
                            <div className="text-center py-10 text-gray-400 flex flex-col items-center">
                                <span className="text-2xl mb-2 opacity-30">🥣</span>
                                <p className="text-xs">No meals found.</p>
                            </div>
                        ) : (
                            filteredLibraryMeals.map(renderLibraryItem)
                        )}
                    </div>
                </div>
            </div>

            {/* COL 2: BUILDER (6 Cols) */}
            <div className="lg:col-span-6 space-y-4">
                
                {/* Meal Details Card (v2.0.249) */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="font-bold text-gray-700 mb-3 flex items-center justify-between text-sm uppercase tracking-wide">
                        <span className="flex items-center gap-2"><span>📝</span> Meal Details</span>
                        {mealItems.length > 0 && (
                            <button onClick={clearMealContent} className="text-xs text-red-500 hover:text-red-700 font-bold border border-red-100 bg-red-50 px-2 py-1 rounded">
                                Clear Content
                            </button>
                        )}
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-2">
                            <label className="block text-[10px] text-gray-400 font-bold uppercase mb-1">Meal Name</label>
                            <input 
                                type="text" 
                                value={mealName} 
                                onChange={(e) => setMealName(e.target.value)}
                                placeholder="e.g. Breakfast Oats" 
                                className="w-full p-2 border rounded-lg text-sm font-bold text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] text-gray-400 font-bold uppercase mb-1">Tag</label>
                            <select 
                                value={mealMeta.tag} 
                                onChange={(e) => setMealMeta({...mealMeta, tag: e.target.value as any})}
                                className="w-full p-2 border rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="Unspecified">-</option>
                                <option value="Breakfast">Breakfast</option>
                                <option value="Lunch">Lunch</option>
                                <option value="Dinner">Dinner</option>
                                <option value="Snack">Snack</option>
                                <option value="Drink">Drink</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Add Foods Card */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 sticky top-4 z-20">
                    <h3 className="font-bold text-gray-700 mb-2 flex items-center gap-2 text-sm uppercase tracking-wide">
                        <span>🔍</span> Add Foods
                    </h3>
                    <div className="relative">
                        <input 
                            type="text" 
                            placeholder="Search food database (e.g. Rice, Chicken)..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none shadow-sm text-sm"
                            dir={isRTL ? 'rtl' : 'ltr'}
                        />
                        <span className={`absolute top-1/2 -translate-y-1/2 text-gray-400 left-3`}>🔍</span>
                        
                        {/* Dropdown Results */}
                        {searchQuery && (
                            <div className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded-b-lg shadow-2xl max-h-80 overflow-y-auto z-50 mt-1">
                                {isLoading ? <div className="p-4 text-center text-gray-400 text-xs">Loading...</div> : 
                                filteredFoods.length === 0 ? <div className="p-4 text-center text-gray-400 text-xs">No items found.</div> :
                                <ul className="divide-y divide-gray-50">
                                    {filteredFoods.map((f, i) => (
                                        <li key={i} className="px-4 py-2 hover:bg-green-50 cursor-pointer flex justify-between items-center group transition-colors" onClick={() => addToMeal(f)}>
                                            <div className="text-left">
                                                <div className="font-medium text-gray-800 text-sm">
                                                    {renderHighlightedText(f.name)}
                                                </div>
                                                <div className="text-[10px] text-gray-500 flex gap-2 mt-0.5">
                                                    <span className="bg-gray-100 px-1.5 rounded">{f.group}</span>
                                                    <span className="font-bold text-blue-600">{f.kcal} kcal</span>
                                                </div>
                                            </div>
                                            <div className="text-[10px] bg-green-100 text-green-800 px-2 py-1 rounded font-bold group-hover:bg-green-200 transition-colors">+ Add</div>
                                        </li>
                                    ))}
                                </ul>
                                }
                            </div>
                        )}
                    </div>
                </div>

                {/* Meal Items List */}
                <div className="space-y-3 min-h-[400px]">
                    {mealItems.length === 0 ? (
                        <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-12 text-center text-gray-400 h-full flex flex-col justify-center items-center">
                            <span className="text-4xl mb-3 block opacity-50">🍽️</span>
                            <p className="text-sm">Your plate is empty.</p>
                            <p className="text-xs mt-1">Search above to add items.</p>
                        </div>
                    ) : (
                        mealItems.map((entry, idx) => {
                            if (!entry || !entry.item) return null; // Safety check
                            const c = (entry.item.cho * entry.serves).toFixed(1);
                            const p = (entry.item.protein * entry.serves).toFixed(1);
                            const f = (entry.item.fat * entry.serves).toFixed(1);
                            const isEditing = editingIndex === idx;

                            return (
                                <div key={idx} className={`bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center gap-4 animate-fade-in group hover:border-green-200 transition-colors ${isEditing ? 'ring-2 ring-yellow-200 border-yellow-300' : ''}`}>
                                    <div className="flex-grow w-full text-center sm:text-left">
                                        <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                                            {isEditing ? (
                                                <div className="flex gap-2 w-full">
                                                    <input 
                                                        type="text" 
                                                        value={tempEditName} 
                                                        onChange={(e) => setTempEditName(e.target.value)} 
                                                        className="flex-grow border-b-2 border-yellow-400 outline-none text-sm font-bold bg-transparent"
                                                        autoFocus
                                                    />
                                                    <button onClick={saveEditing} className="text-green-600 text-xs font-bold">✓</button>
                                                    <button onClick={cancelEditing} className="text-red-600 text-xs font-bold">✕</button>
                                                </div>
                                            ) : (
                                                <>
                                                    <h3 className="font-bold text-gray-800 text-sm break-words">
                                                        {renderHighlightedText(entry.item.name)}
                                                    </h3>
                                                    <button 
                                                        onClick={() => startEditing(idx, entry.item.name)}
                                                        className="text-gray-300 hover:text-blue-500 transition opacity-0 group-hover:opacity-100"
                                                        title="Edit Text"
                                                    >
                                                        ✎
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1">
                                            <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{entry.item.group}</span>
                                            <div className="flex gap-2 text-[10px] font-mono border-l pl-2 border-gray-200">
                                                <span className="text-blue-600 font-bold">C:{c}</span>
                                                <span className="text-red-600 font-bold">P:{p}</span>
                                                <span className="text-yellow-600 font-bold">F:{f}</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-0 pt-3 sm:pt-0 mt-2 sm:mt-0 border-gray-100">
                                        <div className="text-center">
                                            <label className="block text-[9px] text-gray-400 font-bold uppercase mb-1">Serves</label>
                                            <input 
                                                type="number" 
                                                value={entry.serves} 
                                                step="0.5" 
                                                min="0"
                                                onChange={(e) => updateServe(idx, Number(e.target.value))}
                                                className="w-14 p-1 border rounded text-center font-bold text-green-700 text-sm focus:ring-1 focus:ring-green-500 outline-none" 
                                            />
                                        </div>
                                        <div className="w-16 text-right">
                                            <div className="font-mono font-bold text-gray-800 text-sm">{(entry.item.kcal * entry.serves).toFixed(0)}</div>
                                            <div className="text-[9px] text-gray-400 uppercase">kcal</div>
                                        </div>
                                        <button onClick={() => removeItem(idx)} className="text-red-300 hover:text-red-600 text-xl font-bold px-2 transition-colors ml-1">×</button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* COL 3: SUMMARY (3 Cols) */}
            <div className="lg:col-span-3 space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-green-500 sticky top-4">
                    <h3 className="font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
                        <span>📊</span> Meal Summary
                    </h3>
                    
                    <div className="flex justify-center mb-6">
                        <MacroDonut cho={totals.cho} pro={totals.protein} fat={totals.fat} totalKcal={totals.kcal} />
                    </div>

                    <div className="space-y-2 text-sm mb-6">
                        <div className="flex justify-between p-2 bg-blue-50 rounded border border-blue-100">
                            <span className="text-blue-800 font-medium">Carbs</span>
                            <span className="font-bold text-blue-700">{totals.cho.toFixed(1)}g</span>
                        </div>
                        <div className="flex justify-between p-2 bg-red-50 rounded border border-red-100">
                            <span className="text-red-800 font-medium">Protein</span>
                            <span className="font-bold text-red-700">{totals.protein.toFixed(1)}g</span>
                        </div>
                        <div className="flex justify-between p-2 bg-yellow-50 rounded border border-yellow-100">
                            <span className="text-yellow-800 font-medium">Fat</span>
                            <span className="font-bold text-yellow-700">{totals.fat.toFixed(1)}g</span>
                        </div>
                        <div className="flex justify-between p-2 bg-green-50 rounded border border-green-100">
                            <span className="text-green-800 font-medium">Fiber</span>
                            <span className="font-bold text-green-700">{totals.fiber.toFixed(1)}g</span>
                        </div>
                        <div className="flex justify-between p-3 bg-gray-100 rounded mt-2 font-bold text-lg border-t-2 border-gray-200">
                            <span>Total Energy</span>
                            <span>{totals.kcal.toFixed(0)} kcal</span>
                        </div>
                    </div>

                    {/* Summary Table of Serves Groups with % Kcal */}
                    {Object.keys(groupSummary).length > 0 && (
                        <div className="border-t pt-4">
                            <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 tracking-wider">Serves Distribution</h4>
                            <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                                <table className="w-full text-xs">
                                    <thead className="bg-gray-100 text-gray-600">
                                        <tr>
                                            <th className="p-2 text-left">Group</th>
                                            <th className="p-2 text-center">Serves</th>
                                            <th className="p-2 text-right">% Kcal</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {Object.entries(groupSummary).map(([group, data]) => {
                                            const itemData = data as { serves: number, kcal: number };
                                            const pct = totals.kcal > 0 ? (itemData.kcal / totals.kcal) * 100 : 0;
                                            return (
                                                <tr key={group}>
                                                    <td className="p-2 font-medium text-gray-700">{group}</td>
                                                    <td className="p-2 text-center font-bold text-gray-900">{itemData.serves.toFixed(1)}</td>
                                                    <td className="p-2 text-right text-blue-600 font-bold">{pct.toFixed(1)}%</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                    
                    {/* Notes Field (Syncs with Meal Meta) */}
                    <div className="mt-4">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Notes</label>
                        <textarea 
                            value={mealMeta.note}
                            onChange={(e) => setMealMeta({...mealMeta, note: e.target.value})}
                            className="w-full p-2 border rounded text-sm bg-gray-50 resize-none h-20"
                            placeholder="Add notes..."
                        ></textarea>
                    </div>
                </div>
            </div>
        </div>

        {/* Save Options Modal v2.0.251 */}
        {showSaveOptions && (
            <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                        <h3 className="font-bold text-gray-800">Save Options</h3>
                        <button onClick={() => setShowSaveOptions(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                    </div>
                    <div className="p-6 text-center space-y-4">
                        <p className="text-sm text-gray-600">
                            You are editing an existing meal. How would you like to save your changes?
                        </p>
                        <div className="flex flex-col gap-2">
                            <button 
                                onClick={() => performDatabaseSave('update_current')}
                                className="w-full py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition"
                            >
                                Overwrite Current Meal
                            </button>
                            <button 
                                onClick={() => performDatabaseSave('create_new')}
                                className="w-full py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition"
                            >
                                Save as New Meal
                            </button>
                            <button 
                                onClick={() => setShowSaveOptions(false)}
                                className="w-full py-2 bg-gray-100 text-gray-600 rounded-lg font-bold hover:bg-gray-200 transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
