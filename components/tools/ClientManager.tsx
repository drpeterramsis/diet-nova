
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Client, ClientVisit, DietaryAssessmentData, FoodQuestionnaireData } from '../../types';
import Loading from '../Loading';
import { SimpleLineChart } from '../Visuals';
import { DietaryAssessment } from './DietaryAssessment';
import { FoodQuestionnaire } from './FoodQuestionnaire';
import { labPanels, labTestsEncyclopedia, LabTestItem, LabPanel } from '../../data/labData';
import STRONGKids from './STRONGKids';
import LabReference from './LabReference';
import PediatricWaist from './PediatricWaist';
import PediatricMAMC from './PediatricMAMC';
import GrowthCharts from './GrowthCharts';
import InstructionsLibrary from './InstructionsLibrary';

// Helper for Plan Stats (Copied from MealPlanner logic for display)
const GROUP_FACTORS: Record<string, { cho: number; pro: number; fat: number; kcal: number }> = {
  starch: { cho: 15, pro: 3, fat: 0, kcal: 80 },
  veg: { cho: 5, pro: 2, fat: 0, kcal: 25 },
  fruit: { cho: 15, pro: 0, fat: 0, kcal: 60 },
  meatLean: { cho: 0, pro: 7, fat: 3, kcal: 45 },
  meatMed: { cho: 0, pro: 7, fat: 5, kcal: 75 },
  meatHigh: { cho: 0, pro: 7, fat: 8, kcal: 100 },
  milkSkim: { cho: 15, pro: 8, fat: 3, kcal: 100 },
  milkLow: { cho: 15, pro: 8, fat: 5, kcal: 120 },
  milkWhole: { cho: 15, pro: 8, fat: 8, kcal: 160 },
  legumes: { cho: 15, pro: 7, fat: 0, kcal: 110 },
  fats: { cho: 0, pro: 0, fat: 5, kcal: 45 },
  sugar: { cho: 5, pro: 0, fat: 0, kcal: 20 },
};

const calculatePlanStats = (servings: Record<string, number>) => {
    let cho = 0, pro = 0, fat = 0, kcal = 0;
    Object.keys(servings).forEach(group => {
        const s = servings[group] || 0;
        const factor = GROUP_FACTORS[group];
        if (factor) {
            cho += s * factor.cho;
            pro += s * factor.pro;
            fat += s * factor.fat;
            kcal += s * factor.kcal;
        }
    });
    return { cho, pro, fat, kcal };
};

// InBody Logic
const getBodyFatAnalysis = (fat: number, age: number, gender: 'male' | 'female') => {
    if (!fat || !age) return null;
    let status = '';
    let color = '';

    if (age >= 20 && age <= 40) {
        if (gender === 'female') {
            if (fat < 21) { status = 'Underfat'; color = 'text-blue-600'; }
            else if (fat <= 33) { status = 'Healthy'; color = 'text-green-600'; }
            else if (fat <= 39) { status = 'Overweight'; color = 'text-orange-500'; }
            else { status = 'Obese'; color = 'text-red-600'; }
        } else {
            if (fat < 8) { status = 'Underfat'; color = 'text-blue-600'; }
            else if (fat <= 19) { status = 'Healthy'; color = 'text-green-600'; }
            else if (fat <= 25) { status = 'Overweight'; color = 'text-orange-500'; }
            else { status = 'Obese'; color = 'text-red-600'; }
        }
    } else if (age >= 41 && age <= 60) {
        if (gender === 'female') {
            if (fat < 23) { status = 'Underfat'; color = 'text-blue-600'; }
            else if (fat <= 35) { status = 'Healthy'; color = 'text-green-600'; }
            else if (fat <= 40) { status = 'Overweight'; color = 'text-orange-500'; }
            else { status = 'Obese'; color = 'text-red-600'; }
        } else {
            if (fat < 11) { status = 'Underfat'; color = 'text-blue-600'; }
            else if (fat <= 22) { status = 'Healthy'; color = 'text-green-600'; }
            else if (fat <= 27) { status = 'Overweight'; color = 'text-orange-500'; }
            else { status = 'Obese'; color = 'text-red-600'; }
        }
    } else if (age >= 61) {
        if (gender === 'female') {
            if (fat < 24) { status = 'Underfat'; color = 'text-blue-600'; }
            else if (fat <= 36) { status = 'Healthy'; color = 'text-green-600'; }
            else if (fat <= 42) { status = 'Overweight'; color = 'text-orange-500'; }
            else { status = 'Obese'; color = 'text-red-600'; }
        } else {
            if (fat < 13) { status = 'Underfat'; color = 'text-blue-600'; }
            else if (fat <= 25) { status = 'Healthy'; color = 'text-green-600'; }
            else if (fat <= 30) { status = 'Overweight'; color = 'text-orange-500'; }
            else { status = 'Obese'; color = 'text-red-600'; }
        }
    } else {
        // Under 20 fallback (Adult references often don't apply, simplified here)
        status = 'Use Growth Charts'; color = 'text-gray-500';
    }

    return { status, color };
};

interface ClientManagerProps {
  initialClientId?: string | null;
  onAnalyzeInKcal?: (client: Client, visit: ClientVisit) => void;
  onPlanMeals?: (client: Client, visit: ClientVisit) => void;
  onRunNFPE?: (client: Client) => void;
  autoOpenNew?: boolean;
}

type SortOption = 'date_desc' | 'date_asc' | 'name_asc' | 'name_desc' | 'clinic';
type GroupOption = 'none' | 'clinic' | 'month';

const formatDateUK = (dateString: string | undefined) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

// General Note Tags
const TAG_CATEGORIES: Record<string, string[]> = {
    "📏 Anthropometry": ["Weight Gain 📈", "Weight Loss 📉", "Stunted Growth 📏"],
    "🏥 Special Conditions": ["Post-Op 🏥", "Bedridden 🛏️", "Wheelchair ♿", "Sedentary 🛋️", "Active 🏃", "Athlete 🏋️"],
    "📅 Daily Habits": ["Smoker 🚬", "High Caffeine ☕", "Low Water Intake 💧", "High Sugar 🍬", "Soda Drinker 🥤", "Fast Food 🍔", "Sleep Apnea 😴", "Insomnia 🌑"],
    "🩺 Medical History": ["Diabetes 🩸", "Hypertension 💓", "CVS Disease ❤️", "GIT Issues 🤢", "Pulmonary 🫁", "Renal 🦠", "Endocrine 🦋", "Food Allergies 🥜"],
    "👪 Family History": ["Family Obesity 👨‍👩‍👧", "Family Diabetes 🩸", "Family CVS ❤️"],
    "🌸 Female Only": ["PCOS 🌸", "Pregnancy 🤰", "Lactation 🤱", "Menopause 🥀", "Contraceptives 💊", "Irregular Cycle 🗓️"]
};

// Pediatric Tags (New)
const PEDIATRIC_TAG_CATEGORIES: Record<string, string[]> = {
    "👶 Birth & Early Life": ["Full Term (9m)", "Premature", "C-Section", "Natural Birth", "Normal Birth Wt", "Low Birth Wt", "High Birth Wt", "Jaundice at birth", "Incubator needed"],
    "🍼 Feeding History": ["Exclusive Breastfeeding", "Formula Feeding", "Mixed Feeding", "Weaning < 6m", "Weaning > 6m", "Milk Allergy", "Lactose Intolerance"],
    "🥣 Eating Habits": ["Good Appetite", "Poor Appetite", "Picky Eater", "Slow Eater", "Overeating", "Refuses Breakfast", "Eats Breakfast", "Snacks Frequently", "Eats Out Often"],
    "🥦 Food Preferences": ["Loves Sweets 🍬", "Loves Savory 🧂", "Refuses Veggies 🥦", "Refuses Meat 🍖", "Loves Fruits 🍎", "Refuses Milk 🥛", "Loves Fast Food 🍔"],
    "⚠️ Medical/Behavioral": ["Eating Disorder", "Food Neophobia", "Constipation", "Diarrhea", "Vomiting", "Family Hx Obesity", "Sedentary Child", "Active Child"]
};

// Note Display Component
const NoteDisplay: React.FC<{ text: string }> = ({ text }) => {
    if (!text) return null;
    return (
        <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
            {text.split('\n').map((line, i) => {
                const trimmed = line.trim();
                // Check for Category Headers [Category]
                if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
                    return <div key={i} className="font-bold text-red-700 mt-3 mb-1 text-base">{line}</div>;
                }
                // Check for Tags bullet points
                if (trimmed.startsWith('•')) {
                    return <div key={i} className="font-bold text-red-600 ml-2 mb-0.5">{line}</div>;
                }
                // Check for Lab Results (e.g., "Hemoglobin: 12") - basic heuristic
                if (trimmed.includes(':') && /\d/.test(trimmed)) {
                     // Could be a lab result, make it standout slightly
                     return <div key={i} className="ml-1 text-blue-800 font-medium">{line}</div>;
                }
                return <div key={i}>{line}</div>;
            })}
        </div>
    );
};

