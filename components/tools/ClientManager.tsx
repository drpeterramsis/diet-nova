
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

// Helper for Plan Stats
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

// Waist Circumference Percentiles
const WAIST_PERCENTILES: Record<'boys' | 'girls', Record<number, [number, number, number]>> = {
    boys: {
        2: [42.9, 47.1, 50.6], 3: [44.7, 49.2, 54.0], 4: [46.5, 51.3, 57.4], 5: [48.3, 53.3, 60.8],
        6: [50.1, 55.4, 64.2], 7: [51.9, 57.5, 67.6], 8: [53.7, 59.6, 71.0], 9: [55.5, 61.7, 74.3],
        10: [57.3, 63.7, 77.7], 11: [59.1, 65.8, 81.1], 12: [60.9, 67.9, 84.5], 13: [62.7, 70.0, 87.9],
        14: [64.5, 72.1, 91.3], 15: [66.3, 74.1, 94.7], 16: [68.1, 76.2, 98.1], 17: [69.9, 78.3, 101.5],
        18: [71.7, 80.4, 104.9]
    },
    girls: {
        2: [43.1, 47.4, 52.5], 3: [44.7, 49.3, 55.4], 4: [46.3, 51.2, 58.2], 5: [47.9, 53.1, 61.1],
        6: [49.5, 55.0, 64.0], 7: [51.1, 56.9, 66.8], 8: [52.7, 58.8, 69.7], 9: [54.3, 60.7, 72.6],
        10: [55.9, 62.5, 75.5], 11: [57.5, 64.4, 78.3], 12: [59.1, 66.3, 81.2], 13: [60.7, 68.2, 84.1],
        14: [62.3, 70.1, 86.9], 15: [63.9, 72.1, 89.8], 16: [65.5, 73.9, 92.7], 17: [67.1, 75.8, 95.5],
        18: [68.7, 77.7, 98.4]
    }
};

