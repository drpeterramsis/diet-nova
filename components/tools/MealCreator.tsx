
import React, { useState, useMemo, useEffect, useRef } from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import { mealCreatorDatabase, FoodItem } from "../../data/mealCreatorData";
import { MacroDonut, ProgressBar } from "../Visuals";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { SavedMeal, Client, ClientVisit } from "../../types";
import Toast from "../Toast";
import { FoodExchangeRow } from "../../data/exchangeData";

// v2.0.231: Enhanced types to include global instructions
export interface DayPlan {
    items: Record<string, PlannerItem[]>;
    meta: Record<string, MealMeta>;
}

export interface WeeklyPlan {
    [day: number]: DayPlan;
    instructions?: string; // v2.0.231: Added for general formatting and instructions
}

interface PlannerItem extends FoodItem {
    selected: boolean;
    optionGroup: string; 
    customDisplayName?: string; // Stores HTML for rich text description
}

interface MealMeta {
    timeStart: string;
    timeEnd: string;
    notes: string;
}

interface MealCreatorProps {
    initialLoadId?: string | null;
    autoOpenLoad?: boolean;
    autoOpenNew?: boolean;
    activeVisit?: { client: Client, visit: ClientVisit } | null;
    onNavigate?: (toolId: string, loadId?: string, action?: 'load' | 'new', preserveContext?: boolean) => void;
    // New Props for Integration
    isEmbedded?: boolean;
    externalTargetKcal?: number;
    plannedExchanges?: Record<string, number>;
    externalWeeklyPlan?: WeeklyPlan;
    onWeeklyPlanChange?: React.Dispatch<React.SetStateAction<WeeklyPlan>>;
}

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

const MEAL_COLORS: Record<string, string> = {
    'Pre-Breakfast': 'bg-orange-50 border-orange-200 text-orange-900',
    'Breakfast': 'bg-yellow-50 border-yellow-200 text-yellow-900',
    'Morning Snack': 'bg-green-50 border-green-200 text-green-900',
    'Lunch': 'bg-blue-50 border-blue-200 text-blue-900',
    'Afternoon Snack': 'bg-purple-50 border-purple-200 text-purple-900',
    'Dinner': 'bg-red-50 border-red-200 text-red-900',
    'Late Snack': 'bg-indigo-50 border-indigo-200 text-indigo-900'
};

// Generate Alt Options (Main + 10 Alts)
const ALT_OPTIONS = ['main', ...Array.from({length: 10}, (_, i) => `Alt ${i+1}`)];

// v2.0.229: Refined Regex to detect text like "/" or "(150 gm)" or "(1)"
const REGEX_HIGHLIGHT = /(\/|\(.*?\))/g;

/**
 * v2.0.229: Updated render highlighted text to include red color for "/" and brackets in search results
 */
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

// Mapping for Exchange Comparison
const GROUP_MAPPING: Record<string, string> = {
    "Starch": "starch",
    "Fruits": "fruit",
    "Vegetables": "veg",
    "Lean Meat": "meatLean",
    "Medium Meat": "meatMed",
    "High Meat": "meatHigh",
    "Skimmed Milk": "milkSkim",
    "Low Milk": "milkLow",
    "Whole Milk": "milkWhole",
    "Legumes": "legumes",
    "Sugar": "sugar",
};

// Group Icons for Exchange Control
const GROUP_ICONS: Record<string, string> = {
    starch: '🍞',
    fruit: '🍓',
    veg: '🥦',
    meatLean: '🍗',
    meatMed: '🥩',
    meatHigh: '🍔',
    milkSkim: '🥛',
    milkLow: '🍼',
    milkWhole: '🧀',
    legumes: '🥣',
    sugar: '🍬',
    fats: '🥑'
};

export const DEFAULT_WEEKLY_PLAN: WeeklyPlan = {
    1: { items: MEAL_TIMES.reduce((acc, time) => ({ ...acc, [time]: [] }), {}), meta: {} },
    instructions: "<h3>General Instructions</h3><p>• Drink at least 2 liters of water daily.<br>• Avoid added sugars and processed foods.<br>• Prefer grilled or steamed preparations.</p>"
};

