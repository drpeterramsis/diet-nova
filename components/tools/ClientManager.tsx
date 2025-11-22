

import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Client, ClientVisit } from '../../types';
import Loading from '../Loading';

interface ClientManagerProps {
  initialClientId?: string | null;
  onAnalyzeInKcal?: (client: Client, visit: ClientVisit) => void;
  autoOpenNew?: boolean;
}

type SortOption = 'date_desc' | 'date_asc' | 'name_asc' | 'name_desc' | 'clinic';
type GroupOption = 'none' | 'clinic' | 'month';

// Updated Tags with Emojis
const QUICK_TAGS = [
    "🚬 Smoking", "☕ Caffeine", "💧 Water Intake", 
    "😴 Sleep Apnea", "🍔 Fast Food", "🍬 High Sugar", 
    "🥤 Soda", "🛋️ Sedentary", "🏃 Active", 
    "🥗 Vegetarian", "🏥 Surgery", "💊 Meds"
];

const ClientManager: React.FC<ClientManagerProps> = ({ initialClientId, onAnalyzeInKcal, autoOpenNew }) => {
  const { t, isRTL } = useLanguage();
  const { session } = useAuth();
  
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
  
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'visits'>('profile');
  const [noJob, setNoJob] = useState(false);

  // Unique Clinics
  const uniqueClinics = useMemo(() => {
      const clinics = clients.map(c => c.clinic).filter(Boolean);
      return [...new Set(clinics)];
  }, [clients]);

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
    // Anthropometrics for profile/first visit
    weight: number | '';
    height: number | '';
    waist: number | '';
    hip: number | '';
    miac: number | '';
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
    miac: ''
  });
  
  // Computed BMI for Profile
  const profileBMI = useMemo(() => {
      const w = Number(formData.weight);
      const h = Number(formData.height) / 100;
      if (w > 0 && h > 0) return (w / (h * h)).toFixed(1);
      return '';
  }, [formData.weight, formData.height]);

  // Form State (New Visit)
  const [newVisitData, setNewVisitData] = useState<{
      visit_date: string;
      weight: number | '';
      height: number | '';
      waist: number | '';
      hip: number | '';
      miac: number | '';
      notes: string;
  }>({
      visit_date: new Date().toISOString().split('T')[0],
      weight: '',
      height: '',
      waist: '',
      hip: '',
      miac: '',
      notes: ''
  });

  // Edit Visit State
  const [editingVisit, setEditingVisit] = useState<ClientVisit | null>(null);

  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchClients();
  }, [session]);

  useEffect(() => {
      if (autoOpenNew && !showModal && !initialClientId) {
          handleOpenModal();
      }
  }, [autoOpenNew]);

  // Deep linking effect
  useEffect(() => {
      if (initialClientId && clients.length > 0 && !showModal) {
          const targetClient = clients.find(c => c.id === initialClientId);
          if (targetClient) {
              handleOpenModal(targetClient);
          }
      }
  }, [initialClientId, clients]);

  // DOB / Age Calculation
  useEffect(() => {
      if (formData.dob) {
          const birth = new Date(formData.dob);
          const visit = new Date(formData.visit_date);
          if (!isNaN(birth.getTime()) && !isNaN(visit.getTime())) {
              let years = visit.getFullYear() - birth.getFullYear();
              const m = visit.getMonth() - birth.getMonth();
              if (m < 0 || (m === 0 && visit.getDate() < birth.getDate())) {
                  years--;
              }
              const calculatedAge = Math.max(0, years);
              if (formData.age !== calculatedAge) {
                 setFormData(prev => ({ ...prev, age: calculatedAge }));
              }
          }
      }
  }, [formData.dob, formData.visit_date]);
  
  // Job Toggle Effect
  useEffect(() => {
      if (noJob) {
          setFormData(prev => ({ ...prev, job: 'Unemployed / No Job' }));
      } else if (formData.job === 'Unemployed / No Job') {
          setFormData(prev => ({ ...prev, job: '' }));
      }
  }, [noJob]);

  const generateCode = (name: string) => {
      if (!name) return '';
      const initials = name.trim().split(/\s+/).map(n => n[0]).join('').toUpperCase().slice(0, 3);
      const random = Math.floor(1000 + Math.random() * 9000);
      const year = new Date().getFullYear().toString().slice(-2);
      return `${initials}-${year}-${random}`;
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
      setEditingVisit(null);
      try {
          const { data, error } = await supabase
            .from('client_visits')
            .select('*')
            .eq('client_id', clientId)
            .order('visit_date', { ascending: false });
          
          if (data) {
              setVisits(data);
              
              // Pre-fill new visit data with latest anthropometrics
              if (data.length > 0) {
                  const last = data[0];
                  setNewVisitData(prev => ({
                      ...prev,
                      weight: last.weight || '',
                      height: last.height || '',
                      waist: last.waist || '',
                      hip: last.hip || '',
                      miac: last.miac || '',
                      notes: '' // notes usually clear
                  }));
              }
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

  const handleOpenModal = (client?: Client) => {
    setFormError('');
    setActiveTab('profile');
    setEditingVisit(null);
    
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
        // Only used for new client creation, viewing client uses visits tab for this
        weight: client.weight || '',
        height: client.height || '',
        waist: client.waist || '',
        hip: client.hip || '',
        miac: client.miac || ''
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
        miac: ''
      });
    }
    setShowModal(true);
  };

  const addTag = (tag: string) => {
      setFormData(prev => ({
          ...prev,
          notes: (prev.notes ? prev.notes + '\n' : '') + `• ${tag}`
      }));
  };

  const handleSubmitProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name || !formData.visit_date) {
      setFormError("Name and Last Visit Date are required.");
      return;
    }
    setSubmitting(true);
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
        // If creating new client, we also want to create the first visit automatically
        // to store the anthropometrics in history
        if (!editingClient && (payload.weight || payload.height)) {
            await supabase.from('client_visits').insert({
                client_id: response.data.id,
                visit_date: response.data.visit_date,
                weight: payload.weight,
                height: payload.height,
                waist: payload.waist,
                hip: payload.hip,
                miac: payload.miac,
                bmi: payload.bmi,
                notes: "Initial Profile Visit"
            });
        }

        if (editingClient) {
          setClients(prev => prev.map(c => c.id === editingClient.id ? response.data : c));
          setEditingClient(response.data);
        } else {
          setClients(prev => [response.data, ...prev]);
          setEditingClient(response.data);
          fetchVisits(response.data.id); // Load the newly created visit
        }
        
        // Switch to visits tab if we edited, or if we just created
        if(!editingClient) setActiveTab('visits');
        else setShowModal(false);
      }
    } catch (err: any) {
      setFormError(err.message || "Failed to save client.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddVisit = async (e: React.FormEvent) => {
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

          const { data, error } = await supabase.from('client_visits').insert({
              client_id: editingClient.id,
              visit_date: newVisitData.visit_date,
              weight: weight,
              height: height,
              waist: newVisitData.waist === '' ? null : Number(newVisitData.waist),
              hip: newVisitData.hip === '' ? null : Number(newVisitData.hip),
              miac: newVisitData.miac === '' ? null : Number(newVisitData.miac),
              bmi: bmi,
              notes: newVisitData.notes
          }).select().single();

          if (error) throw error;

          if (data) {
              setVisits(prev => [data, ...prev]);
              // Update client profile last visit & latest stats
              if (new Date(data.visit_date) >= new Date(editingClient.visit_date)) {
                   const { data: updatedClient } = await supabase.from('clients').update({
                       visit_date: data.visit_date,
                       weight: data.weight,
                       height: data.height,
                       waist: data.waist,
                       hip: data.hip,
                       miac: data.miac,
                       bmi: data.bmi
                   }).eq('id', editingClient.id).select().single();
                   
                   if (updatedClient) {
                       setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
                       setEditingClient(updatedClient);
                   }
              }
              // Reset only notes, keep anthro for next entry usually
              setNewVisitData(prev => ({ ...prev, notes: '' }));
          }
      } catch (err: any) {
          alert("Failed to add visit: " + err.message);
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
    } catch (err: any) {
      alert("Error deleting client: " + err.message);
    }
  };

  const openKcalForVisit = (visit: ClientVisit) => {
      if (!editingClient || !onAnalyzeInKcal) return;
      onAnalyzeInKcal(editingClient, visit);
      setShowModal(false);
  };

  return (
    <div className="max-w-7xl mx-auto animate-fade-in space-y-6 pb-12">
      
      {/* --- Header & Controls --- */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-heading)] flex items-center gap-2">
            <span>👥</span> {t.clients.title}
          </h1>
          <p className="text-gray-500 text-sm mt-1">{t.tools.clients.desc}</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          disabled={tableError}
          className={`text-white px-6 py-3 rounded-lg shadow-md transition flex items-center gap-2 font-medium ${tableError ? 'bg-gray-300 cursor-not-allowed' : 'bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]'}`}
        >
          <span>+</span> {t.clients.addClient}
        </button>
      </div>

      {/* --- Search & Filter Bar --- */}
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

      {/* Error State */}
      {tableError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-700 animate-fade-in">
            <h3 className="text-lg font-bold mb-2">Database Configuration Error</h3>
            <p>The 'clients' table could not be found in the database schema.</p>
            <p className="text-sm mt-2">Please contact the administrator to initialize the database tables.</p>
        </div>
      )}

      {/* --- Client List --- */}
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
                                                    {new Date(client.visit_date).toLocaleDateString()}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-center text-gray-600 hidden sm:table-cell">
                                                    {client.clinic || '-'}
                                                </td>
                                                <td className="p-4 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button 
                                                        onClick={() => handleOpenModal(client)}
                                                        className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition text-sm font-medium"
                                                        >
                                                        Open
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

      {/* --- Main Modal --- */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[95vh]">
             
             {/* Modal Header */}
             <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
               <div className="flex items-center gap-3">
                   <h2 className="text-xl font-bold text-gray-800">
                       {editingClient ? editingClient.full_name : t.clients.addClient}
                   </h2>
                   {/* Tabs */}
                   {editingClient && (
                       <div className="flex bg-gray-200 rounded-lg p-1 ml-4">
                           <button 
                            onClick={() => setActiveTab('profile')}
                            className={`px-3 py-1 rounded-md text-sm font-medium transition ${activeTab === 'profile' ? 'bg-white shadow text-[var(--color-primary)]' : 'text-gray-600 hover:text-gray-800'}`}
                           >
                               Profile
                           </button>
                           <button 
                            onClick={() => setActiveTab('visits')}
                            className={`px-3 py-1 rounded-md text-sm font-medium transition ${activeTab === 'visits' ? 'bg-white shadow text-[var(--color-primary)]' : 'text-gray-600 hover:text-gray-800'}`}
                           >
                               History ({visits.length})
                           </button>
                       </div>
                   )}
               </div>
               <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
             </div>
             
             {/* Modal Content */}
             <div className="p-6 overflow-y-auto flex-grow">
                {formError && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">{formError}</div>}
                
                {/* TAB: PROFILE */}
                {activeTab === 'profile' && (
                     <form id="clientForm" onSubmit={handleSubmitProfile} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                             {/* Left Col: Core Info */}
                             <div className="md:col-span-5 space-y-4 bg-gray-50 p-4 rounded-lg">
                                 <h3 className="font-bold text-gray-700 text-sm uppercase border-b pb-1 mb-2">Core Identity</h3>
                                 
                                 <div>
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
                                 <div className="grid grid-cols-2 gap-2">
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
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Age</label>
                                        <input 
                                            type="number" 
                                            value={formData.age}
                                            onChange={e => setFormData({...formData, age: e.target.value === '' ? '' : Number(e.target.value)})}
                                            className="w-full p-2 border rounded outline-none bg-white text-sm"
                                        />
                                    </div>
                                 </div>
                                 <div>
                                     <label className="block text-xs font-bold text-gray-500 mb-1">DOB</label>
                                     <input 
                                        type="date" 
                                        value={formData.dob}
                                        onChange={e => setFormData({...formData, dob: e.target.value})}
                                        className="w-full p-2 border rounded outline-none text-sm"
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
                                 <div>
                                     <label className="block text-xs font-bold text-gray-500 mb-1">Client Code</label>
                                     <input 
                                        type="text" 
                                        value={formData.client_code}
                                        onChange={e => setFormData({...formData, client_code: e.target.value})}
                                        className="w-full p-2 border rounded outline-none font-mono text-sm bg-white"
                                     />
                                 </div>
                             </div>

                             {/* Right Col: Extended Info & Anthropometrics */}
                             <div className="md:col-span-7 space-y-4">
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
                                                onChange={e => setFormData({...formData, kids_count: e.target.value})}
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

                                 {/* Profile Anthropometrics */}
                                 <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                                     <h3 className="font-bold text-blue-800 text-xs uppercase mb-2">1st Visit Measurements</h3>
                                     <div className="grid grid-cols-3 gap-3">
                                         <div>
                                             <label className="block text-[10px] font-bold text-blue-600 uppercase">Weight (kg)</label>
                                             <input type="number" className="w-full p-1.5 text-sm border rounded" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} />
                                         </div>
                                         <div>
                                             <label className="block text-[10px] font-bold text-blue-600 uppercase">Height (cm)</label>
                                             <input type="number" className="w-full p-1.5 text-sm border rounded" value={formData.height} onChange={e => setFormData({...formData, height: e.target.value})} />
                                         </div>
                                         <div>
                                             <label className="block text-[10px] font-bold text-blue-600 uppercase">BMI</label>
                                             <div className="w-full p-1.5 text-sm border rounded bg-white font-mono text-center">{profileBMI || '-'}</div>
                                         </div>
                                         <div>
                                             <label className="block text-[10px] font-bold text-blue-600 uppercase">Waist (cm)</label>
                                             <input type="number" className="w-full p-1.5 text-sm border rounded" value={formData.waist} onChange={e => setFormData({...formData, waist: e.target.value})} />
                                         </div>
                                         <div>
                                             <label className="block text-[10px] font-bold text-blue-600 uppercase">Hip (cm)</label>
                                             <input type="number" className="w-full p-1.5 text-sm border rounded" value={formData.hip} onChange={e => setFormData({...formData, hip: e.target.value})} />
                                         </div>
                                         <div>
                                             <label className="block text-[10px] font-bold text-blue-600 uppercase">MIAC (cm)</label>
                                             <input type="number" className="w-full p-1.5 text-sm border rounded" value={formData.miac} onChange={e => setFormData({...formData, miac: e.target.value})} />
                                         </div>
                                     </div>
                                 </div>
                             </div>
                        </div>
                        
                        <div>
                             <label className="block text-xs font-bold text-gray-500 mb-2">Medical Notes & History</label>
                             
                             {/* Quick Tags */}
                             <div className="flex flex-wrap gap-2 mb-2">
                                 {QUICK_TAGS.map(tag => (
                                     <button
                                        key={tag}
                                        type="button"
                                        onClick={() => addTag(tag)}
                                        className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded border border-gray-200 transition"
                                     >
                                         + {tag}
                                     </button>
                                 ))}
                             </div>

                             <textarea 
                                rows={3}
                                value={formData.notes}
                                onChange={e => setFormData({...formData, notes: e.target.value})}
                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none resize-none whitespace-pre-wrap text-sm"
                                placeholder="Allergies, chronic conditions, past operations..."
                             ></textarea>
                        </div>
                    </form>
                )}

                {/* TAB: VISITS HISTORY */}
                {activeTab === 'visits' && editingClient && (
                    <div className="space-y-6 animate-fade-in">
                        
                        {/* Add New Visit Form */}
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                            <h4 className="font-bold text-blue-800 mb-3 text-sm uppercase">Record New Follow-up</h4>
                            <form onSubmit={handleAddVisit} className="space-y-3">
                                <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                                     <div className="md:col-span-2">
                                         <label className="block text-[10px] text-blue-600 uppercase font-bold mb-1">Date</label>
                                         <input 
                                            type="date" 
                                            required
                                            className="w-full p-2 rounded border border-blue-200 text-sm"
                                            value={newVisitData.visit_date}
                                            onChange={e => setNewVisitData({...newVisitData, visit_date: e.target.value})}
                                        />
                                     </div>
                                     <div>
                                         <label className="block text-[10px] text-blue-600 uppercase font-bold mb-1">Wt (kg)</label>
                                         <input type="number" className="w-full p-2 rounded border border-blue-200 text-sm" value={newVisitData.weight} onChange={e => setNewVisitData({...newVisitData, weight: e.target.value})} />
                                     </div>
                                     <div>
                                         <label className="block text-[10px] text-blue-600 uppercase font-bold mb-1">Ht (cm)</label>
                                         <input type="number" className="w-full p-2 rounded border border-blue-200 text-sm" value={newVisitData.height} onChange={e => setNewVisitData({...newVisitData, height: e.target.value})} />
                                     </div>
                                     <div>
                                         <label className="block text-[10px] text-blue-600 uppercase font-bold mb-1">Waist</label>
                                         <input type="number" className="w-full p-2 rounded border border-blue-200 text-sm" value={newVisitData.waist} onChange={e => setNewVisitData({...newVisitData, waist: e.target.value})} />
                                     </div>
                                     <div>
                                         <label className="block text-[10px] text-blue-600 uppercase font-bold mb-1">Hip</label>
                                         <input type="number" className="w-full p-2 rounded border border-blue-200 text-sm" value={newVisitData.hip} onChange={e => setNewVisitData({...newVisitData, hip: e.target.value})} />
                                     </div>
                                </div>
                                <div className="flex gap-3">
                                    <div className="flex-grow">
                                        <textarea 
                                            placeholder="Visit notes..."
                                            className="w-full p-2 rounded border border-blue-200 text-sm resize-none"
                                            rows={1}
                                            value={newVisitData.notes}
                                            onChange={e => setNewVisitData({...newVisitData, notes: e.target.value})}
                                        ></textarea>
                                    </div>
                                    <button 
                                        type="submit"
                                        disabled={submitting}
                                        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 text-sm font-bold disabled:opacity-50 self-start"
                                    >
                                        Add Visit
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Timeline List */}
                        <div className="relative border-l-2 border-gray-200 ml-3 space-y-6 pb-4">
                            {loadingVisits && <div className="pl-6 text-gray-400">Loading visits...</div>}
                            
                            {!loadingVisits && visits.length === 0 && (
                                <div className="pl-6 text-gray-400 italic text-sm">No follow-up visits recorded yet.</div>
                            )}

                            {visits.map((visit) => (
                                <div key={visit.id} className="relative pl-6">
                                    {/* Timeline Dot */}
                                    <div className="absolute -left-[9px] top-0 w-4 h-4 bg-white border-2 border-[var(--color-primary)] rounded-full"></div>
                                    
                                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 hover:shadow-md transition group">
                                         <div className="flex justify-between items-start mb-2">
                                             <div className="flex items-center gap-3">
                                                 <span className="font-bold text-gray-800">
                                                    {new Date(visit.visit_date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                                                 </span>
                                                 {/* Badges */}
                                                 <div className="flex gap-2 text-xs font-mono">
                                                     {visit.weight && <span className="bg-white border px-1.5 py-0.5 rounded text-blue-700">Wt: {visit.weight}</span>}
                                                     {visit.bmi && <span className="bg-white border px-1.5 py-0.5 rounded text-orange-700">BMI: {visit.bmi}</span>}
                                                 </div>
                                             </div>
                                             <div className="flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition">
                                                  <button 
                                                    onClick={() => openKcalForVisit(visit)}
                                                    className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold hover:bg-green-200 flex items-center gap-1"
                                                  >
                                                      <span>🧮</span> Kcal Calc
                                                  </button>
                                                  <button onClick={() => handleDeleteVisit(visit.id)} className="text-red-400 hover:text-red-600 px-2">×</button>
                                             </div>
                                         </div>
                                         
                                         {/* Stats Grid */}
                                         <div className="grid grid-cols-4 gap-2 text-xs text-gray-500 mb-2 bg-white p-2 rounded border border-gray-100">
                                             <div><span className="font-bold">Ht:</span> {visit.height || '-'}</div>
                                             <div><span className="font-bold">Waist:</span> {visit.waist || '-'}</div>
                                             <div><span className="font-bold">Hip:</span> {visit.hip || '-'}</div>
                                             <div><span className="font-bold">MIAC:</span> {visit.miac || '-'}</div>
                                         </div>

                                         {visit.notes && (
                                             <p className="text-sm text-gray-600 whitespace-pre-wrap border-l-2 border-gray-200 pl-2">{visit.notes}</p>
                                         )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
             </div>

             {/* Footer Actions */}
             <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                <button 
                   onClick={() => setShowModal(false)}
                   className="px-6 py-2.5 rounded-lg bg-white border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition"
                >
                   {t.common.close}
                </button>
                
                {activeTab === 'profile' && (
                    <button 
                    type="submit" 
                    form="clientForm"
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-lg bg-[var(--color-primary)] text-white font-medium hover:bg-[var(--color-primary-hover)] transition disabled:opacity-50"
                    >
                    {submitting ? 'Saving...' : t.common.save}
                    </button>
                )}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientManager;