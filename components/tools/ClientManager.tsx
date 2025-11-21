
import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Client } from '../../types';
import Loading from '../Loading';

interface ClientManagerProps {
  initialClientId?: string | null;
}

const ClientManager: React.FC<ClientManagerProps> = ({ initialClientId }) => {
  const { t, isRTL } = useLanguage();
  const { session } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);
  const [tableError, setTableError] = useState(false);

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
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchClients();
  }, [session]);

  // Deep linking effect: If initialClientId is passed, try to find and open that client
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
          // Check if error relates to missing table
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

  const filteredClients = useMemo(() => {
    if (!searchQuery) return clients;
    const lower = searchQuery.toLowerCase();
    return clients.filter(c => 
      c.full_name.toLowerCase().includes(lower) || 
      c.clinic.toLowerCase().includes(lower)
    );
  }, [clients, searchQuery]);

  const handleOpenModal = (client?: Client, viewOnly: boolean = false) => {
    setFormError('');
    if (client) {
      setEditingClient(client);
      setFormData({
        full_name: client.full_name,
        visit_date: client.visit_date,
        clinic: client.clinic,
        phone: client.phone || '',
        notes: client.notes || '',
        age: client.age || '',
        gender: client.gender || 'male'
      });
    } else {
      setEditingClient(null);
      setFormData({
        full_name: '',
        visit_date: new Date().toISOString().split('T')[0],
        clinic: '',
        phone: '',
        notes: '',
        age: '',
        gender: 'male'
      });
    }
    setIsViewMode(viewOnly);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name || !formData.visit_date) {
      setFormError("Name and Date are required.");
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
        } else {
          setClients(prev => [response.data, ...prev]);
        }
        setShowModal(false);
      }
    } catch (err: any) {
      setFormError(err.message || "Failed to save client.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t.common.delete + "?")) return;
    try {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) throw error;
      setClients(prev => prev.filter(c => c.id !== id));
    } catch (err: any) {
      alert("Error deleting client: " + err.message);
    }
  };

  return (
    <div className="max-w-6xl mx-auto animate-fade-in space-y-6 pb-12">
      
      {/* Header Section */}
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

      {/* Search */}
      <div className="relative">
         <input 
           type="text"
           placeholder={`${t.common.search} (Name, Clinic)`}
           value={searchQuery}
           onChange={(e) => setSearchQuery(e.target.value)}
           disabled={tableError}
           className="w-full p-4 pl-12 rounded-xl border border-gray-200 shadow-sm focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-lg disabled:bg-gray-50"
           dir={isRTL ? 'rtl' : 'ltr'}
         />
         <span className={`absolute top-1/2 -translate-y-1/2 text-gray-400 text-xl ${isRTL ? 'right-4' : 'left-4'}`}>🔍</span>
      </div>

      {/* Error State */}
      {tableError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-700 animate-fade-in">
            <h3 className="text-lg font-bold mb-2">Database Configuration Error</h3>
            <p>The 'clients' table could not be found in the database schema.</p>
            <p className="text-sm mt-2">Please contact the administrator to initialize the database tables.</p>
        </div>
      )}

      {/* Loading / List */}
      {!tableError && (
          loading ? (
            <Loading />
          ) : (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
            {clients.length === 0 ? (
                <div className="p-12 text-center text-gray-400 flex flex-col items-center">
                <div className="text-5xl mb-4">📇</div>
                <p className="text-lg">{t.clients.noClients}</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 text-gray-600 uppercase text-xs font-bold">
                        <tr>
                        <th className="p-4 text-left">{t.clients.name}</th>
                        <th className="p-4 text-center">{t.clients.visitDate}</th>
                        <th className="p-4 text-center">{t.clients.clinic}</th>
                        <th className="p-4 text-center">{t.common.actions}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                    {filteredClients.map(client => (
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
                            <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-sm">
                            {new Date(client.visit_date).toLocaleDateString()}
                            </span>
                        </td>
                        <td className="p-4 text-center text-gray-600">
                            {client.clinic}
                        </td>
                        <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-2 opacity-80 group-hover:opacity-100 transition">
                                <button 
                                onClick={() => handleOpenModal(client, true)}
                                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"
                                title={t.clients.clientProfile}
                                >
                                👁️
                                </button>
                                <button 
                                onClick={() => handleOpenModal(client, false)}
                                className="p-2 text-green-600 hover:bg-green-100 rounded-lg"
                                title={t.common.edit}
                                >
                                ✏️
                                </button>
                                <button 
                                onClick={() => handleDelete(client.id)}
                                className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
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
          )
      )}

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
             <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
               <h2 className="text-2xl font-bold text-gray-800">
                 {isViewMode ? t.clients.clientProfile : (editingClient ? t.clients.editClient : t.clients.addClient)}
               </h2>
               <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
             </div>
             
             <div className="p-8 overflow-y-auto">
                {formError && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">{formError}</div>}

                {isViewMode ? (
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                           <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center text-4xl">
                              {formData.gender === 'female' ? '👩' : '👨'}
                           </div>
                           <div>
                              <h3 className="text-2xl font-bold text-gray-900">{formData.full_name}</h3>
                              <p className="text-gray-500">{formData.clinic}</p>
                           </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <div>
                                <label className="text-xs text-gray-500 uppercase font-bold">{t.clients.phone}</label>
                                <p className="font-medium">{formData.phone || '-'}</p>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase font-bold">{t.clients.visitDate}</label>
                                <p className="font-medium">{formData.visit_date}</p>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase font-bold">{t.clients.age}</label>
                                <p className="font-medium">{formData.age ? `${formData.age} years` : '-'}</p>
                            </div>
                             <div>
                                <label className="text-xs text-gray-500 uppercase font-bold">{t.clients.gender}</label>
                                <p className="font-medium capitalize">{formData.gender === 'male' ? t.kcal.male : t.kcal.female}</p>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 uppercase font-bold mb-2 block">{t.clients.notes}</label>
                            <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-xl text-gray-700 whitespace-pre-wrap min-h-[100px]">
                                {formData.notes || 'No notes recorded.'}
                            </div>
                        </div>
                    </div>
                ) : (
                    <form id="clientForm" onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div className="md:col-span-2">
                                 <label className="block text-sm font-medium text-gray-700 mb-1">{t.clients.name} *</label>
                                 <input 
                                    type="text" 
                                    required
                                    value={formData.full_name}
                                    onChange={e => setFormData({...formData, full_name: e.target.value})}
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                                 />
                             </div>
                             
                             <div>
                                 <label className="block text-sm font-medium text-gray-700 mb-1">{t.clients.visitDate} *</label>
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
                                    value={formData.clinic}
                                    onChange={e => setFormData({...formData, clinic: e.target.value})}
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                                 />
                             </div>
                        </div>
                        
                        <div>
                             <label className="block text-sm font-medium text-gray-700 mb-1">{t.clients.notes}</label>
                             <textarea 
                                rows={4}
                                value={formData.notes}
                                onChange={e => setFormData({...formData, notes: e.target.value})}
                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none resize-none"
                             ></textarea>
                        </div>
                    </form>
                )}
             </div>

             <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                <button 
                   onClick={() => setShowModal(false)}
                   className="px-6 py-2.5 rounded-lg bg-white border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition"
                >
                   {t.common.close}
                </button>
                
                {!isViewMode && (
                    <button 
                    type="submit" 
                    form="clientForm"
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-lg bg-[var(--color-primary)] text-white font-medium hover:bg-[var(--color-primary-hover)] transition disabled:opacity-50"
                    >
                    {submitting ? 'Saving...' : t.common.save}
                    </button>
                )}
                 {isViewMode && (
                     <button 
                     onClick={() => setIsViewMode(false)}
                     className="px-6 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
                     >
                     {t.common.edit}
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
