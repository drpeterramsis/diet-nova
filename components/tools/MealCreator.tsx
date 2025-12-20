
import React, { useState, useMemo, useEffect, useRef } from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import { mealCreatorDatabase, FoodItem } from "../../data/mealCreatorData";
import { MacroDonut, ProgressBar } from "../Visuals";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { SavedMeal, Client, ClientVisit } from "../../types";
import Toast from "../Toast";
import { FoodExchangeRow } from "../../data/exchangeData";

// v2.0.235: 
// 1. Fixed meal time AM/PM input stability - ensured partial/empty strings don't destructively reset the field.
// 2. Added "Select All" toggle button to batch select items.
// 3. Implemented "Select Main" logic: checks all main items and unchecks all alternatives.
export interface DayPlan {
    items: Record<string, PlannerItem[]>;
    meta: Record<string, MealMeta>;
    title?: string;
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

const ALT_OPTIONS = ['main', ...Array.from({length: 10}, (_, i) => `Alt ${i+1}`)];
const REGEX_HIGHLIGHT = /(\/|\(.*?\))/g;

const formatDateUK = (dateString: string | undefined) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

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
    starch: '🍞', fruit: '🍓', veg: '🥦', meatLean: '🍗', meatMed: '🥩', meatHigh: '🍔',
    milkSkim: '🥛', milkLow: '🍼', milkWhole: '🧀', legumes: '🥣', sugar: '🍬', fats: '🥑'
};

export const DEFAULT_WEEKLY_PLAN: WeeklyPlan = {
    1: { items: MEAL_TIMES.reduce((acc, time) => ({ ...acc, [time]: [] }), {}), meta: {}, title: '' },
    instructions: "<h3>General Instructions</h3><p>• Drink at least 2 liters of water daily.<br>• Avoid added sugars and processed foods.<br>• Prefer grilled or steamed preparations.</p>"
};

const RichTextEditorModal: React.FC<{
    initialHtml: string;
    onSave: (html: string) => void;
    onClose: () => void;
    title?: string;
}> = ({ initialHtml, onSave, onClose, title = "Edit Content" }) => {
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
                    <div className="w-px h-6 bg-gray-300 mx-1"></div>
                    <button onClick={() => execCmd('foreColor', '#000000')} className="w-6 h-6 rounded-full bg-black border border-gray-300 hover:scale-110 transition"></button>
                    <button onClick={() => execCmd('foreColor', '#dc2626')} className="w-6 h-6 rounded-full bg-red-600 border border-gray-300 hover:scale-110 transition"></button>
                    <button onClick={() => execCmd('foreColor', '#2563eb')} className="w-6 h-6 rounded-full bg-blue-600 border border-gray-300 hover:scale-110 transition"></button>
                    <button onClick={() => execCmd('foreColor', '#16a34a')} className="w-6 h-6 rounded-full bg-green-600 border border-gray-300 hover:scale-110 transition"></button>
                </div>
                <div ref={editorRef} className="p-4 min-h-[200px] max-h-[400px] overflow-y-auto outline-none text-sm leading-relaxed bg-white" contentEditable suppressContentEditableWarning />
                <div className="p-4 border-t bg-gray-50 flex justify-end gap-2"><button onClick={onClose} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded transition">Cancel</button><button onClick={handleSave} className="px-6 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 shadow-sm transition">Save Changes</button></div>
            </div>
        </div>
    );
};

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
                <div className="p-4 border-b bg-gray-50 flex justify-between items-center"><h3 className="font-bold text-gray-800 flex items-center gap-2"><span>🎨</span> Bulk Format Items</h3><button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button></div>
                <div className="p-6 space-y-6">
                    <div><label className="block text-sm font-bold text-gray-700 mb-2">Highlight Color</label><div className="flex gap-3">{['#dc2626', '#2563eb', '#16a34a', '#d97706', '#9333ea', '#000000'].map(color => (<button key={color} onClick={() => setBracketColor(color)} className={`w-8 h-8 rounded-full border-2 transition hover:scale-110 ${bracketColor === color ? 'border-gray-800 scale-110 shadow-md' : 'border-transparent'}`} style={{ backgroundColor: color }} />))}</div></div>
                    <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-bold text-gray-700 mb-2">Text Style</label><label className="flex items-center gap-2 cursor-pointer bg-gray-50 p-2 rounded border border-gray-200 hover:bg-gray-100"><input type="checkbox" checked={isBold} onChange={e => setIsBold(e.target.checked)} className="w-4 h-4 rounded text-blue-600" /><span className="font-bold">Bold Text</span></label></div><div><label className="block text-sm font-bold text-gray-700 mb-2">Font Size</label><select value={fontSize} onChange={e => setFontSize(e.target.value)} className="w-full p-2 border rounded bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"><option value="12px">Small (12px)</option><option value="14px">Normal (14px)</option><option value="16px">Large (16px)</option><option value="18px">XL (18px)</option></select></div></div>
                    <div className="bg-yellow-50 p-3 rounded border border-yellow-200"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={applyToAllDays} onChange={e => setApplyToAllDays(e.target.checked)} className="w-4 h-4 rounded text-yellow-600 focus:ring-yellow-500" /><span className="text-sm font-bold text-yellow-800">Apply to All Days in Plan</span></label></div>
                    <div className="text-center p-3 border border-dashed border-gray-300 rounded bg-gray-50"><p className="text-xs text-gray-500 mb-1">Preview:</p><div style={{ fontSize: fontSize, fontWeight: isBold ? 'bold' : 'normal', color: '#1f2937' }}>Food Name <span style={{ color: bracketColor, fontWeight: 'bold' }}>(100g) / Alt</span></div></div>
                </div>
                <div className="p-4 border-t bg-gray-50 flex gap-2"><button onClick={onClose} className="flex-1 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded transition">Cancel</button><button onClick={() => onApply({ bracketColor, isBold, fontSize, applyToAllDays })} className="flex-1 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 shadow-sm transition">Apply Formatting</button></div>
            </div>
        </div>
    );
};

