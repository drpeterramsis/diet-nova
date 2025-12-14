
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
import { useNotification } from '../../contexts/NotificationContext';

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
                     return <div key={i} className="font-mono text-xs text-blue-800 bg-blue-50 px-1 rounded my-0.5 inline-block w-full">{line}</div>;
                }
                return <div key={i}>{line}</div>;
            })}
        </div>
    );
};

const ClientManager: React.FC<ClientManagerProps> = ({ initialClientId, onAnalyzeInKcal, onPlanMeals, onRunNFPE, autoOpenNew }) => {
  const { t, isRTL } = useLanguage();
  const { session, profile } = useAuth();
  const { notify } = useNotification();
  
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeClient, setActiveClient] = useState<Client | null>(null);
  const [activeVisit, setActiveVisit] = useState<ClientVisit | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showVisitModal, setShowVisitModal] = useState(false);
  
  // Search & Sort State
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('date_desc');
  const [groupOption, setGroupOption] = useState<GroupOption>('none');

  // Form State (Client)
  const [formData, setFormData] = useState<Partial<Client>>({});
  
  // Form State (Visit)
  const [visitFormData, setVisitFormData] = useState<Partial<ClientVisit>>({});

  // Sub-Tool States
  const [showDietaryAssessment, setShowDietaryAssessment] = useState(false);
  const [showFoodQuestionnaire, setShowFoodQuestionnaire] = useState(false);
  
  // Lab Selection State
  const [showLabSelector, setShowLabSelector] = useState(false);
  const [selectedLabItems, setSelectedLabItems] = useState<string[]>([]);
  const [labSearchQuery, setLabSearchQuery] = useState('');

  // Tools Modal States
  const [showStrongKids, setShowStrongKids] = useState(false);
  const [showPediatricWaist, setShowPediatricWaist] = useState(false);
  const [showPediatricMAMC, setShowPediatricMAMC] = useState(false);
  const [showGrowthCharts, setShowGrowthCharts] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    fetchClients();
  }, [session]);

  useEffect(() => {
      if (initialClientId && clients.length > 0) {
          const client = clients.find(c => c.id === initialClientId);
          if (client) {
              handleClientClick(client);
          }
      }
  }, [initialClientId, clients]);

  useEffect(() => {
      if (autoOpenNew) {
          resetFormData();
          setShowAddModal(true);
      }
  }, [autoOpenNew]);

  const fetchClients = async () => {
    if (!session?.user.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('doctor_id', session.user.id)
        .order('visit_date', { ascending: false });

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      notify(t.auth.errorGeneric, 'error');
    } finally {
      setLoading(false);
    }
  };

  // --- Filtering & Sorting Logic ---
  const filteredClients = useMemo(() => {
      let filtered = clients;
      
      // Search
      if (searchQuery) {
          const q = searchQuery.toLowerCase();
          filtered = filtered.filter(c => 
              c.full_name.toLowerCase().includes(q) || 
              c.phone?.includes(q) || 
              c.client_code?.toLowerCase().includes(q) ||
              c.clinic?.toLowerCase().includes(q)
          );
      }

      // Sort
      return [...filtered].sort((a, b) => {
          switch (sortOption) {
              case 'date_desc': return new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime();
              case 'date_asc': return new Date(a.visit_date).getTime() - new Date(b.visit_date).getTime();
              case 'name_asc': return a.full_name.localeCompare(b.full_name);
              case 'name_desc': return b.full_name.localeCompare(a.full_name);
              case 'clinic': return (a.clinic || '').localeCompare(b.clinic || '');
              default: return 0;
          }
      });
  }, [clients, searchQuery, sortOption]);

  // Grouping
  const groupedClients = useMemo(() => {
      if (groupOption === 'none') return { 'All Clients': filteredClients };
      
      const groups: Record<string, Client[]> = {};
      
      filteredClients.forEach(client => {
          let key = 'Other';
          if (groupOption === 'clinic') {
              key = client.clinic || 'Unassigned';
          } else if (groupOption === 'month') {
              const d = new Date(client.visit_date);
              key = d.toLocaleString('default', { month: 'long', year: 'numeric' });
          }
          
          if (!groups[key]) groups[key] = [];
          groups[key].push(client);
      });
      return groups;
  }, [filteredClients, groupOption]);

  const handleClientClick = async (client: Client) => {
    setActiveClient(client);
    
    // Fetch visits
    const { data: visits } = await supabase
      .from('client_visits')
      .select('*')
      .eq('client_id', client.id)
      .order('visit_date', { ascending: false });
    
    // If no visits, create dummy active visit based on client data
    if (visits && visits.length > 0) {
        // Set most recent as active context but store history
        setActiveVisit(visits[0]); 
        // We'll attach history to the client object for charting in a real app, 
        // but for now let's just use the latest visit for display
        (client as any).history = visits.reverse(); // For charts (oldest to newest)
    } else {
        setActiveVisit({
            id: 'temp',
            client_id: client.id,
            visit_date: client.visit_date,
            weight: client.weight,
            height: client.height,
            waist: client.waist,
            hip: client.hip,
            bmi: client.bmi,
            notes: client.notes
        });
        (client as any).history = [];
    }

    setViewMode('detail');
  };

  const handleSaveClient = async () => {
    if (!session?.user.id) return;
    notify('Saving...', 'loading');
    
    try {
      const payload = {
        ...formData,
        doctor_id: session.user.id,
        // Auto calculate BMI if weight/height present
        bmi: (formData.weight && formData.height) 
             ? Number((formData.weight / ((formData.height/100)**2)).toFixed(1)) 
             : undefined
      };

      if (activeClient) {
        // Update existing
        const { error } = await supabase
          .from('clients')
          .update(payload)
          .eq('id', activeClient.id);
        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from('clients')
          .insert(payload);
        if (error) throw error;
      }

      await fetchClients();
      setShowAddModal(false);
      resetFormData();
      notify('Client Saved Successfully!', 'success');
    } catch (error: any) {
      console.error(error);
      notify('Error saving client: ' + error.message, 'error');
    }
  };

  const handleSaveVisit = async () => {
      if (!activeClient || !session) return;
      notify('Saving Visit...', 'loading');

      try {
          const payload = {
              client_id: activeClient.id,
              ...visitFormData,
              // Recalculate BMI for this visit
              bmi: (visitFormData.weight && visitFormData.height)
                  ? Number((visitFormData.weight / ((visitFormData.height/100)**2)).toFixed(1))
                  : undefined
          };

          // 1. Insert Visit
          const { error: visitError } = await supabase.from('client_visits').insert(payload);
          if (visitError) throw visitError;

          // 2. Update Client Main Record (Latest Data)
          const { error: clientError } = await supabase
            .from('clients')
            .update({
                weight: visitFormData.weight,
                height: visitFormData.height,
                waist: visitFormData.waist,
                hip: visitFormData.hip,
                miac: visitFormData.miac,
                head_circumference: visitFormData.head_circumference,
                bmi: payload.bmi,
                visit_date: visitFormData.visit_date,
                // Append notes if any
                notes: visitFormData.notes ? (activeClient.notes ? activeClient.notes + '\n\n[' + visitFormData.visit_date + '] ' + visitFormData.notes : visitFormData.notes) : activeClient.notes
            })
            .eq('id', activeClient.id);
            
          if (clientError) throw clientError;

          await fetchClients();
          // Reload active client to reflect updates
          const updatedClient = clients.find(c => c.id === activeClient.id);
          if (updatedClient) handleClientClick(updatedClient);
          
          setShowVisitModal(false);
          setVisitFormData({});
          notify('Visit Recorded Successfully!', 'success');
      } catch (err: any) {
          console.error(err);
          notify('Error recording visit: ' + err.message, 'error');
      }
  };

  const handleToolNoteSave = async (note: string) => {
      if (!activeClient) return;
      notify('Adding Note...', 'loading');
      
      const updatedNotes = activeClient.notes 
          ? activeClient.notes + "\n\n" + note 
          : note;
      
      try {
          const { error } = await supabase
            .from('clients')
            .update({ notes: updatedNotes })
            .eq('id', activeClient.id);
            
          if (error) throw error;
          
          // Update local state
          setActiveClient({ ...activeClient, notes: updatedNotes });
          
          // Close Modals
          setShowStrongKids(false);
          setShowPediatricWaist(false);
          setShowPediatricMAMC(false);
          setShowGrowthCharts(false);
          
          notify('Note Added!', 'success');
      } catch (err: any) {
          console.error(err);
          notify('Failed to add note: ' + err.message, 'error');
      }
  };

  const handleUpdateLabNotes = async () => {
      if (selectedLabItems.length === 0 || !activeClient) return;
      
      const labNote = `[Suggested Labs - ${new Date().toLocaleDateString('en-GB')}]\n` + 
                      selectedLabItems.map(i => `• ${i}`).join('\n');
                      
      await handleToolNoteSave(labNote);
      setShowLabSelector(false);
      setSelectedLabItems([]);
  };

  // Helper to toggle labs
  const toggleLab = (lab: string) => {
      setSelectedLabItems(prev => 
          prev.includes(lab) ? prev.filter(i => i !== lab) : [...prev, lab]
      );
  };

  const resetFormData = () => {
    setFormData({
      visit_date: new Date().toISOString().split('T')[0],
      gender: 'male',
      clinic: 'Main Clinic'
    });
    setActiveClient(null);
  };

  // Chart Data Preparation
  const weightHistory = useMemo(() => {
      if (!activeClient || !(activeClient as any).history) return [];
      return (activeClient as any).history.map((v: any) => ({
          label: new Date(v.visit_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
          value: v.weight
      }));
  }, [activeClient]);

  // Derived Values
  const isPediatric = activeClient?.age !== undefined && activeClient.age < 18;

  // --- SUB-COMPONENT RENDERERS ---

  // 1. Dietary Assessment Wrapper
  if (showDietaryAssessment && activeClient) {
      return (
          <DietaryAssessment 
              initialData={activeClient.dietary_assessment}
              onClose={() => setShowDietaryAssessment(false)}
              onSave={async (data) => {
                  notify('Saving Dietary Assessment...', 'loading');
                  const { error } = await supabase
                      .from('clients')
                      .update({ dietary_assessment: data })
                      .eq('id', activeClient.id);
                  if (!error) {
                      setActiveClient({ ...activeClient, dietary_assessment: data });
                      notify('Saved Successfully!', 'success');
                      setShowDietaryAssessment(false);
                  } else {
                      notify('Error saving assessment.', 'error');
                  }
              }}
          />
      );
  }

  // 2. Food Questionnaire Wrapper
  if (showFoodQuestionnaire && activeClient) {
      return (
          <FoodQuestionnaire 
              initialData={activeClient.food_questionnaire}
              onClose={() => setShowFoodQuestionnaire(false)}
              onSave={async (data) => {
                  notify('Saving Questionnaire...', 'loading');
                  const { error } = await supabase
                      .from('clients')
                      .update({ food_questionnaire: data })
                      .eq('id', activeClient.id);
                  if (!error) {
                      setActiveClient({ ...activeClient, food_questionnaire: data });
                      notify('Saved Successfully!', 'success');
                      setShowFoodQuestionnaire(false);
                  } else {
                      notify('Error saving questionnaire.', 'error');
                  }
              }}
          />
      );
  }

  // 3. STRONGKids Wrapper
  if (showStrongKids) {
      return <STRONGKids onClose={() => setShowStrongKids(false)} onSave={handleToolNoteSave} />;
  }

  // 4. Pediatric Waist Wrapper
  if (showPediatricWaist) {
      return (
          <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-xl">
                  <PediatricWaist 
                      onClose={() => setShowPediatricWaist(false)}
                      onSave={handleToolNoteSave}
                      initialGender={activeClient?.gender}
                      initialAge={activeClient?.age}
                      initialWaist={activeClient?.waist}
                  />
              </div>
          </div>
      );
  }

  // 5. Pediatric MAMC Wrapper
  if (showPediatricMAMC) {
      return (
          <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-white rounded-xl">
                  <PediatricMAMC
                      onClose={() => setShowPediatricMAMC(false)}
                      onSave={handleToolNoteSave}
                      initialGender={activeClient?.gender}
                      initialAge={activeClient?.age}
                      initialMac={activeClient?.miac}
                  />
              </div>
          </div>
      );
  }

  // 6. Growth Charts Wrapper
  if (showGrowthCharts) {
      return (
          <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="w-full max-w-6xl max-h-[95vh] overflow-y-auto bg-white rounded-xl shadow-2xl">
                  <GrowthCharts 
                      onClose={() => setShowGrowthCharts(false)}
                      onSave={handleToolNoteSave}
                      initialData={{
                          name: activeClient?.full_name,
                          gender: activeClient?.gender || 'male',
                          age: activeClient?.age || 0,
                          weight: activeClient?.weight,
                          height: activeClient?.height,
                          head_circumference: activeClient?.head_circumference,
                          bmi: activeClient?.bmi
                      }}
                  />
              </div>
          </div>
      );
  }

  // 7. Instructions Wrapper
  if (showInstructions) {
      return (
          <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="w-full max-w-6xl max-h-[95vh] overflow-y-auto bg-white rounded-xl shadow-2xl">
                  <InstructionsLibrary onClose={() => setShowInstructions(false)} />
              </div>
          </div>
      );
  }

  // --- MAIN VIEW: LIST vs DETAIL ---

  if (viewMode === 'list') {
    return (
      <div className="max-w-7xl mx-auto animate-fade-in pb-12">
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 bg-white p-6 rounded-xl shadow-sm border border-gray-100 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-[var(--color-heading)] flex items-center gap-2">
                <span>👥</span> {t.clients.title}
            </h2>
            <p className="text-sm text-gray-500">Manage patient records, visits, and assessments.</p>
          </div>
          
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <input 
                  type="text" 
                  placeholder="Search clients..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="p-2 border rounded-lg text-sm w-full md:w-48 focus:ring-2 focus:ring-green-500 outline-none"
              />
              <select 
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as SortOption)}
                  className="p-2 border rounded-lg text-sm bg-gray-50"
              >
                  <option value="date_desc">Newest First</option>
                  <option value="date_asc">Oldest First</option>
                  <option value="name_asc">Name (A-Z)</option>
                  <option value="clinic">Clinic</option>
              </select>
              <select 
                  value={groupOption}
                  onChange={(e) => setGroupOption(e.target.value as GroupOption)}
                  className="p-2 border rounded-lg text-sm bg-gray-50"
              >
                  <option value="none">No Grouping</option>
                  <option value="clinic">Group by Clinic</option>
                  <option value="month">Group by Month</option>
              </select>
              <button 
                onClick={() => { resetFormData(); setShowAddModal(true); }}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition text-sm font-bold shadow-sm flex items-center gap-1"
              >
                <span>+</span> {t.clients.addClient}
              </button>
          </div>
        </div>

        {/* Client List (Grouped) */}
        <div className="space-y-8">
            {Object.keys(groupedClients).length === 0 && (
                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                    <span className="text-4xl block mb-2 opacity-50">📂</span>
                    <p className="text-gray-500">{t.clients.noClients}</p>
                </div>
            )}

            {Object.entries(groupedClients).map(([group, groupClients]) => {
                const clientsList = groupClients as Client[];
                return (
                <div key={group} className="animate-fade-in">
                    {groupOption !== 'none' && (
                        <h3 className="text-lg font-bold text-gray-700 mb-3 pl-2 border-l-4 border-green-500">{group} <span className="text-sm font-normal text-gray-400">({clientsList.length})</span></h3>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {clientsList.map(client => (
                            <div 
                                key={client.id} 
                                onClick={() => handleClientClick(client)}
                                className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-green-300 transition cursor-pointer group relative overflow-hidden"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-gray-800 text-lg group-hover:text-green-600 transition">{client.full_name}</h3>
                                    {client.client_code && (
                                        <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-mono">#{client.client_code}</span>
                                    )}
                                </div>
                                <div className="space-y-1 text-sm text-gray-600">
                                    <p className="flex items-center gap-2"><span className="opacity-50">📅</span> {formatDateUK(client.visit_date)}</p>
                                    <p className="flex items-center gap-2"><span className="opacity-50">📍</span> {client.clinic || '-'}</p>
                                    <p className="flex items-center gap-2"><span className="opacity-50">📱</span> {client.phone || '-'}</p>
                                </div>
                                
                                {/* Quick Stats Badge */}
                                <div className="mt-3 pt-3 border-t border-gray-50 flex gap-2">
                                    {client.bmi && (
                                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                                            client.bmi > 30 ? 'bg-red-50 text-red-600' : 
                                            client.bmi > 25 ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'
                                        }`}>
                                            BMI: {client.bmi}
                                        </span>
                                    )}
                                    {client.age && client.age < 18 && (
                                        <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-600 font-bold">
                                            Pediatric
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );})}
        </div>

        {/* Add/Edit Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 animate-fade-in max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold mb-4">{activeClient ? t.clients.editClient : t.clients.addClient}</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="col-span-2 md:col-span-1">
                    <label className="block text-sm font-medium mb-1">{t.clients.name} *</label>
                    <input 
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none"
                      value={formData.full_name || ''}
                      onChange={e => setFormData({...formData, full_name: e.target.value})}
                    />
                </div>
                <div className="col-span-2 md:col-span-1">
                    <label className="block text-sm font-medium mb-1">Client Code</label>
                    <input 
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none"
                      value={formData.client_code || ''}
                      onChange={e => setFormData({...formData, client_code: e.target.value})}
                    />
                </div>
                
                <div className="col-span-1">
                    <label className="block text-sm font-medium mb-1">{t.clients.visitDate} *</label>
                    <input 
                      type="date"
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none"
                      value={formData.visit_date || ''}
                      onChange={e => setFormData({...formData, visit_date: e.target.value})}
                    />
                </div>
                <div className="col-span-1">
                    <label className="block text-sm font-medium mb-1">{t.clients.clinic}</label>
                    <input 
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none"
                      value={formData.clinic || ''}
                      onChange={e => setFormData({...formData, clinic: e.target.value})}
                      list="clinic-suggestions"
                    />
                    <datalist id="clinic-suggestions">
                        <option value="Main Clinic" />
                        <option value="Hospital" />
                        <option value="Online" />
                    </datalist>
                </div>

                <div className="col-span-1">
                    <label className="block text-sm font-medium mb-1">{t.clients.phone}</label>
                    <input 
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none"
                      value={formData.phone || ''}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                    />
                </div>
                <div className="col-span-1">
                    <label className="block text-sm font-medium mb-1">{t.clients.gender}</label>
                    <select 
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none bg-white"
                      value={formData.gender || 'male'}
                      onChange={e => setFormData({...formData, gender: e.target.value as any})}
                    >
                      <option value="male">{t.kcal.male}</option>
                      <option value="female">{t.kcal.female}</option>
                    </select>
                </div>

                {/* Vitals */}
                <div className="col-span-2 border-t border-gray-100 pt-4 mt-2">
                    <h4 className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wider">Vitals & Anthropometry</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">{t.kcal.age}</label>
                            <input type="number" className="w-full p-2 border rounded" value={formData.age || ''} onChange={e => setFormData({...formData, age: Number(e.target.value)})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Wt (kg)</label>
                            <input type="number" className="w-full p-2 border rounded" value={formData.weight || ''} onChange={e => setFormData({...formData, weight: Number(e.target.value)})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Ht (cm)</label>
                            <input type="number" className="w-full p-2 border rounded" value={formData.height || ''} onChange={e => setFormData({...formData, height: Number(e.target.value)})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Waist (cm)</label>
                            <input type="number" className="w-full p-2 border rounded" value={formData.waist || ''} onChange={e => setFormData({...formData, waist: Number(e.target.value)})} />
                        </div>
                    </div>
                </div>

                <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">{t.clients.notes}</label>
                    <textarea 
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none h-24"
                      value={formData.notes || ''}
                      onChange={e => setFormData({...formData, notes: e.target.value})}
                      placeholder="Medical history, complaints, etc."
                    />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  {t.common.cancel}
                </button>
                <button 
                  onClick={handleSaveClient}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-bold shadow-md"
                >
                  {t.common.save}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- DETAIL VIEW ---
  if (!activeClient) return null;

  return (
    <div className="max-w-[1920px] mx-auto animate-fade-in pb-20">
        
        {/* Detail Header */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 no-print">
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => setViewMode('list')}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-2 rounded-lg transition flex items-center gap-2 text-sm font-bold"
                >
                    <span>←</span> Clients
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        {activeClient.full_name}
                        {activeClient.client_code && <span className="text-sm font-mono font-normal text-gray-400 bg-gray-50 px-2 rounded">#{activeClient.client_code}</span>}
                    </h1>
                    <div className="text-sm text-gray-500 flex flex-wrap gap-3 mt-1">
                        <span>{activeClient.gender === 'male' ? '👨 Male' : '👩 Female'}</span>
                        <span>•</span>
                        <span>{activeClient.age} Years</span>
                        <span>•</span>
                        <span>{activeClient.phone || 'No Phone'}</span>
                        <span>•</span>
                        <span className="text-green-600 font-bold">{activeClient.clinic}</span>
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
                <button 
                    onClick={() => { setFormData(activeClient); setShowAddModal(true); }}
                    className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-100 transition"
                >
                    ✏️ Edit Profile
                </button>
                <button 
                    onClick={() => { setVisitFormData({ visit_date: new Date().toISOString().split('T')[0] }); setShowVisitModal(true); }}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-green-700 transition shadow-sm flex items-center gap-1"
                >
                    <span>+</span> New Visit
                </button>
                {activeVisit && onAnalyzeInKcal && (
                    <button 
                        onClick={() => onAnalyzeInKcal(activeClient, activeVisit)}
                        className="bg-purple-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-purple-700 transition shadow-sm flex items-center gap-1"
                    >
                        <span>🔥</span> Calc Kcal
                    </button>
                )}
                {activeVisit && onPlanMeals && (
                    <button 
                        onClick={() => onPlanMeals(activeClient, activeVisit)}
                        className="bg-orange-500 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-orange-600 transition shadow-sm flex items-center gap-1"
                    >
                        <span>🍽️</span> Plan Meals
                    </button>
                )}
            </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            
            {/* Left Column: Vitals & History (4 cols) */}
            <div className="xl:col-span-4 space-y-6">
                
                {/* Current Vitals Card */}
                <div className="card bg-white shadow-sm border border-blue-100 overflow-hidden">
                    <div className="p-4 bg-blue-50 border-b border-blue-100 flex justify-between items-center">
                        <h3 className="font-bold text-blue-900">Current Vitals</h3>
                        <span className="text-xs text-blue-600 font-mono">{formatDateUK(activeClient.visit_date)}</span>
                    </div>
                    <div className="p-4 grid grid-cols-2 gap-4">
                        <div className="text-center p-2 bg-gray-50 rounded border border-gray-100">
                            <div className="text-xs text-gray-500 uppercase font-bold">Weight</div>
                            <div className="text-xl font-bold text-gray-800">{activeClient.weight || '-'} <span className="text-xs font-normal text-gray-400">kg</span></div>
                        </div>
                        <div className="text-center p-2 bg-gray-50 rounded border border-gray-100">
                            <div className="text-xs text-gray-500 uppercase font-bold">Height</div>
                            <div className="text-xl font-bold text-gray-800">{activeClient.height || '-'} <span className="text-xs font-normal text-gray-400">cm</span></div>
                        </div>
                        <div className="text-center p-2 bg-gray-50 rounded border border-gray-100">
                            <div className="text-xs text-gray-500 uppercase font-bold">BMI</div>
                            <div className={`text-xl font-bold ${activeClient.bmi && activeClient.bmi > 25 ? 'text-orange-600' : 'text-green-600'}`}>
                                {activeClient.bmi || '-'}
                            </div>
                        </div>
                        <div className="text-center p-2 bg-gray-50 rounded border border-gray-100">
                            <div className="text-xs text-gray-500 uppercase font-bold">Waist</div>
                            <div className="text-xl font-bold text-gray-800">{activeClient.waist || '-'} <span className="text-xs font-normal text-gray-400">cm</span></div>
                        </div>
                    </div>
                </div>

                {/* Weight Chart */}
                {weightHistory.length > 1 && (
                    <SimpleLineChart 
                        data={weightHistory} 
                        title="Weight Progress" 
                        unit="kg" 
                        color="#2563eb"
                    />
                )}

                {/* Clinical Notes */}
                <div className="card bg-white shadow-sm border border-yellow-100 h-96 flex flex-col">
                    <div className="p-4 bg-yellow-50 border-b border-yellow-100 flex justify-between items-center">
                        <h3 className="font-bold text-yellow-900">Clinical Notes</h3>
                        <button className="text-xs bg-white text-yellow-700 px-2 py-1 rounded border border-yellow-200 hover:bg-yellow-100">Expand</button>
                    </div>
                    <div className="p-4 overflow-y-auto flex-grow bg-yellow-50/30">
                        {activeClient.notes ? (
                            <NoteDisplay text={activeClient.notes} />
                        ) : (
                            <div className="text-center text-gray-400 text-sm mt-10">No notes recorded.</div>
                        )}
                    </div>
                </div>

            </div>

            {/* Right Column: Actions & Tools (8 cols) */}
            <div className="xl:col-span-8 space-y-6">
                
                {/* 1. Assessment Tools Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <button 
                        onClick={() => setShowDietaryAssessment(true)}
                        className="p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md hover:border-yellow-400 transition text-center group"
                    >
                        <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">📅</div>
                        <div className="text-sm font-bold text-gray-700">Dietary Recall</div>
                        <div className="text-xs text-gray-400 mt-1">24h - 7 Days</div>
                    </button>
                    
                    <button 
                        onClick={() => setShowFoodQuestionnaire(true)}
                        className="p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md hover:border-green-400 transition text-center group"
                    >
                        <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">🥗</div>
                        <div className="text-sm font-bold text-gray-700">Food Frequency</div>
                        <div className="text-xs text-gray-400 mt-1">Questionnaire</div>
                    </button>

                    <button 
                        onClick={() => onRunNFPE && onRunNFPE(activeClient)}
                        className="p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md hover:border-blue-400 transition text-center group"
                    >
                        <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">🩺</div>
                        <div className="text-sm font-bold text-gray-700">NFPE Exam</div>
                        <div className="text-xs text-gray-400 mt-1">Physical Signs</div>
                    </button>

                    <button 
                        onClick={() => setShowLabSelector(true)}
                        className="p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md hover:border-purple-400 transition text-center group"
                    >
                        <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">🧪</div>
                        <div className="text-sm font-bold text-gray-700">Request Labs</div>
                        <div className="text-xs text-gray-400 mt-1">Tests & Panels</div>
                    </button>
                </div>

                {/* 2. Quick Tags (Notes) */}
                <div className="card bg-white p-4 border border-gray-200">
                    <h4 className="text-sm font-bold text-gray-600 mb-3 uppercase tracking-wider">Quick Note Tags</h4>
                    <div className="space-y-4">
                        {Object.entries(isPediatric ? PEDIATRIC_TAG_CATEGORIES : TAG_CATEGORIES).map(([category, tags]) => (
                            <div key={category}>
                                <h5 className="text-xs font-bold text-gray-400 mb-2">{category}</h5>
                                <div className="flex flex-wrap gap-2">
                                    {tags.map(tag => (
                                        <button 
                                            key={tag}
                                            onClick={() => handleToolNoteSave(`• ${tag}`)}
                                            className="px-2 py-1 bg-gray-50 border border-gray-200 rounded text-xs hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition"
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 3. Pediatric Tools (Conditional) */}
                {isPediatric && (
                    <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                        <h3 className="font-bold text-purple-900 mb-4 flex items-center gap-2">
                            <span>👶</span> Pediatric Specialist Tools
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <button onClick={() => setShowStrongKids(true)} className="bg-white p-3 rounded-lg shadow-sm text-sm font-bold text-purple-700 hover:bg-purple-100 transition border border-purple-200">
                                STRONGkids
                            </button>
                            <button onClick={() => setShowPediatricWaist(true)} className="bg-white p-3 rounded-lg shadow-sm text-sm font-bold text-purple-700 hover:bg-purple-100 transition border border-purple-200">
                                Waist %ile
                            </button>
                            <button onClick={() => setShowPediatricMAMC(true)} className="bg-white p-3 rounded-lg shadow-sm text-sm font-bold text-purple-700 hover:bg-purple-100 transition border border-purple-200">
                                MAMC Analysis
                            </button>
                            <button onClick={() => setShowGrowthCharts(true)} className="bg-white p-3 rounded-lg shadow-sm text-sm font-bold text-purple-700 hover:bg-purple-100 transition border border-purple-200">
                                Growth Charts
                            </button>
                        </div>
                    </div>
                )}

                {/* 4. Instructions Button */}
                <div className="flex justify-end">
                    <button 
                        onClick={() => setShowInstructions(true)}
                        className="bg-gray-800 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-gray-900 transition shadow-md flex items-center gap-2"
                    >
                        <span>📋</span> Print Instructions
                    </button>
                </div>

            </div>
        </div>

        {/* Visit Modal */}
        {showVisitModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 animate-fade-in max-h-[90vh] overflow-y-auto">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <span>📅</span> New Visit Record
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Visit Date</label>
                            <input 
                                type="date" 
                                className="w-full p-2 border rounded"
                                value={visitFormData.visit_date || ''}
                                onChange={e => setVisitFormData({...visitFormData, visit_date: e.target.value})}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Weight (kg)</label>
                                <input type="number" className="w-full p-2 border rounded font-bold" value={visitFormData.weight || ''} onChange={e => setVisitFormData({...visitFormData, weight: Number(e.target.value)})} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Height (cm)</label>
                                <input type="number" className="w-full p-2 border rounded" value={visitFormData.height || ''} onChange={e => setVisitFormData({...visitFormData, height: Number(e.target.value)})} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Waist (cm)</label>
                                <input type="number" className="w-full p-2 border rounded" value={visitFormData.waist || ''} onChange={e => setVisitFormData({...visitFormData, waist: Number(e.target.value)})} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Hip (cm)</label>
                                <input type="number" className="w-full p-2 border rounded" value={visitFormData.hip || ''} onChange={e => setVisitFormData({...visitFormData, hip: Number(e.target.value)})} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Visit Notes</label>
                            <textarea 
                                className="w-full p-2 border rounded h-24"
                                value={visitFormData.notes || ''}
                                onChange={e => setVisitFormData({...visitFormData, notes: e.target.value})}
                                placeholder="Progress, changes, complaints..."
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <button onClick={() => setShowVisitModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                        <button onClick={handleSaveVisit} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold">Save Visit</button>
                    </div>
                </div>
            </div>
        )}

        {/* Lab Selector Modal */}
        {showLabSelector && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100] backdrop-blur-sm">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 animate-fade-in max-h-[85vh] flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <span>🧪</span> Select Labs
                        </h3>
                        <button onClick={() => setShowLabSelector(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                    </div>
                    
                    <div className="mb-4">
                        <input 
                            type="text" 
                            placeholder="Search tests..." 
                            value={labSearchQuery}
                            onChange={(e) => setLabSearchQuery(e.target.value)}
                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div className="flex-grow overflow-y-auto space-y-6 pr-2">
                        {/* 1. Quick Panels */}
                        <div>
                            <h4 className="text-sm font-bold text-blue-800 uppercase mb-2">Quick Panels</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {labPanels.map(panel => (
                                    <button 
                                        key={panel.id}
                                        onClick={() => handleToolNoteSave(`[Lab Panel: ${panel.title}]\n` + panel.tests.map(t => `• ${t}`).join('\n'))}
                                        className="p-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-left transition group"
                                    >
                                        <div className="font-bold text-blue-900 group-hover:text-blue-700">{panel.title}</div>
                                        <div className="text-xs text-blue-600 font-arabic mt-0.5">{panel.titleAr}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 2. Individual Tests */}
                        <div>
                            <h4 className="text-sm font-bold text-gray-500 uppercase mb-2">Individual Tests</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {labTestsEncyclopedia
                                    .filter(t => t.test.toLowerCase().includes(labSearchQuery.toLowerCase()))
                                    .map((item, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => toggleLab(item.test)}
                                        className={`p-2 text-xs text-left rounded border transition ${
                                            selectedLabItems.includes(item.test) 
                                            ? 'bg-green-100 border-green-300 text-green-800 font-bold' 
                                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                                        }`}
                                    >
                                        {item.test}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 flex justify-end">
                        <button 
                            onClick={handleUpdateLabNotes}
                            disabled={selectedLabItems.length === 0}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-50"
                        >
                            Add Selected ({selectedLabItems.length})
                        </button>
                    </div>
                </div>
            </div>
        )}

    </div>
  );
};

export default ClientManager;