// --- RICH TEXT EDITOR COMPONENT (MODAL) ---
const RichTextEditorModal: React.FC<{
    initialHtml: string;
    onSave: (html: string) => void;
    onClose: () => void;
    title?: string;
}> = ({ initialHtml, onSave, onClose, title = "Edit Content" }) => {
    const editorRef = useRef<HTMLDivElement>(null);

    // Initial population
    useEffect(() => {
        if (editorRef.current) {
            editorRef.current.innerHTML = initialHtml;
        }
    }, []);

    const execCmd = (command: string, value: string | undefined = undefined) => {
        document.execCommand(command, false, value);
        editorRef.current?.focus();
    };

    const handleSave = () => {
        if (editorRef.current) {
            onSave(editorRef.current.innerHTML);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm no-print">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in border border-gray-100">
                <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">✕</button>
                </div>
                
                {/* Toolbar */}
                <div className="p-2 border-b flex gap-1 flex-wrap bg-gray-50">
                    <button onClick={() => execCmd('bold')} className="p-1.5 min-w-[30px] rounded hover:bg-gray-200 font-bold border border-gray-300" title="Bold">B</button>
                    <button onClick={() => execCmd('italic')} className="p-1.5 min-w-[30px] rounded hover:bg-gray-200 italic border border-gray-300" title="Italic">I</button>
                    <button onClick={() => execCmd('underline')} className="p-1.5 min-w-[30px] rounded hover:bg-gray-200 underline border border-gray-300" title="Underline">U</button>
                    <div className="w-px h-6 bg-gray-300 mx-1"></div>
                    <button onClick={() => execCmd('insertUnorderedList')} className="p-1.5 min-w-[30px] rounded hover:bg-gray-200 border border-gray-300" title="Bullet List">•</button>
                    <div className="w-px h-6 bg-gray-300 mx-1"></div>
                    {/* Colors */}
                    <button onClick={() => execCmd('foreColor', '#000000')} className="w-6 h-6 rounded-full bg-black border border-gray-300 hover:scale-110 transition" title="Black"></button>
                    <button onClick={() => execCmd('foreColor', '#dc2626')} className="w-6 h-6 rounded-full bg-red-600 border border-gray-300 hover:scale-110 transition" title="Red"></button>
                    <button onClick={() => execCmd('foreColor', '#2563eb')} className="w-6 h-6 rounded-full bg-blue-600 border border-gray-300 hover:scale-110 transition" title="Blue"></button>
                    <button onClick={() => execCmd('foreColor', '#16a34a')} className="w-6 h-6 rounded-full bg-green-600 border border-gray-300 hover:scale-110 transition" title="Green"></button>
                </div>

                <div 
                    ref={editorRef}
                    className="p-4 min-h-[200px] max-h-[400px] overflow-y-auto outline-none text-sm leading-relaxed bg-white"
                    contentEditable
                    suppressContentEditableWarning
                />

                <div className="p-4 border-t bg-gray-50 flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded transition">Cancel</button>
                    <button onClick={handleSave} className="px-6 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 shadow-sm transition">Save Changes</button>
                </div>
            </div>
        </div>
    );
};

// --- BULK FORMAT MODAL ---
const BulkFormatModal: React.FC<{
    onApply: (settings: { bracketColor: string, isBold: boolean, fontSize: string, applyToAllDays: boolean }) => void;
    onClose: () => void;
}> = ({ onApply, onClose }) => {
    const [bracketColor, setBracketColor] = useState('#dc2626'); // Default Red
    const [isBold, setIsBold] = useState(false);
    const [fontSize, setFontSize] = useState('14px');
    const [applyToAllDays, setApplyToAllDays] = useState(false);

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm no-print">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in border border-gray-100">
                <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <span>🎨</span> Bulk Format Items
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>
                
                <div className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Highlight Color (Brackets & Slashes)</label>
                        <div className="flex gap-3">
                            {['#dc2626', '#2563eb', '#16a34a', '#d97706', '#9333ea', '#000000'].map(color => (
                                <button 
                                    key={color}
                                    onClick={() => setBracketColor(color)}
                                    className={`w-8 h-8 rounded-full border-2 transition hover:scale-110 ${bracketColor === color ? 'border-gray-800 scale-110 shadow-md' : 'border-transparent'}`}
                                    style={{ backgroundColor: color }}
                                    title={color}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Text Style</label>
                            <label className="flex items-center gap-2 cursor-pointer bg-gray-50 p-2 rounded border border-gray-200 hover:bg-gray-100">
                                <input 
                                    type="checkbox" 
                                    checked={isBold} 
                                    onChange={e => setIsBold(e.target.checked)}
                                    className="w-4 h-4 rounded text-blue-600"
                                />
                                <span className="font-bold">Bold Text</span>
                            </label>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Font Size</label>
                            <select 
                                value={fontSize} 
                                onChange={e => setFontSize(e.target.value)}
                                className="w-full p-2 border rounded bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="12px">Small (12px)</option>
                                <option value="14px">Normal (14px)</option>
                                <option value="16px">Large (16px)</option>
                                <option value="18px">XL (18px)</option>
                            </select>
                        </div>
                    </div>

                    <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={applyToAllDays} 
                                onChange={e => setApplyToAllDays(e.target.checked)}
                                className="w-4 h-4 rounded text-yellow-600 focus:ring-yellow-500"
                            />
                            <span className="text-sm font-bold text-yellow-800">Apply to All Days in Plan</span>
                        </label>
                    </div>

                    <div className="text-center p-3 border border-dashed border-gray-300 rounded bg-gray-50">
                        <p className="text-xs text-gray-500 mb-1">Preview:</p>
                        <div style={{ fontSize: fontSize, fontWeight: isBold ? 'bold' : 'normal', color: '#1f2937' }}>
                            Food Name <span style={{ color: bracketColor, fontWeight: 'bold' }}>(100g) / Alt</span>
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t bg-gray-50 flex gap-2">
                    <button onClick={onClose} className="flex-1 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded transition">Cancel</button>
                    <button onClick={() => onApply({ bracketColor, isBold, fontSize, applyToAllDays })} className="flex-1 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 shadow-sm transition">Apply Formatting</button>
                </div>
            </div>
        </div>
    );
};

// --- PRINT OPTIONS MODAL (v2.0.231 ENHANCED) ---
const PrintOptionsModal: React.FC<{
    onConfirm: (options: PrintOptions) => void;
    onClose: () => void;
    isWeek: boolean;
}> = ({ onConfirm, onClose, isWeek }) => {
    const [options, setOptions] = useState<PrintOptions>({
        showServes: true,
        showKcal: true,
        showNutritionTable: true,
        showAlternativesInTable: true,
        showPlannedKcal: true, // v2.0.231
        includeAllAlternatives: false // v2.0.231
    });

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[110] p-4 backdrop-blur-sm no-print">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in border border-blue-100">
                <div className="p-5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex justify-between items-center">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <span>🖨️</span> {isWeek ? 'Weekly' : 'Daily'} Print Options
                    </h3>
                    <button onClick={onClose} className="text-white/70 hover:text-white transition">✕</button>
                </div>
                
                <div className="p-6 space-y-3 max-h-[70vh] overflow-y-auto">
                    <p className="text-sm text-gray-500 font-medium border-b border-gray-100 pb-2">Customize your printed report:</p>
                    
                    <label className="flex items-center gap-3 p-2 rounded-xl border border-gray-100 bg-gray-50 hover:bg-white cursor-pointer transition">
                        <input type="checkbox" checked={options.showPlannedKcal} onChange={e => setOptions({...options, showPlannedKcal: e.target.checked})} className="w-5 h-5 rounded text-blue-600" />
                        <div>
                            <span className="block font-bold text-gray-800 text-xs">Show Planned Kcal Summary</span>
                            <span className="text-[10px] text-gray-500">Calculates Main meals only</span>
                        </div>
                    </label>

                    <label className="flex items-center gap-3 p-2 rounded-xl border border-gray-100 bg-gray-50 hover:bg-white cursor-pointer transition">
                        <input type="checkbox" checked={options.includeAllAlternatives} onChange={e => setOptions({...options, includeAllAlternatives: e.target.checked})} className="w-5 h-5 rounded text-blue-600" />
                        <div>
                            <span className="block font-bold text-gray-800 text-xs">Print All Alternatives</span>
                            <span className="text-[10px] text-gray-500">Include alts even if unselected in UI</span>
                        </div>
                    </label>

                    <label className="flex items-center gap-3 p-2 rounded-xl border border-gray-100 bg-gray-50 hover:bg-white cursor-pointer transition">
                        <input type="checkbox" checked={options.showServes} onChange={e => setOptions({...options, showServes: e.target.checked})} className="w-5 h-5 rounded text-blue-600" />
                        <div>
                            <span className="block font-bold text-gray-800 text-xs">Serves Amount</span>
                            <span className="text-[10px] text-gray-500">Display "1.0 sv" in lists</span>
                        </div>
                    </label>

                    <label className="flex items-center gap-3 p-2 rounded-xl border border-gray-100 bg-gray-50 hover:bg-white cursor-pointer transition">
                        <input type="checkbox" checked={options.showKcal} onChange={e => setOptions({...options, showKcal: e.target.checked})} className="w-5 h-5 rounded text-blue-600" />
                        <div>
                            <span className="block font-bold text-gray-800 text-xs">Item Calories</span>
                            <span className="text-[10px] text-gray-500">Display item kcal in list</span>
                        </div>
                    </label>

                    <label className="flex items-center gap-3 p-2 rounded-xl border border-blue-50 bg-blue-50/30 hover:bg-white cursor-pointer transition">
                        <input type="checkbox" checked={options.showNutritionTable} onChange={e => setOptions({...options, showNutritionTable: e.target.checked})} className="w-5 h-5 rounded text-blue-600" />
                        <div>
                            <span className="block font-bold text-blue-900 text-xs">Detailed Macro Breakdown</span>
                            <span className="text-[10px] text-blue-600/70">Breakdown per meal session</span>
                        </div>
                    </label>

                    {options.showNutritionTable && (
                        <label className="flex items-center gap-3 ml-6 p-2 rounded-lg bg-gray-50 hover:bg-white cursor-pointer transition border border-dashed border-gray-200">
                            <input type="checkbox" checked={options.showAlternativesInTable} onChange={e => setOptions({...options, showAlternativesInTable: e.target.checked})} className="w-4 h-4 rounded text-blue-600" />
                            <div>
                                <span className="block font-medium text-[10px] text-gray-700">Include Alternatives in Breakdown</span>
                            </div>
                        </label>
                    )}
                </div>

                <div className="p-4 bg-gray-50 border-t flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-200 rounded-xl transition">Cancel</button>
                    <button onClick={() => onConfirm(options)} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition transform active:scale-95">Prepare Print</button>
                </div>
            </div>
        </div>
    );
};

interface PrintOptions {
    showServes: boolean;
    showKcal: boolean;
    showNutritionTable: boolean;
    showAlternativesInTable: boolean;
    showPlannedKcal: boolean; // v2.0.231
    includeAllAlternatives: boolean; // v2.0.231
}

const MealCreator: React.FC<MealCreatorProps> = ({ 
    initialLoadId, 
    autoOpenLoad, 
    autoOpenNew, 
    activeVisit, 
    onNavigate,
    isEmbedded,
    externalTargetKcal,
    plannedExchanges,
    externalWeeklyPlan,
    onWeeklyPlanChange
}) => {
  const { t, isRTL } = useLanguage();
  const { session, profile } = useAuth();
  
  const [activeData, setActiveData] = useState<FoodItem[]>(mealCreatorDatabase);
  const [dataSource, setDataSource] = useState<'local' | 'cloud'>('local');
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');

  const [currentDay, setCurrentDay] = useState<number | 'instructions'>(1); // v2.0.231: Added instructions tab
  const [localWeeklyPlan, setLocalWeeklyPlan] = useState<WeeklyPlan>(DEFAULT_WEEKLY_PLAN);

  const weeklyPlan = (isEmbedded && externalWeeklyPlan) ? externalWeeklyPlan : localWeeklyPlan;
  const setWeeklyPlan = (isEmbedded && onWeeklyPlanChange) ? onWeeklyPlanChange : setLocalWeeklyPlan;
  
  const [searchQuery, setSearchQuery] = useState("");
  const [targetKcal, setTargetKcal] = useState<number>(2000);
  
  const [activeMealTime, setActiveMealTime] = useState<MealTime>('Lunch'); 
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({}); 

  const [editingItem, setEditingItem] = useState<{ day: number, meal: string, index: number, initialHtml: string } | null>(null);
  const [showBulkFormatModal, setShowBulkFormatModal] = useState(false);
  const [showInstructionsEditor, setShowInstructionsEditor] = useState(false); // v2.0.231

  const [showLoadModal, setShowLoadModal] = useState(false);
  const [planName, setPlanName] = useState('');
  const [loadedPlanId, setLoadedPlanId] = useState<string | null>(null);
  const [lastSavedName, setLastSavedName] = useState<string>('');
  const [savedPlans, setSavedPlans] = useState<SavedMeal[]>([]);
  const [statusMsg, setStatusMsg] = useState('');
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [loadSearchQuery, setLoadSearchQuery] = useState('');

  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printWeekMode, setPrintWeekMode] = useState(false); 
  const [printOptions, setPrintOptions] = useState<PrintOptions>({
      showServes: true,
      showKcal: true,
      showNutritionTable: true,
      showAlternativesInTable: true,
      showPlannedKcal: true,
      includeAllAlternatives: false
  });
  
  const [printSettings, setPrintSettings] = useState({
      doctorName: '',
      clinicName: 'Diet-Nova Clinic',
      patientName: '',
      printDate: new Date().toISOString().split('T')[0],
      notes: ''
  });

  useEffect(() => {
      if (externalTargetKcal && externalTargetKcal > 0) {
          setTargetKcal(externalTargetKcal);
      }
  }, [externalTargetKcal, isEmbedded]);

  useEffect(() => {
      if (profile?.full_name) {
          setPrintSettings(prev => ({ ...prev, doctorName: profile.full_name }));
      }
      if (activeVisit) {
          setPrintSettings(prev => ({ 
              ...prev, 
              patientName: activeVisit.client.full_name,
              clinicName: activeVisit.client.clinic || prev.clinicName
          }));
      }
  }, [profile, activeVisit]);

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
                  setDataSource('local');
              }
          } catch (err) {
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
          setSyncMsg('Error: ' + err.message);
      }
  };

  const filteredFoods = useMemo(() => {
    if (!searchQuery) return [];
    const q = searchQuery.toLowerCase();
    return activeData.filter(
      (food) => food.name.toLowerCase().includes(q) || food.group.toLowerCase().includes(q)
    );
  }, [searchQuery, activeData]);

  const ensureDayExists = (day: number) => {
      setWeeklyPlan(prev => {
          if (prev[day]) return prev;
          return {
              ...prev,
              [day]: { 
                  items: MEAL_TIMES.reduce((acc, time) => ({ ...acc, [time]: [] }), {}),
                  meta: {}
              }
          };
      });
  };

  useEffect(() => {
      if (typeof currentDay === 'number') {
        ensureDayExists(currentDay);
      }
  }, [currentDay]);

  const fetchTargetKcal = () => {
      if (externalTargetKcal && externalTargetKcal > 0) {
          setTargetKcal(externalTargetKcal);
          setStatusMsg(`Synced target: ${externalTargetKcal.toFixed(0)} kcal`);
          setTimeout(() => setStatusMsg(''), 2000);
          return;
      }
      if (!activeVisit) return;
      let target = 0;
      if (activeVisit.visit.meal_plan_data?.targetKcal) {
          target = Number(activeVisit.visit.meal_plan_data.targetKcal);
      } else if (activeVisit.visit.kcal_data?.inputs?.reqKcal) {
          target = Number(activeVisit.visit.kcal_data.inputs.reqKcal);
      }
      if (target > 0) {
          setTargetKcal(target);
          setStatusMsg(`Target updated to ${target} kcal`);
          setTimeout(() => setStatusMsg(''), 2000);
      } else {
          alert("No calculated target found in Meal Planner or Kcal Calculator.");
      }
  };

  useEffect(() => {
      if (activeVisit && !isEmbedded) {
          let target = 2000;
          if (activeVisit.visit.day_plan_data?.targetKcal) {
              target = Number(activeVisit.visit.day_plan_data.targetKcal);
          } else if (activeVisit.visit.meal_plan_data?.targetKcal) {
              target = Number(activeVisit.visit.meal_plan_data.targetKcal);
          } else if (activeVisit.visit.kcal_data?.inputs?.reqKcal) {
              target = Number(activeVisit.visit.kcal_data.inputs.reqKcal);
          }
          if (target > 0) setTargetKcal(target);
          if (activeVisit.visit.day_plan_data) {
              const data = activeVisit.visit.day_plan_data;
              if (data.weeklyPlan) setWeeklyPlan(data.weeklyPlan);
              setStatusMsg("Loaded Client Plan");
          }
      }
  }, [activeVisit, isEmbedded]);

  const addToPlan = (food: FoodItem) => {
      if (typeof currentDay !== 'number') return;
      setWeeklyPlan(prev => {
          const dayData = prev[currentDay] || { items: {}, meta: {} };
          const currentList = dayData.items[activeMealTime] || [];
          
          // Apply initial red coloring if name contains slashes or brackets
          let formattedName = food.name;
          if (REGEX_HIGHLIGHT.test(food.name)) {
              const parts = food.name.split(REGEX_HIGHLIGHT);
              formattedName = parts.map(p => REGEX_HIGHLIGHT.test(p) ? `<span style="color: #dc2626; font-weight: bold;">${p}</span>` : p).join('');
          }

          return {
              ...prev,
              [currentDay]: {
                  ...dayData,
                  items: {
                      ...dayData.items,
                      [activeMealTime]: [...currentList, { ...food, serves: 1, selected: true, optionGroup: 'main', customDisplayName: formattedName }]
                  }
              }
          };
      });
      setSearchQuery("");
  };

  const removeFromPlan = (mealTime: string, index: number) => {
      if (typeof currentDay !== 'number') return;
      setWeeklyPlan(prev => {
          const dayData = prev[currentDay];
          const newList = [...dayData.items[mealTime]];
          newList.splice(index, 1);
          return {
              ...prev,
              [currentDay]: { ...dayData, items: { ...dayData.items, [mealTime]: newList } }
          };
      });
  };

  const updateItem = (mealTime: string, index: number, field: keyof PlannerItem, value: any) => {
      if (typeof currentDay !== 'number') return;
      setWeeklyPlan(prev => {
          const dayData = prev[currentDay];
          const newList = [...dayData.items[mealTime]];
          newList[index] = { ...newList[index], [field]: value };
          return {
              ...prev,
              [currentDay]: { ...dayData, items: { ...dayData.items, [mealTime]: newList } }
          };
      });
  };

  const updateMeta = (mealTime: string, field: keyof MealMeta, value: string) => {
      if (typeof currentDay !== 'number') return;
      setWeeklyPlan(prev => {
          const dayData = prev[currentDay];
          const currentMeta = dayData.meta[mealTime] || { timeStart: '', timeEnd: '', notes: '' };
          return {
              ...prev,
              [currentDay]: {
                  ...dayData,
                  meta: { ...dayData.meta, [mealTime]: { ...currentMeta, [field]: value } }
              }
          };
      });
  };

  // v2.0.231: Select/Unselect All logic
  const handleSelectAllDay = (mode: 'all' | 'none' | 'main-only') => {
    if (typeof currentDay !== 'number') return;
    setWeeklyPlan(prev => {
        const newPlan = { ...prev };
        const dayItems = { ...newPlan[currentDay].items };
        
        Object.keys(dayItems).forEach(mealTime => {
            dayItems[mealTime] = dayItems[mealTime].map(item => {
                let isSelected = item.selected;
                if (mode === 'none') isSelected = false;
                else if (mode === 'all') isSelected = true;
                else if (mode === 'main-only') {
                    isSelected = item.optionGroup === 'main';
                }
                return { ...item, selected: isSelected };
            });
        });

        newPlan[currentDay] = { ...newPlan[currentDay], items: dayItems };
        return newPlan;
    });
  };

  const resetPlanner = () => {
      if(!confirm("Clear all days?")) return;
      setWeeklyPlan(DEFAULT_WEEKLY_PLAN);
      setCurrentDay(1);
      setPlanName("");
      setLoadedPlanId(null);
      setLastSavedName("");
  };

  const clearDay = () => {
      if(typeof currentDay !== 'number') return;
      if(!confirm("Clear current day only?")) return;
      setWeeklyPlan(prev => ({
          ...prev,
          [currentDay]: { items: MEAL_TIMES.reduce((acc, time) => ({ ...acc, [time]: [] }), {}), meta: {} }
      }));
  };

  const openEditor = (meal: string, index: number, item: PlannerItem) => {
      if (typeof currentDay !== 'number') return;
      setEditingItem({
          day: currentDay,
          meal: meal,
          index: index,
          initialHtml: item.customDisplayName || item.name
      });
  };

  const saveEditorContent = (html: string) => {
      if (editingItem) {
          updateItem(editingItem.meal, editingItem.index, 'customDisplayName', html);
          setEditingItem(null);
      }
  };

  const handleSaveInstructions = (html: string) => {
      setWeeklyPlan(prev => ({ ...prev, instructions: html }));
      setShowInstructionsEditor(false);
  };

  /**
   * v2.0.229: Synchronized bulk formatting for brackets and slashes
   */
  const handleBulkFormat = (options: { bracketColor: string, isBold: boolean, fontSize: string, applyToAllDays: boolean }) => {
      setWeeklyPlan(prev => {
          const newPlan = JSON.parse(JSON.stringify(prev)); 
          const dayKeys = Object.keys(newPlan).filter(k => !isNaN(Number(k)));
          const daysToUpdate = options.applyToAllDays ? dayKeys.map(Number) : [currentDay];

          daysToUpdate.forEach(day => {
              if (!newPlan[day]) return;
              const dayItems = newPlan[day].items;
              Object.keys(dayItems).forEach(mealTime => {
                  if(dayItems[mealTime]) {
                      dayItems[mealTime] = dayItems[mealTime].map((item: PlannerItem) => {
                          let textToFormat = item.name;
                          if (item.customDisplayName) {
                               const tempDiv = document.createElement("div");
                               tempDiv.innerHTML = item.customDisplayName;
                               textToFormat = tempDiv.textContent || item.name;
                          }
                          const parts = textToFormat.split(REGEX_HIGHLIGHT);
                          let html = `<span style="font-size: ${options.fontSize}; ${options.isBold ? 'font-weight: bold;' : ''}">`;
                          parts.forEach((part: string) => {
                              if (REGEX_HIGHLIGHT.test(part)) {
                                  html += `<span style="color: ${options.bracketColor}; font-weight: bold;">${part}</span>`;
                              } else {
                                  html += part;
                              }
                          });
                          html += `</span>`;
                          return { ...item, customDisplayName: html };
                      });
                  }
              });
          });
          return newPlan;
      });
      setShowBulkFormatModal(false);
      setStatusMsg("Bulk formatting applied!");
      setTimeout(() => setStatusMsg(''), 2500);
  };

  const summary = useMemo(() => {
    let totalServes = 0, totalCHO = 0, totalProtein = 0, totalFat = 0, totalFiber = 0, totalKcal = 0;
    let mainOnlyKcal = 0; // v2.0.231
    const usedExchanges: Record<string, number> = {};
    const dayData = weeklyPlan[currentDay as number];
    if (!dayData || typeof currentDay !== 'number') return { totalServes: 0, totalCHO: 0, totalProtein: 0, totalFat: 0, totalFiber: 0, totalKcal: 0, mainOnlyKcal: 0, usedExchanges };
    
    Object.values(dayData.items).forEach((mealList: any) => {
        if (Array.isArray(mealList)) {
            mealList.forEach((item: PlannerItem) => {
                if (item.selected) { 
                    const s = Number(item.serves);
                    const k = Number(item.kcal) * s;
                    totalServes += s;
                    totalCHO += Number(item.cho) * s;
                    totalProtein += Number(item.protein) * s;
                    totalFat += Number(item.fat) * s;
                    totalFiber += Number(item.fiber) * s;
                    totalKcal += k;
                    if (item.optionGroup === 'main') mainOnlyKcal += k;

                    let key = GROUP_MAPPING[item.group] || item.group;
                    if (item.group && typeof item.group === 'string' && item.group.includes("Fat")) key = 'fats';
                    usedExchanges[key] = (usedExchanges[key] || 0) + s;
                }
            });
        }
    });
    return { totalServes, totalCHO, totalProtein, totalFat, totalFiber, totalKcal, mainOnlyKcal, usedExchanges };
  }, [weeklyPlan, currentDay]);

  const percentages = useMemo(() => {
     const k = summary.totalKcal || 1;
     return {
         cho: ((summary.totalCHO * 4) / k * 100).toFixed(1),
         pro: ((summary.totalProtein * 4) / k * 100).toFixed(1),
         fat: ((summary.totalFat * 9) / k * 100).toFixed(1),
     }
  }, [summary]);

  const exchangeComparison = useMemo(() => {
      let planned: Record<string, number> = {};
      if (plannedExchanges && Object.keys(plannedExchanges).length > 0) {
          planned = plannedExchanges;
      } else if (activeVisit?.visit.meal_plan_data?.servings) {
          planned = activeVisit.visit.meal_plan_data.servings;
      }
      const used = summary.usedExchanges;
      const groups = [
          { key: 'starch', label: 'Starch' }, { key: 'fruit', label: 'Fruits' }, { key: 'veg', label: 'Vegetables' },
          { key: 'meatLean', label: 'Lean Meat' }, { key: 'meatMed', label: 'Med Meat' }, { key: 'meatHigh', label: 'High Meat' },
          { key: 'milkSkim', label: 'Skim Milk' }, { key: 'milkLow', label: 'Low Milk' }, { key: 'milkWhole', label: 'Full Milk' },
          { key: 'legumes', label: 'Legumes' }, { key: 'sugar', label: 'Sugar' }, { key: 'fats', label: 'Fats' },
      ];
      return groups.map(g => {
          let planVal = planned[g.key] || 0;
          if (g.key === 'fats' && planVal === 0) {
              planVal = (planned['fatsPufa'] || 0) + (planned['fatsMufa'] || 0) + (planned['fatsSat'] || 0);
          }
          const useVal = used[g.key] || 0;
          return { ...g, plan: planVal, used: useVal, icon: GROUP_ICONS[g.key] || '🍽️' };
      }).filter(g => g.plan > 0 || g.used > 0);
  }, [activeVisit, summary.usedExchanges, plannedExchanges]);

  const daySummaryRows = useMemo(() => {
      if (typeof currentDay !== 'number') return [];
      const dayData = weeklyPlan[currentDay] || { items: {}, meta: {} };
      return MEAL_TIMES.map(time => {
          const items = dayData.items[time] || [];
          const meta = dayData.meta[time] || { timeStart: '', timeEnd: '', notes: '' };
          const stats = items.filter(i => i.selected).reduce((acc, i) => ({
              kcal: acc.kcal + (Number(i.kcal) * Number(i.serves)),
              cho: acc.cho + (Number(i.cho) * Number(i.serves)),
              pro: acc.pro + (Number(i.protein) * Number(i.serves)),
              fat: acc.fat + (Number(i.fat) * Number(i.serves))
          }), { kcal: 0, cho: 0, pro: 0, fat: 0 });
          return { time, meta, stats, hasItems: items.length > 0 };
      });
  }, [weeklyPlan, currentDay]);

  const fetchPlans = async () => {
    if (!session) return;
    setIsLoadingPlans(true);
    try {
        const { data, error } = await supabase
          .from('saved_meals')
          .select('*')
          .eq('tool_type', 'day-planner')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });
        if (error) throw error;
        if (data) setSavedPlans(data);
    } catch (err) {
        setStatusMsg("Error loading plans.");
    } finally {
        setIsLoadingPlans(false);
    }
  };

  const saveAsTemplate = async () => {
      let nameToSave = planName;
      if (!nameToSave) {
          const input = prompt("Enter a name for this Meal Plan Template:", lastSavedName || "");
          if (!input) return;
          nameToSave = input;
          setPlanName(input);
      }
      if (!session) return;
      setStatusMsg("Saving Template...");
      const planData = { weeklyPlan, targetKcal };
      const isUpdate = loadedPlanId && (nameToSave === lastSavedName);
      try {
          if (isUpdate) {
              await supabase.from('saved_meals').update({ name: nameToSave, data: planData }).eq('id', loadedPlanId).eq('user_id', session.user.id);
              setStatusMsg("Template Updated!");
          } else {
              const { data, error } = await supabase.from('saved_meals').insert({ user_id: session.user.id, name: nameToSave, tool_type: 'day-planner', data: planData, created_at: new Date().toISOString() }).select().single();
              if (error) throw error;
              if (data) { setLoadedPlanId(data.id); setLastSavedName(data.name); }
              setStatusMsg("Template Saved!");
          }
          fetchPlans();
          setTimeout(() => setStatusMsg(''), 3000);
      } catch (err: any) { setStatusMsg("Error: " + err.message); }
  };

  const savePlan = async () => {
    if (activeVisit && !isEmbedded) {
        setStatusMsg("Saving to Client Visit...");
        try {
            const planData = { weeklyPlan, targetKcal };
            const { error } = await supabase.from('client_visits').update({ day_plan_data: planData }).eq('id', activeVisit.visit.id);
            if (error) throw error;
            setStatusMsg("Saved to Visit Successfully!");
            setTimeout(() => setStatusMsg(''), 3000);
        } catch (err: any) { setStatusMsg("Error saving to visit: " + err.message); }
        return;
    }
    saveAsTemplate();
  };

  const loadPlan = (plan: SavedMeal) => {
    if (!plan.data) return;
    if (plan.data.weeklyPlan) setWeeklyPlan(plan.data.weeklyPlan);
    else if (plan.data.dayPlan) setWeeklyPlan({ 1: { items: { ...plan.data.dayPlan }, meta: {} } });
    if (plan.data.targetKcal) setTargetKcal(plan.data.targetKcal);
    setPlanName(plan.name); setLoadedPlanId(plan.id); setLastSavedName(plan.name); setShowLoadModal(false); setStatusMsg(t.common.loadSuccess);
    setTimeout(() => setStatusMsg(''), 3000);
  };

  const deletePlan = async (id: string) => {
      if (!window.confirm("Are you sure you want to delete this plan?")) return;
      if (!session) return;
      try {
          await supabase.from('saved_meals').delete().eq('id', id).eq('user_id', session.user.id);
          setSavedPlans(prev => prev.filter(p => p.id !== id));
      } catch (err: any) { setStatusMsg("Error deleting plan."); }
  };

  const filteredSavedPlans = useMemo(() => {
      if (!loadSearchQuery) return savedPlans;
      const q = loadSearchQuery.toLowerCase();
      return savedPlans.filter(plan => plan.name.toLowerCase().includes(q));
  }, [savedPlans, loadSearchQuery]);

  /**
   * v2.0.230: Enhanced Print logic to include options confirmation
   */
  const confirmPrint = (options: PrintOptions) => {
      setPrintOptions(options);
      setShowPrintModal(false);
      // Wait for React to update the DOM before triggering print
      setTimeout(() => { 
          window.print(); 
      }, 300);
  };

  /**
   * v2.0.230: Helper to calculate nutrient totals for a list of items
   */
  const calculateNutrientsForItems = (items: PlannerItem[]) => {
      return items.reduce((acc, i) => ({
          kcal: acc.kcal + (Number(i.kcal) * Number(i.serves)),
          cho: acc.cho + (Number(i.cho) * Number(i.serves)),
          pro: acc.pro + (Number(i.protein) * Number(i.serves)),
          fat: acc.fat + (Number(i.fat) * Number(i.serves))
      }), { kcal: 0, cho: 0, pro: 0, fat: 0 });
  };

  return (
    <div className="max-w-[1920px] mx-auto animate-fade-in space-y-6 pb-12">
      <Toast message={statusMsg || syncMsg} />
      {editingItem && <RichTextEditorModal initialHtml={editingItem.initialHtml} onSave={saveEditorContent} onClose={() => setEditingItem(null)} />}
      {showBulkFormatModal && <BulkFormatModal onApply={handleBulkFormat} onClose={() => setShowBulkFormatModal(false)} />}
      {showInstructionsEditor && <RichTextEditorModal title="Global Instructions" initialHtml={weeklyPlan.instructions || ''} onSave={handleSaveInstructions} onClose={() => setShowInstructionsEditor(false)} />}
      
      {/* v2.0.230: Print Options Modal */}
      {showPrintModal && <PrintOptionsModal isWeek={printWeekMode} onClose={() => setShowPrintModal(false)} onConfirm={confirmPrint} />}

      {!isEmbedded && activeVisit && (
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl mb-2 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm no-print">
              <div>
                  <h3 className="font-bold text-blue-800 text-lg">Day Planner: {activeVisit.client.full_name}</h3>
                  <p className="text-sm text-blue-600">Visit Date: {new Date(activeVisit.visit.visit_date).toLocaleDateString('en-GB')}</p>
              </div>
              <div className="flex items-center gap-3">
                  {/* Fixed handleSaveToVisit error by using savePlan */}
                  <button onClick={savePlan} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg shadow font-bold transition flex items-center gap-2"><span>💾</span> Save to Visit</button>
                  <button onClick={saveAsTemplate} className="bg-white border border-blue-300 text-blue-700 px-4 py-2 rounded-lg shadow-sm font-bold transition flex items-center gap-2 hover:bg-blue-50"><span>📑</span> Save as Template</button>
              </div>
          </div>
      )}

      <div className={`sticky top-12 z-40 bg-[var(--color-bg)] pt-2 pb-4 -mx-4 px-4 no-print shadow-sm border-b border-gray-100/50 ${isEmbedded ? 'top-0' : 'top-12'}`}>
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 flex flex-col xl:flex-row justify-between items-center gap-6">
              <div className="text-center xl:text-left">
                  <h1 className="text-3xl font-bold text-[var(--color-heading)] bg-clip-text text-transparent bg-gradient-to-r from-[var(--color-primary-dark)] to-[var(--color-primary)]">Day Food Planner</h1>
                  <p className="text-sm text-gray-500 mt-1 flex items-center gap-2 justify-center xl:justify-start">
                    {typeof currentDay === 'number' ? `Select a meal time then search to add foods for Day ${currentDay}.` : 'Edit global instructions for the entire plan.'}
                  </p>
              </div>
              <div className="relative w-full max-w-xl">
                  {typeof currentDay === 'number' ? (
                      <>
                        <input type="text" className={`w-full px-6 py-3 rounded-full border-2 focus:outline-none shadow-sm text-lg transition-colors bg-white ${activeMealTime ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary-light)]' : 'border-gray-300'}`} placeholder={`Search to add to: ${MEAL_ICONS[activeMealTime] || ''} ${activeMealTime}`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} dir={isRTL ? 'rtl' : 'ltr'} />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--color-primary)] bg-white px-2">Adding to: {activeMealTime}</span>
                      </>
                  ) : (
                      <div className="bg-blue-50 p-3 rounded-full border border-blue-200 text-blue-800 font-bold text-center">
                        📋 INSTRUCTIONS MODE
                      </div>
                  )}
                  {searchQuery && filteredFoods.length > 0 && (
                    <ul className="absolute w-full bg-white mt-2 rounded-xl shadow-2xl max-h-80 overflow-y-auto z-50 border border-gray-100 text-right">
                      {filteredFoods.map((food, idx) => (
                        <li key={idx} className="px-4 py-3 hover:bg-green-50 border-b border-gray-50 last:border-0 transition-colors flex justify-between items-center cursor-pointer group" onClick={() => addToPlan(food)}>
                          <div className="flex-grow text-left">
                              <div className="font-medium text-[var(--color-text)]">{renderHighlightedText(food.name)}</div>
                              <div className="text-xs text-[var(--color-text-light)] flex gap-2"><span>{food.group}</span><span className="font-bold text-blue-600">{food.kcal.toFixed(0)} kcal</span></div>
                          </div>
                          <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded font-bold group-hover:bg-green-200">+ Add</div>
                        </li>
                      ))}
                    </ul>
                  )}
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-center">
                    {!isEmbedded && <button onClick={() => onNavigate && onNavigate('meal-planner', undefined, undefined, true)} className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded-lg transition shadow-sm text-sm font-bold flex items-center gap-2"><span>📅</span> Meal Planner</button>}
                    {session && (<><input type="text" placeholder="Plan Name" value={planName} onChange={e => setPlanName(e.target.value)} className="w-32 p-2 border rounded text-sm outline-none" /><button onClick={saveAsTemplate} className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded transition" title="Save Template">💾</button><button onClick={() => { fetchPlans(); setShowLoadModal(true); }} className="bg-purple-500 hover:bg-purple-600 text-white p-2 rounded transition" title="Load Template">📂</button></>)}
                    <button onClick={() => setShowBulkFormatModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white w-10 h-10 rounded-lg transition flex items-center justify-center shadow-sm" title="Bulk Format Items"><span className="text-xl">🎨</span></button>
                    <button onClick={() => { setPrintWeekMode(false); setShowPrintModal(true); }} className="bg-gray-700 hover:bg-gray-800 text-white w-10 h-10 rounded-lg transition flex items-center justify-center shadow-sm" title="Print Single Day"><span className="text-xl">🖨️</span></button>
                    <button onClick={() => { setPrintWeekMode(true); setShowPrintModal(true); }} className="bg-gray-700 hover:bg-gray-800 text-white w-10 h-10 rounded-lg transition flex items-center justify-center shadow-sm" title="Print Weekly Menu"><span className="text-xl font-bold text-xs">WK</span></button>
                    <button onClick={resetPlanner} className="text-red-500 hover:text-red-700 text-sm font-medium border border-red-200 px-3 py-2 rounded">Clear All</button>
              </div>
          </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 no-print items-center">
          {[1, 2, 3, 4, 5, 6, 7].map(day => (
            <button key={day} onClick={() => setCurrentDay(day)} className={`px-6 py-2 rounded-t-lg font-bold text-sm transition-all border-b-2 whitespace-nowrap ${currentDay === day ? 'bg-white text-blue-600 border-blue-600 shadow-sm' : 'bg-gray-100 text-gray-500 border-transparent hover:bg-gray-200'}`}>
                Day {day}
            </button>
          ))}
          <button 
            onClick={() => setCurrentDay('instructions')} 
            className={`px-6 py-2 rounded-t-lg font-bold text-sm transition-all border-b-2 whitespace-nowrap ${currentDay === 'instructions' ? 'bg-blue-600 text-white border-blue-800 shadow-sm' : 'bg-blue-50 text-blue-600 border-transparent hover:bg-blue-100'}`}
          >
            📋 Instructions
          </button>
          {typeof currentDay === 'number' && (
            <div className="ml-auto flex gap-2">
                <button onClick={() => handleSelectAllDay('main-only')} className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded font-bold hover:bg-green-200 transition">Select All (Main)</button>
                <button onClick={() => handleSelectAllDay('none')} className="text-[10px] bg-gray-100 text-gray-700 px-2 py-1 rounded font-bold hover:bg-gray-200 transition">Unselect All</button>
                <button onClick={clearDay} className="text-[10px] text-red-400 hover:text-red-600 px-2 py-1 font-bold border border-red-100 rounded">Clear Day {currentDay}</button>
            </div>
          )}
      </div>

      {/* SINGLE DAY PRINT (v2.0.231 REFINED) */}
      <div className={`hidden print:block font-sans text-sm p-4 w-full h-full bg-white relative ${printWeekMode ? 'hidden print:hidden' : ''}`}>
          <div className="border-b-2 border-gray-800 pb-4 mb-6 flex justify-between items-start">
              <div><h1 className="text-2xl font-bold uppercase tracking-wider text-gray-900">{printSettings.clinicName}</h1><p className="text-sm text-gray-600 mt-1">{printSettings.doctorName}</p></div>
              <div className="text-right"><h2 className="text-xl font-bold text-[var(--color-primary-dark)]">Daily Meal Plan</h2><div className="text-sm mt-1">{printSettings.patientName && <div>Patient: <strong>{printSettings.patientName}</strong></div>}<div>Date: <strong>{new Date(printSettings.printDate).toLocaleDateString('en-GB')}</strong></div><div>Day: <strong>{currentDay}</strong></div></div></div>
          </div>
          <div className="mb-6 grid grid-cols-5 gap-4 border border-gray-300 rounded-lg p-3 bg-gray-50 text-center print-color-exact">
              <div><span className="block text-[10px] uppercase text-gray-500 font-bold">Target Kcal</span><span className="font-bold text-lg">{targetKcal.toFixed(0)}</span></div>
              {printOptions.showPlannedKcal && (
                <div><span className="block text-[10px] uppercase text-gray-500 font-bold">Planned Kcal</span><span className="font-bold text-lg text-blue-700">{summary.mainOnlyKcal.toFixed(0)}</span></div>
              )}
              <div className="border-l border-gray-300"><span className="block text-[10px] uppercase text-blue-500 font-bold">Carbs</span><span className="font-bold">{summary.totalCHO.toFixed(0)}g</span></div>
              <div><span className="block text-[10px] uppercase text-red-500 font-bold">Protein</span><span className="font-bold">{summary.totalProtein.toFixed(0)}g</span></div>
              <div><span className="block text-[10px] uppercase text-yellow-600 font-bold">Fat</span><span className="font-bold">{summary.totalFat.toFixed(0)}g</span></div>
          </div>
          <table className="w-full border-collapse border border-gray-300 mb-6">
              <thead className="bg-gray-100 text-gray-800 print-color-exact">
                <tr>
                    <th className="p-2 border border-gray-300 text-left w-1/4">Meal Time</th>
                    <th className="p-2 border border-gray-300 text-left">Menu Item</th>
                    {printOptions.showServes && <th className="p-2 border border-gray-300 text-center w-20">Serves</th>}
                    {printOptions.showKcal && <th className="p-2 border border-gray-300 text-center w-20">Kcal</th>}
                    <th className="p-2 border border-gray-300 text-left w-1/4">Notes</th>
                </tr>
              </thead>
              <tbody>
                  {MEAL_TIMES.map(time => {
                      const dayData: DayPlan = weeklyPlan[currentDay as number] || { items: {} as Record<string, PlannerItem[]>, meta: {} as Record<string, MealMeta> };
                      // Filter items: if includeAllAlternatives, we show all. Otherwise only selected.
                      const items = dayData.items[time]?.filter(i => (printOptions.includeAllAlternatives || i.selected) && i.optionGroup === 'main') || [];
                      const meta = dayData.meta[time];
                      if (items.length === 0 && !meta?.notes) return null;
                      
                      const allAlts = dayData.items[time]?.filter(i => (printOptions.includeAllAlternatives || i.selected) && i.optionGroup !== 'main') || [];
                      const altGroups = Array.from(new Set(allAlts.map(i => i.optionGroup)));
                      
                      const durationStr = meta?.timeStart ? ` (${meta.timeStart}${meta.timeEnd ? ' - ' + meta.timeEnd : ''})` : '';

                      return (
                          <React.Fragment key={time}>
                              <tr className={`${MEAL_COLORS[time]?.split(' ')[0] || 'bg-gray-50'} print-color-exact`}>
                                  <td className="p-2 border border-gray-300 font-bold align-top text-gray-900" rowSpan={items.length + (altGroups.length > 0 ? 1 : 0) + 1}>
                                      <span className="mr-2 text-lg">{MEAL_ICONS[time]}</span> 
                                      {time}
                                      <span className="block text-[10px] font-normal text-gray-600 mt-1">{durationStr}</span>
                                  </td>
                              </tr>
                              {items.map((item, idx) => (
                                  <tr key={`${time}-${idx}`}>
                                      <td className="p-2 border border-gray-300">{item.customDisplayName ? (<div dangerouslySetInnerHTML={{ __html: item.customDisplayName }} />) : (<span>{item.name}</span>)}</td>
                                      {printOptions.showServes && <td className="p-2 border border-gray-300 text-center">{item.serves} sv</td>}
                                      {printOptions.showKcal && <td className="p-2 border border-gray-300 text-center text-xs">{(Number(item.kcal) * Number(item.serves)).toFixed(0)}</td>}
                                      {idx === 0 && (<td className="p-2 border border-gray-300 text-xs italic align-top" rowSpan={items.length}>{meta?.notes}</td>)}
                                  </tr>
                              ))}
                              {altGroups.length > 0 && (
                                <tr className="bg-yellow-50 print-color-exact font-medium">
                                    <td colSpan={1 + (printOptions.showServes ? 1 : 0) + (printOptions.showKcal ? 1 : 0)} className="p-2 border border-gray-300 text-xs">
                                        <strong className="text-orange-800">Alternatives:</strong> {altGroups.map(g => {
                                            const groupItems = dayData.items[time].filter(i => i.optionGroup === g && (printOptions.includeAllAlternatives || i.selected));
                                            return `${g}: ${groupItems.map(i => i.name).join(', ')}`;
                                        }).join(' | ')}
                                    </td>
                                </tr>
                              )}
                          </React.Fragment>
                      );
                  })}
              </tbody>
          </table>

          {/* v2.0.231: Print Global Instructions */}
          {weeklyPlan.instructions && (
              <div className="mb-6 break-inside-avoid">
                  <h3 className="font-bold text-gray-800 text-sm mb-2 border-b-2 border-gray-300 pb-1 uppercase tracking-wider">Plan Instructions</h3>
                  <div className="p-3 border border-gray-200 rounded-lg bg-white prose-sm" dangerouslySetInnerHTML={{ __html: weeklyPlan.instructions }} />
              </div>
          )}
          
          {/* v2.0.230: Detailed Nutrition Summary Table for Day Print */}
          {printOptions.showNutritionTable && (
              <div className="mb-6 break-inside-avoid">
                  <h3 className="font-bold text-blue-800 text-sm mb-2 border-b-2 border-blue-100 pb-1 uppercase tracking-wider">Nutrition & Alternative Calculations</h3>
                  <table className="w-full border-collapse border border-blue-200 text-xs text-center">
                      <thead className="bg-blue-600 text-white print-color-exact">
                          <tr>
                              <th className="p-2 border border-blue-300 text-left">Meal / Option</th>
                              <th className="p-2 border border-blue-300">Calories</th>
                              <th className="p-2 border border-blue-300">CHO (g)</th>
                              <th className="p-2 border border-blue-300">Prot (g)</th>
                              <th className="p-2 border border-blue-300">Fat (g)</th>
                          </tr>
                      </thead>
                      <tbody>
                          {MEAL_TIMES.map(time => {
                              const dayData: DayPlan = weeklyPlan[currentDay as number] || { items: {} as Record<string, PlannerItem[]>, meta: {} as Record<string, MealMeta> };
                              const items = dayData.items[time] || [];
                              if (items.length === 0) return null;
                              
                              const mainItems = items.filter(i => i.optionGroup === 'main' && (printOptions.includeAllAlternatives || i.selected));
                              const mainStats = calculateNutrientsForItems(mainItems);
                              
                              const altGroups = Array.from(new Set(items.map(i => i.optionGroup))).filter(g => g !== 'main');

                              return (
                                  <React.Fragment key={time}>
                                      <tr className="bg-gray-50 font-bold border-t-2 border-gray-300 print-color-exact">
                                          <td className="p-1 border border-gray-300 text-left text-blue-800" colSpan={5}>{time}</td>
                                      </tr>
                                      <tr className="hover:bg-blue-50/50">
                                          <td className="p-1 border border-gray-200 text-left pl-3 text-gray-500 font-medium">Main Option</td>
                                          <td className="p-1 border border-gray-200 font-bold text-gray-700">{mainStats.kcal.toFixed(0)}</td>
                                          <td className="p-1 border border-gray-200">{mainStats.cho.toFixed(1)}</td>
                                          <td className="p-1 border border-gray-200">{mainStats.pro.toFixed(1)}</td>
                                          <td className="p-1 border border-gray-200">{mainStats.fat.toFixed(1)}</td>
                                      </tr>
                                      {printOptions.showAlternativesInTable && altGroups.map(group => {
                                          const altItems = items.filter(i => i.optionGroup === group && (printOptions.includeAllAlternatives || i.selected));
                                          if (altItems.length === 0) return null;
                                          const altStats = calculateNutrientsForItems(altItems);
                                          return (
                                              <tr key={group} className="text-gray-600 bg-white italic">
                                                  <td className="p-1 border border-gray-100 text-left pl-6">↳ {group}</td>
                                                  <td className="p-1 border border-gray-100">{altStats.kcal.toFixed(0)}</td>
                                                  <td className="p-1 border border-gray-100">{altStats.cho.toFixed(1)}</td>
                                                  <td className="p-1 border border-gray-100">{altStats.pro.toFixed(1)}</td>
                                                  <td className="p-1 border border-gray-100">{altStats.fat.toFixed(1)}</td>
                                              </tr>
                                          );
                                      })}
                                  </React.Fragment>
                              );
                          })}
                      </tbody>
                  </table>
              </div>
          )}

          {printSettings.notes && (<div className="border border-gray-300 rounded p-3 mb-6 bg-white"><p className="text-sm whitespace-pre-wrap">{printSettings.notes}</p></div>)}
          <div className="text-center text-[10px] text-gray-400 mt-10 border-t pt-2">Generated by Diet-Nova System</div>
      </div>

      {/* WEEKLY TABLE PRINT (v2.0.230 REFINED) */}
      {printWeekMode && (
          <div className="hidden print:block font-sans text-xs w-full h-full absolute top-0 left-0 bg-white z-[9999] p-4">
              <div className="border-b-2 border-gray-800 pb-2 mb-4 flex justify-between items-start">
                  <div><h1 className="text-xl font-bold uppercase tracking-wider text-gray-900">{printSettings.clinicName}</h1><p className="text-xs text-gray-600">{printSettings.doctorName}</p></div>
                  <div className="text-right"><h2 className="text-lg font-bold text-[var(--color-primary-dark)]">Weekly Plan</h2><div className="text-xs">Date: <strong>{new Date(printSettings.printDate).toLocaleDateString('en-GB')}</strong></div></div>
              </div>
              <table className="w-full border-collapse border border-gray-400 text-[9px] mb-8">
                  <thead>
                    <tr className="bg-gray-200 text-gray-800 print-color-exact">
                        <th className="border border-gray-400 p-1 w-12">Day</th>
                        {MEAL_TIMES.map(time => (<th key={time} className={`border border-gray-400 p-1 ${MEAL_COLORS[time]?.split(' ')[0] || ''}`}>{MEAL_ICONS[time]} {time}</th>))}
                    </tr>
                  </thead>
                  <tbody>
                      {[1, 2, 3, 4, 5, 6, 7].map(day => {
                          const dayData: DayPlan = weeklyPlan[day] || { items: {} as Record<string, PlannerItem[]>, meta: {} as Record<string, MealMeta> };
                          if (!MEAL_TIMES.some(time => (dayData.items[time]?.length || 0) > 0)) return null;
                          return (
                              <tr key={day}>
                                  <td className="border border-gray-400 p-1 font-bold text-center bg-gray-50 print-color-exact">D{day}</td>
                                  {MEAL_TIMES.map(time => {
                                      const items = dayData.items[time]?.filter(i => (printOptions.includeAllAlternatives || i.selected) && i.optionGroup === 'main') || [];
                                      const meta = dayData.meta[time];
                                      const duration = meta?.timeStart ? ` (${meta.timeStart}${meta.timeEnd ? '-' + meta.timeEnd : ''})` : '';
                                      
                                      return (
                                          <td key={time} className="border border-gray-400 p-1 align-top h-20">
                                              {duration && <div className="text-[7px] text-gray-500 font-bold mb-1 border-b border-gray-100">{duration}</div>}
                                              {items.length > 0 ? (
                                                <ul className="list-none leading-tight space-y-1">
                                                    {items.map((item, idx) => (
                                                        <li key={idx}>
                                                            <div className="font-bold" dangerouslySetInnerHTML={{ __html: item.customDisplayName || item.name }} />
                                                            {(printOptions.showServes || printOptions.showKcal) && (
                                                                <div className="text-[7px] text-blue-600 opacity-80 italic">
                                                                    {printOptions.showServes && <span>{item.serves}sv </span>}
                                                                    {printOptions.showKcal && <span>({(Number(item.kcal) * Number(item.serves)).toFixed(0)}kcal)</span>}
                                                                </div>
                                                            )}
                                                        </li>
                                                    ))}
                                                </ul>
                                              ) : (<span className="text-gray-300">-</span>)}
                                          </td>
                                      );
                                  })}
                              </tr>
                          );
                      })}
                  </tbody>
              </table>

              {/* v2.0.231: Weekly Instructions Print */}
              {weeklyPlan.instructions && (
                  <div className="mb-6 break-inside-avoid text-[9px] border border-gray-400 p-2 rounded">
                       <h3 className="font-bold text-gray-900 mb-1 border-b border-gray-400 pb-0.5 uppercase">Global Instructions</h3>
                       <div dangerouslySetInnerHTML={{ __html: weeklyPlan.instructions }} />
                  </div>
              )}

              {/* v2.0.230: Weekly Macro Table */}
              {printOptions.showNutritionTable && (
                  <div className="break-inside-avoid">
                       <h3 className="font-bold text-blue-900 text-xs mb-2 uppercase border-b-2 border-blue-900 pb-1">Weekly Macro Analysis (Main Selection)</h3>
                       <table className="w-full border-collapse border border-gray-400 text-[8px] text-center">
                           <thead>
                               <tr className="bg-gray-800 text-white print-color-exact">
                                   <th className="p-1 border border-gray-400">Day</th>
                                   <th className="p-1 border border-gray-400">Total Kcal</th>
                                   <th className="p-1 border border-gray-400">Avg CHO (g)</th>
                                   <th className="p-1 border border-gray-400">Avg Prot (g)</th>
                                   <th className="p-1 border border-gray-400">Avg Fat (g)</th>
                               </tr>
                           </thead>
                           <tbody>
                               {[1, 2, 3, 4, 5, 6, 7].map(day => {
                                   const dayData = weeklyPlan[day];
                                   if (!dayData) return null;
                                   
                                   let dKcal = 0, dCho = 0, dPro = 0, dFat = 0;
                                   let hasItems = false;
                                   
                                   Object.values(dayData.items).forEach(list => {
                                       // Fixed unknown type error by casting list
                                       const mains = (list as PlannerItem[]).filter(i => (printOptions.includeAllAlternatives || i.selected) && i.optionGroup === 'main');
                                       if(mains.length > 0) hasItems = true;
                                       mains.forEach(i => {
                                           dKcal += Number(i.kcal) * Number(i.serves);
                                           dCho += Number(i.cho) * Number(i.serves);
                                           dPro += Number(i.protein) * Number(i.serves);
                                           dFat += Number(i.fat) * Number(i.serves);
                                       });
                                   });

                                   if(!hasItems) return null;

                                   return (
                                       <tr key={day} className="hover:bg-gray-50">
                                           <td className="p-1 border border-gray-300 font-bold bg-gray-50">Day {day}</td>
                                           <td className="p-1 border border-gray-300 font-bold text-blue-800">{dKcal.toFixed(0)}</td>
                                           <td className="p-1 border border-gray-300">{dCho.toFixed(1)}</td>
                                           <td className="p-1 border border-gray-300">{dPro.toFixed(1)}</td>
                                           <td className="p-1 border border-gray-300">{dFat.toFixed(1)}</td>
                                       </tr>
                                   );
                               })}
                           </tbody>
                       </table>
                  </div>
              )}
              <div className="text-center text-[8px] text-gray-400 mt-10 border-t pt-2">Generated by Diet-Nova System • All Rights Reserved</div>
          </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 no-print">
          {/* Side View: Summary */}
          <div className="xl:col-span-3 space-y-6 order-2 xl:order-1">
              <div className="bg-white rounded-xl shadow-lg border border-purple-100 p-4 sticky top-40">
                  <h3 className="font-bold text-purple-800 mb-4 flex items-center gap-2 border-b border-purple-100 pb-2"><span>📋</span> Exchange Control</h3>
                  <div className="space-y-3">
                      {exchangeComparison.map(ex => {
                          const pct = Math.min((ex.used / (ex.plan || 1)) * 100, 100);
                          const isOver = ex.used > ex.plan; const isComplete = ex.used === ex.plan;
                          const barColor = isOver ? 'bg-red-500' : isComplete ? 'bg-green-500' : 'bg-purple-500';
                          return (
                              <div key={ex.key} className="space-y-1">
                                  <div className="flex justify-between text-xs font-medium text-gray-700"><span>{ex.icon} {ex.label}</span><span className={`${isOver ? 'text-red-600 font-bold' : isComplete ? 'text-green-600 font-bold' : 'text-gray-600'}`}>{ex.used.toFixed(1)} / {ex.plan.toFixed(1)}</span></div>
                                  <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden"><div className={`h-full ${barColor} transition-all duration-500`} style={{ width: `${pct}%` }}></div></div>
                              </div>
                          )
                      })}
                  </div>
              </div>
              <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-4">
                  <h3 className="font-bold text-blue-800 mb-2 flex items-center gap-2 border-b border-blue-100 pb-2"><span>⏰</span> Meal Schedule</h3>
                  <table className="w-full text-xs">
                      <thead className="bg-blue-50 text-blue-900 font-bold"><tr><th className="p-1 text-left">Meal</th><th className="p-1 text-center">Time</th><th className="p-1 text-center">Kcal</th><th className="p-1 text-center">Macros</th></tr></thead>
                      <tbody className="divide-y divide-blue-50">
                          {daySummaryRows.map(row => row.hasItems && (
                              <tr key={row.time} className="hover:bg-gray-50">
                                  <td className="p-1 font-medium text-gray-700">{row.time}</td>
                                  <td className="p-1 text-center text-gray-500">{row.meta.timeStart ? `${row.meta.timeStart}-${row.meta.timeEnd}` : '-'}</td>
                                  <td className="p-1 text-center font-bold text-gray-800">{row.stats.kcal.toFixed(0)}</td>
                                  <td className="p-1 text-center text-[9px] text-gray-500"><span className="text-blue-500">C:{row.stats.cho.toFixed(0)}</span> <span className="text-red-500">P:{row.stats.pro.toFixed(0)}</span> <span className="text-yellow-500">F:{row.stats.fat.toFixed(0)}</span></td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>

          {/* Center View: Daily Menu or Instructions */}
          <div className="xl:col-span-6 space-y-6 order-1 xl:order-2">
              {currentDay === 'instructions' ? (
                  <div className="bg-white rounded-2xl shadow-xl border border-blue-100 overflow-hidden animate-fade-in">
                      <div className="p-6 bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex justify-between items-center">
                          <div>
                              <h2 className="text-2xl font-bold">Plan Instructions</h2>
                              <p className="text-blue-100 text-xs mt-1">General advice and preparation rules for this meal plan.</p>
                          </div>
                          <button onClick={() => setShowInstructionsEditor(true)} className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-bold transition flex items-center gap-2">
                             <span>📝</span> Edit Instructions
                          </button>
                      </div>
                      <div className="p-8 prose max-w-none min-h-[400px]">
                          {weeklyPlan.instructions ? (
                            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 leading-relaxed text-gray-800" dangerouslySetInnerHTML={{ __html: weeklyPlan.instructions }} />
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400 py-20 italic">
                                <span className="text-5xl mb-4 opacity-20">📋</span>
                                <p>No instructions set. Click "Edit Instructions" to add some.</p>
                            </div>
                          )}
                      </div>
                  </div>
              ) : (
                  <div>
                      <div className="mb-4 text-center">
                        <h2 className="text-2xl font-bold">Daily Meal Plan - Day {currentDay}</h2>
                      </div>
                      {MEAL_TIMES.map((time) => {
                          const dayData: DayPlan = weeklyPlan[currentDay as number] || { items: {} as Record<string, PlannerItem[]>, meta: {} as Record<string, MealMeta> };
                          const items = dayData.items[time] || [];
                          const meta = dayData.meta[time] || { timeStart: '', timeEnd: '', notes: '' };
                          const isActive = activeMealTime === time;
                          const sectionStats = items.filter(i => i.selected).reduce((acc, i) => ({ kcal: acc.kcal + (Number(i.kcal) * Number(i.serves)), cho: acc.cho + (Number(i.cho) * Number(i.serves)), protein: acc.protein + (Number(i.protein) * Number(i.serves)), fat: acc.fat + (Number(i.fat) * Number(i.serves)) }), { kcal: 0, cho: 0, protein: 0, fat: 0 });
                          const uniqueGroups = Array.from(new Set(items.map(i => i.optionGroup)));
                          return (
                            <div key={time} className={`rounded-xl shadow-sm border overflow-hidden mb-6 transition-all ${isActive ? 'border-yellow-400 ring-2 ring-yellow-100' : 'border-gray-200'}`}>
                                <div className={`px-4 py-3 flex flex-col md:flex-row justify-between items-center cursor-pointer ${isActive ? 'bg-yellow-50' : 'bg-gray-50'}`} onClick={() => setActiveMealTime(time)}>
                                    <div className="flex items-center gap-3"><div className={`w-3 h-3 rounded-full ${isActive ? 'bg-yellow-500 animate-pulse' : 'bg-gray-300'}`}></div><h3 className={`font-bold text-lg flex items-center gap-2 ${isActive ? 'text-yellow-900' : 'text-gray-700'}`}>{MEAL_ICONS[time]} {time}</h3></div>
                                    <div className="flex items-center gap-3 mt-2 md:mt-0" onClick={e => e.stopPropagation()}>
                                        <div className="flex items-center gap-1 text-xs"><input type="time" value={meta.timeStart} onChange={e => updateMeta(time, 'timeStart', e.target.value)} className="p-1 border rounded w-20" /><span>-</span><input type="time" value={meta.timeEnd} onChange={e => updateMeta(time, 'timeEnd', e.target.value)} className="p-1 border rounded w-20" /></div>
                                        <div className="flex flex-col items-end text-xs font-bold text-gray-800">
                                          {sectionStats.kcal.toFixed(0)} kcal
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white p-4">
                                    <div className="space-y-4">
                                        {uniqueGroups.map(group => (
                                            <div key={group} className="rounded-lg border border-gray-100 p-2">
                                                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                                                  <span>{group === 'main' ? 'Main Option' : group}</span>
                                                  {/* v2.0.231: Macro summary for the group for easier comparison */}
                                                  <div className="flex gap-2 text-[9px] font-mono text-gray-400">
                                                    {(() => {
                                                        const groupStats = items.filter(i => i.optionGroup === group).reduce((acc, i) => ({ k: acc.k + (i.kcal*i.serves), c: acc.c + (i.cho*i.serves), p: acc.p + (i.protein*i.serves), f: acc.f + (i.fat*i.serves) }), { k:0, c:0, p:0, f:0 });
                                                        return `K:${groupStats.k.toFixed(0)} C:${groupStats.c.toFixed(1)} P:${groupStats.p.toFixed(1)} F:${groupStats.f.toFixed(1)}`;
                                                    })()}
                                                  </div>
                                                </div>
                                                <div className="divide-y divide-gray-100">
                                                    {items.filter(i => i.optionGroup === group).map((item) => {
                                                        const realIdx = items.indexOf(item);
                                                        return (
                                                            <div key={realIdx} className={`p-2 flex flex-col sm:flex-row items-center gap-3 ${!item.selected ? 'opacity-50' : ''}`}>
                                                                <input type="checkbox" checked={item.selected} onChange={(e) => updateItem(time, realIdx, 'selected', e.target.checked)} className="no-print" />
                                                                <div className="flex-grow text-left w-full sm:w-auto">
                                                                    <div className="font-bold text-gray-800 text-sm flex items-center gap-2">
                                                                      {item.customDisplayName ? (<div dangerouslySetInnerHTML={{ __html: item.customDisplayName }} />) : (renderHighlightedText(item.name))}
                                                                      <button onClick={() => openEditor(time, realIdx, item)} className="text-gray-300 hover:text-blue-500 no-print transition">✎</button>
                                                                    </div>
                                                                    <div className="text-[10px] text-gray-400 flex items-center gap-3">
                                                                        <span className="bg-gray-100 px-1 rounded">{item.group}</span>
                                                                        <div className="flex gap-1.5 border-l border-gray-200 pl-2">
                                                                          <span className="text-blue-600 font-bold">C:{(item.cho*item.serves).toFixed(1)}</span>
                                                                          <span className="text-red-600 font-bold">P:{(item.protein*item.serves).toFixed(1)}</span>
                                                                          <span className="text-yellow-600 font-bold">F:{(item.fat*item.serves).toFixed(1)}</span>
                                                                        </div>
                                                                        <select value={item.optionGroup} onChange={(e) => updateItem(time, realIdx, 'optionGroup', e.target.value)} className="bg-transparent text-[9px] outline-none no-print ml-auto font-bold text-gray-500">{ALT_OPTIONS.map(opt => (<option key={opt} value={opt}>{opt === 'main' ? 'Set as Main' : opt}</option>))}</select>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-1"><input type="number" step="0.25" value={item.serves} onChange={(e) => updateItem(time, realIdx, 'serves', Number(e.target.value))} className="w-12 p-1 border rounded text-center text-sm font-bold" /><span className="text-[10px] text-gray-500">sv</span></div>
                                                                <div className="text-right w-16 font-mono font-bold text-gray-700 text-xs">{(Number(item.kcal) * Number(item.serves)).toFixed(0)}</div>
                                                                <button onClick={() => removeFromPlan(time, realIdx)} className="text-red-300 hover:text-red-600 text-lg no-print">×</button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-gray-100"><textarea placeholder="Notes for this meal..." value={meta.notes} onChange={e => updateMeta(time, 'notes', e.target.value)} className="w-full p-2 text-xs border rounded bg-gray-50 h-16 resize-none" /></div>
                                </div>
                            </div>
                          );
                      })}
                  </div>
              )}
          </div>

          <div className="xl:col-span-3 space-y-6 order-3 xl:order-3">
              <div className="bg-white rounded-xl shadow-lg border-t-4 border-t-blue-600 p-6 sticky top-40">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><span>📊</span> Day Summary</h3>
                  <div className="mb-6"><label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Target Calories</label><div className="relative flex items-center gap-2"><input type="number" className="w-full p-2 border-2 border-blue-200 rounded-lg text-center font-bold text-xl text-blue-800 focus:ring-1 focus:ring-blue-400 outline-none" value={targetKcal} onChange={(e) => setTargetKcal(parseFloat(e.target.value))} /><button onClick={fetchTargetKcal} className="bg-blue-100 text-blue-700 p-2 rounded-lg hover:bg-blue-200 transition" title="Refresh Target">🔄</button></div></div>
                  <div className="mb-6"><MacroDonut cho={summary.totalCHO} pro={summary.totalProtein} fat={summary.totalFat} totalKcal={summary.totalKcal} /></div>
                  
                  <div className="space-y-4">
                    <div>
                        <ProgressBar current={summary.totalKcal} target={targetKcal} label="Total Calories (All selected)" unit="kcal" color="bg-blue-500" />
                        <div className="text-[10px] text-gray-400 mt-1 italic text-center">Includes all selected alternatives</div>
                    </div>

                    <div className="pt-2 border-t border-gray-50">
                        <ProgressBar current={summary.mainOnlyKcal} target={targetKcal} label="Planned Kcal (Main Only)" unit="kcal" color="bg-green-600" />
                        <div className="text-[10px] text-green-600 mt-1 font-bold text-center">Reflects final menu plan calories</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center mt-6">
                     <div className="p-2 bg-blue-50 rounded"><div className="text-xs text-gray-500">CHO</div><div className="font-bold text-blue-700">{summary.totalCHO.toFixed(0)}g</div></div>
                     <div className="p-2 bg-red-50 rounded"><div className="text-xs text-gray-500">PRO</div><div className="font-bold text-red-700">{summary.totalProtein.toFixed(0)}g</div></div>
                     <div className="p-2 bg-yellow-50 rounded"><div className="text-xs text-gray-500">FAT</div><div className="font-bold text-yellow-700">{summary.totalFat.toFixed(0)}g</div></div>
                  </div>
              </div>
          </div>
      </div>

      {showLoadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm no-print">
            <div className="bg-white p-6 rounded-xl w-full max-w-lg shadow-2xl h-[80vh] flex flex-col">
                <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold">Load Plan</h3><button onClick={() => setShowLoadModal(false)} className="text-gray-400">✕</button></div>
                <div className="mb-4"><input type="text" placeholder="Search..." value={loadSearchQuery} onChange={(e) => setLoadSearchQuery(e.target.value)} className="w-full p-3 border rounded-lg" /></div>
                <div className="flex-grow overflow-y-auto space-y-2 pr-2">
                    {isLoadingPlans ? (<div className="text-center py-10">Loading...</div>) : filteredSavedPlans.length === 0 ? (<div className="text-center py-10">No plans found.</div>) : (filteredSavedPlans.map(plan => (<div key={plan.id} className="flex justify-between items-center p-3 bg-gray-50 hover:bg-blue-50 rounded-lg border border-gray-100 group"><div><div className="font-bold text-gray-800">{plan.name}</div><div className="text-xs text-gray-500">{new Date(plan.created_at).toLocaleDateString()}</div></div><div className="flex gap-2 opacity-0 group-hover:opacity-100 transition"><button onClick={() => loadPlan(plan)} className="px-3 py-1 bg-blue-500 text-white text-xs rounded">Load</button><button onClick={() => deletePlan(plan.id)} className="px-3 py-1 bg-red-100 text-red-600 text-xs rounded">Del</button></div></div>)))}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default MealCreator;
