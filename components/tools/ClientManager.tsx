import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Client, ClientVisit } from '../../types';
import GrowthCharts from './GrowthCharts';
import Loading from '../Loading';

interface ClientManagerProps {
    initialClientId?: string | null;
    onAnalyzeInKcal: (client: Client, visit: ClientVisit) => void;
    onPlanMeals: (client: Client, visit: ClientVisit) => void;
    onRunNFPE: (client: Client) => void;
    autoOpenNew?: boolean;
}

const ClientManager: React.FC<ClientManagerProps> = ({ initialClientId, onAnalyzeInKcal, onPlanMeals, onRunNFPE, autoOpenNew }) => {
    const { session } = useAuth();
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'list' | 'form' | 'details' | 'growth-charts'>('list');
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [formData, setFormData] = useState<Partial<Client>>({});
    const [saveSuccess, setSaveSuccess] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchClients();
    }, [session]);

    useEffect(() => {
        if (autoOpenNew) {
            handleNewClient();
        } else if (initialClientId) {
            // Find and open specific client if loaded
            const found = clients.find(c => c.id === initialClientId);
            if (found) handleViewClient(found);
        }
    }, [autoOpenNew, initialClientId, clients.length]); // Dependency on clients.length to ensure data is loaded

    const fetchClients = async () => {
        if (!session?.user.id) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .eq('doctor_id', session.user.id)
            .order('visit_date', { ascending: false });
        
        if (!error && data) setClients(data);
        setLoading(false);
    };

    const handleNewClient = () => {
        setEditingClient(null);
        setFormData({
            visit_date: new Date().toISOString().split('T')[0],
            gender: 'male',
            age: 30
        });
        setViewMode('form');
    };

    const handleViewClient = (client: Client) => {
        setEditingClient(client);
        setFormData(client);
        setViewMode('details');
    };

    const handleSaveClient = async () => {
        if (!session?.user.id) return;
        if (!formData.full_name) {
            alert('Name is required');
            return;
        }

        const payload = {
            ...formData,
            doctor_id: session.user.id
        };

        try {
            let data;
            if (editingClient) {
                const { data: updated, error } = await supabase
                    .from('clients')
                    .update(payload)
                    .eq('id', editingClient.id)
                    .select()
                    .single();
                if (error) throw error;
                data = updated;
                setEditingClient(data); // Update current editing state
            } else {
                const { data: inserted, error } = await supabase
                    .from('clients')
                    .insert(payload)
                    .select()
                    .single();
                if (error) throw error;
                data = inserted;
                setEditingClient(data); // Switch to editing mode for new client
            }
            
            // Refresh list
            fetchClients();
            setViewMode('details');
            setSaveSuccess('Client saved successfully!');
            setTimeout(() => setSaveSuccess(''), 3000);
        } catch (error: any) {
            console.error(error);
            alert('Error saving client: ' + error.message);
        }
    };

    const handleSaveMAMC = (note: string) => {
        if (!editingClient) return;
        const updatedNotes = formData.notes ? formData.notes + "\n\n" + note : note;
        setFormData(prev => ({ ...prev, notes: updatedNotes }));
        // In a real app, you might want to auto-save to DB here, but updating local state is fine for now until 'Save Changes' is clicked
        setSaveSuccess("MAMC analysis added to notes (Click Save to persist).");
        setTimeout(() => setSaveSuccess(''), 3000);
    };
  
    const handleSaveGrowthChart = (note: string) => {
        if (!editingClient) return;
        const updatedNotes = formData.notes ? formData.notes + "\n\n" + note : note;
        setFormData(prev => ({ ...prev, notes: updatedNotes }));
        setSaveSuccess("Growth analysis added to notes (Click Save to persist).");
        setTimeout(() => setSaveSuccess(''), 3000);
    };

    const handleDeleteClient = async (id: string) => {
        if (!window.confirm("Are you sure? This will delete the client and all associated data.")) return;
        await supabase.from('clients').delete().eq('id', id);
        fetchClients();
        if (editingClient?.id === id) {
            setViewMode('list');
            setEditingClient(null);
        }
    };

    // --- Render Helpers ---
    
    if (loading) return <Loading text="Loading clients..." />;

    if (viewMode === 'list') {
        const filtered = clients.filter(c => c.full_name.toLowerCase().includes(searchTerm.toLowerCase()));
        return (
            <div className="space-y-4">
                <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800">My Clients</h2>
                    <button onClick={handleNewClient} className="bg-green-600 text-white px-4 py-2 rounded-lg shadow font-bold text-sm hover:bg-green-700 transition">
                        + New Client
                    </button>
                </div>
                
                <div className="relative">
                    <input 
                        type="text" 
                        placeholder="Search clients..." 
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full p-3 pl-10 border rounded-lg"
                    />
                    <span className="absolute left-3 top-3 text-gray-400">🔍</span>
                </div>

                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {filtered.map(client => (
                        <div key={client.id} onClick={() => handleViewClient(client)} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 cursor-pointer hover:border-green-300 transition group">
                            <h3 className="font-bold text-lg group-hover:text-green-600">{client.full_name}</h3>
                            <div className="text-sm text-gray-500 mt-2 space-y-1">
                                <div>📅 {new Date(client.visit_date).toLocaleDateString()}</div>
                                {client.clinic && <div>📍 {client.clinic}</div>}
                                {client.phone && <div>📞 {client.phone}</div>}
                            </div>
                        </div>
                    ))}
                    {filtered.length === 0 && <div className="text-center py-10 text-gray-400 col-span-full">No clients found.</div>}
                </div>
            </div>
        );
    }

    if (viewMode === 'growth-charts') {
        return (
            <div className="animate-fade-in">
                <button onClick={() => setViewMode('details')} className="mb-4 text-sm text-gray-500 hover:text-gray-800">← Back to Details</button>
                <GrowthCharts
                    initialData={{
                        name: editingClient?.full_name,
                        gender: formData.gender as 'male'|'female' || 'male',
                        age: formData.age || 0,
                        dob: formData.dob,
                        visitDate: formData.visit_date,
                        weight: formData.weight,
                        height: formData.height,
                        head_circumference: formData.head_circumference
                    }}
                    onSave={handleSaveGrowthChart}
                    onClose={() => setViewMode('details')}
                />
            </div>
        );
    }

    // Form or Details View
    const isDetails = viewMode === 'details';
    
    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden animate-fade-in">
            <div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <button onClick={() => setViewMode('list')} className="text-gray-500 hover:text-gray-800 font-bold">
                        ← List
                    </button>
                    <h2 className="text-xl font-bold text-gray-800">
                        {isDetails ? formData.full_name : (editingClient ? 'Edit Client' : 'New Client')}
                    </h2>
                </div>
                {isDetails ? (
                    <div className="flex gap-2">
                        <button onClick={() => setViewMode('form')} className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm font-bold">Edit</button>
                        <button onClick={() => onAnalyzeInKcal(editingClient!, { id: 'dummy', client_id: editingClient!.id, visit_date: formData.visit_date!, weight: formData.weight, height: formData.height })} className="px-3 py-1 bg-orange-100 text-orange-700 rounded text-sm font-bold">⚡ Analyze Kcal</button>
                        <button onClick={() => onPlanMeals(editingClient!, { id: 'dummy', client_id: editingClient!.id, visit_date: formData.visit_date! })} className="px-3 py-1 bg-purple-100 text-purple-700 rounded text-sm font-bold">📅 Plan Meals</button>
                        <button onClick={() => onRunNFPE(editingClient!)} className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm font-bold">🩺 NFPE</button>
                    </div>
                ) : (
                    <button onClick={handleSaveClient} className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold shadow hover:bg-green-700">Save</button>
                )}
            </div>

            {saveSuccess && <div className="bg-green-100 text-green-800 p-3 text-center text-sm font-bold">{saveSuccess}</div>}

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
                        <input 
                            type="text" className="w-full p-2 border rounded disabled:bg-gray-100" 
                            value={formData.full_name || ''} 
                            onChange={e => setFormData({...formData, full_name: e.target.value})}
                            disabled={isDetails}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Gender</label>
                            <select 
                                className="w-full p-2 border rounded disabled:bg-gray-100"
                                value={formData.gender || 'male'}
                                onChange={e => setFormData({...formData, gender: e.target.value as any})}
                                disabled={isDetails}
                            >
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Age</label>
                            <input 
                                type="number" className="w-full p-2 border rounded disabled:bg-gray-100" 
                                value={formData.age || ''} 
                                onChange={e => setFormData({...formData, age: Number(e.target.value)})}
                                disabled={isDetails}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Date of Birth</label>
                            <input 
                                type="date" className="w-full p-2 border rounded disabled:bg-gray-100" 
                                value={formData.dob || ''} 
                                onChange={e => setFormData({...formData, dob: e.target.value})}
                                disabled={isDetails}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Visit Date</label>
                            <input 
                                type="date" className="w-full p-2 border rounded disabled:bg-gray-100" 
                                value={formData.visit_date || ''} 
                                onChange={e => setFormData({...formData, visit_date: e.target.value})}
                                disabled={isDetails}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Clinic / Location</label>
                        <input 
                            type="text" className="w-full p-2 border rounded disabled:bg-gray-100" 
                            value={formData.clinic || ''} 
                            onChange={e => setFormData({...formData, clinic: e.target.value})}
                            disabled={isDetails}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Phone</label>
                        <input 
                            type="text" className="w-full p-2 border rounded disabled:bg-gray-100" 
                            value={formData.phone || ''} 
                            onChange={e => setFormData({...formData, phone: e.target.value})}
                            disabled={isDetails}
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Weight (kg)</label>
                            <input 
                                type="number" className="w-full p-2 border rounded disabled:bg-gray-100 font-mono" 
                                value={formData.weight || ''} 
                                onChange={e => setFormData({...formData, weight: Number(e.target.value)})}
                                disabled={isDetails}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Height (cm)</label>
                            <input 
                                type="number" className="w-full p-2 border rounded disabled:bg-gray-100 font-mono" 
                                value={formData.height || ''} 
                                onChange={e => setFormData({...formData, height: Number(e.target.value)})}
                                disabled={isDetails}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Waist (cm)</label>
                            <input 
                                type="number" className="w-full p-2 border rounded disabled:bg-gray-100 font-mono" 
                                value={formData.waist || ''} 
                                onChange={e => setFormData({...formData, waist: Number(e.target.value)})}
                                disabled={isDetails}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Head Circ. (cm)</label>
                            <input 
                                type="number" className="w-full p-2 border rounded disabled:bg-gray-100 font-mono" 
                                value={formData.head_circumference || ''} 
                                onChange={e => setFormData({...formData, head_circumference: Number(e.target.value)})}
                                disabled={isDetails}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Clinical Notes</label>
                        <textarea 
                            className="w-full p-2 border rounded disabled:bg-gray-100 h-32 text-sm"
                            value={formData.notes || ''} 
                            onChange={e => setFormData({...formData, notes: e.target.value})}
                            disabled={isDetails}
                        ></textarea>
                    </div>

                    {isDetails && (
                        <div className="pt-4 border-t border-gray-100">
                            <h4 className="font-bold text-gray-600 mb-2">Quick Actions</h4>
                            <button onClick={() => setViewMode('growth-charts')} className="w-full py-2 bg-blue-50 text-blue-700 rounded mb-2 hover:bg-blue-100 text-sm font-bold">
                                Open Growth Charts
                            </button>
                            <button onClick={() => handleDeleteClient(editingClient!.id)} className="w-full py-2 bg-red-50 text-red-600 rounded hover:bg-red-100 text-sm">
                                Delete Client
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ClientManager;