const WaistCircumferenceTable: React.FC<{gender: 'male' | 'female'}> = ({ gender }) => {
    const data = gender === 'male' ? WAIST_PERCENTILES.boys : WAIST_PERCENTILES.girls;
    return (
        <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden text-xs">
            <div className="bg-gray-100 p-2 font-bold text-center border-b border-gray-200">
                Waist Circumference Percentiles (cm) - {gender === 'male' ? 'Boys' : 'Girls'}
            </div>
            <div className="overflow-x-auto max-h-48 overflow-y-auto">
                <table className="w-full text-center">
                    <thead className="bg-gray-50 sticky top-0">
                        <tr>
                            <th className="p-1 border-r">Age</th>
                            <th className="p-1 border-r text-gray-500">10th</th>
                            <th className="p-1 border-r text-green-600 font-bold">50th</th>
                            <th className="p-1 text-red-500 font-bold">90th</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {Object.entries(data).map(([age, vals]) => (
                            <tr key={age} className="hover:bg-blue-50">
                                <td className="p-1 font-bold border-r bg-gray-50">{age}y</td>
                                <td className="p-1 border-r text-gray-600">{vals[0]}</td>
                                <td className="p-1 border-r font-medium text-green-700">{vals[1]}</td>
                                <td className="p-1 text-red-600 font-medium">{vals[2]}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="p-1 text-[10px] text-gray-500 bg-gray-50 border-t text-center">
                > 90th percentile increases risk for cardiovascular factors & insulin resistance.
            </div>
        </div>
    );
};

const getDefaultNotes = (gender: 'male' | 'female') => {
    return `[General Notes]\n-\n\n`;
};

const generateCode = (name: string) => {
    if (!name) return '';
    const initials = name.trim().split(/\s+/).map(n => n[0]).join('').toUpperCase().slice(0, 3);
    const random = Math.floor(1000 + Math.random() * 9000);
    const year = new Date().getFullYear().toString().slice(-2);
    return `${initials}-${year}-${random}`;
};

interface ClientManagerProps {
  initialClientId?: string | null;
  onAnalyzeInKcal?: (client: Client, visit: ClientVisit) => void;
  onPlanMeals?: (client: Client, visit: ClientVisit) => void;
  onRunNFPE?: (client: Client) => void;
  autoOpenNew?: boolean;
}

const ClientManager: React.FC<ClientManagerProps> = ({ initialClientId, onAnalyzeInKcal, onPlanMeals, onRunNFPE, autoOpenNew }) => {
  const { t, isRTL } = useLanguage();
  const { session } = useAuth();
  
  // View State
  const [viewMode, setViewMode] = useState<'list' | 'details' | 'dietary-recall' | 'food-questionnaire' | 'lab-checklist' | 'strong-kids'>('list');

  // Data State
  const [clients, setClients] = useState<Client[]>([]);
  const [visits, setVisits] = useState<ClientVisit[]>([]); 
  const [loading, setLoading] = useState(true);
  const [loadingVisits, setLoadingVisits] = useState(false);
  
  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'visits' | 'report'>('profile');
  
  // Forms
  const [formData, setFormData] = useState({
    client_code: '',
    full_name: '',
    visit_date: new Date().toISOString().split('T')[0],
    dob: '',
    clinic: '',
    phone: '',
    notes: '',
    age: '' as number | '',
    gender: 'male' as 'male' | 'female',
    marital_status: 'single',
    kids_count: '' as number | '',
    job: '',
    weight: '' as number | '',
    height: '' as number | '',
    waist: '' as number | '',
    hip: '' as number | '',
    miac: '' as number | '',
    head_circumference: '' as number | ''
  });

  const [newVisitData, setNewVisitData] = useState({
      visit_date: new Date().toISOString().split('T')[0],
      weight: '' as number | '',
      height: '' as number | '',
      waist: '' as number | '',
      hip: '' as number | '',
      miac: '' as number | '',
      head_circumference: '' as number | '',
      notes: ''
  });

  const [formError, setFormError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchClients();
  }, [session]);

  const fetchClients = async () => {
    if (!session) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('doctor_id', session.user.id)
        .order('visit_date', { ascending: false });

      if (error) throw error;
      if (data) setClients(data);
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
          
          if (data) setVisits(data);
      } catch (err) {
          console.error("Error fetching visits:", err);
          setVisits([]);
      } finally {
          setLoadingVisits(false);
      }
  };

  const handleOpenProfile = (client?: Client) => {
    setFormError('');
    setSaveSuccess('');
    setActiveTab('profile');
    
    if (client) {
      setEditingClient(client);
      setFormData({
        client_code: client.client_code || '',
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
        age: formData.age === '' ? null : Number(formData.age),
        kids_count: formData.kids_count === '' ? null : Number(formData.kids_count),
        client_code: formData.client_code || generateCode(formData.full_name),
        weight: formData.weight === '' ? null : Number(formData.weight),
        height: formData.height === '' ? null : Number(formData.height),
        waist: formData.waist === '' ? null : Number(formData.waist),
        hip: formData.hip === '' ? null : Number(formData.hip),
        miac: formData.miac === '' ? null : Number(formData.miac),
        head_circumference: formData.head_circumference === '' ? null : Number(formData.head_circumference),
      };

      if (editingClient) {
        const { error } = await supabase.from('clients').update(payload).eq('id', editingClient.id);
        if (error) throw error;
        setSaveSuccess('Client Profile Updated!');
      } else {
        const { data, error } = await supabase.from('clients').insert([payload]).select().single();
        if (error) throw error;
        if (data) setEditingClient(data);
        setSaveSuccess('New Client Added!');
      }
      fetchClients();
    } catch (err: any) {
      console.error(err);
      setFormError(err.message || "Error saving profile.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddVisit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingClient) return;
      setSubmitting(true);
      try {
          const payload = {
              client_id: editingClient.id,
              ...newVisitData,
              weight: newVisitData.weight || null,
              height: newVisitData.height || null,
              waist: newVisitData.waist || null,
              hip: newVisitData.hip || null,
              miac: newVisitData.miac || null,
              head_circumference: newVisitData.head_circumference || null,
          };

          const { error } = await supabase.from('client_visits').insert([payload]);
          if (error) throw error;
          
          fetchVisits(editingClient.id);
          setNewVisitData({
              visit_date: new Date().toISOString().split('T')[0],
              weight: '', height: '', waist: '', hip: '', miac: '', head_circumference: '', notes: ''
          });
          setSaveSuccess("Visit Added!");
      } catch (err: any) {
          alert("Error adding visit: " + err.message);
      } finally {
          setSubmitting(false);
      }
  };

  // --- RENDER ---

  if (viewMode === 'list') {
      return (
          <div className="animate-fade-in">
              <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">{t.clients.title}</h2>
                  <button onClick={() => handleOpenProfile()} className="bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg font-bold shadow-md hover:opacity-90">
                      {t.clients.addClient}
                  </button>
              </div>
              
              <div className="mb-4">
                  <input 
                    type="text" 
                    placeholder="Search clients..." 
                    className="w-full p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 outline-none"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
              </div>

              {loading ? (
                  <Loading />
              ) : (
                  <div className="grid gap-4">
                      {clients.filter(c => c.full_name.toLowerCase().includes(searchQuery.toLowerCase())).map(client => (
                          <div key={client.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center hover:shadow-md transition">
                              <div>
                                  <h3 className="font-bold text-lg text-gray-800">{client.full_name}</h3>
                                  <p className="text-sm text-gray-500">
                                      {client.clinic || 'No Clinic'} • {new Date(client.visit_date).toLocaleDateString()}
                                  </p>
                              </div>
                              <button onClick={() => handleOpenProfile(client)} className="text-blue-600 hover:bg-blue-50 px-3 py-1 rounded font-medium">
                                  Open
                              </button>
                          </div>
                      ))}
                      {clients.length === 0 && <div className="text-center text-gray-500 py-8">{t.clients.noClients}</div>}
                  </div>
              )}
          </div>
      );
  }

  // --- DETAILS VIEW ---
  return (
      <div className="animate-fade-in">
          <div className="flex items-center gap-4 mb-6">
              <button onClick={() => setViewMode('list')} className="text-gray-500 hover:text-gray-700 bg-gray-100 px-3 py-1 rounded-lg">← Back</button>
              <h2 className="text-2xl font-bold text-gray-800">{editingClient ? editingClient.full_name : 'New Client'}</h2>
          </div>

          <div className="flex gap-2 mb-6 bg-white p-1 rounded-lg border shadow-sm">
              <button onClick={() => setActiveTab('profile')} className={`flex-1 py-2 rounded-md font-bold transition ${activeTab === 'profile' ? 'bg-[var(--color-primary)] text-white' : 'text-gray-500 hover:bg-gray-50'}`}>Profile</button>
              <button onClick={() => setActiveTab('visits')} disabled={!editingClient} className={`flex-1 py-2 rounded-md font-bold transition ${activeTab === 'visits' ? 'bg-[var(--color-primary)] text-white' : 'text-gray-500 hover:bg-gray-50 disabled:opacity-50'}`}>Visits</button>
              <button onClick={() => setActiveTab('report')} disabled={!editingClient} className={`flex-1 py-2 rounded-md font-bold transition ${activeTab === 'report' ? 'bg-[var(--color-primary)] text-white' : 'text-gray-500 hover:bg-gray-50 disabled:opacity-50'}`}>Tools</button>
          </div>

          {activeTab === 'profile' && (
              <form onSubmit={handleSubmitProfile} className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">{t.clients.name}</label>
                          <input type="text" required value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="w-full p-2 border rounded-lg" />
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">{t.clients.visitDate}</label>
                          <input type="date" required value={formData.visit_date} onChange={e => setFormData({...formData, visit_date: e.target.value})} className="w-full p-2 border rounded-lg" />
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">{t.clients.phone}</label>
                          <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full p-2 border rounded-lg" />
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">{t.clients.clinic}</label>
                          <input type="text" value={formData.clinic} onChange={e => setFormData({...formData, clinic: e.target.value})} className="w-full p-2 border rounded-lg" />
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">{t.kcal.gender}</label>
                          <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value as any})} className="w-full p-2 border rounded-lg">
                              <option value="male">{t.kcal.male}</option>
                              <option value="female">{t.kcal.female}</option>
                          </select>
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">{t.kcal.dob}</label>
                          <input type="date" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} className="w-full p-2 border rounded-lg" />
                      </div>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-100">
                      <h3 className="font-bold text-gray-800 mb-3">Latest Measurements</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <input type="number" placeholder="Wt (kg)" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value === '' ? '' : Number(e.target.value)})} className="p-2 border rounded" />
                          <input type="number" placeholder="Ht (cm)" value={formData.height} onChange={e => setFormData({...formData, height: e.target.value === '' ? '' : Number(e.target.value)})} className="p-2 border rounded" />
                          <input type="number" placeholder="Waist (cm)" value={formData.waist} onChange={e => setFormData({...formData, waist: e.target.value === '' ? '' : Number(e.target.value)})} className="p-2 border rounded" />
                          <input type="number" placeholder="Hip (cm)" value={formData.hip} onChange={e => setFormData({...formData, hip: e.target.value === '' ? '' : Number(e.target.value)})} className="p-2 border rounded" />
                      </div>
                  </div>

                  <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">{t.clients.notes}</label>
                      <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full p-2 border rounded-lg h-32" />
                  </div>

                  {saveSuccess && <div className="text-green-600 font-bold">{saveSuccess}</div>}
                  {formError && <div className="text-red-600 font-bold">{formError}</div>}

                  <button type="submit" disabled={submitting} className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 disabled:opacity-50">
                      {submitting ? 'Saving...' : 'Save Profile'}
                  </button>
              </form>
          )}

          {activeTab === 'visits' && editingClient && (
              <div className="space-y-6">
                  {/* Add Visit Form */}
                  <form onSubmit={handleAddVisit} className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
                      <h3 className="font-bold text-blue-800 mb-4">Add New Visit</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <input type="date" required value={newVisitData.visit_date} onChange={e => setNewVisitData({...newVisitData, visit_date: e.target.value})} className="p-2 border rounded" />
                          <input type="number" placeholder="Weight (kg)" value={newVisitData.weight} onChange={e => setNewVisitData({...newVisitData, weight: e.target.value === '' ? '' : Number(e.target.value)})} className="p-2 border rounded" />
                          <input type="text" placeholder="Notes..." value={newVisitData.notes} onChange={e => setNewVisitData({...newVisitData, notes: e.target.value})} className="p-2 border rounded" />
                      </div>
                      <button type="submit" disabled={submitting} className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700 disabled:opacity-50 text-sm">Add Visit</button>
                  </form>

                  {/* Visits List */}
                  <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                      <table className="w-full text-sm text-left">
                          <thead className="bg-gray-50 text-gray-700 font-bold">
                              <tr>
                                  <th className="p-3">Date</th>
                                  <th className="p-3">Weight</th>
                                  <th className="p-3">BMI</th>
                                  <th className="p-3">Notes</th>
                                  <th className="p-3">Actions</th>
                              </tr>
                          </thead>
                          <tbody>
                              {visits.map(v => (
                                  <tr key={v.id} className="border-t hover:bg-gray-50">
                                      <td className="p-3">{new Date(v.visit_date).toLocaleDateString()}</td>
                                      <td className="p-3 font-bold">{v.weight} kg</td>
                                      <td className="p-3">{v.bmi}</td>
                                      <td className="p-3 text-gray-500 truncate max-w-xs">{v.notes}</td>
                                      <td className="p-3 flex gap-2">
                                          {onAnalyzeInKcal && <button onClick={() => onAnalyzeInKcal(editingClient, v)} className="text-blue-600 hover:underline text-xs">Analyze</button>}
                                          {onPlanMeals && <button onClick={() => onPlanMeals(editingClient, v)} className="text-purple-600 hover:underline text-xs">Plan</button>}
                                      </td>
                                  </tr>
                              ))}
                              {visits.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-gray-400">No visits recorded.</td></tr>}
                          </tbody>
                      </table>
                  </div>
              </div>
          )}

          {activeTab === 'report' && editingClient && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {onRunNFPE && (
                      <button onClick={() => onRunNFPE(editingClient)} className="p-6 bg-white border rounded-xl hover:shadow-lg transition text-left group">
                          <span className="text-2xl block mb-2">🩺</span>
                          <h3 className="font-bold text-gray-800 group-hover:text-blue-600">NFPE Assessment</h3>
                          <p className="text-sm text-gray-500">Run physical exam checklist</p>
                      </button>
                  )}
                  {/* Placeholders for other tools if implemented */}
                  <div className="p-6 bg-gray-50 border rounded-xl text-center text-gray-400">
                      More tools coming soon...
                  </div>
              </div>
          )}
      </div>
  );
};

export default ClientManager;
