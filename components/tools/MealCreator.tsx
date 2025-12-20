
import React, { useState, useMemo, useEffect, useRef } from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import { mealCreatorDatabase, FoodItem } from "../../data/mealCreatorData";
import { MacroDonut, ProgressBar } from "../Visuals";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { SavedMeal, Client, ClientVisit } from "../../types";
import Toast from "../Toast";
import { FoodExchangeRow } from "../../data/exchangeData";

// v2.0.232: Enhanced types to include dayName
export interface DayPlan {
    items: Record<string, PlannerItem[]>;
    meta: Record<string, MealMeta>;
    dayName?: string; // v2.0.232: Custom label for the day
}

export interface WeeklyPlan {
    [day: number]: DayPlan;
    instructions?: string;
}

interface PlannerItem extends FoodItem {
    selected: boolean;
    optionGroup: string; 
    customDisplayName?: string; 
}

interface MealMeta {
    timeStart: string;
    timeEnd: string;
    notes: string;
}

// Fixed: Added missing TargetKcalInput component definition
interface TargetKcalInputProps {
  value: number;
  onChange: (val: number) => void;
  label: string;
}

const TargetKcalInput: React.FC<TargetKcalInputProps> = ({ value, onChange, label }) => (
    <div className="mb-6">
        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">{label}</label>
        <div className="relative">
            <input 
                type="number" 
                className="w-full p-2 border-2 border-[var(--color-primary)] rounded-lg text-center font-bold text-xl text-[var(--color-primary-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-light)] bg-white"
                placeholder="0"
                value={value || ''} 
                onChange={(e) => onChange(parseFloat(e.target.value))}
                dir="ltr"
            />
            <span className="absolute right-3 top-3 text-gray-400 text-xs font-medium">Kcal</span>
        </div>
    </div>
);

interface MealCreatorProps {
    initialLoadId?: string | null;
    autoOpenLoad?: boolean;
    autoOpenNew?: boolean;
    activeVisit?: { client: Client, visit: ClientVisit } | null;
    onNavigate?: (toolId: string, loadId?: string, action?: 'load' | 'new', preserveContext?: boolean) => void;
    isEmbedded?: boolean;
    externalTargetKcal?: number;
    plannedExchanges?: Record<string, number>;
    externalWeeklyPlan?: WeeklyPlan;
    onWeeklyPlanChange?: React.Dispatch<React.SetStateAction<WeeklyPlan>>;
}

const MEAL_TIMES: MealTime[] = ['Pre-Breakfast', 'Breakfast', 'Morning Snack', 'Lunch', 'Afternoon Snack', 'Dinner', 'Late Snack'];
type MealTime = 'Pre-Breakfast' | 'Breakfast' | 'Morning Snack' | 'Lunch' | 'Afternoon Snack' | 'Dinner' | 'Late Snack';

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

const ALT_OPTIONS = ['main', ...Array.from({length: 10}, (_, i) => `Alt ${i+1}`)];
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
    1: { items: MEAL_TIMES.reduce((acc, time) => ({ ...acc, [time]: [] }), {}), meta: {}, dayName: '' },
    instructions: "<h3>General Instructions</h3><p>• Drink at least 2 liters of water daily.<br>• Avoid added sugars and processed foods.<br>• Prefer grilled or steamed preparations.</p>"
};