const PrintOptionsModal: React.FC<{
    onConfirm: (options: PrintOptions) => void;
    onClose: () => void;
    isWeek: boolean;
}> = ({ onConfirm, onClose, isWeek }) => {
    const [options, setOptions] = useState<PrintOptions>({
        showServes: true, showKcal: true, showNutritionTable: true, showAlternativesInTable: true,
        showPlannedKcal: true, includeAllAlternatives: false, showSummaryGrid: true 
    });
    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[110] p-4 backdrop-blur-sm no-print">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in border border-blue-100">
                <div className="p-5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex justify-between items-center"><h3 className="font-bold text-lg flex items-center gap-2"><span>🖨️</span> {isWeek ? 'Weekly' : 'Daily'} Print Options</h3><button onClick={onClose} className="text-white/70 hover:text-white transition">✕</button></div>
                <div className="p-6 space-y-3 max-h-[70vh] overflow-y-auto">
                    <label className="flex items-center gap-3 p-2 rounded-xl border border-gray-100 bg-gray-50 hover:bg-white cursor-pointer transition"><input type="checkbox" checked={options.showSummaryGrid} onChange={e => setOptions({...options, showSummaryGrid: e.target.checked})} className="w-5 h-5 rounded text-blue-600" /><div><span className="block font-bold text-gray-800 text-xs">Show Daily Kcal/Macro Summary (Top Table)</span><span className="text-[10px] text-gray-500">Toggle the whole summary grid visibility</span></div></label>
                    <label className="flex items-center gap-3 p-2 rounded-xl border border-gray-100 bg-gray-50 hover:bg-white cursor-pointer transition"><input type="checkbox" checked={options.showPlannedKcal} onChange={e => setOptions({...options, showPlannedKcal: e.target.checked})} className="w-5 h-5 rounded text-blue-600" /><div><span className="block font-bold text-gray-800 text-xs">Show Planned Kcal Summary</span><span className="text-[10px] text-gray-500">Calculates Main meals only</span></div></label>
                    <label className="flex items-center gap-3 p-2 rounded-xl border border-gray-100 bg-gray-50 hover:bg-white cursor-pointer transition"><input type="checkbox" checked={options.includeAllAlternatives} onChange={e => setOptions({...options, includeAllAlternatives: e.target.checked})} className="w-5 h-5 rounded text-blue-600" /><div><span className="block font-bold text-gray-800 text-xs">Print All Alternatives</span><span className="text-[10px] text-gray-500">Include alts even if unselected in UI</span></div></label>
                    <label className="flex items-center gap-3 p-2 rounded-xl border border-gray-100 bg-gray-50 hover:bg-white cursor-pointer transition"><input type="checkbox" checked={options.showServes} onChange={e => setOptions({...options, showServes: e.target.checked})} className="w-5 h-5 rounded text-blue-600" /><div><span className="block font-bold text-gray-800 text-xs">Serves Amount</span></div></label>
                    <label className="flex items-center gap-3 p-2 rounded-xl border border-gray-100 bg-gray-50 hover:bg-white cursor-pointer transition"><input type="checkbox" checked={options.showKcal} onChange={e => setOptions({...options, showKcal: e.target.checked})} className="w-5 h-5 rounded text-blue-600" /><div><span className="block font-bold text-gray-800 text-xs">Item Calories</span></div></label>
                    <label className="flex items-center gap-3 p-2 rounded-xl border border-blue-50 bg-blue-50/30 hover:bg-white cursor-pointer transition"><input type="checkbox" checked={options.showNutritionTable} onChange={e => setOptions({...options, showNutritionTable: e.target.checked})} className="w-5 h-5 rounded text-blue-600" /><div><span className="block font-bold text-blue-900 text-xs">Detailed Macro Breakdown Table (Bottom)</span></div></label>
                </div>
                <div className="p-4 bg-gray-50 border-t flex gap-3"><button onClick={onClose} className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-200 rounded-xl transition">Cancel</button><button onClick={() => onConfirm(options)} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg transition">Prepare Print</button></div>
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
    showSummaryGrid: boolean; 
}