// --- Full Profile Print Component ---
const ClientPrintView: React.FC<{ client: Client, visits: ClientVisit[] }> = ({ client, visits }) => {
    return (
        <div className="hidden print:block p-8 font-serif">
            <h1 className="text-3xl font-bold mb-2 border-b-2 border-black pb-2">{client.full_name}</h1>
            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                <div>
                    <p><strong>Code:</strong> {client.client_code}</p>
                    <p><strong>DOB:</strong> {formatDateUK(client.dob)} ({client.age}y)</p>
                    <p><strong>Gender:</strong> {client.gender}</p>
                    <p><strong>Phone:</strong> {client.phone}</p>
                </div>
                <div>
                    <p><strong>Clinic:</strong> {client.clinic}</p>
                    <p><strong>Job:</strong> {client.job || 'N/A'}</p>
                    <p><strong>Last Visit:</strong> {formatDateUK(client.visit_date)}</p>
                </div>
            </div>

            <div className="mb-6">
                <h2 className="text-xl font-bold mb-2 uppercase bg-gray-100 p-1">Current Status</h2>
                <div className="grid grid-cols-4 gap-4 text-sm border p-2">
                    <div><strong>Weight:</strong> {client.weight} kg</div>
                    <div><strong>Height:</strong> {client.height} cm</div>
                    <div><strong>BMI:</strong> {client.bmi}</div>
                    <div><strong>Waist:</strong> {client.waist} cm</div>
                    {client.head_circumference && <div><strong>Head Circ:</strong> {client.head_circumference} cm</div>}
                </div>
            </div>

            {client.notes && (
                <div className="mb-6">
                    <h2 className="text-xl font-bold mb-2 uppercase bg-gray-100 p-1">Clinical Notes & History</h2>
                    <div className="whitespace-pre-wrap text-sm border p-2">{client.notes}</div>
                </div>
            )}

            <div className="mb-6">
                <h2 className="text-xl font-bold mb-2 uppercase bg-gray-100 p-1">Visit History</h2>
                <table className="w-full text-sm border-collapse border border-gray-300">
                    <thead>
                        <tr className="bg-gray-50">
                            <th className="border p-1 text-left">Date</th>
                            <th className="border p-1 text-center">Wt (kg)</th>
                            <th className="border p-1 text-center">BMI</th>
                            <th className="border p-1 text-center">Fat %</th>
                            <th className="border p-1 text-left">Notes / Plan</th>
                        </tr>
                    </thead>
                    <tbody>
                        {visits.map(v => (
                            <tr key={v.id}>
                                <td className="border p-1">{formatDateUK(v.visit_date)}</td>
                                <td className="border p-1 text-center font-bold">{v.weight}</td>
                                <td className="border p-1 text-center">{v.bmi}</td>
                                <td className="border p-1 text-center">{v.kcal_data?.inputs?.bodyFatPercent || '-'}</td>
                                <td className="border p-1 text-xs">
                                    {v.kcal_data?.inputs?.reqKcal && `Target: ${v.kcal_data.inputs.reqKcal} kcal. `}
                                    {v.notes}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="text-center text-xs mt-10 border-t pt-2">Generated by Diet-Nova System</div>
        </div>
    );
};

const ClientManager: React.FC<ClientManagerProps> = ({ initialClientId, onAnalyzeInKcal, onPlanMeals, onRunNFPE, autoOpenNew }) => {
  const { t, isRTL } = useLanguage();
  const { session } = useAuth();
  
  // View State
  const [viewMode, setViewMode] = useState<'list' | 'details' | 'dietary-recall' | 'food-questionnaire' | 'lab-checklist' | 'strong-kids' | 'pediatric-waist' | 'pediatric-mamc' | 'growth-charts' | 'instructions'>('list');

  // Data State
  const [clients, setClients] = useState<Client[]>([]);
  const [visits, setVisits] = useState<ClientVisit[]>([]); 
  const [loading, setLoading] = useState(true);
  const [loadingVisits, setLoadingVisits] = useState(false);
  const [tableError, setTableError] = useState(false);
  
  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date_desc');
  const [groupBy, setGroupBy] = useState<GroupOption>('none');
  
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'visits' | 'report'>('profile');
  const [noJob, setNoJob] = useState(false);
  
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [allTagsExpanded, setAllTagsExpanded] = useState(false);
  
  // Pediatric Accordion State
  const [expandedPediatricCategory, setExpandedPediatricCategory] = useState<string | null>(null);
  
  // Age Detail State
  const [ageDetail, setAgeDetail] = useState<{y: number, m: number, d: number} | null>(null);

  // Tool Targets (For Dietary/Food Q)
  const [toolTarget, setToolTarget] = useState<{type: 'client' | 'visit', id: string, initialData?: any} | null>(null);
  const [isSavingTool, setIsSavingTool] = useState(false);

  // Lab Checklist State (Page View)
  const [labChecklistSelection, setLabChecklistSelection] = useState<Set<string>>(new Set());
  const [labSearch, setLabSearch] = useState('');

  // Form State (Client Profile)
  const [formData, setFormData] = useState<{
    client_code: string;
    full_name: string;
    visit_date: string;
    dob: string;
    clinic: string;
    phone: string;
    notes: string;
    age: number | '';
    gender: 'male' | 'female';
    marital_status: string;
    kids_count: number | '';
    job: string;
    weight: number | '';
    height: number | '';
    waist: number | '';
    hip: number | '';
    miac: number | '';
    head_circumference: number | ''; 
  }>({
    client_code: '',
    full_name: '',
    visit_date: new Date().toISOString().split('T')[0],
    dob: '',
    clinic: '',
    phone: '',
    notes: '',
    age: '',
    gender: 'male',
    marital_status: 'single',
    kids_count: '',
    job: '',
    weight: '',
    height: '',
    waist: '',
    hip: '',
    miac: '',
    head_circumference: ''
  });
  
  const profileBMI = useMemo(() => {
      const w = Number(formData.weight);
      const h = Number(formData.height) / 100;
      if (w > 0 && h > 0) return (w / (h * h)).toFixed(1);
      return '';
  }, [formData.weight, formData.height]);

  // Form State (New/Edit Visit)
  const [editingVisitId, setEditingVisitId] = useState<string | null>(null);
  const [newVisitData, setNewVisitData] = useState<{
      visit_date: string;
      weight: number | '';
      height: number | '';
      waist: number | '';
      hip: number | '';
      miac: number | '';
      head_circumference: number | '';
      body_fat: number | ''; // New Field
      notes: string;
  }>({
      visit_date: new Date().toISOString().split('T')[0],
      weight: '',
      height: '',
      waist: '',
      hip: '',
      miac: '',
      head_circumference: '',
      body_fat: '',
      notes: ''
  });

  const [formError, setFormError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [summaryText, setSummaryText] = useState('');

  // Body Fat Analysis for New Visit Form
  const bodyFatAnalysis = useMemo(() => {
      if (!newVisitData.body_fat || formData.age === '') return null;
      return getBodyFatAnalysis(Number(newVisitData.body_fat), Number(formData.age), formData.gender);
  }, [newVisitData.body_fat, formData.age, formData.gender]);

  // Refs for tracking initial load
  const processedInitialIdRef = useRef<string | null>(null);

  // Derived state for Lab Search
  const fullLabCategories = useMemo(() => {
    const cats: Record<string, LabTestItem[]> = {};
    const q = labSearch.toLowerCase();
    labTestsEncyclopedia.forEach(item => {
        if (item.test.toLowerCase().includes(q) || 
            item.category.toLowerCase().includes(q)) {
            if (!cats[item.category]) cats[item.category] = [];
            cats[item.category].push(item);
        }
    });
    return cats;
  }, [labSearch]);

  useEffect(() => {
    fetchClients();
  }, [session]);

  useEffect(() => {
      if (autoOpenNew && viewMode === 'list' && !initialClientId) {
          handleOpenProfile();
      }
  }, [autoOpenNew]);

  // Handle Initial Client ID Load
  useEffect(() => {
      if (initialClientId && clients.length > 0) {
          if (processedInitialIdRef.current !== initialClientId) {
              const target = clients.find(c => c.id === initialClientId);
              if (target) {
                  if (!editingClient || editingClient.id !== target.id) {
                      handleOpenProfile(target);
                  }
                  processedInitialIdRef.current = initialClientId;
              }
          }
      }
  }, [initialClientId, clients]);

  // Age Calculation Function
  const calculateAge = () => {
      if (formData.dob) {
          const birth = new Date(formData.dob);
          const visit = new Date(formData.visit_date);
          
          if (!isNaN(birth.getTime()) && !isNaN(visit.getTime())) {
              let years = visit.getFullYear() - birth.getFullYear();
              let months = visit.getMonth() - birth.getMonth();
              let days = visit.getDate() - birth.getDate();

              if (days < 0) {
                  months--;
                  const prevMonthDate = new Date(visit.getFullYear(), visit.getMonth(), 0);
                  days += prevMonthDate.getDate();
              }
              if (months < 0) {
                  years--;
                  months += 12;
              }

              const calculatedAge = Math.max(0, years);
              
              if (formData.age !== calculatedAge) {
                 setFormData(prev => ({ ...prev, age: calculatedAge }));
              }
              setAgeDetail({ y: years, m: months, d: days });
          } else {
              setAgeDetail(null);
          }
      } else {
          setAgeDetail(null);
      }
  };

  // Run calc on load or when dates change
  useEffect(() => {
      calculateAge();
  }, [formData.dob, formData.visit_date]);
  
  useEffect(() => {
      if (noJob) {
          setFormData(prev => ({ ...prev, job: 'Unemployed / No Job' }));
      } else if (formData.job === 'Unemployed / No Job') {
          setFormData(prev => ({ ...prev, job: '' }));
      }
  }, [noJob]);

  // Auto-fill new visit form if not editing
  useEffect(() => {
      if (activeTab === 'visits' && editingClient && !editingVisitId) {
          const lastVisit = visits.length > 0 ? visits[0] : null;
          // Try to extract body fat from kcal_data if available
          let lastBF = '';
          if (lastVisit?.kcal_data?.inputs?.bodyFatPercent) {
              lastBF = lastVisit.kcal_data.inputs.bodyFatPercent;
          }

          setNewVisitData(prev => ({
              ...prev,
              weight: lastVisit?.weight || editingClient.weight || '',
              height: lastVisit?.height || editingClient.height || '',
              waist: lastVisit?.waist || editingClient.waist || '',
              hip: lastVisit?.hip || editingClient.hip || '',
              miac: lastVisit?.miac || editingClient.miac || '',
              head_circumference: lastVisit?.head_circumference || editingClient.head_circumference || '',
              body_fat: lastBF || '',
              notes: ''
          }));
      }
  }, [activeTab, visits, editingClient, editingVisitId]);

  const generateCode = (name: string) => {
      if (!name) return '';
      const initials = name.trim().split(/\s+/).map(n => n[0]).join('').toUpperCase().slice(0, 3);
      const random = Math.floor(1000 + Math.random() * 9000);
      const year = new Date().getFullYear().toString().slice(-2);
      return `${initials}-${year}-${random}`;
  };

  const getDefaultNotes = (gender: 'male' | 'female') => {
      let notes = "";
      Object.keys(TAG_CATEGORIES).forEach(category => {
          if (category === "🌸 Female Only" && gender === "male") return;
          notes += `[${category}]\n-\n\n`;
      });
      notes += `[📝 Other Notes]\n-`;
      return notes;
  };

  const insertTemplate = () => {
      if (!confirm("This will append the default notes template to your existing notes. Continue?")) return;
      const template = getDefaultNotes(formData.gender);
      setFormData(prev => ({
          ...prev,
          notes: prev.notes ? prev.notes + "\n\n" + template : template
      }));
  };

  const fetchClients = async () => {
    if (!session) return;
    setLoading(true);
    setTableError(false);
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('doctor_id', session.user.id)
        .order('visit_date', { ascending: false });

      if (error) {
          if (error.code === '42P01' || error.message.includes('does not exist')) {
              setTableError(true);
          } else {
              throw error;
          }
      } else if (data) {
          setClients(data);
      }
    } catch (err: any) {
      console.error("Error fetching clients:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVisits = async (clientId: string) => {
      setLoadingVisits(true);
      try {
          const { data, error } = await supabase
            .from('client_visits')
            .select('*')
            .eq('client_id', clientId)
            .order('visit_date', { ascending: false });
          
          if (data) {
              setVisits(data);
          }
      } catch (err) {
          console.error("Error fetching visits:", err);
          setVisits([]);
      } finally {
          setLoadingVisits(false);
      }
  };

  const processedClients = useMemo(() => {
      let list = [...clients];
      if (searchQuery) {
          const q = searchQuery.toLowerCase();
          list = list.filter(c => 
              c.full_name.toLowerCase().includes(q) || 
              c.clinic?.toLowerCase().includes(q) ||
              c.phone?.includes(q) ||
              c.client_code?.toLowerCase().includes(q)
          );
      }
      list.sort((a, b) => {
          switch (sortBy) {
              case 'date_asc': return new Date(a.visit_date).getTime() - new Date(b.visit_date).getTime();
              case 'date_desc': return new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime();
              case 'name_asc': return a.full_name.localeCompare(b.full_name);
              case 'name_desc': return b.full_name.localeCompare(a.full_name);
              case 'clinic': return (a.clinic || '').localeCompare(b.clinic || '');
              default: return 0;
          }
      });
      return list;
  }, [clients, searchQuery, sortBy]);

  const groupedClients = useMemo<Record<string, Client[]>>(() => {
      if (groupBy === 'none') return { 'All Clients': processedClients };
      const groups: Record<string, Client[]> = {};
      processedClients.forEach(client => {
          let key = 'Other';
          if (groupBy === 'clinic') key = client.clinic || 'Unspecified Location';
          else if (groupBy === 'month') {
              const d = new Date(client.visit_date);
              key = d.toLocaleString('default', { month: 'long', year: 'numeric' });
          }
          if (!groups[key]) groups[key] = [];
          groups[key].push(client);
      });
      return groups;
  }, [processedClients, groupBy]);

  const chartData = useMemo(() => {
      if (!editingClient || visits.length === 0) return null;
      
      const sortedVisits = [...visits].sort((a, b) => new Date(a.visit_date).getTime() - new Date(b.visit_date).getTime());
      
      const mapData = (key: keyof ClientVisit) => {
          return sortedVisits
              .filter(v => v[key] !== null && v[key] !== undefined && Number(v[key]) > 0)
              .map(v => ({
                  label: new Date(v.visit_date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }),
                  value: Number(v[key])
              }));
      };

      // Handle custom extraction for Body Fat
      const bodyFatData = sortedVisits
        .filter(v => v.kcal_data?.inputs?.bodyFatPercent)
        .map(v => ({
            label: new Date(v.visit_date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }),
            value: Number(v.kcal_data.inputs.bodyFatPercent)
        }));

      return {
          weight: mapData('weight'),
          bmi: mapData('bmi'),
          waist: mapData('waist'),
          hip: mapData('hip'),
          miac: mapData('miac'),
          height: mapData('height'),
          head: mapData('head_circumference'),
          bodyFat: bodyFatData
      };

  }, [visits, editingClient]);


  const handleOpenProfile = (client?: Client) => {
    setFormError('');
    setSaveSuccess('');
    setActiveTab('profile');
    setExpandedCategory(null);
    setAllTagsExpanded(false);
    setSummaryText('');
    setExpandedPediatricCategory(null);
    setAgeDetail(null);
    setEditingVisitId(null);

    if (client) {
      setEditingClient(client);
      setNoJob(client.job === 'Unemployed / No Job');
      setFormData({
        client_code: client.client_code || generateCode(client.full_name),
        full_name: client.full_name,
        visit_date: client.visit_date,
        dob: client.dob || '',
        clinic: client.clinic || '',
        phone: client.phone || '',
        notes: client.notes || '', 
        age: client.age !== undefined ? client.age : '',
        gender: client.gender || 'male',
        marital_status: client.marital_status || 'single',
        kids_count: client.kids_count !== undefined ? client.kids_count : '',
        job: client.job || '',
        weight: client.weight || '',
        height: client.height || '',
        waist: client.waist || '',
        hip: client.hip || '',
        miac: client.miac || '',
        head_circumference: client.head_circumference || ''
      });
      fetchVisits(client.id);
    } else {
      setEditingClient(null);
      setVisits([]);
      setNoJob(false);
      setFormData({
        client_code: '',
        full_name: '',
        visit_date: new Date().toISOString().split('T')[0],
        dob: '',
        clinic: '',
        phone: '',
        notes: getDefaultNotes('male'), 
        age: '',
        gender: 'male',
        marital_status: 'single',
        kids_count: '',
        job: '',
        weight: '',
        height: '',
        waist: '',
        hip: '',
        miac: '',
        head_circumference: ''
      });
    }
    setViewMode('details');
  };

  const handleBackToList = () => {
      setViewMode('list');
      setEditingClient(null);
  };

  const addTag = (tag: string, categoryName: string) => {
      if (formData.notes.includes(tag)) return;
      const header = `[${categoryName}]`;
      const notes = formData.notes;
      if (notes.includes(header)) {
          const headerIndex = notes.indexOf(header);
          const lineBreakIndex = notes.indexOf('\n', headerIndex);
          const insertIndex = lineBreakIndex !== -1 ? lineBreakIndex + 1 : headerIndex + header.length;
          const newNotes = notes.slice(0, insertIndex) + (lineBreakIndex === -1 ? '\n' : '') + `• ${tag}\n` + notes.slice(insertIndex);
          setFormData(prev => ({ ...prev, notes: newNotes }));
      } else {
          setFormData(prev => ({
              ...prev,
              notes: (prev.notes ? prev.notes + '\n' : '') + `\n[${categoryName}]\n• ${tag}\n`
          }));
      }
  };
  
  const toggleAllTags = () => {
      const newState = !allTagsExpanded;
      setAllTagsExpanded(newState);
      if (newState) setExpandedCategory(null);
  };

  const handleSubmitProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name || !formData.visit_date) {
      setFormError("Name and Last Visit Date are required.");
      return;
    }
    setSubmitting(true);
    setSaveSuccess('');
    
    try {
      const payload = {
        doctor_id: session?.user.id,
        ...formData,
        dob: formData.dob === '' ? null : formData.dob,
        age: formData.age === '' ? null : Number(formData.age),
        kids_count: formData.kids_count === '' ? null : Number(formData.kids_count),
        client_code: formData.client_code || generateCode(formData.full_name),
        weight: formData.weight === '' ? null : Number(formData.weight),
        height: formData.height === '' ? null : Number(formData.height),
        waist: formData.waist === '' ? null : Number(formData.waist),
        hip: formData.hip === '' ? null : Number(formData.hip),
        miac: formData.miac === '' ? null : Number(formData.miac),
        head_circumference: formData.head_circumference === '' ? null : Number(formData.head_circumference),
        bmi: profileBMI ? Number(profileBMI) : null
      };

      let response;
      if (editingClient) {
        response = await supabase.from('clients').update(payload).eq('id', editingClient.id).select().single();
      } else {
        response = await supabase.from('clients').insert(payload).select().single();
      }

      if (response.error) throw response.error;

      if (response.data) {
        if (!editingClient && (payload.weight || payload.height)) {
            await supabase.from('client_visits').insert({
                client_id: response.data.id,
                visit_date: response.data.visit_date,
                weight: payload.weight,
                height: payload.height,
                waist: payload.waist,
                hip: payload.hip,
                miac: payload.miac,
                head_circumference: payload.head_circumference,
                bmi: payload.bmi,
                notes: "Initial Profile Visit"
            });
        }

        if (editingClient) {
          setClients(prev => prev.map(c => c.id === editingClient.id ? response.data : c));
          setEditingClient(response.data);
          setSaveSuccess("Saved successfully!");
          setTimeout(() => setSaveSuccess(''), 3000);
        } else {
          setClients(prev => [response.data, ...prev]);
          setEditingClient(response.data);
          fetchVisits(response.data.id); 
          setActiveTab('visits'); 
          setSaveSuccess("Client Created!");
          setTimeout(() => setSaveSuccess(''), 3000);
        }
      }
    } catch (err: any) {
      setFormError(err.message || "Failed to save client.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditVisit = (visit: ClientVisit) => {
      setEditingVisitId(visit.id);
      
      // Extract body fat from kcal_data
      let bf = '';
      if (visit.kcal_data?.inputs?.bodyFatPercent) {
          bf = visit.kcal_data.inputs.bodyFatPercent;
      }

      setNewVisitData({
          visit_date: visit.visit_date,
          weight: visit.weight || '',
          height: visit.height || '',
          waist: visit.waist || '',
          hip: visit.hip || '',
          miac: visit.miac || '',
          head_circumference: visit.head_circumference || '',
          body_fat: bf,
          notes: visit.notes || ''
      });
      // Scroll to form
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEditVisit = () => {
      setEditingVisitId(null);
      // Reset form to last visit defaults or blank
      const lastVisit = visits.length > 0 ? visits[0] : null;
      let lastBF = '';
      if (lastVisit?.kcal_data?.inputs?.bodyFatPercent) {
          lastBF = lastVisit.kcal_data.inputs.bodyFatPercent;
      }
      setNewVisitData({
          visit_date: new Date().toISOString().split('T')[0],
          weight: lastVisit?.weight || '',
          height: lastVisit?.height || '',
          waist: lastVisit?.waist || '',
          hip: lastVisit?.hip || '',
          miac: lastVisit?.miac || '',
          head_circumference: lastVisit?.head_circumference || '',
          body_fat: lastBF || '',
          notes: ''
      });
  };

  const handleSaveVisit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingClient) return;
      setSubmitting(true);
      try {
          const weight = newVisitData.weight === '' ? null : Number(newVisitData.weight);
          const height = newVisitData.height === '' ? null : Number(newVisitData.height);
          let bmi = null;
          if (weight && height) {
              bmi = Number((weight / ((height/100) * (height/100))).toFixed(1));
          }

          const kcalDataPayload = {
              inputs: {
                  bodyFatPercent: newVisitData.body_fat
              }
          };

          const payload = {
              client_id: editingClient.id,
              visit_date: newVisitData.visit_date,
              weight: weight,
              height: height,
              waist: newVisitData.waist === '' ? null : Number(newVisitData.waist),
              hip: newVisitData.hip === '' ? null : Number(newVisitData.hip),
              miac: newVisitData.miac === '' ? null : Number(newVisitData.miac),
              head_circumference: newVisitData.head_circumference === '' ? null : Number(newVisitData.head_circumference),
              bmi: bmi,
              notes: newVisitData.notes,
              kcal_data: newVisitData.body_fat ? kcalDataPayload : undefined
          };

          let data;
          if (editingVisitId) {
              // UPDATE
              const { data: updated, error } = await supabase.from('client_visits')
                  .update(payload)
                  .eq('id', editingVisitId)
                  .select().single();
              if (error) throw error;
              data = updated;
              // Update local state
              setVisits(prev => prev.map(v => v.id === editingVisitId ? data : v));
              setEditingVisitId(null);
          } else {
              // INSERT
              const { data: inserted, error } = await supabase.from('client_visits')
                  .insert(payload)
                  .select().single();
              if (error) throw error;
              data = inserted;
              setVisits(prev => [data, ...prev]);
          }

          if (data) {
              // Update Client Profile if this is the most recent visit
              if (new Date(data.visit_date) >= new Date(editingClient.visit_date)) {
                   const { data: updatedClient } = await supabase.from('clients').update({
                       visit_date: data.visit_date,
                       weight: data.weight,
                       height: data.height,
                       waist: data.waist,
                       hip: data.hip,
                       miac: data.miac,
                       head_circumference: data.head_circumference,
                       bmi: data.bmi
                   }).eq('id', editingClient.id).select().single();
                   
                   if (updatedClient) {
                       setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
                       setEditingClient(updatedClient);
                   }
              }
              if (!editingVisitId) {
                  setNewVisitData(prev => ({ ...prev, notes: '' }));
              }
          }
      } catch (err: any) {
          alert("Failed to save visit: " + err.message);
      } finally {
          setSubmitting(false);
      }
  };

  const handleDeleteVisit = async (visitId: string) => {
      if(!confirm("Delete this visit record?")) return;
      try {
          const { error } = await supabase.from('client_visits').delete().eq('id', visitId);
          if (error) throw error;
          setVisits(prev => prev.filter(v => v.id !== visitId));
      } catch (err) {
          console.error(err);
      }
  };

  const handleDeleteClient = async (id: string) => {
    if (!window.confirm(t.common.delete + " client and all history?")) return;
    try {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) throw error;
      setClients(prev => prev.filter(c => c.id !== id));
      if (editingClient?.id === id) {
          setViewMode('list');
          setEditingClient(null);
      }
    } catch (err: any) {
      alert("Error deleting client: " + err.message);
    }
  };

  const openKcalForVisit = (visit: ClientVisit) => {
      if (!editingClient || !onAnalyzeInKcal) return;
      onAnalyzeInKcal(editingClient, visit);
  };

  const openMealPlanForVisit = (visit: ClientVisit) => {
      if (!editingClient || !onPlanMeals) return;
      onPlanMeals(editingClient, visit);
  };

  const handleRunNFPE = () => {
      if (!editingClient || !onRunNFPE) return;
      onRunNFPE(editingClient);
  };

  const handlePrintReport = () => {
      window.print();
  };

  const handleSaveSTRONGKids = (resultText: string) => {
      if (!editingClient) return;
      const updatedNotes = formData.notes ? formData.notes + "\n\n" + resultText : resultText;
      setFormData(prev => ({ ...prev, notes: updatedNotes }));
      setViewMode('details');
      setSaveSuccess("STRONGkids assessment added to notes.");
      setTimeout(() => setSaveSuccess(''), 3000);
  };

  const handleSaveWaistAnalysis = (note: string) => {
      if (!editingClient) return;
      const updatedNotes = formData.notes ? formData.notes + "\n\n" + note : note;
      setFormData(prev => ({ ...prev, notes: updatedNotes }));
      setViewMode('details');
      setSaveSuccess("Waist analysis added to notes.");
      setTimeout(() => setSaveSuccess(''), 3000);
  };

  const handleSaveMAMC = (note: string) => {
      if (!editingClient) return;
      const updatedNotes = formData.notes ? formData.notes + "\n\n" + note : note;
      setFormData(prev => ({ ...prev, notes: updatedNotes }));
      setViewMode('details');
      setSaveSuccess("MAMC analysis added to notes.");
      setTimeout(() => setSaveSuccess(''), 3000);
  };

  const handleSaveGrowthCharts = (note: string) => {
      if (!editingClient) return;
      const updatedNotes = formData.notes ? formData.notes + "\n\n" + note : note;
      setFormData(prev => ({ ...prev, notes: updatedNotes }));
      setViewMode('details');
      setSaveSuccess("Growth Chart analysis added to notes.");
      setTimeout(() => setSaveSuccess(''), 3000);
  };

  // --- Lab Suggestions Handlers ---
  const toggleLabTest = (test: string) => {
      const newSet = new Set(labChecklistSelection);
      if (newSet.has(test)) newSet.delete(test);
      else newSet.add(test);
      setLabChecklistSelection(newSet);
  };

  const togglePanel = (tests: string[]) => {
      // If all selected, deselect all. Else select all.
      const allSelected = tests.every(t => labChecklistSelection.has(t));
      const newSet = new Set(labChecklistSelection);
      
      if (allSelected) {
          tests.forEach(t => newSet.delete(t));
      } else {
          tests.forEach(t => newSet.add(t));
      }
      setLabChecklistSelection(newSet);
  };

  const saveLabChecklistToNotes = () => {
      if (!editingClient || labChecklistSelection.size === 0) return;
      
      const dateStr = new Date().toLocaleDateString('en-GB');
      let labText = `\n\n[🧪 Requested Labs - ${dateStr}]\n`;
      
      Array.from(labChecklistSelection).forEach(test => {
          labText += `  - [ ] ${test}\n`;
      });

      setFormData(prev => ({
          ...prev,
          notes: prev.notes + labText
      }));
      
      setLabChecklistSelection(new Set()); // Clear selection
      setLabSearch(''); // Clear search
      setViewMode('details'); // Return to details
      setSaveSuccess("Labs added to notes! Don't forget to save profile.");
      setTimeout(() => setSaveSuccess(''), 3000);
  };

  // --- Summary Generator ---
  const generateSummary = () => {
      if (!editingClient) return;
      const sortedVisits = [...visits].sort((a, b) => new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime());
      
      let summary = `Client Summary Report - ${new Date().toLocaleDateString()}\n`;
      summary += `Name: ${editingClient.full_name} | Age: ${editingClient.age} | Gender: ${editingClient.gender}\n`;
      summary += `Clinic: ${editingClient.clinic || 'N/A'}\n`;
      summary += `--------------------------------------------------\n`;
      
      // Anthropometry
      summary += `Current Status:\n`;
      summary += `Weight: ${editingClient.weight || '-'} kg | Height: ${editingClient.height || '-'} cm | BMI: ${editingClient.bmi || '-'}\n`;
      if (editingClient.head_circumference) summary += `Head Circ: ${editingClient.head_circumference} cm\n`;
      
      // Weight History (Last 3)
      if (sortedVisits.length > 0) {
          summary += `\nRecent History:\n`;
          sortedVisits.slice(0, 3).forEach(v => {
              summary += `- ${new Date(v.visit_date).toLocaleDateString()}: ${v.weight || '-'} kg (BMI: ${v.bmi || '-'})\n`;
          });
      }

      // Notes Extract (Tags)
      const tags: string[] = [];
      if (editingClient.notes) {
          const lines = editingClient.notes.split('\n');
          lines.forEach(l => {
              if (l.trim().startsWith('•')) {
                  tags.push(l.trim().substring(1).trim());
              }
          });
      }
      if (tags.length > 0) {
          summary += `\nKey Medical History:\n`;
          summary += tags.join(', ') + '\n';
      }

      setSummaryText(summary);
  };

  // --- Tool Handlers ---
  const handleOpenTool = (view: 'dietary-recall' | 'food-questionnaire' | 'lab-checklist' | 'strong-kids' | 'pediatric-waist' | 'pediatric-mamc' | 'growth-charts' | 'instructions', type: 'client' | 'visit', id: string, initialData?: any) => {
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Auto-scroll to top
    if (view === 'lab-checklist') {
        // Lab Checklist is a special view acting on the profile notes
        setViewMode('lab-checklist');
        setLabChecklistSelection(new Set()); // Reset selection
    } else if (view === 'strong-kids') {
        setViewMode('strong-kids');
    } else if (view === 'pediatric-waist') {
        setViewMode('pediatric-waist');
        if (type === 'client') {
            setToolTarget({ type, id, initialData }); // Use toolTarget to store profile data for component props
        }
    } else if (view === 'pediatric-mamc') {
        setViewMode('pediatric-mamc');
        if (type === 'client') {
            setToolTarget({ type, id, initialData });
        }
    } else if (view === 'growth-charts') {
        setViewMode('growth-charts');
        if (type === 'client') {
            setToolTarget({ type, id, initialData });
        }
    } else if (view === 'instructions') {
        setViewMode('instructions');
    } else {
        setToolTarget({ type, id, initialData });
        setViewMode(view);
    }
  };

  const handleSaveDietary = async (data: DietaryAssessmentData) => {
    if (!toolTarget) return;
    setIsSavingTool(true);
    try {
      const table = toolTarget.type === 'client' ? 'clients' : 'client_visits';
      const { error } = await supabase.from(table).update({ dietary_assessment: data }).eq('id', toolTarget.id);
      
      if (error) throw error;

      if (toolTarget.type === 'client' && editingClient) {
        const updated = { ...editingClient, dietary_assessment: data };
        setEditingClient(updated);
        setClients((prev: Client[]) => prev.map(c => c.id === updated.id ? updated : c));
      } else {
        setVisits((prev: ClientVisit[]) => prev.map(v => v.id === toolTarget.id ? { ...v, dietary_assessment: data } : v));
      }
      
      setViewMode('details');
      setSaveSuccess("Dietary Assessment Saved!");
      setTimeout(() => setSaveSuccess(''), 3000);
    } catch (err: any) {
      alert("Failed to save dietary assessment: " + err.message);
    } finally {
      setIsSavingTool(false);
    }
  };

  const handleSaveFoodQ = async (data: FoodQuestionnaireData) => {
    if (!toolTarget) return;
    setIsSavingTool(true);
    try {
      const table = toolTarget.type === 'client' ? 'clients' : 'client_visits';
      const { error } = await supabase.from(table).update({ food_questionnaire: data }).eq('id', toolTarget.id);
      
      if (error) throw error;

      if (toolTarget.type === 'client' && editingClient) {
        const updated = { ...editingClient, food_questionnaire: data };
        setEditingClient(updated);
        setClients((prev: Client[]) => prev.map(c => c.id === updated.id ? updated : c));
      } else {
        setVisits((prev: ClientVisit[]) => prev.map(v => v.id === toolTarget.id ? { ...v, food_questionnaire: data } : v));
      }
      
      setViewMode('details');
      setSaveSuccess("Food Questionnaire Saved!");
      setTimeout(() => setSaveSuccess(''), 3000);
    } catch (err: any) {
      alert("Failed to save food questionnaire: " + err.message);
    } finally {
      setIsSavingTool(false);
    }
  };

  // --- RENDER: INSTRUCTIONS VIEW ---
  if (viewMode === 'instructions') {
      return (
          <div className="animate-fade-in">
              <InstructionsLibrary onClose={() => setViewMode('details')} />
          </div>
      );
  }

  // --- RENDER: STRONG KIDS VIEW ---
  if (viewMode === 'strong-kids') {
      return (
          <div className="animate-fade-in">
              <STRONGKids onSave={handleSaveSTRONGKids} onClose={() => setViewMode('details')} />
          </div>
      );
  }

  // --- RENDER: PEDIATRIC WAIST VIEW ---
  if (viewMode === 'pediatric-waist') {
      return (
          <div className="animate-fade-in">
              <PediatricWaist 
                  initialGender={formData.gender}
                  initialAge={formData.age !== '' ? Number(formData.age) : undefined}
                  initialWaist={formData.waist !== '' ? Number(formData.waist) : undefined}
                  onSave={handleSaveWaistAnalysis}
                  onClose={() => setViewMode('details')} 
              />
          </div>
      );
  }

  // --- RENDER: PEDIATRIC MAMC VIEW ---
  if (viewMode === 'pediatric-mamc') {
      return (
          <div className="animate-fade-in">
              <PediatricMAMC
                  initialGender={formData.gender}
                  initialAge={formData.age !== '' ? Number(formData.age) : undefined}
                  initialMac={formData.miac !== '' ? Number(formData.miac) : undefined}
                  onSave={handleSaveMAMC}
                  onClose={() => setViewMode('details')}
              />
          </div>
      );
  }

  // --- RENDER: GROWTH CHARTS VIEW ---
  if (viewMode === 'growth-charts') {
      return (
          <div className="animate-fade-in">
              <GrowthCharts
                  initialData={{
                      name: editingClient?.full_name || '',
                      gender: formData.gender,
                      age: formData.age !== '' ? Number(formData.age) : 0,
                      weight: formData.weight !== '' ? Number(formData.weight) : undefined,
                      height: formData.height !== '' ? Number(formData.height) : undefined,
                      head_circumference: formData.head_circumference !== '' ? Number(formData.head_circumference) : undefined,
                      bmi: profileBMI ? Number(profileBMI) : undefined
                  }}
                  onSave={handleSaveGrowthCharts}
                  onClose={() => setViewMode('details')}
              />
          </div>
      );
  }

  // --- RENDER: DIETARY RECALL VIEW ---
  if (viewMode === 'dietary-recall' && toolTarget) {
      return (
          <div className="h-[calc(100vh-100px)] animate-fade-in">
              <DietaryAssessment 
                  initialData={toolTarget.initialData}
                  onSave={handleSaveDietary}
                  onClose={() => setViewMode('details')}
                  isSaving={isSavingTool}
              />
          </div>
      );
  }

  // --- RENDER: FOOD QUESTIONNAIRE VIEW ---
  if (viewMode === 'food-questionnaire' && toolTarget) {
      return (
          <div className="h-[calc(100vh-100px)] animate-fade-in">
              <FoodQuestionnaire
                  initialData={toolTarget.initialData}
                  onSave={handleSaveFoodQ}
                  onClose={() => setViewMode('details')}
                  isSaving={isSavingTool}
              />
          </div>
      );
  }

  // --- RENDER: LAB CHECKLIST VIEW ---
  if (viewMode === 'lab-checklist') {
      return (
          <div className="max-w-5xl mx-auto animate-fade-in pb-12">
              <LabReference /> 
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6 flex justify-between items-center">
                  <div>
                      <h2 className="text-2xl font-bold text-blue-800 flex items-center gap-2">
                          <span>🧪</span> Lab Request Checklist
                      </h2>
                      <p className="text-blue-600 text-sm">Select tests to add to client notes.</p>
                  </div>
                  <button onClick={() => { setLabSearch(''); setViewMode('details'); }} className="bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50 transition shadow-sm font-medium text-sm">
                      {t.common.back}
                  </button>
              </div>

              {/* Quick Select Panels */}
              <div className="mb-8">
                  <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
                      <span className="text-xl">⚡</span> Quick Select Panels
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {labPanels.map((panel: LabPanel) => (
                      <div key={panel.id} className="bg-white rounded-xl shadow-sm border border-blue-100 overflow-hidden hover:shadow-md transition">
                          <div className="bg-blue-50 p-4 border-b border-blue-100 flex justify-between items-center">
                              <div>
                                  <h3 className="font-bold text-blue-900">{panel.title}</h3>
                                  <p className="text-xs text-blue-700 font-arabic">{panel.titleAr}</p>
                              </div>
                              <button 
                                  onClick={() => togglePanel(panel.tests)}
                                  className="text-xs bg-white text-blue-600 px-3 py-1 rounded border border-blue-200 hover:bg-blue-50"
                              >
                                  Toggle
                              </button>
                          </div>
                          <div className="p-3 text-xs text-gray-600 space-y-1">
                              {panel.tests.map(test => {
                                  const isSelected = labChecklistSelection.has(test);
                                  return (
                                      <div key={test} onClick={() => toggleLabTest(test)} className={`flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded ${isSelected ? 'font-bold text-blue-700' : ''}`}>
                                          <span className={`w-3 h-3 rounded-full border flex-shrink-0 ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}></span>
                                          {test}
                                      </div>
                                  )
                              })}
                          </div>
                      </div>
                    ))}
                  </div>
              </div>

              {/* Full Library Section */}
              <div className="space-y-6">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-t border-gray-200 pt-6">
                      <h3 className="text-lg font-bold text-gray-700 flex items-center gap-2">
                          <span className="text-xl">🧬</span> Full Laboratory Database
                      </h3>
                      <div className="relative w-full md:w-96">
                          <input 
                              type="text" 
                              placeholder="Search all lab tests..." 
                              value={labSearch}
                              onChange={(e) => setLabSearch(e.target.value)}
                              className="w-full p-2.5 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                      </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {Object.entries(fullLabCategories).map(([category, items]) => (
                          <div key={category} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 font-bold text-gray-700 text-sm uppercase tracking-wide">
                                  {category}
                              </div>
                              <div className="divide-y divide-gray-100">
                                  {(items as LabTestItem[]).map((item) => {
                                      const isSelected = labChecklistSelection.has(item.test);
                                      return (
                                          <div 
                                              key={item.test} 
                                              onClick={() => toggleLabTest(item.test)}
                                              className={`p-3 cursor-pointer flex justify-between items-center hover:bg-blue-50 transition ${isSelected ? 'bg-blue-50' : 'bg-white'}`}
                                          >
                                              <div className="flex items-center gap-3">
                                                  <div className={`w-5 h-5 rounded border flex items-center justify-center bg-white flex-shrink-0 ${isSelected ? 'border-blue-500' : 'border-gray-300'}`}>
                                                      {isSelected && <span className="text-blue-600 text-sm font-bold">✓</span>}
                                                  </div>
                                                  <div>
                                                      <div className={`text-sm ${isSelected ? 'text-blue-900 font-bold' : 'text-gray-800 font-medium'}`}>
                                                          {item.test}
                                                      </div>
                                                      <div className="text-xs text-gray-400 font-mono">
                                                          Range: {item.normal}
                                                      </div>
                                                  </div>
                                              </div>
                                          </div>
                                      );
                                  })}
                              </div>
                          </div>
                      ))}
                      {Object.keys(fullLabCategories).length === 0 && (
                          <div className="col-span-full text-center py-10 text-gray-400 border border-dashed rounded-lg">
                              No lab tests found matching "{labSearch}"
                          </div>
                      )}
                  </div>
              </div>

              <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-4 z-50 flex justify-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                  <div className="w-full max-w-5xl flex justify-between items-center px-4">
                      <div className="text-sm text-gray-500">
                          {labChecklistSelection.size} tests selected
                      </div>
                      <div className="flex gap-4">
                          <button 
                              onClick={() => { setLabSearch(''); setViewMode('details'); }}
                              className="px-6 py-2 rounded-lg text-gray-600 hover:bg-gray-100 font-medium transition"
                          >
                              {t.common.cancel}
                          </button>
                          <button 
                              onClick={saveLabChecklistToNotes}
                              disabled={labChecklistSelection.size === 0}
                              className="px-8 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                              Add to Notes
                          </button>
                      </div>
                  </div>
              </div>
              <div className="h-20"></div> {/* Spacer for fixed footer */}
          </div>
      );
  }

  // --- RENDER: LIST VIEW ---
  if (viewMode === 'list') {
    return (
        <div className="max-w-7xl mx-auto animate-fade-in space-y-6 pb-12">
          {/* Header */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-[var(--color-heading)] flex items-center gap-2">
                <span>👥</span> {t.clients.title}
              </h1>
              <p className="text-gray-500 text-sm mt-1">{t.tools.clients.desc}</p>
            </div>
            <button 
              onClick={() => handleOpenProfile()}
              disabled={tableError}
              className={`text-white px-6 py-3 rounded-lg shadow-md transition flex items-center gap-2 font-medium ${tableError ? 'bg-gray-300 cursor-not-allowed' : 'bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]'}`}
            >
              <span>+</span> {t.clients.addClient}
            </button>
          </div>
    
          {/* Search */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
             <div className="md:col-span-2 relative">
                <input 
                type="text"
                placeholder={`${t.common.search} (Name, Code, Clinic)`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={tableError}
                className="w-full p-3 pl-10 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[var(--color-primary)] outline-none disabled:bg-gray-50"
                dir={isRTL ? 'rtl' : 'ltr'}
                />
                <span className={`absolute top-1/2 -translate-y-1/2 text-gray-400 text-lg ${isRTL ? 'right-3' : 'left-3'}`}>🔍</span>
             </div>
             <div className="flex items-center gap-2">
                 <label className="text-xs font-bold text-gray-500 uppercase">Sort:</label>
                 <select 
                    className="flex-grow p-2 rounded-lg border border-gray-200 text-sm bg-white"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                 >
                     <option value="date_desc">Date (Newest)</option>
                     <option value="date_asc">Date (Oldest)</option>
                     <option value="name_asc">Name (A-Z)</option>
                     <option value="name_desc">Name (Z-A)</option>
                     <option value="clinic">Clinic</option>
                 </select>
             </div>
             <div className="flex items-center gap-2">
                 <label className="text-xs font-bold text-gray-500 uppercase">Group:</label>
                 <select 
                    className="flex-grow p-2 rounded-lg border border-gray-200 text-sm bg-white"
                    value={groupBy}
                    onChange={(e) => setGroupBy(e.target.value as GroupOption)}
                 >
                     <option value="none">None</option>
                     <option value="clinic">Location / Clinic</option>
                     <option value="month">Month</option>
                 </select>
             </div>
          </div>
    
          {/* List Content */}
          {tableError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-700 animate-fade-in">
                <h3 className="text-lg font-bold mb-2">Database Configuration Error</h3>
                <p>The 'clients' table could not be found in the database schema.</p>
                <p className="text-sm mt-2">Please contact the administrator to initialize the database tables.</p>
            </div>
          )}
          {!tableError && !loading && (
              <div className="space-y-8">
                  {Object.entries(groupedClients).map(([groupName, groupList]: [string, Client[]]) => (
                      <div key={groupName} className="animate-fade-in">
                          {groupBy !== 'none' && (
                              <h3 className="text-lg font-bold text-gray-700 mb-3 pl-2 border-l-4 border-[var(--color-primary)]">
                                  {groupName} <span className="text-sm font-normal text-gray-400">({groupList.length})</span>
                              </h3>
                          )}
                          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                             {groupList.length === 0 ? (
                                 <div className="p-8 text-center text-gray-400">No clients found.</div>
                             ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 text-gray-600 uppercase text-xs font-bold">
                                            <tr>
                                            <th className="p-4 text-left">{t.clients.name}</th>
                                            <th className="p-4 text-center hidden md:table-cell">Code</th>
                                            <th className="p-4 text-center">{t.clients.visitDate}</th>
                                            <th className="p-4 text-center hidden sm:table-cell">{t.clients.clinic}</th>
                                            <th className="p-4 text-center">{t.common.actions}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {groupList.map(client => (
                                                <tr key={client.id} className="hover:bg-blue-50 transition group">
                                                    <td className="p-4">
                                                        <div className="font-bold text-gray-800 text-lg flex items-center gap-2">
                                                        {client.full_name}
                                                        {client.gender && (
                                                            <span className="text-sm" title={client.gender}>
                                                            {client.gender === 'male' ? '👨' : '👩'}
                                                            </span>
                                                        )}
                                                        </div>
                                                        <div className="flex gap-3 text-xs text-gray-500 mt-1">
                                                            {client.age && <span>{t.clients.age}: {client.age}</span>}
                                                            {client.phone && <span>📞 {client.phone}</span>}
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-center hidden md:table-cell text-xs font-mono text-gray-500">
                                                        {client.client_code || '-'}
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-sm font-mono">
                                                        {formatDateUK(client.visit_date)}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-center text-gray-600 hidden sm:table-cell">
                                                        {client.clinic || '-'}
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button 
                                                            onClick={() => handleOpenProfile(client)}
                                                            className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition text-sm font-medium"
                                                            >
                                                            View
                                                            </button>
                                                            <button 
                                                            onClick={() => handleDeleteClient(client.id)}
                                                            className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition"
                                                            title={t.common.delete}
                                                            >
                                                            🗑️
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                             )}
                          </div>
                      </div>
                  ))}
              </div>
          )}
          {loading && <Loading />}
        </div>
      );
  }

  // --- RENDER: PROFILE (DETAILS) VIEW ---
  return (
    <div className="max-w-[1920px] mx-auto animate-fade-in pb-12">
         {/* Print Only View */}
         {editingClient && <ClientPrintView client={editingClient} visits={visits} />}

         {/* Profile Header */}
         <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 no-print">
           <div className="flex items-center gap-4">
               <button 
                  onClick={handleBackToList}
                  className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg shadow-sm hover:bg-gray-50 transition flex items-center gap-2"
               >
                   <span>←</span> Back to List
               </button>
               <h2 className="text-2xl font-bold text-gray-800">
                   {editingClient ? editingClient.full_name : t.clients.addClient}
               </h2>
           </div>
           {editingClient && (
               <div className="flex bg-white rounded-lg p-1 border border-gray-200 shadow-sm overflow-x-auto">
                   <button 
                    onClick={() => setActiveTab('profile')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition whitespace-nowrap ${activeTab === 'profile' ? 'bg-blue-50 text-[var(--color-primary)] ring-1 ring-[var(--color-primary)]' : 'text-gray-600 hover:bg-gray-50'}`}
                   >
                       Profile
                   </button>
                   <button 
                    onClick={() => setActiveTab('visits')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition whitespace-nowrap ${activeTab === 'visits' ? 'bg-blue-50 text-[var(--color-primary)] ring-1 ring-[var(--color-primary)]' : 'text-gray-600 hover:bg-gray-50'}`}
                   >
                       History ({visits.length})
                   </button>
                   <button 
                    onClick={() => setActiveTab('report')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition whitespace-nowrap ${activeTab === 'report' ? 'bg-blue-50 text-[var(--color-primary)] ring-1 ring-[var(--color-primary)]' : 'text-gray-600 hover:bg-gray-50'}`}
                   >
                       Report & Charts
                   </button>
               </div>
           )}
         </div>
         
         <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden no-print">
            {formError && <div className="bg-red-50 text-red-600 p-3 m-4 rounded-lg border border-red-100 no-print">{formError}</div>}
            {saveSuccess && <div className="bg-green-50 text-green-600 p-3 m-4 rounded-lg border border-green-100 no-print">{saveSuccess}</div>}
            
            {/* TAB: PROFILE */}
            {activeTab === 'profile' && (
                 <div className="p-6">
                    <form id="clientForm" onSubmit={handleSubmitProfile} className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                             
                             {/* Left Col: Info & Measurements (Span 7) */}
                             <div className="lg:col-span-7 space-y-6">
                                {/* Core Identity */}
                                <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                                    <h3 className="font-bold text-gray-700 text-sm uppercase border-b pb-2 mb-2">Core Identity</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="col-span-1 md:col-span-2">
                                            <label className="block text-xs font-bold text-gray-500 mb-1">{t.clients.name} *</label>
                                            <input 
                                                type="text" required
                                                value={formData.full_name}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    setFormData(prev => ({...prev, full_name: val, client_code: prev.client_code || generateCode(val)}));
                                                }}
                                                className="w-full p-2 border rounded focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 mb-1">Gender</label>
                                            <select 
                                                value={formData.gender}
                                                onChange={e => setFormData({...formData, gender: e.target.value as 'male' | 'female'})}
                                                className="w-full p-2 border rounded outline-none bg-white text-sm"
                                            >
                                                <option value="male">{t.kcal.male}</option>
                                                <option value="female">{t.kcal.female}</option>
                                            </select>
                                        </div>
                                        
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 mb-1">Visit Date</label>
                                            <div className="flex gap-2">
                                                <input 
                                                    type="date" 
                                                    value={formData.visit_date}
                                                    onChange={e => setFormData({...formData, visit_date: e.target.value})}
                                                    className="w-full p-2 border rounded outline-none text-sm"
                                                />
                                                <button 
                                                    type="button" 
                                                    onClick={() => setFormData({...formData, visit_date: new Date().toISOString().split('T')[0]})}
                                                    className="px-2 bg-gray-200 text-xs rounded hover:bg-gray-300 whitespace-nowrap"
                                                    title="Set to Today"
                                                >
                                                    Today
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 mb-1">Date of Birth (Auto-Calc Age)</label>
                                            <input 
                                                type="date" 
                                                value={formData.dob}
                                                onChange={e => setFormData({...formData, dob: e.target.value})}
                                                className="w-full p-2 border rounded outline-none text-sm"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 mb-1">
                                                Age (Years) 
                                                {ageDetail && <span className="text-[10px] font-normal text-blue-600 ml-1 bg-blue-50 px-1 rounded">({ageDetail.y}y {ageDetail.m}m {ageDetail.d}d)</span>}
                                            </label>
                                            <input 
                                                type="number" 
                                                value={formData.age}
                                                onChange={e => setFormData({...formData, age: e.target.value === '' ? '' : Number(e.target.value)})}
                                                className="w-full p-2 border rounded outline-none text-sm font-bold text-gray-800 focus:ring-2 focus:ring-[var(--color-primary)]"
                                                placeholder="Enter manually"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 mb-1">Phone</label>
                                            <input 
                                                type="text" 
                                                value={formData.phone}
                                                onChange={e => setFormData({...formData, phone: e.target.value})}
                                                className="w-full p-2 border rounded outline-none text-sm"
                                                dir="ltr"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Marital & Job */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Marital Status</label>
                                        <select 
                                            value={formData.marital_status}
                                            onChange={e => setFormData({...formData, marital_status: e.target.value})}
                                            className="w-full p-2 border rounded outline-none bg-white text-sm"
                                        >
                                            <option value="single">Single</option>
                                            <option value="married">Married</option>
                                            <option value="divorced">Divorced</option>
                                            <option value="widowed">Widowed</option>
                                        </select>
                                    </div>
                                    {formData.marital_status !== 'single' ? (
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 mb-1">Kids Count</label>
                                            <input 
                                                type="number" 
                                                value={formData.kids_count}
                                                onChange={e => setFormData({...formData, kids_count: e.target.value === '' ? '' : Number(e.target.value)})}
                                                className="w-full p-2 border rounded outline-none text-sm"
                                            />
                                        </div>
                                    ) : <div></div>}
                                    <div className="col-span-2">
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Job / Occupation</label>
                                        <div className="flex gap-2">
                                            <input 
                                                type="text" 
                                                value={formData.job}
                                                disabled={noJob}
                                                onChange={e => setFormData({...formData, job: e.target.value})}
                                                className="flex-grow p-2 border rounded outline-none text-sm disabled:bg-gray-100"
                                            />
                                            <label className="flex items-center gap-1 text-xs cursor-pointer whitespace-nowrap">
                                                <input 
                                                    type="checkbox" 
                                                    checked={noJob} 
                                                    onChange={e => setNoJob(e.target.checked)}
                                                />
                                                No Job
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* Measurements */}
                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                     <h3 className="font-bold text-blue-800 text-xs uppercase mb-3">1st Visit Measurements</h3>
                                     <div className="grid grid-cols-3 gap-4">
                                         <div>
                                             <label className="block text-[10px] font-bold text-blue-600 uppercase">Weight (kg)</label>
                                             <input type="number" className="w-full p-1.5 text-sm border rounded" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value === '' ? '' : Number(e.target.value)})} />
                                         </div>
                                         <div>
                                             <label className="block text-[10px] font-bold text-blue-600 uppercase">
                                                 {ageDetail && (ageDetail.y * 12 + ageDetail.m) < 24 ? 'Length (cm)' : 'Height (cm)'}
                                             </label>
                                             <input type="number" className="w-full p-1.5 text-sm border rounded" value={formData.height} onChange={e => setFormData({...formData, height: e.target.value === '' ? '' : Number(e.target.value)})} />
                                         </div>
                                         
                                         {/* Pediatric: Head Circ (Up to 36 months) */}
                                         {ageDetail && (ageDetail.y * 12 + ageDetail.m) <= 36 ? (
                                             <div>
                                                 <label className="block text-[10px] font-bold text-blue-600 uppercase">Head Circ. (cm)</label>
                                                 <input type="number" className="w-full p-1.5 text-sm border rounded" value={formData.head_circumference} onChange={e => setFormData({...formData, head_circumference: e.target.value === '' ? '' : Number(e.target.value)})} />
                                             </div>
                                         ) : (
                                             <div>
                                                 <label className="block text-[10px] font-bold text-blue-600 uppercase">BMI</label>
                                                 <div className="w-full p-1.5 text-sm border rounded bg-white font-mono text-center">{profileBMI || '-'}</div>
                                             </div>
                                         )}

                                         <div>
                                             <label className="block text-[10px] font-bold text-blue-600 uppercase">Waist (cm)</label>
                                             <div className="flex gap-1">
                                                 <input type="number" className="w-full p-1.5 text-sm border rounded" value={formData.waist} onChange={e => setFormData({...formData, waist: e.target.value === '' ? '' : Number(e.target.value)})} />
                                                 {/* Pediatric Waist Tool Link */}
                                                 {formData.age !== '' && Number(formData.age) >= 2 && Number(formData.age) <= 19 && (
                                                     <button 
                                                        type="button" 
                                                        onClick={() => handleOpenTool('pediatric-waist', 'client', editingClient?.id || '', { gender: formData.gender, age: formData.age, waist: formData.waist })}
                                                        className="px-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded text-[10px] font-bold border border-blue-200"
                                                        title="Pediatric Waist Percentile Tool"
                                                     >
                                                         📉 %
                                                     </button>
                                                 )}
                                             </div>
                                         </div>
                                         <div>
                                             <label className="block text-[10px] font-bold text-blue-600 uppercase">Hip (cm)</label>
                                             <input type="number" className="w-full p-1.5 text-sm border rounded" value={formData.hip} onChange={e => setFormData({...formData, hip: e.target.value === '' ? '' : Number(e.target.value)})} />
                                         </div>
                                         <div>
                                             <label className="block text-[10px] font-bold text-blue-600 uppercase">MIAC (cm)</label>
                                             <div className="flex gap-1">
                                                 <input type="number" className="w-full p-1.5 text-sm border rounded" value={formData.miac} onChange={e => setFormData({...formData, miac: e.target.value === '' ? '' : Number(e.target.value)})} />
                                                 {/* Pediatric MAMC Tool Link */}
                                                 {formData.age !== '' && Number(formData.age) >= 2 && Number(formData.age) <= 19 && (
                                                     <button 
                                                        type="button" 
                                                        onClick={() => handleOpenTool('pediatric-mamc', 'client', editingClient?.id || '', { gender: formData.gender, age: formData.age, mac: formData.miac })}
                                                        className="px-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded text-[10px] font-bold border border-blue-200"
                                                        title="MAC/MAMC Analysis Tool"
                                                     >
                                                         📉 MAC
                                                     </button>
                                                 )}
                                             </div>
                                         </div>
                                     </div>
                                </div>

                                {/* Pediatric History Tags */}
                                {(formData.age !== '' && Number(formData.age) < 20) && (
                                    <div className="bg-pink-50 p-5 rounded-xl border border-pink-100">
                                        <div className="flex justify-between items-center mb-4 border-b border-pink-200 pb-2">
                                            <h3 className="font-bold text-pink-700 text-sm uppercase">
                                                👶 Pediatric Assessment
                                            </h3>
                                            <div className="flex gap-2">
                                                <button 
                                                    type="button"
                                                    onClick={() => handleOpenTool('strong-kids', 'client', editingClient?.id || '')}
                                                    className="text-xs bg-white text-pink-600 px-3 py-1 rounded border border-pink-300 font-bold hover:bg-pink-100 transition"
                                                >
                                                    STRONGkids
                                                </button>
                                                <button 
                                                    type="button"
                                                    onClick={() => handleOpenTool('growth-charts', 'client', editingClient?.id || '', { name: formData.full_name, gender: formData.gender, age: formData.age, weight: formData.weight, height: formData.height, head_circumference: formData.head_circumference, bmi: profileBMI })}
                                                    className="text-xs bg-blue-600 text-white px-3 py-1 rounded border border-blue-600 font-bold hover:bg-blue-700 transition"
                                                >
                                                    📈 Growth Charts
                                                </button>
                                            </div>
                                        </div>
                                        <p className="text-xs text-pink-600 mb-3 opacity-80">Click a tag to add it to notes.</p>
                                        
                                        <div className="space-y-3">
                                            {Object.entries(PEDIATRIC_TAG_CATEGORIES).map(([category, tags]) => {
                                                const isExpanded = expandedPediatricCategory === category;
                                                return (
                                                    <div key={category} className="bg-white rounded-lg border border-pink-200 overflow-hidden">
                                                        <button 
                                                            type="button"
                                                            onClick={() => setExpandedPediatricCategory(isExpanded ? null : category)}
                                                            className="w-full px-3 py-2 text-left flex justify-between items-center hover:bg-pink-50 transition"
                                                        >
                                                            <span className="text-xs font-bold text-pink-700">{category}</span>
                                                            <span className="text-pink-400 text-xs">{isExpanded ? '▲' : '▼'}</span>
                                                        </button>
                                                        
                                                        {isExpanded && (
                                                            <div className="p-3 flex flex-wrap gap-2 bg-pink-50/30">
                                                                {tags.map(tag => (
                                                                    <button
                                                                        key={tag}
                                                                        type="button"
                                                                        onClick={() => addTag(tag, category)}
                                                                        className="px-2 py-1 bg-white hover:bg-pink-100 text-gray-700 text-xs rounded border border-pink-200 hover:border-pink-300 transition shadow-sm"
                                                                    >
                                                                        + {tag}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                             </div>

                             {/* Right Col: Notes (Span 5) */}
                             <div className="lg:col-span-5 h-full flex flex-col">
                                 <div className="sticky top-4">
                                     <div className="flex justify-between items-center mb-2">
                                         <div className="flex gap-2 items-center flex-wrap">
                                            <label className="block text-xs font-bold text-gray-500">📝 Medical Notes & History</label>
                                            <button type="button" onClick={insertTemplate} className="text-xs bg-gray-100 px-2 py-0.5 rounded border hover:bg-gray-200 text-gray-600">
                                                Template
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={handleRunNFPE}
                                                className="text-xs bg-red-100 px-2 py-0.5 rounded border border-red-200 hover:bg-red-200 text-red-700 font-bold flex items-center gap-1"
                                            >
                                                🩺 NFPE
                                            </button>
                                            {editingClient && (
                                                <>
                                                <button 
                                                    type="button"
                                                    onClick={() => handleOpenTool('lab-checklist', 'client', editingClient.id)}
                                                    className="text-xs bg-blue-100 px-2 py-0.5 rounded border border-blue-200 hover:bg-blue-200 text-blue-800 font-bold flex items-center gap-1"
                                                >
                                                    🧪 Labs
                                                </button>
                                                <button 
                                                    type="button"
                                                    onClick={() => handleOpenTool('dietary-recall', 'client', editingClient.id, editingClient.dietary_assessment)}
                                                    className="text-xs bg-yellow-100 px-2 py-0.5 rounded border border-yellow-200 hover:bg-yellow-200 text-yellow-800 font-bold flex items-center gap-1"
                                                >
                                                    📅 Recall
                                                </button>
                                                <button 
                                                    type="button"
                                                    onClick={() => handleOpenTool('food-questionnaire', 'client', editingClient.id, editingClient.food_questionnaire)}
                                                    className="text-xs bg-green-100 px-2 py-0.5 rounded border border-green-200 hover:bg-green-200 text-green-800 font-bold flex items-center gap-1"
                                                >
                                                    🥗 Food Q.
                                                </button>
                                                <button 
                                                    type="button"
                                                    onClick={() => handleOpenTool('instructions', 'client', editingClient.id)}
                                                    className="text-xs bg-gray-100 px-2 py-0.5 rounded border border-gray-300 hover:bg-gray-200 text-gray-800 font-bold flex items-center gap-1"
                                                >
                                                    📋 Instructions
                                                </button>
                                                </>
                                            )}
                                         </div>
                                         <button 
                                            type="button"
                                            onClick={toggleAllTags}
                                            className="text-xs text-white bg-[var(--color-primary)] px-3 py-1 rounded font-medium hover:bg-[var(--color-primary-hover)] shadow-sm"
                                         >
                                             {allTagsExpanded ? 'Collapse' : 'Expand'}
                                         </button>
                                     </div>
                                     
                                     <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 mb-4 max-h-60 overflow-y-auto">
                                        {Object.entries(TAG_CATEGORIES).map(([category, tags]) => {
                                            if (category === "🌸 Female Only" && formData.gender === "male") return null;
                                            const isExpanded = allTagsExpanded || expandedCategory === category;
                                            return (
                                                <div key={category} className="bg-white first:rounded-t-lg last:rounded-b-lg">
                                                    <button 
                                                        type="button"
                                                        onClick={() => setExpandedCategory(isExpanded && !allTagsExpanded ? null : category)}
                                                        className="w-full px-4 py-2 text-left flex justify-between items-center hover:bg-gray-50 transition"
                                                    >
                                                        <span className="text-sm font-medium text-gray-700">{category}</span>
                                                        {!allTagsExpanded && (
                                                            <span className="text-gray-400">{isExpanded ? '▲' : '▼'}</span>
                                                        )}
                                                    </button>
                                                    {isExpanded && (
                                                        <div className="px-4 pb-3 pt-1 flex flex-wrap gap-2 animate-fade-in bg-gray-50/50 border-t border-gray-50">
                                                            {tags.map(tag => (
                                                                <button
                                                                    key={tag}
                                                                    type="button"
                                                                    onClick={() => addTag(tag, category)}
                                                                    className="px-2 py-1 bg-white hover:bg-blue-50 text-gray-700 text-xs rounded border border-gray-200 hover:border-blue-300 transition shadow-sm"
                                                                >
                                                                    + {tag}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                     </div>

                                     <textarea 
                                        rows={16}
                                        value={formData.notes}
                                        onChange={e => setFormData({...formData, notes: e.target.value})}
                                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none resize-y whitespace-pre-wrap text-sm font-mono bg-gray-50 focus:bg-white min-h-[400px]"
                                        placeholder="Clinical notes appear here..."
                                    ></textarea>
                                 </div>
                             </div>
                        </div>

                        <div className="flex justify-between pt-4 border-t border-gray-100">
                            {editingClient && (
                                <button 
                                    type="button"
                                    onClick={() => window.print()}
                                    className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition"
                                >
                                    🖨️ Print Full Profile
                                </button>
                            )}
                            <button 
                                type="submit" 
                                disabled={submitting}
                                className="px-8 py-3 rounded-lg bg-[var(--color-primary)] text-white font-bold hover:bg-[var(--color-primary-hover)] transition disabled:opacity-50 shadow-md ml-auto"
                            >
                                {submitting ? 'Saving...' : t.common.save}
                            </button>
                        </div>
                    </form>
                 </div>
            )}

            {/* TAB: VISITS */}
            {activeTab === 'visits' && editingClient && (
                <div className="p-6 space-y-8 animate-fade-in">
                    {/* New/Edit Visit Form */}
                    <div className={`p-5 rounded-xl border shadow-sm ${editingVisitId ? 'bg-yellow-50 border-yellow-200' : 'bg-blue-50 border-blue-100'}`}>
                        <div className="flex justify-between items-center mb-3">
                            <h4 className={`font-bold text-sm uppercase ${editingVisitId ? 'text-yellow-800' : 'text-blue-800'}`}>
                                {editingVisitId ? `Edit Visit Record` : 'Record New Follow-up'}
                            </h4>
                            {editingVisitId && (
                                <button 
                                    onClick={handleCancelEditVisit}
                                    className="text-xs bg-white border border-red-200 text-red-600 px-3 py-1 rounded hover:bg-red-50"
                                >
                                    Cancel Edit
                                </button>
                            )}
                        </div>
                        {!editingVisitId && (
                             <div className="text-xs text-blue-600 mb-3 opacity-80">
                                * Data auto-filled from previous visit. Adjust as needed.
                            </div>
                        )}
                        <form onSubmit={handleSaveVisit} className="space-y-4">
                            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                                    <div className="md:col-span-2">
                                        <label className={`block text-[10px] uppercase font-bold mb-1 ${editingVisitId ? 'text-yellow-700' : 'text-blue-600'}`}>Date</label>
                                        <input 
                                        type="date" 
                                        required
                                        className={`w-full p-2 rounded border text-sm ${editingVisitId ? 'border-yellow-300 focus:ring-yellow-400' : 'border-blue-200 focus:ring-blue-400'} focus:ring-1`}
                                        value={newVisitData.visit_date}
                                        onChange={e => setNewVisitData({...newVisitData, visit_date: e.target.value})}
                                    />
                                    </div>
                                    <div>
                                        <label className={`block text-[10px] uppercase font-bold mb-1 ${editingVisitId ? 'text-yellow-700' : 'text-blue-600'}`}>Wt (kg)</label>
                                        <input type="number" className="w-full p-2 rounded border border-blue-200 text-sm focus:ring-1 focus:ring-blue-400" value={newVisitData.weight} onChange={e => setNewVisitData({...newVisitData, weight: e.target.value === '' ? '' : Number(e.target.value)})} />
                                    </div>
                                    <div>
                                        <label className={`block text-[10px] uppercase font-bold mb-1 ${editingVisitId ? 'text-yellow-700' : 'text-blue-600'}`}>
                                            {ageDetail && (ageDetail.y * 12 + ageDetail.m) < 24 ? 'Length (cm)' : 'Ht (cm)'}
                                        </label>
                                        <input type="number" className="w-full p-2 rounded border border-blue-200 text-sm focus:ring-1 focus:ring-blue-400" value={newVisitData.height} onChange={e => setNewVisitData({...newVisitData, height: e.target.value === '' ? '' : Number(e.target.value)})} />
                                    </div>
                                    
                                    {/* Head Circ for Visits? If infant */}
                                    {ageDetail && (ageDetail.y * 12 + ageDetail.m) <= 36 && (
                                        <div>
                                            <label className={`block text-[10px] uppercase font-bold mb-1 ${editingVisitId ? 'text-yellow-700' : 'text-blue-600'}`}>Head (cm)</label>
                                            <input type="number" className="w-full p-2 rounded border border-blue-200 text-sm focus:ring-1 focus:ring-blue-400" value={newVisitData.head_circumference} onChange={e => setNewVisitData({...newVisitData, head_circumference: e.target.value === '' ? '' : Number(e.target.value)})} />
                                        </div>
                                    )}

                                    <div>
                                        <label className={`block text-[10px] uppercase font-bold mb-1 ${editingVisitId ? 'text-yellow-700' : 'text-blue-600'}`}>Waist</label>
                                        <input type="number" className="w-full p-2 rounded border border-blue-200 text-sm focus:ring-1 focus:ring-blue-400" value={newVisitData.waist} onChange={e => setNewVisitData({...newVisitData, waist: e.target.value === '' ? '' : Number(e.target.value)})} />
                                    </div>
                                    <div>
                                        <label className={`block text-[10px] uppercase font-bold mb-1 ${editingVisitId ? 'text-yellow-700' : 'text-blue-600'}`}>Hip</label>
                                        <input type="number" className="w-full p-2 rounded border border-blue-200 text-sm focus:ring-1 focus:ring-blue-400" value={newVisitData.hip} onChange={e => setNewVisitData({...newVisitData, hip: e.target.value === '' ? '' : Number(e.target.value)})} />
                                    </div>
                            </div>
                            
                            {/* InBody Section */}
                            <div className="bg-white p-3 rounded border border-blue-100 flex items-center gap-4">
                                <div>
                                    <label className={`block text-[10px] uppercase font-bold mb-1 ${editingVisitId ? 'text-yellow-700' : 'text-blue-600'}`}>Body Fat % (InBody)</label>
                                    <input 
                                        type="number" 
                                        className="w-24 p-2 rounded border border-blue-200 text-sm focus:ring-1 focus:ring-blue-400" 
                                        value={newVisitData.body_fat} 
                                        onChange={e => setNewVisitData({...newVisitData, body_fat: e.target.value === '' ? '' : Number(e.target.value)})} 
                                        placeholder="%"
                                    />
                                </div>
                                {bodyFatAnalysis && (
                                    <div className={`mt-4 px-3 py-1 rounded text-sm font-bold bg-gray-50 border ${bodyFatAnalysis.color.replace('text-', 'border-')}`}>
                                        <span className={bodyFatAnalysis.color}>{bodyFatAnalysis.status}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3">
                                <div className="flex-grow">
                                    <textarea 
                                        placeholder="Quick visit notes..."
                                        className="w-full p-2 rounded border border-blue-200 text-sm resize-none focus:ring-1 focus:ring-blue-400"
                                        rows={2}
                                        value={newVisitData.notes}
                                        onChange={e => setNewVisitData({...newVisitData, notes: e.target.value})}
                                    ></textarea>
                                </div>
                                <button 
                                    type="submit"
                                    disabled={submitting}
                                    className={`${editingVisitId ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-blue-600 hover:bg-blue-700'} text-white px-6 py-2 rounded-lg text-sm font-bold disabled:opacity-50 self-start shadow-md transition`}
                                >
                                    {editingVisitId ? 'Update Visit' : 'Add Visit'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Timeline List */}
                    <div className="relative border-l-2 border-gray-200 ml-3 space-y-8 pb-8">
                        {loadingVisits && <div className="pl-6 text-gray-400">Loading visits...</div>}
                        {!loadingVisits && visits.length === 0 && (
                            <div className="pl-6 text-gray-400 italic text-sm">No follow-up visits recorded yet.</div>
                        )}

                        {visits.map((visit) => {
                             const planStats = visit.meal_plan_data?.servings ? calculatePlanStats(visit.meal_plan_data.servings) : null;
                             const planTotalKcal = planStats ? planStats.kcal : 0;
                             const planPcts = planTotalKcal > 0 && planStats ? {
                                 cho: (planStats.cho * 4 / planTotalKcal * 100).toFixed(0),
                                 pro: (planStats.pro * 4 / planTotalKcal * 100).toFixed(0),
                                 fat: (planStats.fat * 9 / planTotalKcal * 100).toFixed(0)
                             } : { cho: 0, pro: 0, fat: 0 };
                             
                             // Get fat % from kcal_data if stored
                             const bodyFat = visit.kcal_data?.inputs?.bodyFatPercent;
                             const isEditingThis = editingVisitId === visit.id;

                             return (
                                <div key={visit.id} className="relative pl-8">
                                    <div className={`absolute -left-[9px] top-0 w-4 h-4 bg-white border-2 ${isEditingThis ? 'border-yellow-500 scale-125' : 'border-[var(--color-primary)]'} rounded-full z-10 transition-all`}></div>
                                    <div className={`bg-white rounded-xl p-5 border ${isEditingThis ? 'border-yellow-300 ring-2 ring-yellow-100' : 'border-gray-200'} shadow-sm hover:shadow-md transition group`}>
                                         <div className="flex justify-between items-start mb-4 border-b border-gray-100 pb-3">
                                             <div className="flex items-center gap-4">
                                                 <span className="font-bold text-gray-800 text-lg">
                                                 {formatDateUK(visit.visit_date)}
                                                 </span>
                                                 <div className="flex gap-2 text-xs font-mono">
                                                     {visit.weight && <span className="bg-blue-50 border border-blue-100 px-2 py-0.5 rounded text-blue-700 font-bold">Wt: {visit.weight}</span>}
                                                     {visit.bmi && <span className="bg-orange-50 border border-orange-100 px-2 py-0.5 rounded text-orange-700 font-bold">BMI: {visit.bmi}</span>}
                                                     {bodyFat && <span className="bg-purple-50 border border-purple-100 px-2 py-0.5 rounded text-purple-700 font-bold">Fat: {bodyFat}%</span>}
                                                 </div>
                                             </div>
                                             <div className="flex gap-2">
                                                 <button 
                                                    onClick={() => handleEditVisit(visit)} 
                                                    className="text-gray-400 hover:text-blue-600 px-2 font-bold text-sm"
                                                    title="Edit Visit"
                                                 >
                                                     ✏️
                                                 </button>
                                                 <button 
                                                    onClick={() => handleDeleteVisit(visit.id)} 
                                                    className="text-red-400 hover:text-red-600 px-2 font-bold text-lg"
                                                    title="Delete Visit"
                                                 >
                                                     ×
                                                 </button>
                                             </div>
                                         </div>
                                         
                                         <div className="grid grid-cols-4 gap-2 text-xs text-gray-600 mb-4 bg-gray-50 p-3 rounded border border-gray-100">
                                             <div><span className="font-bold text-gray-400 uppercase block">{ageDetail && (ageDetail.y * 12 + ageDetail.m) < 24 ? 'Length' : 'Ht'}</span> {visit.height || '-'} cm</div>
                                             <div><span className="font-bold text-gray-400 uppercase block">Waist</span> {visit.waist || '-'} cm</div>
                                             {visit.head_circumference && <div><span className="font-bold text-gray-400 uppercase block">Head Circ.</span> {visit.head_circumference} cm</div>}
                                             <div><span className="font-bold text-gray-400 uppercase block">MIAC</span> {visit.miac || '-'} cm</div>
                                         </div>

                                         <div className="mb-4 flex flex-col sm:flex-row gap-6 items-start">
                                             {/* Tools Column */}
                                             <div className="flex flex-col gap-2 w-full sm:w-auto">
                                                 <button 
                                                     onClick={() => openKcalForVisit(visit)}
                                                     className="text-xs font-bold text-green-700 hover:text-green-800 flex items-center gap-1 transition self-start bg-green-50 px-2 py-1 rounded border border-green-100 w-full"
                                                 >
                                                     <span>🔥</span> Kcal: {visit.kcal_data?.inputs?.reqKcal || '-'}
                                                 </button>
                                                 <button 
                                                     onClick={() => openMealPlanForVisit(visit)}
                                                     className="text-xs font-bold text-purple-700 hover:text-purple-800 flex items-center gap-1 transition self-start bg-purple-50 px-2 py-1 rounded border border-purple-100 w-full"
                                                 >
                                                     <span>📅</span> Plan: {visit.meal_plan_data ? `${planTotalKcal.toFixed(0)} kcal` : '-'}
                                                 </button>
                                                 {/* New Dietary Tool Buttons for Visit */}
                                                 <button 
                                                     onClick={() => handleOpenTool('dietary-recall', 'visit', visit.id, visit.dietary_assessment)}
                                                     className="text-xs font-bold text-yellow-700 hover:text-yellow-800 flex items-center gap-1 transition self-start bg-yellow-50 px-2 py-1 rounded border border-yellow-100 w-full"
                                                 >
                                                     <span>📅</span> Recall {visit.dietary_assessment ? '✓' : ''}
                                                 </button>
                                                 <button 
                                                     onClick={() => handleOpenTool('food-questionnaire', 'visit', visit.id, visit.food_questionnaire)}
                                                     className="text-xs font-bold text-green-700 hover:text-green-800 flex items-center gap-1 transition self-start bg-green-50 px-2 py-1 rounded border border-green-100 w-full"
                                                 >
                                                     <span>🥗</span> Food Q. {visit.food_questionnaire ? '✓' : ''}
                                                 </button>
                                             </div>
                                             
                                             {/* Summaries (Meal Plan details) */}
                                             {visit.meal_plan_data && (
                                                 <div className="flex-grow flex flex-col gap-2 bg-purple-50 border border-purple-100 px-3 py-2 rounded-lg text-purple-800 text-xs">
                                                     {planStats && (
                                                         <div className="grid grid-cols-3 gap-2 text-center mt-1">
                                                             <div>
                                                                 <div className="font-bold text-blue-600">{planStats.cho.toFixed(0)}g</div>
                                                                 <div className="text-[10px] text-blue-500">CHO ({planPcts.cho}%)</div>
                                                             </div>
                                                             <div>
                                                                 <div className="font-bold text-red-600">{planStats.pro.toFixed(0)}g</div>
                                                                 <div className="text-[10px] text-red-500">PRO ({planPcts.pro}%)</div>
                                                             </div>
                                                             <div>
                                                                 <div className="font-bold text-yellow-600">{planStats.fat.toFixed(0)}g</div>
                                                                 <div className="text-[10px] text-yellow-600">FAT ({planPcts.fat}%)</div>
                                                             </div>
                                                         </div>
                                                     )}
                                                 </div>
                                             )}
                                         </div>

                                         {visit.notes && (
                                             <div className="border-l-2 border-gray-200 pl-3 py-1">
                                                 <NoteDisplay text={visit.notes} />
                                             </div>
                                         )}
                                    </div>
                                </div>
                             );
                        })}
                    </div>
                </div>
            )}
            
            {/* Report Tab (Unchanged) */}
            {activeTab === 'report' && editingClient && chartData && (
                 <div className="p-8 animate-fade-in">
                     <div className="flex justify-end mb-6 no-print gap-2">
                        <button 
                            onClick={generateSummary}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-md flex items-center gap-2 transition"
                        >
                            <span>📝</span> {t.clients.generateSummary}
                        </button>
                        <button 
                            onClick={handlePrintReport}
                            className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg shadow-md flex items-center gap-2 transition"
                        >
                            <span>🖨️</span> Print Report
                        </button>
                     </div>

                     {summaryText && (
                         <div className="mb-8 bg-gray-50 p-4 rounded-xl border border-gray-200 shadow-inner">
                             <div className="flex justify-between items-center mb-2">
                                 <h3 className="font-bold text-gray-700">Generated Summary</h3>
                                 <button onClick={() => {navigator.clipboard.writeText(summaryText); alert('Copied!');}} className="text-xs text-blue-600 hover:underline">Copy to Clipboard</button>
                             </div>
                             <textarea 
                                readOnly 
                                value={summaryText} 
                                className="w-full h-40 p-3 text-sm font-mono border rounded bg-white resize-none focus:outline-none"
                             ></textarea>
                         </div>
                     )}

                     <div className="space-y-8">
                         <div className="border-b-2 border-gray-200 pb-4 mb-6">
                             <div className="flex justify-between items-end">
                                 <div>
                                     <h2 className="text-3xl font-bold text-[var(--color-heading)]">Progress Report</h2>
                                     <p className="text-gray-500 text-sm mt-1">Generated on {new Date().toLocaleDateString('en-GB')}</p>
                                 </div>
                                 <div className="text-right">
                                     <div className="text-2xl font-bold text-gray-800">{editingClient.full_name}</div>
                                     <div className="text-sm text-gray-600">Code: {editingClient.client_code || '-'}</div>
                                 </div>
                             </div>
                         </div>

                         <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                             <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Latest Measurements</h3>
                             <div className="grid grid-cols-3 md:grid-cols-6 gap-4 text-center">
                                 <div className="p-2 bg-white rounded border border-gray-200">
                                     <div className="text-xs text-gray-400 uppercase">Weight</div>
                                     <div className="font-bold text-lg text-[var(--color-primary)]">{editingClient.weight || '-'} <span className="text-xs">kg</span></div>
                                 </div>
                                 <div className="p-2 bg-white rounded border border-gray-200">
                                     <div className="text-xs text-gray-400 uppercase">BMI</div>
                                     <div className="font-bold text-lg text-orange-600">{editingClient.bmi || '-'}</div>
                                 </div>
                                 <div className="p-2 bg-white rounded border border-gray-200">
                                     <div className="text-xs text-gray-400 uppercase">Height</div>
                                     <div className="font-bold text-lg text-gray-700">{editingClient.height || '-'} <span className="text-xs">cm</span></div>
                                 </div>
                                 <div className="p-2 bg-white rounded border border-gray-200">
                                     <div className="text-xs text-gray-400 uppercase">Waist</div>
                                     <div className="font-bold text-lg text-gray-700">{editingClient.waist || '-'} <span className="text-xs">cm</span></div>
                                 </div>
                                 {editingClient.head_circumference && (
                                     <div className="p-2 bg-white rounded border border-gray-200">
                                         <div className="text-xs text-gray-400 uppercase">Head</div>
                                         <div className="font-bold text-lg text-gray-700">{editingClient.head_circumference} <span className="text-xs">cm</span></div>
                                     </div>
                                 )}
                                 <div className="p-2 bg-white rounded border border-gray-200">
                                     <div className="text-xs text-gray-400 uppercase">MIAC</div>
                                     <div className="font-bold text-lg text-gray-700">{editingClient.miac || '-'} <span className="text-xs">cm</span></div>
                                 </div>
                             </div>
                         </div>

                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 break-inside-avoid">
                             <SimpleLineChart data={chartData.weight} title="Body Weight" unit="kg" color="#3b82f6" />
                             <SimpleLineChart data={chartData.bmi} title="BMI Score" unit="" color="#f97316" />
                             <SimpleLineChart data={chartData.waist} title="Waist Circumference" unit="cm" color="#16a34a" />
                             <SimpleLineChart data={chartData.hip} title="Hip Circumference" unit="cm" color="#a855f7" />
                             <SimpleLineChart data={chartData.miac} title="MIAC (Arm)" unit="cm" color="#ec4899" />
                            {chartData.height && chartData.height.length > 1 && (
                                <SimpleLineChart data={chartData.height} title="Height Growth" unit="cm" color="#6366f1" />
                            )}
                            {chartData.head && chartData.head.length > 1 && (
                                <SimpleLineChart data={chartData.head} title="Head Circumference" unit="cm" color="#8b5cf6" />
                            )}
                            {chartData.bodyFat && chartData.bodyFat.length > 1 && (
                                <SimpleLineChart data={chartData.bodyFat} title="Body Fat %" unit="%" color="#8b5cf6" />
                            )}
                         </div>
                         
                         <div className="text-center text-xs text-gray-400 pt-8 mt-8 border-t border-gray-100">
                             Diet-Nova System • Dr. Peter Ramsis
                         </div>
                     </div>
                 </div>
            )}
         </div>
    </div>
  );
};

export default ClientManager;
