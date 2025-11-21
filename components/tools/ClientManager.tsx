import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Client, ClientVisit } from '../../types';
import Loading from '../Loading';

interface ClientManagerProps {
  initialClientId?: string | null;
}

type SortOption = 'date_desc' | 'date_asc' | 'name_asc' | 'name_desc' | 'clinic';
type GroupOption = 'none' | 'clinic' | 'month';

const ClientManager: React.FC<ClientManagerProps> = ({ initialClientId }) => {
  const { t, isRTL } = useLanguage();
  const { session } = useAuth();
  
  // Data State
  const [clients, setClients] = useState<Client[]>([]);
  const [visits, setVisits] = useState<ClientVisit[]>([]); // Current selected client visits
  const [loading, setLoading] = useState(true);
  const [loadingVisits, setLoadingVisits] = useState(false);
  const [tableError, setTableError] = useState(false);
  
  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date_desc');
  const [groupBy, setGroupBy] = useState<GroupOption>('none');
  
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'visits'>('profile');

  // Unique Clinics for Autocomplete
  const uniqueClinics = useMemo(() => {
      const clinics = clients.map(c => c.clinic).filter(Boolean);
      return [...new Set(clinics)];
  }, [clients]);

  // Form State
  const [formData, setFormData] = useState<{
    full_name: string;
    visit_date: string;
    clinic: string;
    phone: string;
    notes: string;
    age: number | '';
    gender: 'male' | 'female';
  }>({
    full_name: '',
    visit_date: new Date().toISOString().split('T')[0],
    clinic: '',
    phone: '',
    notes: '',
    age: '',
    gender: 'male'
  });
  
  const [newVisitData, setNewVisitData] = useState<{
      visit_date: string;
      weight: number | '';
      notes: string;
  }>({
      visit_date: new Date().toISOString().split('T')[0],
      weight: '',
      notes: ''
  });

  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchClients();
  }, [session]);

  // Deep linking effect
  useEffect(() => {
      if (initialClientId && clients.length > 0 && !showModal) {
          const targetClient = clients.find(c => c.id === initialClientId);
          if (targetClient) {
              handleOpenModal(targetClient, true);
          }
      }
  }, [initialClientId, clients]);

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
          // Attempt to fetch from client_visits table
          const { data, error } = await supabase
            .from('client_visits')
            .select('*')
            .eq('client_id', clientId)
            .order('visit_date', { ascending: false });
          
          if (error) {
              // If table doesn't exist yet, just return empty array
              if (error.code === '42P01') {
                   console.warn("client_visits table not found");
                   setVisits([]);
              } else {
                  throw error;
              }
          } else {
              setVisits(data || []);
          }
      } catch (err) {
          console.error("Error fetching visits:", err);
          setVisits([]);
      } finally {
          setLoadingVisits(false);
      }
  };

  // --- Sorting & Grouping Logic ---
  const processedClients = useMemo(() => {
      let list = [...clients];

      // 1. Search
      if (searchQuery) {
          const q = searchQuery.toLowerCase();
          list = list.filter(c => 
              c.full_name.toLowerCase().includes(q) || 
              c.clinic?.toLowerCase().includes(q) ||
              c.phone?.includes(q)
          );
      }

      // 2. Sort
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
          if (groupBy === 'clinic') {
              key = client.clinic || 'Unspecified Location';
          } else if (groupBy === 'month') {
              const d = new Date(client.visit_date);
              key = d.toLocaleString('default', { month: 'long', year: 'numeric' });
          }
          
          if (!groups[key]) groups[key] = [];
          groups[key].push(client);
      });

      return groups;
  }, [processedClients, groupBy]);

  // --- Modal Handlers ---
  const handleOpenModal = (client?: Client, viewOnly: boolean = false) => {
    setFormError('');
    setActiveTab('profile');
    
    if (client) {
      setEditingClient(client);
      setFormData({
        full_name: client.full_name,
        visit_date: client.visit_date,
        clinic: client.clinic || '',
        phone: client.phone || '',
        notes: client.notes || '',
        age: client.age || '',
        gender: client.gender || 'male'
      });
      // Fetch visits when opening
      fetchVisits(client.id);
    } else {
      setEditingClient(null);
      setVisits([]);
      setFormData({
        full_name: '',
        visit_date: new Date().toISOString().split('T')[0],
        clinic: '', // Will populate from datalist
        phone: '',
        notes: '',
        age: '',
        gender: 'male'
      });
    }
    setIsViewMode(viewOnly);
    setShowModal(true);
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
        age: formData.age === '' ? null : Number(formData.age)
      };

      let response;
      if (editingClient) {
        response = await supabase
          .from('clients')
          .update(payload)
          .eq('id', editingClient.id)
          .select()
          .single();
      } else {
        response = await supabase
          .from('clients')
          .insert(payload)
          .select()
          .single();
      }

      if (response.error) throw response.error;

      if (response.data) {
        if (editingClient) {
          setClients(prev => prev.map(c => c.id === editingClient.id ? response.data : c));
          setEditingClient(response.data); // Update local state
        } else {
          setClients(prev => [response.data, ...prev]);
          setEditingClient(response.data); // Switch to edit mode for new client
        }
        // If not view mode, maybe stay open? Or close. Let's stay open to add visits if needed
        if (!editingClient) {
             // If it was a new add, ask if they want to add visits or close
             setIsViewMode(true); // Switch to view/edit mode
        } else {
            setShowModal(false);
        }
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
          const { data, error } = await supabase.from('client_visits').insert({
              client_id: editingClient.id,
              visit_date: newVisitData.visit_date,
              weight: newVisitData.weight === '' ? null : Number(newVisitData.weight),
              notes: newVisitData.notes
          }).select().single();

          if (error) throw error;

          if (data) {
              setVisits(prev => [data, ...prev]);
              // Also update the client's "last visit date" if this date is newer
              if (new Date(data.visit_date) > new Date(editingClient.visit_date)) {
                   const { data: updatedClient } = await supabase.from('clients').update({
                       visit_date: data.visit_date
                   }).eq('id', editingClient.id).select().single();
                   
                   if (updatedClient) {
                       setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
                       setEditingClient(updatedClient);
                   }
              }
              // Reset form
              setNewVisitData({
                  visit_date: new Date().toISOString().split('T')[0],
                  weight: '',
                  notes: ''
              });
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
            placeholder={`${t.common.search} (Name, Clinic, Phone)`}
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
                                                        onClick={() => handleOpenModal(client, true)}
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
             
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
                     <form id="clientForm" onSubmit={handleSubmitProfile} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div className="md:col-span-2">
                                 <label className="block text-sm font-medium text-gray-700 mb-1">{t.clients.name} *</label>
                                 <input 
                                    type="text" 
                                    required
                                    value={formData.full_name}
                                    onChange={e => setFormData({...formData, full_name: e.target.value})}
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                                    placeholder="Client Full Name"
                                 />
                             </div>
                             
                             <div>
                                 <label className="block text-sm font-medium text-gray-700 mb-1">Last Visit Date *</label>
                                 <input 
                                    type="date" 
                                    required
                                    value={formData.visit_date}
                                    onChange={e => setFormData({...formData, visit_date: e.target.value})}
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                                 />
                             </div>
                             
                             <div>
                                 <label className="block text-sm font-medium text-gray-700 mb-1">{t.clients.phone}</label>
                                 <input 
                                    type="text" 
                                    value={formData.phone}
                                    onChange={e => setFormData({...formData, phone: e.target.value})}
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                                    dir="ltr"
                                    placeholder="+20..."
                                 />
                             </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                             <div>
                                 <label className="block text-sm font-medium text-gray-700 mb-1">{t.clients.age}</label>
                                 <input 
                                    type="number" 
                                    value={formData.age}
                                    onChange={e => setFormData({...formData, age: e.target.value === '' ? '' : Number(e.target.value)})}
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                                    dir="ltr"
                                 />
                             </div>
                             <div>
                                 <label className="block text-sm font-medium text-gray-700 mb-1">{t.clients.gender}</label>
                                 <select 
                                    value={formData.gender}
                                    onChange={e => setFormData({...formData, gender: e.target.value as 'male' | 'female'})}
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none bg-white"
                                 >
                                     <option value="male">{t.kcal.male}</option>
                                     <option value="female">{t.kcal.female}</option>
                                 </select>
                             </div>
                             <div>
                                 <label className="block text-sm font-medium text-gray-700 mb-1">{t.clients.clinic}</label>
                                 <input 
                                    type="text" 
                                    list="clinic-options"
                                    value={formData.clinic}
                                    onChange={e => setFormData({...formData, clinic: e.target.value})}
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                                    placeholder="Select or type..."
                                 />
                                 <datalist id="clinic-options">
                                     {uniqueClinics.map(c => <option key={c} value={c} />)}
                                 </datalist>
                             </div>
                        </div>
                        
                        <div>
                             <label className="block text-sm font-medium text-gray-700 mb-1">Profile Notes (Medical History)</label>
                             <textarea 
                                rows={4}
                                value={formData.notes}
                                onChange={e => setFormData({...formData, notes: e.target.value})}
                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none resize-none"
                                placeholder="Allergies, chronic conditions, etc."
                             ></textarea>
                        </div>
                    </form>
                )}

                {/* TAB: VISITS HISTORY */}
                {activeTab === 'visits' && editingClient && (
                    <div className="space-y-6 animate-fade-in">
                        
                        {/* Add New Visit Form */}
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                            <h4 className="font-bold text-blue-800 mb-3 text-sm uppercase">Record New Visit</h4>
                            <form onSubmit={handleAddVisit} className="flex flex-col gap-3">
                                <div className="flex flex-col md:flex-row gap-3">
                                    <div className="flex-1">
                                        <input 
                                            type="date" 
                                            required
                                            className="w-full p-2 rounded border border-blue-200 text-sm"
                                            value={newVisitData.visit_date}
                                            onChange={e => setNewVisitData({...newVisitData, visit_date: e.target.value})}
                                        />
                                    </div>
                                    <div className="w-24">
                                        <input 
                                            type="number" 
                                            placeholder="Wt (kg)"
                                            className="w-full p-2 rounded border border-blue-200 text-sm"
                                            value={newVisitData.weight}
                                            onChange={e => setNewVisitData({...newVisitData, weight: e.target.value === '' ? '' : Number(e.target.value)})}
                                        />
                                    </div>
                                    <div className="flex-[2]">
                                        <input 
                                            type="text" 
                                            placeholder="Visit notes (progress, diet changes...)"
                                            className="w-full p-2 rounded border border-blue-200 text-sm"
                                            value={newVisitData.notes}
                                            onChange={e => setNewVisitData({...newVisitData, notes: e.target.value})}
                                        />
                                    </div>
                                    <button 
                                        type="submit"
                                        disabled={submitting}
                                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm font-bold disabled:opacity-50"
                                    >
                                        Add
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
                                    
                                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 hover:shadow-sm transition flex justify-between items-start group">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-bold text-gray-800 text-sm">
                                                    {new Date(visit.visit_date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                                                </span>
                                                {visit.weight && (
                                                    <span className="bg-white border border-gray-200 px-2 py-0.5 rounded text-xs font-mono font-bold text-blue-600">
                                                        {visit.weight} kg
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-600 whitespace-pre-wrap">{visit.notes || 'No notes.'}</p>
                                        </div>
                                        <button 
                                            onClick={() => handleDeleteVisit(visit.id)}
                                            className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                                            title="Delete Visit"
                                        >
                                            ×
                                        </button>
                                    </div>
                                </div>
                            ))}
                            
                            {/* Initial Profile Visit Anchor */}
                            <div className="relative pl-6">
                                <div className="absolute -left-[9px] top-0 w-4 h-4 bg-gray-300 rounded-full"></div>
                                <div className="text-xs text-gray-400 uppercase font-bold pt-0.5">Profile Created / Initial Record</div>
                                <div className="text-sm text-gray-500">{new Date(editingClient.created_at).toLocaleDateString()}</div>
                            </div>
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