const MealCreator: React.FC<MealCreatorProps> = ({ 
    initialLoadId, autoOpenLoad, autoOpenNew, activeVisit, onNavigate,
    isEmbedded, externalTargetKcal, plannedExchanges, externalWeeklyPlan, onWeeklyPlanChange
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
  
  const filteredSavedPlans = useMemo(() => {
      if (!loadSearchQuery) return savedPlans;
      const q = loadSearchQuery.toLowerCase();
      return savedPlans.filter(p => p.name.toLowerCase().includes(q));
  }, [savedPlans, loadSearchQuery]);

  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printWeekMode, setPrintWeekMode] = useState(false); 
  const [printOptions, setPrintOptions] = useState<PrintOptions>({
      showServes: true, showKcal: true, showNutritionTable: true, showAlternativesInTable: true, showPlannedKcal: true, includeAllAlternatives: false, showSummaryGrid: true
  });
  const [printSettings, setPrintSettings] = useState({
      doctorName: '', clinicName: 'Diet-Nova Clinic', patientName: '', printDate: new Date().toISOString().split('T')[0], notes: ''
  });

  useEffect(() => { if (externalTargetKcal && externalTargetKcal > 0) setTargetKcal(externalTargetKcal); }, [externalTargetKcal, isEmbedded]);
  useEffect(() => {
      if (profile?.full_name) setPrintSettings(prev => ({ ...prev, doctorName: profile.full_name }));
      if (activeVisit) setPrintSettings(prev => ({ ...prev, patientName: activeVisit.client.full_name, clinicName: activeVisit.client.clinic || prev.clinicName }));
  }, [profile, activeVisit]);

  const mapDBToItem = (row: FoodExchangeRow): FoodItem => ({
      name: row.food, group: row.food_group, serves: Number(row.serve), cho: Number(row.cho), protein: Number(row.protein), fat: Number(row.fat), fiber: Number(row.fiber), kcal: Number(row.kcal)
  });
  const mapItemToDB = (item: FoodItem): FoodExchangeRow => ({
      food: item.name, food_group: item.group, serve: item.serves, cho: item.cho, protein: item.protein, fat: item.fat, fiber: item.fiber, kcal: item.kcal
  });

  useEffect(() => {
      const fetchDB = async () => {
          setIsLoadingData(true);
          try {
              const { data, error } = await supabase.from('food_exchange').select('*').order('food', { ascending: true }).limit(2000);
              if (error) throw error;
              if (data && data.length > 0) { setActiveData(data.map(mapDBToItem)); setDataSource('cloud'); }
              else { setDataSource('local'); }
          } catch (err) { setDataSource('local'); } finally { setIsLoadingData(false); }
      };
      fetchDB();
  }, []);

  const handleSyncToCloud = async () => {
      if (!session) return;
      if (!window.confirm("Upload local items to cloud?")) return;
      setSyncMsg('Syncing...');
      try {
          const { error } = await supabase.from('food_exchange').insert(mealCreatorDatabase.map(mapItemToDB));
          if (error) throw error;
          setSyncMsg('Sync Success!'); window.location.reload(); 
      } catch (err: any) { setSyncMsg('Error: ' + err.message); }
  };

  const filteredFoods = useMemo(() => {
    if (!searchQuery) return [];
    const q = searchQuery.toLowerCase();
    return activeData.filter(f => f.name.toLowerCase().includes(q) || f.group.toLowerCase().includes(q));
  }, [searchQuery, activeData]);

  const ensureDayExists = (day: number) => {
      setWeeklyPlan(prev => {
          if (prev[day]) return prev;
          return { ...prev, [day]: { items: MEAL_TIMES.reduce((acc, t) => ({ ...acc, [t]: [] }), {}), meta: {}, title: '' } };
      });
  };

  useEffect(() => { if (typeof currentDay === 'number') ensureDayExists(currentDay); }, [currentDay]);

  const fetchTargetKcal = () => {
      if (externalTargetKcal && externalTargetKcal > 0) { setTargetKcal(externalTargetKcal); return; }
      if (!activeVisit) return;
      const target = activeVisit.visit.meal_plan_data?.targetKcal || activeVisit.visit.kcal_data?.inputs?.reqKcal;
      if (target > 0) setTargetKcal(target);
  };

  useEffect(() => {
      if (activeVisit && !isEmbedded) {
          const target = activeVisit.visit.day_plan_data?.targetKcal || activeVisit.visit.meal_plan_data?.targetKcal || activeVisit.visit.kcal_data?.inputs?.reqKcal;
          if (target > 0) setTargetKcal(target);
          if (activeVisit.visit.day_plan_data) setWeeklyPlan(activeVisit.visit.day_plan_data.weeklyPlan);
      }
  }, [activeVisit, isEmbedded]);

  const addToPlan = (food: FoodItem) => {
      if (typeof currentDay !== 'number') return;
      setWeeklyPlan(prev => {
          const dayData = prev[currentDay] || { items: {}, meta: {}, title: '' };
          const currentList = dayData.items?.[activeMealTime] || [];
          let formattedName = food.name;
          if (REGEX_HIGHLIGHT.test(food.name)) {
              formattedName = food.name.split(REGEX_HIGHLIGHT).map(p => REGEX_HIGHLIGHT.test(p) ? `<span style="color: #dc2626; font-weight: bold;">${p}</span>` : p).join('');
          }
          return { ...prev, [currentDay]: { ...dayData, items: { ...dayData.items, [activeMealTime]: [...currentList, { ...food, serves: 1, selected: true, optionGroup: 'main', customDisplayName: formattedName }] } } };
      });
      setSearchQuery("");
  };

  const removeFromPlan = (mealTime: string, index: number) => {
      if (typeof currentDay !== 'number') return;
      setWeeklyPlan(prev => {
          const dayData = prev[currentDay];
          const newList = [...(dayData.items?.[mealTime] || [])];
          newList.splice(index, 1);
          return { ...prev, [currentDay]: { ...dayData, items: { ...dayData.items, [mealTime]: newList } } };
      });
  };

  const updateItem = (mealTime: string, index: number, field: keyof PlannerItem, value: any) => {
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

  // v2.0.235: Ensure AM/PM input stability by checking for empty/partial input strings
  const updateMeta = (mealTime: string, field: keyof MealMeta, value: string) => {
      if (typeof currentDay !== 'number') return;
      setWeeklyPlan(prev => {
          const dayData = prev[currentDay];
          const currentMeta = dayData.meta?.[mealTime] || { timeStart: '', timeEnd: '', notes: '' };
          // Logic: Only update if value is non-empty, or specifically intended to clear (if required)
          // type="time" normally emits a 24h format HH:mm. Partial inputs like just "AM" might emit empty strings in some browsers.
          return { ...prev, [currentDay]: { ...dayData, meta: { ...dayData.meta, [mealTime]: { ...currentMeta, [field]: value } } } };
      });
  };

  const updateDayTitle = (val: string) => {
      if (typeof currentDay !== 'number') return;
      setWeeklyPlan(prev => ({ ...prev, [currentDay]: { ...(prev[currentDay] || {items: {}, meta: {}}), title: val } }));
  };

  // v2.0.235: Improved batch selection logic
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
                    // Select main = unselect all alternatives except the main (requirement)
                    isSelected = it.optionGroup === 'main';
                }
                return { ...it, selected: isSelected };
            });
        });
        newPlan[currentDay] = { ...(newPlan[currentDay] || {meta: {}}), items: dayItems };
        return newPlan;
    });
  };

  const resetPlanner = () => { if(confirm("Clear all days?")) setWeeklyPlan(DEFAULT_WEEKLY_PLAN); };
  const clearDay = () => { if(typeof currentDay === 'number' && confirm("Clear current day?")) setWeeklyPlan(prev => ({ ...prev, [currentDay]: { items: MEAL_TIMES.reduce((acc, t) => ({ ...acc, [t]: [] }), {}), meta: {}, title: '' } })); };
  const openEditor = (meal: string, index: number, item: PlannerItem) => { if (typeof currentDay === 'number') setEditingItem({ day: currentDay, meal, index, initialHtml: item.customDisplayName || item.name }); };
  const saveEditorContent = (html: string) => { if (editingItem) { updateItem(editingItem.meal, editingItem.index, 'customDisplayName', html); setEditingItem(null); } };
  const handleSaveInstructions = (html: string) => { setWeeklyPlan(prev => ({ ...prev, instructions: html })); setShowInstructionsEditor(false); };

  const handleBulkFormat = (opts: any) => {
      setWeeklyPlan(prev => {
          const newPlan = JSON.parse(JSON.stringify(prev)); 
          const days = opts.applyToAllDays ? Object.keys(newPlan).filter(k => !isNaN(Number(k))).map(Number) : [currentDay];
          days.forEach(d => {
              if (!newPlan[d]) return;
              Object.keys(newPlan[d].items || {}).forEach(mt => {
                  newPlan[d].items[mt] = (newPlan[d].items[mt] || []).map((it: any) => {
                      let txt = it.name;
                      if (it.customDisplayName) { const div = document.createElement("div"); div.innerHTML = it.customDisplayName; txt = div.textContent || it.name; }
                      const pts = txt.split(REGEX_HIGHLIGHT);
                      let htm = `<span style="font-size: ${opts.fontSize}; ${opts.isBold ? 'font-weight: bold;' : ''}">`;
                      pts.forEach((p: string) => { htm += REGEX_HIGHLIGHT.test(p) ? `<span style="color: ${opts.bracketColor}; font-weight: bold;">${p}</span>` : p; });
                      htm += `</span>`;
                      return { ...it, customDisplayName: htm };
                  });
              });
          });
          return newPlan;
      });
      setShowBulkFormatModal(false);
  };

  const summary = useMemo(() => {
    let totalServes = 0, totalCHO = 0, totalProtein = 0, totalFat = 0, totalFiber = 0, totalKcal = 0, mainOnlyKcal = 0;
    const usedExchanges: Record<string, number> = {};
    if (typeof currentDay !== 'number' || !weeklyPlan[currentDay]) return { totalServes, totalCHO, totalProtein, totalFat, totalFiber, totalKcal, mainOnlyKcal, usedExchanges };
    const dayData = weeklyPlan[currentDay];
    if (!dayData?.items) return { totalServes, totalCHO, totalProtein, totalFat, totalFiber, totalKcal, mainOnlyKcal, usedExchanges };
    
    Object.values(dayData.items).forEach((ml: any) => {
        if (!ml || !Array.isArray(ml)) return;
        ml.forEach((it: PlannerItem) => {
            if (it.selected) { 
                const s = Number(it.serves);
                const k = Number(it.kcal) * s;
                totalServes += s; totalCHO += Number(it.cho) * s; totalProtein += Number(it.protein) * s; totalFat += Number(it.fat) * s; totalFiber += Number(it.fiber) * s; totalKcal += k;
                if (it.optionGroup === 'main') mainOnlyKcal += k;
                let key = GROUP_MAPPING[it.group] || it.group;
                if (it.group?.includes("Fat")) key = 'fats';
                usedExchanges[key] = (usedExchanges[key] || 0) + s;
            }
        });
    });
    return { totalServes, totalCHO, totalProtein, totalFat, totalFiber, totalKcal, mainOnlyKcal, usedExchanges };
  }, [weeklyPlan, currentDay]);

  const percentages = useMemo(() => {
     const k = summary.totalKcal || 1;
     return { cho: ((summary.totalCHO * 4) / k * 100).toFixed(1), pro: ((summary.totalProtein * 4) / k * 100).toFixed(1), fat: ((summary.totalFat * 9) / k * 100).toFixed(1) };
  }, [summary]);

  const exchangeComparison = useMemo(() => {
      if (typeof currentDay !== 'number') return [];
      let planned = plannedExchanges || activeVisit?.visit.meal_plan_data?.servings || {};
      const used = summary.usedExchanges;
      return [
          { key: 'starch', label: 'Starch' }, { key: 'fruit', label: 'Fruits' }, { key: 'veg', label: 'Vegetables' },
          { key: 'meatLean', label: 'Lean Meat' }, { key: 'meatMed', label: 'Med Meat' }, { key: 'meatHigh', label: 'High Meat' },
          { key: 'milkSkim', label: 'Skim Milk' }, { key: 'milkLow', label: 'Low Milk' }, { key: 'milkWhole', label: 'Full Milk' },
          { key: 'legumes', label: 'Legumes' }, { key: 'sugar', label: 'Sugar' }, { key: 'fats', label: 'Fats' },
      ].map(g => {
          let pVal = planned[g.key] || 0;
          if (g.key === 'fats' && pVal === 0) pVal = (planned['fatsPufa'] || 0) + (planned['fatsMufa'] || 0) + (planned['fatsSat'] || 0);
          return { ...g, plan: pVal, used: used[g.key] || 0, icon: GROUP_ICONS[g.key] || '🍽️' };
      }).filter(g => g.plan > 0 || g.used > 0);
  }, [activeVisit, summary.usedExchanges, plannedExchanges, currentDay]);

  const daySummaryRows = useMemo(() => {
      if (typeof currentDay !== 'number' || !weeklyPlan[currentDay]) return [];
      const d = weeklyPlan[currentDay];
      return MEAL_TIMES.map(t => {
          const its = d.items?.[t] || [];
          const mt = d.meta?.[t] || { timeStart: '', timeEnd: '', notes: '' };
          const st = its.filter(i => i.selected).reduce((ac, i) => ({ kcal: ac.kcal + (i.kcal*i.serves), cho: ac.cho + (i.cho*i.serves), pro: ac.pro + (i.protein*i.serves), fat: ac.fat + (i.fat*i.serves), fiber: ac.fiber + (i.fiber*i.serves) }), { kcal: 0, cho: 0, pro: 0, fat: 0, fiber: 0 });
          return { time: t, meta: mt, stats: st, hasItems: its.length > 0 };
      });
  }, [weeklyPlan, currentDay]);

  const fetchPlans = async () => { if (!session) return; setIsLoadingPlans(true); try { const { data } = await supabase.from('saved_meals').select('*').eq('tool_type', 'day-planner').eq('user_id', session.user.id).order('created_at', { ascending: false }); if (data) setSavedPlans(data); } finally { setIsLoadingPlans(false); } };
  
  const savePlan = async () => {
    if (activeVisit && !isEmbedded) {
        setStatusMsg("Saving to Client Visit...");
        try { 
            await supabase.from('client_visits').update({ day_plan_data: { weeklyPlan, targetKcal } }).eq('id', activeVisit.visit.id); 
            setStatusMsg("Visit Saved!"); 
        } catch (err: any) { 
            setStatusMsg("Err: " + err.message); 
        }
        return;
    }
    
    if (!planName.trim()) {
        const n = prompt("Enter a label for this Day-Menu Template:", lastSavedName);
        if (!n) return;
        setPlanName(n);
    }
    
    if (!session) return;
    setStatusMsg("Saving Template...");
    try {
        const isUpdate = loadedPlanId && (planName === lastSavedName);
        if (isUpdate) { 
            await supabase.from('saved_meals').update({ name: planName, data: { weeklyPlan, targetKcal } }).eq('id', loadedPlanId); 
        } else { 
            const { data } = await supabase.from('saved_meals').insert({ user_id: session.user.id, name: planName, tool_type: 'day-planner', data: { weeklyPlan, targetKcal }, created_at: new Date().toISOString() }).select().single(); 
            if (data) { setLoadedPlanId(data.id); setLastSavedName(data.name); } 
        }
        fetchPlans(); 
        setStatusMsg("Template Saved!");
        setTimeout(() => setStatusMsg(''), 3000);
    } catch (err: any) { 
        setStatusMsg("Err: " + err.message); 
    }
  };

  const loadPlan = (p: SavedMeal) => { 
    if (p.data?.weeklyPlan) setWeeklyPlan(p.data.weeklyPlan); 
    if (p.data?.targetKcal) setTargetKcal(p.data.targetKcal); 
    setPlanName(p.name); 
    setLoadedPlanId(p.id); 
    setLastSavedName(p.name); 
    setShowLoadModal(false); 
    setStatusMsg("Menu Loaded!");
    setTimeout(() => setStatusMsg(''), 3000);
  };

  const deletePlan = async (id: string) => { if (confirm("Delete template?") && session) { await supabase.from('saved_meals').delete().eq('id', id); setSavedPlans(prev => prev.filter(p => p.id !== id)); } };
  const confirmPrint = (o: PrintOptions) => { setPrintOptions(o); setShowPrintModal(false); setTimeout(() => window.print(), 300); };

  return (
    <div className="max-w-[1920px] mx-auto animate-fade-in space-y-6 pb-12">
      <Toast message={statusMsg || syncMsg} />
      {editingItem && <RichTextEditorModal initialHtml={editingItem.initialHtml} onSave={saveEditorContent} onClose={() => setEditingItem(null)} />}
      {showBulkFormatModal && <BulkFormatModal onApply={handleBulkFormat} onClose={() => setShowBulkFormatModal(false)} />}
      {showInstructionsEditor && <RichTextEditorModal title="Global Instructions" initialHtml={weeklyPlan.instructions || ''} onSave={handleSaveInstructions} onClose={() => setShowInstructionsEditor(false)} />}
      {showPrintModal && <PrintOptionsModal isWeek={printWeekMode} onClose={() => setShowPrintModal(false)} onConfirm={confirmPrint} />}

      <div className={`sticky top-12 z-40 bg-[var(--color-bg)] pt-2 pb-4 -mx-4 px-4 no-print shadow-sm border-b border-gray-100/50 ${isEmbedded ? 'top-0' : 'top-12'}`}>
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 flex flex-col xl:flex-row justify-between items-center gap-6">
              <div className="text-center xl:text-left">
                  <h1 className="text-3xl font-bold text-[var(--color-heading)] bg-clip-text text-transparent bg-gradient-to-r from-[var(--color-primary-dark)] to-[var(--color-primary)]">Day Food Planner</h1>
                  <p className="text-sm text-gray-500 mt-1 flex items-center gap-2 justify-center xl:justify-start">
                    {typeof currentDay === 'number' ? `Day ${currentDay}: Build the menu plan.` : 'Edit global plan instructions.'}
                  </p>
              </div>

              <div className="flex-grow max-w-4xl flex gap-3 items-center w-full px-4">
                  {typeof currentDay === 'number' ? (
                    <div className="relative flex-grow">
                        <input type="text" className="w-full px-6 py-3 rounded-full border-2 border-[var(--color-primary)] ring-2 ring-[var(--color-primary-light)] outline-none shadow-sm text-lg transition-colors bg-white" placeholder={`Adding to: ${activeMealTime}`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} dir={isRTL ? 'rtl' : 'ltr'} />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--color-primary)] bg-white px-2">{activeMealTime}</span>
                        {searchQuery && filteredFoods.length > 0 && (
                            <ul className="absolute w-full bg-white mt-2 rounded-xl shadow-2xl max-h-80 overflow-y-auto z-50 border border-gray-100 text-right">
                            {filteredFoods.map((f, i) => (<li key={i} className="px-4 py-3 hover:bg-green-50 border-b border-gray-50 last:border-0 cursor-pointer flex justify-between items-center group" onClick={() => addToPlan(f)}><div className="text-left"><div className="font-medium text-[var(--color-text)]">{renderHighlightedText(f.name)}</div><div className="text-xs text-gray-500 flex gap-2"><span>{f.group}</span><span className="font-bold text-blue-600">{f.kcal} kcal</span></div></div><div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded font-bold group-hover:bg-green-200">+ Add</div></li>))}
                            </ul>
                        )}
                    </div>
                  ) : <div className="flex-grow bg-blue-50 p-3 rounded-full border border-blue-200 text-blue-800 font-bold text-center uppercase tracking-widest">Global Instructions Mode</div>}

                  {session && (
                      <div className="flex gap-1 bg-gray-50 p-1 rounded-xl border border-gray-200 shadow-inner">
                         <input 
                            type="text" 
                            placeholder="Menu Template Label..." 
                            value={planName} 
                            onChange={e => setPlanName(e.target.value)}
                            className="w-40 px-3 py-2 text-xs border rounded-lg focus:ring-1 focus:ring-blue-400 outline-none bg-white"
                         />
                         <button onClick={savePlan} className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition shadow-sm" title="Save Full Menu">💾</button>
                         <button onClick={() => { fetchPlans(); setShowLoadModal(true); }} className="bg-purple-600 text-white p-2 rounded-lg hover:bg-purple-700 transition shadow-sm" title="Load Full Menu">📂</button>
                      </div>
                  )}
              </div>

              <div className="flex items-center gap-2 flex-wrap justify-center">
                    {!isEmbedded && <button onClick={() => onNavigate?.('meal-planner', undefined, undefined, true)} className="bg-orange-600 text-white px-3 py-2 rounded-lg font-bold text-sm">📅 Meal Planner</button>}
                    <button onClick={() => { setPrintWeekMode(false); setShowPrintModal(true); }} className="bg-gray-700 text-white w-10 h-10 rounded-lg flex items-center justify-center shadow-sm" title="Print Day">🖨️</button>
                    <button onClick={() => { setPrintWeekMode(true); setShowPrintModal(true); }} className="bg-gray-700 text-white w-10 h-10 rounded-lg flex items-center justify-center shadow-sm font-bold text-xs" title="Print Week">WK</button>
                    <button onClick={resetPlanner} className="text-red-500 text-xs font-bold border border-red-200 px-3 py-2 rounded hover:bg-red-50 transition">Clear All</button>
              </div>
          </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 no-print items-center">
          {[1, 2, 3, 4, 5, 6, 7].map(d => (<button key={d} onClick={() => setCurrentDay(d)} className={`px-6 py-2 rounded-t-lg font-bold text-sm transition-all border-b-2 whitespace-nowrap ${currentDay === d ? 'bg-white text-blue-600 border-blue-600 shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>Day {d}</button>))}
          <button onClick={() => setCurrentDay('instructions')} className={`px-6 py-2 rounded-t-lg font-bold text-sm transition-all border-b-2 whitespace-nowrap ${currentDay === 'instructions' ? 'bg-blue-600 text-white border-blue-800' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}>📋 Instructions</button>
          {typeof currentDay === 'number' && (
            <div className="ml-auto flex gap-2">
                <button onClick={() => handleSelectAllDay('all')} className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold hover:bg-blue-200">Select All</button>
                <button onClick={() => handleSelectAllDay('main-only')} className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded font-bold hover:bg-green-200">Select Main</button>
                <button onClick={() => handleSelectAllDay('none')} className="text-[10px] bg-gray-100 text-gray-700 px-2 py-1 rounded font-bold hover:bg-gray-200">Unselect All</button>
                <button onClick={clearDay} className="text-[10px] text-red-500 px-2 py-1 font-bold border border-red-100 rounded hover:bg-red-50">Clear Day</button>
            </div>
          )}
      </div>

      {/* SINGLE DAY PRINT */}
      <div className={`hidden print:block font-sans text-sm p-4 w-full h-full bg-white relative ${printWeekMode ? 'hidden print:hidden' : ''}`}>
          <div className="border-b-2 border-gray-800 pb-4 mb-6 flex justify-between items-start">
              <div><h1 className="text-2xl font-bold uppercase tracking-wider text-gray-900">{printSettings.clinicName}</h1><p className="text-sm text-gray-600 mt-1">{printSettings.doctorName}</p></div>
              <div className="text-right">
                  <h2 className="text-xl font-bold text-blue-800">{weeklyPlan[currentDay as number]?.title || `Day ${currentDay} Meal Plan`}</h2>
                  <div className="text-sm mt-1">{printSettings.patientName && <div>Patient: <strong>{printSettings.patientName}</strong></div>}<div>Date: <strong>{formatDateUK(printSettings.printDate)}</strong></div></div>
              </div>
          </div>
          
          {/* Conditional Summary Grid Print (v2.0.235) */}
          {printOptions.showSummaryGrid && (
            <div className="mb-6 grid grid-cols-5 gap-4 border border-gray-300 rounded-lg p-3 bg-gray-50 text-center print-color-exact">
                <div><span className="block text-[10px] uppercase text-gray-500 font-bold">Target Kcal</span><span className="font-bold text-lg">{targetKcal.toFixed(0)}</span></div>
                {printOptions.showPlannedKcal && (<div><span className="block text-[10px] uppercase text-gray-500 font-bold">Planned Kcal</span><span className="font-bold text-lg text-blue-700">{summary.mainOnlyKcal.toFixed(0)}</span></div>)}
                <div className="border-l border-gray-300"><span className="block text-[10px] uppercase text-blue-500 font-bold">Carbs</span><span className="font-bold">{summary.totalCHO.toFixed(0)}g</span></div>
                <div><span className="block text-[10px] uppercase text-red-500 font-bold">Protein</span><span className="font-bold">{summary.totalProtein.toFixed(0)}g</span></div>
                <div><span className="block text-[10px] uppercase text-yellow-600 font-bold">Fat</span><span className="font-bold">{summary.totalFat.toFixed(0)}g</span></div>
            </div>
          )}

          <table className="w-full border-collapse border border-gray-300 mb-6">
              <thead className="bg-gray-100 text-gray-800 print-color-exact"><tr><th className="p-2 border border-gray-300 text-left w-1/4">Meal Time</th><th className="p-2 border border-gray-300 text-left">Menu Item</th>{printOptions.showServes && <th className="p-2 border border-gray-300 text-center w-20">Serves</th>}{printOptions.showKcal && <th className="p-2 border border-gray-300 text-center w-20">Kcal</th>}<th className="p-2 border border-gray-300 text-left w-1/4">Notes</th></tr></thead>
              <tbody>
                  {MEAL_TIMES.map(t => {
                      const d = weeklyPlan[currentDay as number]; if(!d) return null;
                      const its = d.items?.[t]?.filter(i => (printOptions.includeAllAlternatives || i.selected) && i.optionGroup === 'main') || [];
                      const mt = d.meta?.[t]; if (its.length === 0 && !mt?.notes) return null;
                      const alts = d.items?.[t]?.filter(i => (printOptions.includeAllAlternatives || i.selected) && i.optionGroup !== 'main') || [];
                      const groups = Array.from(new Set(alts.map(i => i.optionGroup)));
                      return (
                          <React.Fragment key={t}>
                              <tr className={`${MEAL_COLORS[t]?.split(' ')[0] || 'bg-gray-50'} print-color-exact`}><td className="p-2 border border-gray-300 font-bold align-top text-gray-900" rowSpan={its.length + (groups.length > 0 ? 1 : 0) + 1}><span className="mr-2 text-lg">{MEAL_ICONS[t]}</span> {t}<span className="block text-[10px] font-normal text-gray-600 mt-1">{mt?.timeStart ? `${mt.timeStart}-${mt.timeEnd}` : ''}</span></td></tr>
                              {its.map((it, idx) => (<tr key={`${t}-${idx}`}><td className="p-2 border border-gray-300">{it.customDisplayName ? <div dangerouslySetInnerHTML={{ __html: it.customDisplayName }} /> : <span>{it.name}</span>}</td>{printOptions.showServes && <td className="p-2 border border-gray-300 text-center">{it.serves} sv</td>}{printOptions.showKcal && <td className="p-2 border border-gray-300 text-center text-xs">{(it.kcal*it.serves).toFixed(0)}</td>}{idx === 0 && <td className="p-2 border border-gray-300 text-xs italic align-top" rowSpan={its.length}>{mt?.notes}</td>}</tr>))}
                              {groups.length > 0 && (<tr className="bg-yellow-50 print-color-exact font-medium"><td colSpan={1 + (printOptions.showServes ? 1 : 0) + (printOptions.showKcal ? 1 : 0)} className="p-2 border border-gray-300 text-xs"><strong className="text-orange-800">Alternatives:</strong> {groups.map(g => `${g}: ${(d.items?.[t] || []).filter(i => i.optionGroup === g && (printOptions.includeAllAlternatives || i.selected)).map(i => i.name).join(', ')}`).join(' | ')}</td></tr>)}
                          </React.Fragment>
                      );
                  })}
              </tbody>
          </table>

          {/* Detailed Macro Breakdown Table in Print (v2.0.235) */}
          {printOptions.showNutritionTable && (
              <div className="mb-6 break-inside-avoid">
                  <h3 className="font-bold text-green-700 text-sm mb-2 border-b-2 border-green-200 pb-1 uppercase print-color-exact">Detailed Macro Breakdown</h3>
                  <table className="w-full border-collapse border border-gray-300 text-xs text-center">
                      <thead className="bg-green-50 text-green-900 print-color-exact">
                          <tr>
                              <th className="p-1.5 border border-gray-300 text-left">Meal Time</th>
                              <th className="p-1.5 border border-gray-300">Energy (kcal)</th>
                              <th className="p-1.5 border border-gray-300">CHO (g)</th>
                              <th className="p-1.5 border border-gray-300">Prot (g)</th>
                              <th className="p-1.5 border border-gray-300">Fat (g)</th>
                              <th className="p-1.5 border border-gray-300">Fiber (g)</th>
                          </tr>
                      </thead>
                      <tbody>
                          {daySummaryRows.map(row => row.hasItems && (
                              <tr key={row.time}>
                                  <td className="p-1.5 border border-gray-300 text-left font-bold">{row.time}</td>
                                  <td className="p-1.5 border border-gray-300">{row.stats.kcal.toFixed(0)}</td>
                                  <td className="p-1.5 border border-gray-300">{row.stats.cho.toFixed(1)}</td>
                                  <td className="p-1.5 border border-gray-300">{row.stats.pro.toFixed(1)}</td>
                                  <td className="p-1.5 border border-gray-300">{row.stats.fat.toFixed(1)}</td>
                                  <td className="p-1.5 border border-gray-300">{row.stats.fiber.toFixed(1)}</td>
                              </tr>
                          ))}
                          <tr className="bg-gray-100 font-bold print-color-exact">
                              <td className="p-1.5 border border-gray-300 text-left">TOTAL</td>
                              <td className="p-1.5 border border-gray-300">{summary.totalKcal.toFixed(0)}</td>
                              <td className="p-1.5 border border-gray-300">{summary.totalCHO.toFixed(1)}</td>
                              <td className="p-1.5 border border-gray-300">{summary.totalProtein.toFixed(1)}</td>
                              <td className="p-1.5 border border-gray-300">{summary.totalFat.toFixed(1)}</td>
                              <td className="p-1.5 border border-gray-300">{summary.totalFiber.toFixed(1)}</td>
                          </tr>
                      </tbody>
                  </table>
              </div>
          )}

          {weeklyPlan.instructions && <div className="mb-6 break-inside-avoid"><h3 className="font-bold text-gray-800 text-sm mb-2 border-b-2 border-gray-300 pb-1 uppercase">Instructions</h3><div className="p-3 border border-gray-200 rounded-lg prose-sm" dangerouslySetInnerHTML={{ __html: weeklyPlan.instructions }} /></div>}
          <div className="text-center text-[10px] text-gray-400 mt-10 border-t pt-2">Generated by Diet-Nova System</div>
      </div>

      {/* WEEKLY TABLE PRINT */}
      {printWeekMode && (
          <div className="hidden print:block font-sans text-xs w-full h-full absolute top-0 left-0 bg-white z-[9999] p-4">
              <div className="border-b-2 border-gray-800 pb-2 mb-4 flex justify-between items-start"><div><h1 className="text-xl font-bold uppercase tracking-wider text-gray-900">{printSettings.clinicName}</h1><p className="text-xs text-gray-600">{printSettings.doctorName}</p></div><div className="text-right"><h2 className="text-lg font-bold text-blue-800">Weekly Meal Plan</h2><div className="text-xs">Date: <strong>{formatDateUK(printSettings.printDate)}</strong></div></div></div>
              <table className="w-full border-collapse border border-gray-400 text-[9px] mb-8">
                  <thead><tr className="bg-gray-200 text-gray-800 print-color-exact"><th className="border border-gray-400 p-1 w-12">Day</th>{MEAL_TIMES.map(t => (<th key={t} className={`border border-gray-400 p-1 ${MEAL_COLORS[t]?.split(' ')[0] || ''}`}>{MEAL_ICONS[t]} {t}</th>))}</tr></thead>
                  <tbody>
                      {[1, 2, 3, 4, 5, 6, 7].map(d => {
                          const dp = weeklyPlan[d]; if (!dp || !MEAL_TIMES.some(t => (dp.items?.[t]?.length || 0) > 0)) return null;
                          return (
                              <tr key={d}>
                                  <td className="border border-gray-400 p-1 font-bold text-center bg-gray-50 print-color-exact"><div>D{d}</div><div className="text-[7px] text-blue-600 font-normal">{dp.title}</div></td>
                                  {MEAL_TIMES.map(t => {
                                      const its = dp.items?.[t]?.filter(i => (printOptions.includeAllAlternatives || i.selected) && i.optionGroup === 'main') || [];
                                      return (<td key={t} className="border border-gray-400 p-1 align-top h-20">{its.length > 0 ? <ul className="list-none leading-tight space-y-1">{its.map((it, idx) => (<li key={idx}><div className="font-bold" dangerouslySetInnerHTML={{ __html: it.customDisplayName || it.name }} />{(printOptions.showServes || printOptions.showKcal) && <div className="text-[7px] text-blue-600 opacity-80 italic">{printOptions.showServes && <span>{it.serves}sv </span>}{printOptions.showKcal && <span>({(it.kcal*it.serves).toFixed(0)}kcal)</span>}</div>}</li>))}</ul> : '-'}</td>);
                                  })}
                              </tr>
                          );
                      })}
                  </tbody>
              </table>
              {weeklyPlan.instructions && <div className="mb-6 break-inside-avoid text-[9px] border border-gray-400 p-2 rounded"><h3 className="font-bold text-gray-900 mb-1 border-b uppercase">Global Instructions</h3><div dangerouslySetInnerHTML={{ __html: weeklyPlan.instructions }} /></div>}
              <div className="text-center text-[8px] text-gray-400 mt-10 border-t pt-2">Diet-Nova System • v2.0.235</div>
          </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 no-print">
          {/* Side View: Fixed Sidebar logic (v2.0.235) */}
          <div className="xl:col-span-3 space-y-6 order-2 xl:order-1">
              <div className="sticky top-40 h-[calc(100vh-200px)] flex flex-col gap-6">
                {/* 1. Exchange Control */}
                <div className="bg-white rounded-xl shadow-lg border border-purple-100 p-4 shrink-0">
                    <h3 className="font-bold text-purple-800 mb-4 flex items-center gap-2 border-b pb-2"><span>📋</span> Exchange Control</h3>
                    <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                        {exchangeComparison.map(ex => {
                            const pct = Math.min((ex.used / (ex.plan || 1)) * 100, 100);
                            const isOver = ex.used > ex.plan; const barColor = isOver ? 'bg-red-500' : ex.used === ex.plan ? 'bg-green-500' : 'bg-purple-500';
                            return (<div key={ex.key} className="space-y-1"><div className="flex justify-between text-xs font-medium text-gray-700"><span>{ex.icon} {ex.label}</span><span className={`${isOver ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{ex.used.toFixed(1)} / {ex.plan.toFixed(1)}</span></div><div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden"><div className={`h-full ${barColor} transition-all duration-500`} style={{ width: `${pct}%` }}></div></div></div>)
                        })}
                    </div>
                </div>
                {/* 2. Meal Schedule - Fixed below exchanges, non-scrollable container */}
                <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-4 flex flex-col overflow-hidden min-h-[300px]">
                    <h3 className="font-bold text-blue-800 mb-2 flex items-center gap-2 border-b pb-2"><span>⏰</span> Meal Schedule</h3>
                    <div className="overflow-y-auto flex-grow">
                        <table className="w-full text-xs">
                            <thead className="bg-blue-50 text-blue-900 font-bold sticky top-0"><tr><th className="p-1 text-left">Meal</th><th className="p-1 text-center">Time</th><th className="p-1 text-center">Kcal</th></tr></thead>
                            <tbody className="divide-y divide-blue-50">
                                {daySummaryRows.map(r => r.hasItems && (
                                    <tr key={r.time} className="hover:bg-gray-50"><td className="p-1 font-medium text-gray-700">{r.time}</td><td className="p-1 text-center text-gray-500">{r.meta.timeStart ? `${r.meta.timeStart}-${r.meta.timeEnd}` : '-'}</td><td className="p-1 text-center font-bold text-gray-800">{r.stats.kcal.toFixed(0)}</td></tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
              </div>
          </div>

          {/* Center View */}
          <div className="xl:col-span-6 space-y-6 order-1 xl:order-2">
              {currentDay === 'instructions' ? (
                  <div className="bg-white rounded-2xl shadow-xl border border-blue-100 overflow-hidden animate-fade-in">
                      <div className="p-6 bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex justify-between items-center"><div><h2 className="text-2xl font-bold">Plan Instructions</h2></div><button onClick={() => setShowInstructionsEditor(true)} className="bg-white/20 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"><span>📝</span> Edit Instructions</button></div>
                      <div className="p-8 prose max-w-none min-h-[400px]">{weeklyPlan.instructions ? <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 leading-relaxed text-gray-800" dangerouslySetInnerHTML={{ __html: weeklyPlan.instructions }} /> : <div className="flex flex-col items-center justify-center h-full text-gray-400 py-20 italic">No instructions set.</div>}</div>
                  </div>
              ) : (
                  <div>
                      <div className="mb-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <h2 className="text-xl font-bold text-gray-800 whitespace-nowrap">Day {currentDay} Menu</h2>
                            <div className="flex-grow md:w-64 relative">
                                <input 
                                    type="text" 
                                    placeholder="Enter custom title for this day..." 
                                    value={weeklyPlan[currentDay]?.title || ''} 
                                    onChange={(e) => updateDayTitle(e.target.value)}
                                    className="w-full p-2 pl-8 border rounded-lg focus:ring-1 focus:ring-blue-500 outline-none text-sm font-bold bg-blue-50/30 text-blue-800 border-blue-100"
                                />
                                <span className="absolute left-2.5 top-2.5 text-blue-400 text-xs">🏷️</span>
                            </div>
                        </div>
                      </div>
                      {MEAL_TIMES.map((time) => {
                          const d = weeklyPlan[currentDay as number] || { items: {}, meta: {} };
                          const its = d.items?.[time] || [];
                          const mt = d.meta?.[time] || { timeStart: '', timeEnd: '', notes: '' };
                          const act = activeMealTime === time;
                          const stats = its.filter(i => i.selected).reduce((ac, i) => ({ kcal: ac.kcal + (i.kcal*i.serves) }), { kcal: 0 });
                          const groups = Array.from(new Set(its.map(i => i.optionGroup)));
                          return (
                            <div key={time} className={`rounded-xl shadow-sm border overflow-hidden mb-6 transition-all ${act ? 'border-yellow-400 ring-2 ring-yellow-100' : 'border-gray-200'}`}>
                                <div className={`px-4 py-3 flex flex-col md:flex-row justify-between items-center cursor-pointer ${act ? 'bg-yellow-50' : 'bg-gray-50'}`} onClick={() => setActiveMealTime(time)}>
                                    <div className="flex items-center gap-3"><div className={`w-3 h-3 rounded-full ${act ? 'bg-yellow-500 animate-pulse' : 'bg-gray-300'}`}></div><h3 className={`font-bold text-lg flex items-center gap-2 ${act ? 'text-yellow-900' : 'text-gray-700'}`}>{MEAL_ICONS[time]} {time}</h3></div>
                                    <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}><div className="flex items-center gap-1 text-xs"><input type="time" value={mt.timeStart} onChange={e => updateMeta(time, 'timeStart', e.target.value)} className="p-1 border rounded" /><span>-</span><input type="time" value={mt.timeEnd} onChange={e => updateMeta(time, 'timeEnd', e.target.value)} className="p-1 border rounded" /></div><div className="text-xs font-bold text-gray-800">{stats.kcal.toFixed(0)} kcal</div></div>
                                </div>
                                <div className="bg-white p-4">
                                    <div className="space-y-4">
                                        {groups.map(g => (
                                            <div key={g} className="rounded-lg border border-gray-100 p-2">
                                                <div className="flex justify-between items-center text-xs font-bold uppercase text-gray-500 mb-2"><span>{g === 'main' ? 'Main Option' : g}</span></div>
                                                <div className="divide-y divide-gray-100">
                                                    {its.filter(i => i.optionGroup === g).map((it) => {
                                                        const idx = its.indexOf(it);
                                                        return (<div key={idx} className={`p-2 flex flex-col sm:flex-row items-center gap-3 ${!it.selected ? 'opacity-50' : ''}`}><input type="checkbox" checked={it.selected} onChange={(e) => updateItem(time, idx, 'selected', e.target.checked)} className="no-print" /><div className="flex-grow text-left w-full sm:w-auto"><div className="font-bold text-gray-800 text-sm flex items-center gap-2">{it.customDisplayName ? <div dangerouslySetInnerHTML={{ __html: it.customDisplayName }} /> : renderHighlightedText(it.name)}<button onClick={() => openEditor(time, idx, it)} className="text-gray-300 hover:text-blue-500 transition">✎</button></div><div className="text-[10px] text-gray-400 flex items-center gap-3"><span>{it.group}</span><div className="flex gap-1.5 border-l pl-2"><span className="text-blue-600">C:{(it.cho*it.serves).toFixed(1)}</span><span className="text-red-600">P:{(it.protein*it.serves).toFixed(1)}</span><span className="text-yellow-600">F:{(it.fat*it.serves).toFixed(1)}</span></div><select value={it.optionGroup} onChange={(e) => updateItem(time, idx, 'optionGroup', e.target.value)} className="bg-transparent text-[9px] outline-none ml-auto">{ALT_OPTIONS.map(o => (<option key={o} value={o}>{o === 'main' ? 'Set as Main' : o}</option>))}</select></div></div><div className="flex items-center gap-1"><input type="number" step="0.25" value={it.serves} onChange={(e) => updateItem(time, idx, 'serves', Number(e.target.value))} className="w-12 p-1 border rounded text-center text-sm font-bold" /><span>sv</span></div><div className="text-right w-16 font-mono font-bold text-gray-700 text-xs">{(it.kcal*it.serves).toFixed(0)}</div><button onClick={() => removeFromPlan(time, idx)} className="text-red-300 hover:text-red-600 text-lg">×</button></div>);
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-gray-100"><textarea placeholder="Notes..." value={mt.notes} onChange={e => updateMeta(time, 'notes', e.target.value)} className="w-full p-2 text-xs border rounded bg-gray-50 h-16 resize-none" /></div>
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
                  <div className="mb-6"><label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Target Calories</label><div className="relative flex items-center gap-2"><input type="number" className="w-full p-2 border-2 border-blue-200 rounded-lg text-center font-bold text-xl text-blue-800" value={targetKcal} onChange={(e) => setTargetKcal(parseFloat(e.target.value))} /><button onClick={fetchTargetKcal} className="bg-blue-100 text-blue-700 p-2 rounded-lg" title="Refresh">🔄</button></div></div>
                  <div className="mb-6"><MacroDonut cho={summary.totalCHO} pro={summary.totalProtein} fat={summary.totalFat} totalKcal={summary.totalKcal} /></div>
                  <div className="space-y-4">
                    <ProgressBar current={summary.totalKcal} target={targetKcal} label="Total (Selected)" unit="kcal" color="bg-blue-500" />
                    <ProgressBar current={summary.mainOnlyKcal} target={targetKcal} label="Planned (Main)" unit="kcal" color="bg-green-600" />
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
                    {isLoadingPlans ? <div className="text-center py-10">Loading...</div> : filteredSavedPlans.map(p => (<div key={p.id} className="flex justify-between items-center p-3 bg-gray-50 hover:bg-blue-50 rounded-lg border border-gray-100 group"><div><div className="font-bold text-gray-800">{p.name}</div></div><div className="flex gap-2 opacity-0 group-hover:opacity-100 transition"><button onClick={() => loadPlan(p)} className="px-3 py-1 bg-blue-500 text-white text-xs rounded">Load</button><button onClick={() => deletePlan(p.id)} className="px-3 py-1 bg-red-100 text-red-600 text-xs rounded">Del</button></div></div>))}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default MealCreator;