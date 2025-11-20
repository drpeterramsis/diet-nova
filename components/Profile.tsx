import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const Profile = () => {
  const { session, profile } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', content: '' });

  useEffect(() => {
    if (profile && session) {
      setFullName(profile.full_name || '');
      setEmail(session.user.email || '');
    }
  }, [profile, session]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ type: '', content: '' });

    try {
      const updates: any = {
        id: session?.user.id,
        full_name: fullName,
        // updated_at removed as it may not exist in schema
      };

      // Update Profile Data
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(updates);

      if (profileError) throw profileError;

      // Update Password if provided
      if (password) {
        if (password !== confirmPassword) {
            throw new Error("Passwords do not match");
        }
        const { error: authError } = await supabase.auth.updateUser({
          password: password
        });
        if (authError) throw authError;
      }

      setMsg({ type: 'success', content: 'Profile updated successfully!' });
      setPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      setMsg({ type: 'error', content: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
      if (!window.confirm("Are you sure you want to delete your account? This action cannot be undone and will remove all your saved data.")) return;
      
      const confirmation = window.prompt("Type 'DELETE' to confirm deletion:");
      if (confirmation !== 'DELETE') {
          if (confirmation !== null) alert("Deletion cancelled. Code did not match.");
          return;
      }

      setLoading(true);
      try {
          if (!session?.user.id) return;

          // Delete user saved meals
          const { error: mealsError } = await supabase.from('saved_meals').delete().eq('user_id', session.user.id);
          if (mealsError) throw mealsError;

          // Delete profile
          const { error: profileError } = await supabase.from('profiles').delete().eq('id', session.user.id);
          if (profileError) throw profileError;
          
          // Sign out
          await supabase.auth.signOut();
      } catch (err: any) {
          setMsg({ type: 'error', content: "Failed to delete account: " + err.message });
          setLoading(false);
      }
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 animate-fade-in">
      <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <h2 className="text-2xl font-bold text-[var(--color-heading)] mb-6 flex items-center gap-2">
           <span>👤</span> Edit Profile
        </h2>

        {msg.content && (
            <div className={`p-4 rounded-lg mb-6 ${msg.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {msg.content}
            </div>
        )}

        <form onSubmit={handleUpdate} className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email (Cannot be changed)</label>
                <input 
                    type="email" 
                    value={email} 
                    disabled 
                    className="w-full p-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-500 cursor-not-allowed"
                    dir="ltr"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input 
                    type="text" 
                    value={fullName} 
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                />
            </div>

             <div className="pt-4 border-t border-gray-100">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Change Password</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                        <input 
                            type="password" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                            placeholder="Leave blank to keep current"
                            dir="ltr"
                        />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                        <input 
                            type="password" 
                            value={confirmPassword} 
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                            placeholder="Confirm new password"
                            dir="ltr"
                        />
                    </div>
                </div>
            </div>

            <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white py-3 rounded-lg font-bold transition shadow-md flex justify-center items-center gap-2"
            >
                {loading ? 'Saving...' : 'Save Changes'}
            </button>
        </form>

        <div className="mt-10 pt-6 border-t border-red-100">
            <h3 className="text-lg font-semibold text-red-700 mb-2">Danger Zone</h3>
            <p className="text-sm text-gray-600 mb-4">Deleting your account will permanently remove your profile and all saved meals.</p>
            <button 
                onClick={handleDeleteAccount}
                className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition text-sm font-medium"
            >
                Delete Account
            </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;