// --- RICH TEXT EDITOR MODAL ---
const RichTextEditorModal: React.FC<{
    initialHtml: string;
    onSave: (html: string) => void;
    onClose: () => void;
    title?: string;
}> = ({ initialHtml, onSave, onClose, title = "Edit Content" }) => {
    const editorRef = useRef<HTMLDivElement>(null);
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
                <div className="p-2 border-b flex gap-1 flex-wrap bg-gray-50">
                    <button onClick={() => execCmd('bold')} className="p-1.5 min-w-[30px] rounded hover:bg-gray-200 font-bold border border-gray-300">B</button>
                    <button onClick={() => execCmd('italic')} className="p-1.5 min-w-[30px] rounded hover:bg-gray-200 italic border border-gray-300">I</button>
                    <button onClick={() => execCmd('underline')} className="p-1.5 min-w-[30px] rounded hover:bg-gray-200 underline border border-gray-300">U</button>
                    <div className="w-px h-6 bg-gray-300 mx-1"></div>
                    <button onClick={() => execCmd('insertUnorderedList')} className="p-1.5 min-w-[30px] rounded hover:bg-gray-200 border border-gray-300">•</button>
                    <div className="w-px h-6 bg-gray-300 mx-1"></div>
                    <button onClick={() => execCmd('foreColor', '#000000')} className="w-6 h-6 rounded-full bg-black border border-gray-300 hover:scale-110 transition"></button>
                    <button onClick={() => execCmd('foreColor', '#dc2626')} className="w-6 h-6 rounded-full bg-red-600 border border-gray-300 hover:scale-110 transition"></button>
                    <button onClick={() => execCmd('foreColor', '#2563eb')} className="w-6 h-6 rounded-full bg-blue-600 border border-gray-300 hover:scale-110 transition"></button>
                    <button onClick={() => execCmd('foreColor', '#16a34a')} className="w-6 h-6 rounded-full bg-green-600 border border-gray-300 hover:scale-110 transition"></button>
                </div>
                <div ref={editorRef} className="p-4 min-h-[200px] max-h-[400px] overflow-y-auto outline-none text-sm leading-relaxed bg-white" contentEditable suppressContentEditableWarning />
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
    const [bracketColor, setBracketColor] = useState('#dc2626');
    const [isBold, setIsBold] = useState(false);
    const [fontSize, setFontSize] = useState('14px');
    const [applyToAllDays, setApplyToAllDays] = useState(false);
    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm no-print">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in border border-gray-100">
                <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2"><span>🎨</span> Bulk Format Items</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>
                <div className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Highlight Color (Brackets & Slashes)</label>
                        <div className="flex gap-3">
                            {['#dc2626', '#2563eb', '#16a34a', '#d97706', '#9333ea', '#000000'].map(color => (
                                <button key={color} onClick={() => setBracketColor(color)} className={`w-8 h-8 rounded-full border-2 transition hover:scale-110 ${bracketColor === color ? 'border-gray-800 scale-110 shadow-md' : 'border-transparent'}`} style={{ backgroundColor: color }} />
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Text Style</label>
                            <label className="flex items-center gap-2 cursor-pointer bg-gray-50 p-2 rounded border border-gray-200 hover:bg-gray-100">
                                <input type="checkbox" checked={isBold} onChange={e => setIsBold(e.target.checked)} className="w-4 h-4 rounded text-blue-600" />
                                <span className="font-bold">Bold Text</span>
                            </label>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Font Size</label>
                            <select value={fontSize} onChange={e => setFontSize(e.target.value)} className="w-full p-2 border rounded bg-white text-sm outline-none">
                                <option value="12px">Small (12px)</option>
                                <option value="14px">Normal (14px)</option>
                                <option value="16px">Large (16px)</option>
                                <option value="18px">XL (18px)</option>
                            </select>
                        </div>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={applyToAllDays} onChange={e => setApplyToAllDays(e.target.checked)} className="w-4 h-4 rounded text-yellow-600" />
                            <span className="text-sm font-bold text-yellow-800">Apply to All Days in Plan</span>
                        </label>
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

// --- PRINT OPTIONS MODAL (v2.0.232 ENHANCED) ---
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
        showPlannedKcal: true, 
        includeAllAlternatives: false,
        showSummaryHeader: true // v2.0.232: Option to hide the whole table summary
    });

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[110] p-4 backdrop-blur-sm no-print">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in border border-blue-100">
                <div className="p-5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex justify-between items-center">
                    <h3 className="font-bold text-lg flex items-center gap-2"><span>🖨️</span> {isWeek ? 'Weekly' : 'Daily'} Print Options</h3>
                    <button onClick={onClose} className="text-white/70 hover:text-white transition">✕</button>
                </div>
                <div className="p-6 space-y-3 max-h-[70vh] overflow-y-auto">
                    <p className="text-sm text-gray-500 font-medium border-b border-gray-100 pb-2">Customize your printed report:</p>
                    
                    {/* v2.0.232: Show/Hide Whole Summary Table Header */}
                    <label className="flex items-center gap-3 p-2 rounded-xl border border-blue-100 bg-blue-50 hover:bg-white cursor-pointer transition">
                        <input type="checkbox" checked={options.showSummaryHeader} onChange={e => setOptions({...options, showSummaryHeader: e.target.checked})} className="w-5 h-5 rounded text-blue-600" />
                        <div>
                            <span className="block font-bold text-blue-800 text-xs">Show Macro/Kcal Summary Header</span>
                            <span className="text-[10px] text-blue-600">The whole grey box with totals</span>
                        </div>
                    </label>

                    <label className="flex items-center gap-3 p-2 rounded-xl border border-gray-100 bg-gray-50 hover:bg-white cursor-pointer transition">
                        <input type="checkbox" checked={options.showPlannedKcal} onChange={e => setOptions({...options, showPlannedKcal: e.target.checked})} className="w-5 h-5 rounded text-blue-600" />
                        <div>
                            <span className="block font-bold text-gray-800 text-xs">Show Planned Kcal in Header</span>
                            <span className="text-[10px] text-gray-500">Calculates Main meals only</span>
                        </div>
                    </label>

                    <label className="flex items-center gap-3 p-2 rounded-xl border border-gray-100 bg-gray-50 hover:bg-white cursor-pointer transition">
                        <input type="checkbox" checked={options.includeAllAlternatives} onChange={e => setOptions({...options, includeAllAlternatives: e.target.checked})} className="w-5 h-5 rounded text-blue-600" />
                        <div>
                            <span className="block font-bold text-gray-800 text-xs">Print All Alternatives in List</span>
                            <span className="text-[10px] text-gray-500">Include alts even if unselected in UI</span>
                        </div>
                    </label>

                    <label className="flex items-center gap-3 p-2 rounded-xl border border-gray-100 bg-gray-50 hover:bg-white cursor-pointer transition">
                        <input type="checkbox" checked={options.showServes} onChange={e => setOptions({...options, showServes: e.target.checked})} className="w-5 h-5 rounded text-blue-600" />
                        <div><span className="block font-bold text-gray-800 text-xs">Serves Amount</span></div>
                    </label>

                    <label className="flex items-center gap-3 p-2 rounded-xl border border-gray-100 bg-gray-50 hover:bg-white cursor-pointer transition">
                        <input type="checkbox" checked={options.showKcal} onChange={e => setOptions({...options, showKcal: e.target.checked})} className="w-5 h-5 rounded text-blue-600" />
                        <div><span className="block font-bold text-gray-800 text-xs">Item Calories</span></div>
                    </label>

                    <label className="flex items-center gap-3 p-2 rounded-xl border border-blue-50 bg-blue-50/30 hover:bg-white cursor-pointer transition">
                        <input type="checkbox" checked={options.showNutritionTable} onChange={e => setOptions({...options, showNutritionTable: e.target.checked})} className="w-5 h-5 rounded text-blue-600" />
                        <div><span className="block font-bold text-blue-900 text-xs">Detailed Macro Breakdown</span></div>
                    </label>

                    {options.showNutritionTable && (
                        <label className="flex items-center gap-3 ml-6 p-2 rounded-lg bg-gray-50 hover:bg-white cursor-pointer transition border border-dashed border-gray-200">
                            <input type="checkbox" checked={options.showAlternativesInTable} onChange={e => setOptions({...options, showAlternativesInTable: e.target.checked})} className="w-4 h-4 rounded text-blue-600" />
                            <div><span className="block font-medium text-[10px] text-gray-700">Include Alternatives in Breakdown</span></div>
                        </label>
                    )}
                </div>
                <div className="p-4 bg-gray-50 border-t flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-200 rounded-xl transition">Cancel</button>
                    <button onClick={() => onConfirm(options)} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition">Prepare Print</button>
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
    showPlannedKcal: boolean;
    includeAllAlternatives: boolean;
    showSummaryHeader: boolean; // v2.0.232
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

  const [currentDay, setCurrentDay] = useState<number | 'instructions'>(1); 
  const [localWeeklyPlan, setLocalWeeklyPlan] = useState<WeeklyPlan>(DEFAULT_WEEKLY_PLAN);

  const weeklyPlan = (isEmbedded && externalWeeklyPlan) ? externalWeeklyPlan : localWeeklyPlan;
  const setWeeklyPlan = (isEmbedded && onWeeklyPlanChange) ? onWeeklyPlanChange : setLocalWeeklyPlan;
  
  const [searchQuery, setSearchQuery] = useState("");
  const [targetKcal, setTargetKcal] = useState<number>(2000);
  
  const [activeMealTime, setActiveMealTime] = useState<MealTime>('Lunch'); 

  const [editingItem, setEditingItem] = useState<{ day: number, meal: string, index: number, initialHtml: string } | null>(null);
  const [showBulkFormatModal, setShowBulkFormatModal] = useState(false);
  const [showInstructionsEditor, setShowInstructionsEditor] = useState(false); 

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
      includeAllAlternatives: false,
      showSummaryHeader: true
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
                  .order('food', { ascending: true });
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
                  meta: {},
                  dayName: ''
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
      }
  };

  const addToPlan = (food: FoodItem) => {
      if (typeof currentDay !== 'number') return;
      setWeeklyPlan(prev => {
          const dayData = prev[currentDay] || { items: {}, meta: {}, dayName: '' };
          const currentList = dayData.items[activeMealTime] || [];
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

  const setDayName = (val: string) => {
      if (typeof currentDay !== 'number') return;
      setWeeklyPlan(prev => ({
          ...prev,
          [currentDay]: { ...prev[currentDay], dayName: val }
      }));
  };

  const handleSelectAllDay = (mode: 'all' | 'none' | 'main-only') => {
    if (typeof currentDay !== 'number') return;
    setWeeklyPlan(prev => {
        const newPlan = { ...prev };
        const dayItems = { ...newPlan[currentDay].items };
        Object.keys(dayItems).forEach(mealTime => {
            dayItems[mealTime] = dayItems[mealTime].map(item => ({
                ...item,
                selected: mode === 'none' ? false : mode === 'all' ? true : item.optionGroup === 'main'
            }));
        });
        newPlan[currentDay] = { ...newPlan[currentDay], items: dayItems };
        return newPlan;
    });
  };

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
                              if (REGEX_HIGHLIGHT.test(part)) html += `<span style="color: ${options.bracketColor}; font-weight: bold;">${part}</span>`;
                              else html += part;
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
  };

  const summary = useMemo(() => {
    let totalKcal = 0, mainOnlyKcal = 0, totalCHO = 0, totalProtein = 0, totalFat = 0;
    const usedExchanges: Record<string, number> = {};
    const dayData = weeklyPlan[currentDay as number];
    if (!dayData || typeof currentDay !== 'number') return { totalCHO: 0, totalProtein: 0, totalFat: 0, totalKcal: 0, mainOnlyKcal: 0, usedExchanges };
    Object.values(dayData.items).forEach((mealList: any) => {
        if (Array.isArray(mealList)) {
            mealList.forEach((item: PlannerItem) => {
                if (item.selected) { 
                    const s = Number(item.serves);
                    const k = Number(item.kcal) * s;
                    totalCHO += Number(item.cho) * s;
                    totalProtein += Number(item.protein) * s;
                    totalFat += Number(item.fat) * s;
                    totalKcal += k;
                    if (item.optionGroup === 'main') mainOnlyKcal += k;
                    let key = GROUP_MAPPING[item.group] || item.group;
                    if (item.group && typeof item.group === 'string' && item.group.includes("Fat")) key = 'fats';
                    usedExchanges[key] = (usedExchanges[key] || 0) + s;
                }
            });
        }
    });
    return { totalCHO, totalProtein, totalFat, totalKcal, mainOnlyKcal, usedExchanges };
  }, [weeklyPlan, currentDay]);

  const exchangeComparison = useMemo(() => {
      let planned: Record<string, number> = {};
      if (plannedExchanges && Object.keys(plannedExchanges).length > 0) planned = plannedExchanges;
      else if (activeVisit?.visit.meal_plan_data?.servings) planned = activeVisit.visit.meal_plan_data.servings;
      const used = summary.usedExchanges;
      const groups = [
          { key: 'starch', label: 'Starch' }, { key: 'fruit', label: 'Fruits' }, { key: 'veg', label: 'Vegetables' },
          { key: 'meatLean', label: 'Lean Meat' }, { key: 'meatMed', label: 'Med Meat' }, { key: 'meatHigh', label: 'High Meat' },
          { key: 'milkSkim', label: 'Skim Milk' }, { key: 'milkLow', label: 'Low Milk' }, { key: 'milkWhole', label: 'Full Milk' },
          { key: 'legumes', label: 'Legumes' }, { key: 'sugar', label: 'Sugar' }, { key: 'fats', label: 'Fats' },
      ];
      return groups.map(g => {
          let planVal = planned[g.key] || 0;
          if (g.key === 'fats' && planVal === 0) planVal = (planned['fatsPufa'] || 0) + (planned['fatsMufa'] || 0) + (planned['fatsSat'] || 0);
          return { ...g, plan: planVal, used: used[g.key] || 0, icon: GROUP_ICONS[g.key] || '🍽️' };
      }).filter(g => g.plan > 0 || g.used > 0);
  }, [activeVisit, summary.usedExchanges, plannedExchanges]);

  const fetchPlans = async () => {
    if (!session) return;
    setIsLoadingPlans(true);
    try {
        const { data, error } = await supabase.from('saved_meals').select('*').eq('tool_type', 'day-planner').eq('user_id', session.user.id).order('created_at', { ascending: false });
        if (data) setSavedPlans(data);
    } catch (err) { setStatusMsg("Error loading plans."); }
    finally { setIsLoadingPlans(false); }
  };

  const loadPlan = (plan: SavedMeal) => {
    if (!plan.data) return;
    if (plan.data.weeklyPlan) setWeeklyPlan(plan.data.weeklyPlan);
    if (plan.data.targetKcal) setTargetKcal(plan.data.targetKcal);
    setPlanName(plan.name); setLoadedPlanId(plan.id); setLastSavedName(plan.name); setShowLoadModal(false);
  };

  const saveAsTemplate = async () => {
      let nameToSave = planName;
      if (!nameToSave) {
          const input = prompt("Enter a name for this Meal Plan Template:", lastSavedName || "");
          if (!input) return;
          nameToSave = input; setPlanName(input);
      }
      if (!session) return;
      const planData = { weeklyPlan, targetKcal };
      const isUpdate = loadedPlanId && (nameToSave === lastSavedName);
      try {
          if (isUpdate) await supabase.from('saved_meals').update({ name: nameToSave, data: planData }).eq('id', loadedPlanId).eq('user_id', session.user.id);
          else {
              const { data } = await supabase.from('saved_meals').insert({ user_id: session.user.id, name: nameToSave, tool_type: 'day-planner', data: planData, created_at: new Date().toISOString() }).select().single();
              if (data) { setLoadedPlanId(data.id); setLastSavedName(data.name); }
          }
          setStatusMsg("Template Saved!");
          fetchPlans();
      } catch (err: any) { setStatusMsg("Error: " + err.message); }
  };

  const confirmPrint = (options: PrintOptions) => {
      setPrintOptions(options);
      setShowPrintModal(false);
      setTimeout(() => { window.print(); }, 300);
  };

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
      {editingItem && <RichTextEditorModal initialHtml={editingItem.initialHtml} onSave={(html) => { updateItem(editingItem.meal, editingItem.index, 'customDisplayName', html); setEditingItem(null); }} onClose={() => setEditingItem(null)} />}
      {showBulkFormatModal && <BulkFormatModal onApply={handleBulkFormat} onClose={() => setShowBulkFormatModal(false)} />}
      {showInstructionsEditor && <RichTextEditorModal title="Global Instructions" initialHtml={weeklyPlan.instructions || ''} onSave={(html) => { setWeeklyPlan(prev => ({ ...prev, instructions: html })); setShowInstructionsEditor(false); }} onClose={() => setShowInstructionsEditor(false)} />}
      {showPrintModal && <PrintOptionsModal isWeek={printWeekMode} onClose={() => setShowPrintModal(false)} onConfirm={confirmPrint} />}

      <div className={`sticky top-12 z-40 bg-[var(--color-bg)] pt-2 pb-4 -mx-4 px-4 no-print shadow-sm border-b border-gray-100/50 ${isEmbedded ? 'top-0' : 'top-12'}`}>
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 flex flex-col xl:flex-row justify-between items-center gap-6">
              <div className="text-center xl:text-left">
                  <h1 className="text-3xl font-bold text-[var(--color-heading)] bg-clip-text text-transparent bg-gradient-to-r from-[var(--color-primary-dark)] to-[var(--color-primary)]">Day Food Planner</h1>
                  <p className="text-sm text-gray-500 mt-1">
                    {typeof currentDay === 'number' ? `Search foods to add for Day ${currentDay}.` : 'Edit global instructions.'}
                  </p>
              </div>
              <div className="relative w-full max-w-xl">
                  {typeof currentDay === 'number' && (
                      <>
                        <input type="text" className="w-full px-6 py-3 rounded-full border-2 border-[var(--color-primary)] focus:outline-none shadow-sm text-lg" placeholder={`Add to: ${MEAL_ICONS[activeMealTime]} ${activeMealTime}`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                        {searchQuery && filteredFoods.length > 0 && (
                            <ul className="absolute w-full bg-white mt-2 rounded-xl shadow-2xl max-h-80 overflow-y-auto z-50 border border-gray-100 text-left">
                            {filteredFoods.map((food, idx) => (
                                <li key={idx} className="px-4 py-3 hover:bg-green-50 border-b border-gray-50 last:border-0 cursor-pointer flex justify-between items-center group" onClick={() => addToPlan(food)}>
                                <div><div className="font-medium text-[var(--color-text)]">{renderHighlightedText(food.name)}</div><div className="text-xs text-gray-500">{food.kcal.toFixed(0)} kcal</div></div>
                                <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded font-bold group-hover:bg-green-200">+ Add</div>
                                </li>
                            ))}
                            </ul>
                        )}
                      </>
                  )}
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-center">
                    <button onClick={() => setShowBulkFormatModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white w-10 h-10 rounded-lg flex items-center justify-center shadow-sm" title="Bulk Format"><span className="text-xl">🎨</span></button>
                    <button onClick={() => { setPrintWeekMode(false); setShowPrintModal(true); }} className="bg-gray-700 hover:bg-gray-800 text-white w-10 h-10 rounded-lg flex items-center justify-center shadow-sm" title="Print Day"><span className="text-xl">🖨️</span></button>
                    <button onClick={() => { setPrintWeekMode(true); setShowPrintModal(true); }} className="bg-gray-700 hover:bg-gray-800 text-white w-10 h-10 rounded-lg flex items-center justify-center shadow-sm" title="Print Week"><span className="text-xl font-bold text-xs">WK</span></button>
              </div>
          </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 no-print items-center">
          {[1, 2, 3, 4, 5, 6, 7].map(day => (
            <button key={day} onClick={() => setCurrentDay(day)} className={`px-6 py-2 rounded-t-lg font-bold text-sm transition-all border-b-2 whitespace-nowrap ${currentDay === day ? 'bg-white text-blue-600 border-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                Day {day}
            </button>
          ))}
          <button onClick={() => setCurrentDay('instructions')} className={`px-6 py-2 rounded-t-lg font-bold text-sm transition-all border-b-2 whitespace-nowrap ${currentDay === 'instructions' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600'}`}>
            📋 Instructions
          </button>
      </div>

      {/* SINGLE DAY PRINT (v2.0.232) */}
      <div className={`hidden print:block font-sans text-sm p-4 w-full h-full bg-white relative ${printWeekMode ? 'hidden print:hidden' : ''}`}>
          <div className="border-b-2 border-gray-800 pb-4 mb-6 flex justify-between items-start">
              <div><h1 className="text-2xl font-bold uppercase text-gray-900">{printSettings.clinicName}</h1><p className="text-sm text-gray-600 mt-1">{printSettings.doctorName}</p></div>
              <div className="text-right">
                <h2 className="text-xl font-bold text-[var(--color-primary-dark)]">Daily Meal Plan</h2>
                <div className="text-sm mt-1">
                  {printSettings.patientName && <div>Patient: <strong>{printSettings.patientName}</strong></div>}
                  <div>Date: <strong>{new Date(printSettings.printDate).toLocaleDateString('en-GB')}</strong></div>
                  <div>Day: <strong>{currentDay} {weeklyPlan[currentDay as number]?.dayName ? `(${weeklyPlan[currentDay as number]?.dayName})` : ''}</strong></div>
                </div>
              </div>
          </div>
          
          {/* Summary Table (Show/Hide logic v2.0.232) */}
          {printOptions.showSummaryHeader && (
              <div className="mb-6 grid grid-cols-5 gap-4 border border-gray-300 rounded-lg p-3 bg-gray-50 text-center print-color-exact">
                  <div><span className="block text-[10px] uppercase text-gray-500 font-bold">Target Kcal</span><span className="font-bold text-lg">{targetKcal.toFixed(0)}</span></div>
                  {printOptions.showPlannedKcal && (
                    <div><span className="block text-[10px] uppercase text-gray-500 font-bold">Planned Kcal</span><span className="font-bold text-lg text-blue-700">{summary.mainOnlyKcal.toFixed(0)}</span></div>
                  )}
                  <div className="border-l border-gray-300"><span className="block text-[10px] uppercase text-blue-500 font-bold">Carbs</span><span className="font-bold">{summary.totalCHO.toFixed(0)}g</span></div>
                  <div><span className="block text-[10px] uppercase text-red-500 font-bold">Protein</span><span className="font-bold">{summary.totalProtein.toFixed(0)}g</span></div>
                  <div><span className="block text-[10px] uppercase text-yellow-600 font-bold">Fat</span><span className="font-bold">{summary.totalFat.toFixed(0)}g</span></div>
              </div>
          )}

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
                      const dayData = weeklyPlan[currentDay as number] || { items: {} };
                      const items = dayData.items[time]?.filter(i => (printOptions.includeAllAlternatives || i.selected) && i.optionGroup === 'main') || [];
                      const meta = dayData.meta[time];
                      if (items.length === 0 && !meta?.notes) return null;
                      const allAlts = dayData.items[time]?.filter(i => (printOptions.includeAllAlternatives || i.selected) && i.optionGroup !== 'main') || [];
                      const altGroups = Array.from(new Set(allAlts.map(i => i.optionGroup)));
                      return (
                          <React.Fragment key={time}>
                              <tr className={`${MEAL_COLORS[time]?.split(' ')[0] || 'bg-gray-50'} print-color-exact`}><td className="p-2 border border-gray-300 font-bold text-gray-900" rowSpan={items.length + (altGroups.length > 0 ? 1 : 0) + 1}>{MEAL_ICONS[time]} {time}</td></tr>
                              {items.map((item, idx) => (
                                  <tr key={idx}>
                                      <td className="p-2 border border-gray-300">{item.customDisplayName ? <div dangerouslySetInnerHTML={{ __html: item.customDisplayName }} /> : item.name}</td>
                                      {printOptions.showServes && <td className="p-2 border border-gray-300 text-center">{item.serves} sv</td>}
                                      {printOptions.showKcal && <td className="p-2 border border-gray-300 text-center text-xs">{(item.kcal * item.serves).toFixed(0)}</td>}
                                      {idx === 0 && <td className="p-2 border border-gray-300 text-xs italic" rowSpan={items.length}>{meta?.notes}</td>}
                                  </tr>
                              ))}
                              {altGroups.length > 0 && (
                                <tr className="bg-yellow-50 print-color-exact font-medium"><td colSpan={1 + (printOptions.showServes?1:0) + (printOptions.showKcal?1:0)} className="p-2 border border-gray-300 text-xs"><strong>Alts:</strong> {altGroups.map(g => `${g}: ${dayData.items[time].filter(i=>i.optionGroup===g && (printOptions.includeAllAlternatives||i.selected)).map(i=>i.name).join(', ')}`).join(' | ')}</td></tr>
                              )}
                          </React.Fragment>
                      );
                  })}
              </tbody>
          </table>
          
          {/* Detailed Breakdown (Headings Green v2.0.232) */}
          {printOptions.showNutritionTable && (
              <div className="mb-6 break-inside-avoid">
                  <h3 className="font-bold text-green-800 text-sm mb-2 border-b-2 border-green-100 pb-1 uppercase">Breakdown Table</h3>
                  <table className="w-full border-collapse border border-green-200 text-xs text-center">
                      <thead className="bg-green-600 text-white print-color-exact">
                          <tr><th className="p-2 border border-green-300 text-left">Meal / Option</th><th className="p-2 border border-green-300">Calories</th><th className="p-2 border border-green-300">CHO</th><th className="p-2 border border-green-300">Prot</th><th className="p-2 border border-green-300">Fat</th></tr>
                      </thead>
                      <tbody>
                          {MEAL_TIMES.map(time => {
                              const dayData = weeklyPlan[currentDay as number] || { items: {} };
                              const items = dayData.items[time] || [];
                              if (items.length === 0) return null;
                              const mainItems = items.filter(i => i.optionGroup === 'main' && (printOptions.includeAllAlternatives || i.selected));
                              const mainStats = calculateNutrientsForItems(mainItems);
                              const altGroups = Array.from(new Set(items.map(i => i.optionGroup))).filter(g => g !== 'main');
                              return (
                                  <React.Fragment key={time}>
                                      <tr className="bg-gray-50 font-bold border-t border-gray-300 print-color-exact"><td className="p-1 border border-gray-300 text-left text-green-800" colSpan={5}>{time}</td></tr>
                                      <tr><td className="p-1 border border-gray-200 text-left pl-3">Main</td><td>{mainStats.kcal.toFixed(0)}</td><td>{mainStats.cho.toFixed(1)}</td><td>{mainStats.pro.toFixed(1)}</td><td>{mainStats.fat.toFixed(1)}</td></tr>
                                      {printOptions.showAlternativesInTable && altGroups.map(group => {
                                          const altStats = calculateNutrientsForItems(items.filter(i => i.optionGroup === group && (printOptions.includeAllAlternatives || i.selected)));
                                          return <tr key={group} className="text-gray-500 italic"><td className="p-1 border border-gray-100 text-left pl-6">↳ {group}</td><td>{altStats.kcal.toFixed(0)}</td><td>{altStats.cho.toFixed(1)}</td><td>{altStats.pro.toFixed(1)}</td><td>{altStats.fat.toFixed(1)}</td></tr>;
                                      })}
                                  </React.Fragment>
                              );
                          })}
                      </tbody>
                  </table>
              </div>
          )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 no-print">
          {/* v2.0.232: Grouped sidebar with scrolling fix */}
          <div className="xl:col-span-3 space-y-6 order-2 xl:order-1">
              <div className="sticky top-40 space-y-6">
                  <div className="bg-white rounded-xl shadow-lg border border-purple-100 p-4">
                      <h3 className="font-bold text-purple-800 mb-4 border-b pb-2"><span>📋</span> Exchange Control</h3>
                      <div className="space-y-3">
                          {exchangeComparison.map(ex => (
                              <div key={ex.key} className="space-y-1">
                                  <div className="flex justify-between text-xs font-medium text-gray-700"><span>{ex.icon} {ex.label}</span><span className="font-bold">{ex.used.toFixed(1)} / {ex.plan.toFixed(1)}</span></div>
                                  <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-purple-500" style={{ width: `${Math.min((ex.used/(ex.plan||1))*100,100)}%` }}></div></div>
                              </div>
                          ))}
                      </div>
                  </div>
                  {/* v2.0.232: Meal Schedule fixed below Exchange Control in the sticky container */}
                  <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-4">
                      <h3 className="font-bold text-blue-800 mb-2 border-b pb-2"><span>⏰</span> Meal Schedule</h3>
                      <table className="w-full text-xs">
                          <thead className="bg-blue-50"><tr><th className="p-1 text-left">Meal</th><th className="p-1 text-center">Kcal</th><th className="p-1 text-center">Macros</th></tr></thead>
                          <tbody>
                              {MEAL_TIMES.map(time => {
                                  const dayData = weeklyPlan[currentDay as number] || { items: {} };
                                  const items = dayData.items[time] || [];
                                  if (items.length === 0) return null;
                                  const stats = calculateNutrientsForItems(items.filter(i=>i.selected));
                                  return (
                                    <tr key={time} className="hover:bg-gray-50 border-b border-gray-50">
                                        <td className="p-1 font-medium">{time}</td>
                                        <td className="p-1 text-center font-bold">{stats.kcal.toFixed(0)}</td>
                                        <td className="p-1 text-center text-[9px]"><span className="text-blue-500">C:{stats.cho.toFixed(0)}</span> <span className="text-red-500">P:{stats.pro.toFixed(0)}</span></td>
                                    </tr>
                                  );
                              })}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>

          <div className="xl:col-span-6 space-y-6 order-1 xl:order-2">
              {currentDay === 'instructions' ? (
                  <div className="bg-white rounded-2xl shadow-xl border border-blue-100 overflow-hidden">
                      <div className="p-6 bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex justify-between items-center">
                          <div><h2 className="text-2xl font-bold">Plan Instructions</h2></div>
                          <button onClick={() => setShowInstructionsEditor(true)} className="bg-white/20 text-white px-4 py-2 rounded-lg font-bold">📝 Edit</button>
                      </div>
                      <div className="p-8 prose max-w-none min-h-[400px]" dangerouslySetInnerHTML={{ __html: weeklyPlan.instructions || '' }} />
                  </div>
              ) : (
                  <div>
                      <div className="mb-4 flex gap-4 items-center justify-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <h2 className="text-2xl font-bold whitespace-nowrap">Day {currentDay} Label:</h2>
                        <input 
                            type="text" 
                            className="flex-grow p-2 border-b-2 border-blue-500 outline-none font-bold text-blue-800 text-lg placeholder-gray-300"
                            placeholder="e.g. High Carb Day, Rest Day..."
                            value={weeklyPlan[currentDay as number]?.dayName || ''}
                            onChange={(e) => setDayName(e.target.value)}
                        />
                      </div>
                      {MEAL_TIMES.map((time) => {
                          const dayData = weeklyPlan[currentDay as number] || { items: {} };
                          const items = dayData.items[time] || [];
                          const meta = dayData.meta[time] || { timeStart: '', timeEnd: '', notes: '' };
                          const isActive = activeMealTime === time;
                          const sectionStats = calculateNutrientsForItems(items.filter(i=>i.selected));
                          const uniqueGroups = Array.from(new Set(items.map(i => i.optionGroup)));
                          return (
                            <div key={time} className={`rounded-xl shadow-sm border overflow-hidden mb-6 ${isActive ? 'border-yellow-400 ring-2 ring-yellow-100' : 'border-gray-200'}`}>
                                <div className={`px-4 py-3 flex justify-between items-center cursor-pointer ${isActive ? 'bg-yellow-50' : 'bg-gray-50'}`} onClick={() => setActiveMealTime(time)}>
                                    <div className="flex items-center gap-3"><h3 className="font-bold text-lg">{MEAL_ICONS[time]} {time}</h3></div>
                                    <div className="text-xs font-bold">{sectionStats.kcal.toFixed(0)} kcal</div>
                                </div>
                                <div className="bg-white p-4 space-y-4">
                                    {uniqueGroups.map(group => (
                                        <div key={group} className="rounded-lg border border-gray-100 p-2">
                                            <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 mb-2 uppercase"><span>{group === 'main' ? 'Main Option' : group}</span></div>
                                            {items.filter(i => i.optionGroup === group).map((item, idx) => {
                                                const realIdx = items.indexOf(item);
                                                return (
                                                    <div key={realIdx} className={`p-2 flex items-center gap-3 ${!item.selected ? 'opacity-50' : ''}`}>
                                                        <input type="checkbox" checked={item.selected} onChange={(e) => updateItem(time, realIdx, 'selected', e.target.checked)} />
                                                        <div className="flex-grow text-sm font-bold">{item.customDisplayName ? <div dangerouslySetInnerHTML={{ __html: item.customDisplayName }} /> : renderHighlightedText(item.name)}<button onClick={() => setEditingItem({ day: currentDay as number, meal: time, index: realIdx, initialHtml: item.customDisplayName || item.name })} className="ml-2 text-gray-300">✎</button></div>
                                                        <input type="number" step="0.25" value={item.serves} onChange={(e) => updateItem(time, realIdx, 'serves', Number(e.target.value))} className="w-12 p-1 border rounded text-center text-sm font-bold" />
                                                        <div className="text-right w-16 font-mono font-bold">{(item.kcal * item.serves).toFixed(0)}</div>
                                                        <button onClick={() => removeFromPlan(time, realIdx)} className="text-red-300 hover:text-red-600">×</button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ))}
                                    <textarea placeholder="Notes..." value={meta.notes} onChange={e => updateMeta(time, 'notes', e.target.value)} className="w-full p-2 text-xs border rounded bg-gray-50 h-16" />
                                </div>
                            </div>
                          );
                      })}
                  </div>
              )}
          </div>

          <div className="xl:col-span-3 space-y-6 order-3 xl:order-3">
              <div className="bg-white rounded-xl shadow-lg border-t-4 border-t-blue-600 p-6 sticky top-40">
                  <h3 className="font-bold text-gray-800 mb-4"><span>📊</span> Summary</h3>
                  <TargetKcalInput value={targetKcal} onChange={setTargetKcal} label="Target Calories" />
                  <MacroDonut cho={summary.totalCHO} pro={summary.totalProtein} fat={summary.totalFat} totalKcal={summary.totalKcal} />
                  <div className="mt-6 space-y-4">
                    <ProgressBar current={summary.totalKcal} target={targetKcal} label="Total Calories (All)" unit="kcal" color="bg-blue-500" />
                    <ProgressBar current={summary.mainOnlyKcal} target={targetKcal} label="Planned Kcal (Main Only)" unit="kcal" color="bg-green-600" />
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default MealCreator;
